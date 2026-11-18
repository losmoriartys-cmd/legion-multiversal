const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  }
});

const MAX_BODY_BYTES = 20_000;
const MAX_FIELD_LENGTH = 4_000;

function clean(value, max = MAX_FIELD_LENGTH) {
  return String(value ?? "").replace(/\\r/g, "").trim().slice(0, max);
}

function validEmail(value) {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value) && value.length <= 254;
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  if (request.method === "GET") {
    const configured = Boolean(
      env.RESEND_API_KEY &&
      env.TURNSTILE_SECRET_KEY &&
      env.TURNSTILE_SITE_KEY &&
      env.CONTACT_TO &&
      env.CONTACT_FROM
    );
    return json({
      configured,
      turnstileSiteKey: env.TURNSTILE_SITE_KEY || null
    });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { allow: "GET, POST", "cache-control": "no-store" }
    });
  }

  const origin = request.headers.get("origin");
  if (origin !== url.origin) return json({ error: "Origen no permitido." }, 403);

  if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
    return json({ error: "Formato de envío no admitido. Activá JavaScript para usar el formulario seguro." }, 415);
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) return json({ error: "El mensaje supera el tamaño permitido." }, 413);

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return json({ error: "El mensaje supera el tamaño permitido." }, 413);
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: "Formato de solicitud inválido." }, 400);
  }

  // Honeypot: responder sin revelar el filtro ni enviar correo.
  if (clean(payload.website, 200)) return json({ ok: true });

  const configured = Boolean(
    env.RESEND_API_KEY &&
    env.TURNSTILE_SECRET_KEY &&
    env.TURNSTILE_SITE_KEY &&
    env.CONTACT_TO &&
    env.CONTACT_FROM
  );
  if (!configured) {
    return json({ error: "El canal de contacto todavía no está configurado. Podés volver a intentarlo más adelante." }, 503);
  }

  const token = clean(payload.turnstileToken, 2_048);
  if (!token) return json({ error: "Completá la verificación anti-spam." }, 400);

  const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      ...(request.headers.get("cf-connecting-ip")
        ? { remoteip: request.headers.get("cf-connecting-ip") }
        : {})
    })
  });
  if (!verification.ok) return json({ error: "No se pudo validar la protección anti-spam. Intentá nuevamente." }, 502);
  const verificationResult = await verification.json();
  if (!verificationResult.success || (verificationResult.hostname && verificationResult.hostname !== url.hostname)) {
    return json({ error: "La verificación anti-spam no fue válida. Intentá nuevamente." }, 400);
  }

  const type = payload.type === "creator" ? "creator" : payload.type === "brand" ? "brand" : null;
  if (!type || !payload.fields || typeof payload.fields !== "object" || Array.isArray(payload.fields)) {
    return json({ error: "La solicitud no tiene un tipo de contacto válido." }, 400);
  }

  const fields = Object.fromEntries(
    Object.entries(payload.fields)
      .slice(0, 20)
      .map(([key, value]) => [clean(key, 80), clean(value)])
  );
  const required = type === "creator"
    ? ["Nombre o alias", "Canal principal", "Motivación"]
    : ["Empresa o marca", "Persona de contacto", "Correo de contacto", "Descripción y objetivos"];
  if (required.some((key) => !fields[key])) {
    return json({ error: "Completá todos los campos obligatorios." }, 400);
  }

  const replyTo = fields["Correo de contacto"] || "";
  if (replyTo && !validEmail(replyTo)) return json({ error: "El correo de contacto no parece válido." }, 400);

  const subject = type === "creator"
    ? "Nueva presentación de creador · Legión Multiversal"
    : "Nueva propuesta comercial · Legión Multiversal";
  const body = [
    type === "creator" ? "PRESENTACIÓN DE CREADOR" : "PROPUESTA COMERCIAL",
    "",
    ...Object.entries(fields).map(([key, value]) => key + ": " + value),
    "",
    "Recibido desde el formulario oficial de legion-multiversal.pages.dev."
  ].join("\\n");

  const delivery = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: "Bearer " + env.RESEND_API_KEY,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: [env.CONTACT_TO],
      subject,
      text: body,
      ...(replyTo ? { reply_to: replyTo } : {})
    })
  });

  if (!delivery.ok) {
    // No exponer respuestas del proveedor ni datos del formulario al navegador.
    return json({ error: "No se pudo entregar el mensaje. No se registró como enviado; intentá más tarde." }, 502);
  }

  return json({ ok: true, message: "Mensaje enviado correctamente. La Legión recibió tu presentación." });
}
