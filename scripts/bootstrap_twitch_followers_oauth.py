#!/usr/bin/env python3
"""Bootstrap local de OAuth Twitch sin scopes para consultar solo totales de seguidores."""

from __future__ import annotations

import argparse
import getpass
import json
import secrets
import urllib.parse
import urllib.request
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

OUTPUT = Path("twitch-followers-bootstrap.json")


def exchange_code(client_id: str, client_secret: str, code: str, redirect_uri: str) -> dict:
    body = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": redirect_uri,
    }).encode("utf-8")
    request = urllib.request.Request(
        "https://id.twitch.tv/oauth2/token",
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--client-id", required=True, help="Client ID de la misma aplicación configurada en GitHub Actions.")
    parser.add_argument("--redirect-uri", required=True, help="URL localhost registrada exactamente en Twitch Developer Console.")
    args = parser.parse_args()

    parsed = urllib.parse.urlsplit(args.redirect_uri)
    if parsed.scheme != "http" or parsed.hostname not in {"localhost", "127.0.0.1"} or not parsed.port:
        parser.error("--redirect-uri debe ser una URL http://localhost:<puerto>/... o http://127.0.0.1:<puerto>/...")
    client_secret = getpass.getpass("Client Secret de Twitch (no se mostrará): ").strip()
    if not client_secret:
        parser.error("El Client Secret no puede estar vacío.")

    state = secrets.token_urlsafe(24)
    auth_query = urllib.parse.urlencode({
        "client_id": args.client_id,
        "redirect_uri": args.redirect_uri,
        "response_type": "code",
        "state": state,
        "force_verify": "true",
    })
    auth_url = "https://id.twitch.tv/oauth2/authorize?" + auth_query
    expected_path = parsed.path or "/"
    result = {"finished": False, "error": None}

    class CallbackHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            callback = urllib.parse.urlsplit(self.path)
            query = urllib.parse.parse_qs(callback.query)
            if callback.path != expected_path:
                self.send_error(404)
                return
            if query.get("state", [""])[0] != state:
                result["error"] = "El parámetro state no coincide; se rechazó la respuesta OAuth."
            elif query.get("error"):
                result["error"] = "Twitch rechazó la autorización: " + query.get("error_description", query["error"])[0]
            else:
                code = query.get("code", [""])[0]
                if not code:
                    result["error"] = "Twitch no devolvió un código de autorización."
                else:
                    try:
                        token = exchange_code(args.client_id, client_secret, code, args.redirect_uri)
                        refresh = token.get("refresh_token")
                        if not refresh:
                            raise RuntimeError("La respuesta OAuth no incluyó refresh_token.")
                        OUTPUT.write_text(json.dumps({
                            "refresh_token": refresh,
                            "note": "Secreto de inicialización. No subir al repositorio ni compartir en chats.",
                        }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                        result["finished"] = True
                    except Exception as exc:  # noqa: BLE001 - error de red/OAuth que debe informar al operador
                        result["error"] = "No se pudo intercambiar el código OAuth: " + str(exc)

            self.send_response(200 if result["finished"] else 400)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(
                b"Autorizacion completada. Ya podes cerrar esta ventana." if result["finished"]
                else b"No se pudo completar la autorizacion. Revisa la consola del script."
            )

        def log_message(self, _format, *_args):
            return

    server = HTTPServer((parsed.hostname, parsed.port), CallbackHandler)
    server.timeout = 1
    print("Abriendo Twitch para autorizar una consulta de conteo publico, sin scopes ni permisos de moderador.")
    print("La URL de redireccion debe estar registrada exactamente en Twitch Developer Console.")
    webbrowser.open(auth_url)
    try:
        while not result["finished"] and not result["error"]:
            server.handle_request()
    except KeyboardInterrupt:
        result["error"] = "Operación cancelada."
    finally:
        server.server_close()

    if result["error"]:
        print("ERROR: " + result["error"])
        return 1
    print("OK: refresh token creado en {}.".format(OUTPUT.resolve()))
    print("Carga su contenido como secreto TWITCH_FOLLOWERS_REFRESH_TOKEN en GitHub.")
    print("No compartas el archivo ni lo agregues a un commit.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
