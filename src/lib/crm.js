const N8N_BASE = "https://n8n.loanpilot.org"
const DEMO_WEBHOOK_ID = "731e5a23-96e7-4fad-8b49-2c57dbb0108c"

// The activated workflow's live webhook — used in both dev and prod so local
// testing hits the same endpoint without re-arming the test webhook in n8n.
const DEMO_WEBHOOK_URL = `${N8N_BASE}/webhook/${DEMO_WEBHOOK_ID}`

/**
 * Sends a demo-request lead to the CRM (n8n webhook).
 * Throws on network failure or non-2xx response.
 */
export async function submitDemoRequest({ fullName, email, phone, howHeard, locale }) {
  const response = await fetch(DEMO_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "demo-modal",
      fullName,
      email,
      phone,
      howHeard,
      locale,
      page: window.location.href,
      submittedAt: new Date().toISOString(),
    }),
  })

  if (!response.ok) {
    throw new Error(`CRM webhook responded with ${response.status}`)
  }
}

/**
 * Sends a Meets community request to the same CRM webhook as the demo form —
 * it already routes into the Meets bot. `source` is what tells the two apart.
 *
 * The Meets form collects one free-form contact (Telegram / email / phone)
 * where the demo form has separate fields, so the value goes out both under
 * its own key and in `phone`, whichever the workflow reads.
 *
 * Throws on network failure or non-2xx response — the caller shows the error
 * state rather than a thank-you.
 */
export async function submitCommunityRequest({ name, contact, comment, consentMarketing, locale }) {
  const response = await fetch(DEMO_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "meets-communities",
      fullName: name,
      email: "",
      phone: contact,
      howHeard: "",
      contact,
      comment,
      consentMarketing,
      locale,
      page: window.location.href,
      submittedAt: new Date().toISOString(),
    }),
  })

  if (!response.ok) {
    throw new Error(`CRM webhook responded with ${response.status}`)
  }
}

/** Submit an early-access lead from the digital business cards page. */
export async function submitBusinessCardsBetaRequest({ email, telegram, consent, locale }) {
  const response = await fetch(DEMO_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "business-cards-beta",
      fullName: telegram,
      email,
      phone: telegram,
      telegram,
      consent,
      locale,
      page: window.location.href,
      submittedAt: new Date().toISOString(),
    }),
  })

  if (!response.ok) {
    throw new Error(`CRM webhook responded with ${response.status}`)
  }
}
