# Service pages and community guide refinement

## Changes

- Support and FAQ: removed the redundant eyebrows, centered title and description, kept a 20px title-to-description gap. Titles retain the site's word blur animation; linked descriptions use the same blur treatment as one block.
- Legal documents: native semantic headings replace animated wrappers. All document headings are immediately visible; legal copy is unchanged.
- Community guide: removed the secondary sticky table of contents. The global CardHeader is now the only header. Rebuilt the page using Naura's shared container grid, paper / beige / olive surfaces, rounded panels, gradient step numerals reused from Meets, shared reveal components, brand lines, and CardButton.
- Preserved setup steps, source screenshots and lightbox, all eight announcement templates, three bot message templates, copy controls, external destinations, language support, and footer.
- Consolidated guide styles into CommunityResourcesPage.css; removed the obsolete override stylesheet.
- Meets form outer spacing now uses the same responsive spacing tokens as the gray community cards: 30px at 1920, 20px at 1280, 25px on mobile.

## Verification

- Vite production build passed. Existing Three bundle size warning remains.
- Support: centered title and linked description; 20px gap; no eyebrow. Desktop and mobile browser checks.
- FAQ: centered title and linked description; no eyebrow; shared word blur present. Desktop and mobile browser checks.
- Privacy: 21 native headings, all opacity 1 and filter none, no animated children.
- Terms: 17 native headings, all opacity 1 and filter none, no animated children.
- Community guide: only one header, no secondary sticky navigation; desktop and mobile layouts checked. No horizontal overflow or failed images at 390px.
- Setup wizard: final step updates text and screenshot, next control disables; returning to first step works.
- Screenshot lightbox opens correct image and closes with Escape.
- Announcement accordion expands and retains eight copy controls.
- Instruction body copy has a 16px minimum; reduced-motion states retained.

## Design references

Existing Naura design system and shared UI take precedence. Applied ui-design build/refinement guidance: aesthetic-direction, design-guidelines, colors, section-layout, surfaces, heading-groups. Animation uses existing ScrollReveal primitives and the motion skill conventions. Independent visual review follows the ui-design verification requirement.

## Independent visual review fixes

- At 1280px, the single word “Автоматические” exceeded the left third of the bot section. Split-section headings now use 45px, and split sections stack below 1200px. Mobile headings remain 40px.
- At 390px, “Видеоинструкция” left its final letter on a separate line. The mobile video heading now uses 30px so the complete word fits.

## Follow-up: instruction layout, copy preserved

- First screen fills the viewport including the 90px desktop / 72px mobile header. The centered title group occupies the remaining space above the cards; cards end 18px / 12px from the bottom, matching header control insets. On unusually short screens the layout can grow to keep content readable.
- Launch steps 01–03 reuse the same gradient SVG numerals as the first-screen cards.
- Wizard selectors are rounded 48px pills with number on the left and title on the right.
- The completed-room note is a gray panel below the wizard. Removed its supplementary screenshot; title stays on one line at1280.
- The Useful example keeps its heading, both explanatory paragraphs, list items, emoji, placeholders and clipboard text. Copy/instructions are now left of the gray example panel; mobile stacks the two.
- Rechecked first-screen bounds:1280×720 ends at720 with cards at702;390×844 ends at844 with cards at832. Mobile overflow0, three gradient step numerals, active wizard still updates correctly, browser error log empty.

## Follow-up: icons and first-screen entrance

- Removed the divider above the Useful example. Its explanatory copy now has the same gray card surface as the example itself.
- Replaced the four visual emoji with Book Open, Coffee, Gift, and Users Round from the official Lucide SVG sources; included the upstream license. Text and copy payload remain unchanged.
- Navigation arrows reuse the exact shared ChevronRight component from the digital-card Create for free button. Updated guide hero cards, wizard controls, screenshot links, next-step control, and bot link; aligned the custom form select and the business-card journey control with the same component.
- Per final feedback, hero arrows have no circular background and match the heading size (25px desktop,22px smaller screens).
- The three hero cards rise into view together from below the first screen: same1.2s duration and cubic easing as the header, reversed direction. Reduced-motion users see the cards immediately.

## Follow-up: announcements, invitations, screenshots, and video

