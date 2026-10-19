import { FormControl } from '@angular/forms';
import { WritableSignal } from '@angular/core';

// ── Option shape reused across dropdowns ──────────────────────────────────────

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DriveOption {
  value: string;
  label: string;
  siteName: string;
  groupSiteId: string;
}

export interface MachineOption {
  value: string;
  label: string;
  donorCue: string;
  serialNumber: string;
  equipType: string;
}

export interface AttributeCodeOption {
  value: string;
  label: string;
  requiresEquipment: boolean;
  parmCode: string;
}

// ── Domain models ─────────────────────────────────────────────────────────────

export interface UnitDetail {
  unitId: string;
  bleedStartTime: string | null;
  bleedEndTime: string | null;
  donorFormAbo: string | null;
  bagCode: string | null;
  bagDescription: string | null;
  donorDecisionCode: string | null;
  siteName: string | null;
  isPheresis: boolean;
  hasComponents: boolean;
  /** DONATIONS.EQUIP_REFERENCE — fallback equipment link from donor registration (GAP 10) */
  equipReference?: string | null;
  attributes: ExistingAttributeRow[];
  equipment?: {
    parmCode: string;
    equipReference: string;
    equipType: string;
    description: string;
    serialNumber: string;
  };
}

export interface CheckedInUnit {
  unitId: string;
  donorDecisionCode: string | null;
  bleedStartTime: string | null;
  bleedEndTime: string | null;
  donorFormAbo: string | null;
  bagCode: string | null;
}

export interface ExistingAttributeRow {
  attribGroup: string;
  attribCode: string;
  groupDesc: string | null;
  codeDesc: string | null;
  requiresEquipment: boolean;
  parmCode: string | null;
}

export interface SavePayload {
  unitId: string;
  collDate: string;
  driveId: string;
  groupSiteId: string;
  donorDecisionCode: string;
  bleedStartDate?: string;
  bleedStartTime?: string;
  bleedEndDate?: string;
  bleedEndTime?: string;
  donorFormAbo?: string;
  bagCode?: string;
  attributes: AttributePayloadItem[];
  deletedAttributes: AttributePayloadItem[];
  equipment?: EquipmentPayload;
  bleedAnomaly?: string;
  extendedDayLimit?: boolean;
  cueScanFlag?: string;
  bleedEndOverride?: boolean;
}

export interface AttributePayloadItem {
  attribGroup: string;
  attribCode: string;
}

export interface EquipmentPayload {
  equipType: string;
  serialNumber: string;
  equipReference: string;
  parmCode: string;
}

// ── Attribute Row ─────────────────────────────────────────────────────────────

export interface AttributeRow {
  id: number;
  group: string;
  groupDesc: string;
  code: string;
  codeDesc: string;
  requiresEquipment: boolean;
  parmCode: string;
  groupSearchCtrl: FormControl;
  codeSearchCtrl: FormControl;
  filteredGroups: WritableSignal<DropdownOption[]>;
  filteredCodes: WritableSignal<AttributeCodeOption[]>;
}
