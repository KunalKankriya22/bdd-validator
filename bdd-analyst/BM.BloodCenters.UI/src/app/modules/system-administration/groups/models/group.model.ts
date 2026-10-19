/**
 * Interface representing a single group
 */
export interface Group {
  applId: string;
  groupId: string;
  description: string;
  userCount: number;
}

/**
 * Interface representing a group member from API response
 */
export interface GroupMemberApiResponse {
  userId: string;
  userName: string;
  staffNo: string;
  accPriv: string;
}

/**
 * Interface representing a group member (internal use)
 */
export interface GroupMember {
  userId: string;
  name: string;
  staffId: string;
  accessLevel: number;
}

/**
 * Interface representing detailed group information with members
 */
export interface GroupDetail {
  id: string;
  description: string;
  members: GroupMember[];
}
