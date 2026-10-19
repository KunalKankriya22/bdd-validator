import { ParameterDefinition } from './view-edit-mappings/parameter-definitions/parameter-definitions';
import { ProcessStep } from './define-process/process-steps-list/process-steps-list';
import { ReflexiveAction } from './define-process/reflexive-actions-list/reflexive-actions-list';

export interface MappingItem {
  id: number;
  name: string;
  tableName: string;
  columnName: string;
}

export const PROCESS_CODES_MOCK_DATA: any[] = [
  {
    id: 1,
    code: 'RUNNER',
    effectiveDate: '11-JAN-2025',
    terminationDate: '11-JAN-2025',
    description: 'RUNNER',
    rules: [
      { type: 'donor_question', text: 'DONOR   QUESTION CODE .  =  HHQ0020' },
      { type: 'answer', text: 'ANSWER_Code  =  RUN' },
      { type: 'physical', text: 'PHYSICAL_CODE = PULSE' },
      { type: 'physical_value', text: 'PHYSICAL VALUE .  < 40' },
      { type: 'donor_place', text: 'Donor Place Dnoor_Attribute - RUNR' },
      { type: 'runner_donor', text: 'RUNNER DONOR PHYSICAL CODE = PULSE' },
      { type: 'physical_value', text: 'PHYSICAL VALUE < 40' },
      { type: 'donor_release', text: 'Donor Release INTER_CODE .  PLHLD' }
    ],
    expanded: false
  },
  {
    id: 2,
    code: 'INVPROC',
    effectiveDate: '11-JAN-2025',
    terminationDate: undefined,
    description: 'INVPROC',
    rules: [
      { type: 'donor_question', text: 'DONOR   QUESTION CODE .  =  HHQ0035' },
      { type: 'answer', text: 'ANSWER_Code  =  INV' },
      { type: 'physical', text: 'PHYSICAL_CODE = WEIGHT' },
      { type: 'physical_value', text: 'PHYSICAL VALUE .  < 50' },
      { type: 'donor_release', text: 'Donor Release INTER_CODE .  INVLD' }
    ],
    expanded: false
  },
  {
    id: 3,
    code: 'SHIPOUT',
    effectiveDate: '11-JAN-2025',
    terminationDate: undefined,
    description: 'SHIPOUT',
    rules: [
      { type: 'donor_question', text: 'DONOR   QUESTION CODE .  =  HHQ0042' },
      { type: 'answer', text: 'ANSWER_Code  =  SHP' },
      { type: 'donor_place', text: 'Donor Place Donor_Attribute - SHIP' },
      { type: 'physical', text: 'PHYSICAL_CODE = TEMP' },
      { type: 'physical_value', text: 'PHYSICAL VALUE .  > 37' },
      { type: 'donor_release', text: 'Donor Release INTER_CODE .  SHPLD' }
    ],
    expanded: false
  },
  {
    id: 4,
    code: 'AUDLOG',
    effectiveDate: '11-JAN-2025',
    terminationDate: '11-JAN-2026',
    description: 'AUDLOG',
    rules: [
      { type: 'donor_question', text: 'DONOR   QUESTION CODE .  =  HHQ0055' },
      { type: 'answer', text: 'ANSWER_Code  =  AUD' },
      { type: 'physical', text: 'PHYSICAL_CODE = BP_SYS' },
      { type: 'physical_value', text: 'PHYSICAL VALUE .  > 180' },
      { type: 'donor_place', text: 'Donor Place Donor_Attribute - AUDT' },
      { type: 'donor_release', text: 'Donor Release INTER_CODE .  AUDLD' }
    ],
    expanded: false
  }
];

export const PARAMETER_DEFINITIONS_MOCK_DATA: ParameterDefinition[] = [
  { id: 1, code: 'P_UNIT_ID', type: 'CHAR', referenceTable: 'UNITS, COMPONENTS, XYZ TABLE', referenceColumn: 'UNIT_ID', defaultValue: 'abc' },
  { id: 2, code: 'P_UNIT_ID', type: 'CHAR', referenceTable: 'UNITS, COMPONENTS, XYZ TABLE', referenceColumn: 'UNIT_ID', defaultValue: '-' },
  { id: 3, code: 'P_UNIT_ID', type: 'CHAR', referenceTable: 'UNITS, COMPONENTS, XYZ TABLE', referenceColumn: 'UNIT_ID', defaultValue: '-' },
];

