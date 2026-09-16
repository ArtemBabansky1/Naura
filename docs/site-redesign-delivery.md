# Digital-card design migration — September 14, 2026

## Delivered

Normal routes now render copies in `src/pages/CrmRedesign`, `MeetsRedesign`, `CommunityResourcesRedesign`, `FaqRedesign`, `SupportRedesign`, and `LegalRedesign`. The original implementations remain in `src/pages`, and the complete pre-migration source snapshot is in `archive/site-before-card-design-2026-09-14`.

`src/components/CardDesign` reuses the approved digital-card header, footer, magnetic CTA, Vela Sans typography, warm neutrals, radius scale, responsive gutter, and three-ellipse drawing motif. The digital-card page itself is unchanged. There were no Git branch switches, commits, or remote deployments.

- CRM has an unframed light hero, no Unicorn blur backgrounds, a dark scroll section, and the shared line motif in the community panel and closing CTA.
- Meets has four GPT Image business-conversation photos, a centered hero, redesigned benefit cards and founder note, a dark Telegram section, a beige form panel, and the line motif in the hero, note, form, and footer.
- The guide, FAQ, support, privacy, and terms use the same shell and reading styles.
- All product menus keep CRM → business cards → communities → Meets. Active items have no underlines.

## Preservation and verification

`node --test tests/redesign-preservation.test.mjs` verifies all translations and legal content byte-for-byte against the archive, the unchanged digital-card implementation, preserved original page implementations, and active redesigned routes. All three checks pass.

Production Vite build passes. Existing large Three.js chunk warning remains.

Browser checks: CRM and Meets at 1440 and 1920 px, main sections and footers, 390 px mobile visual review, all seven redesigned routes at 320 px, menu order, support-form empty validation, disabled Meets submit, loaded generated assets, English hero, and 3840 px gutter computation. No external form submissions were made. At 3840 px the inherited card grid uses 1160 px side gutters; at 1920 px it uses 200 px. The 4K check was a layout-metrics check, not physical-monitor testing.

Fresh-eyes visual review identified and prompted fixes for CRM hero paragraph centering and closing CTA spacing. Its mobile H1/H2 size observation was retained deliberately: the source card page's hero was previously reduced by 25%, and the user requested its exact type system. The desktop Meets footer was additionally checked by the primary implementation context and its double gutter corrected.

## Existing limitation

The support form still has its pre-existing simulated success handler and does not send messages to a backend. This migration only changes design. Meets and CRM retain their existing submission integration; live delivery was not exercised.

## Image assets

See `src/assets/meets-redesign/README.md` for the exact four prompts, built-in GPT Image provenance, originals, and WebP paths. Delivery encoding reduces the four photos from roughly 8 MB of PNG originals to roughly 250 KB total, without crop or content edits.

## Design workflow references

UI Design: Build mode, existing digital-card direction. Loaded aesthetic-direction, design-guidelines, landing-pages, heading-groups, colors, typography, section-layout, buttons, border-radius, custom-fonts, images, responsive-design, headers, navigation, footers, form-controls, prose-content, and feature-lists. Motion: skill, best-practices index and React reference. ImageGen: built-in generation workflow. These references guided implementation and verification; the user's frozen-copy and exact-reference constraints took precedence over generic design suggestions.
