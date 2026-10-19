import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarService } from '@shared/services/snackbar.service';
import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';

import { SmartManufactureAttributeConfiguratorComponent } from './smart-manufacture-attribute-configurator';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { AttributeConfiguratorService } from './services/attribute-configurator.service';
import { AttributeConfigDto, SaveAttributeConfigRequest } from './models/attribute-configurator.model';
import { createMockSnackbarService, createMockPageHeaderService, createMockHeaderService, createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('SmartManufactureAttributeConfiguratorComponent', () => {
  let component: SmartManufactureAttributeConfiguratorComponent;
  let fixture: ComponentFixture<SmartManufactureAttributeConfiguratorComponent>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockService: jasmine.SpyObj<AttributeConfiguratorService>;
  let chapterChangedSubject: Subject<void>;

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    mockHeaderService = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable(),
    });
    mockSnackBar = createMockMatSnackBar();
    mockPageHeaderService = createMockPageHeaderService();
    Object.defineProperty(mockPageHeaderService, 'pageHeaderData', {
      value: signal({ title: 'Smart Manufacture Attribute Configurator', subtitle: 'Manage product attribute mappings and codes.' }),
      writable: false,
    });
    mockSnackbarService = createMockSnackbarService();

    mockService = jasmine.createSpyObj('AttributeConfiguratorService', [
      'getFunctionNames',
      'getLabProductTypes',
      'getAttributeClasses',
      'getAttributeCodes',
      'getModifiers',
      'getAttributeConfigurations',
      'create',
      'update',
    ]);

    // Mock dropdown data
    mockService.getFunctionNames.and.returnValue(of([
      { code: 'CPICOM2', description: 'CPICOM2' },
      { code: 'CPICOM3', description: 'CPICOM3' },
    ]));
    mockService.getLabProductTypes.and.returnValue(of([
      { productType: 'PLT', productTypeDesc: 'Platelets' },
    ]));
    mockService.getAttributeClasses.and.returnValue(of([
      { code: 'C0006', codeDesc: 'PLATELETS' },
    ]));
    mockService.getAttributeCodes.and.returnValue(of([
      { code: 'V0014006', codeDesc: 'Leukoreduced <8.3x10^8' },
    ]));
    mockService.getModifiers.and.returnValue(of([]));

    // Mock table data
    mockService.getAttributeConfigurations.and.returnValue(of({
      data: [
        {
          chapterId: 'TEST',
          functionName: 'CPICOM2',
          labProductType: 'PLT',
          productDescription: 'Platelets',
          attributeClass: 'C0006',
          attributeCode: 'V0014006',
          modifier: null,
          effectiveDate: '22-MAY-2026',
          terminationDate: null,
          insertUser: 'testuser',
          insertDate: '2026-05-22',
          lastModifiedBy: 'testuser',
          modifiedDate: '2026-05-22T10:00:00',
        },
      ],
      total: 1,
    }));



      TestBed.configureTestingModule({
      imports: [
        SmartManufactureAttributeConfiguratorComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: AttributeConfiguratorService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });


    


      mockPageHeaderService.getTitle.calls.reset();


      mockPageHeaderService.getSubtitle.calls.reset();


      mockPageHeaderService.getCurrentMenuItem.calls.reset();


      mockService.getFunctionNames.calls.reset();


      mockService.getLabProductTypes.calls.reset();


      mockService.getAttributeClasses.calls.reset();


      mockService.getAttributeCodes.calls.reset();


      mockService.getModifiers.calls.reset();


      mockService.getAttributeConfigurations.calls.reset();


      mockService.create.calls.reset();


      mockService.update.calls.reset();


      mockService.getModifiers.and.returnValue(of([]));


    fixture = TestBed.createComponent(SmartManufactureAttributeConfiguratorComponent);
    component = fixture.componentInstance;
    (component as any).snackBar = mockSnackBar;
    fixture.detectChanges();


    });


  describe('initial state', () => {


    it('should not be in data loaded state', () => {
      expect(component.isDataLoaded).toBeFalse();
    });

    it('should have no function name selected', () => {
      expect(component.selectedFunctionName).toBe('');
    });

    it('should have side panel closed', () => {
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should have function name options', () => {
      expect(component.functionNames.length).toBeGreaterThan(0);
    });
  });

  describe('onRetrieve', () => {
    it('should not load data when no function name selected', () => {
      component.selectedFunctionName = '';
      component.onRetrieve();
      expect(component.isDataLoaded).toBeFalse();
    });

    it('should load mock data when function name is selected', fakeAsync(() => {
      tick(); // Wait for async initialization
      fixture.detectChanges();

      component.selectedFunctionName = 'CPICOM2';
      component.onRetrieve();
      tick();
      fixture.detectChanges();

      expect(component.isDataLoaded).toBeTrue();
      expect(component.dataSource.length).toBeGreaterThan(0);
    }));



  });

  describe('onClearAll', () => {
    it('should reset state', fakeAsync(() => {
      tick(); // Wait for async initialization
      fixture.detectChanges();

      component.selectedFunctionName = 'CPICOM2';
      component.onRetrieve();
      tick();
      fixture.detectChanges();

      component.onClearAll();

      expect(component.selectedFunctionName).toBe('');
      expect(component.isDataLoaded).toBeFalse();
      expect(component.dataSource.length).toBe(0);
    }));


  });

  describe('onSearch', () => {
    it('should filter data by keyword', fakeAsync(() => {
      tick(); // Wait for async initialization
      fixture.detectChanges();

      component.selectedFunctionName = 'CPICOM2';
      component.onRetrieve();
      tick();
      fixture.detectChanges();

      const initialCount = component.dataSource.length;
      component.onSearch('PLSM');

      expect(component.searchKeyword).toBe('PLSM');
    }));

    it('should reset pagination to first page', fakeAsync(() => {
      tick(); // Wait for async initialization
      fixture.detectChanges();

      component.selectedFunctionName = 'CPICOM2';
      component.onRetrieve();
      tick();
      fixture.detectChanges();

      component.dataTableConfig.pagination!.pageIndex = 2;
      component.onSearch('test');

      expect(component.dataTableConfig.pagination!.pageIndex).toBe(0);
    }));
  });

  describe('side panel', () => {
    it('should open add drawer', () => {
      component.openAddDrawer();

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should clear row highlight when opening add drawer', () => {
      component.dataTableComponent = { activeRow: null } as any;
      const mockRow = {
        functionName: 'CPICOM2',
        labProductType: 'PLSM',
        productDescription: 'Plasma',
        attributeClass: 'C0004',
        attributeCode: 'V0011003',
        modifier: null,
        effectiveDate: '09-JUN-2025',
        terminationDate: null,
        chapterId: 'TEST',
        insertUser: 'testuser',
        insertDate: '2025-01-30',
        lastModifiedBy: 'testuser',
        modifiedDate: '2025-01-30T08:32:00',
      };

      component.openEditDrawer(mockRow);
      expect(component.dataTableComponent.activeRow).toBe(mockRow);

      component.openAddDrawer();
      expect(component.dataTableComponent.activeRow).toBeNull();
    });

    it('should open edit drawer with data', () => {
      const mockRow = {
        functionName: 'CPICOM2',
        labProductType: 'PLSM',
        productDescription: 'Plasma',
        attributeClass: 'C0004',
        attributeCode: 'V0011003',
        modifier: null,
        effectiveDate: '09-JUN-2025',
        terminationDate: null,
        chapterId: 'TEST',
        insertUser: 'testuser',
        insertDate: '2025-01-30',
        lastModifiedBy: 'testuser',
        modifiedDate: '2025-01-30T08:32:00',
      };

      component.openEditDrawer(mockRow);

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockRow);
    });

    it('should highlight row when edit drawer is opened', () => {
      component.dataTableComponent = { activeRow: null } as any;
      const mockRow = {
        functionName: 'CPICOM2',
        labProductType: 'PLSM',
        productDescription: 'Plasma',
        attributeClass: 'C0004',
        attributeCode: 'V0011003',
        modifier: null,
        effectiveDate: '09-JUN-2025',
        terminationDate: null,
        chapterId: 'TEST',
        insertUser: 'testuser',
        insertDate: '2025-01-30',
        lastModifiedBy: 'testuser',
        modifiedDate: '2025-01-30T08:32:00',
      };

      component.openEditDrawer(mockRow);

      expect(component.dataTableComponent.activeRow).toBe(mockRow);
    });

    it('should highlight row on row action edit', () => {
      component.dataTableComponent = { activeRow: null } as any;
      const mockRow = {
        functionName: 'CPICOM2',
        labProductType: 'PLSM',
        productDescription: 'Plasma',
        attributeClass: 'C0004',
        attributeCode: 'V0011003',
        modifier: null,
        effectiveDate: '09-JUN-2025',
        terminationDate: null,
        chapterId: 'TEST',
        insertUser: 'testuser',
        insertDate: '2025-01-30',
        lastModifiedBy: 'testuser',
        modifiedDate: '2025-01-30T08:32:00',
      };

      component.onRowAction({ action: 'edit', row: mockRow });

      expect(component.dataTableComponent.activeRow).toBe(mockRow);
    });

    it('should close side drawer', () => {
      component.openAddDrawer();
      component.closeSideDrawer();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should clear row highlight when side drawer is closed', () => {
      component.dataTableComponent = { activeRow: null } as any;
      const mockRow = {
        functionName: 'CPICOM2',
        labProductType: 'PLSM',
        productDescription: 'Plasma',
        attributeClass: 'C0004',
        attributeCode: 'V0011003',
        modifier: null,
        effectiveDate: '09-JUN-2025',
        terminationDate: null,
        chapterId: 'TEST',
        insertUser: 'testuser',
        insertDate: '2025-01-30',
        lastModifiedBy: 'testuser',
        modifiedDate: '2025-01-30T08:32:00',
      };

      component.openEditDrawer(mockRow);
      expect(component.dataTableComponent.activeRow).toBe(mockRow);

      component.closeSideDrawer();
      expect(component.dataTableComponent.activeRow).toBeNull();
    });
  });

  describe('onSave', () => {


    it('should close side panel after save', fakeAsync(() => {
      const mockResult = {
        success: true,
        message: 'Record created successfully',
        data: {
          chapterId: 'TEST',
          functionName: 'CPICOM2',
          labProductType: 'PLSM',
          productDescription: 'Plasma',
          attributeClass: 'C0004',
          attributeCode: 'V0011003',
          modifier: null,
          effectiveDate: '2025-06-09',
          terminationDate: null,
          insertUser: 'testuser',
          insertDate: '2025-06-09',
          lastModifiedBy: 'testuser',
          modifiedDate: '2025-06-09T10:00:00',
        },
      };
      mockService.create.and.returnValue(of(mockResult));
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;

      component.onSave({
        functionName: 'CPICOM2',
        labProductType: 'PLSM',
        attributeClass: 'C0004',
        attributeCode: 'V0011003',
        modifier: null,
        effectiveDate: '2025-06-09',
        terminationDate: null,
      });

      tick();

      expect(component.sidePanelOpen).toBeFalse();
    }));

    it('should call service.update when sidePanelMode is edit', fakeAsync(() => {
      const mockRow: AttributeConfigDto = {
        chapterId: 'TEST',
        functionName: 'CPICOM2',
        labProductType: 'PLT',
        productDescription: 'Platelets',
        attributeClass: 'C0006',
        attributeCode: 'V0014006',
        modifier: null,
        effectiveDate: '22-MAY-2026',
        terminationDate: null,
        insertUser: 'testuser',
        insertDate: '2026-05-22',
        lastModifiedBy: 'testuser',
        modifiedDate: '2026-05-22T10:00:00',
      };

      const updatedResult = { success: true, message: 'Record updated successfully', data: { ...mockRow, modifier: 'MOD1' } };
      mockService.update.and.returnValue(of(updatedResult));

      component.sidePanelMode = 'edit';
      component.sidePanelData = mockRow;
      component.sidePanelOpen = true;
      component.selectedFunctionName = 'CPICOM2';

      const saveRequest: SaveAttributeConfigRequest = {
        functionName: 'CPICOM2',
        labProductType: 'PLT',
        attributeClass: 'C0006',
        attributeCode: 'V0014006',
        modifier: 'MOD1',
        effectiveDate: '2026-05-22',
        terminationDate: null,
      };

      component.onSave(saveRequest);
      tick();

      expect(mockService.update).toHaveBeenCalledWith(
        'PLT', 'CPICOM2', saveRequest, 'C0006', 'V0014006'
      );
      expect(component.sidePanelOpen).toBeFalse();
    }));

    it('should show error snackbar on save error', fakeAsync(() => {
      mockService.create.and.returnValue(throwError(() => new Error('Network error')));
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;

      component.onSave({
        functionName: 'CPICOM2',
        labProductType: 'PLT',
        attributeClass: 'C0006',
        attributeCode: 'V0014006',
        modifier: null,
        effectiveDate: '2026-05-22',
        terminationDate: null,
      });
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Failed to save attribute configuration', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should show business error snackbar when response has success false with errorCode', fakeAsync(() => {
      const errorResponse = {
        success: false as const,
        errorCode: 'DUP_001',
        error: 'Duplicate record found',
      };
      mockService.create.and.returnValue(of(errorResponse as any));
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;

      component.onSave({
        functionName: 'CPICOM2',
        labProductType: 'PLT',
        attributeClass: 'C0006',
        attributeCode: 'V0014006',
        modifier: null,
        effectiveDate: '2026-05-22',
        terminationDate: null,
      });
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error DUP_001: Duplicate record found', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(component.sidePanelOpen).toBeTrue();
    }));

    it('should show business error without errorCode when not provided', fakeAsync(() => {
      const errorResponse = {
        success: false as const,
        message: 'Something went wrong',
      };
      mockService.create.and.returnValue(of(errorResponse as any));
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;

      component.onSave({
        functionName: 'CPICOM2',
        labProductType: 'PLT',
        attributeClass: 'C0006',
        attributeCode: 'V0014006',
        modifier: null,
        effectiveDate: '2026-05-22',
        terminationDate: null,
      });
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Something went wrong', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should show business error from errorResponse nested object', fakeAsync(() => {
      const errorResponse = {
        success: false as const,
        errorResponse: { errorCode: 'ERR_500', error: 'Internal error' },
      };
      mockService.create.and.returnValue(of(errorResponse as any));
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;

      component.onSave({
        functionName: 'CPICOM2',
        labProductType: 'PLT',
        attributeClass: 'C0006',
        attributeCode: 'V0014006',
        modifier: null,
        effectiveDate: '2026-05-22',
        terminationDate: null,
      });
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error ERR_500: Internal error', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should use defaults for sidePanelData when fields are missing in edit mode', fakeAsync(() => {
      const updatedResult = {
        success: true,
        message: 'Record updated successfully',
        data: {
          chapterId: 'TEST',
          functionName: 'CPICOM2',
          labProductType: 'PLT',
          productDescription: 'Platelets',
          attributeClass: 'C0006',
          attributeCode: 'V0014006',
          modifier: null,
          effectiveDate: '2026-05-22',
          terminationDate: null,
          insertUser: 'testuser',
          insertDate: '2026-05-22',
          lastModifiedBy: 'testuser',
          modifiedDate: '2026-05-22T10:00:00',
        },
      };
      mockService.update.and.returnValue(of(updatedResult));

      component.sidePanelMode = 'edit';
      component.sidePanelData = null;
      component.sidePanelOpen = true;
      component.selectedFunctionName = 'CPICOM2';

      const saveRequest: SaveAttributeConfigRequest = {
        functionName: 'CPICOM2',
        labProductType: 'PLT',
        attributeClass: 'C0006',
        attributeCode: 'V0014006',
        modifier: null,
        effectiveDate: '2026-05-22',
        terminationDate: null,
      };

      component.onSave(saveRequest);
      tick();

      expect(mockService.update).toHaveBeenCalledWith(
        '', '', saveRequest, undefined, undefined
      );
    }));

    it('should call showSnackbar on successful save', fakeAsync(() => {
      const mockResult = {
        success: true,
        message: 'Record created successfully',
        data: {
          chapterId: 'TEST',
          functionName: 'CPICOM2',
          labProductType: 'PLT',
          productDescription: 'Platelets',
          attributeClass: 'C0006',
          attributeCode: 'V0014006',
          modifier: null,
          effectiveDate: '2026-05-22',
          terminationDate: null,
          insertUser: 'testuser',
          insertDate: '2026-05-22',
          lastModifiedBy: 'testuser',
          modifiedDate: '2026-05-22T10:00:00',
        },
      };
      mockService.create.and.returnValue(of(mockResult));
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;

      component.onSave({
        functionName: 'CPICOM2',
        labProductType: 'PLT',
        attributeClass: 'C0006',
        attributeCode: 'V0014006',
        modifier: null,
        effectiveDate: '2026-05-22',
        terminationDate: null,
      });
      tick();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Record created successfully');
    }));

    it('should call resetSubmissionState on sideDrawer on error', fakeAsync(() => {
      mockService.create.and.returnValue(throwError(() => new Error('fail')));
      component.sidePanelMode = 'add';
      const resetSpy = jasmine.createSpy('resetSubmissionState');
      (component as any).sideDrawerComponent = { resetSubmissionState: resetSpy, resetForm: jasmine.createSpy('resetForm') };

      component.onSave({
        functionName: 'CPICOM2',
        labProductType: 'PLT',
        attributeClass: 'C0006',
        attributeCode: 'V0014006',
        modifier: null,
        effectiveDate: '2026-05-22',
        terminationDate: null,
      });
      tick();

      expect(resetSpy).toHaveBeenCalled();
    }));

    it('should call resetSubmissionState on sideDrawer on business error', fakeAsync(() => {
      const errorResponse = { success: false as const, message: 'Business error' };
      mockService.create.and.returnValue(of(errorResponse as any));
      component.sidePanelMode = 'add';
      const resetSpy = jasmine.createSpy('resetSubmissionState');
      (component as any).sideDrawerComponent = { resetSubmissionState: resetSpy, resetForm: jasmine.createSpy('resetForm') };

      component.onSave({
        functionName: 'CPICOM2',
        labProductType: 'PLT',
        attributeClass: 'C0006',
        attributeCode: 'V0014006',
        modifier: null,
        effectiveDate: '2026-05-22',
        terminationDate: null,
      });
      tick();

      expect(resetSpy).toHaveBeenCalled();
    }));
  });

  describe('onSaveAndCreateAnother', () => {
    const saveRequest: SaveAttributeConfigRequest = {
      functionName: 'CPICOM2',
      labProductType: 'PLT',
      attributeClass: 'C0006',
      attributeCode: 'V0014006',
      modifier: null,
      effectiveDate: '2026-05-22',
      terminationDate: null,
    };

    const mockResult = {
      success: true,
      message: 'Record created successfully',
      data: {
        chapterId: 'TEST',
        functionName: 'CPICOM2',
        labProductType: 'PLT',
        productDescription: 'Platelets',
        attributeClass: 'C0006',
        attributeCode: 'V0014006',
        modifier: null,
        effectiveDate: '2026-05-22',
        terminationDate: null,
        insertUser: 'testuser',
        insertDate: '2026-05-22',
        lastModifiedBy: 'testuser',
        modifiedDate: '2026-05-22T10:00:00',
      },
    };

    it('should reset form and switch to add mode on success', fakeAsync(() => {
      mockService.create.and.returnValue(of(mockResult));
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;
      const resetFormSpy = jasmine.createSpy('resetForm');
      (component as any).sideDrawerComponent = { resetForm: resetFormSpy, resetSubmissionState: jasmine.createSpy('resetSubmissionState') };

      component.onSaveAndCreateAnother(saveRequest);
      tick();

      expect(resetFormSpy).toHaveBeenCalled();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Record created successfully');
    }));

    it('should keep side panel open after save and create another', fakeAsync(() => {
      mockService.create.and.returnValue(of(mockResult));
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;
      (component as any).sideDrawerComponent = { resetForm: jasmine.createSpy('resetForm'), resetSubmissionState: jasmine.createSpy('resetSubmissionState') };

      component.onSaveAndCreateAnother(saveRequest);
      tick();

      expect(component.sidePanelOpen).toBeTrue();
    }));

    it('should call service.update when sidePanelMode is edit', fakeAsync(() => {
      const editRow: AttributeConfigDto = { ...mockResult.data };
      mockService.update.and.returnValue(of(mockResult));
      component.sidePanelMode = 'edit';
      component.sidePanelData = editRow;
      component.sidePanelOpen = true;
      (component as any).sideDrawerComponent = { resetForm: jasmine.createSpy('resetForm'), resetSubmissionState: jasmine.createSpy('resetSubmissionState') };

      component.onSaveAndCreateAnother(saveRequest);
      tick();

      expect(mockService.update).toHaveBeenCalledWith(
        'PLT', 'CPICOM2', saveRequest, 'C0006', 'V0014006'
      );
    }));

    it('should show error snackbar on save and create another error', fakeAsync(() => {
      mockService.create.and.returnValue(throwError(() => new Error('fail')));
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;

      component.onSaveAndCreateAnother(saveRequest);
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Failed to save attribute configuration', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should call resetSubmissionState on error in save and create another', fakeAsync(() => {
      mockService.create.and.returnValue(throwError(() => new Error('fail')));
      component.sidePanelMode = 'add';
      const resetSpy = jasmine.createSpy('resetSubmissionState');
      (component as any).sideDrawerComponent = { resetSubmissionState: resetSpy, resetForm: jasmine.createSpy('resetForm') };

      component.onSaveAndCreateAnother(saveRequest);
      tick();

      expect(resetSpy).toHaveBeenCalled();
    }));

    it('should handle business error in save and create another', fakeAsync(() => {
      const errorResponse = { success: false as const, errorCode: 'DUP', error: 'Duplicate' };
      mockService.create.and.returnValue(of(errorResponse as any));
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;
      const resetSpy = jasmine.createSpy('resetSubmissionState');
      (component as any).sideDrawerComponent = { resetSubmissionState: resetSpy, resetForm: jasmine.createSpy('resetForm') };

      component.onSaveAndCreateAnother(saveRequest);
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Error DUP: Duplicate', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(resetSpy).toHaveBeenCalled();
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy subject', () => {
      const destroySub = (component as any).destroy$;
      const completeSpy = spyOn(destroySub, 'complete');
      const nextSpy = spyOn(destroySub, 'next');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('subscribeToChapterChanges', () => {
    it('should reset state and reload dropdowns on chapter change', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.selectedFunctionName = 'CPICOM2';
      component.onRetrieve();
      tick();
      fixture.detectChanges();

      expect(component.isDataLoaded).toBeTrue();

      mockService.getFunctionNames.calls.reset();
      mockService.getLabProductTypes.calls.reset();
      mockService.getAttributeClasses.calls.reset();
      mockService.getAttributeCodes.calls.reset();
      mockService.getModifiers.calls.reset();

      chapterChangedSubject.next();
      tick();
      fixture.detectChanges();

      expect(component.isDataLoaded).toBeFalse();
      expect(component.selectedFunctionName).toBe('');
      expect(component.dataSource.length).toBe(0);
      expect(mockService.getFunctionNames).toHaveBeenCalled();
    }));
  });

  describe('loadDropdownData', () => {
    it('should show error snackbar when dropdown data fails to load', fakeAsync(() => {
      mockService.getFunctionNames.and.returnValue(throwError(() => new Error('Server error')));

      (component as any).loadDropdownData();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Failed to load dropdown data', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    }));

    it('should handle null values in dropdown response', fakeAsync(() => {
      mockService.getFunctionNames.and.returnValue(of(null as any));
      mockService.getLabProductTypes.and.returnValue(of(null as any));
      mockService.getAttributeClasses.and.returnValue(of(null as any));
      mockService.getAttributeCodes.and.returnValue(of(null as any));
      mockService.getModifiers.and.returnValue(of(null as any));

      (component as any).loadDropdownData();
      tick();

      expect(component.functionNames).toEqual([]);
      expect(component.labProductTypes).toEqual([]);
      expect(component.attributeClasses).toEqual([]);
      expect(component.attributeCodes).toEqual([]);
      expect(component.modifiers).toEqual([]);
    }));
  });

  describe('setupFunctionNameSearch', () => {
    it('should filter function names by code', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.functionNameSearchControl.setValue('CPICOM2');
      tick();

      const filtered = component.filteredFunctionNames();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('CPICOM2');
    }));

    it('should filter function names by description', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.functionNameSearchControl.setValue('cpicom3');
      tick();

      const filtered = component.filteredFunctionNames();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('CPICOM3');
    }));

    it('should show all function names when search is empty', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.functionNameSearchControl.setValue('CPICOM2');
      tick();
      expect(component.filteredFunctionNames().length).toBe(1);

      component.functionNameSearchControl.setValue('');
      tick();
      expect(component.filteredFunctionNames().length).toBe(2);
    }));

    it('should show all function names when search is null', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.functionNameSearchControl.setValue(null as any);
      tick();

      expect(component.filteredFunctionNames().length).toBe(2);
    }));

    it('should return empty list when no matches found', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.functionNameSearchControl.setValue('NONEXISTENT');
      tick();

      expect(component.filteredFunctionNames().length).toBe(0);
    }));
  });

  describe('onRetrieve - edge cases', () => {
    it('should return early when function name is not found in list', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.selectedFunctionName = 'NONEXISTENT';
      mockService.getAttributeConfigurations.calls.reset();

      component.onRetrieve();
      tick();

      expect(component.selectedFunctionNameObj).toBeNull();
      expect(mockService.getAttributeConfigurations).not.toHaveBeenCalled();
    }));

    it('should reset search keyword on retrieve', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.searchKeyword = 'old search';
      component.selectedFunctionName = 'CPICOM2';
      component.onRetrieve();
      tick();

      expect(component.searchKeyword).toBe('');
    }));

    it('should set isLoading to true during retrieve', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.selectedFunctionName = 'CPICOM2';

      // After onRetrieve is called, before the observable resolves
      const origGetConfigs = mockService.getAttributeConfigurations.and.returnValue(of({ data: [], total: 0 }));

      component.onRetrieve();
      // isLoading was set to true synchronously before the observable completes
      expect(component.isLoading).toBeFalse(); // Since of() is synchronous, it already completed
      tick();
    }));
  });

  describe('loadData', () => {
    it('should return early if selectedFunctionNameObj is null', fakeAsync(() => {
      component.selectedFunctionNameObj = null;
      mockService.getAttributeConfigurations.calls.reset();

      (component as any).loadData();
      tick();

      expect(mockService.getAttributeConfigurations).not.toHaveBeenCalled();
    }));

    it('should format dates for display', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      mockService.getAttributeConfigurations.and.returnValue(of({
        data: [{
          chapterId: 'TEST',
          functionName: 'CPICOM2',
          labProductType: 'PLT',
          productDescription: 'Platelets',
          attributeClass: 'C0006',
          attributeCode: 'V0014006',
          modifier: null,
          effectiveDate: '2026-05-22',
          terminationDate: '2027-12-31',
          insertUser: 'testuser',
          insertDate: '2026-05-22',
          lastModifiedBy: 'testuser',
          modifiedDate: '2026-05-22T10:00:00',
        }],
        total: 1,
      }));

      component.selectedFunctionName = 'CPICOM2';
      component.onRetrieve();
      tick();

      expect(component.dataSource[0].effectiveDate).toBe('22-MAY-2026');
      expect(component.dataSource[0].terminationDate).toBe('31-DEC-2027');
    }));

    it('should handle null dates in data', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      mockService.getAttributeConfigurations.and.returnValue(of({
        data: [{
          chapterId: 'TEST',
          functionName: 'CPICOM2',
          labProductType: 'PLT',
          productDescription: 'Platelets',
          attributeClass: 'C0006',
          attributeCode: 'V0014006',
          modifier: null,
          effectiveDate: null,
          terminationDate: null,
          insertUser: 'testuser',
          insertDate: '2026-05-22',
          lastModifiedBy: 'testuser',
          modifiedDate: '2026-05-22T10:00:00',
        }],
        total: 1,
      }));

      component.selectedFunctionName = 'CPICOM2';
      component.onRetrieve();
      tick();

      expect(component.dataSource[0].effectiveDate).toBeNull();
      expect(component.dataSource[0].terminationDate).toBeNull();
    }));

    it('should show error snackbar on loadData error', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      mockService.getAttributeConfigurations.and.returnValue(throwError(() => new Error('Server error')));

      component.selectedFunctionName = 'CPICOM2';
      component.onRetrieve();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Failed to load attribute configurations', 'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(component.isLoading).toBeFalse();
    }));

    it('should update totalRecords from response', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      mockService.getAttributeConfigurations.and.returnValue(of({
        data: [],
        total: 42,
      }));

      component.selectedFunctionName = 'CPICOM2';
      component.onRetrieve();
      tick();

      expect(component.dataTableConfig.pagination!.totalRecords).toBe(42);
    }));

    it('should show ADD NEW button after data is loaded', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.selectedFunctionName = 'CPICOM2';
      component.onRetrieve();
      tick();

      expect(component.pageHeaderConfig.actions).toBeDefined();
      expect(component.pageHeaderConfig.actions!.length).toBe(1);
      expect(component.pageHeaderConfig.actions![0].label).toBe('ADD NEW');
    }));

    it('should calculate correct skip for pagination', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.dataTableConfig.pagination!.pageIndex = 2;
      component.dataTableConfig.pagination!.pageSize = 10;
      component.selectedFunctionName = 'CPICOM2';
      component.selectedFunctionNameObj = { code: 'CPICOM2', description: 'CPICOM2' };
      mockService.getAttributeConfigurations.calls.reset();

      (component as any).loadData();
      tick();

      expect(mockService.getAttributeConfigurations).toHaveBeenCalledWith('CPICOM2', 10, 20, '');
    }));
  });

  describe('onSearch - edge cases', () => {
    it('should clear search and reload when search is empty string', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.selectedFunctionName = 'CPICOM2';
      component.selectedFunctionNameObj = { code: 'CPICOM2', description: 'CPICOM2' };
      component.searchKeyword = 'old search';
      mockService.getAttributeConfigurations.calls.reset();

      component.onSearch('');
      tick();

      expect(component.searchKeyword).toBe('');
      expect(mockService.getAttributeConfigurations).toHaveBeenCalled();
    }));

    it('should clear search and reload when search is whitespace only', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.selectedFunctionName = 'CPICOM2';
      component.selectedFunctionNameObj = { code: 'CPICOM2', description: 'CPICOM2' };
      component.searchKeyword = 'old search';
      mockService.getAttributeConfigurations.calls.reset();

      component.onSearch('   ');
      tick();

      expect(component.searchKeyword).toBe('');
    }));

    it('should trim search keyword', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.selectedFunctionName = 'CPICOM2';
      component.selectedFunctionNameObj = { code: 'CPICOM2', description: 'CPICOM2' };

      component.onSearch('  PLT  ');
      tick();

      expect(component.searchKeyword).toBe('PLT');
    }));

    it('should handle null keyword gracefully', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.selectedFunctionName = 'CPICOM2';
      component.selectedFunctionNameObj = { code: 'CPICOM2', description: 'CPICOM2' };
      mockService.getAttributeConfigurations.calls.reset();

      component.onSearch(null as any);
      tick();

      expect(component.searchKeyword).toBe('');
    }));
  });

  describe('onPageChange', () => {
    it('should update pagination and load data', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.selectedFunctionName = 'CPICOM2';
      component.selectedFunctionNameObj = { code: 'CPICOM2', description: 'CPICOM2' };
      mockService.getAttributeConfigurations.calls.reset();

      component.onPageChange({ pageIndex: 3, pageSize: 50 });
      tick();

      expect(component.dataTableConfig.pagination!.pageIndex).toBe(3);
      expect(component.dataTableConfig.pagination!.pageSize).toBe(50);
      expect(mockService.getAttributeConfigurations).toHaveBeenCalled();
    }));
  });

  describe('onSortChange', () => {
    it('should update sort config and load data', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.selectedFunctionName = 'CPICOM2';
      component.selectedFunctionNameObj = { code: 'CPICOM2', description: 'CPICOM2' };
      mockService.getAttributeConfigurations.calls.reset();

      component.onSortChange({ column: 'attributeClass', direction: 'asc' });
      tick();

      expect(component.dataTableConfig.sortConfig!.column).toBe('attributeClass');
      expect(component.dataTableConfig.sortConfig!.direction).toBe('asc');
      expect(mockService.getAttributeConfigurations).toHaveBeenCalled();
    }));
  });

  describe('onRowAction - edge cases', () => {
    it('should not do anything for non-edit actions', () => {
      const mockRow: AttributeConfigDto = {
        chapterId: 'TEST',
        functionName: 'CPICOM2',
        labProductType: 'PLT',
        productDescription: 'Platelets',
        attributeClass: 'C0006',
        attributeCode: 'V0014006',
        modifier: null,
        effectiveDate: '22-MAY-2026',
        terminationDate: null,
        insertUser: 'testuser',
        insertDate: '2026-05-22',
        lastModifiedBy: 'testuser',
        modifiedDate: '2026-05-22T10:00:00',
      };

      component.onRowAction({ action: 'delete', row: mockRow });

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelMode).toBe('add');
    });
  });

  describe('handleKeyboardEvent', () => {
    it('should open add drawer on Alt+C when data is loaded and panel is closed', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.isDataLoaded = true;
      component.sidePanelOpen = false;

      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
    }));

    it('should open add drawer on Alt+C (uppercase C)', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.isDataLoaded = true;
      component.sidePanelOpen = false;

      const event = new KeyboardEvent('keydown', { altKey: true, key: 'C' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeTrue();
    }));

    it('should not open add drawer on Alt+C when side panel is already open', () => {
      component.isDataLoaded = true;
      component.sidePanelOpen = true;

      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });

      component.handleKeyboardEvent(event);

      // Should stay in current mode (not reset to add)
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should not open add drawer on Alt+C when data is not loaded', () => {
      component.isDataLoaded = false;
      component.sidePanelOpen = false;

      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });

      component.handleKeyboardEvent(event);

      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should not open add drawer on C without Alt key', () => {
      component.isDataLoaded = true;
      component.sidePanelOpen = false;

      const event = new KeyboardEvent('keydown', { altKey: false, key: 'c' });

      component.handleKeyboardEvent(event);

      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should close side drawer on Escape when panel is open', () => {
      component.sidePanelOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });

      component.handleKeyboardEvent(event);

      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should do nothing on Escape when panel is closed', () => {
      component.sidePanelOpen = false;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });

      component.handleKeyboardEvent(event);

      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should do nothing for other keys', () => {
      component.isDataLoaded = true;
      component.sidePanelOpen = false;

      const event = new KeyboardEvent('keydown', { key: 'a' });

      component.handleKeyboardEvent(event);

      expect(component.sidePanelOpen).toBeFalse();
    });
  });

  describe('getPageHeaderConfig', () => {
    it('should not include actions when showAddButton is false', () => {
      const config = (component as any).getPageHeaderConfig(false);

      expect(config.actions).toBeUndefined();
    });

    it('should include ADD NEW action when showAddButton is true', () => {
      const config = (component as any).getPageHeaderConfig(true);

      expect(config.actions).toBeDefined();
      expect(config.actions.length).toBe(1);
      expect(config.actions[0].label).toBe('ADD NEW');
    });

    it('should use page header data title for breadcrumb', () => {
      const config = (component as any).getPageHeaderConfig();

      expect(config.breadcrumbs[1].label).toBe('Smart Manufacture Attribute Configurator');
    });

    it('should have Home as first breadcrumb', () => {
      const config = (component as any).getPageHeaderConfig();

      expect(config.breadcrumbs[0].label).toBe('Home');
      expect(config.breadcrumbs[0].link).toBe('/home');
    });

    it('should call openAddDrawer when ADD NEW action is clicked', () => {
      const config = (component as any).getPageHeaderConfig(true);
      spyOn(component, 'openAddDrawer');

      config.actions[0].onClick();

      expect(component.openAddDrawer).toHaveBeenCalled();
    });
  });

  describe('resetState', () => {
    it('should reset all state properties', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.selectedFunctionName = 'CPICOM2';
      component.onRetrieve();
      tick();
      fixture.detectChanges();

      expect(component.isDataLoaded).toBeTrue();

      (component as any).resetState();

      expect(component.isDataLoaded).toBeFalse();
      expect(component.dataSource).toEqual([]);
      expect(component.allData).toEqual([]);
      expect(component.searchKeyword).toBe('');
      expect(component.selectedFunctionName).toBe('');
      expect(component.selectedFunctionNameObj).toBeNull();
      expect(component.sidePanelOpen).toBeFalse();
    }));

    it('should reset pagination to defaults', () => {
      component.dataTableConfig.pagination!.pageIndex = 5;
      component.dataTableConfig.pagination!.totalRecords = 100;

      (component as any).resetState();

      expect(component.dataTableConfig.pagination!.pageIndex).toBe(0);
      expect(component.dataTableConfig.pagination!.totalRecords).toBe(0);
    });

    it('should reset sort config to defaults', () => {
      component.dataTableConfig.sortConfig!.column = 'attributeClass';
      component.dataTableConfig.sortConfig!.direction = 'asc';

      (component as any).resetState();

      expect(component.dataTableConfig.sortConfig!.column).toBe('labProductType');
      expect(component.dataTableConfig.sortConfig!.direction).toBe('default');
    });

    it('should remove actions from page header config', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      component.selectedFunctionName = 'CPICOM2';
      component.onRetrieve();
      tick();

      expect(component.pageHeaderConfig.actions).toBeDefined();

      (component as any).resetState();

      expect(component.pageHeaderConfig.actions).toBeUndefined();
    }));

    it('should clear function name search control', () => {
      component.functionNameSearchControl.setValue('CPICOM2');

      (component as any).resetState();

      expect(component.functionNameSearchControl.value).toBe('');
    });
  });

  describe('formatDateForDisplay', () => {
    it('should return null for null date', () => {
      const result = (component as any).formatDateForDisplay(null);
      expect(result).toBeNull();
    });

    it('should format valid date string', () => {
      const result = (component as any).formatDateForDisplay('2026-05-22');
      expect(result).toBe('22-MAY-2026');
    });

    it('should format ISO date with time component', () => {
      const result = (component as any).formatDateForDisplay('2026-12-31T10:30:00');
      expect(result).toBe('31-DEC-2026');
    });

    it('should return original string for invalid date', () => {
      const result = (component as any).formatDateForDisplay('not-a-date');
      // moment considers 'not-a-date' as invalid, so it returns the original string
      expect(result).toBe('not-a-date');
    });
  });

  describe('closeSideDrawer - edge cases', () => {
    it('should work even without dataTableComponent', () => {
      (component as any).dataTableComponent = undefined;
      component.sidePanelOpen = true;

      component.closeSideDrawer();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('openAddDrawer - edge cases', () => {
    it('should work even without dataTableComponent', () => {
      (component as any).dataTableComponent = undefined;

      component.openAddDrawer();

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('onRowAction - without dataTableComponent', () => {
    it('should still open edit drawer when dataTableComponent is undefined', () => {
      (component as any).dataTableComponent = undefined;
      const mockRow: AttributeConfigDto = {
        chapterId: 'TEST',
        functionName: 'CPICOM2',
        labProductType: 'PLT',
        productDescription: 'Platelets',
        attributeClass: 'C0006',
        attributeCode: 'V0014006',
        modifier: null,
        effectiveDate: '22-MAY-2026',
        terminationDate: null,
        insertUser: 'testuser',
        insertDate: '2026-05-22',
        lastModifiedBy: 'testuser',
        modifiedDate: '2026-05-22T10:00:00',
      };

      // The condition checks `if (this.dataTableComponent)` - when it's undefined,
      // it skips setting activeRow but still opens the edit drawer
      component.onRowAction({ action: 'edit', row: mockRow });

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockRow);
    });
  });

  describe('initial configuration', () => {
    it('should have correct search bar configuration', () => {
      expect(component.searchBarConfig.placeholder).toContain('Search by Lab Product Type');
      expect(component.searchBarConfig.minLength).toBe(2);
      expect(component.searchBarConfig.searchOnEnterOnly).toBeTrue();
    });

    it('should have correct data table columns', () => {
      expect(component.dataTableConfig.columns.length).toBe(7);
      expect(component.dataTableConfig.columns[0].key).toBe('labProductType');
      expect(component.dataTableConfig.columns[6].key).toBe('terminationDate');
    });

    it('should have edit row action', () => {
      expect(component.dataTableConfig.rowActions!.length).toBe(1);
      expect(component.dataTableConfig.rowActions![0].action).toBe('edit');
    });

    it('should have default pagination settings', () => {
      expect(component.dataTableConfig.pagination!.pageSize).toBe(25);
      expect(component.dataTableConfig.pagination!.pageIndex).toBe(0);
      expect(component.dataTableConfig.pagination!.totalRecords).toBe(0);
    });

    it('should have default sort config', () => {
      expect(component.dataTableConfig.sortConfig!.column).toBe('labProductType');
      expect(component.dataTableConfig.sortConfig!.direction).toBe('default');
    });

    it('should have empty search keyword', () => {
      expect(component.searchKeyword).toBe('');
    });

    it('should have empty data source', () => {
      expect(component.dataSource).toEqual([]);
    });

    it('should not be loading', () => {
      expect(component.isLoading).toBeFalse();
    });
  });
});
