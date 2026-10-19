export type TubeIndicator = 'Y' | 'P' | 'S'; // Y=Yes, P=Plasma, S=Serum

export interface TubeConfiguration {
  r1: TubeIndicator | null; // Red tube 1
  r2: TubeIndicator | null; // Red tube 2
  p1: TubeIndicator | null; // Purple tube 1
  p2: TubeIndicator | null; // Purple tube 2
}

export interface UnitEntry {
  sequence: number;
  osUnitId: string; // External/scanned unit ID
  unitId: string; // Internal unit ID (may equal osUnitId)
  checkDigit: string;
  tubes: {
    r1?: string;
    r2?: string;
    p1?: string;
    p2?: string;
  };
}
