import React, { useEffect, useState } from "react";
import { Terminal as XTerm } from "xterm";
import "xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";
import { techStack, projects, OWNER_HANDLE } from "@constants";
import useWindowsStore from "@store/window";

const TerminalInput = ({ terminalRef, xtermRef, fitAddonRef, commandRef }) => {
  const [activeTerm, setActiveTerm] = useState(null);

  const shortcutKeys = [
    { label: "help", cmd: "help" },
    { label: "clear", cmd: "clear" },
    { label: "techstack", cmd: "techstack" },
    { label: "projects", cmd: "projects" },
    { label: "flappy", cmd: "flappy" },
    { label: "whoami", cmd: "whoami" },
    { label: "sudo", cmd: "sudo" },
  ];

  const handleShortcutClick = (cmd) => {
    const term = activeTerm;
    if (!term) return;

    // Output command string to console
    term.write(cmd);

    // Command execution logic
    const println = (msg) => {
      term.write("\r\n" + msg + "\x1b[0m");
    };

    const prompt = () => {
      term.write(`\r\n\x1b[1;32m${OWNER_HANDLE}@macbook ~ %\x1b[0m `);
    };

    if (cmd === "clear") {
      term.clear();
      prompt();
      commandRef.current = "";
      return;
    }

    const args = cmd.split(" ");
    const baseCmd = args[0].toLowerCase();

    switch (baseCmd) {
      case "help":
        println("\x1b[1;38;2;219;39;119m=== Available Commands ===\x1b[0m");
        println(
          "\x1b[1;38;2;16;185;129mhelp\x1b[0m      \x1b[38;2;75;85;99m- Show help message\x1b[0m",
        );
        println("\x1b[1;38;2;16;185;129mclear\x1b[0m     \x1b[38;2;75;85;99m- Clear screen\x1b[0m");
        println("\x1b[1;38;2;16;185;129mecho\x1b[0m      \x1b[38;2;75;85;99m- Print text\x1b[0m");
        println(
          "\x1b[1;38;2;16;185;129mdate\x1b[0m      \x1b[38;2;75;85;99m- Print date/time\x1b[0m",
        );
        println(
          "\x1b[1;38;2;16;185;129mwhoami\x1b[0m    \x1b[38;2;75;85;99m- Print current user\x1b[0m",
        );
        println(
          "\x1b[1;38;2;16;185;129mtechstack\x1b[0m \x1b[38;2;75;85;99m- Display tech stack\x1b[0m",
        );
        println(
          "\x1b[1;38;2;16;185;129mprojects\x1b[0m  \x1b[38;2;75;85;99m- Display portfolio projects\x1b[0m",
        );
        println(
          "\x1b[1;38;2;16;185;129msudo\x1b[0m      \x1b[38;2;75;85;99m- Run superuser command\x1b[0m",
        );
        break;
      case "techstack":
        println("\x1b[1;38;2;219;39;119m=== Tech Stack ===\x1b[0m");
        techStack.forEach(({ category, items }) => {
          println(`\x1b[1;38;2;6;182;212m${category}:\x1b[0m`);
          println(`\x1b[38;2;75;85;99m${items.join(", ")}\x1b[0m`);
        });
        break;
      case "projects":
        println("\x1b[1;38;2;219;39;119m=== Portfolio Projects ===\x1b[0m");
        projects.forEach((proj) => {
          println(`\x1b[1;38;2;16;185;129m• ${proj.title}\x1b[0m`);
          println("\x1b[1;38;2;245;158;11mDescription:\x1b[0m");
          println(`\x1b[38;2;75;85;99m${proj.description}\x1b[0m`);
          if (proj.status === "in-progress") {
            println("\x1b[1;38;2;245;158;11mStatus:\x1b[0m");
            println("\x1b[38;2;245;158;11mIn Progress — under active development\x1b[0m");
          }
          if (proj.link) {
            println("\x1b[1;38;2;6;182;212mLive Demo:\x1b[0m");
            println(`\x1b[4;38;2;37;99;235m${proj.link}\x1b[0m`);
          }
          if (proj.github) {
            println("\x1b[1;38;2;6;182;212mGitHub:\x1b[0m");
            println(`\x1b[4;38;2;37;99;235m${proj.github}\x1b[0m`);
          }
          println("");
        });
        break;
      case "whoami":
        println(`\x1b[38;2;75;85;99m${OWNER_HANDLE}\x1b[0m`);
        break;
      case "flappy":
        if (term._isFlappyActive?.()) return; // game already running
        term.write("\x1b[2J\x1b[H");
        if (term._startFlappy) {
          term._startFlappy();
          commandRef.current = "";
          return;
        }
        println("\x1b[31mflappy: terminal not ready\x1b[0m");
        break;
      case "sudo":
        println(
          `\x1b[31m${OWNER_HANDLE} is not in the sudoers file. This incident will be reported.\x1b[0m`,
        );
        break;
      default:
        println(`\x1b[31mzsh: command not found: ${baseCmd}\x1b[0m`);
    }

    commandRef.current = "";
    prompt();
  };

  const isOpen = useWindowsStore((state) => state.windows.terminal?.isOpen);

  useEffect(() => {
    if (!isOpen || !terminalRef.current) return;

    const terminalEl = terminalRef.current;
    let term = null;
    let fitAddon = null;
    let isOpened = false;

    let touchStartY = 0;
    let lastTouchY = 0;
    let touchStartScrollTop = 0;
    let lastTouchTime = 0;
    let velocityY = 0;
    let animationFrameId = null;

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
        lastTouchY = touchStartY;
        lastTouchTime = performance.now();
        velocityY = 0;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        const viewport = terminalEl.querySelector(".xterm-viewport");
        if (viewport) {
          touchStartScrollTop = viewport.scrollTop;
        }
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
        const currentY = e.touches[0].clientY;
        const currentTime = performance.now();
        const deltaY = currentY - touchStartY;

        const viewport = terminalEl.querySelector(".xterm-viewport");
        if (viewport) {
          viewport.scrollTop = touchStartScrollTop - deltaY;

          const timeDiff = currentTime - lastTouchTime;
          if (timeDiff > 0) {
            velocityY = (currentY - lastTouchY) / timeDiff;
          }

          lastTouchY = currentY;
          lastTouchTime = currentTime;
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      const viewport = terminalEl.querySelector(".xterm-viewport");
      if (!viewport || Math.abs(velocityY) < 0.1) return;

      let currentVelocity = velocityY;
      const friction = 0.95;

      const step = () => {
        if (Math.abs(currentVelocity) < 0.05) {
          animationFrameId = null;
          return;
        }

        viewport.scrollTop -= currentVelocity * 16;
        currentVelocity *= friction;
        animationFrameId = requestAnimationFrame(step);
      };

      animationFrameId = requestAnimationFrame(step);
    };

    terminalEl.addEventListener("touchstart", handleTouchStart, { passive: false });
    terminalEl.addEventListener("touchmove", handleTouchMove, { passive: false });
    terminalEl.addEventListener("touchend", handleTouchEnd, { passive: true });

    const setupHandlers = (t) => {
      const prompt = () => {
        t.write(`\r\n\x1b[1;32m${OWNER_HANDLE}@macbook ~ %\x1b[0m `);
      };

      const println = (msg) => {
        t.write("\r\n" + msg + "\x1b[0m");
      };

      t.write("Last login: " + new Date().toLocaleString() + " / type help?");
      prompt();

      // ----------------------------------------------------------------
      // FLAPPY (mobile) — tap the terminal to flap, tap after game over
      // to return to the prompt. Orange bird, green pipes, same vibe
      // as the desktop version.
      // ----------------------------------------------------------------
      let flappy = null;

      const stopFlappy = () => {
        if (flappy?.timer) clearInterval(flappy.timer);
        if (term) term._flappyTimer = null;
        if (term?._flappyTap) {
          terminalEl.removeEventListener("pointerdown", term._flappyTap);
          term._flappyTap = null;
        }
        flappy = null;
      };

      const exitFlappy = () => {
        stopFlappy();
        t.write("\x1b[2J\x1b[H");
        t.write("Last login: " + new Date().toLocaleString() + " / type help?");
        prompt();
      };

      const startFlappy = () => {
        if (flappy) return;
        const W = Math.max(22, Math.min(40, t.cols - 4));
        const H = 15;
        const GROUND = H - 1;
        const BIRD_X = 5;
        const state = {
          birdY: Math.floor(H / 2),
          vel: 0,
          pipes: [],
          score: 0,
          over: false,
        };
        const spawnPipe = (x) => {
          const gap = 4;
          const gapY = 2 + Math.floor(Math.random() * Math.max(1, GROUND - gap - 2));
          state.pipes.push({ x, gapY, gap, passed: false });
        };
        spawnPipe(W - 6);

        const render = () => {
          const grid = Array.from({ length: H }, () => Array(W).fill(" "));
          state.pipes.forEach((p) => {
            const px = Math.round(p.x);
            for (let y = 0; y < GROUND; y += 1) {
              if (y < p.gapY || y >= p.gapY + p.gap) {
                for (let dx = 0; dx < 2; dx += 1) {
                  const x = px + dx;
                  if (x >= 0 && x < W) grid[y][x] = "P";
                }
              }
            }
          });
          const by = Math.round(state.birdY);
          if (by >= 0 && by < GROUND) grid[by][BIRD_X] = "B";
          for (let x = 0; x < W; x += 1) grid[GROUND][x] = "=";

          const out = [`\x1b[2J\x1b[H\x1b[38;2;242;100;44m SCORE ${state.score} \x1b[0m`];
          grid.forEach((row) => {
            let line = "";
            row.forEach((ch) => {
              if (ch === "P") line += "\x1b[38;2;34;197;94m█";
              else if (ch === "B") line += "\x1b[1;38;2;242;100;44m▓";
              else if (ch === "=") line += "\x1b[38;2;113;113;122m░";
              else line += " ";
            });
            out.push(line + "\x1b[0m");
          });
          if (state.over) {
            out.push("");
            out.push("\x1b[1;38;2;242;100;44m GAME OVER — tap to exit \x1b[0m");
          } else {
            out.push("\x1b[38;2;242;100;44m TAP to flap \x1b[0m");
          }
          t.write(out.join("\r\n"));
        };

        const tick = () => {
          if (state.over) return;
          state.vel += 0.42;
          state.birdY += state.vel;
          if (state.birdY < 0) {
            state.birdY = 0;
            state.over = true;
          }
          state.pipes.forEach((p) => {
            p.x -= 0.5;
            if (!p.passed && p.x + 2 < BIRD_X) {
              p.passed = true;
              state.score += 1;
            }
          });
          state.pipes = state.pipes.filter((p) => p.x > -3);
          const last = state.pipes[state.pipes.length - 1];
          if (!last || last.x < W - 14) spawnPipe(W - 2);
          const by = Math.round(state.birdY);
          if (by >= GROUND) {
            state.birdY = GROUND - 0.01;
            state.over = true;
          } else {
            for (const p of state.pipes) {
              const px = Math.round(p.x);
              if (BIRD_X >= px && BIRD_X < px + 2 && (by < p.gapY || by >= p.gapY + p.gap)) {
                state.over = true;
                break;
              }
            }
          }
          if (state.over) clearInterval(flappy.timer);
          render();
        };

        render();
        flappy = { timer: setInterval(tick, 120), state };
        if (term) term._flappyTimer = flappy.timer;
        t._startFlappy = startFlappy;
        t._isFlappyActive = () => Boolean(flappy);
        term._flappyTap = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!flappy) return;
          if (flappy.state.over) exitFlappy();
          else flappy.state.vel = -1.2;
        };
        terminalEl.addEventListener("pointerdown", term._flappyTap);
      };

      t.onData((data) => {
        const code = data.charCodeAt(0);

        // Flappy owns the keyboard while active.
        if (flappy) {
          if (data === "q" || data === "Q") {
            exitFlappy();
            return;
          }
          if (flappy.state.over) return; // tap to exit
          if (data === " " || data === "w" || data === "W") flappy.state.vel = -1.2;
          return;
        }

        if (code === 13) {
          const cmd = commandRef.current.trim();
          if (cmd === "") {
            prompt();
            return;
          }

          const args = cmd.split(" ");
          const baseCmd = args[0].toLowerCase();

          switch (baseCmd) {
            case "help":
              println("\x1b[1;38;2;219;39;119m=== Available Commands ===\x1b[0m");
              println(
                "\x1b[1;38;2;16;185;129mhelp\x1b[0m      \x1b[38;2;75;85;99m- Show help message\x1b[0m",
              );
              println(
                "\x1b[1;38;2;16;185;129mclear\x1b[0m     \x1b[38;2;75;85;99m- Clear screen\x1b[0m",
              );
              println(
                "\x1b[1;38;2;16;185;129mecho\x1b[0m      \x1b[38;2;75;85;99m- Print text\x1b[0m",
              );
              println(
                "\x1b[1;38;2;16;185;129mdate\x1b[0m      \x1b[38;2;75;85;99m- Print date/time\x1b[0m",
              );
              println(
                "\x1b[1;38;2;16;185;129mwhoami\x1b[0m    \x1b[38;2;75;85;99m- Print current user\x1b[0m",
              );
              println(
                "\x1b[1;38;2;16;185;129mtechstack\x1b[0m \x1b[38;2;75;85;99m- Display tech stack\x1b[0m",
              );
              println(
                "\x1b[1;38;2;16;185;129mprojects\x1b[0m  \x1b[38;2;75;85;99m- Display portfolio projects\x1b[0m",
              );
              println(
                "\x1b[1;38;2;242;100;44mflappy\x1b[0m    \x1b[38;2;75;85;99m- Play ascii flappy bird (tap)\x1b[0m",
              );
              println(
                "\x1b[1;38;2;16;185;129msudo\x1b[0m      \x1b[38;2;75;85;99m- Run superuser command\x1b[0m",
              );
              break;
            case "clear":
              t.clear();
              break;
            case "echo":
              println(args.slice(1).join(" "));
              break;
            case "date":
              println(new Date().toString());
              break;
            case "whoami":
              println(`\x1b[38;2;75;85;99m${OWNER_HANDLE}\x1b[0m`);
              break;
            case "sudo":
              println(
                `\x1b[31m${OWNER_HANDLE} is not in the sudoers file. This incident will be reported.\x1b[0m`,
              );
              break;
            case "techstack":
              println("\x1b[1;38;2;219;39;119m=== Tech Stack ===\x1b[0m");
              techStack.forEach(({ category, items }) => {
                println(`\x1b[1;38;2;6;182;212m${category}:\x1b[0m`);
                println(`\x1b[38;2;75;85;99m${items.join(", ")}\x1b[0m`);
              });
              break;
            case "projects":
              println("\x1b[1;38;2;219;39;119m=== Portfolio Projects ===\x1b[0m");
              projects.forEach((proj) => {
                println(`\x1b[1;38;2;16;185;129m• ${proj.title}\x1b[0m`);
                println("\x1b[1;38;2;245;158;11mDescription:\x1b[0m");
                println(`\x1b[38;2;75;85;99m${proj.description}\x1b[0m`);
                if (proj.status === "in-progress") {
                  println("\x1b[1;38;2;245;158;11mStatus:\x1b[0m");
                  println("\x1b[38;2;245;158;11mIn Progress — under active development\x1b[0m");
                }
                if (proj.link) {
                  println("\x1b[1;38;2;6;182;212mLive Demo:\x1b[0m");
                  println(`\x1b[4;38;2;37;99;235m${proj.link}\x1b[0m`);
                }
                if (proj.github) {
                  println("\x1b[1;38;2;6;182;212mGitHub:\x1b[0m");
                  println(`\x1b[4;38;2;37;99;235m${proj.github}\x1b[0m`);
                }
                println("");
              });
              break;
            case "flappy":
              t.write("\x1b[2J\x1b[H");
              startFlappy();
              break;
            default:
              println(`\x1b[31mzsh: command not found: ${baseCmd}\x1b[0m`);
          }

          commandRef.current = "";
          prompt();
        } else if (code === 127 || code === 8) {
          if (commandRef.current.length > 0) {
            commandRef.current = commandRef.current.slice(0, -1);
            t.write("\b \b");
          }
        } else if (code >= 32 && code <= 126) {
          commandRef.current += data;
          t.write(data);
        }
      });
    };

    const tryInit = () => {
      if (isOpened || !terminalRef.current) return;
      const { width, height } = terminalRef.current.getBoundingClientRect();
      if (width > 0 && height > 0) {
        term = new XTerm({
          cursorBlink: true,
          fontFamily: "Menlo, Monaco, 'Courier New', monospace",
          fontSize: 11,
          lineHeight: 1.4,
          theme: {
            background: "#161618",
            foreground: "#d4d4d8",
            cursor: "#f2642c",
            cursorAccent: "#161618",
            selectionBackground: "#7c2d12",
          },
        });

        fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        isOpened = true;

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;
        setActiveTerm(term);

        try {
          fitAddon.fit();
        } catch (e) {
          console.warn("Could not fit terminal on lazy open:", e);
        }

        setupHandlers(term);
      }
    };

    tryInit();

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width <= 0 || height <= 0) return;
      }
      if (!isOpened) {
        tryInit();
      } else if (fitAddon) {
        try {
          fitAddon.fit();
        } catch {
          // ignore fit error
        }
      }
    });

    resizeObserver.observe(terminalRef.current);

    const timer = setTimeout(() => {
      if (!isOpened) {
        tryInit();
      } else if (fitAddon && terminalRef.current) {
        const { width, height } = terminalRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          try {
            fitAddon.fit();
          } catch {
            // ignore fit error
          }
        }
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      if (term?._flappyTimer) {
        clearInterval(term._flappyTimer);
        term._flappyTimer = null;
      }
      if (term?._flappyTap) {
        terminalEl.removeEventListener("pointerdown", term._flappyTap);
        term._flappyTap = null;
      }
      if (term) {
        term.dispose();
      }
      terminalEl.removeEventListener("touchstart", handleTouchStart);
      terminalEl.removeEventListener("touchmove", handleTouchMove);
      terminalEl.removeEventListener("touchend", handleTouchEnd);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      xtermRef.current = null;
      fitAddonRef.current = null;
      setActiveTerm(null);
    };
  }, [isOpen, commandRef, fitAddonRef, terminalRef, xtermRef]);

  return (
    <div
      className="flex-1 w-full bg-[#161618] flex flex-col min-h-0 p-4 pb-5"
      style={{ overflow: "hidden" }}
    >
      <style>{`
        .xterm-viewport {
          scroll-behavior: auto !important;
          -webkit-overflow-scrolling: touch !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .xterm-viewport::-webkit-scrollbar {
          display: none !important;
        }
        .xterm,
        .xterm-viewport,
        .xterm-screen,
        .xterm-rows {
          touch-action: pan-y !important;
        }
      `}</style>
      <div className="flex-1 w-full min-h-0" style={{ overflow: "hidden" }}>
        <div ref={terminalRef} className="w-full h-full outline-none xterm-wrapper" />
      </div>

      {/* Predefined commands horizontal scrolling bar */}
      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          padding: "12px 0 8px",
          borderTop: "1px solid rgba(255,255,255,0.10)",
          width: "100%",
          flexShrink: 0,
          background: "#161618",
        }}
        className="scrollbar-none"
      >
        {shortcutKeys.map(({ label, cmd }) => (
          <button
            key={label}
            onClick={() => handleShortcutClick(cmd)}
            style={{
              padding: "6px 12px",
              background: "rgba(255, 255, 255, 0.08)",
              color: "#e4e4e7",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "Menlo, Monaco, monospace",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
            className="active:bg-white/15"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TerminalInput;
