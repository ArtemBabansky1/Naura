# Shared connection-line background

## Cause and fix

The media reset applies `max-width: 100%` to SVGs. `ConnectionLines` requested 125% width with a -12.5% left offset. The reset reduced the SVG to the container width without cancelling that offset, creating a 12.5% empty strip on the right.

The shared decorative SVG now explicitly sets `max-width: none`. The intended 125% width and equal -12.5% bleed on both sides are restored. Other SVGs retain their responsive size limit.

## Browser verification

- Meets hero, team note, phone panel and final CTA: horizontal centre offset is zero at 1280px and 390px viewports.
- CRM community panel and CTA: zero horizontal offset on desktop.
- Digital-card hero and final CTA: their wrapper-based sizing was already centred; verified zero offset at desktop and mobile sizes.
- Community guide, support, FAQ, privacy and terms: zero horizontal offset and equal left/right bleed on desktop and mobile.
- No horizontal page overflow in the tested mobile Meets layout.
- Production build passes; the existing Three.js bundle-size warning remains.

## Meets phone composition

The phone is now 1.5 times larger and sits partly below the panel's clipping edge. With the existing 92% camera fit, bottom-aligned stage and 11% downward shift, approximately 60.1% of the settled phone remains visible. The scroll-driven rise and rotation still finish together. Narrow two-column tablet layouts use a 1.2 scale and 29% downward shift to keep a comparable visible fraction without covering the copy.
