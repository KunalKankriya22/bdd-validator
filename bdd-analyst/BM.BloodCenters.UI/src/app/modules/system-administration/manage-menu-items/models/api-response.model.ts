export interface ApiMenuItem {
  menuId: number;
  fcnId: number;
  label: string;
  functionType: string;
  sequence: number;
  accessLevel: string;
  mnemonic: string;
  hidden: string;
  functionName: string;
  remarks: string;
  hostCommand: string;
  parameter1Key: string;
  parameter1Value: string;
  parameter2Key: string;
  parameter2Value: string;
  parameter3Key: string;
  parameter3Value: string;
  expanded: boolean;
  route: string;
  children: ApiMenuItem[];
}

export interface ApiUpdateAccessRequest {
  changes: ApiAccessLevelChange[];
}

export interface ApiAccessLevelChange {
  id: string;
  access_Lvl: number;
}
