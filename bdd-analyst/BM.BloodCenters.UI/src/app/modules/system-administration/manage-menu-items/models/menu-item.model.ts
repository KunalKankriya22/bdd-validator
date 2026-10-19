export interface Group {
  applId: string;
  groupId: string;
  description: string;
  userCount: number;
  lastModifiedDate: string;
}

export interface MenuParameter {
  key: string;
  value: string;
}

export interface NavigationNode {
  id: string;
  label: string;
  type: string;
  sequence: number;
  access_lvl: number;
  accessLevel?: string | null;
  mnemonic?: string | null;
  hidden: boolean;
  function_name: string;
  remarks?: string | null;
  host_command?: string | null;
  parameter_1?: MenuParameter | null;
  parameter_2?: MenuParameter | null;
  parameter_3?: MenuParameter | null;
  children?: NavigationNode[];
  _isExpanded?: boolean;
  _originalAccessLvl?: number;
}

export interface AccessLevelChange {
  nodeId: string;
  originalLevel: number;
  currentLevel: number;
}

export interface UpdateAccessResponse {
  message: string;
}

export interface MenuDetails {
  label: string;
  type: 'Menu' | 'Page';
  function_name: string;
  sequence: number;
  remarks: string | null;
  parameter_1: MenuParameter | null;
  parameter_2: MenuParameter | null;
  parameter_3: MenuParameter | null;
  host_command: string | null;
}

export interface MenuItem {
  menuId: string;
  menuName: string;
  parentId?: string;
  sequence?: number;
}

export interface MoveMenuItemRequest {
  targetParentMenuId: number;
  targetSequence: number;
}

export interface MoveMenuItemResponse {
  fcnId: number;
  previousParentMenuId: number;
  previousSequence: number;
  newParentMenuId: number;
  newSequence: number;
  message: string;
}

export interface AddMenuItemRequest {
  applId: string;
  fcnId: number;
  label: string;
  parentMenuId: number;
  sequence: number;
  parameter1Value?: string;
  parameter2Value?: string;
  parameter3Value?: string;
  hidden?: string;
  remarks?: string;
}

export interface AddMenuItemResponse {
  fcnId: number;
  label: string;
  functionType: string;
  functionName: string;
  parentMenuId: number;
  sequence: number;
  hostCommand?: string;
  parameter1Key?: string;
  parameter2Key?: string;
  parameter3Key?: string;
  message: string;
}

export interface UpdateMenuItemRequest {
  applId: string;
  label: string;
  sequence: number;
  parentMenuId: number;
  mnemonic?: string;
  accessLevel?: string;
  parameter1Key?: string;
  parameter1Value?: string;
  parameter2Key?: string;
  parameter2Value?: string;
  parameter3Key?: string;
  parameter3Value?: string;
  hidden?: string;
  remarks?: string;
}

export interface UpdateMenuItemResponse {
  fcnId: number;
  label: string;
  sequence: number;
  message: string;
}
