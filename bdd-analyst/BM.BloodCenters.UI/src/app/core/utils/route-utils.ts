/**
 * Utility functions for route path manipulation
 */

/**
 * Extracts the relative path segment from a full route path
 * @param fullPath The complete route path (e.g., '/application-administration/common-validation/view-institution')
 * @param prefixToRemove The prefix to remove (e.g., '/application-administration/common-validation/')
 * @returns The relative path segment (e.g., 'view-institution')
 */
export function getRelativePath(fullPath: string, prefixToRemove: string): string {
  if (!fullPath.startsWith(prefixToRemove)) {
    console.warn(`Path "${fullPath}" does not start with prefix "${prefixToRemove}"`);
    // Return the last segment as fallback
    return fullPath.split('/').filter(Boolean).pop() || '';
  }

  return fullPath.replace(prefixToRemove, '');
}

/**
 * Extracts the last segment from a route path
 * @param path The route path
 * @returns The last segment of the path
 */
export function getLastPathSegment(path: string): string {
  const segments = path.split('/').filter(Boolean);
  return segments[segments.length - 1] || '';
}

/**
 * Removes a prefix from a path and returns the remaining segments
 * @param path The full path
 * @param prefix The prefix to remove (can start with or without leading slash)
 * @returns The remaining path without the prefix
 */
export function removePathPrefix(path: string, prefix: string): string {
  // Normalize both paths to start with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const normalizedPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`;

  // Ensure prefix ends with / for clean removal
  const prefixWithSlash = normalizedPrefix.endsWith('/') ? normalizedPrefix : `${normalizedPrefix}/`;

  if (normalizedPath.startsWith(prefixWithSlash)) {
    return normalizedPath.substring(prefixWithSlash.length);
  }

  // If exact match (no trailing segments), return empty string
  if (normalizedPath === normalizedPrefix) {
    return '';
  }

  console.warn(`Path "${path}" does not start with prefix "${prefix}"`);
  return getLastPathSegment(path);
}
