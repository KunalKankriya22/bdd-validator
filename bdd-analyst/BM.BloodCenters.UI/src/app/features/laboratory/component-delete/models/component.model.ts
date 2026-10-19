/**
 * Component Model - Maps to COMPONENTS table
 * Represents a blood component in inventory
 * 21 properties total
 */
export interface Component {
  unitId: string;
  collDate: Date;
  chapterId: string;
  componentPrefix: string;
  productCode: string;
  bagId: string;
  programId: string;
  insertDats: Date;
  componentStatus: string;
  expiryDate: Date | null;
  systemLabelDecision: string | null;
  rejectReasonCode: string | null;
  relabelProductCode: string | null;
  pooledComponentId: string | null;
  voidReasonCode: string | null;
  outOfSystemDats: Date | null;
  componentWeight: number | null;
  componentCount: number | null;
  noteId: number | null;
  labelUserId: string | null;
  labelDats: Date | null;
}
