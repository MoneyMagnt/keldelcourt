const pageBody = document.body;
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");
const siteNav = document.querySelector(".site-nav");
const scrollProgress = document.querySelector(".scroll-progress");
const heroVideo = document.querySelector(".hero-video");
const desktopHeroMedia = window.matchMedia("(min-width: 1025px)");
const reducedMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");

function runOpeningIntro() {
  const introTemplate = `
    <div class="site-intro__media">
      <img src="assets/hero-exterior.png" alt="KelDel Court exterior" width="1536" height="1009">
    </div>
    <div class="site-intro__inner">
      <div class="site-intro__line site-intro__line--top"></div>
      <div class="site-intro__brand">
        <span>Kel</span><span>Del</span>
      </div>
      <div class="site-intro__name">Court</div>
      <div class="site-intro__caption">Luxury Residences &middot; Westlands, Accra</div>
      <div class="site-intro__line site-intro__line--bottom"></div>
    </div>
    <div class="site-intro__count">
      <span class="site-intro__count-value">00</span>
      <span>Opening the residence</span>
    </div>
    <div class="site-intro__progress"><span></span></div>
  `;
  let intro = document.querySelector(".site-intro");

  if (reducedMotionMedia.matches) {
    intro?.remove();
    pageBody.classList.add("is-loaded", "intro-complete");
    return;
  }

  if (!intro) {
    intro = document.createElement("div");
    intro.className = "site-intro";
    intro.setAttribute("aria-hidden", "true");
    intro.innerHTML = introTemplate;
    pageBody.prepend(intro);
  }

  pageBody.classList.add("intro-active");
  const countValue = intro.querySelector(".site-intro__count-value");
  const progressBar = intro.querySelector(".site-intro__progress span");
  const introStartedAt = window.performance.now();
  const introCountDuration = 1550;

  function updateIntroCount(now) {
    if (!intro.isConnected || intro.classList.contains("is-exiting")) {
      return;
    }

    const progress = Math.min(1, (now - introStartedAt) / introCountDuration);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const count = Math.round(easedProgress * 100);

    if (countValue) {
      countValue.textContent = String(count).padStart(2, "0");
    }

    if (progressBar) {
      progressBar.style.transform = `scaleX(${easedProgress})`;
    }

    if (progress < 1) {
      window.requestAnimationFrame(updateIntroCount);
    }
  }

  requestAnimationFrame(() => {
    intro.classList.add("is-ready");
    window.requestAnimationFrame(updateIntroCount);
  });

  window.setTimeout(() => {
    pageBody.classList.add("is-loaded");
    intro.classList.add("is-exiting");
  }, 1650);

  window.setTimeout(() => {
    intro.remove();
    pageBody.classList.remove("intro-active");
    pageBody.classList.add("intro-complete");
  }, 2400);
}

runOpeningIntro();

function updateScrollEffects() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const scrollRatio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
  const heroProgress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight)));

  siteNav?.classList.toggle("is-scrolled", window.scrollY > 12);
  pageBody.style.setProperty("--hero-scroll", heroProgress.toFixed(4));

  if (scrollProgress) {
    scrollProgress.style.transform = `scaleX(${scrollRatio})`;
  }
}

updateScrollEffects();
window.addEventListener("scroll", updateScrollEffects, { passive: true });
window.addEventListener("resize", updateScrollEffects);

function closeMenu() {
  if (!navToggle || !navMenu) {
    return;
  }

  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open navigation");
  navMenu.classList.remove("is-open");
  pageBody.classList.remove("menu-open");
}

function openMenu() {
  if (!navToggle || !navMenu) {
    return;
  }

  navToggle.setAttribute("aria-expanded", "true");
  navToggle.setAttribute("aria-label", "Close navigation");
  navMenu.classList.add("is-open");
  pageBody.classList.add("menu-open");
}

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";

    if (isOpen) {
      closeMenu();
      return;
    }

    openMenu();
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

document.querySelectorAll("[data-scroll-target]").forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    const selector = trigger.getAttribute("data-scroll-target");

    if (!selector) {
      return;
    }

    const target = document.querySelector(selector);

    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    closeMenu();
  });
});

const salesWhatsAppNumber = "233244165817";
const salesEmail = "delalikekeli0@gmail.com";

function trackSiteEvent(eventName, params = {}) {
  if (!eventName) {
    return;
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }

  if (typeof window.plausible === "function") {
    window.plausible(eventName, {
      props: params,
    });
  }
}

document.querySelectorAll("[data-track-click]").forEach((target) => {
  target.addEventListener("click", () => {
    trackSiteEvent(target.dataset.trackClick, {
      label: target.textContent?.replace(/\s+/g, " ").trim() || target.href || "",
      path: window.location.pathname,
    });
  });
});

