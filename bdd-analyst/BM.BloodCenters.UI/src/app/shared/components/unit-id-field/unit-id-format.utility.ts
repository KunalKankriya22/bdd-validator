export class UnitIdFormatUtility {
  private static readonly MOD37_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ*';

  static calculateISBTCheckDigit(input: string): string {
    let si = 0;
    for (const c of input) {
      let a: number;
      if (c >= '0' && c <= '9') {
        a = c.charCodeAt(0) - 48;
      } else if (c === '*') {
        a = 36;
      } else {
        a = c.toUpperCase().charCodeAt(0) - 55;
      }
      si = ((si + a) * 2) % 37;
    }
    const checkValue = (38 - si) % 37;
    return '-' + UnitIdFormatUtility.MOD37_ALPHABET[checkValue];
  }

  static formatCode128(raw: string): string {
    let prefix = '';
    let body = raw;

    if (body.startsWith('=')) {
      prefix = '=';
      body = body.substring(1);
    }

    if (body.length < 15) {
      return raw;
    }

    const country  = body.substring(0, 1);
    const facility = body.substring(1, 5);
    const year     = body.substring(5, 7);
    const serial   = body.substring(7, 13);
    const flag     = body.substring(13);

    return `${prefix}${country}${facility} ${year} ${serial} ${flag}`;
  }
}
