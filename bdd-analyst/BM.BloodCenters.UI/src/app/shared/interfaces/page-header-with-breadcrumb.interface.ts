/* Breadcrumb item configuration */
export interface BreadcrumbItem {
  label: string;
  link?: string | null;
  ariaLabel?: string;
}

/* Action button configuration for page header */
export interface ActionButton {
  label: string;
  icon?: string;
  color?: 'primary' | 'accent' | 'warn';
  variant?: 'filled' | 'outlined' | 'text';
  matButton?: 'stroked' | 'raised';
  ariaLabel?: string;
  disabled?: boolean;
  onClick: () => void;
}

/** Page header with breadcrumb configuration */
export interface PageHeaderConfig {
  breadcrumbs: BreadcrumbItem[];
  title?: string;
  subtitle?: string;
  metadata?: string;
  actions?: ActionButton[];
  showBackButton?: boolean;
  onBackClick?: () => void;
}