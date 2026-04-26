/**
 * Form Visual Design Tokens
 * Centralized styling values for the posting form.
 * All visual values must come from this file.
 */

export const FormTokens = {
  // ─── Colors ──────────────────────────────────────────────────────
  colors: {
    // Backgrounds
    background: {
      white: "#FFFFFF",
      gray: "#F9FAFB",
      light: "#F3F4F6",
    },
    // Borders
    border: {
      light: "#E5E7EB",
      neutral: "#D1D5DB",
      dark: "#9CA3AF",
      focus: "#059669",
      error: "#DC2626",
    },
    // Text
    text: {
      primary: "#1F2937",
      secondary: "#6B7280",
      muted: "#9CA3AF",
      light: "#D1D5DB",
      white: "#FFFFFF",
    },
    // States
    error: "#EF4444",
    errorLight: "#FEE2E2",
    warning: "#F59E0B",
    warningLight: "#FEF3C7",
    success: "#10B981",
    successLight: "#ECFDF5",
    // Accents
    accent: "#059669",
    accentLight: "#ECFDF5",
    accentDark: "#047857",
  },

  // ─── Typography ──────────────────────────────────────────────────
  typography: {
    // Step header
    stepHeader: {
      fontSize: "16px",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    // Section label (Level 2)
    sectionLabel: {
      fontSize: "16px",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    // Group label (Level 3)
    groupLabel: {
      fontSize: "11px",
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
    },
    // Field label
    fieldLabel: {
      fontSize: "14px",
      fontWeight: 500,
      lineHeight: 1.4,
    },
    // Input text
    input: {
      fontSize: "14px",
      fontWeight: 400,
      lineHeight: 1.5,
    },
    // Error/warning text
    error: {
      fontSize: "12px",
      fontWeight: 400,
      lineHeight: 1.3,
    },
  },

  // ─── Spacing ─────────────────────────────────────────────────────
  spacing: {
    // Vertical spacing between sections
    sectionGap: "32px",
    // Vertical spacing between field groups
    groupGap: "24px",
    // Spacing after group label
    groupLabelGap: "8px",
    // Spacing between fields in a row
    fieldGap: "16px",
    // Padding inside field containers
    fieldPadding: {
      horizontal: "12px",
      vertical: "10px",
    },
    // Spacing after field label
    labelGap: "8px",
    // Error message spacing
    errorGap: "4px",
  },

  // ─── Border Radius ───────────────────────────────────────────────
  radius: {
    field: "8px",
    button: "8px",
    pill: "9999px",
  },

  // ─── Focus & Hover States ────────────────────────────────────────
  focus: {
    ring: "0 0 0 3px rgba(5, 150, 105, 0.1)",
    ringBorder: "#059669",
  },
  hover: {
    borderColor: "#D1D5DB",
  },

  // ─── Validation States ───────────────────────────────────────────
  validation: {
    error: {
      borderColor: "#DC2626",
      backgroundColor: "rgba(239, 68, 68, 0.05)",
      textColor: "#DC2626",
    },
    touched: {
      borderColor: "#059669",
      boxShadow: "0 0 0 3px rgba(5, 150, 105, 0.1)",
    },
  },

  // ─── Semantic Groups ─────────────────────────────────────────────
  groups: {
    // "Équipements généraux" equivalent — unified amenities
    amenities: {
      background: "#F9FAFB",
      borderColor: "#E5E7EB",
    },
  },
};

// Tailwind class builder helpers (optional)
export const tailwindClasses = {
  fieldBorder: "border border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#059669] focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]",
  fieldBase: "px-3 py-2.5 rounded-lg text-sm bg-white transition-colors",
  labelBase: "text-sm font-medium text-[#1F2937]",
  required: "text-[#DC2626] ml-0.5",
  errorText: "text-[#DC2626] text-xs flex items-center gap-1",
};