function buildViewingMessage(form) {
  const formData = new FormData(form);
  const getValue = (name) => String(formData.get(name) || "").trim();

  const lines = [
    "Hi, I am interested in KelDel Court.",
    "",
    `Name: ${getValue("name")}`,
    `Phone / WhatsApp: ${getValue("phone")}`,
  ];

  if (getValue("email")) {
    lines.push(`Email: ${getValue("email")}`);
  }

  lines.push(`Preferred timing: ${getValue("timeframe") || "Not specified"}`);
  lines.push(`Request: ${getValue("interest") || "Private site visit"}`);

  if (getValue("message")) {
    lines.push("");
    lines.push(`Notes: ${getValue("message")}`);
  }

  lines.push("");
  lines.push("Please send the floor plans, current pricing, and available times for a private site visit.");

  return lines.join("\n");
}

function setFormStatus(form, message, isError = false) {
  const status = form.querySelector("[data-form-status]");

  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function isValidPhoneNumber(value) {
  const trimmedValue = String(value || "").trim();

  if (!trimmedValue) {
    return false;
  }

  if (!/^\+?[0-9() .-]+$/.test(trimmedValue)) {
    return false;
  }

  const digits = trimmedValue.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

function validateViewingForm(form) {
  const phoneInput = form.querySelector('input[name="phone"]');

  if (phoneInput) {
    phoneInput.setCustomValidity("");

    if (phoneInput.value && !isValidPhoneNumber(phoneInput.value)) {
      phoneInput.setCustomValidity("Enter a valid phone or WhatsApp number.");
    }
  }

  if (!form.checkValidity()) {
    form.reportValidity();
    setFormStatus(form, "Please add your name and a valid phone number first.", true);
    return false;
  }

  return true;
}

function openWhatsAppWithMessage(message) {
  const url = `https://wa.me/${salesWhatsAppNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");
}

function openEmailWithMessage(message) {
  const subject = "KelDel Court Private Site Visit Request";
  const url = `mailto:${salesEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  window.location.href = url;
}

document.querySelectorAll("[data-viewing-form]").forEach((form) => {
  const phoneInput = form.querySelector('input[name="phone"]');

  phoneInput?.addEventListener("input", () => {
    phoneInput.setCustomValidity("");
    setFormStatus(form, "");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateViewingForm(form)) {
      return;
    }

    const message = buildViewingMessage(form);
    setFormStatus(form, "Opening WhatsApp with your site visit request...");
    trackSiteEvent("viewing_form_submit", {
      method: "whatsapp",
      path: window.location.pathname,
    });
    openWhatsAppWithMessage(message);
  });

  form.querySelectorAll("[data-email-request]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!validateViewingForm(form)) {
        return;
      }

      const message = buildViewingMessage(form);
      setFormStatus(form, "Opening your email app with the site visit request...");
      trackSiteEvent("viewing_form_submit", {
        method: "email",
        path: window.location.pathname,
      });
      openEmailWithMessage(message);
    });
  });
});

const floorTabs = Array.from(document.querySelectorAll(".ftab[data-floor-target]"));
const floorPanels = Array.from(document.querySelectorAll("[data-floor-panel]"));
const floorVideos = Array.from(document.querySelectorAll(".floor-video"));

function ensureVideoSource(video) {
  if (!video) {
    return false;
  }

  if (video.currentSrc || video.getAttribute("src")) {
    return true;
  }

  const deferredSource = video.dataset.src;

  if (!deferredSource) {
    return false;
  }

  video.setAttribute("src", deferredSource);
  return true;
}

function startVideoPlayback(video, { resetToStart = false } = {}) {
  if (!ensureVideoSource(video)) {
    return;
  }

  const play = () => {
    if (resetToStart && video.readyState >= 1 && video.currentTime > 0.2) {
      try {
        video.currentTime = 0;
      } catch (error) {}
    }

    const playAttempt = video.play();

    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.catch(() => {});
    }
  };

  if (video.readyState >= 2) {
    play();
    return;
  }

  video.load();
  video.addEventListener("loadeddata", play, { once: true });
  video.addEventListener("canplay", play, { once: true });
}

function playHeroVideo() {
  if (
    !heroVideo ||
    desktopHeroMedia.matches ||
    reducedMotionMedia.matches
  ) {
    return;
  }

  heroVideo.muted = true;
  heroVideo.playsInline = true;
  heroVideo.autoplay = true;
  heroVideo.loop = true;

  startVideoPlayback(heroVideo);
}