- Announcements now share the page canvas background. On desktop the accordion begins at the third column of the four-column grid; the two sides have equal width.
- Automatic invitations have a centered heading and description above two equal-height white cards. Setup and group ID instructions occupy the left card; message examples occupy the right. Removed the group ID bottom border and the message accordion's first/last borders, retaining only internal dividers.
- Wizard previews stretch to the full panel content height with equal top/right/bottom padding (30px at 1280). Removed the visible screenshot caption. Hover and keyboard focus blur the preview and show the Lucide Search icon; accessible open labels and the full-size dialog remain.
- Video heading and description are centered above a black media container. A generated beige platform image sits inside with 30px padding. Its radius is exactly 10px less than the parent radius. The black YouTube action is centered over the blurred image and retains the existing destination.
- The video preview has an explicit constrained width so its minimum height does not force overflow on mobile. The mobile action fits on one line at 360px.
- Preserved instruction text, announcement templates, bot messages, and clipboard payloads.

### Browser verification

- Desktop 1280px: both invitation cards 504.23px high; group ID bottom border 0; message outer borders 0 and internal dividers 1px.
- Screenshot preview 260 × 430px inside a 490px-high panel, giving 30px top/right/bottom insets. Hover verified with 4px blur and visible centered zoom icon; dialog opens and closes with Escape.
- Mobile 390px and 360px: stacked layout checked, no horizontal overflow, wizard final-step controls disable correctly, screenshot dialog still opens and closes.
- Generated cover loaded with natural width 1672px. Video insets are 30px on every side; centered black button verified. Mobile radii are 25px outer / 15px inner.

### Follow-up: cropped video frame

- The full black frame retains its image scale, padding, and inner corner radius, but a clipped viewport reserves only its top 60% in the layout.
- A non-interactive blurred gradient dissolves the frame's lower edge into the shared page canvas before the footer.
- The YouTube action sits in a separate overlay centered within the visible 60%, so the fade never obscures or intercepts the link.
- Browser checks: desktop frame 675.375px / visible 405.219px; mobile frame 320px / visible 192px. Button center deviation 0px in both axes on both layouts. Production build passed.

### Final frame adjustments

- Visible height increased from 60% to 70%; image inset reduced to 15px. The full-height calculation uses the inset token, and the YouTube action remains centered within the visible crop.
- Added a centered black display notch with rounded lower corners and a subtle camera dot; it scales from 160px on desktop to 70px on narrow screens.
- Increased outer and inner radii by 10px together: desktop 40px / 30px, mobile 35px / 25px.
- Verified visible ratio 0.70, 15px insets, centered action, and no horizontal overflow at 1280px and 390px. The bottom fade into the page background remains.

### Entrance and footer spacing

- The screen and its CTA rise together from below the clipped area on first viewport entry. The observer watches the stationary container; a 2s transform animation uses cubic easing (0.16, 1, 0.3, 1) for a fast start and a long deceleration. Reduced-motion preference displays the frame immediately.
- The page-colored fade stays stationary; the CTA travels on a separate layer above it.
- Runtime check: translation starts at the clip's full height, moves upward synchronously for frame and CTA, and settles at 0px.
- Halved the spacing before the footer using half the responsive section-gap token. Verified desktop gap and main bottom padding are 70px instead of 140px. Build passed.

### Video image source and prompt

- Application asset: `/Users/artem/Documents/ChatGPT/Naura/src/assets/community-resources/video-cover.webp`. Imported by the page so Vite tracks and versions it. The public copy remains available at the previously shared download link.
- Dimensions: 1672 × 941, WebP, 24,056 bytes. Original generated PNG retained.
- The mock platform is decorative; the YouTube action is a real HTML link layered above it.
- Safari follow-up: confirmed the user's open page showed an empty beige preview despite the image loading in the in-app browser. Switching to the imported asset caused it to load in the user's Safari page; visually verified the generated interface in the black video frame.
- Generation prompt:

> Use case: ui-mockup. Create a single landscape 16:9 raster image to serve as a blurred video cover on the Naura community guide website. Show a polished, believable desktop web platform for managing a professional community and one-to-one networking meetings: compact left navigation, a calm top bar, participant profiles, a weekly meeting schedule, a few restrained activity statistics, and clean white cards on a warm beige canvas. Use the site's exact visual family: warm off-white #fdfdfc, light canvas #f4f3f1, beige #d8d0c2, muted olive #a8aa9c, near-black #0b0b0b. Rounded corners, fine minimalist monochrome icons, spacious professional UX/UI design. Straight-on full-window view, filling the whole image without any laptop, phone, outer frame, desk, people, or room. One continuous interface, not a collage. Apply a gentle uniform optical defocus so the platform structure remains recognizable but text is intentionally unreadable. No large promotional copy, no prominent brand logos, no watermark, no play icon, and no call-to-action button in the image; the real YouTube button will be overlaid in the website code. Keep the middle area visually quiet for that overlay. Output a high quality wide image.
