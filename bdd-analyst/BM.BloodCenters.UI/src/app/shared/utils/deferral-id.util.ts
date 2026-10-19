export function normalizeDeferralId(deferralId: string): string | null {
  if (!deferralId) return null;
  const input = deferralId.trim().toUpperCase();
  if (input.length === 10) {
    if (input[0] !== 'C' || input[9] !== 'C') return null;
    const inner = input.substring(1, 9);
    if (!/^\d{8}$/.test(inner)) return null;
    return inner;
  }
  if (input.length === 8) {
    if (!/^\d{8}$/.test(input)) return null;
    return input;
  }
  return null;
}
