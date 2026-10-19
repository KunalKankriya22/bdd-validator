import { HttpContextToken } from '@angular/common/http';

/**
 * When set to true on a request, the auth interceptor will NOT show an error snackbar.
 * When set to an array of status codes (e.g. [409]), the snackbar is skipped
 * only for those specific HTTP status codes.
 * Use this for APIs where errors are handled inline (e.g., field-level validation, confirmation dialogs).
 */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean | number[]>(() => false);

export const SKIP_AUTH_REDIRECT = new HttpContextToken<boolean>(() => false);
