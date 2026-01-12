/**
 * Theme Configuration
 *
 * Central configuration for the site's visual aesthetic.
 * Edit these values to customize colors, fonts, and spacing.
 */

export const THEME = {
  /**
   * Color Palette
   * Warm, academic aesthetic with cream backgrounds and coral accents
   */
  colors: {
    // Backgrounds
    background: {
      primary: '#FAF9F6',      // Main cream background
      secondary: '#FFFCF7',    // Parchment (slightly warmer, for cards)
      tertiary: '#F5F5F5',     // Light gray for hover states
      canvas: '#FFFCF7',       // Graph canvas background
    },

    // Text colors
    text: {
      primary: '#2C2C2C',      // Dark charcoal for main text
      secondary: '#6B6B6B',    // Medium gray for secondary text
      tertiary: '#A0A0A0',     // Light gray for subtle text
      muted: '#999999',        // Very light gray for disabled states
    },

    // Accent colors
    accent: {
      primary: '#E07A5F',      // Coral/salmon for links and highlights
      hover: '#D66A4F',        // Slightly darker coral for hover states
      light: '#F0A896',        // Lighter coral for subtle highlights
    },

    // Borders and dividers
    border: {
      default: '#E5E5E5',      // Standard border color
      subtle: '#F0F0F0',       // Very subtle dividers
      focus: '#E07A5F',        // Focus/active state borders
    },

    // Graph-specific colors
    graph: {
      link: 'rgba(107, 107, 107, 0.3)',           // Normal link color
      linkUndiscovered: 'rgba(107, 107, 107, 0.15)', // Undiscovered links
      selectedBorder: '#E07A5F',                   // Selected node border
      connectedTint: 'rgba(224, 122, 95, 0.1)',   // Tint for connected nodes
    },
  },

  /**
   * Typography
   * Source Sans Pro for all text (titles use heavier weight)
   */
  fonts: {
    display: 'var(--font-source-sans), system-ui, sans-serif',
    body: 'var(--font-source-sans), system-ui, sans-serif',
    mono: '"Courier New", Courier, monospace',
  },

  /**
   * Font sizes
   */
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
  },

  /**
   * Spacing and sizing
   */
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
  },

  /**
   * Border radius
   * Kept subtle for academic feel
   */
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    full: '9999px',
  },

  /**
   * Shadows
   * Subtle, not dramatic
   */
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
} as const;

/**
 * Utility function to get theme values
 * Usage: theme('colors.accent.primary')
 */
export function theme(path: string): string {
  const keys = path.split('.');
  let value: any = THEME;

  for (const key of keys) {
    value = value[key];
    if (value === undefined) return '';
  }

  return value;
}