export const PROCESS_STEPS_MOCK_DATA: ProcessStep[] = [
  {
    id: '1',
    sequence: '1.00',
    name: 'DONOR ID CHECK',
    conditions: [
      { id: '1.01', sequence: '1.01', description: 'Donation | donor / donorId, EQ, NOT_NULL' },
      { id: '1.02', sequence: '1.02', description: 'Donation | donor / linkedStatus, EQ, LINKED' }
    ]
  },
  {
    id: '2',
    sequence: '2.00',
    name: 'Lab Donation Check',
    conditions: [
      { id: '2.01', sequence: '2.01', description: 'Test Result | donation / donationType, EQ, WHOLE_BLOOD' }
    ]
  },
  {
    id: '3',
    sequence: '3.00',
    name: 'Lab Previously Scheduled Tests',
    conditions: [
      { id: '3.01', sequence: '3.01', description: 'Test Result | utrs / testLid, EQ, CHAG' },
      { id: '3.02', sequence: '3.02', description: 'Test Result | utrs / testLid, EQ, CHAG' }
    ]
  },
  {
    id: '4',
    sequence: '4.00',
    name: 'Lab Previously Un-Scheduled Tests',
    conditions: [
      { id: '4.01', sequence: '4.01', description: 'Physical Exam | utrs / testLid, EQ, CHAG' },
      { id: '4.02', sequence: '4.02', description: 'Physical Exam | utrs / result_code, IS, NULL' }
    ]
  },
  {
    id: '5',
    sequence: '5.00',
    name: 'Lab Previously Scheduled Tests - Invalid',
    conditions: [
      { id: '5.01', sequence: '5.01', description: 'Donation | utrs / testLid, EQ, CHAG' },
      { id: '5.02', sequence: '5.02', description: 'Donation | utrs / result_code, IS, NULL' }
    ]
  },
  {
    id: '6',
    sequence: '6.00',
    name: 'Lab Previously Scheduled Tests - Test',
    conditions: [
      { id: '6.01', sequence: '6.01', description: 'Test Result | utrs / test_id, EQ, CHAG' },
      { id: '6.02', sequence: '6.02', description: 'Test Result | utrs / result_code, IS, NULL' }
    ]
  }
];

export const REFLEXIVE_ACTIONS_MOCK_DATA: ReflexiveAction[] = [
  { id: '1', code: 'A01', name: 'SCHEDULE',      actionOn: 'DON DONATION TYPE',          actionValue: 'CHAP', badge: 'MCISRCEN' },
  { id: '2', code: 'A01', name: 'PLACE',         actionOn: 'DON DONATION TYPE',          actionValue: 'CHRP' },
  { id: '3', code: 'A02', name: 'SCHEDULE LATER',actionOn: 'DON DONATION TYPE',          actionValue: 'CHAG', linkedAction: 'A01' },
  { id: '4', code: 'A03', name: 'REMOVE',        actionOn: 'UNIT_INTERDICTIONS / INTER_CODE', actionValue: 'CHRP', badge: 'RTURLOAD' }
];

export const ACTION_FLOW_CONFIG_MOCK_DATA: Record<string, { processOrder: string; alternateProcessOrder: string; operator: string }> = {
  '1': { processOrder: '1,2,3,4,5,6', alternateProcessOrder: '1,2,3 OR 4,5,6',  operator: 'OR'  },
  '2': { processOrder: '1,2,3,4,5',   alternateProcessOrder: '1,2 AND 3,4,5',    operator: 'AND' },
  '3': { processOrder: '1,2,3,4',     alternateProcessOrder: '1,2 OR 3,4',       operator: 'OR'  },
  '4': { processOrder: '1,2,3,4,5,6', alternateProcessOrder: '1,2,3 AND 4,5,6', operator: 'AND' },
};

export const ADD_STEP_DIALOG_STEPS_MOCK_DATA: Array<{ id: string; name: string }> = [
  { id: '1', name: 'Lab Previously Scheduled Invalid' },
  { id: '2', name: 'Lab Previously Scheduled Test2' },
  { id: '3', name: 'Donor ID Check test3' },
  { id: '4', name: 'Lab Donation Check test4' }
];

export const LOOKING_FOR_OPTIONS: string[] = ['Donation', 'Test Result', 'Physical Exam'];
export const OPERATOR_OPTIONS: string[] = ['OR', 'AND', 'NOT', 'EQUALS', 'IS', 'EQ'];
export const ACTION_OPTIONS: string[] = ['SCHEDULE', 'PLACE', 'REMOVE', 'UPDATE'];
export const PARENT_GROUP_OPTIONS: string[] = ['A01', 'A02', 'A03', 'A04'];

export const MAPPING_ITEMS_MOCK_DATA: MappingItem[] = [
  { id: 1, name: 'DON DONATION TYPE',           tableName: 'Donations',         columnName: 'Donation_Type' },
  { id: 2, name: 'DON TEST',                    tableName: 'Unit_Test_Results',  columnName: 'Test_ID' },
  { id: 3, name: 'Don Test Result',             tableName: 'Unit_Test_Results',  columnName: 'Result_Code' },
  { id: 4, name: 'Don Unit',                    tableName: 'Donations',          columnName: 'Unit_ID' },
  { id: 5, name: 'Donor Not Linked Check',      tableName: 'Donations',          columnName: 'Donor_ID' },
  { id: 6, name: 'Lab Donation Type',           tableName: 'Unit_Attributes',    columnName: 'Attribution_Code' },
  { id: 7, name: 'Lab Previous Scheduled Test', tableName: '-',                  columnName: '-' },
  { id: 8, name: 'DON DONATION TYPE',           tableName: 'Donations',          columnName: 'Donation_Type' }
];
