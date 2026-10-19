import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { ManageGroupComponent } from './manage-group.component';
import { GroupService } from '../services/group.service';
import { Group } from '../models/group.model';

describe('ManageGroupComponent', () => {
  let component: ManageGroupComponent;
  let fixture: ComponentFixture<ManageGroupComponent>;
  let groupService: jasmine.SpyObj<GroupService>;

  const mockGroups: Group[] = [
    {
      applId: 'APP1',
      groupId: 'ADM00',
      description: 'Administrator Group',
      userCount: 8,
    },
    {
      applId: 'APP1',
      groupId: 'GRP01',
      description: 'Blood Bank Technicians',
      userCount: 24,
    },
  ];

  beforeEach(async () => {
    const groupServiceSpy = jasmine.createSpyObj('GroupService', ['getGroups', 'getGroupDetail']);

    await TestBed.configureTestingModule({
      imports: [ManageGroupComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        { provide: GroupService, useValue: groupServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({}),
          },
        },
      ],
    }).compileComponents();

    groupService = TestBed.inject(GroupService) as jasmine.SpyObj<GroupService>;
    fixture = TestBed.createComponent(ManageGroupComponent);
    component = fixture.componentInstance;
  });

  it('should initialize with correct default values', () => {
    expect(component.groups()).toEqual([]);
    expect(component.isLoading()).toBe(false);
    expect(component.searchTerm()).toBe('');
  });

  it('should load groups on init', () => {
    groupService.getGroups.and.returnValue(of(mockGroups));
    component.ngOnInit();
    expect(groupService.getGroups).toHaveBeenCalled();
    expect(component.groups()).toEqual(mockGroups);
  });


  it('should clear search and restore all groups', () => {
    groupService.getGroups.and.returnValue(of(mockGroups));
    component.ngOnInit();

    component.onSearch('ADM00');
    expect(component.groups().length).toBe(1);

    component.onSearchCleared();

    expect(component.searchTerm()).toBe('');
    expect(component.groups().length).toBe(2);
  });

  it('should sort groups', () => {
    groupService.getGroups.and.returnValue(of(mockGroups));
    component.ngOnInit();

    component.onSort('groupId');

    expect(component.sortState()).toEqual({ column: 'groupId', direction: 'asc' });
  });

});