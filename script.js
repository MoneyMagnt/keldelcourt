const pageBody = document.body;
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");

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

const floorTabs = Array.from(document.querySelectorAll(".ftab[data-floor-target]"));
const floorPanels = Array.from(document.querySelectorAll("[data-floor-panel]"));

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

const form = document.getElementById("interestForm");
const formSubmitButton = document.getElementById("formSubmit");
const formStatus = document.getElementById("formStatus");

if (form && formSubmitButton && formStatus) {
  let statusTimer = null;

  const clearStatusTimer = () => {
    if (statusTimer) {
      window.clearTimeout(statusTimer);
      statusTimer = null;
    }
  };

  const setFormState = (state) => {
    formSubmitButton.disabled = state === "busy";
    formSubmitButton.setAttribute("aria-busy", String(state === "busy"));
    formSubmitButton.classList.toggle("is-error", state === "error");
    formSubmitButton.classList.toggle("is-success", state === "success");
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearStatusTimer();
    setFormState("idle");
    formStatus.textContent = "";

    if (typeof form.reportValidity === "function" && !form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);
    const payload = {
      firstName: String(formData.get("firstName") || "").trim(),
      lastName: String(formData.get("lastName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      enquiryType: String(formData.get("enquiryType") || "").trim(),
      message: String(formData.get("message") || "").trim(),
    };

    setFormState("busy");

    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "The enquiry could not be delivered right now. Please try again.");
      }

      form.reset();
      formStatus.textContent = data.message || "Thank you. Your enquiry has been sent to the KelDel Court team.";
      setFormState("success");

      statusTimer = window.setTimeout(() => {
        setFormState("idle");
      }, 2400);
    } catch (error) {
      formStatus.textContent =
        error instanceof Error && error.message
          ? error.message
          : "The enquiry could not be delivered right now. Please try again.";
      setFormState("error");

      statusTimer = window.setTimeout(() => {
        setFormState("idle");
      }, 1800);
    }
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
