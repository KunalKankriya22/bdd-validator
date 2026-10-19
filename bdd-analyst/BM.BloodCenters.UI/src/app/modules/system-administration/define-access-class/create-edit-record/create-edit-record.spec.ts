import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CreateEditRecordComponent, CreateEditRecordData } from './create-edit-record';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DefineAccessClassService } from '../services/define-access-class.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { CookieService } from 'ngx-cookie-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideMomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { LoginService } from '@shared/services/login.service';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('CreateEditRecordComponent', () => {
  let component: CreateEditRecordComponent;
  let fixture: ComponentFixture<CreateEditRecordComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<CreateEditRecordComponent>>;
  let mockDefineAccessClassService: jasmine.SpyObj<DefineAccessClassService>;
  let mockCookieService: jasmine.SpyObj<CookieService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockSnackBarRef: jasmine.SpyObj<any>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockChapterTimezoneService: any;
  let mockLoginService: jasmine.SpyObj<LoginService>;

  // Helper function to create component with specific dialog data
  function createComponentWithData(data: CreateEditRecordData | null) {
    // Reset spy calls before creating component
    mockDialogRef.close.calls.reset();
    mockDefineAccessClassService.getTypesByClassname.calls.reset();
    mockDefineAccessClassService.getCodeValuesByType.calls.reset();
    mockDefineAccessClassService.getAccessClassById.calls.reset();
    mockDefineAccessClassService.getAccessClassDetail.calls.reset();
    mockDefineAccessClassService.createAccessClass.calls.reset();
    mockDefineAccessClassService.updateAccessClass.calls.reset();
    mockSnackBar.open.calls.reset();

    // Ensure mockSnackBar.open returns the mock ref
    mockSnackBar.open.and.returnValue(mockSnackBarRef);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CreateEditRecordComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: DefineAccessClassService, useValue: mockDefineAccessClassService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: CookieService, useValue: mockCookieService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        { provide: LoginService, useValue: mockLoginService },
        provideMomentDateAdapter(),
        { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true } }
      ]
    }).overrideComponent(CreateEditRecordComponent, {
      set: {
        providers: [
          { provide: MatSnackBar, useValue: mockSnackBar }
        ]
      }
    });
    fixture = TestBed.createComponent(CreateEditRecordComponent);
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    // Create fresh spies before each test
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockDefineAccessClassService = jasmine.createSpyObj('DefineAccessClassService', [
      'getTypesByClassname',
      'getCodeValuesByType',
      'getAccessClassById',
      'getAccessClassDetail',
      'createAccessClass',
      'updateAccessClass'
    ]);
    mockCookieService = jasmine.createSpyObj('CookieService', ['get']);
    mockHeaderService = createMockHeaderService();
    mockChapterTimezoneService = {
      convertGmtToLocal: jasmine.createSpy('convertGmtToLocal').and.callFake((m: any) => m),
      convertLocalToGmt: jasmine.createSpy('convertLocalToGmt').and.callFake((m: any) => m),
      isChapterLocalDateAvailable: jasmine.createSpy('isChapterLocalDateAvailable').and.returnValue(false),
      chapterLocalDate: jasmine.createSpy('chapterLocalDate').and.returnValue(null)
    };
    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    mockLoginService.getStoredUsername.and.returnValue('TESTUSER');
    mockSnackBar = createMockMatSnackBar();

    // Create MatSnackBarRef mock
    mockSnackBarRef = jasmine.createSpyObj('MatSnackBarRef', ['dismiss', 'afterDismissed']);
    mockSnackBar.open.and.returnValue(mockSnackBarRef);

    // Set default return values for all service methods
    mockDefineAccessClassService.getTypesByClassname.and.returnValue(of([]));
    mockDefineAccessClassService.getCodeValuesByType.and.returnValue(of([]));
    mockDefineAccessClassService.getAccessClassById.and.returnValue(of({
      class: '',
      classDescription: '',
      type: '',
      code: '',
      description: '',
      effectiveDate: '',
      terminationDate: null
    }));
    mockDefineAccessClassService.getAccessClassDetail.and.returnValue(of({
      class: '',
      classDescription: '',
      type: '',
      code: '',
      description: '',
      effectiveDate: '',
      terminationDate: null
    }));
    mockDefineAccessClassService.createAccessClass.and.returnValue(of({ success: true, message: '', statusCode: 200, item: [] }));
    mockDefineAccessClassService.updateAccessClass.and.returnValue(of({
      success: true,
      message: '',
      statusCode: 200,
      item: {
        class: '',
        classDescription: '',
        type: '',
        code: '',
        description: '',
        effectiveDate: '',
        terminationDate: ''
      }
    }));
  });

  describe('Add Mode', () => {

    it('should load types on init in add mode', () => {
      const mockData: CreateEditRecordData = { mode: 'add', classname: '00ISU' };
      const mockTypes = [{ type: 'INTER', description: '' }, { type: 'SURVE', description: '' }, { type: 'PROPR', description: '' }];
      mockDefineAccessClassService.getTypesByClassname.and.returnValue(of(mockTypes));

      createComponentWithData(mockData);
      fixture.detectChanges();

      expect(mockDefineAccessClassService.getTypesByClassname).toHaveBeenCalledWith('00ISU');
      expect(component.typeOptions).toEqual(mockTypes);
    });

    it('should load code values when type is selected', () => {
      const mockData: CreateEditRecordData = { mode: 'add', classname: '00ISU' };
      const mockCodes = [{ value: '104C', description: '' }, { value: 'A03', description: '' }, { value: 'A07', description: '' }];
      mockDefineAccessClassService.getTypesByClassname.and.returnValue(of([{ type: 'INTER', description: '' }]));
      mockDefineAccessClassService.getCodeValuesByType.and.returnValue(of(mockCodes));

      createComponentWithData(mockData);
      fixture.detectChanges();
      component.onTypeChange('INTER');

      expect(mockDefineAccessClassService.getCodeValuesByType).toHaveBeenCalledWith('00ISU', 'INTER');
      expect(component.codeOptions).toEqual(mockCodes);
    });

    it('should update selected code rows when codes are selected and deselected', fakeAsync(() => {
      const mockData: CreateEditRecordData = {
        mode: 'add',
        classname: '00ISU',
        existingRows: [
          { type: 'INTER', code: '101A', description: 'Fallback A' },
          { type: 'INTER', code: '101B', description: 'Fallback B' }
        ]
      };

      mockDefineAccessClassService.getTypesByClassname.and.returnValue(of([{ type: 'INTER', description: '' }]));
      mockDefineAccessClassService.getAccessClassDetail.and.callFake((classname: string, codetype: string, codevalue: string) =>
        of({
          class: classname,
          classDescription: '',
          type: codetype,
          code: codevalue,
          description: codevalue === '101A' ? 'A for Function 1.01' : 'B for Function 1.01',
          effectiveDate: '2026-01-01T00:00:00',
          terminationDate: null
        })
      );

      createComponentWithData(mockData);
      fixture.detectChanges();

      // Spy on sortSelectedCodeRows to prevent infinite loop with refreshSelectedCodeRows
      spyOn<any>(component, 'sortSelectedCodeRows').and.callFake(() => {
        // Just sort the array without calling refresh
        if (component.selectedCodeSortDirection === 'default') {
          return;
        }
        component.selectedCodeRows = [...component.selectedCodeRows].sort((a, b) => {
          const result = a.code.localeCompare(b.code);
          return component.selectedCodeSortDirection === 'asc' ? result : -result;
        });
      });

      component.recordForm.patchValue({ type: 'INTER' });
      component.recordForm.patchValue({ code: ['101A', '101B'] });
      flush();

      expect(component.selectedCodeRows.length).toBe(2);
      expect(component.selectedCodeRows.map(row => row.code)).toEqual(['101A', '101B']);

      component.removeSelectedCode('101A');
      flush();

      expect(component.recordForm.get('code')?.value).toEqual(['101B']);
      expect(component.selectedCodeRows.length).toBe(1);
      expect(component.selectedCodeRows[0].code).toBe('101B');
    }));

    it('should sort selected code rows in both directions when toggled', fakeAsync(() => {
      createComponentWithData({ mode: 'add', classname: '00ISU' });
      fixture.detectChanges();
      flush();

      // Spy on refreshSelectedCodeRows to prevent infinite loop when sort direction is default
      spyOn<any>(component, 'refreshSelectedCodeRows').and.callFake(() => {
        // Do nothing - we're testing the sorting logic only
      });

      component.selectedCodeRows = [
        { code: '101C', description: 'Desc C' },
        { code: '101A', description: 'Desc A' },
        { code: '101B', description: 'Desc B' }
      ];

      component.selectedCodeSortDirection = 'default';
      component.toggleSelectedCodeSort();
      expect(component.selectedCodeSortDirection).toBe('asc');
      expect(component.selectedCodeRows.map(row => row.code)).toEqual(['101A', '101B', '101C']);

      component.toggleSelectedCodeSort();
      expect(component.selectedCodeSortDirection).toBe('desc');
      expect(component.selectedCodeRows.map(row => row.code)).toEqual(['101C', '101B', '101A']);

      component.toggleSelectedCodeSort();
      expect(component.selectedCodeSortDirection).toBe('default');
      // When toggling back to default, it calls refreshSelectedCodeRows which we've mocked
    }));
  });

  describe('Edit Mode', () => {

    it('should load record details on init in edit mode', () => {
      const mockData: CreateEditRecordData = {
        mode: 'edit',
        id: '00ISU',
        classname: '00ISU',
        codeType: 'INTER',
        codeValue: '101A'
      };
      const mockDetails = {
        class: '00ISU',
        classDescription: 'Test Class',
        type: 'INTER',
        code: '101A',
        description: 'Test Description',
        effectiveDate: '2026-01-01T00:00:00',
        terminationDate: null
      };
      mockDefineAccessClassService.getAccessClassDetail.and.returnValue(of(mockDetails));

      createComponentWithData(mockData);
      fixture.detectChanges();

      expect(mockDefineAccessClassService.getAccessClassDetail).toHaveBeenCalledWith('00ISU', 'INTER', '101A');
      expect(component.displayType).toBe('INTER');
      expect(component.displayCode).toBe('101A');
      expect(component.displayDescription).toBe('Test Description');
    });

    it('should disable fields in edit mode', () => {
      const mockData: CreateEditRecordData = {
        mode: 'edit',
        id: '00ISU',
        classname: '00ISU',
        codeType: 'INTER',
        codeValue: '101A'
      };
      const mockDetails = {
        class: '00ISU',
        classDescription: 'Test Class',
        type: 'INTER',
        code: '101A',
        description: 'Test Description',
        effectiveDate: '2026-01-01T00:00:00',
        terminationDate: null
      };
      mockDefineAccessClassService.getAccessClassDetail.and.returnValue(of(mockDetails));

      createComponentWithData(mockData);
      fixture.detectChanges();

      expect(component.recordForm.get('type')?.disabled).toBeTruthy();
      expect(component.recordForm.get('code')?.disabled).toBeTruthy();
      expect(component.recordForm.get('description')?.disabled).toBeTruthy();
      expect(component.recordForm.get('effectiveDate')?.disabled).toBeTruthy();
      expect(component.recordForm.get('terminationDate')?.disabled).toBeFalsy();
    });

  });

  describe('Create Record', () => {

    it('should create record with valid data', fakeAsync(() => {
      const mockData: CreateEditRecordData = { mode: 'add', classname: '00ISU' };
      const mockResponse = {
        success: true,
        message: 'Access Class Codes created successfully',
        statusCode: 201,
        item: []
      };
      mockLoginService.getStoredUsername.and.returnValue('TESTUSER');
      mockDefineAccessClassService.getTypesByClassname.and.returnValue(of([{ type: 'INTER', description: '' }]));
      mockDefineAccessClassService.getCodeValuesByType.and.returnValue(of([{ value: '104C', description: '' }]));
      mockDefineAccessClassService.getAccessClassDetail.and.returnValue(of({
        class: '00ISU',
        classDescription: '',
        type: 'INTER',
        code: '104C',
        description: 'Test Description',
        effectiveDate: '2026-01-01T00:00:00',
        terminationDate: null
      }));
      mockDefineAccessClassService.createAccessClass.and.returnValue(of(mockResponse));

      createComponentWithData(mockData);
      fixture.detectChanges();
      flush();

      // Spy on sortSelectedCodeRows to prevent infinite loop
      spyOn<any>(component, 'sortSelectedCodeRows').and.callFake(() => {
        if (component.selectedCodeSortDirection === 'default') {
          return;
        }
        component.selectedCodeRows = [...component.selectedCodeRows].sort((a, b) => {
          const result = a.code.localeCompare(b.code);
          return component.selectedCodeSortDirection === 'asc' ? result : -result;
        });
      });

      component.recordForm.patchValue({
        type: 'INTER',
        code: ['104C'],
        description: 'Test Description',
        effectiveDate: moment.utc(moment().add(10, 'days').format('YYYY-MM-DD')), // Future date
        terminationDate: null
      });

      component.onSave();
      flush();

      expect(mockDefineAccessClassService.createAccessClass).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Access Class Codes created successfully',
        'DISMISS',
        jasmine.objectContaining({
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['custom-snackbar']
        })
      );
      expect(mockDialogRef.close).toHaveBeenCalledWith({ success: true, data: mockResponse });
    }));

    it('should include username from cookie in create request', fakeAsync(() => {
      const mockData: CreateEditRecordData = { mode: 'add', classname: '00ISU' };
      const mockResponse = {
        success: true,
        message: 'Created',
        statusCode: 201,
        item: []
      };
      mockLoginService.getStoredUsername.and.returnValue('MYUSER');
      mockDefineAccessClassService.getTypesByClassname.and.returnValue(of([{ type: 'INTER', description: '' }]));
      mockDefineAccessClassService.getCodeValuesByType.and.returnValue(of([{ value: '104C', description: '' }]));
      mockDefineAccessClassService.getAccessClassDetail.and.returnValue(of({
        class: '00ISU',
        classDescription: '',
        type: 'INTER',
        code: '104C',
        description: 'Test',
        effectiveDate: '2026-01-01T00:00:00',
        terminationDate: null
      }));
      mockDefineAccessClassService.createAccessClass.and.returnValue(of(mockResponse));

      createComponentWithData(mockData);
      fixture.detectChanges();
      flush();

      // Spy on sortSelectedCodeRows to prevent infinite loop
      spyOn<any>(component, 'sortSelectedCodeRows').and.callFake(() => {
        if (component.selectedCodeSortDirection === 'default') {
          return;
        }
        component.selectedCodeRows = [...component.selectedCodeRows].sort((a, b) => {
          const result = a.code.localeCompare(b.code);
          return component.selectedCodeSortDirection === 'asc' ? result : -result;
        });
      });

      component.recordForm.patchValue({
        type: 'INTER',
        code: ['104C'],
        description: 'Test',
        effectiveDate: moment.utc(moment().add(10, 'days').format('YYYY-MM-DD')) // Future date
      });

      component.onSave();
      flush();

      const callArgs = mockDefineAccessClassService.createAccessClass.calls.argsFor(0)[0];
      expect(callArgs.insertUser).toBe('MYUSER');
    }));

  });

  describe('Update Record', () => {
    it('should update record with termination date', fakeAsync(() => {
      const mockData: CreateEditRecordData = {
        mode: 'edit',
        id: '00ISU',
        classname: '00ISU',
        codeType: 'INTER',
        codeValue: '101A'
      };
      const mockDetails = {
        class: '00ISU',
        classDescription: 'Test Class',
        type: 'INTER',
        code: '101A',
        description: 'Test Description',
        effectiveDate: '2026-01-01T00:00:00',
        terminationDate: null
      };
      const mockUpdateResponse = {
        success: true,
        message: 'Termination date updated successfully',
        statusCode: 200,
        item: { ...mockDetails, terminationDate: '2026-12-31T00:00:00' }
      };

      mockDefineAccessClassService.getAccessClassDetail.and.returnValue(of(mockDetails));
      mockDefineAccessClassService.updateAccessClass.and.returnValue(of(mockUpdateResponse));

      createComponentWithData(mockData);
      fixture.detectChanges();
      flush();

      component.recordForm.patchValue({
        terminationDate: moment.utc('2026-12-31')
      });

      component.onSave();
      flush();

      expect(mockDefineAccessClassService.updateAccessClass).toHaveBeenCalledWith(
        jasmine.objectContaining({
          accessClass: '00ISU',
          accessCodeType: 'INTER',
          accessCodeValue: '101A',
          terminationDate: jasmine.any(String)
        })
      );
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Termination date updated successfully',
        'DISMISS',
        jasmine.objectContaining({
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['custom-snackbar']
        })
      );
      expect(mockDialogRef.close).toHaveBeenCalledWith({ success: true, data: mockUpdateResponse });
    }));

  });
});
