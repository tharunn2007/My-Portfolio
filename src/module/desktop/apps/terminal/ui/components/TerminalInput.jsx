import { useEffect } from "react";
import { Terminal as XTerm } from "xterm";
import "xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";
import {
  techStack,
  projects,
  GITHUB_PROFILE,
  PORTFOLIO_URL,
  EMAIL,
  OWNER_NAME,
  OWNER_FIRST_NAME,
  OWNER_HANDLE,
  OWNER_LOCATION,
} from "@constants";
import { profile } from "@constants/profile";
import {
  renderDonutFrame,
  donutGeometry,
  bannerWelcomeLines,
  BANNER_COLORS,
} from "@lib/terminalBanner";
import useWindowsStore from "@store/window";

const ANSI_RESET = "\x1b[0m";
const orange = (text) => `\x1b[38;2;${BANNER_COLORS.fill.join(";")}m${text}${ANSI_RESET}`;

const TerminalInput = ({ terminalRef, xtermRef, fitAddonRef, commandRef }) => {
  const isOpen = useWindowsStore((state) => state.windows.terminal?.isOpen);

  useEffect(() => {
    if (!isOpen || !terminalRef.current) return;

    let term = null;
    let fitAddon = null;
    let isOpened = false;
    let printBanner = null;

    const setupHandlers = (t) => {
      const prompt = () => {
        t.write(`\r\n\x1b[1;32m${OWNER_HANDLE}@macbook ~ %\x1b[0m `);
      };

      const println = (msg) => {
        t.write("\r\n" + msg + "\x1b[0m");
      };

      // ------------------------------------------------------------------
      // DONUT BANNER — Andy Sloane (a1k0n) donut.c tribute, scaled down.
      // Boot: welcome pill + a spinning donut takeover; any key drops to
      // the shell, which keeps a frozen donut frame as the banner. The
      // `donut` command re-spins it anytime.
      // ------------------------------------------------------------------
      let donut = null; // { timer, geometry }

      const staticDonutFrame = (terminal) => {
        const geometry = donutGeometry(terminal.cols);
        renderDonutFrame(1.05, 0.55, geometry).forEach((line) => terminal.writeln(` ${line}`));
      };

      printBanner = (terminal) => {
        bannerWelcomeLines(`Welcome to ${OWNER_FIRST_NAME}'s portfolio!`).forEach((line) =>
          terminal.writeln(line),
        );
        staticDonutFrame(terminal);
        terminal.write("Last login: " + new Date().toLocaleString() + " / help?");
        prompt();
      };

      const stopDonut = () => {
        if (donut?.timer) clearInterval(donut.timer);
        if (term) term._donutTimer = null;
        donut = null;
      };

      const exitDonut = () => {
        stopDonut();
        t.write("\x1b[2J\x1b[H");
        printBanner(t);
      };

      const startDonut = () => {
        if (donut) return;
        const geometry = donutGeometry(t.cols);
        let A = 1.0;
        let B = 0.4;

        const render = () => {
          const out = [
            `\x1b[2J\x1b[H\x1b[38;2;113;113;122m  donut.c — Andy Sloane tribute  \x1b[0m`,
            "",
          ];
          renderDonutFrame(A, B, geometry).forEach((line) => out.push(` ${line}`));
          out.push("");
          out.push("\x1b[38;2;113;113;122m  press any key for the shell…\x1b[0m");
          t.write(out.join("\r\n"));
          A += 0.07;
          B += 0.035;
        };

        render();
        donut = { timer: setInterval(render, 50), geometry };
        if (term) term._donutTimer = donut.timer;
      };

      printBanner(t);

      // Boot splash — donut spins until the first keystroke.
      if (t.cols >= 26) startDonut();

      // ------------------------------------------------------------------
      // FLAPPY — playable ascii flappy bird right inside the terminal.
      // Aesthetic matches the banner: orange bird, Claude-orange HUD.
      // ------------------------------------------------------------------
      let flappy = null; // { timer, state }

      const stopFlappy = () => {
        if (flappy?.timer) clearInterval(flappy.timer);
        if (term) term._flappyTimer = null;
        flappy = null;
      };

      const exitFlappy = () => {
        stopFlappy();
        t.write("\x1b[2J\x1b[H");
        printBanner(t);
      };

      const startFlappy = () => {
        if (flappy) return;

        const W = Math.max(30, Math.min(56, t.cols - 6));
        const H = 17;
        const GROUND = H - 1;
        const BIRD_X = 8;

        const state = {
          birdY: Math.floor(H / 2),
          vel: 0,
          pipes: [],
          score: 0,
          best: Number(globalThis.localStorage?.getItem("flappy-best") || 0),
          over: false,
        };

        const spawnPipe = (x) => {
          const gap = 5;
          const gapY = 2 + Math.floor(Math.random() * Math.max(1, GROUND - gap - 3));
          state.pipes.push({ x, gapY, gap, passed: false });
        };
        spawnPipe(W - 8);

        const flap = () => {
          if (!state.over) state.vel = -1.3;
        };

        const drawBox = (lines, width) => {
          const pad = (s) => s + " ".repeat(Math.max(0, width - s.length));
          t.write(`\r\n${orange(`╭${"─".repeat(width)}╮`)}`);
          lines.forEach((line) => t.write(`\r\n${orange("│")}${pad(line)}${orange("│")}`));
          t.write(`\r\n${orange(`╰${"─".repeat(width)}╯`)}`);
        };

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

          const hud = ` SCORE ${state.score}  ·  BEST ${state.best} `;
          const out = [`\x1b[2J\x1b[H${orange(hud)}`];

          grid.forEach((row) => {
            let line = "";
            let runColor = null;
            row.forEach((ch) => {
              let color = null;
              if (ch === "P") color = "34;197;94";
              else if (ch === "B") color = `${BANNER_COLORS.fill.join(";")}`;
              else if (ch === "=") color = "113;113;122";
              if (ch === " ") {
                line += " ";
                runColor = null;
                return;
              }
              const prefix = color && color !== runColor ? `\x1b[38;2;${color}m` : "";
              runColor = color;
              line += prefix + (ch === "B" ? "▓" : ch === "=" ? "░" : "█");
            });
            out.push(line + ANSI_RESET);
          });

          if (state.over) {
            out.push("");
            const best = Math.max(state.best, state.score);
            const lines = [
              "        GAME OVER          ",
              `      SCORE ${String(state.score).padStart(2, "0")} · BEST ${String(best).padStart(2, "0")}       `,
              "   [R] restart   [Q] quit   ",
            ]
              .map((l) => l)
              .map((l) => l.slice(0, 28));
            const width = 28;
            const padLine = (s) => s + " ".repeat(Math.max(0, width - s.length));
            out.push(orange(`╭${"─".repeat(width)}╮`));
            lines.forEach((l) => out.push(`${orange("│")}\x1b[1m${orange(padLine(l))}${ANSI_RESET}${orange("│")}`));
            out.push(orange(`╰${"─".repeat(width)}╯`));
          } else {
            out.push(`${orange(" [SPACE]")} flap   ${orange("[Q]")} quit`);
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
          if (!last || last.x < W - 18) spawnPipe(W - 2);

          const bx = BIRD_X;
          const by = Math.round(state.birdY);
          if (by >= GROUND) {
            state.birdY = GROUND - 0.01;
            state.over = true;
          } else {
            for (const p of state.pipes) {
              const px = Math.round(p.x);
              if (bx >= px && bx < px + 2 && (by < p.gapY || by >= p.gapY + p.gap)) {
                state.over = true;
                break;
              }
            }
          }

          if (state.over) {
            state.best = Math.max(state.best, state.score);
            try {
              globalThis.localStorage?.setItem("flappy-best", String(state.best));
            } catch {
              /* private mode */
            }
            clearInterval(flappy.timer);
          }

          render();
        };

        render();
        flappy = { timer: setInterval(tick, 110), state };
        if (term) term._flappyTimer = flappy.timer;
      };

      t.onData((data) => {
        // The donut owns the keyboard while spinning — any key exits.
        if (donut) {
          if (data !== "") exitDonut();
          return;
        }

        // Flappy takes over the keyboard while active.
        if (flappy) {
          if (data === "q" || data === "Q") {
            exitFlappy();
            return;
          }
          if (flappy.state.over) {
            if (data === "r" || data === "R") {
              stopFlappy();
              t.write("\x1b[2J\x1b[H");
              startFlappy();
            }
            return;
          }
          if (data === " " || data === "w" || data === "W" || data === "\x1b[A") {
            flappy.state.vel = -1.3;
          }
          return;
        }

        const code = data.charCodeAt(0);

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
                `\x1b[1;38;2;16;185;129mabout\x1b[0m     \x1b[38;2;75;85;99m- About ${OWNER_NAME}\x1b[0m`,
              );
              println(
                "\x1b[1;38;2;16;185;129mtechstack\x1b[0m \x1b[38;2;75;85;99m- Display tech stack\x1b[0m",
              );
              println(
                "\x1b[1;38;2;16;185;129mprojects\x1b[0m  \x1b[38;2;75;85;99m- Display portfolio projects\x1b[0m",
              );
              println(
                `${orange("flappy")}    \x1b[38;2;75;85;99m- Play ascii flappy bird\x1b[0m`,
              );
              println(
                `${orange("donut")}     \x1b[38;2;75;85;99m- Spin the donut.c ascii torus\x1b[0m`,
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
            case "about":
              println(`\x1b[1;38;2;219;39;119m=== About ${OWNER_NAME} ===\x1b[0m`);
              println(`\x1b[1;38;2;16;185;129mName:      \x1b[38;2;75;85;99m${OWNER_NAME}\x1b[0m`);
              println(`\x1b[1;38;2;16;185;129mRole:      \x1b[38;2;75;85;99m${profile.role}\x1b[0m`);
              println(
                `\x1b[1;38;2;16;185;129mLocation:  \x1b[38;2;75;85;99m${OWNER_LOCATION.city}, ${OWNER_LOCATION.country}\x1b[0m`,
              );
              println(`\x1b[1;38;2;16;185;129mEmail:     \x1b[4;38;2;37;99;235m${EMAIL}\x1b[0m`);
              println(`\x1b[1;38;2;16;185;129mGitHub:    \x1b[4;38;2;37;99;235m${GITHUB_PROFILE}\x1b[0m`);
              println(`\x1b[1;38;2;16;185;129mPortfolio: \x1b[4;38;2;37;99;235m${PORTFOLIO_URL}\x1b[0m`);
              println("\x1b[1;38;2;6;182;212m\r\nBio:\x1b[0m");
              profile.bio.forEach((line) => {
                println(`\x1b[38;2;75;85;99m${line}\x1b[0m`);
              });
              println(
                "\x1b[38;2;75;85;99mType \x1b[1;38;2;16;185;129mtechstack\x1b[0m\x1b[38;2;75;85;99m for skills, \x1b[1;38;2;16;185;129mprojects\x1b[0m\x1b[38;2;75;85;99m for work, or \x1b[1;38;2;16;185;129mflappy\x1b[0m\x1b[38;2;75;85;99m to play.\x1b[0m",
              );
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
            case "donut":
              t.write("\x1b[2J\x1b[H");
              startDonut();
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
          fontSize: 14,
          lineHeight: 1.4,
          theme: {
            background: "#161618",
            foreground: "#d4d4d8",
            cursor: "#f2642c",
            cursorAccent: "#161618",
            selectionBackground: "#7c2d12",
            black: "#18181b",
            brightBlack: "#52525b",
          },
        });

        fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        isOpened = true;

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

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
      } else if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch {
          /* empty */
        }
      }
    });

    resizeObserver.observe(terminalRef.current);

    const timer = setTimeout(() => {
      if (!isOpened) {
        tryInit();
      } else if (fitAddonRef.current && terminalRef.current) {
        const { width, height } = terminalRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          try {
            fitAddonRef.current.fit();
          } catch {
            /* empty */
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
      if (term?._donutTimer) {
        clearInterval(term._donutTimer);
        term._donutTimer = null;
      }
      if (term) {
        term.dispose();
      }
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [isOpen, commandRef, fitAddonRef, terminalRef, xtermRef]);

  return (
    <div
      ref={terminalRef}
      className="flex-1 w-full bg-[#161618] pt-4 px-4 pb-12 outline-none xterm-wrapper"
      style={{ overflow: "hidden" }}
    />
  );
};

export default TerminalInput;
