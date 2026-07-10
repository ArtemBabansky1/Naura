const N8N_BASE = "https://n8n.loanpilot.org"
const DEMO_WEBHOOK_ID = "731e5a23-96e7-4fad-8b49-2c57dbb0108c"

// In dev we hit the n8n test webhook (armed via "Execute workflow" on the canvas,
// one call per arm); production builds hit the live webhook of the activated workflow.
const DEMO_WEBHOOK_URL = import.meta.env.DEV
  ? `${N8N_BASE}/webhook-test/${DEMO_WEBHOOK_ID}`
  : `${N8N_BASE}/webhook/${DEMO_WEBHOOK_ID}`

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
