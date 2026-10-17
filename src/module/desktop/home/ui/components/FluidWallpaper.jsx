"use client";

// ============================================================================
// FLUID WALLPAPER — live "paper print" wallpaper.
// A compact GPU stable-fluids solver (Jos Stam) in the spirit of Pavel
// Dobryakov's WebGL fluid simulation: the user's halftone paper-print image
// is advected by the velocity field, so moving the cursor smears the print
// like liquid, and fresh print keeps flowing back in under the strokes.
// Displayed through a procedural halftone shader (crisp dot grid at any
// resolution). Falls back to the static image (body background) without
// WebGL2. Idle "breathing": a gentle ambient splat every few seconds.
// ============================================================================

import { useEffect, useRef } from "react";

const SIM_RESOLUTION = 96;
const DYE_RESOLUTION = 768;
const PRESSURE_ITERATIONS = 18;
const VELOCITY_DISSIPATION = 0.28;
const DENSITY_DISSIPATION = 0; // dye is persistent — recovery blend restores the print
const PRINT_RECOVERY = 0.12; // how fast disturbed print relaxes back (per second)
const SPLAT_FORCE = 4800;
const SPLAT_RADIUS = 0.19;
const AMBIENT_INTERVAL = 3200; // ms between ambient splats

const VERT = `#version 300 es
precision highp float;
in vec2 aPos;
out vec2 vUv;
void main () {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const ADVECTION = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float decay;
void main () {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  frag = decay * texture(uSource, coord);
}`;

