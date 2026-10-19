import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { ApiService } from '../../../../shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import {
  Group,
  NavigationNode,
  AccessLevelChange,
  UpdateAccessResponse,
  AddMenuItemRequest,
  AddMenuItemResponse,
  UpdateMenuItemRequest,
  UpdateMenuItemResponse
} from '../models/menu-item.model';
import {
  ApiMenuItem,
  ApiUpdateAccessRequest
} from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class MenuItemService {
  private apiService = inject(ApiService);

  getGroups(): Observable<Group[]> {
    return this.apiService.get<Group[]>(API.SYSTEM_ADMIN.MENU_ADMIN.MENU_GROUPS).pipe(
      tap((groups) => console.log('Groups loaded successfully:', groups.length)),
      catchError((error) => {
        console.error('Error fetching groups:', error);
        return throwError(() => error);
      })
    );
  }

  getOnsiteGroups(): Observable<Group[]> {
    return this.apiService.get<Group[]>(API.SYSTEM_ADMIN.MENU_ADMIN.ONSITE_MENU_GROUPS).pipe(
      tap((groups) => console.log('On-site groups loaded successfully:', groups.length)),
      catchError((error) => {
        console.error('Error fetching on-site groups:', error);
        return throwError(() => error);
      })
    );
  }

  getMenuTreeForGroup(groupId: string, applId: string = 'DON'): Observable<NavigationNode[]> {
    const endpoint = `${API.SYSTEM_ADMIN.MENU_ADMIN.MENU_LISTS(groupId)}?applId=${applId}`;
    return this.apiService.get<ApiMenuItem[]>(endpoint).pipe(
      map((apiItems) => this.convertApiMenuItemsToNavigationNodes(apiItems)),
      tap((tree) => {
        const nodeCount = this.countNodes(tree);
        console.log(`Menu tree loaded for group ${groupId}: ${nodeCount} total nodes`);
      }),
      catchError((error) => {
        console.error(`Error fetching menu tree for group ${groupId}:`, error);
        return throwError(() => error);
      })
    );
  }

  updateAccessLevels(groupId: string, changes: AccessLevelChange[], applId: string = 'DON'): Observable<UpdateAccessResponse> {
    const endpoint = `${API.SYSTEM_ADMIN.MENU_ADMIN.UPDATE_ACCESS(groupId)}?applId=${applId}`;

    const payload: ApiUpdateAccessRequest = {
      changes: changes.map(change => ({
        id: change.nodeId,
        access_Lvl: change.currentLevel
      }))
    };

    return this.apiService.put<string>(endpoint, payload, { responseType: 'text' }).pipe(
      map((responseMessage) => ({ message: responseMessage })),
      tap((response) => {
        console.log(`Access levels updated for ${changes.length} nodes in group ${groupId}: ${response.message}`);
      }),
      catchError((error) => {
        console.error(`Error updating access levels for group ${groupId}:`, error);
        return throwError(() => error);
      })
    );
  }

  addMenuItem(request: AddMenuItemRequest): Observable<AddMenuItemResponse> {
    const endpoint = API.SYSTEM_ADMIN.MENU_ADMIN.ADD_MENU_ITEM;

    return this.apiService.post<AddMenuItemResponse>(endpoint, request).pipe(
      tap((response) => {
        console.log(`Menu item created successfully: ${response.label} (ID: ${response.fcnId})`);
      }),
      catchError((error) => {
        console.error('Error creating menu item:', error);
        return throwError(() => error);
      })
    );
  }

  updateMenuItem(fcnId: string, request: UpdateMenuItemRequest): Observable<UpdateMenuItemResponse> {
    const endpoint = API.SYSTEM_ADMIN.MENU_ADMIN.UPDATE_MENU_ITEM(fcnId);

    return this.apiService.put<UpdateMenuItemResponse>(endpoint, request).pipe(
      tap((response) => {
        console.log(`Menu item updated successfully: ${response.label} (ID: ${response.fcnId})`);
      }),
      catchError((error) => {
        console.error(`Error updating menu item ${fcnId}:`, error);
        return throwError(() => error);
      })
    );
  }

  private convertApiMenuItemsToNavigationNodes(apiItems: ApiMenuItem[]): NavigationNode[] {
    return apiItems.map(item => this.convertApiMenuItem(item));
  }

  private convertApiMenuItem(item: ApiMenuItem): NavigationNode {
    return {
      id: item.fcnId.toString(),
      label: item.label,
      type: item.functionType,
      sequence: item.sequence,
      access_lvl: parseInt(item.accessLevel) || 0,
      accessLevel: item.accessLevel || '',
      mnemonic: item.mnemonic || '',
      hidden: item.hidden === 'Y',
      function_name: item.functionName,
      remarks: item.remarks || null,
      host_command: item.hostCommand || null,
      parameter_1: item.parameter1Key && item.parameter1Value
        ? { key: item.parameter1Key, value: item.parameter1Value }
        : null,
      parameter_2: item.parameter2Key && item.parameter2Value
        ? { key: item.parameter2Key, value: item.parameter2Value }
        : null,
      parameter_3: item.parameter3Key && item.parameter3Value
        ? { key: item.parameter3Key, value: item.parameter3Value }
        : null,
      children: item.children ? this.convertApiMenuItemsToNavigationNodes(item.children) : []
    };
  }

  private countNodes(nodes: NavigationNode[]): number {
    let count = nodes.length;
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        count += this.countNodes(node.children);
      }
    }
    return count;
  }
}
