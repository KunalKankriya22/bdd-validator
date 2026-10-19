import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AssignUserWarehouseChapterService } from './assign-user-warehouse-chapter.service';
import { ApiService } from '@shared/services/api.service';
import { LoginService } from '@shared/services/login.service';
import { ValidWarehouseUserDto, UpdateValidWarehouseUserDto, ApiResponse } from '../interfaces/assign-user-warehouse-chapter.interface';

describe('AssignUserWarehouseChapterService', () => {
  let loginServiceSpy: any;
  let apiServiceSpy: any;
  let service: AssignUserWarehouseChapterService;
  let apiService: jasmine.SpyObj<ApiService>;
  let loginService: jasmine.SpyObj<LoginService>;

  const mockValidWarehouseUsers: ValidWarehouseUserDto[] = [
    {
      UserId: 'USER001',
      WarehouseId: 'WH001',
      ChapterId: 'CH001',
      ChapterName: 'Chapter One',
      PrinterId: 'PR001',
      EffDate: '2024-01-01',
      TermDate: null
    },
    {
      UserId: 'USER002',
      WarehouseId: 'WH002',
      ChapterId: 'CH002',
      ChapterName: 'Chapter Two',
      PrinterId: 'PR002',
      EffDate: '2024-02-01',
      TermDate: '2024-12-31'
    }
  ];

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    loginServiceSpy.getStoredUsername.and.returnValue('testUser');

        service = new AssignUserWarehouseChapterService(apiServiceSpy as any, loginServiceSpy as any);
    apiService = apiServiceSpy;
    loginService = loginServiceSpy;
  });


  describe('getValidWarehouseUsers', () => {
    it('should call API get method with correct endpoint', (done) => {
      apiService.get.and.returnValue(of(mockValidWarehouseUsers));

      service.getValidWarehouseUsers().subscribe((result) => {
        expect(result).toEqual(mockValidWarehouseUsers);
        expect(apiService.get).toHaveBeenCalledWith('/api/v1/valid-warehouse-users');
        done();
      });
    });




  });

  describe('createAssignments', () => {
    it('should call API post method with correct endpoint and payload', (done) => {
      const payload: ValidWarehouseUserDto[] = [
        {
          UserId: 'USER001',
          WarehouseId: 'WH001',
          ChapterId: 'CH001',
          PrinterId: 'PR001',
          EffDate: '2024-01-01',
          TermDate: null
        }
      ];

      apiService.post.and.returnValue(of({ success: true, message: 'Success', statusCode: 200, data: {} }));

      service.createAssignments(payload).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          '/api/v1/valid-warehouse-users',
          payload,
          jasmine.objectContaining({ params: jasmine.anything() })
        );
        done();
      });
    });

    it('should send loggedInUserName as query parameter for create', (done) => {
      const payload: ValidWarehouseUserDto[] = [
        {
          UserId: 'USER001',
          WarehouseId: 'WH001',
          ChapterId: 'CH001',
          PrinterId: 'PR001',
          EffDate: '2024-01-01',
          TermDate: null
        }
      ];

      apiService.post.and.returnValue(of({ success: true, message: 'Success', statusCode: 200, data: {} }));

      service.createAssignments(payload).subscribe(() => {
        const calledArgs = apiService.post.calls.mostRecent().args;
        const options = calledArgs[2] as any;
        expect(options.params.get('loggedInUserName')).toBe('testUser');
        done();
      });
    });

    it('should handle multiple assignments in payload', (done) => {
      const payload: ValidWarehouseUserDto[] = [
        {
          UserId: 'USER001',
          WarehouseId: 'WH001',
          ChapterId: 'CH001',
          PrinterId: 'PR001',
          EffDate: '2024-01-01',
          TermDate: null
        },
        {
          UserId: 'USER001',
          WarehouseId: 'WH002',
          ChapterId: 'CH002',
          PrinterId: null,
          EffDate: '2024-02-01',
          TermDate: '2024-12-31'
        }
      ];

      apiService.post.and.returnValue(of({ success: true, message: 'Success', statusCode: 200, data: {} }));

      service.createAssignments(payload).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          '/api/v1/valid-warehouse-users',
          payload,
          jasmine.objectContaining({ params: jasmine.anything() })
        );
        expect(payload.length).toBe(2);
        done();
      });
    });

    it('should handle assignments with null printer', (done) => {
      const payload: ValidWarehouseUserDto[] = [
        {
          UserId: 'USER001',
          WarehouseId: 'WH001',
          ChapterId: 'CH001',
          PrinterId: null,
          EffDate: '2024-01-01',
          TermDate: null
        }
      ];

      apiService.post.and.returnValue(of({ success: true, message: 'Success', statusCode: 200, data: {} }));

      service.createAssignments(payload).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          '/api/v1/valid-warehouse-users',
          payload,
          jasmine.objectContaining({ params: jasmine.anything() })
        );
        done();
      });
    });

    it('should handle API errors during creation', (done) => {
      const payload: ValidWarehouseUserDto[] = [
        {
          UserId: 'USER001',
          WarehouseId: 'WH001',
          ChapterId: 'CH001',
          PrinterId: 'PR001',
          EffDate: '2024-01-01',
          TermDate: null
        }
      ];

      const errorResponse = new Error('Create failed');
      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.createAssignments(payload).subscribe({
        error: (error: Error) => {
          expect(error).toBe(errorResponse);
          done();
        }
      });
    });

    it('should handle empty payload', (done) => {
      const payload: ValidWarehouseUserDto[] = [];

      apiService.post.and.returnValue(of({ success: true, message: 'Success', statusCode: 200, data: {} }));

      service.createAssignments(payload).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          '/api/v1/valid-warehouse-users',
          payload,
          jasmine.objectContaining({ params: jasmine.anything() })
        );
        done();
      });
    });
  });

  describe('updateAssignments', () => {
    it('should call API put method with correct endpoint and payload', (done) => {
      const payload: UpdateValidWarehouseUserDto =
      {
        userId: 'USER001',
        warehouseId: 'WH001',
        originalEffDate: '2024-01-01',
        chapterId: 'CH001',
        printerId: 'PR001',
        termDate: null
      };

      apiService.put.and.returnValue(of({ success: true, message: 'Success', statusCode: 200, data: {} }));

      service.updateAssignment(payload).subscribe(() => {
        expect(apiService.put).toHaveBeenCalledWith(
          '/api/v1/valid-warehouse-users',
          payload
        );
        done();
      });
    });

    it('should handle multiple assignments in update payload', (done) => {
      const payload: UpdateValidWarehouseUserDto =
      {
        userId: 'USER001',
        warehouseId: 'WH001',
        originalEffDate: '2024-01-01',
        chapterId: 'CH001',
        printerId: 'PR001',
        termDate: null
      };

      apiService.put.and.returnValue(of({ success: true, message: 'Success', statusCode: 200, data: {} }));

      service.updateAssignment(payload).subscribe(() => {
        expect(apiService.put).toHaveBeenCalledWith(
          '/api/v1/valid-warehouse-users',
          payload
        );
        done();
      });
    });

    it('should handle API errors during update', (done) => {
      const payload: UpdateValidWarehouseUserDto =
      {
        userId: 'USER001',
        warehouseId: 'WH001',
        originalEffDate: '2024-01-01',
        chapterId: 'CH001',
        printerId: 'PR001',
        termDate: null
      };

      const errorResponse = new Error('Update failed');
      apiService.put.and.returnValue(throwError(() => errorResponse));

      service.updateAssignment(payload).subscribe({
        error: (error: Error) => {
          expect(error).toBe(errorResponse);
          done();
        }
      });
    });

    it('should update assignments with termination dates', (done) => {
      const payload: UpdateValidWarehouseUserDto =
      {
        userId: 'USER001',
        warehouseId: 'WH001',
        originalEffDate: '2024-01-01',
        chapterId: 'CH001',
        printerId: 'PR001',
        termDate: '2024-12-31'
      };

      apiService.put.and.returnValue(of({ success: true, message: 'Success', statusCode: 200, data: {} }));

      service.updateAssignment(payload).subscribe(() => {
        expect(apiService.put).toHaveBeenCalledWith(
          '/api/v1/valid-warehouse-users',
          payload
        );
        done();
      });
    });
  });
});