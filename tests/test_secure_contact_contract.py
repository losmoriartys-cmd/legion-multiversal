import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class SecureContactContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.script = (ROOT / "contact-forms.js").read_text(encoding="utf-8")
        cls.endpoint = (ROOT / "functions" / "api" / "contact.js").read_text(encoding="utf-8")
        cls.brands = (ROOT / "marcas" / "index.html").read_text(encoding="utf-8")

    def test_both_public_forms_use_the_secure_endpoint(self):
        self.assertIn('data-contact-type="creator"', self.html)
        self.assertIn('data-contact-type="brand"', self.html)
        self.assertEqual(self.html.count('data-contact-status'), 2)
        self.assertEqual(self.html.count('data-turnstile'), 2)
        self.assertNotIn("onsubmit=", self.html)
        self.assertNotIn("mailto:", self.html)

    def test_submission_requires_turnstile_and_server_delivery(self):
        self.assertIn("TURNSTILE_SECRET_KEY", self.endpoint)
        self.assertIn("TURNSTILE_SITE_KEY", self.endpoint)
        self.assertIn("siteverify", self.endpoint)
        self.assertIn("RESEND_API_KEY", self.endpoint)
        self.assertIn("api.resend.com/emails", self.endpoint)
        self.assertIn('}, 503)', self.endpoint)
        self.assertIn("No se registró como enviado", self.endpoint)

    def test_browser_confirms_only_successful_server_response(self):
        self.assertIn('if (!response.ok || !result.ok)', self.script)
        self.assertIn('setStatus(form, result.message', self.script)
        self.assertIn('setStatus(form, error.message', self.script)
        self.assertIn('form.dataset.turnstileWidget', self.script)

    def test_commercial_page_routes_to_the_real_form(self):
        self.assertIn('href="../#brand-proposal"', self.brands)
        self.assertNotIn("mailto:", self.brands)

    def test_contact_endpoint_has_bounded_payload_and_honeypot(self):
        self.assertIn("MAX_BODY_BYTES", self.endpoint)
        self.assertIn("MAX_FIELD_LENGTH", self.endpoint)
        self.assertIn("payload.website", self.endpoint)
        self.assertIn("origin !== url.origin", self.endpoint)
        self.assertIn('origin !== url.origin', self.endpoint)


if __name__ == "__main__":
    unittest.main()
