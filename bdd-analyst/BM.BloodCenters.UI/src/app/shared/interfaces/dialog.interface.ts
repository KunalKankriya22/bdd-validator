/**
 * Interfaces for shared dialog components
 */

/**
 * Configuration for dialog footer buttons
 */
export interface DialogButton {
  /** Button text label */
  label: string;
  /** Action identifier emitted on click */
  action: string;
  /** Button style variant */
  variant: 'primary' | 'secondary' | 'text';
  /** Optional Material icon name */
  icon?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Accessibility label */
  ariaLabel?: string;
}

/**
 * Header field for displaying key-value pairs in dialog header
 */
export interface DialogHeaderField {
  /** Field label */
  label: string;
  /** Field value */
  value: string | number | null | undefined;
  /** Optional custom width */
  width?: string;
}

/**
 * Tab configuration for tabbed dialogs
 */
export interface DialogTab {
  /** Unique tab identifier */
  id: string;
  /** Tab display label */
  label: string;
  /** Disabled state */
  disabled?: boolean;
  /** Accessibility label */
  ariaLabel?: string;
}

/**
 * Quick link item configuration
 */
export interface QuickLink {
  /** Unique link identifier */
  id: string;
  /** Link display text */
  label: string;
  /** Disabled state */
  disabled?: boolean;
  /** Tooltip text */
  tooltip?: string;
  /** Accessibility label */
  ariaLabel?: string;
  /** Optional count badge displayed after the label */
  count?: number;
}
