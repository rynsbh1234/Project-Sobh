/* =============================================
   NEXFLOW AI — WAITLIST LOGIC
   =============================================
   Waitlist submissions are stored in localStorage for demo purposes.
   To wire up a real backend, replace the `submitToBackend` function below
   with a POST request to your API (e.g. Supabase, a Cloudflare Worker,
   Formspree, Resend, etc.).
   ============================================= */

(function () {
  "use strict";

  /* ---- Smooth nav active state ---- */
  const navLinks = document.querySelectorAll(".nav-links a");
  const sections = document.querySelectorAll("section[id]");

  function updateActiveLink() {
    let current = "";
    sections.forEach((s) => {
      const top = s.getBoundingClientRect().top;
      if (top <= 100) current = s.id;
    });
    navLinks.forEach((a) => {
      a.classList.toggle("active", a.getAttribute("href") === `#${current}`);
    });
  }
  window.addEventListener("scroll", updateActiveLink, { passive: true });

  /* ---- Nav shrink on scroll ---- */
  const nav = document.querySelector(".nav");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("nav--scrolled", window.scrollY > 40);
  }, { passive: true });

  /* ---- Waitlist form ---- */
  const form        = document.getElementById("waitlistForm");
  const submitBtn   = document.getElementById("submitBtn");
  const btnText     = submitBtn?.querySelector(".btn-text");
  const btnLoading  = submitBtn?.querySelector(".btn-loading");
  const successEl   = document.getElementById("waitlistSuccess");
  const positionEl  = document.getElementById("successPosition");

  if (!form) return;

  /* Count existing signups for position display */
  function getSignupCount() {
    const existing = JSON.parse(localStorage.getItem("nf_waitlist") || "[]");
    return existing.length;
  }

  /* Store signup locally */
  function saveLocally(entry) {
    const list = JSON.parse(localStorage.getItem("nf_waitlist") || "[]");
    list.push({ ...entry, ts: Date.now() });
    localStorage.setItem("nf_waitlist", JSON.stringify(list));
    return list.length;
  }

  async function submitToBackend(entry) {
    const res = await fetch("https://formspree.io/f/xykbvgkn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error("Submission failed");
  }

  /* Validate email */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  /* Show inline error */
  function setError(input, msg) {
    clearError(input);
    input.style.borderColor = "#f87171";
    const err = document.createElement("span");
    err.className = "field-error";
    err.textContent = msg;
    err.style.cssText = "font-size:0.75rem;color:#f87171;margin-top:4px;display:block;";
    input.parentNode.appendChild(err);
  }
  function clearError(input) {
    input.style.borderColor = "";
    const prev = input.parentNode.querySelector(".field-error");
    if (prev) prev.remove();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = form.querySelector("#firstName");
    const email     = form.querySelector("#email");
    const company   = form.querySelector("#company");
    const useCase   = form.querySelector("#useCase");

    /* Validate */
    let valid = true;
    clearError(firstName); clearError(email);

    if (!firstName.value.trim()) {
      setError(firstName, "Please enter your first name.");
      valid = false;
    }
    if (!isValidEmail(email.value)) {
      setError(email, "Please enter a valid email address.");
      valid = false;
    }
    if (!valid) return;

    /* Check for duplicate email */
    const existing = JSON.parse(localStorage.getItem("nf_waitlist") || "[]");
    if (existing.some((e) => e.email.toLowerCase() === email.value.trim().toLowerCase())) {
      setError(email, "You're already on the list! Check your inbox.");
      return;
    }

    /* Set loading state */
    submitBtn.disabled = true;
    btnText.hidden     = true;
    btnLoading.hidden  = false;

    const entry = {
      firstName: firstName.value.trim(),
      email:     email.value.trim().toLowerCase(),
      company:   company.value.trim() || null,
      useCase:   useCase.value || null,
    };

    try {
      await submitToBackend(entry);
      const position = saveLocally(entry);

      /* Show success */
      form.hidden               = true;
      successEl.hidden          = false;
      positionEl.textContent    = `You're #${position} on the waitlist.`;

      /* Scroll into view */
      successEl.scrollIntoView({ behavior: "smooth", block: "center" });

    } catch (err) {
      /* Re-enable form on error */
      submitBtn.disabled = false;
      btnText.hidden     = false;
      btnLoading.hidden  = true;

      const errMsg = document.createElement("p");
      errMsg.textContent = "Something went wrong. Please try again.";
      errMsg.style.cssText = "color:#f87171;font-size:0.82rem;text-align:center;margin-top:8px;";
      form.appendChild(errMsg);
      setTimeout(() => errMsg.remove(), 5000);
    }
  });

  /* ---- Restore success state if already signed up (page refresh) ---- */
  /* Intentionally not doing this — let users see the form again */

  /* ---- Animate elements in on scroll ---- */
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity   = "1";
            entry.target.style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document
      .querySelectorAll(".feature-card, .step, .testimonial-card, .pricing-card, .metric-card")
      .forEach((el) => {
        el.style.opacity   = "0";
        el.style.transform = "translateY(24px)";
        el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        observer.observe(el);
      });
  }

})();