const DIVERGENCE = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uVelocity;
uniform vec2 texelSize;
void main () {
  float L = texture(uVelocity, vUv - vec2(texelSize.x, 0.0)).x;
  float R = texture(uVelocity, vUv + vec2(texelSize.x, 0.0)).x;
  float T = texture(uVelocity, vUv + vec2(0.0, texelSize.y)).y;
  float B = texture(uVelocity, vUv - vec2(0.0, texelSize.y)).y;
  frag = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const CURL = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uVelocity;
uniform vec2 texelSize;
void main () {
  float L = texture(uVelocity, vUv - vec2(texelSize.x, 0.0)).y;
  float R = texture(uVelocity, vUv + vec2(texelSize.x, 0.0)).y;
  float T = texture(uVelocity, vUv + vec2(0.0, texelSize.y)).x;
  float B = texture(uVelocity, vUv - vec2(0.0, texelSize.y)).x;
  frag = vec4(R - L - T + B, 0.0, 0.0, 1.0);
}`;

const VORTICITY = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 texelSize;
uniform float curl;
uniform float dt;
void main () {
  float L = texture(uCurl, vUv - vec2(texelSize.x, 0.0)).x;
  float R = texture(uCurl, vUv + vec2(texelSize.x, 0.0)).x;
  float T = texture(uCurl, vUv + vec2(0.0, texelSize.y)).x;
  float B = texture(uCurl, vUv - vec2(0.0, texelSize.y)).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity += force * dt;
  velocity = clamp(velocity, vec2(-1000.0), vec2(1000.0));
  frag = vec4(velocity, 0.0, 1.0);
}`;

const PRESSURE = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 texelSize;
void main () {
  float L = texture(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
  float R = texture(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
  float T = texture(uPressure, vUv + vec2(0.0, texelSize.y)).x;
  float B = texture(uPressure, vUv - vec2(0.0, texelSize.y)).x;
  float divergence = texture(uDivergence, vUv).x;
  frag = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
}`;

const GRADIENT_SUBTRACT = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 texelSize;
void main () {
  float L = texture(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
  float R = texture(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
  float T = texture(uPressure, vUv + vec2(0.0, texelSize.y)).x;
  float B = texture(uPressure, vUv - vec2(0.0, texelSize.y)).x;
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity -= vec2(R - L, T - B);
  frag = vec4(velocity, 0.0, 1.0);
}`;

// Velocity splat: adds a gaussian impulse around the pointer.
const SPLAT_VELOCITY = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec2 point;
uniform vec3 velocity;
uniform float radius;
void main () {
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * velocity;
  vec3 base = texture(uTarget, vUv).xyz;
  frag = vec4(base + splat, 1.0);
}`;

// Dye advection — same as ADVECTION but blends the advected print back
// toward the pristine image, so fluid strokes slowly settle again.
const ADVECT_DYE = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform sampler2D uImage;
uniform vec2 texelSize;
uniform vec2 uCanvas;
uniform vec2 uImageSize;
uniform float dt;
uniform float recover;
void main () {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  float advected = texture(uSource, coord).x;
  float ca = uCanvas.x / uCanvas.y;
  float ia = uImageSize.x / uImageSize.y;
  vec2 offs = vUv - 0.5;
  if (ca > ia) {
    offs.y *= ia / ca;
  } else {
    offs.x *= ca / ia;
  }
  float fresh = texture(uImage, clamp(offs + 0.5, 0.0, 1.0)).x;
  frag = vec4(mix(advected, fresh, recover), 0.0, 0.0, 1.0);
}`;

// Dye splat: pulls fresh paper-print luminance into the flow around the
// pointer, so the fluid always has "ink" to smear instead of fading to gray.
const SPLAT_DYE = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uTarget;
uniform sampler2D uImage;
uniform float aspectRatio;
uniform vec2 point;
uniform float radius;
uniform float strength;
void main () {
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  float g = exp(-dot(p, p) / radius) * strength;
  float base = texture(uTarget, vUv).x;
  float fresh = texture(uImage, vUv).x;
  frag = vec4(mix(base, fresh, clamp(g, 0.0, 1.0)), 0.0, 0.0, 1.0);
}`;

// Seed: copies the paper-print image luminance into the dye field
// (background-size: cover fit), so the full print is visible at boot.
const SEED = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uImage;
uniform vec2 uCanvas;
uniform vec2 uImageSize;
void main () {
  float ca = uCanvas.x / uCanvas.y;
  float ia = uImageSize.x / uImageSize.y;
  vec2 offs = vUv - 0.5;
  if (ca > ia) {
    offs.y *= ia / ca;
  } else {
    offs.x *= ca / ia;
  }
  float lum = texture(uImage, clamp(offs + 0.5, 0.0, 1.0)).x;
  frag = vec4(lum, 0.0, 0.0, 1.0);
}`;

// Display: procedural halftone — crisp dot grid whose dot size follows the
// advected print luminance. Dark paper, warm-white ink, faint grain.
const DISPLAY = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uDye;
uniform vec2 uResolution;
void main () {
  float lum = clamp(texture(uDye, vUv).x, 0.0, 1.0);
  lum = smoothstep(0.08, 0.72, lum); // restore print contrast after advection
  vec2 px = vUv * uResolution;
  float spacing = 7.0;
  vec2 center = (floor(px / spacing) + 0.5) * spacing;
  float dist = length(px - center);
  float r = 0.5 * spacing * pow(lum, 0.62);
  float dotMask = 1.0 - smoothstep(r - 0.9, r, dist);
  vec3 paper = vec3(0.055, 0.055, 0.066);
  vec3 ink = vec3(0.93, 0.925, 0.9);
  vec3 col = mix(paper, ink, dotMask);
  float grain = fract(sin(dot(px, vec2(12.9898, 78.233))) * 43758.5453);
  col += (grain - 0.5) * 0.014;
  frag = vec4(col, 1.0);
}`;

const compileShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "shader compile failed");
  }
  return shader;
};

const createProgram = (gl, fragSource) => {
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "program link failed");
  }
  return program;
};

const FluidWallpaper = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let gl = null;
    try {
      gl = canvas.getContext("webgl2", {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: false,
        powerPreference: "low-power",
      });
    } catch {
      gl = null;
    }
    if (!gl) return undefined; // static body background shows instead

    let extColorBuffer = null;
    try {
      extColorBuffer = gl.getExtension("EXT_color_buffer_float");
    } catch {
      extColorBuffer = null;
    }
    if (!extColorBuffer) return undefined;

    let rafId = 0;
    let disposed = false;
    let lastWidth = 0;
    let lastHeight = 0;
    let lastPointer = null;
    let pointerMoved = false;
    let pointerDelta = { x: 0, y: 0 };
    let ambientAt = performance.now() + 1400;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resizeCanvas = () => {
      const width = Math.max(2, Math.floor(window.innerWidth * dpr));
      const height = Math.max(2, Math.floor(window.innerHeight * dpr));
      if (width === lastWidth && height === lastHeight) return false;
      lastWidth = width;
      lastHeight = height;
      canvas.width = width;
      canvas.height = height;
      return true;
    };
    resizeCanvas();

    // ---- double FBO helper -------------------------------------------------
    const createFBO = (w, h, internalFormat, format, type, filter) => {
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return {
        texture,
        fbo,
        width: w,
        height: h,
        texelSizeX: 1 / w,
        texelSizeY: 1 / h,
        attach(id) {
          gl.activeTexture(gl.TEXTURE0 + id);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          return id;
        },
      };
    };

    const createDoubleFBO = (w, h, internalFormat, format, type, filter) => {
      let fbo1 = createFBO(w, h, internalFormat, format, type, filter);
      let fbo2 = createFBO(w, h, internalFormat, format, type, filter);
      return {
        width: w,
        height: h,
        texelSizeX: fbo1.texelSizeX,
        texelSizeY: fbo1.texelSizeY,
        get read() {
          return fbo1;
        },
        set read(value) {
          fbo1 = value;
        },
        get write() {
          return fbo2;
        },
        set write(value) {
          fbo2 = value;
        },
        swap() {
          const temp = fbo1;
          fbo1 = fbo2;
          fbo2 = temp;
        },
      };
    };

    const getResolution = (resolution) => {
      const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
      const min = Math.round(resolution);
      const max = Math.round(resolution * Math.max(aspect, 1 / aspect));
      return gl.drawingBufferWidth > gl.drawingBufferHeight
        ? { width: max, height: min }
        : { width: min, height: max };
    };

    // ---- programs ----------------------------------------------------------
    const blit = (() => {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
      const elems = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elems);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);
      return (target, clear = false) => {
        if (!target) {
          gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        } else {
          gl.viewport(0, 0, target.width, target.height);
          gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        }
        if (clear) {
          gl.clearColor(0, 0, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      };
    })();

    const programs = {};
    const uniforms = {};
    const buildProgram = (name, source) => {
      const program = createProgram(gl, source);
      programs[name] = program;
      uniforms[name] = {};
      const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < count; i += 1) {
        const info = gl.getActiveUniform(program, i);
        uniforms[name][info.name] = gl.getUniformLocation(program, info.name);
      }
    };

    try {
      [
        ["advection", ADVECTION],
        ["divergence", DIVERGENCE],
        ["curl", CURL],
        ["vorticity", VORTICITY],
        ["pressure", PRESSURE],
        ["gradient", GRADIENT_SUBTRACT],
        ["splatVelocity", SPLAT_VELOCITY],
        ["splatDye", SPLAT_DYE],
        ["advectDye", ADVECT_DYE],
        ["seed", SEED],
        ["display", DISPLAY],
      ].forEach(([name, src]) => buildProgram(name, src));
    } catch (err) {
      console.warn("FluidWallpaper: shader build failed", err);
      return undefined;
    }

    const bindProgram = (name) => {
      gl.useProgram(programs[name]);
      return uniforms[name];
    };

    // ---- texture state -----------------------------------------------------
    let velocity = null;
    let dye = null;
    let pressure = null;
    let divergenceFBO = null;
    let curlFBO = null;
    let imageTexture = null;

    const initFramebuffers = () => {
      const sim = getResolution(SIM_RESOLUTION);
      const dyeRes2 = getResolution(DYE_RESOLUTION);
      const rgba16f = gl.RGBA16F;
      const rg16f = gl.RG16F;
      const halfFloat = gl.HALF_FLOAT;
      const linear = gl.LINEAR;

      velocity = createDoubleFBO(sim.width, sim.height, rg16f, gl.RG, halfFloat, linear);
      dye = createDoubleFBO(dyeRes2.width, dyeRes2.height, rgba16f, gl.RGBA, halfFloat, linear);
      pressure = createDoubleFBO(sim.width, sim.height, rg16f, gl.RG, halfFloat, linear);
      divergenceFBO = createFBO(sim.width, sim.height, rg16f, gl.RG, halfFloat, gl.NEAREST);
      curlFBO = createFBO(sim.width, sim.height, rg16f, gl.RG, halfFloat, gl.NEAREST);
    };
    initFramebuffers();

    // ---- source image ------------------------------------------------------
    const loadAndSeedImage = () => {
      const img = new Image();
      img.onload = () => {
        if (disposed) return;
        if (imageTexture) {
          gl.deleteTexture(imageTexture.texture);
          imageTexture = null;
        }
        const tex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        imageTexture = { texture: tex, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height, attach(id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, tex); return id; } };

        // Seed BOTH dye buffers with the full print (cover fit).
        const u = bindProgram("seed");
        gl.uniform1i(u.uImage, imageTexture.attach(0));
        gl.uniform2f(u.uCanvas, canvas.width, canvas.height);
        gl.uniform2f(u.uImageSize, imageTexture.width, imageTexture.height);
        blit(dye.write);
        dye.swap();
        blit(dye.write);
        dye.swap();

        // debug hook
        globalThis.__fluidSample = (uu, vv) => {
          const px = new Float32Array(4);
          gl.bindFramebuffer(gl.FRAMEBUFFER, dye.read.fbo);
          gl.readPixels(Math.floor(uu * dye.width), Math.floor(vv * dye.height), 1, 1, gl.RGBA, gl.FLOAT, px);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          return Array.from(px).map((x) => Math.round(x * 1000) / 1000);
        };
        globalThis.__fluidSeeded = true;
      };
      img.src = "/wallpapers/paper-print.jpg";
    };

    const splatVelocity = (x, y, dx, dy) => {
      const u = uniforms.splatVelocity;
      bindProgram("splatVelocity");
      gl.uniform1i(u.uTarget, velocity.read.attach(0));
      gl.uniform1f(u.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(u.point, x, y);
      gl.uniform3f(u.velocity, dx, dy, 0);
      gl.uniform1f(u.radius, SPLAT_RADIUS / 100);
      blit(velocity.write);
      velocity.swap();
    };

    const splatDye = (x, y, radiusScale = 1, strength = 0.8) => {
      if (!imageTexture) return;
      const u = uniforms.splatDye;
      bindProgram("splatDye");
      gl.uniform1i(u.uTarget, dye.read.attach(0));
      gl.uniform1i(u.uImage, imageTexture.attach(1));
      gl.uniform1f(u.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(u.point, x, y);
      gl.uniform1f(u.radius, (SPLAT_RADIUS * radiusScale) / 100);
      gl.uniform1f(u.strength, strength);
      blit(dye.write);
      dye.swap();
    };

    loadAndSeedImage();

    const step = (dt) => {
      // curl
      let u = bindProgram("curl");
      gl.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(u.uVelocity, velocity.read.attach(0));
      blit(curlFBO);

      // vorticity
      u = bindProgram("vorticity");
      gl.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(u.uVelocity, velocity.read.attach(0));
      gl.uniform1i(u.uCurl, curlFBO.attach(1));
      gl.uniform1f(u.curl, 24);
      gl.uniform1f(u.dt, dt);
      blit(velocity.write);
      velocity.swap();

      // divergence
      u = bindProgram("divergence");
      gl.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(u.uVelocity, velocity.read.attach(0));
      blit(divergenceFBO);

      // pressure decay + jacobi iterations
      u = bindProgram("pressure");
      gl.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(u.uDivergence, divergenceFBO.attach(0));
      gl.uniform1i(u.uPressure, pressure.read.attach(1));
      blit(pressure.write);
      pressure.swap();
      for (let i = 0; i < PRESSURE_ITERATIONS; i += 1) {
        gl.uniform1i(u.uDivergence, divergenceFBO.attach(0));
        gl.uniform1i(u.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }

      // gradient subtract
      u = bindProgram("gradient");
      gl.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(u.uPressure, pressure.read.attach(0));
      gl.uniform1i(u.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      // advect velocity
      u = bindProgram("advection");
      gl.uniform2f(u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(u.uVelocity, velocity.read.attach(0));
      gl.uniform1i(u.uSource, velocity.read.attach(0));
      gl.uniform1f(u.dt, dt);
      gl.uniform1f(u.decay, 1 / (1 + dt * VELOCITY_DISSIPATION));
      blit(velocity.write);
      velocity.swap();

      // advect dye (persistent print + slow recovery to pristine image)
      if (imageTexture) {
        u = bindProgram("advectDye");
        gl.uniform2f(u.texelSize, dye.texelSizeX, dye.texelSizeY);
        gl.uniform1i(u.uVelocity, velocity.read.attach(0));
        gl.uniform1i(u.uSource, dye.read.attach(1));
        gl.uniform1i(u.uImage, imageTexture.attach(2));
        gl.uniform2f(u.uCanvas, canvas.width, canvas.height);
        gl.uniform2f(u.uImageSize, imageTexture.width, imageTexture.height);
        gl.uniform1f(u.dt, dt);
        gl.uniform1f(u.recover, 1 - Math.exp(-dt * PRINT_RECOVERY));
        blit(dye.write);
        dye.swap();
      }
    };

    const renderFrame = () => {
      const u = bindProgram("display");
      gl.uniform1i(u.uDye, dye.read.attach(0));
      gl.uniform2f(u.uResolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
      blit(null);
    };

    let lastTime = performance.now();

    const frame = (now) => {
      if (disposed) return;
      rafId = requestAnimationFrame(frame);

      const dt = Math.min((now - lastTime) / 1000, 0.0166);
      lastTime = now;

      if (resizeCanvas()) {
        initFramebuffers();
        loadAndSeedImage();
      }

      if (pointerMoved && lastPointer) {
        const forceScale = SPLAT_FORCE;
        splatVelocity(
          lastPointer.x,
          lastPointer.y,
          pointerDelta.x * forceScale,
          pointerDelta.y * forceScale,
        );
        splatDye(lastPointer.x, lastPointer.y, 1, 0.55);
        pointerMoved = false;
        pointerDelta = { x: 0, y: 0 };
      }

      // Ambient breathing so the wallpaper stays alive without the cursor.
      if (now > ambientAt) {
        ambientAt = now + AMBIENT_INTERVAL * (0.7 + Math.random() * 0.9);
        const x = Math.random();
        const y = Math.random();
        const angle = Math.random() * Math.PI * 2;
        const mag = 220 + Math.random() * 620;
        splatVelocity(x, y, Math.cos(angle) * mag, Math.sin(angle) * mag);
        splatDye(x, y, 1.4, 0.4);
      }

      step(dt);
      renderFrame();
    };
    rafId = requestAnimationFrame(frame);

    // ---- pointer -----------------------------------------------------------
    const handlePointerMove = (event) => {
      if (event.pointerType === "touch") return;
      const x = event.clientX / window.innerWidth;
      const y = 1 - event.clientY / window.innerHeight;
      if (!lastPointer) {
        lastPointer = { x, y };
        return;
      }
      const dx = x - lastPointer.x;
      const dy = y - lastPointer.y;
      if (Math.abs(dx) < 0.00002 && Math.abs(dy) < 0.00002) return;
      pointerDelta = { x: dx, y: dy };
      pointerMoved = true;
      lastPointer = { x, y };
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("resize", resizeCanvas);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", resizeCanvas);
      // NOTE: intentionally NOT calling WEBGL_lose_context here — React dev
      // StrictMode double-mounts effects on the SAME canvas element, and
      // getContext('webgl2') would hand back the lost context on remount.
      // The canvas node is removed from the DOM on real unmount, so the
      // context is garbage-collected naturally.
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fluid-wallpaper"
      style={{
        position: "fixed",
        inset: 0,
        width: "100dvw",
        height: "100dvh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
};

export default FluidWallpaper;