function stopFloorVideo(video) {
  video.pause();

  if (video.readyState >= 1) {
    try {
      video.currentTime = 0;
    } catch (error) {}
  }
}

function playFloorVideo(video) {
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.loop = true;
  startVideoPlayback(video, { resetToStart: true });
}

function syncFloorVideos(activeFloorId) {
  floorVideos.forEach((video) => {
    const panel = video.closest("[data-floor-panel]");
    const isActive = panel?.dataset.floorPanel === activeFloorId;

    if (!isActive) {
      stopFloorVideo(video);
      return;
    }

    playFloorVideo(video);
  });
}

function activateFloor(floorId, shouldFocus = false) {
  floorTabs.forEach((tab) => {
    const isActive = tab.dataset.floorTarget === floorId;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;

    if (isActive && shouldFocus) {
      tab.focus();
    }
  });

  floorPanels.forEach((panel) => {
    const isActive = panel.dataset.floorPanel === floorId;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });

  syncFloorVideos(floorId);
}

if (floorTabs.length > 0 && floorPanels.length > 0) {
  const moveFloorFocus = (currentTab, direction) => {
    const currentIndex = floorTabs.indexOf(currentTab);
    const nextIndex = (currentIndex + direction + floorTabs.length) % floorTabs.length;
    activateFloor(floorTabs[nextIndex].dataset.floorTarget, true);
  };

  floorTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activateFloor(tab.dataset.floorTarget);
    });

    tab.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          moveFloorFocus(tab, 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          moveFloorFocus(tab, -1);
          break;
        case "Home":
          event.preventDefault();
          activateFloor(floorTabs[0].dataset.floorTarget, true);
          break;
        case "End":
          event.preventDefault();
          activateFloor(floorTabs[floorTabs.length - 1].dataset.floorTarget, true);
          break;
        default:
          break;
      }
    });
  });

  const activeTab = floorTabs.find((tab) => tab.classList.contains("active")) || floorTabs[0];
  activateFloor(activeTab.dataset.floorTarget);
}

if (heroVideo) {
  const heroSection = heroVideo.closest(".hero");

  if ("IntersectionObserver" in window && heroSection) {
    const heroObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          playHeroVideo();
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.35,
      }
    );

    heroObserver.observe(heroSection);
  } else {
    window.addEventListener("load", playHeroVideo, { once: true });
  }
}

if (heroVideo) {
  const handleHeroMediaChange = () => {
    if (desktopHeroMedia.matches) {
      heroVideo.pause();
      return;
    }

    playHeroVideo();
  };

  if (typeof desktopHeroMedia.addEventListener === "function") {
    desktopHeroMedia.addEventListener("change", handleHeroMediaChange);
  } else if (typeof desktopHeroMedia.addListener === "function") {
    desktopHeroMedia.addListener(handleHeroMediaChange);
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") {
    heroVideo?.pause();
    floorVideos.forEach((video) => {
      video.pause();
    });
    return;
  }

  playHeroVideo();

  const activePanel = floorPanels.find((panel) => !panel.hidden);

  if (activePanel) {
    syncFloorVideos(activePanel.dataset.floorPanel);
  }
});

const sliderTrack = document.getElementById("sliderTrack");
const sliderPrev = document.getElementById("sliderPrev");
const sliderNext = document.getElementById("sliderNext");
const sliderDots = Array.from(document.querySelectorAll(".sdot[data-slide]"));

