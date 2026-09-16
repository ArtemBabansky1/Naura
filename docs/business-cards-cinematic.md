# Business cards — cinematic edition

## Reference study

- [Cosmos](https://www.cosmos.so) currently redirects to its Explore gallery. Its quiet warm palette, image groupings, and restrained navigation were inspected live.
- [Cosmos, Awwwards SOTD](https://www.awwwards.com/sites/cosmos) documents the original Unseen Studio marketing experience: image vortex, scroll-linked growth, particle transitions, and changing navigation states. This archived award entry is distinct from the current gallery.
- [Lusion v3](https://www.awwwards.com/sites/lusion-v3), with [the live Lusion site](https://lusion.co), informed the scale changes and spatial continuity between sections.
- [Unseen Studio](https://www.awwwards.com/sites/unseen-studio) and its [current site](https://unseen.co) informed editorial pacing and restrained, distinctive interaction.

The implementation is original, using the project's existing React, GSAP, Motion, Lenis, Vela Sans, and local image assets. No external example source or new dependencies were added.

## What changed

1. A spatial hero with photography and cards arranged around the headline. On scroll, satellites converge, the main identity rises, and an expanding dark surface introduces the connection story. The same card persists through the transition.
2. A reversible interactive card: mouse hover shows the reverse, leaving restores the front, and the card itself supports touch/keyboard activation. There is no separate flip button below the card. The decorative QR pattern is not a production contact QR.
3. A paper/digital comparison with illustrated cards and restrained parallax.
4. A sticky desktop walkthrough with three scroll-selected states. Color choices update the actual card preview; the other states demonstrate sharing and collecting contacts. Tabs remain usable by pointer and keyboard. Mobile uses a normal vertical layout.
5. Six purpose-built feature illustrations, a scroll-linked type ribbon, expanding team imagery, and scale/reveal transitions in the later sections and footer.
6. Page-scoped overflow repair, dark/light navigation states, responsive type, improved contrast, reduced-motion branches, and NBSP processing for both locales.

### Follow-up refinements

- The hero's dark surface rises from the bottom center, initially with 60 px corners, then expands symmetrically to the full viewport with square corners. A single explicit GSAP tween owns translation, inset, and radius so refreshes cannot separate the reveal phases. It reaches full size before the story appears. CSS variables avoid browser clip-path shorthand interpolation; the stage follows the dynamic viewport height.
- Restored the original staggered opacity/blur reveal in a shared `EditorialTitle` component, including the hero and journey heading.
- The header is transparent in both themes. The full existing Naura wordmark is visible; equal side columns center the menu, while navigation and account actions have matching blurred pill containers.
- Checked these refinements in Russian at 1200×800, 1440×900, and 390×844. Verified early/mid/final portal geometry, zero final translation/radius, header centering, mobile menu, and absence of horizontal overflow. Production build passes.
- Unified primary action colors by local surface: black on light panels and white on dark panels, including the hero discovery action, walkthrough, comparison, pricing, platform, contact actions, mobile menu, and beta form. Preserved navigation and other control semantics.
- Follow-up browser checks cover mouse entry/exit, keyboard Enter/Escape, removal of the below-card flip control, action colors across the page, and the discovery link's scroll destination. Mobile story spacing was adjusted to fit the filled CTA; inspected at 390×740 and 390×844. Touch handling is implemented but was not emulated by the connected browser. Production build passes with the same existing chunk warning.
- The walkthrough now uses equal desktop panels: white instructions on the left, animated preview on the right, with shared radius and a 24 px gap. Step three unmounts the identity card so only contacts remain. Checked matching panel dimensions and content fit at 1440×900, 1280×720, and 900×650, plus stacked panels at 390×844 and keyboard return to step two.

## Verification

- Production Vite build succeeds. Existing warning: shared Three.js chunk exceeds 500 kB; this page does not add a Three.js dependency.
- Live browser checks: English and Russian; desktop 1280×720 and independent review at 1440×1000; mobile 390×844.
- Checked hero handoff, card flip, theme selection, journey tabs, keyboard arrow navigation, menu opening/closing, yearly price (249 ₽), FAQ expansion, empty-form validation, footer reachability, and image loading.
- No browser console errors in inspected runs. No horizontal document overflow at inspected sizes.
- Independent visual review found a miniature-card overlap; transform origin corrected. Follow-up changes raised feature-description contrast and enlarged the mobile flip control.
- Reduced-motion behavior implemented in React and CSS; OS preference emulation was not available in this browser session, so that branch has not been visually exercised.
- Existing Playwright suite selectors and photo expectations were aligned with the new scenes. The suite was not executed in this session; checks above were performed in the connected browser.

## Design guidance used

UI Design, Build workflow: aesthetic direction; colors, heading groups, landing pages, images, responsive design; independent visual review. Motion: React/universal best practices and official useScroll documentation. Typography Audit: line height, responsive sizes, body text, headline spacing.
