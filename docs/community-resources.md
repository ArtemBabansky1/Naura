# Community resources — Meets

Local page: http://127.0.0.1:5173/ru/community-resources-v1
English: http://127.0.0.1:5173/community-resources-v1
Both also resolve at `/community-resources` (with the same locale prefix).

Content source: https://meets.naura.io/ru/community-resources-v1, retrieved 2026-09-10.
The Russian and English resource objects were extracted as static data from the
public bundle without executing it. All four setup steps, post-creation guidance,
announcement and pinning guidance, eight announcement templates, the useful-links
example, bot configuration, three bot message templates and the original video
URL are preserved. Five original screenshots are served locally.

The page reuses Meets palette and layout tokens, Vela Sans, the wordmark, button
and accordion styles, and the footer. The reading-copy floor is 16px. The footer
accepts an optional Meets path so its anchors work from this secondary page;
existing default behavior is unchanged. The business card page is untouched.

Interactions: setup-step selector and arrows, native details for templates,
clipboard copy with success/failure feedback, native modal image zoom with Escape
and focus restoration, language switch and section links. On mobile, navigation
wraps to two rows and a next-step action appears after the screenshot.

The embedded YouTube player stayed blank in the local browser (including after
removing lazy loading). The final video section therefore links directly to the
original YouTube video, using an original setup screenshot as its preview.

Validation: Vite production build passed; browser checks at 1440px and 390px,
plus overflow checks at 320px and 768px. No overflow in headings/controls, no
missing in-page targets, no console errors on the new page. Manually exercised
step selection, disclosure, successful clipboard feedback, image zoom and Escape,
language switch, and section navigation. Confirmed sticky navigation top = 0
while scrolled. Independent visual review findings were addressed.

Workflow: ui-design Build mode; aesthetic-direction and design-guidelines;
guidelines loaded: colors, heading-groups, landing-pages, responsive-design,
section-layout, buttons, typography, surfaces, custom-fonts. Playwright skill was
read; browser validation used CUA's available browser API because npx was absent.