if (sliderTrack && sliderDots.length > 0) {
  const slides = Array.from(sliderTrack.querySelectorAll(".slide"));
  let activeSlideIndex = 0;
  let isSliderTicking = false;

  slides.forEach((slide, index) => {
    slide.id = slide.id || `showcase-slide-${index + 1}`;
  });

  const getSlideLabel = (slide, index) => {
    const rawLabel = slide
      ?.querySelector(".slide-name")
      ?.textContent?.replace(/\s+/g, " ")
      .trim();

    return rawLabel || `Showcase slide ${index + 1}`;
  };

  sliderDots.forEach((dot, index) => {
    dot.setAttribute("aria-label", getSlideLabel(slides[index], index));
  });

  const clampSlideIndex = (index) => {
    return Math.max(0, Math.min(index, slides.length - 1));
  };

  const updateSliderState = (index) => {
    activeSlideIndex = clampSlideIndex(index);

    sliderDots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeSlideIndex;
      dot.classList.toggle("active", isActive);
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-selected", String(isActive));
      dot.setAttribute("aria-controls", slides[dotIndex]?.id || "");
      dot.tabIndex = isActive ? 0 : -1;
    });

    if (sliderPrev) {
      sliderPrev.disabled = activeSlideIndex === 0;
    }

    if (sliderNext) {
      sliderNext.disabled = activeSlideIndex === slides.length - 1;
    }
  };

  const goToSlide = (index, behavior = "smooth") => {
    const nextIndex = clampSlideIndex(index);
    const targetSlide = slides[nextIndex];

    if (!targetSlide) {
      return;
    }

    sliderTrack.scrollTo({
      left: targetSlide.offsetLeft,
      behavior,
    });
    updateSliderState(nextIndex);
  };

  const getClosestSlideIndex = () => {
    const trackCenter = sliderTrack.scrollLeft + sliderTrack.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(slideCenter - trackCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  };

  sliderTrack.addEventListener(
    "scroll",
    () => {
      if (isSliderTicking) {
        return;
      }

      isSliderTicking = true;

      window.requestAnimationFrame(() => {
        updateSliderState(getClosestSlideIndex());
        isSliderTicking = false;
      });
    },
    { passive: true }
  );

  sliderDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      goToSlide(Number(dot.dataset.slide));
    });

    dot.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          goToSlide(activeSlideIndex + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          goToSlide(activeSlideIndex - 1);
          break;
        case "Home":
          event.preventDefault();
          goToSlide(0);
          break;
        case "End":
          event.preventDefault();
          goToSlide(slides.length - 1);
          break;
        default:
          break;
      }
    });
  });

  sliderPrev?.addEventListener("click", () => {
    goToSlide(activeSlideIndex - 1);
  });

  sliderNext?.addEventListener("click", () => {
    goToSlide(activeSlideIndex + 1);
  });

  window.addEventListener("resize", () => {
    goToSlide(activeSlideIndex, "auto");
  });

  updateSliderState(0);
}

const directionsLinks = document.querySelectorAll(".dir-link");

if (directionsLinks.length > 0) {
  const coordinates = "5.649528560706075,-0.21232092054914734";
  const googleDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coordinates}`;
  const appleDirectionsUrl = `https://maps.apple.com/?daddr=${coordinates}&dirflg=d`;
  const isIOSDevice = /iPad|iPhone|iPod/i.test(window.navigator.userAgent);

  directionsLinks.forEach((link) => {
    link.setAttribute("href", googleDirectionsUrl);

    link.addEventListener("click", (event) => {
      const isCompactViewport = window.matchMedia("(max-width: 768px)").matches;

      if (!isCompactViewport && !isIOSDevice) {
        return;
      }

      event.preventDefault();
      window.location.href = isIOSDevice ? appleDirectionsUrl : googleDirectionsUrl;
    });
  });
}

const revealTargets = Array.from(document.querySelectorAll("[data-reveal]"));

if ("IntersectionObserver" in window && revealTargets.length > 0) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  revealTargets.forEach((target) => {
    revealObserver.observe(target);
  });
} else {
  revealTargets.forEach((target) => {
    target.classList.add("is-visible");
  });
}

const motionImageTargets = Array.from(
  document.querySelectorAll(".img-stack > img, .vcard-img, .slide-img, .scan-preview, .tour-card")
);

if (!reducedMotionMedia.matches && "IntersectionObserver" in window && motionImageTargets.length > 0) {
  pageBody.classList.add("motion-images-ready");

  const imageRevealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-motion-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  motionImageTargets.forEach((target, index) => {
    target.classList.add("motion-image");
    target.style.setProperty("--motion-delay", `${Math.min(index % 3, 2) * 90}ms`);
    imageRevealObserver.observe(target);
  });
}

const tiltTargets = Array.from(document.querySelectorAll("[data-tilt]"));
const canUseTilt =
  tiltTargets.length > 0 &&
  !reducedMotionMedia.matches &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (canUseTilt) {
  tiltTargets.forEach((target) => {
    target.addEventListener("pointermove", (event) => {
      const bounds = target.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      const depth = target.classList.contains("hero-right") || target.classList.contains("scan-preview") ? 5 : 2.5;

      target.style.setProperty("--tilt-x", `${(-y * depth).toFixed(2)}deg`);
      target.style.setProperty("--tilt-y", `${(x * depth).toFixed(2)}deg`);
      target.style.setProperty("--tilt-glow-x", `${((x + 0.5) * 100).toFixed(0)}%`);
      target.style.setProperty("--tilt-glow-y", `${((y + 0.5) * 100).toFixed(0)}%`);
      target.classList.add("is-tilting");
    });

    target.addEventListener("pointerleave", () => {
      target.classList.remove("is-tilting");
      target.style.setProperty("--tilt-x", "0deg");
      target.style.setProperty("--tilt-y", "0deg");
    });
  });
}
