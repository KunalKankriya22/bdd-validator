import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { MenuItemService } from './menu-item.service';
import { ApiService } from '../../../../shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import {
  Group,
  NavigationNode,
  AccessLevelChange,
  AddMenuItemRequest,
  AddMenuItemResponse,
  UpdateMenuItemRequest,
  UpdateMenuItemResponse
} from '../models/menu-item.model';
import { ApiMenuItem } from '../models/api-response.model';

describe('MenuItemService', () => {
  let service: MenuItemService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockGroups: Group[] = [
    {
      applId: 'DON',
      groupId: 'GRP01',
      description: 'Blood Center Admin Group',
      userCount: 5,
      lastModifiedDate: '2026-01-15'
    },
    {
      applId: 'DON',
      groupId: 'GRP02',
      description: 'System Admin Group',
      userCount: 3,
      lastModifiedDate: '2026-02-20'
    }
  ];

  const mockApiMenuItems: ApiMenuItem[] = [
    {
      menuId: 100,
      fcnId: 1,
      label: 'Donors',
      functionType: 'Menu',
      sequence: 1,
      accessLevel: '3',
      hidden: 'N',
      functionName: 'DONORS_MENU',
      remarks: 'Donor management menu',
      hostCommand: '',
      parameter1Key: 'MODULE',
      parameter1Value: 'DONOR',
      parameter2Key: '',
      parameter2Value: '',
      parameter3Key: '',
      parameter3Value: '',
      expanded: false,
      route: '/donors',
      children: [
        {
          menuId: 101,
          fcnId: 2,
          label: 'Donor Search',
          functionType: 'Page',
          sequence: 1,
          accessLevel: '2',
          hidden: 'Y',
          functionName: 'DONOR_SEARCH',
          remarks: '',
          hostCommand: 'donor.exe',
          parameter1Key: '',
          parameter1Value: '',
          parameter2Key: 'ACTION',
          parameter2Value: 'SEARCH',
          parameter3Key: 'MODE',
          parameter3Value: 'FULL',
          expanded: false,
          route: '/donors/search',
          children: []
        }
      ]
    },
    {
      menuId: 200,
      fcnId: 3,
      label: 'Reports',
      functionType: 'Menu',
      sequence: 2,
      accessLevel: 'abc',
      hidden: 'N',
      functionName: 'REPORTS_MENU',
      remarks: '',
      hostCommand: '',
      parameter1Key: '',
      parameter1Value: '',
      parameter2Key: '',
      parameter2Value: '',
      parameter3Key: '',
      parameter3Value: '',
      expanded: false,
      route: '/reports',
      children: []
    }
  ];

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MenuItemService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(MenuItemService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getGroups', () => {
    it('should call ApiService.get with correct endpoint', (done) => {
      apiService.get.and.returnValue(of(mockGroups));

      service.getGroups().subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(API.SYSTEM_ADMIN.MENU_ADMIN.MENU_GROUPS);
        done();
      });
    });

    it('should return an array of groups', (done) => {
      apiService.get.and.returnValue(of(mockGroups));

      service.getGroups().subscribe({
        next: (groups) => {
          expect(groups).toEqual(mockGroups);
          expect(groups.length).toBe(2);
          done();
        }
      });
    });

    it('should return groups with all required properties', (done) => {
      apiService.get.and.returnValue(of(mockGroups));

      service.getGroups().subscribe({
        next: (groups) => {
          const firstGroup = groups[0];
          expect(firstGroup.applId).toBeDefined();
          expect(firstGroup.groupId).toBeDefined();
          expect(firstGroup.description).toBeDefined();
          expect(firstGroup.userCount).toBeDefined();
          expect(firstGroup.lastModifiedDate).toBeDefined();
          done();
        }
      });
    });

    it('should log success message with group count', (done) => {
      apiService.get.and.returnValue(of(mockGroups));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.getGroups().subscribe(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Groups loaded successfully:', 2);
        consoleSpy.mockRestore();
        done();
      });
    });

    it('should propagate error and log error message', (done) => {
      const mockError = new Error('Network error');
      apiService.get.and.returnValue(throwError(() => mockError));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      service.getGroups().subscribe({
        error: (error) => {
          expect(error).toBe(mockError);
          expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching groups:', mockError);
          consoleErrorSpy.mockRestore();
          done();
        }
      });
    });

    it('should handle empty groups array', (done) => {
      apiService.get.and.returnValue(of([]));

      service.getGroups().subscribe({
        next: (groups) => {
          expect(groups).toEqual([]);
          expect(groups.length).toBe(0);
          done();
        }
      });
    });
  });

  describe('getOnsiteGroups', () => {
    it('should call ApiService.get with correct endpoint', (done) => {
      apiService.get.and.returnValue(of(mockGroups));

      service.getOnsiteGroups().subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(API.SYSTEM_ADMIN.MENU_ADMIN.ONSITE_MENU_GROUPS);
        done();
      });
    });

    it('should return an array of on-site groups', (done) => {
      apiService.get.and.returnValue(of(mockGroups));

      service.getOnsiteGroups().subscribe({
        next: (groups) => {
          expect(groups).toEqual(mockGroups);
          expect(groups.length).toBe(2);
          done();
        }
      });
    });

    it('should log success message with group count', (done) => {
      apiService.get.and.returnValue(of(mockGroups));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.getOnsiteGroups().subscribe(() => {
        expect(consoleSpy).toHaveBeenCalledWith('On-site groups loaded successfully:', 2);
        consoleSpy.mockRestore();
        done();
      });
    });

    it('should propagate error and log error message', (done) => {
      const mockError = new Error('Server error');
      apiService.get.and.returnValue(throwError(() => mockError));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      service.getOnsiteGroups().subscribe({
        error: (error) => {
          expect(error).toBe(mockError);
          expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching on-site groups:', mockError);
          consoleErrorSpy.mockRestore();
          done();
        }
      });
    });

    it('should handle empty groups array', (done) => {
      apiService.get.and.returnValue(of([]));

      service.getOnsiteGroups().subscribe({
        next: (groups) => {
          expect(groups).toEqual([]);
          done();
        }
      });
    });
  });

  describe('getMenuTreeForGroup', () => {
    it('should call ApiService.get with correct endpoint using default applId', (done) => {
      apiService.get.and.returnValue(of(mockApiMenuItems));

      service.getMenuTreeForGroup('GRP01').subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(
          `${API.SYSTEM_ADMIN.MENU_ADMIN.MENU_LISTS('GRP01')}?applId=DON`
        );
        done();
      });
    });

    it('should call ApiService.get with custom applId', (done) => {
      apiService.get.and.returnValue(of(mockApiMenuItems));

      service.getMenuTreeForGroup('GRP01', 'LAB').subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(
          `${API.SYSTEM_ADMIN.MENU_ADMIN.MENU_LISTS('GRP01')}?applId=LAB`
        );
        done();
      });
    });

    it('should convert API menu items to navigation nodes', (done) => {
      apiService.get.and.returnValue(of(mockApiMenuItems));

      service.getMenuTreeForGroup('GRP01').subscribe({
        next: (nodes) => {
          expect(nodes.length).toBe(2);

          const donorsNode = nodes[0];
          expect(donorsNode.id).toBe('1');
          expect(donorsNode.label).toBe('Donors');
          expect(donorsNode.type).toBe('Menu');
          expect(donorsNode.sequence).toBe(1);
          expect(donorsNode.access_lvl).toBe(3);
          expect(donorsNode.hidden).toBe(false);
          expect(donorsNode.function_name).toBe('DONORS_MENU');
          expect(donorsNode.remarks).toBe('Donor management menu');
          expect(donorsNode.host_command).toBeNull();
          done();
        }
      });
    });

    it('should convert parameter fields when both key and value are present', (done) => {
      apiService.get.and.returnValue(of(mockApiMenuItems));

      service.getMenuTreeForGroup('GRP01').subscribe({
        next: (nodes) => {
          const donorsNode = nodes[0];
          expect(donorsNode.parameter_1).toEqual({ key: 'MODULE', value: 'DONOR' });
          expect(donorsNode.parameter_2).toBeNull();
          expect(donorsNode.parameter_3).toBeNull();
          done();
        }
      });
    });

    it('should convert child parameter fields correctly', (done) => {
      apiService.get.and.returnValue(of(mockApiMenuItems));

      service.getMenuTreeForGroup('GRP01').subscribe({
        next: (nodes) => {
          const childNode = nodes[0].children![0];
          expect(childNode.parameter_1).toBeNull();
          expect(childNode.parameter_2).toEqual({ key: 'ACTION', value: 'SEARCH' });
          expect(childNode.parameter_3).toEqual({ key: 'MODE', value: 'FULL' });
          done();
        }
      });
    });

    it('should convert children recursively', (done) => {
      apiService.get.and.returnValue(of(mockApiMenuItems));

      service.getMenuTreeForGroup('GRP01').subscribe({
        next: (nodes) => {
          expect(nodes[0].children!.length).toBe(1);
          const childNode = nodes[0].children![0];
          expect(childNode.id).toBe('2');
          expect(childNode.label).toBe('Donor Search');
          expect(childNode.type).toBe('Page');
          expect(childNode.hidden).toBe(true);
          expect(childNode.host_command).toBe('donor.exe');
          expect(childNode.children).toEqual([]);
          done();
        }
      });
    });

    it('should set access_lvl to 0 when accessLevel is non-numeric', (done) => {
      apiService.get.and.returnValue(of(mockApiMenuItems));

      service.getMenuTreeForGroup('GRP01').subscribe({
        next: (nodes) => {
          const reportsNode = nodes[1];
          expect(reportsNode.access_lvl).toBe(0);
          done();
        }
      });
    });

    it('should set remarks to null when empty string', (done) => {
      apiService.get.and.returnValue(of(mockApiMenuItems));

      service.getMenuTreeForGroup('GRP01').subscribe({
        next: (nodes) => {
          const reportsNode = nodes[1];
          expect(reportsNode.remarks).toBeNull();
          done();
        }
      });
    });

    it('should set host_command to null when empty string', (done) => {
      apiService.get.and.returnValue(of(mockApiMenuItems));

      service.getMenuTreeForGroup('GRP01').subscribe({
        next: (nodes) => {
          const donorsNode = nodes[0];
          expect(donorsNode.host_command).toBeNull();
          done();
        }
      });
    });

    it('should log node count after loading tree', (done) => {
      apiService.get.and.returnValue(of(mockApiMenuItems));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.getMenuTreeForGroup('GRP01').subscribe(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Menu tree loaded for group GRP01: 3 total nodes');
        consoleSpy.mockRestore();
        done();
      });
    });

    it('should count nodes recursively including children', (done) => {
      apiService.get.and.returnValue(of(mockApiMenuItems));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.getMenuTreeForGroup('GRP01').subscribe(() => {
        const logCall = consoleSpy.mock.calls.find(
          call => typeof call[0] === 'string' && call[0].includes('total nodes')
        );
        expect(logCall).toBeTruthy();
        expect(logCall![0]).toContain('3 total nodes');
        consoleSpy.mockRestore();
        done();
      });
    });

    it('should propagate error and log error message', (done) => {
      const mockError = new Error('Tree load failed');
      apiService.get.and.returnValue(throwError(() => mockError));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      service.getMenuTreeForGroup('GRP01').subscribe({
        error: (error) => {
          expect(error).toBe(mockError);
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error fetching menu tree for group GRP01:', mockError
          );
          consoleErrorSpy.mockRestore();
          done();
        }
      });
    });

    it('should handle empty menu items array', (done) => {
      apiService.get.and.returnValue(of([]));

      service.getMenuTreeForGroup('GRP01').subscribe({
        next: (nodes) => {
          expect(nodes).toEqual([]);
          done();
        }
      });
    });

    it('should set empty children array when api item has no children', (done) => {
      apiService.get.and.returnValue(of(mockApiMenuItems));

      service.getMenuTreeForGroup('GRP01').subscribe({
        next: (nodes) => {
          const reportsNode = nodes[1];
          expect(reportsNode.children).toEqual([]);
          done();
        }
      });
    });
  });

  describe('updateAccessLevels', () => {
    const mockChanges: AccessLevelChange[] = [
      { nodeId: '1', originalLevel: 0, currentLevel: 3 },
      { nodeId: '2', originalLevel: 1, currentLevel: 2 }
    ];

    it('should call ApiService.put with correct endpoint using default applId', (done) => {
      apiService.put.and.returnValue(of('Access updated successfully'));

      service.updateAccessLevels('GRP01', mockChanges).subscribe(() => {
        expect(apiService.put).toHaveBeenCalledWith(
          `${API.SYSTEM_ADMIN.MENU_ADMIN.UPDATE_ACCESS('GRP01')}?applId=DON`,
          jasmine.any(Object),
          { responseType: 'text' }
        );
        done();
      });
    });

    it('should call ApiService.put with custom applId', (done) => {
      apiService.put.and.returnValue(of('Access updated'));

      service.updateAccessLevels('GRP01', mockChanges, 'LAB').subscribe(() => {
        expect(apiService.put).toHaveBeenCalledWith(
          `${API.SYSTEM_ADMIN.MENU_ADMIN.UPDATE_ACCESS('GRP01')}?applId=LAB`,
          jasmine.any(Object),
          { responseType: 'text' }
        );
        done();
      });
    });

    it('should map AccessLevelChange to API payload format', (done) => {
      apiService.put.and.returnValue(of('Success'));

      service.updateAccessLevels('GRP01', mockChanges).subscribe(() => {
        const expectedPayload = {
          changes: [
            { id: '1', access_Lvl: 3 },
            { id: '2', access_Lvl: 2 }
          ]
        };
        expect(apiService.put).toHaveBeenCalledWith(
          jasmine.any(String),
          expectedPayload,
          { responseType: 'text' }
        );
        done();
      });
    });

    it('should map string response to UpdateAccessResponse object', (done) => {
      apiService.put.and.returnValue(of('Access levels updated'));

      service.updateAccessLevels('GRP01', mockChanges).subscribe({
        next: (response) => {
          expect(response).toEqual({ message: 'Access levels updated' });
          done();
        }
      });
    });

    it('should log success message with change count and group', (done) => {
      apiService.put.and.returnValue(of('All done'));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.updateAccessLevels('GRP01', mockChanges).subscribe(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Access levels updated for 2 nodes in group GRP01: All done'
        );
        consoleSpy.mockRestore();
        done();
      });
    });

    it('should propagate error and log error message', (done) => {
      const mockError = new Error('Update failed');
      apiService.put.and.returnValue(throwError(() => mockError));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      service.updateAccessLevels('GRP01', mockChanges).subscribe({
        error: (error) => {
          expect(error).toBe(mockError);
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error updating access levels for group GRP01:', mockError
          );
          consoleErrorSpy.mockRestore();
          done();
        }
      });
    });

    it('should handle empty changes array', (done) => {
      apiService.put.and.returnValue(of('No changes'));

      service.updateAccessLevels('GRP01', []).subscribe({
        next: (response) => {
          expect(response).toEqual({ message: 'No changes' });
          const payload = apiService.put.calls.mostRecent().args[1];
          expect(payload.changes).toEqual([]);
          done();
        }
      });
    });
  });

  describe('addMenuItem', () => {
    const mockRequest: AddMenuItemRequest = {
      applId: 'DON',
      fcnId: 10,
      label: 'New Menu Item',
      parentMenuId: 1,
      sequence: 5,
      parameter1Value: 'val1',
      hidden: 'N',
      remarks: 'Test remark'
    };

    const mockResponse: AddMenuItemResponse = {
      fcnId: 10,
      label: 'New Menu Item',
      functionType: 'Page',
      functionName: 'NEW_ITEM',
      parentMenuId: 1,
      sequence: 5,
      parameter1Key: 'P1',
      message: 'Menu item created'
    };

    it('should call ApiService.post with correct endpoint', (done) => {
      apiService.post.and.returnValue(of(mockResponse));

      service.addMenuItem(mockRequest).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          API.SYSTEM_ADMIN.MENU_ADMIN.ADD_MENU_ITEM,
          mockRequest
        );
        done();
      });
    });

    it('should return AddMenuItemResponse', (done) => {
      apiService.post.and.returnValue(of(mockResponse));

      service.addMenuItem(mockRequest).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.fcnId).toBe(10);
          expect(response.label).toBe('New Menu Item');
          expect(response.message).toBe('Menu item created');
          done();
        }
      });
    });

    it('should log success message with label and ID', (done) => {
      apiService.post.and.returnValue(of(mockResponse));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.addMenuItem(mockRequest).subscribe(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Menu item created successfully: New Menu Item (ID: 10)'
        );
        consoleSpy.mockRestore();
        done();
      });
    });

    it('should propagate error and log error message', (done) => {
      const mockError = new Error('Create failed');
      apiService.post.and.returnValue(throwError(() => mockError));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      service.addMenuItem(mockRequest).subscribe({
        error: (error) => {
          expect(error).toBe(mockError);
          expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating menu item:', mockError);
          consoleErrorSpy.mockRestore();
          done();
        }
      });
    });

    it('should pass request body unchanged to ApiService', (done) => {
      apiService.post.and.returnValue(of(mockResponse));

      service.addMenuItem(mockRequest).subscribe(() => {
        const passedRequest = apiService.post.calls.mostRecent().args[1];
        expect(passedRequest).toBe(mockRequest);
        done();
      });
    });
  });

  describe('updateMenuItem', () => {
    const mockFcnId = 'FCN_42';
    const mockRequest: UpdateMenuItemRequest = {
      applId: 'DON',
      label: 'Updated Label',
      sequence: 3,
      parentMenuId: 1,
      mnemonic: 'UPDLBL',
      accessLevel: '999',
      parameter1Key: 'KEY1',
      parameter1Value: 'VALUE1',
      hidden: 'Y',
      remarks: 'Updated remark'
    };

    const mockResponse: UpdateMenuItemResponse = {
      fcnId: 42,
      label: 'Updated Label',
      sequence: 3,
      message: 'Menu item updated'
    };

    it('should call ApiService.put with correct endpoint', (done) => {
      apiService.put.and.returnValue(of(mockResponse));

      service.updateMenuItem(mockFcnId, mockRequest).subscribe(() => {
        expect(apiService.put).toHaveBeenCalledWith(
          API.SYSTEM_ADMIN.MENU_ADMIN.UPDATE_MENU_ITEM(mockFcnId),
          mockRequest
        );
        done();
      });
    });

    it('should return UpdateMenuItemResponse', (done) => {
      apiService.put.and.returnValue(of(mockResponse));

      service.updateMenuItem(mockFcnId, mockRequest).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.fcnId).toBe(42);
          expect(response.label).toBe('Updated Label');
          expect(response.message).toBe('Menu item updated');
          done();
        }
      });
    });

    it('should log success message with label and ID', (done) => {
      apiService.put.and.returnValue(of(mockResponse));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.updateMenuItem(mockFcnId, mockRequest).subscribe(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Menu item updated successfully: Updated Label (ID: 42)'
        );
        consoleSpy.mockRestore();
        done();
      });
    });

    it('should propagate error and log error message', (done) => {
      const mockError = new Error('Update failed');
      apiService.put.and.returnValue(throwError(() => mockError));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      service.updateMenuItem(mockFcnId, mockRequest).subscribe({
        error: (error) => {
          expect(error).toBe(mockError);
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            `Error updating menu item ${mockFcnId}:`, mockError
          );
          consoleErrorSpy.mockRestore();
          done();
        }
      });
    });

    it('should pass request body unchanged to ApiService', (done) => {
      apiService.put.and.returnValue(of(mockResponse));

      service.updateMenuItem(mockFcnId, mockRequest).subscribe(() => {
        const passedRequest = apiService.put.calls.mostRecent().args[1];
        expect(passedRequest).toBe(mockRequest);
        done();
      });
    });
  });

  describe('convertApiMenuItem mapping edge cases', () => {
    it('should handle null children in API response', (done) => {
      const itemWithNullChildren: ApiMenuItem[] = [
        {
          menuId: 300,
          fcnId: 5,
          label: 'Standalone',
          functionType: 'Page',
          sequence: 1,
          accessLevel: '1',
          hidden: 'N',
          functionName: 'STANDALONE',
          remarks: '',
          hostCommand: '',
          parameter1Key: '',
          parameter1Value: '',
          parameter2Key: '',
          parameter2Value: '',
          parameter3Key: '',
          parameter3Value: '',
          expanded: false,
          route: '/standalone',
          children: null as any
        }
      ];
      apiService.get.and.returnValue(of(itemWithNullChildren));

      service.getMenuTreeForGroup('GRP01').subscribe({
        next: (nodes) => {
          expect(nodes[0].children).toEqual([]);
          done();
        }
      });
    });

    it('should handle deeply nested children and count all nodes', (done) => {
      const deeplyNested: ApiMenuItem[] = [
        {
          menuId: 400,
          fcnId: 10,
          label: 'Level 1',
          functionType: 'Menu',
          sequence: 1,
          accessLevel: '1',
          hidden: 'N',
          functionName: 'L1',
          remarks: '',
          hostCommand: '',
          parameter1Key: '',
          parameter1Value: '',
          parameter2Key: '',
          parameter2Value: '',
          parameter3Key: '',
          parameter3Value: '',
          expanded: false,
          route: '/l1',
          children: [
            {
              menuId: 401,
              fcnId: 11,
              label: 'Level 2',
              functionType: 'Menu',
              sequence: 1,
              accessLevel: '2',
              hidden: 'N',
              functionName: 'L2',
              remarks: '',
              hostCommand: '',
              parameter1Key: '',
              parameter1Value: '',
              parameter2Key: '',
              parameter2Value: '',
              parameter3Key: '',
              parameter3Value: '',
              expanded: false,
              route: '/l2',
              children: [
                {
                  menuId: 402,
                  fcnId: 12,
                  label: 'Level 3',
                  functionType: 'Page',
                  sequence: 1,
                  accessLevel: '3',
                  hidden: 'Y',
                  functionName: 'L3',
                  remarks: 'Deep leaf',
                  hostCommand: 'deep.exe',
                  parameter1Key: '',
                  parameter1Value: '',
                  parameter2Key: '',
                  parameter2Value: '',
                  parameter3Key: '',
                  parameter3Value: '',
                  expanded: false,
                  route: '/l3',
                  children: []
                }
              ]
            }
          ]
        }
      ];
      apiService.get.and.returnValue(of(deeplyNested));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.getMenuTreeForGroup('GRP01').subscribe({
        next: (nodes) => {
          expect(nodes.length).toBe(1);
          expect(nodes[0].children!.length).toBe(1);
          expect(nodes[0].children![0].children!.length).toBe(1);

          const leaf = nodes[0].children![0].children![0];
          expect(leaf.id).toBe('12');
          expect(leaf.label).toBe('Level 3');
          expect(leaf.hidden).toBe(true);
          expect(leaf.host_command).toBe('deep.exe');
          expect(leaf.remarks).toBe('Deep leaf');
          expect(leaf.children).toEqual([]);

          expect(consoleSpy).toHaveBeenCalledWith(
            'Menu tree loaded for group GRP01: 3 total nodes'
          );
          consoleSpy.mockRestore();
          done();
        }
      });
    });

    it('should convert fcnId number to string for node id', (done) => {
      const items: ApiMenuItem[] = [
        {
          menuId: 500,
          fcnId: 999,
          label: 'Test',
          functionType: 'Page',
          sequence: 1,
          accessLevel: '0',
          hidden: 'N',
          functionName: 'TEST_FN',
          remarks: '',
          hostCommand: '',
          parameter1Key: '',
          parameter1Value: '',
          parameter2Key: '',
          parameter2Value: '',
          parameter3Key: '',
          parameter3Value: '',
          expanded: false,
          route: '/test',
          children: []
        }
      ];
      apiService.get.and.returnValue(of(items));

      service.getMenuTreeForGroup('GRP01').subscribe({
        next: (nodes) => {
          expect(nodes[0].id).toBe('999');
          expect(typeof nodes[0].id).toBe('string');
          done();
        }
      });
    });

    it('should parse numeric accessLevel to integer', (done) => {
      const items: ApiMenuItem[] = [
        {
          menuId: 600,
          fcnId: 20,
          label: 'Test',
          functionType: 'Page',
          sequence: 1,
          accessLevel: '5',
          hidden: 'N',
          functionName: 'TEST',
          remarks: '',
          hostCommand: '',
          parameter1Key: '',
          parameter1Value: '',
          parameter2Key: '',
          parameter2Value: '',
          parameter3Key: '',
          parameter3Value: '',
          expanded: false,
          route: '/test',
          children: []
        }
      ];
      apiService.get.and.returnValue(of(items));

      service.getMenuTreeForGroup('GRP01').subscribe({
        next: (nodes) => {
          expect(nodes[0].access_lvl).toBe(5);
          done();
        }
      });
    });

    it('should set hidden to false when hidden is not Y', (done) => {
      const items: ApiMenuItem[] = [
        {
          menuId: 700,
          fcnId: 30,
          label: 'Test',
          functionType: 'Page',
          sequence: 1,
          accessLevel: '1',
          hidden: 'X',
          functionName: 'TEST',
          remarks: '',
          hostCommand: '',
          parameter1Key: '',
          parameter1Value: '',
          parameter2Key: '',
          parameter2Value: '',
          parameter3Key: '',
          parameter3Value: '',
          expanded: false,
          route: '/test',
          children: []
        }
      ];
      apiService.get.and.returnValue(of(items));

      service.getMenuTreeForGroup('GRP01').subscribe({
        next: (nodes) => {
          expect(nodes[0].hidden).toBe(false);
          done();
        }
      });
    });

    it('should set parameter to null when key is present but value is empty', (done) => {
      const items: ApiMenuItem[] = [
        {
          menuId: 800,
          fcnId: 40,
          label: 'Test',
          functionType: 'Page',
          sequence: 1,
          accessLevel: '1',
          hidden: 'N',
          functionName: 'TEST',
          remarks: '',
          hostCommand: '',
          parameter1Key: 'KEY',
          parameter1Value: '',
          parameter2Key: '',
          parameter2Value: 'VAL',
          parameter3Key: '',
          parameter3Value: '',
          expanded: false,
          route: '/test',
          children: []
        }
      ];
      apiService.get.and.returnValue(of(items));

      service.getMenuTreeForGroup('GRP01').subscribe({
        next: (nodes) => {
          expect(nodes[0].parameter_1).toBeNull();
          expect(nodes[0].parameter_2).toBeNull();
          expect(nodes[0].parameter_3).toBeNull();
          done();
        }
      });
    });
  });
});
