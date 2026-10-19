import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats phone numbers to US format
 * 
 * Usage: {{ '1234567890' | phoneNumber }}
 * Output: (123) 456-7890
 */
@Pipe({
    name: 'phoneNumber',
    standalone: true
})
export class PhoneNumberPipe implements PipeTransform {
    transform(value: string): string {
        if (!value) {
            return '';
        }

        // Remove all non-numeric characters
        const cleaned = value.replace(/\D/g, '');

        // Format as (XXX) XXX-XXXX
        if (cleaned.length === 10) {
            return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
        }

        // Format with country code as +X (XXX) XXX-XXXX
        if (cleaned.length === 11) {
            return `+${cleaned.substring(0, 1)} (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7)}`;
        }

        return value;
    }
}
