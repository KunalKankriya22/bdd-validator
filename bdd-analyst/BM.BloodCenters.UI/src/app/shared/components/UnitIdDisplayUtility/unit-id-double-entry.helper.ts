/**
 * UnitIdDoubleEntryHelper
 *
 * Shared helper for Codabar manual double-entry confirmation flow.
 * Any screen with a unit ID field that accepts Codabar manual input
 * must confirm via double-entry. This helper manages the state machine.
 *
 * Flow:
 *   1. User enters unit ID → BE validates → Codabar + Manual detected
 *   2. Field clears, hint: "Re-enter unit ID to confirm"
 *   3a. Second entry matches → confirmed
 *   3b. Second entry mismatches → full reset, user starts over
 */
export type DoubleEntryAction = 'needsReentry' | 'confirmed' | 'mismatch';

export class UnitIdDoubleEntryHelper<T = unknown> {
  private pendingEntry: string | null = null;
  private pendingData: T | null = null;

  /** Whether the helper is waiting for a second entry. */
  get isPending(): boolean {
    return this.pendingEntry !== null;
  }

  /** The validated data from the first entry (available after 'confirmed'). */
  get validatedData(): T | null {
    return this.pendingData;
  }

  /**
   * Start double-entry flow after BE confirms Codabar + Manual.
   * Call this when the BE response indicates double-entry is needed.
   *
   * @param unitId - The first (validated) unit ID entry
   * @param data - The parsed validation data from BE to preserve
   */
  start(unitId: string, data: T): void {
    this.pendingEntry = unitId;
    this.pendingData = data;
  }

  /**
   * Compare the second entry against the stored first entry.
   *
   * @param unitId - The second unit ID entry
   * @returns 'confirmed' if match, 'mismatch' if no match (resets state)
   */
  verify(unitId: string): 'confirmed' | 'mismatch' {
    if (this.pendingEntry === unitId) {
      this.pendingEntry = null;
      return 'confirmed';
    }

    // Mismatch — full reset, user starts over
    this.reset();
    return 'mismatch';
  }

  /** Reset all state (called on clear, mismatch, or field emptied). */
  reset(): void {
    this.pendingEntry = null;
    this.pendingData = null;
  }
}
