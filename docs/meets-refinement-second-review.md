# Meets — second visual review

## Changes

- Community form: removed 700px minimum height; restored a maximum form width of 570px. Preserved 10px outer insets and 30px / 20px nested radii. Mobile photo occupies the introduction area so the form does not cover people.
- New continuous photograph of people talking in a conference auditorium, replacing the lounge photo. Generated with the built-in image generator, then reframed with the same tool and converted to WebP using Sharp.
- Community active chips use the beige surface, without an inset outline or underline. Keyboard focus remains visible.
- Phone rise and rotation now consume one scroll-progress value, from panel top at 95% of the viewport to panel centre at 60%. It settles before the centre of the viewport.
- Matching section: three equal cards in one desktop row, centered heading and description with the shared blur reveal. Three original SVG miniature UI scenes use the same staged entrance language as the digital-card feature illustrations. Small screens stack the cards; reduced motion shows static artwork.

## Image asset

`src/assets/meets-redesign/community-conference.webp`

### Generation prompt

Use case: photorealistic-natural.
Asset type: continuous full-width photographic background for a community signup section of the Naura Meets website.
Create one believable candid photograph in a real modern CONFERENCE AUDITORIUM during a networking break. Not a cafe, dining room, cafeteria or coworking lounge. A small group of three adults standing in an open aisle in the left half of the frame, chatting naturally with each other; medium distance, relaxed smart casual clothes, natural faces, realistic hands and correct full body anatomy. Behind them the auditorium extends across the entire image: rows of conference chairs, a distant low stage and a large blank presentation screen, dark acoustic wall panels, soft overhead architectural lights. A few distant attendees in the far-left background are fine.
Wide horizontal photo with a single coherent perspective, continuous room, uniform natural editorial color grading, warm neutral stone and charcoal tones. Compose the main group between 10% and 43% of image width; their heads below 43% of the image height, their bodies continuing toward the bottom. The upper left has quiet darker architecture for white headline and two short lines of description. The right 48% shows the SAME conference auditorium with empty seating and subdued architectural detail, leaving space for an overlaid glass form; no important person in that right area.
Critical: no tables anywhere near the people, no furniture cutting through a person, no intersecting bodies or impossible anatomy. No split image, no collage, no seam, no artificial solid panel, no fake blur boundary, no text, logos, watermark, no food, plates or cups. Photographic realism, no glossy 3D render.

### Reframing prompt

Edit this conference auditorium photograph. Keep the same continuous believable auditorium, lighting, chairs, stage and three people talking. Change the composition: pull the camera farther back so the group is substantially smaller and sits in the LOWER LEFT quadrant, spanning x=12% to x=39% and y=45% to y=95%. The top of EVERY main person's head must be below 45% of the image height, leaving the entire upper-left 40% height as dark unobstructed architecture for a website heading and paragraph. Show more tall acoustic wall and auditorium ceiling above the people. Keep their full natural bodies standing on unobstructed floor, no tables. Keep the right half free of people for a form overlay. One coherent photograph with a single perspective, no split, no panels, no text. This is a wider establishing shot of a conference room, not a portrait of the group.

## Verification

- Browser checked at 390, 768, 1280 and 1920 CSS pixels wide.
- Form panel is 518px high at 1280px wide and 618px at 1920px wide; the previous minimum was 720px including insets. Form width is 570px at both desktop sizes.
- Form top/right/bottom insets measure 10px; no horizontal overflow.
- Active community chip computed colors are beige with no underline or box shadow; changing the chip updates selection.
- Phone checked at entrance, mid-scroll and centred: rotation and rise finish together, with zero remaining translation at the panel centre.
- Three UI illustrations finish their staged reveal; responsive card layout visually checked.
- Browser console has no errors. Production build passes; existing Three.js bundle-size warning remains.
