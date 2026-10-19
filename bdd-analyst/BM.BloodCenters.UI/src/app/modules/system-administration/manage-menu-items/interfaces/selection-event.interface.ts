import { Group, MenuItem } from '../models/menu-item.model';

export interface GroupSelectionEvent {
  group: Group;
  index: number;
}

export interface MenuSelectionEvent {
  menuItem: MenuItem;
  index: number;
}
