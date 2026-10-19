export interface LoginCredentials {
    username: string;
    password: string;
    rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  error?: string;
  remainingAttempts?: number;
  is_account_locked?: boolean;
  pass_attempts_left?: number;
  total_no_of_pass_attempts?: number;
  is_password_expired?: boolean;
  password_warning_notice?: number;
  password_expiry_date?: string;
  lockout_period?: number; // Lockout duration in minutes from API
  lockout_until?: string | null;
  reset_request?: boolean;
}

export interface OktaConfigResponse {
  isSuccess: boolean;
  message?: string;
  responseCode?: number;
  data?: {
    enabled: boolean;
  };
  error?: {
    errorCode: number;
    errorMessage: string;
  };
}

export interface MessageDialogAction {
  label: string;   
  action: string;  
  variant?: 'primary' | 'secondary';
}

export interface MessageDialogData {
  title: string;     
  message?: string;    
  params?: Record<string, any>; 
  icon?: 'error' | 'warning' | 'info' | 'success';

  /**
   * Optional custom content
   * Used for complex layouts (timers, banners, lists)
   */
  contentTemplate?: any;

  primaryAction: MessageDialogAction;
  secondaryAction?: MessageDialogAction;
}
