const pageBody = document.body;
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

function closeMenu() {
  if (!menuToggle || !siteNav) {
    return;
  }

  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  siteNav.classList.remove("is-open");
  pageBody.classList.remove("menu-open");
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    siteNav.classList.toggle("is-open", !isOpen);
    pageBody.classList.toggle("menu-open", !isOpen);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
}

function setupTabs(groupName) {
  const group = document.querySelector(`[data-tab-group="${groupName}"]`);

  if (!group) {
    return;
  }

  const tabs = Array.from(group.querySelectorAll("[role='tab']"));
  const panels = Array.from(group.querySelectorAll("[role='tabpanel']"));

  const activateTab = (tabId, shouldFocus = false) => {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.tab === tabId;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;

      if (isActive && shouldFocus) {
        tab.focus();
      }
    });

    panels.forEach((panel) => {
      const isActive = panel.dataset.panel === tabId;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
  };

  const moveFocus = (currentTab, direction) => {
    const currentIndex = tabs.indexOf(currentTab);
    const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
    activateTab(tabs[nextIndex].dataset.tab, true);
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tab));

    tab.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          moveFocus(tab, 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          moveFocus(tab, -1);
          break;
        case "Home":
          event.preventDefault();
          activateTab(tabs[0].dataset.tab, true);
          break;
        case "End":
          event.preventDefault();
          activateTab(tabs[tabs.length - 1].dataset.tab, true);
          break;
        default:
          break;
      }
    });
  });
}

function setupZoneOverviews() {
  document.querySelectorAll(".space-overview").forEach((overview) => {
    const pills = Array.from(overview.querySelectorAll("[data-zone-target]"));
    const details = Array.from(overview.querySelectorAll("[data-zone-detail]"));

    if (!pills.length || !details.length) {
      return;
    }

    const showDetail = (detailId) => {
      pills.forEach((pill) => {
        const isActive = pill.dataset.zoneTarget === detailId;
        pill.classList.toggle("is-active", isActive);
        pill.setAttribute("aria-pressed", String(isActive));
      });

      details.forEach((detail) => {
        const isActive = detail.id === detailId;
        detail.classList.toggle("is-visible", isActive);
        detail.hidden = !isActive;
      });
    };

    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        showDetail(pill.dataset.zoneTarget);
      });
    });

    const initialPill = pills.find((pill) => pill.classList.contains("is-active")) || pills[0];
    showDetail(initialPill.dataset.zoneTarget);
  });
}

function setupShowcaseSlider() {
  const showcaseTrack = document.getElementById("showcase-track");

  if (!showcaseTrack) {
    return;
  }

  const slides = Array.from(showcaseTrack.querySelectorAll(".slide"));
  const dots = Array.from(document.querySelectorAll("[data-slide-dot]"));
  const prevButton = document.querySelector("[data-slider-nav='prev']");
  const nextButton = document.querySelector("[data-slider-nav='next']");
  let activeIndex = 0;

  const updateControls = (index) => {
    activeIndex = index;

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-selected", String(isActive));
    });

    if (prevButton) {
      prevButton.disabled = activeIndex === 0;
      prevButton.style.opacity = activeIndex === 0 ? "0.35" : "1";
    }

    if (nextButton) {
      nextButton.disabled = activeIndex === slides.length - 1;
      nextButton.style.opacity = activeIndex === slides.length - 1 ? "0.35" : "1";
    }
  };

  const goToSlide = (index, behavior = "smooth") => {
    const nextIndex = Math.max(0, Math.min(index, slides.length - 1));
    showcaseTrack.scrollTo({
      left: nextIndex * showcaseTrack.clientWidth,
      behavior,
    });
    updateControls(nextIndex);
  };

  let scrollTimer;

  showcaseTrack.addEventListener(
    "scroll",
    () => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        const nextIndex = Math.round(showcaseTrack.scrollLeft / showcaseTrack.clientWidth);
        updateControls(nextIndex);
      }, 70);
    },
    { passive: true }
  );

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      goToSlide(Number(dot.dataset.slideDot || 0));
    });
  });

  prevButton?.addEventListener("click", () => {
    goToSlide(activeIndex - 1);
  });

  nextButton?.addEventListener("click", () => {
    goToSlide(activeIndex + 1);
  });

  window.addEventListener("resize", () => {
    goToSlide(activeIndex, "auto");
  });

  updateControls(0);
}

setupTabs("floors");
setupZoneOverviews();
setupShowcaseSlider();

const revealTargets = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window && revealTargets.length > 0) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add("in-view"));
}

const galleryDialog = document.getElementById("gallery-dialog");
const galleryItems = Array.from(document.querySelectorAll("[data-gallery-item]"));
const lightboxImage = document.getElementById("lightbox-image");
const lightboxTitle = document.getElementById("lightbox-title");
const lightboxMeta = document.getElementById("lightbox-meta");
const lightboxNavButtons = document.querySelectorAll("[data-lightbox-nav]");
const lightboxCloseButton = document.querySelector("[data-lightbox-close]");
let activeGalleryIndex = 0;

