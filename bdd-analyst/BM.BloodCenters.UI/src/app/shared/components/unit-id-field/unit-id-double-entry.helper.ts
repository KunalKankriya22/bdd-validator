export type DoubleEntryResult<T> =
  | { result: 'confirmed'; data: T }
  | { result: 'mismatch' };

export class UnitIdDoubleEntryHelper<T = unknown> {
  private pendingEntry: string | null = null;
  private pendingData: T | null = null;

  get isPending(): boolean {
    return this.pendingEntry !== null;
  }

  start(unitId: string, data: T): void {
    this.pendingEntry = unitId;
    this.pendingData = data;
  }

  verify(unitId: string): DoubleEntryResult<T> {
    if (this.pendingEntry === unitId) {
      const data = this.pendingData as T;
      this.pendingEntry = null;
      return { result: 'confirmed', data };
    }
    this.reset();
    return { result: 'mismatch' };
  }

  reset(): void {
    this.pendingEntry = null;
    this.pendingData = null;
  }
}
