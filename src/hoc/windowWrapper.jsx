import useWindowsStore from "@store/window";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { useRef, useState, useEffect, useMemo } from "react";

const checkDockCollision = () => {
  if (typeof window === "undefined") return;
  const dockEl = document.querySelector(".dock-container");
  if (!dockEl) return;
  const dockRect = dockEl.getBoundingClientRect();

  const windowsList = document.querySelectorAll("main > section");
  let collision = false;
  for (const winEl of windowsList) {
    if (
      winEl.style.display !== "none" &&
      winEl.id &&
      winEl.id !== "dock" &&
      winEl.id !== "navbar" &&
      winEl.id !== "desktop-area" &&
      winEl.id !== "home" &&
      winEl.id !== "welcome"
    ) {
      const winRect = winEl.getBoundingClientRect();
      const overlap = !(
        winRect.right < dockRect.left ||
        winRect.left > dockRect.right ||
        winRect.bottom < dockRect.top ||
        winRect.top > dockRect.bottom
      );
      if (overlap) {
        collision = true;
        break;
      }
    }
  }

  const currentVal = useWindowsStore.getState().isDockHiddenByCollision;
  if (currentVal !== collision) {
    useWindowsStore.getState().setDockHiddenByCollision(collision);
  }
};

const windowWrapper = (Component, windowKey) => {
  const Wrapped = (props) => {
    const focusWindow = useWindowsStore((state) => state.focusWindow);
    const windowState = useWindowsStore((state) => state.windows[windowKey]);
    const { isOpen, zIndex: baseZIndex } = windowState || { isOpen: false, zIndex: 1000 };
    const zIndex = baseZIndex;
    const ref = useRef(null);
    const prevOpenRef = useRef(false);
    const resizeCleanup = useRef(null);
    const isMaximized = windowState?.isMaximized;
    useEffect(
      () => () => {
        resizeCleanup.current?.();
        document.body.classList.remove("window-dragging");
      },
      [],
    );
    const [isMobile, setIsMobile] = useState(() =>
      typeof window !== "undefined" ? window.innerWidth < 768 : false,
    );

    useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useGSAP(() => {
      const el = ref.current;
      if (!el || isMobile || !isOpen || isMaximized) return;

      const headers = el.querySelectorAll("#window-header, .window-header");
      const dragTrigger = headers.length > 0 ? Array.from(headers) : el;
      const [instance] = Draggable.create(el, {
        trigger: dragTrigger,
        cursor: "default",
        bounds: "#desktop-area",
        onPress: () => focusWindow(windowKey),
        onDragStart: () => {
          document.body.classList.add("window-dragging");
        },
        onDrag: checkDockCollision,
        onDragEnd: () => {
          document.body.classList.remove("window-dragging");
          checkDockCollision();
        },
      });

      return () => {
        document.body.classList.remove("window-dragging");
        instance.kill();
        checkDockCollision();
      };
    }, [isMobile, isOpen, isMaximized]);

    const isMinimized = windowState?.isMinimized;
    const [shouldRender, setShouldRender] = useState(isOpen && !isMinimized);
    const prevMinimizedRef = useRef(isMinimized);
    const lastPosRef = useRef({ x: 0, y: 0 });
    const animationRef = useRef(null);
    const dockTargetRef = useRef(null);
    useEffect(() => () => animationRef.current?.kill(), []);

    useEffect(() => {
      if (isMobile) return;
      if (isOpen && !isMinimized) {
        setShouldRender(true);
      }
      checkDockCollision();
    }, [isOpen, isMinimized, isMobile]);

    useEffect(() => {
      if (!isMobile) return;
      const isActive = isOpen && !isMinimized;
      if (isActive) {
        setShouldRender(true);
      } else {
        const timer = setTimeout(() => {
          setShouldRender(false);
        }, 450);
        return () => clearTimeout(timer);
      }
    }, [isOpen, isMinimized, isMobile]);

    useGSAP(() => {
      const el = ref.current;
      if (!el || isMobile) return;

      const visible = isOpen && !isMinimized;
      const wasOpen = prevOpenRef.current;
      const wasVisible = wasOpen && !prevMinimizedRef.current;
      prevOpenRef.current = isOpen;
      prevMinimizedRef.current = isMinimized;
      if (visible === wasVisible) return;

      const wasAnimating = animationRef.current?.isActive();
      animationRef.current?.kill();
      gsap.killTweensOf(el);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(el, {
          ...lastPosRef.current, scaleX: 1, scaleY: 1, opacity: visible ? 1 : 0,
          clearProps: "clipPath,transformOrigin,willChange",
        });
        setShouldRender(visible);
        return;
      }

      // Measure at rest: the saved drag position must survive minimize/restore.
      if (!visible && wasVisible && !wasAnimating) {
        lastPosRef.current = {
          x: Number(gsap.getProperty(el, "x")) || 0,
          y: Number(gsap.getProperty(el, "y")) || 0,
        };
      } else if (visible && !wasOpen) {
        lastPosRef.current = { x: 0, y: 0 };
      }
      gsap.set(el, {
        display: "block", ...lastPosRef.current, scaleX: 1, scaleY: 1,
        transformOrigin: "50% 100%", clipPath: "polygon(0% 0%, 100% 0%, 100% 25%, 100% 50%, 100% 75%, 100% 100%, 0% 100%, 0% 75%, 0% 50%, 0% 25%)",
        willChange: "transform, clip-path, opacity",
      });
      const rect = el.getBoundingClientRect();
      const icon = document.querySelector(`[data-app-id="${windowKey}"] .dock-icon`);
      if (icon) {
        const bounds = icon.getBoundingClientRect();
        dockTargetRef.current = { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
      }
      const target = dockTargetRef.current ?? { x: window.innerWidth / 2, y: window.innerHeight - 36 };
      const rest = { ...lastPosRef.current, scaleX: 1, scaleY: 1, opacity: 1,
        clipPath: "polygon(0% 0%, 100% 0%, 100% 25%, 100% 50%, 100% 75%, 100% 100%, 0% 100%, 0% 75%, 0% 50%, 0% 25%)" };
      const tip = {
        x: lastPosRef.current.x + target.x - (rect.left + rect.width / 2),
        y: lastPosRef.current.y + target.y - rect.bottom,
        scaleX: Math.min(0.08, 24 / Math.max(rect.width, 1)), scaleY: 0.025,
        opacity: 0,
        clipPath: "polygon(42% 0%, 58% 0%, 61% 25%, 70% 50%, 85% 75%, 100% 100%, 0% 100%, 15% 75%, 30% 50%, 39% 25%)",
      };
      const neck = {
        x: rest.x + (tip.x - rest.x) * 0.35,
        y: rest.y + (tip.y - rest.y) * 0.45,
        scaleX: 0.6, scaleY: 0.85, opacity: 0.95,
        clipPath: "polygon(0% 0%, 100% 0%, 96% 25%, 84% 50%, 69% 75%, 64% 100%, 36% 100%, 31% 75%, 16% 50%, 4% 25%)",
      };
      if (visible) setShouldRender(true);
      gsap.set(el, visible ? tip : rest);
      animationRef.current = gsap.timeline({
        onComplete: () => {
          setShouldRender(visible);
          gsap.set(el, { ...rest, opacity: visible ? 1 : 0,
            display: visible ? "block" : "none", clearProps: "clipPath,transformOrigin,willChange" });
          checkDockCollision();
        },
      }).to(el, { ...neck, duration: visible ? 0.26 : 0.18, ease: "power2.inOut" })
        .to(el, { ...(visible ? rest : tip), duration: visible ? 0.22 : 0.28, ease: visible ? "power2.out" : "power3.in" });
    }, [isOpen, isMinimized, isMobile]);

    const [viewportHeight, setViewportHeight] = useState("100dvh");
    const [viewportOffsetTop, setViewportOffsetTop] = useState(0);

    useEffect(() => {
      if (!isMobile) return;
      const handleViewportChange = () => {
        if (window.visualViewport) {
          setViewportHeight(`${window.visualViewport.height}px`);
          setViewportOffsetTop(window.visualViewport.offsetTop);
          if (window.scrollY !== 0) {
            window.scrollTo(0, 0);
          }
        }
      };

      handleViewportChange();

      window.visualViewport?.addEventListener("resize", handleViewportChange);
      window.visualViewport?.addEventListener("scroll", handleViewportChange);
      return () => {
        window.visualViewport?.removeEventListener("resize", handleViewportChange);
        window.visualViewport?.removeEventListener("scroll", handleViewportChange);
      };
    }, [isMobile, isOpen]);

    const mobileStyles = {
      position: "fixed",
      top: `${viewportOffsetTop}px`,
      left: 0,
      width: "100dvw",
      height: viewportHeight,
      zIndex: isOpen ? zIndex : -1,
      background: "transparent",
      flexDirection: "column",
      overflow: "hidden",
      display: shouldRender ? "flex" : "none",
      opacity: isOpen ? 1 : 0,
      pointerEvents: isOpen ? "auto" : "none",
      transform: isOpen ? "translateY(0)" : "translateY(100%)",
      transition: "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.35s ease",
      border: "none",
      outline: "none",
      boxShadow: "none",
      borderRadius: 0,
    };

    const desktopStyles = {
      zIndex: shouldRender && !isOpen ? 100000 : zIndex,
      display: shouldRender ? "block" : "none",
    };

    const handleResizeStart = (e, direction) => {
      e.stopPropagation();
      e.preventDefault();

      const el = ref.current;
      if (!el) return;

      // Ensure the window comes to front when resizing
      focusWindow(windowKey);

      resizeCleanup.current?.();
      document.body.classList.add("window-resizing");

      const startX = e.clientX;
      const startY = e.clientY;
      const startRect = el.getBoundingClientRect();

      const startGsapX = gsap.getProperty(el, "x") || 0;
      const startGsapY = gsap.getProperty(el, "y") || 0;

      const minWidth =
        windowKey === "appstore"
          ? 550
          : windowKey === "settings"
            ? 450
            : windowKey === "safari"
              ? 420
              : windowKey === "font"
                ? 480
                : windowKey === "postman"
                  ? 360
                  : windowKey === "calendar"
                    ? 360
                    : windowKey === "music"
                      ? 350
                      : 300;

      const handlePointerMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        let newWidth = startRect.width;
        let newHeight = startRect.height;
        let newX = startGsapX;
        let newY = startGsapY;

        if (direction.includes("e")) {
          newWidth = Math.max(minWidth, startRect.width + deltaX);
        } else if (direction.includes("w")) {
          const possibleWidth = startRect.width - deltaX;
          if (possibleWidth >= minWidth) {
            newWidth = possibleWidth;
            newX = startGsapX + deltaX;
          } else {
            newWidth = minWidth;
            newX = startGsapX + (startRect.width - minWidth);
          }
        }

        if (direction.includes("s")) {
          newHeight = Math.max(200, startRect.height + deltaY);
        } else if (direction.includes("n")) {
          let clampedDeltaY = deltaY;
          // Navbar is ~35px tall. Don't let the window's top edge go above it.
          if (startRect.top + clampedDeltaY < 35) {
            clampedDeltaY = 35 - startRect.top;
          }

          const possibleHeight = startRect.height - clampedDeltaY;
          if (possibleHeight >= 200) {
            newHeight = possibleHeight;
            newY = startGsapY + clampedDeltaY;
          } else {
            newHeight = 200;
            newY = startGsapY + (startRect.height - 200);
          }
        }

        el.style.width = `${newWidth}px`;
        el.style.height = `${newHeight}px`;
        el.style.maxWidth = "none";
        el.style.maxHeight = "none";

        if (newX !== startGsapX || newY !== startGsapY) {
          gsap.set(el, { x: newX, y: newY });
        }

        checkDockCollision();
      };

      const handlePointerUp = () => {
        document.body.classList.remove("window-resizing");
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
        resizeCleanup.current = null;
      };

      resizeCleanup.current = handlePointerUp;
      window.addEventListener("pointercancel", handlePointerUp);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    };

    const prevPropsRef = useRef(props);
    const memoizedProps = useMemo(() => {
      const prev = prevPropsRef.current;
      const keys = Object.keys(props);
      const prevKeys = Object.keys(prev);
      if (keys.length !== prevKeys.length) {
        prevPropsRef.current = props;
        return props;
      }
      for (const key of keys) {
        if (props[key] !== prev[key]) {
          prevPropsRef.current = props;
          return props;
        }
      }
      return prev;
    }, [props]);

    const componentElement = useMemo(() => {
      return <Component {...memoizedProps} />;
    }, [memoizedProps]);
    const shouldMountComponent = isOpen || shouldRender;

    return (
      <section
        id={windowKey}
        role="region"
        aria-label={`${windowKey} window`}
        inert={!isOpen || isMinimized ? true : undefined}
        ref={ref}
        style={isMobile ? mobileStyles : desktopStyles}
        className={`${isMobile ? "" : "absolute"} ${windowState?.isMaximized ? "maximized" : ""} ${shouldRender ? "window-visible" : "window-hidden"}`}
        onPointerDown={() => {
          if (!isMobile) focusWindow(windowKey);
        }}
      >
        {shouldMountComponent ? componentElement : null}
        {!isMobile && !windowState?.isMaximized && !windowState?.isMinimized && (
          <>
            <div
              className="resize-handle resize-n"
              onPointerDown={(e) => handleResizeStart(e, "n")}
            />
            <div
              className="resize-handle resize-s"
              onPointerDown={(e) => handleResizeStart(e, "s")}
            />
            <div
              className="resize-handle resize-e"
              onPointerDown={(e) => handleResizeStart(e, "e")}
            />
            <div
              className="resize-handle resize-w"
              onPointerDown={(e) => handleResizeStart(e, "w")}
            />
            <div
              className="resize-handle resize-ne"
              onPointerDown={(e) => handleResizeStart(e, "ne")}
            />
            <div
              className="resize-handle resize-nw"
              onPointerDown={(e) => handleResizeStart(e, "nw")}
            />
            <div
              className="resize-handle resize-se"
              onPointerDown={(e) => handleResizeStart(e, "se")}
            />
            <div
              className="resize-handle resize-sw"
              onPointerDown={(e) => handleResizeStart(e, "sw")}
            />
          </>
        )}
      </section>
    );
  };

  Wrapped.displayName = `WindowWrapper(${Component.displayName || Component.name || "Component"})`;

  return Wrapped;
};

export default windowWrapper;
