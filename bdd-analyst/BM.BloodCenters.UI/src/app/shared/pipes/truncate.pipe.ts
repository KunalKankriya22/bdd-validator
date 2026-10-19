import { Pipe, PipeTransform } from '@angular/core';

/**
 * Truncates text to specified length and adds ellipsis
 * 
 * Usage: {{ longText | truncate:50 }}
 * Usage with custom suffix: {{ longText | truncate:50:'...' }}
 */
@Pipe({
    name: 'truncate',
    standalone: true
})
export class TruncatePipe implements PipeTransform {
    transform(value: string, limit: number = 50, suffix: string = '...'): string {
        if (!value) {
            return '';
        }

        if (value.length <= limit) {
            return value;
        }

        return value.substring(0, limit).trim() + suffix;
    }
}
