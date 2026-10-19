import { ApiMenuItem } from '../constants/fcn-route-map';

export interface MenuAccessData {
  userId: string;
  groupId: string;
  userAccessLevel: number;
  menuItems: ApiMenuItem[];
}

export type MenuWithAccessResponse =
  | { isSuccess: boolean; data: MenuAccessData }
  | MenuAccessData;