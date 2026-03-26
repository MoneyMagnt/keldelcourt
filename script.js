const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const pageBody = document.body;

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
    const nextTab = tabs[nextIndex];
    activateTab(nextTab.dataset.tab, true);
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activateTab(tab.dataset.tab);
    });

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

  group.querySelectorAll("[data-activate-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      activateTab(button.dataset.activateTab, true);
    });
  });
}

setupTabs("floors");

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
let activeGalleryIndex = 0;

function renderLightbox(index) {
  if (!galleryItems.length) {
    return;
  }

  activeGalleryIndex = (index + galleryItems.length) % galleryItems.length;
  const activeItem = galleryItems[activeGalleryIndex];
  const imageSrc = activeItem.dataset.image;
  const title = activeItem.dataset.title;
  const meta = activeItem.dataset.meta;

  if (lightboxImage) {
    lightboxImage.src = imageSrc;
    lightboxImage.alt = title;
  }

  if (lightboxTitle) {
    lightboxTitle.textContent = title;
  }

  if (lightboxMeta) {
    lightboxMeta.textContent = meta;
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
  item.addEventListener("click", () => {
    openLightbox(index);
  });
});

lightboxNavButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const direction = button.dataset.lightboxNav === "next" ? 1 : -1;
    renderLightbox(activeGalleryIndex + direction);
  });
});

if (galleryDialog) {
  galleryDialog.addEventListener("close", () => {
    pageBody.classList.remove("dialog-open");
  });

  galleryDialog.addEventListener("click", (event) => {
    const dialogBounds = galleryDialog.getBoundingClientRect();
    const isInsideDialog =
      event.clientX >= dialogBounds.left &&
      event.clientX <= dialogBounds.right &&
      event.clientY >= dialogBounds.top &&
      event.clientY <= dialogBounds.bottom;

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
      formFeedback.textContent =
        "Serve or deploy this project from a web server before testing live submissions. The API route is not available from a file:// preview.";
      return;
    }

    const formData = new FormData(interestForm);
    const firstName = formData.get("firstName");
    const submitButton = interestForm.querySelector("button[type='submit']");
    const originalButtonText = submitButton ? submitButton.textContent : "";
    const payload = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      enquiryType: formData.get("enquiryType"),
      message: formData.get("message"),
    };

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    formFeedback.textContent = "";

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

      formFeedback.textContent =
        result.message || `Thank you${firstName ? `, ${firstName}` : ""}. Your enquiry has been sent.`;
      interestForm.reset();
    } catch (error) {
      formFeedback.textContent =
        error instanceof Error ? error.message : "The enquiry could not be sent right now. Please try again.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
}

const yearNode = document.getElementById("current-year");

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

const copyRouteButton = document.querySelector("[data-copy-text]");

if (copyRouteButton) {
  copyRouteButton.addEventListener("click", async () => {
    const originalText = copyRouteButton.textContent;
    const textToCopy = copyRouteButton.dataset.copyText || "";

    try {
      await navigator.clipboard.writeText(textToCopy);
      copyRouteButton.textContent = "Address copied";
    } catch (error) {
      copyRouteButton.textContent = "Copy unavailable";
    }

    window.setTimeout(() => {
      copyRouteButton.textContent = originalText;
    }, 1800);
  });
}