function renderLightbox(index) {
  if (!galleryItems.length) {
    return;
  }

  activeGalleryIndex = (index + galleryItems.length) % galleryItems.length;
  const activeItem = galleryItems[activeGalleryIndex];

  if (lightboxImage) {
    lightboxImage.src = activeItem.dataset.image || "";
    lightboxImage.alt = activeItem.dataset.title || "Gallery image";
  }

  if (lightboxTitle) {
    lightboxTitle.textContent = activeItem.dataset.title || "Gallery image";
  }

  if (lightboxMeta) {
    lightboxMeta.textContent = activeItem.dataset.meta || "";
  }
}

function openLightbox(index) {
  if (!galleryDialog) {
    return;
  }

  renderLightbox(index);
  pageBody.classList.add("dialog-open");

  if (typeof galleryDialog.showModal === "function") {
    galleryDialog.showModal();
  } else {
    galleryDialog.setAttribute("open", "open");
  }
}

function closeLightbox() {
  if (!galleryDialog) {
    return;
  }

  pageBody.classList.remove("dialog-open");

  if (galleryDialog.open && typeof galleryDialog.close === "function") {
    galleryDialog.close();
  } else {
    galleryDialog.removeAttribute("open");
  }
}

galleryItems.forEach((item, index) => {
  item.addEventListener("click", () => openLightbox(index));
});

lightboxNavButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const direction = button.dataset.lightboxNav === "next" ? 1 : -1;
    renderLightbox(activeGalleryIndex + direction);
  });
});

lightboxCloseButton?.addEventListener("click", closeLightbox);

if (galleryDialog) {
  galleryDialog.addEventListener("close", () => {
    pageBody.classList.remove("dialog-open");
  });

  galleryDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeLightbox();
  });

  galleryDialog.addEventListener("click", (event) => {
    const bounds = galleryDialog.getBoundingClientRect();
    const isInsideDialog =
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom;

    if (!isInsideDialog) {
      closeLightbox();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (!galleryDialog || !galleryDialog.open) {
    return;
  }

  if (event.key === "Escape") {
    closeLightbox();
  }

  if (event.key === "ArrowRight") {
    renderLightbox(activeGalleryIndex + 1);
  }

  if (event.key === "ArrowLeft") {
    renderLightbox(activeGalleryIndex - 1);
  }
});

const interestForm = document.getElementById("interest-form");
const formFeedback = document.getElementById("form-feedback");

if (interestForm && formFeedback) {
  interestForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!interestForm.reportValidity()) {
      return;
    }

    if (window.location.protocol === "file:") {
      formFeedback.dataset.state = "error";
      formFeedback.textContent =
        "Serve or deploy this project from a web server before testing live submissions. The API route is not available from a file preview.";
      return;
    }

    const formData = new FormData(interestForm);
    const submitButton = interestForm.querySelector("button[type='submit']");
    const originalLabel = submitButton ? submitButton.textContent : "";
    const payload = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      enquiryType: formData.get("enquiryType"),
      message: formData.get("message"),
    };

    formFeedback.textContent = "";
    formFeedback.dataset.state = "";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    try {
      const response = await fetch(interestForm.action || "/api/enquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({
        ok: false,
        message: "The server returned an unreadable response.",
      }));

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "The enquiry could not be sent right now.");
      }

      formFeedback.dataset.state = "success";
      formFeedback.textContent = result.message || "Thank you. Your enquiry has been sent.";
      interestForm.reset();
    } catch (error) {
      formFeedback.dataset.state = "error";
      formFeedback.textContent =
        error instanceof Error ? error.message : "The enquiry could not be sent right now. Please try again.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    }
  });
}

document.querySelectorAll("[data-copy-text]").forEach((button) => {
  button.addEventListener("click", async () => {
    const originalText = button.textContent;
    const copyText = button.dataset.copyText || "";

    try {
      await navigator.clipboard.writeText(copyText);
      button.textContent = "Address copied";
    } catch (error) {
      button.textContent = "Copy unavailable";
    }

    window.setTimeout(() => {
      button.textContent = originalText;
    }, 1800);
  });
});

document.querySelectorAll("[data-directions-link]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (!isMobile) {
      return;
    }

    const latitude = link.dataset.lat;
    const longitude = link.dataset.lng;

    if (!latitude || !longitude) {
      return;
    }

    event.preventDefault();
    window.location.href = `geo:${latitude},${longitude}?q=${latitude},${longitude}(KelDel Court)`;
    window.setTimeout(() => {
      window.open(link.href, "_blank", "noopener");
    }, 500);
  });
});

const yearNode = document.getElementById("current-year");

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}
