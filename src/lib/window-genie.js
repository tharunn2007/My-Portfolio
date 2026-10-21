import { snapshotWindow } from "./window-texture.js";
import { createGenieGrid, genieEase } from "./genie-mesh.js";

// The GPU deforms the static UV grid. Only u_progress changes during a frame.
const vertexSource = `
attribute vec2 a_uv;
uniform vec2 u_viewport;
uniform vec4 u_rect;
uniform vec4 u_target;
uniform float u_progress;
varying vec2 v_uv;
float cubic(float a, float b, float c, float d, float t) {
  float s = 1.0 - t;
  return s*s*s*a + 3.0*s*s*t*b + 3.0*s*t*t*c + t*t*t*d;
}
void main() {
  float delay = 0.24 * (1.0 - a_uv.y);
  float t = clamp((u_progress - delay) / (1.0 - delay), 0.0, 1.0);
  float q = t*t*(3.0 - 2.0*t);
  float center = u_rect.x + u_rect.z * 0.5;
  float bend = max(60.0, abs(u_target.y - u_rect.y) * 0.38);
  float startY = u_rect.y + a_uv.y * u_rect.w;
  float endY = u_target.y + (a_uv.y - 0.5) * u_target.w;
  float cx = cubic(center, center, u_target.x, u_target.x, q);
  float cy = cubic(startY, startY + bend, endY - bend * 0.35, endY, q);
  float width = mix(u_rect.z, u_target.z, q);
  vec2 position = vec2(cx + (a_uv.x - 0.5) * width, cy);
  vec2 clip = position / u_viewport * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  v_uv = a_uv;
}`;
const fragmentSource = `
precision highp float;
uniform sampler2D u_texture;
uniform float u_progress;
varying vec2 v_uv;
void main() {
  float alpha = 1.0 - smoothstep(0.94, 1.0, u_progress);
  gl_FragColor = texture2D(u_texture, v_uv) * alpha;
}`;

let sharedRenderer;
let warmScheduled = false;

function createRenderer() {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh",
    pointerEvents: "none", zIndex: "100001", display: "none", background: "transparent" });
  const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true });
  if (!gl) throw new Error("WebGL unavailable");
  const resources = [];
  const jobs = new Set();
  const textures = new Map();
  let frame = 0;
  let width = 0;
  let height = 0;
  let dpr = 0;
  const destroy = () => {
    cancelAnimationFrame(frame);
    canvas.remove();
    for (const job of jobs) {
      job.finish();
    }
    jobs.clear();
    for (const entry of textures.values()) gl.deleteTexture(entry.texture);
    textures.clear();
    resources.reverse().forEach((dispose) => dispose());
    if (sharedRenderer?.canvas === canvas) sharedRenderer = null;
  };
  try {
    const shader = (type, source) => {
      const value = gl.createShader(type);
      resources.push(() => gl.deleteShader(value));
      gl.shaderSource(value, source);
      gl.compileShader(value);
      if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(value));
      return value;
    };
    const program = gl.createProgram();
    resources.push(() => gl.deleteProgram(program));
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    // Each row is linear horizontally: extra columns only repeat identical work.
    const grid = createGenieGrid(1, 96);
    const buffer = (type, data) => {
      const value = gl.createBuffer();
      resources.push(() => gl.deleteBuffer(value));
      gl.bindBuffer(type, value);
      gl.bufferData(type, data, gl.STATIC_DRAW);
    };
    buffer(gl.ARRAY_BUFFER, grid.uv);
    const attribute = gl.getAttribLocation(program, "a_uv");
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
    buffer(gl.ELEMENT_ARRAY_BUFFER, grid.indices);
    const progress = gl.getUniformLocation(program, "u_progress");
    const viewport = gl.getUniformLocation(program, "u_viewport");
    const rectLocation = gl.getUniformLocation(program, "u_rect");
    const targetLocation = gl.getUniformLocation(program, "u_target");
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const resize = () => {
      const nextWidth = window.innerWidth;
      const nextHeight = window.innerHeight;
      const nextDpr = Math.min(window.devicePixelRatio || 1, 1.5);
      if (width === nextWidth && height === nextHeight && dpr === nextDpr) return;
      width = nextWidth;
      height = nextHeight;
      dpr = nextDpr;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(viewport, width, height);
    };
    const idle = () => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      canvas.style.display = "none";
      canvas.removeAttribute("data-genie-overlay");
    };
    const trimTextures = () => {
      let pixels = 0;
      for (const entry of textures.values()) pixels += entry.pixels;
      for (const [source, entry] of textures) {
        if (textures.size <= 4 && pixels <= 4000000) break;
        if (entry.users) continue;
        gl.deleteTexture(entry.texture);
        textures.delete(source);
        pixels -= entry.pixels;
      }
    };
    // No DOM/style reads, DOM writes, allocations, or vertex uploads in steady-state frames.
    const tick = (timestamp) => {
      frame = 0;
      gl.clear(gl.COLOR_BUFFER_BIT);
      for (const job of jobs) {
        job.start ??= timestamp;
        const elapsed = Math.min(1, (timestamp - job.start) / job.duration);
        const p = job.opening ? 1 - genieEase(elapsed) : genieEase(elapsed);
        gl.bindTexture(gl.TEXTURE_2D, job.texture);
        gl.uniform4fv(rectLocation, job.rect);
        gl.uniform4fv(targetLocation, job.target);
        gl.uniform1f(progress, p);
        gl.drawElements(gl.TRIANGLES, grid.indices.length, gl.UNSIGNED_SHORT, 0);
        if (elapsed === 1) {
          jobs.delete(job);
          job.entry.users--;
          job.finish();
        }
      }
      if (jobs.size) frame = requestAnimationFrame(tick);
      else { idle(); trimTextures(); }
    };
    resize();
    // Force driver/shader initialization during idle, not the first click.
    const warmTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, warmTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.uniform4f(rectLocation, 0, 0, 1, 1);
    gl.uniform1f(progress, 0);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    gl.flush();
    gl.deleteTexture(warmTexture);
    gl.clear(gl.COLOR_BUFFER_BIT);
    document.body.append(canvas);
    canvas.addEventListener("webglcontextlost", (event) => { event.preventDefault(); destroy(); }, { once: true });
    return {
      canvas,
      add(textureSource, options) {
        resize(); // Viewport reads happen once, before scheduling the frame loop.
        let entry = textures.get(textureSource);
        if (entry) {
          textures.delete(textureSource);
          textures.set(textureSource, entry);
        }
        const texture = entry?.texture ?? gl.createTexture();
        try {
          if (!entry) {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureSource);
            entry = { texture, pixels: textureSource.width * textureSource.height, users: 0 };
            textures.set(textureSource, entry);
          }
          entry.users++;
          trimTextures();
          const job = { ...options, texture, entry, start: null };
          jobs.add(job);
          canvas.dataset.genieOverlay = "true";
          canvas.style.display = "block";
          if (!frame) frame = requestAnimationFrame(tick);
          return () => {
            if (!jobs.delete(job)) return;
            entry.users--;
            if (!jobs.size) { cancelAnimationFrame(frame); frame = 0; idle(); }
          };
        } catch (error) {
          if (!entry) gl.deleteTexture(texture);
          throw error;
        }
      },
    };
  } catch (error) {
    destroy();
    throw error;
  }
}

