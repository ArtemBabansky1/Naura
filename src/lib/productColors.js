// Approved Naura product palette. CSS, SVG and canvas scenes share these roles.
// Accent is decorative; Display is for large headings on the neutral base.
// Ink/Solid support readable small text and white labels respectively.
export const PRODUCT_COLORS = {
  crm: { accent: '#4F95C8', tint: '#E0E8EC', ink: '#245578', display: '#4B8FBF', solid: '#3277A9' },
  cards: { accent: '#5754A8', tint: '#E1E0E8', ink: '#38346E', display: '#5754A8', solid: '#5754A8' },
  meets: { accent: '#F56B32', tint: '#F4E3DA', ink: '#9B350F', display: '#E3602B', solid: '#C44F20' },
}

export const PRODUCT_THEME_STYLES = Object.fromEntries(
  Object.entries(PRODUCT_COLORS).map(([product, roles]) => [
    product,
    Object.fromEntries(Object.entries(roles).map(([role, color]) => [`--product-${role}`, color])),
  ]),
)
