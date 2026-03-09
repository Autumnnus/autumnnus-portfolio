(function seasonalCompanion() {
  if (window.__seasonalCompanionCleanup) {
    window.__seasonalCompanionCleanup();
  }

  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  if (reducedMotionQuery.matches) {
    return;
  }

  const script = document.currentScript;
  const spriteFiles = {
    light: script?.dataset.lightSprite || "/autumn/autumn.png",
    dark: script?.dataset.darkSprite || "/snow/snowman.png",
  };

  const sheetWidth = 1280;
  const sheetHeight = 698;
  const columns = 8;
  const rows = 4;
  const frameWidth = sheetWidth / columns;
  const frameHeight = sheetHeight / rows;
  const renderWidth = 96;
  const renderScale = renderWidth / frameWidth;
  const renderHeight = frameHeight * renderScale;

  const spriteRows = {
    idle: { row: 0, frames: [0, 1, 2, 3], speed: 220 },
    glide: { row: 1, frames: [0, 1, 2, 3, 4, 5], speed: 90 },
    throw: { row: 2, frames: [0, 1, 2, 3, 4], speed: 85 },
    sleep: { row: 3, frames: [0, 1, 2, 3], speed: 320 },
    dance: { row: 3, frames: [4, 5, 6, 7], speed: 130 },
  };

  const companionEl = document.createElement("div");
  const spriteEl = document.createElement("div");
  const projectiles = [];

  let posX = window.innerWidth * 0.4;
  let posY = window.innerHeight * 0.45;
  let mouseX = posX;
  let mouseY = posY;
  let lastMouseX = mouseX;
  let lastMouseY = mouseY;
  let lastMouseMoveAt = performance.now();
  let lastBehaviorShiftAt = 0;
  let lastThrowAt = -2000;
  let nextRandomThrowAt = 0;
  let facing = 1;
  let behavior = "follow";
  let followBias = 0.84;
  let hoverOffsetX = 0;
  let hoverOffsetY = 0;
  let currentTheme = "light";
  let action = null;
  let animationFrameId = 0;
  let themeObserver = null;
  let lastTimestamp = 0;

  function now() {
    return performance.now();
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getTheme() {
    return document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
  }

  function setTheme() {
    currentTheme = getTheme();
    spriteEl.style.backgroundImage = `url(${spriteFiles[currentTheme]})`;
    spriteEl.style.filter =
      currentTheme === "dark"
        ? "drop-shadow(0 8px 18px rgba(147, 197, 253, 0.22))"
        : "drop-shadow(0 8px 18px rgba(120, 53, 15, 0.2))";
  }

  function setFrame(name, elapsed) {
    const sprite = spriteRows[name];
    const frame =
      sprite.frames[Math.floor(elapsed / sprite.speed) % sprite.frames.length];
    const backgroundX = -(frameWidth * renderScale * frame);
    const backgroundY = -(frameHeight * renderScale * sprite.row);

    spriteEl.style.backgroundPosition = `${backgroundX}px ${backgroundY}px`;
  }

  function pickBehavior(timestamp) {
    if (timestamp - lastBehaviorShiftAt < 2200) {
      return;
    }

    const stationaryFor = timestamp - lastMouseMoveAt;
    const roll = Math.random();

    if (stationaryFor > 2200) {
      behavior = roll < 0.5 ? "follow" : roll < 0.8 ? "hover" : "amble";
    } else {
      behavior = roll < followBias ? "follow" : roll < 0.92 ? "hover" : "amble";
    }

    hoverOffsetX = rand(-18, 18);
    hoverOffsetY = rand(-12, 12);
    lastBehaviorShiftAt = timestamp;
  }

  function cancelRest() {
    if (action?.type === "sleep" || action?.type === "dance") {
      action = null;
    }
  }

  function maybeStartRest(timestamp, distance) {
    const stationaryFor = timestamp - lastMouseMoveAt;

    if (action || distance > 8 || stationaryFor < 2800) {
      return;
    }

    const sleepChance = stationaryFor > 4200 ? 0.03 : 0.012;
    const danceChance = stationaryFor > 2600 ? 0.024 : 0.01;
    const roll = Math.random();

    if (roll < sleepChance) {
      action = {
        type: "sleep",
        startedAt: timestamp,
        endsAt: timestamp + rand(2600, 4200),
      };
      return;
    }

    if (roll < sleepChance + danceChance) {
      action = {
        type: "dance",
        startedAt: timestamp,
        endsAt: timestamp + rand(1500, 2400),
      };
    }
  }

  function maybeStartRandomThrow(timestamp) {
    if (action?.type === "throw" || timestamp < nextRandomThrowAt) {
      return;
    }

    const stationaryFor = timestamp - lastMouseMoveAt;
    const targetX =
      stationaryFor < 1500
        ? mouseX + rand(-10, 10)
        : posX + facing * rand(30, 80);
    const targetY =
      stationaryFor < 1500 ? mouseY + rand(-10, 10) : posY + rand(-24, 12);

    startThrow(targetX, targetY, timestamp, true);
  }

  function configureProjectile(projectileEl) {
    projectileEl.style.position = "fixed";
    projectileEl.style.pointerEvents = "none";
    projectileEl.style.zIndex = "2147483646";
    projectileEl.style.transformOrigin = "50% 50%";
    projectileEl.style.willChange = "transform";
    projectileEl.style.width = "2px";
    projectileEl.style.height = "2px";
    projectileEl.style.borderRadius =
      currentTheme === "dark" ? "999px" : "55% 45% 60% 40%";
    projectileEl.style.background =
      currentTheme === "dark"
        ? "radial-gradient(circle at 35% 35%, #ffffff 0 30%, #dbeafe 52%, #93c5fd 100%)"
        : "linear-gradient(135deg, #f8d18a 0%, #dd7a25 58%, #7c3f18 100%)";
    projectileEl.style.boxShadow =
      currentTheme === "dark"
        ? "0 0 14px rgba(191, 219, 254, 0.9)"
        : "0 0 12px rgba(251, 146, 60, 0.45)";
  }

  function spawnProjectile(targetX, targetY) {
    const projectileEl = document.createElement("div");
    configureProjectile(projectileEl);
    document.body.appendChild(projectileEl);

    const startX = posX + facing * 2;
    const startY = posY - 1;
    const diffX = targetX - startX;
    const diffY = targetY - startY;
    const distance = Math.max(1, Math.hypot(diffX, diffY));
    const speed = currentTheme === "dark" ? 1.6 : 1.3;

    projectiles.push({
      el: projectileEl,
      x: startX,
      y: startY,
      vx: (diffX / distance) * speed + facing * 0.2,
      vy: (diffY / distance) * speed - 0.35,
      gravity: currentTheme === "dark" ? 0.009 : 0.006,
      rotation: rand(0, 360),
      rotationSpeed: currentTheme === "dark" ? 4 : 6,
      bornAt: now(),
    });
  }

  function scheduleNextThrow(timestamp) {
    nextRandomThrowAt = timestamp + rand(2600, 6200);
  }

  function startThrow(targetX, targetY, timestamp, randomTrigger) {
    if (timestamp - lastThrowAt < 1250) {
      return;
    }

    cancelRest();
    action = {
      type: "throw",
      startedAt: timestamp,
      released: false,
      targetX,
      targetY,
      randomTrigger,
    };
    lastThrowAt = timestamp;
    scheduleNextThrow(timestamp);
  }

  function handleThrow(timestamp) {
    if (action?.type !== "throw") {
      return;
    }

    const elapsed = timestamp - action.startedAt;

    if (!action.released && elapsed >= 170) {
      spawnProjectile(action.targetX, action.targetY);
      action.released = true;
    }

    if (elapsed >= 520) {
      const fromRandomThrow = action.randomTrigger;
      action = null;

      if (fromRandomThrow && Math.random() < 0.34) {
        action = {
          type: "dance",
          startedAt: timestamp,
          endsAt: timestamp + rand(1100, 1900),
        };
      }
    }
  }

  function updateProjectiles(delta) {
    for (let index = projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = projectiles[index];
      const step = delta / 16.67;

      projectile.vy += projectile.gravity * delta;
      projectile.x += projectile.vx * step;
      projectile.y += projectile.vy * step;
      projectile.rotation += projectile.rotationSpeed * step;

      projectile.el.style.transform = `translate3d(${projectile.x}px, ${projectile.y}px, 0) rotate(${projectile.rotation}deg)`;

      const outsideViewport =
        projectile.x < -40 ||
        projectile.x > window.innerWidth + 40 ||
        projectile.y < -40 ||
        projectile.y > window.innerHeight + 40;

      if (outsideViewport || now() - projectile.bornAt > 2600) {
        projectile.el.remove();
        projectiles.splice(index, 1);
      }
    }
  }

  function getTarget(timestamp) {
    if (behavior === "follow") {
      return {
        x: mouseX + Math.sin(timestamp / 620) * 0.8,
        y: mouseY + 2 + Math.cos(timestamp / 760) * 0.6,
      };
    }

    if (behavior === "hover") {
      return {
        x: mouseX + hoverOffsetX + Math.sin(timestamp / 920) * 2,
        y: mouseY + hoverOffsetY + Math.cos(timestamp / 1020) * 1.5,
      };
    }

    return {
      x: mouseX + hoverOffsetX * 0.1 + Math.sin(timestamp / 1120) * 4,
      y: mouseY + hoverOffsetY * 0.1 + Math.cos(timestamp / 1260) * 2.5,
    };
  }

  function moveCompanion(target, delta) {
    const diffX = target.x - posX;
    const diffY = target.y - posY;
    const distance = Math.hypot(diffX, diffY);
    const resting = action?.type === "sleep" || action?.type === "dance";
    let moving = false;

    if (!resting && distance > 4) {
      const speed = (action?.type === "throw" ? 5.5 : 6.7) * (delta / 16.67);
      const step = Math.min(speed, distance);

      posX += (diffX / distance) * step;
      posY += (diffY / distance) * step;
      moving = true;

      if (Math.abs(diffX) > 1.5) {
        facing = diffX >= 0 ? 1 : -1;
      }
    }

    posX = clamp(
      posX,
      renderWidth * 0.5,
      window.innerWidth - renderWidth * 0.5,
    );
    posY = clamp(
      posY,
      renderHeight * 0.5,
      window.innerHeight - renderHeight * 0.5,
    );

    return { moving, distance };
  }

  function updateActionState(timestamp, distance) {
    if (action?.type === "sleep" || action?.type === "dance") {
      if (timestamp > action.endsAt) {
        action = null;
      }
      return;
    }

    maybeStartRest(timestamp, distance);
  }

  function render(timestamp, moving) {
    if (action?.type === "throw") {
      setFrame("throw", timestamp - action.startedAt);
    } else if (action?.type === "sleep") {
      setFrame("sleep", timestamp - action.startedAt);
    } else if (action?.type === "dance") {
      setFrame("dance", timestamp - action.startedAt);
    } else if (moving) {
      setFrame("glide", timestamp);
    } else {
      setFrame("idle", timestamp);
    }

    companionEl.style.transform = `translate3d(${posX - renderWidth * 0.5}px, ${posY - renderHeight * 0.5}px, 0)`;
    spriteEl.style.transform =
      facing === 1
        ? "translateX(0px) scaleX(1)"
        : `translateX(${renderWidth}px) scaleX(-1)`;
  }

  function step(timestamp) {
    if (!lastTimestamp) {
      lastTimestamp = timestamp;
    }

    const delta = Math.min(32, timestamp - lastTimestamp);
    lastTimestamp = timestamp;

    pickBehavior(timestamp);
    maybeStartRandomThrow(timestamp);
    handleThrow(timestamp);

    if (
      timestamp - lastMouseMoveAt < 220 &&
      (action?.type === "sleep" || action?.type === "dance")
    ) {
      action = null;
    }

    const target = getTarget(timestamp);
    const { moving, distance } = moveCompanion(target, delta);
    updateActionState(timestamp, distance);
    updateProjectiles(delta);
    render(timestamp, moving);

    animationFrameId = window.requestAnimationFrame(step);
  }

  function handleMouseMove(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;

    if (
      Math.abs(mouseX - lastMouseX) > 2 ||
      Math.abs(mouseY - lastMouseY) > 2
    ) {
      lastMouseMoveAt = now();
      lastMouseX = mouseX;
      lastMouseY = mouseY;
    }
  }

  function handleClick(event) {
    startThrow(event.clientX, event.clientY, now(), false);
  }

  function handleResize() {
    posX = clamp(
      posX,
      renderWidth * 0.5,
      window.innerWidth - renderWidth * 0.5,
    );
    posY = clamp(
      posY,
      renderHeight * 0.5,
      window.innerHeight - renderHeight * 0.5,
    );
  }

  function init() {
    companionEl.id = "seasonal-companion";
    companionEl.ariaHidden = true;
    companionEl.style.position = "fixed";
    companionEl.style.left = "0";
    companionEl.style.top = "0";
    companionEl.style.width = `${renderWidth}px`;
    companionEl.style.height = `${renderHeight}px`;
    companionEl.style.pointerEvents = "none";
    companionEl.style.zIndex = "2147483647";
    companionEl.style.willChange = "transform";

    spriteEl.style.width = `${renderWidth}px`;
    spriteEl.style.height = `${renderHeight}px`;
    spriteEl.style.backgroundRepeat = "no-repeat";
    spriteEl.style.backgroundSize = `${sheetWidth * renderScale}px ${sheetHeight * renderScale}px`;
    spriteEl.style.imageRendering = "pixelated";
    spriteEl.style.transformOrigin = "0 0";
    spriteEl.style.willChange = "transform, background-position";

    companionEl.appendChild(spriteEl);
    document.body.appendChild(companionEl);

    setTheme();
    scheduleNextThrow(now());

    themeObserver = new MutationObserver(setTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("click", handleClick);
    window.addEventListener("resize", handleResize);

    window.__seasonalCompanionCleanup = function cleanupSeasonalCompanion() {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);
      themeObserver?.disconnect();

      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }

      for (const projectile of projectiles) {
        projectile.el.remove();
      }

      if (companionEl.isConnected) {
        companionEl.remove();
      }

      delete window.__seasonalCompanionCleanup;
    };

    animationFrameId = window.requestAnimationFrame(step);
  }

  init();
})();