const getRenderer = () => sharedRenderer ??= createRenderer();
export function warmGenieRenderer() {
  if (warmScheduled || sharedRenderer) return;
  warmScheduled = true;
  const warm = () => {
    warmScheduled = false;
    try { getRenderer(); } catch { /* Unsupported GPUs use the compositor fallback. */ }
  };
  if (window.requestIdleCallback) window.requestIdleCallback(warm, { timeout: 1000 });
  else setTimeout(warm, 0);
}

export function animateWindowGenie(element, { opening, rect, target, onComplete, duration = 620 }) {
  let cancelled = false;
  let removeJob;
  let fallback;
  const abort = new AbortController();
  const originalOpacity = element.style.opacity;
  // Geometry is flattened and immutable before any asynchronous work starts.
  const geometry = new Float32Array([rect.left, rect.top, rect.width, rect.height]);
  const destination = new Float32Array([target.x, target.y, target.width, target.height]);
  const finish = () => {
    if (cancelled) return;
    clearTimeout(timeout);
    onComplete(); // Hide closed windows before restoring opacity, in the same task.
    element.style.opacity = originalOpacity;
  };
  const useFallback = () => {
    if (cancelled || fallback) return;
    abort.abort();
    clearTimeout(timeout);
    element.style.opacity = originalOpacity;
    fallback = element.animate([{ opacity: opening ? 0 : 1 }, { opacity: opening ? 1 : 0 }],
      { duration: 160, easing: "cubic-bezier(0.25, 1, 0.50, 1)" });
    fallback.onfinish = finish;
  };
  // Opening never paints the live HTML before its texture is ready. Closing
  // retains its existing pixels until the single texture takes over atomically.
  if (opening) element.style.opacity = "0";
  const timeout = setTimeout(useFallback, 120);
  const started = performance.now();
  snapshotWindow(element, rect, abort.signal).then((texture) => {
    if (cancelled || abort.signal.aborted) return;
    clearTimeout(timeout);
    performance.measure("genie:snapshot-ready", { start: started, end: performance.now() });
    removeJob = getRenderer().add(texture, {
      opening, rect: geometry, target: destination, duration, finish,
    });
    // Set once at handoff, never from a frame callback.
    element.style.opacity = "0";
  }).catch(useFallback);
  return {
    kill() {
      cancelled = true;
      clearTimeout(timeout);
      abort.abort();
      fallback?.cancel();
      removeJob?.();
      element.style.opacity = originalOpacity;
    },
  };
}
