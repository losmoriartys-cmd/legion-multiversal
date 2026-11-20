# Configuración del contador público de seguidores de Twitch

## Qué activa esta integración

- Consulta únicamente `total` en `GET /helix/channels/followers`.
- No solicita ni almacena nombres, IDs, fechas de seguimiento o listas de seguidores.
- Usa un OAuth de usuario sin scopes, por lo que no requiere que los integrantes nombren moderador a nadie.
- El historial diario se conserva en `data.json`; la serie comienza cuando se habilite la autorización.
- Si falta OAuth o Twitch rechaza una consulta, el resto del recolector continúa y el último conteo conserva su fecha original.

Twitch documenta que, sin el scope `moderator:read:followers`, esta API devuelve solamente el total. El endpoint requiere un token de usuario. Por eso se usa una autorización de usuario sin scopes, no el token App actual del colector.

## Preparación inicial (una sola vez)

1. Abrí Twitch Developer Console y entrá a la misma aplicación cuyos `TWITCH_CLIENT_ID` y `TWITCH_CLIENT_SECRET` ya usa el repositorio.
2. Agregá como OAuth Redirect URL exactamente `http://localhost:8765/callback`.
3. En una terminal local, desde la raíz del repositorio, ejecutá:

   ```powershell
   py scripts/bootstrap_twitch_followers_oauth.py --client-id "TU_CLIENT_ID" --redirect-uri "http://localhost:8765/callback"
   ```

4. El script te pide el Client Secret de forma oculta, abre Twitch y solicita iniciar sesión con tu cuenta. No se piden scopes ni permisos de moderación.
5. Al terminar crea `twitch-followers-bootstrap.json`. Copiá el valor `refresh_token` (no el archivo entero) y guardalo como secreto del repositorio:

   - `TWITCH_FOLLOWERS_REFRESH_TOKEN`

6. Instalá localmente la dependencia de cifrado y generá una clave Fernet:

   ```powershell
   py -m pip install cryptography
   py -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
   ```

7. Guardá esa clave como secreto:

   - `TWITCH_FOLLOWERS_TOKEN_KEY`

8. Eliminá el archivo local `twitch-followers-bootstrap.json` después de guardar el secreto.

## Cómo se mantiene la autorización

El workflow renueva el token cuando se acerca su vencimiento y conserva el nuevo refresh token dentro de `twitch-followers-refresh-token.enc`, cifrado con la clave Fernet almacenada como secreto de GitHub. El archivo cifrado puede versionarse; la clave y los tokens en claro nunca se escriben en el repositorio. Si la renovación falla, no se reemplaza el último conteo ni su fecha.

Después de cargar ambos secretos, ejecutá manualmente **Actualizar estadísticas multiplataforma** una vez. Verificá que `followers_captured_at` aparezca en `data.json` para los canales y que la métrica `followers_total` figure como fresca en `creator-metrics.json`.

## Límites de interpretación

- El total es un conteo puntual público, no analítica privada.
- La comparación de crecimiento empieza con la primera captura propia; no se inventan puntos anteriores.
- Los datos históricos de SullyGnome se publican por separado y conservan su período, cobertura y estado de verificación.
