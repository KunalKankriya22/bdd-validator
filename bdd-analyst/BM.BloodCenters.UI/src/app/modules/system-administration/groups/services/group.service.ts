import { Injectable, inject } from '@angular/core';
import { delay, map, Observable, of } from 'rxjs';

import { API } from '../../../../core/constants/api.constants';
import { ApiService } from '../../../../shared/services/api.service';
import { Group, GroupDetail, GroupMember, GroupMemberApiResponse } from '../models/group.model';

/**
 * Service for managing groups operations
 * Handles API calls for groups
 */
@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private apiService = inject(ApiService);

  /**
   * Maps API response to internal GroupMember format
   * @param apiMember The API response member object
   * @returns Mapped GroupMember object
   */
  private mapApiMemberToGroupMember(apiMember: GroupMemberApiResponse): GroupMember {
    return {
      userId: apiMember.userId,
      name: apiMember.userName,
      staffId: apiMember.staffNo,
      accessLevel: parseInt(apiMember.accPriv, 10)
    };
  }

  /**
   * Fetches all groups - no server-side filtering (client-side search is used)
   * @returns Observable of GroupsApiResponse
   */
  getGroups(): Observable<Group[]> {
    return this.apiService.get<Group[]>(API.SYSTEM_ADMIN.GROUPS);
  }

  /**
   * Gets detailed group information including members
   * @param applId The application ID
   * @param groupId The group ID to fetch details for
   * @returns Observable of GroupDetail
   */
  getGroupDetail(applId: string, groupId: string): Observable<GroupDetail> {
    const endpoint = `${API.SYSTEM_ADMIN.GROUPS}/${applId}/${groupId}/users`;
    return this.apiService.get<GroupMemberApiResponse[]>(endpoint).pipe(
      map(apiMembers => {
        const members = apiMembers.map(member => this.mapApiMemberToGroupMember(member));
        return {
          id: groupId,
          description: '',
          members
        };
      })
    );
  }

  /**
   * Updates a group's description
   * @param group The group object with updated information
   * @returns Observable of the updated Group
   */
  updateGroup(group: Group): Observable<Group> {
    const endpoint = `${API.SYSTEM_ADMIN.GROUPS}`;
    const payload = {
      appL_ID: group.applId,
      grP_ID: group.groupId,
      descrip: group.description
    };
    return this.apiService.put<Group>(endpoint, payload);
  }
}
