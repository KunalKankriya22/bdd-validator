import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe to format menu item text for proper display
 * - Removes special characters like "= >", "=>", etc.
 * - Preserves original text casing
 * - Cleans up extra whitespace
 */
@Pipe({
  name: 'menuTextFormat',
  standalone: true
})
export class MenuTextFormatPipe implements PipeTransform {

  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    let formatted = value;

    // Remove special character patterns like "= >", "=>", "->", etc.
    formatted = formatted.replace(/\s*[=\-]+\s*>+\s*/g, ' ');

    // Remove leading/trailing special characters only (not in between)
    formatted = formatted.replace(/^[=\-_|]+\s*/, '');
    formatted = formatted.replace(/\s*[=\-_|]+$/, '');

    // Remove other special characters that shouldn't be in menu text (underscores, pipes)
    formatted = formatted.replace(/[_|]/g, ' ');

    // Clean up multiple spaces
    formatted = formatted.replace(/\s+/g, ' ').trim();

    // Return as-is without case transformation
    return formatted;
  }
}
