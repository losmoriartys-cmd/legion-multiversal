(() => {
  const forms = Array.from(document.querySelectorAll("form[data-contact-type]"));
  if (!forms.length) return;
  forms.forEach((form) => { const button = form.querySelector('button[type="submit"]'); if (button) button.disabled = true; });

  const statusFor = (form) => form.querySelector("[data-contact-status]");
  const submitFor = (form) => form.querySelector('button[type="submit"]');
  const setStatus = (form, message, state = "info") => {
    const node = statusFor(form);
    if (!node) return;
    node.textContent = message;
    node.dataset.state = state;
  };

  let turnstileReady;
  const loadTurnstile = () => {
    if (window.turnstile) return Promise.resolve();
    if (turnstileReady) return turnstileReady;
    turnstileReady = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return turnstileReady;
  };

  fetch("/api/contact", { headers: { accept: "application/json" }, cache: "no-store" })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error("config")))
    .then(async (config) => {
      if (!config.configured || !config.turnstileSiteKey) {
        forms.forEach((form) => {
          setStatus(form, "El envío seguro todavía no está habilitado. Este formulario no enviará ni guardará datos hasta completar la configuración del servicio.", "warning");
          const button = submitFor(form);
          if (button) button.disabled = true;
        });
        return;
      }

      await loadTurnstile();
      forms.forEach((form) => {
        const host = form.querySelector("[data-turnstile]");
        if (!host) return;
        const widgetId = window.turnstile.render(host, {
          sitekey: config.turnstileSiteKey,
          theme: "dark",
          callback: () => setStatus(form, "Verificación completada. Ya podés enviar el formulario.", "success"),
          "expired-callback": () => setStatus(form, "La verificación venció. Completala nuevamente.", "warning"),
          "error-callback": () => setStatus(form, "No se pudo cargar la verificación anti-spam. Recargá la página.", "error")
        });
        form.dataset.turnstileWidget = String(widgetId);
        const button = submitFor(form);
        if (button) button.disabled = false;
      });
    })
    .catch(() => {
      forms.forEach((form) => {
        setStatus(form, "No se pudo comprobar la configuración del contacto. No se enviaron datos.", "error");
        const button = submitFor(form);
        if (button) button.disabled = true;
      });
    });

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href="#brand-proposal"]');
    if (!link) return;
    event.preventDefault();
    if (typeof window.switchChapter === "function") window.switchChapter(6);
    window.setTimeout(() => document.getElementById("brand-proposal")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  });
  if (window.location.hash === "#brand-proposal") {
    window.setTimeout(() => {
      if (typeof window.switchChapter === "function") window.switchChapter(6);
      document.getElementById("brand-proposal")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }

  forms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = submitFor(form);
      if (!button || button.disabled) return;
      const data = new FormData(form);
      const token = data.get("cf-turnstile-response");
      if (!token) {
        setStatus(form, "Completá la verificación anti-spam antes de enviar.", "warning");
        return;
      }

      const fields = {};
      for (const [key, value] of data.entries()) {
        if (key === "cf-turnstile-response" || key === "website") continue;
        fields[key] = String(value);
      }

      button.disabled = true;
      const originalLabel = button.textContent;
      button.textContent = "ENVIANDO…";
      setStatus(form, "Enviando de forma segura…");
      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({
            type: form.dataset.contactType,
            fields,
            turnstileToken: token,
            website: data.get("website") || ""
          })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo enviar el mensaje.");
        form.reset();
        const widgetId = form.dataset.turnstileWidget;
        if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
        setStatus(form, result.message || "Mensaje recibido correctamente.", "success");
      } catch (error) {
        setStatus(form, error.message || "No se pudo enviar el mensaje. Intentá nuevamente.", "error");
        const widgetId = form.dataset.turnstileWidget;
        if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
      } finally {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    });
  });
})();
