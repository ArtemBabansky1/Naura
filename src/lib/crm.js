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
