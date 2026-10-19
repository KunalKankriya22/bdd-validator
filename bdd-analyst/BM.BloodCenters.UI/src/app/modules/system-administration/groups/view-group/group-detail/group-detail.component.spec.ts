import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { signal } from '@angular/core';

import { GroupDetailComponent } from './group-detail.component';
import { Group, GroupDetail } from '../../models/group.model';
import { GroupService } from '../../services/group.service';
import { HeaderService } from '../../../../../shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('GroupDetailComponent', () => {
  let component: GroupDetailComponent;
  let fixture: ComponentFixture<GroupDetailComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<GroupDetailComponent>>;
  let groupServiceSpy: jasmine.SpyObj<GroupService>;

  const mockGroup: Group = {
    applId: 'DON',
    groupId: 'GRP01',
    description: 'Test Group',
    userCount: 3
  };

  const mockGroupDetail: GroupDetail = {
    id: 'GRP01',
    description: 'Test Group',
    members: [
      { userId: 'USER1', name: 'Test User 1', staffId: 'STAFF1', accessLevel: 1 },
      { userId: 'USER2', name: 'Test User 2', staffId: 'STAFF2', accessLevel: 2 },
      { userId: 'USER3', name: 'Test User 3', staffId: 'STAFF3', accessLevel: 3 }
    ]
  };

  const mockGroup2: Group = {
    applId: 'DON',
    groupId: 'GRP02',
    description: 'Test Group 2',
    userCount: 2
  };

  const mockGroup3: Group = {
    applId: 'DON',
    groupId: 'GRP03',
    description: 'Test Group 3',
    userCount: 1
  };

  const mockDialogData = {
    group: mockGroup,
    groupDetail: mockGroupDetail,
    currentIndex: 1,
    totalGroups: 5,
    allGroups: [mockGroup]
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const groupSpy = jasmine.createSpyObj('GroupService', ['getGroupDetail']);
    groupSpy.getGroupDetail.and.returnValue(of(mockGroupDetail));

    // Mock HeaderService with timezone signal
    const headerServiceSpy = createMockHeaderService();

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatDialogModule,
        TranslateModule.forRoot(),
        GroupDetailComponent
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: GroupService, useValue: groupSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    }).compileComponents();

    groupServiceSpy = TestBed.inject(GroupService) as jasmine.SpyObj<GroupService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with all members', () => {
    expect(component.filteredMembers.length).toBe(3);
    expect(component.filteredMembers).toEqual(mockGroupDetail.members);
  });

  it('should filter members when search is performed', () => {
    component.onSearch('User 2');

    expect(component.filteredMembers.length).toBe(1);
    expect(component.filteredMembers[0].userId).toBe('USER2');
  });

  describe('constructor initialization', () => {
    it('should set group from dialog data', () => {
      expect(component.group).toEqual(mockGroup);
    });

    it('should set groupDetail from dialog data', () => {
      expect(component.groupDetail).toEqual(mockGroupDetail);
    });

    it('should set currentIndex from dialog data', () => {
      expect(component.currentIndex).toBe(1);
    });

    it('should set totalGroups from dialog data', () => {
      expect(component.totalGroups).toBe(5);
    });

    it('should set allGroups from dialog data', () => {
      expect(component.allGroups).toEqual([mockGroup]);
    });

    it('should initialize filteredMembers as a copy of groupDetail.members', () => {
      expect(component.filteredMembers).toEqual(mockGroupDetail.members);
      expect(component.filteredMembers).not.toBe(mockGroupDetail.members);
    });

    it('should initialize originalMembers as a copy of groupDetail.members', () => {
      expect(component.originalMembers).toEqual(mockGroupDetail.members);
      expect(component.originalMembers).not.toBe(mockGroupDetail.members);
    });

    it('should initialize searchQuery as empty string', () => {
      expect(component.searchQuery).toBe('');
    });

    it('should initialize displayedColumns', () => {
      expect(component.displayedColumns).toEqual(['userId', 'name', 'staffId', 'accessLevel']);
    });

    it('should initialize sortState with null column and direction', () => {
      expect(component.sortState).toEqual({ column: null, direction: null });
    });

    it('should set searchConfig with expected values', () => {
      expect(component.searchConfig.placeholder).toBe('Search by ID, Name, or Access Level');
      expect(component.searchConfig.minLength).toBe(1);
      expect(component.searchConfig.searchOnEnterOnly).toBeTrue();
      expect(component.searchConfig.alwaysShowTooltip).toBeTrue();
      expect(component.searchConfig.debounceTime).toBe(300);
    });
  });

  describe('showNoResults getter', () => {
    it('should return true when filteredMembers is empty and searchQuery is not empty', () => {
      component.filteredMembers = [];
      component.searchQuery = 'nonexistent';
      expect(component.showNoResults).toBeTrue();
    });

    it('should return false when filteredMembers is not empty', () => {
      component.filteredMembers = [{ userId: 'U1', name: 'N1', staffId: 'S1', accessLevel: 1 }];
      component.searchQuery = 'something';
      expect(component.showNoResults).toBeFalse();
    });

    it('should return false when searchQuery is empty', () => {
      component.filteredMembers = [];
      component.searchQuery = '';
      expect(component.showNoResults).toBeFalse();
    });
  });

  describe('showEmptyState getter', () => {
    it('should return true when filteredMembers is empty and searchQuery is empty', () => {
      component.filteredMembers = [];
      component.searchQuery = '';
      expect(component.showEmptyState).toBeTrue();
    });

    it('should return false when filteredMembers is not empty', () => {
      component.filteredMembers = [{ userId: 'U1', name: 'N1', staffId: 'S1', accessLevel: 1 }];
      component.searchQuery = '';
      expect(component.showEmptyState).toBeFalse();
    });

    it('should return false when searchQuery is not empty', () => {
      component.filteredMembers = [];
      component.searchQuery = 'something';
      expect(component.showEmptyState).toBeFalse();
    });
  });

  describe('getNoDataMessage', () => {
    it('should return the expected message', () => {
      expect(component.getNoDataMessage()).toBe('No added members & access available to display');
    });
  });

  describe('onSearch', () => {
    it('should set searchQuery to lowercase', () => {
      component.onSearch('TEST QUERY');
      expect(component.searchQuery).toBe('test query');
    });

    it('should filter members by userId', () => {
      component.onSearch('USER1');
      expect(component.filteredMembers.length).toBe(1);
      expect(component.filteredMembers[0].userId).toBe('USER1');
    });

    it('should filter members by name', () => {
      component.onSearch('Test User 3');
      expect(component.filteredMembers.length).toBe(1);
      expect(component.filteredMembers[0].name).toBe('Test User 3');
    });

    it('should filter members by accessLevel', () => {
      component.onSearch('2');
      // '2' matches USER2 (userId contains '2', name contains '2', accessLevel is 2)
      expect(component.filteredMembers.length).toBe(1);
      expect(component.filteredMembers[0].userId).toBe('USER2');
    });

    it('should return empty array when no matches found', () => {
      component.onSearch('NONEXISTENT');
      expect(component.filteredMembers.length).toBe(0);
    });

    it('should be case insensitive', () => {
      component.onSearch('user1');
      expect(component.filteredMembers.length).toBe(1);
      expect(component.filteredMembers[0].userId).toBe('USER1');
    });
  });

  describe('onSearchCleared', () => {
    it('should reset searchQuery to empty string', () => {
      component.searchQuery = 'some search';
      component.onSearchCleared();
      expect(component.searchQuery).toBe('');
    });

    it('should restore all members', () => {
      component.onSearch('USER1');
      expect(component.filteredMembers.length).toBe(1);
      component.onSearchCleared();
      expect(component.filteredMembers.length).toBe(3);
    });
  });

  describe('onSort', () => {
    it('should do nothing when column is null', () => {
      component.sortState = { column: 'userId', direction: 'asc' };
      component.onSort(null);
      expect(component.sortState).toEqual({ column: 'userId', direction: 'asc' });
    });

    it('should set ascending direction for a new column', () => {
      component.onSort('userId');
      expect(component.sortState).toEqual({ column: 'userId', direction: 'asc' });
    });

    it('should cycle from asc to desc for same column', () => {
      component.onSort('userId');
      expect(component.sortState.direction).toBe('asc');
      component.onSort('userId');
      expect(component.sortState).toEqual({ column: 'userId', direction: 'desc' });
    });

    it('should cycle from desc to null for same column', () => {
      component.onSort('userId');
      component.onSort('userId');
      component.onSort('userId');
      expect(component.sortState).toEqual({ column: null, direction: null });
    });

    it('should cycle from null back to asc for same column', () => {
      component.onSort('userId');
      component.onSort('userId');
      component.onSort('userId');
      // Now null
      component.onSort('userId');
      expect(component.sortState).toEqual({ column: 'userId', direction: 'asc' });
    });

    it('should reset to asc when switching to a different column', () => {
      component.onSort('userId');
      component.onSort('userId'); // desc
      component.onSort('name'); // new column -> asc
      expect(component.sortState).toEqual({ column: 'name', direction: 'asc' });
    });

    it('should sort members in ascending order by userId', () => {
      component.onSort('userId');
      expect(component.filteredMembers[0].userId).toBe('USER1');
      expect(component.filteredMembers[2].userId).toBe('USER3');
    });

    it('should sort members in descending order by userId', () => {
      component.onSort('userId');
      component.onSort('userId');
      expect(component.filteredMembers[0].userId).toBe('USER3');
      expect(component.filteredMembers[2].userId).toBe('USER1');
    });

    it('should sort members by name ascending', () => {
      component.onSort('name');
      expect(component.filteredMembers[0].name).toBe('Test User 1');
      expect(component.filteredMembers[2].name).toBe('Test User 3');
    });

    it('should sort members by staffId ascending', () => {
      component.onSort('staffId');
      expect(component.filteredMembers[0].staffId).toBe('STAFF1');
      expect(component.filteredMembers[2].staffId).toBe('STAFF3');
    });

    it('should sort members by accessLevel ascending', () => {
      component.onSort('accessLevel');
      expect(component.filteredMembers[0].accessLevel).toBe(1);
      expect(component.filteredMembers[2].accessLevel).toBe(3);
    });

    it('should sort members by accessLevel descending', () => {
      component.onSort('accessLevel');
      component.onSort('accessLevel');
      expect(component.filteredMembers[0].accessLevel).toBe(3);
      expect(component.filteredMembers[2].accessLevel).toBe(1);
    });

    it('should restore original order when sort is cleared', () => {
      component.onSort('userId');
      component.onSort('userId');
      component.onSort('userId'); // clear sort
      expect(component.filteredMembers).toEqual(mockGroupDetail.members);
    });

    it('should maintain search results when sorting', () => {
      component.onSearch('User');
      const searchCount = component.filteredMembers.length;
      component.onSort('userId');
      expect(component.filteredMembers.length).toBe(searchCount);
    });
  });

  describe('getSortIcon', () => {
    it('should return unfold_more when column is not sorted', () => {
      expect(component.getSortIcon('userId')).toBe('unfold_more');
    });

    it('should return arrow_upward when column is sorted ascending', () => {
      component.onSort('userId');
      expect(component.getSortIcon('userId')).toBe('arrow_upward');
    });

    it('should return arrow_downward when column is sorted descending', () => {
      component.onSort('userId');
      component.onSort('userId');
      expect(component.getSortIcon('userId')).toBe('arrow_downward');
    });

    it('should return unfold_more for a different column than the one sorted', () => {
      component.onSort('userId');
      expect(component.getSortIcon('name')).toBe('unfold_more');
    });
  });

  describe('getSortAriaLabel', () => {
    it('should return empty string when column is null', () => {
      expect(component.getSortAriaLabel(null)).toBe('');
    });

    it('should return "Sort by <column>" when column is not currently sorted', () => {
      expect(component.getSortAriaLabel('userId')).toBe('Sort by userId');
    });

    it('should return "Sort <column> descending" when column is sorted ascending', () => {
      component.onSort('userId');
      expect(component.getSortAriaLabel('userId')).toBe('Sort userId descending');
    });

    it('should return "Sort <column> ascending" when column is sorted descending', () => {
      component.onSort('userId');
      component.onSort('userId');
      expect(component.getSortAriaLabel('userId')).toBe('Sort userId ascending');
    });

    it('should return "Sort by <column>" for a different column than the sorted one', () => {
      component.onSort('userId');
      expect(component.getSortAriaLabel('name')).toBe('Sort by name');
    });
  });

  describe('closeDialog', () => {
    it('should call dialogRef.close', () => {
      component.closeDialog();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('getCurrentGroupIndex', () => {
    it('should return the current index', () => {
      expect(component.getCurrentGroupIndex()).toBe(1);
    });
  });

  describe('getTotalGroups', () => {
    it('should return the total groups', () => {
      expect(component.getTotalGroups()).toBe(5);
    });
  });

  describe('isFirstGroup', () => {
    it('should return true when currentIndex is 1', () => {
      component.currentIndex = 1;
      expect(component.isFirstGroup()).toBeTrue();
    });

    it('should return false when currentIndex is greater than 1', () => {
      component.currentIndex = 3;
      expect(component.isFirstGroup()).toBeFalse();
    });
  });

  describe('isLastGroup', () => {
    it('should return true when currentIndex equals totalGroups', () => {
      component.currentIndex = 5;
      component.totalGroups = 5;
      expect(component.isLastGroup()).toBeTrue();
    });

    it('should return false when currentIndex is less than totalGroups', () => {
      component.currentIndex = 3;
      component.totalGroups = 5;
      expect(component.isLastGroup()).toBeFalse();
    });
  });

  describe('navigateToPreviousGroup', () => {
    it('should not navigate when at the first group', () => {
      component.currentIndex = 1;
      component.navigateToPreviousGroup();
      expect(groupServiceSpy.getGroupDetail).not.toHaveBeenCalled();
    });

    it('should load the previous group detail when not at first group', () => {
      component.allGroups = [mockGroup, mockGroup2, mockGroup3];
      component.currentIndex = 2;
      component.navigateToPreviousGroup();
      expect(groupServiceSpy.getGroupDetail).toHaveBeenCalledWith(mockGroup.applId, mockGroup.groupId);
    });

    it('should load the correct previous group based on currentIndex', () => {
      component.allGroups = [mockGroup, mockGroup2, mockGroup3];
      component.currentIndex = 3;
      component.navigateToPreviousGroup();
      expect(groupServiceSpy.getGroupDetail).toHaveBeenCalledWith(mockGroup2.applId, mockGroup2.groupId);
    });
  });

  describe('navigateToNextGroup', () => {
    it('should not navigate when at the last group', () => {
      component.currentIndex = 5;
      component.totalGroups = 5;
      component.navigateToNextGroup();
      expect(groupServiceSpy.getGroupDetail).not.toHaveBeenCalled();
    });

    it('should load the next group detail when not at last group', () => {
      component.allGroups = [mockGroup, mockGroup2, mockGroup3];
      component.currentIndex = 1;
      component.totalGroups = 3;
      component.navigateToNextGroup();
      expect(groupServiceSpy.getGroupDetail).toHaveBeenCalledWith(mockGroup2.applId, mockGroup2.groupId);
    });

    it('should load the correct next group based on currentIndex', () => {
      component.allGroups = [mockGroup, mockGroup2, mockGroup3];
      component.currentIndex = 2;
      component.totalGroups = 3;
      component.navigateToNextGroup();
      expect(groupServiceSpy.getGroupDetail).toHaveBeenCalledWith(mockGroup3.applId, mockGroup3.groupId);
    });
  });

  describe('loadGroupDetail via navigateToNextGroup (preserveSearch=true)', () => {
    const nextGroupDetail: GroupDetail = {
      id: 'GRP02',
      description: 'Test Group 2',
      members: [
        { userId: 'ALPHA', name: 'Alpha User', staffId: 'SA', accessLevel: 5 },
        { userId: 'BETA', name: 'Beta User', staffId: 'SB', accessLevel: 10 }
      ]
    };

    beforeEach(() => {
      component.allGroups = [mockGroup, mockGroup2, mockGroup3];
      component.currentIndex = 1;
      component.totalGroups = 3;
    });

    it('should update group, groupDetail, and currentIndex on successful load', () => {
      groupServiceSpy.getGroupDetail.and.returnValue(of(nextGroupDetail));
      component.navigateToNextGroup();
      expect(component.group).toEqual(mockGroup2);
      expect(component.groupDetail).toEqual(nextGroupDetail);
    });

    it('should update currentIndex based on position in allGroups', () => {
      groupServiceSpy.getGroupDetail.and.returnValue(of(nextGroupDetail));
      component.navigateToNextGroup();
      // mockGroup2.groupId is 'GRP02', it's at index 1, so currentIndex should be 2
      expect(component.currentIndex).toBe(2);
    });

    it('should preserve search query and reapply filters when navigating with active search', () => {
      component.onSearch('USER1');
      expect(component.searchQuery).toBe('user1');
      groupServiceSpy.getGroupDetail.and.returnValue(of(nextGroupDetail));
      component.navigateToNextGroup();
      // Search is preserved, 'user1' should not match any member in nextGroupDetail
      expect(component.searchQuery).toBe('user1');
      expect(component.filteredMembers.length).toBe(0);
    });

    it('should show all members when navigating without active search', () => {
      groupServiceSpy.getGroupDetail.and.returnValue(of(nextGroupDetail));
      component.navigateToNextGroup();
      expect(component.searchQuery).toBe('');
      expect(component.filteredMembers.length).toBe(2);
      expect(component.originalMembers.length).toBe(2);
    });
  });

  describe('refreshGroupDetail', () => {
    it('should call loadGroupDetail with the current group', () => {
      const refreshedDetail: GroupDetail = {
        id: 'GRP01',
        description: 'Refreshed',
        members: [
          { userId: 'USER1', name: 'Test User 1', staffId: 'STAFF1', accessLevel: 1 }
        ]
      };
      groupServiceSpy.getGroupDetail.and.returnValue(of(refreshedDetail));
      component.refreshGroupDetail();
      expect(groupServiceSpy.getGroupDetail).toHaveBeenCalledWith(mockGroup.applId, mockGroup.groupId);
    });

    it('should preserve search when refreshing', () => {
      component.onSearch('USER1');
      const refreshedDetail: GroupDetail = {
        id: 'GRP01',
        description: 'Refreshed',
        members: [
          { userId: 'USER1', name: 'Test User 1', staffId: 'STAFF1', accessLevel: 1 },
          { userId: 'USER4', name: 'Test User 4', staffId: 'STAFF4', accessLevel: 4 }
        ]
      };
      groupServiceSpy.getGroupDetail.and.returnValue(of(refreshedDetail));
      component.refreshGroupDetail();
      expect(component.searchQuery).toBe('user1');
      expect(component.filteredMembers.length).toBe(1);
      expect(component.filteredMembers[0].userId).toBe('USER1');
    });
  });

  describe('applyFilters integration', () => {
    it('should apply both search and sort together', () => {
      // First search to filter down
      component.onSearch('User');
      // All 3 match "User" in name
      expect(component.filteredMembers.length).toBe(3);
      // Then sort descending by userId
      component.onSort('userId');
      component.onSort('userId');
      expect(component.filteredMembers[0].userId).toBe('USER3');
      expect(component.filteredMembers[2].userId).toBe('USER1');
    });

    it('should maintain sort when search is cleared', () => {
      component.onSort('userId');
      component.onSort('userId'); // desc
      component.onSearch('User');
      component.onSearchCleared();
      // Sort should still be active after clearing search
      expect(component.sortState.direction).toBe('desc');
      expect(component.filteredMembers[0].userId).toBe('USER3');
    });

    it('should update originalMembers when search changes', () => {
      component.onSearch('USER1');
      expect(component.originalMembers.length).toBe(1);
      component.onSearchCleared();
      expect(component.originalMembers.length).toBe(3);
    });
  });
});
