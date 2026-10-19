import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ViewDonorMasterCodes } from './view-donor-master-codes';
import { DonorMasterCodesService, MasterCode, MasterCodeFilter } from '../services/donor-master-codes.service';
import { FilterDonorMasterCodesComponent } from '../filter-donor-master-codes/filter-donor-master-codes';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import moment from 'moment';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ViewDonorMasterCodes', () => {
  let component: ViewDonorMasterCodes;
  let fixture: ComponentFixture<ViewDonorMasterCodes>;
  let mockService: jasmine.SpyObj<DonorMasterCodesService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockLoginService: jasmine.SpyObj<LoginService>;

  const mockMasterCodes: MasterCode[] = [
    {
      id: '1',
      codeType: 'APITY',
      code: 'APITY',
      description: 'Equipment malfunction detected',
      effDate: moment().subtract(1, 'year').toDate(),
      termDate: null,
      status: 'Active',
      isActive: true,
      changeControlFlag: 'N'
    },
    {
      id: '2',
      codeType: 'ABO',
      code: 'ABO',
      description: 'ABO/Rh Values',
      effDate: moment().subtract(2, 'years').toDate(),
      termDate: moment().subtract(1, 'month').toDate(),
      status: 'Inactive',
      isActive: false,
      changeControlFlag: 'N'
    }
  ];

  beforeEach(() => {
    mockService = jasmine.createSpyObj('DonorMasterCodesService', [
      'getMasterCodes',
      'getMasterCodeById',
      'createMasterCode',
      'updateMasterCode',
      'deleteMasterCode',
      'getMasterCodesByType',
      'getCodeTypesByCode'
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/',
      events: of(new NavigationEnd(0, '/', '/'))
    });
    mockDialog = createMockMatDialog();
    mockSnackbarService = createMockSnackbarService();
    mockHeaderService = createMockHeaderService();
    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);

    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ViewDonorMasterCodes,
        MatDialogModule,
        MatTableModule,
        MatPaginatorModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        FilterDonorMasterCodesComponent
      ],
      providers: [
        provideHttpClient(),
        { provide: DonorMasterCodesService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: LoginService, useValue: mockLoginService }
      ]
    });
  
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');
    mockHeaderService.chapterChanged$ = new Subject<void>();
    mockLoginService.getStoredUsername.and.returnValue('testuser');

    // Provide a default return value so tests that spy on loadMasterCodes (which calls through in Jest)
    // don't fail with "Cannot read properties of undefined (reading 'subscribe')"
    mockService.getMasterCodes.and.returnValue(of({ data: [], total: 0 }));

    fixture = TestBed.createComponent(ViewDonorMasterCodes);
    component = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should load master codes on init', () => {
      mockService.getMasterCodes.and.returnValue(of({ data: mockMasterCodes, total: 2 }));
      component.ngOnInit();
      expect(mockService.getMasterCodes).toHaveBeenCalled();
      expect(component.masterCodes.length).toBe(2);
      expect(component.totalRecords).toBe(2);
      expect(component.isLoading).toBeFalse();
    });

    it('should handle error when loading master codes', () => {
      mockService.getMasterCodes.and.returnValue(throwError(() => new Error('Load failed')));
      component.ngOnInit();
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('loadMasterCodes', () => {

    it('should pass sort parameter when set', () => {
      mockService.getMasterCodes.and.returnValue(of({ data: [], total: 0 }));
      component.sortDirection = 'A';
      component.loadMasterCodes();
      const callArg = mockService.getMasterCodes.calls.mostRecent().args[2] as MasterCodeFilter;
      expect(callArg.sort).toBe('A');
    });


    it('should include search keyword in filter', () => {
      mockService.getMasterCodes.and.returnValue(of({ data: [], total: 0 }));
      component.searchTerm = 'ABO';
      component.loadMasterCodes();
      const callArg = mockService.getMasterCodes.calls.mostRecent().args[2] as MasterCodeFilter;
      expect(callArg.searchKeyword).toBe('ABO');
    });
  });
  describe('onSort', () => {
    beforeEach(() => {
      mockService.getMasterCodes.and.returnValue(of({ data: mockMasterCodes, total: 2 }));
    });

    it('should set direction to A when currently unsorted', () => {
      component.sortDirection = '';
      component.onSort();
      expect(component.sortDirection).toBe('A');
    });

    it('should set direction to D when currently A', () => {
      component.sortDirection = 'A';
      component.onSort();
      expect(component.sortDirection).toBe('D');
    });

    it('should clear direction when currently D', () => {
      component.sortDirection = 'D';
      component.onSort();
      expect(component.sortDirection).toBe('');
    });

    it('should reset page index and reload on sort', () => {
      component.pageIndex = 2;
      component.onSort();
      expect(component.pageIndex).toBe(0);
      expect(mockService.getMasterCodes).toHaveBeenCalled();
    });
  });

  describe('getSortIcon', () => {

    it('should return arrow_upward when direction is A', () => {
      component.sortDirection = 'A';
      expect(component.getSortIcon()).toBe('arrow_upward');
    });

    it('should return arrow_downward when direction is D', () => {
      component.sortDirection = 'D';
      expect(component.getSortIcon()).toBe('arrow_downward');
    });
  });
  describe('isEditDisabled', () => {
    it('should return true when changeControlFlag is D', () => {
      expect(component.isEditDisabled({ ...mockMasterCodes[0], changeControlFlag: 'D' })).toBeTrue();
    });

    it('should return true when changeControlFlag is lowercase d', () => {
      expect(component.isEditDisabled({ ...mockMasterCodes[0], changeControlFlag: 'd' })).toBeTrue();
    });

    it('should return false when changeControlFlag is N', () => {
      expect(component.isEditDisabled({ ...mockMasterCodes[0], changeControlFlag: 'N' })).toBeFalse();
    });


    it('should return false when changeControlFlag is null', () => {
      expect(component.isEditDisabled({ ...mockMasterCodes[0], changeControlFlag: null as any })).toBeFalse();
    });
  });

  describe('isRowHighlighted', () => {
    it('should return true when selectedRow matches the given row code', () => {
      component['selectedRow'] = mockMasterCodes[0];
      expect(component.isRowHighlighted(mockMasterCodes[0])).toBeTrue();
    });

    it('should return false when selectedRow is null', () => {
      component['selectedRow'] = null;
      expect(component.isRowHighlighted(mockMasterCodes[0])).toBeFalse();
    });

    it('should return false when selectedRow has a different code', () => {
      component['selectedRow'] = mockMasterCodes[1];
      expect(component.isRowHighlighted(mockMasterCodes[0])).toBeFalse();
    });
  });

  describe('onDescriptionHover', () => {
    it('should disable tooltip when element is not overflowing', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'scrollWidth', { value: 100 });
      Object.defineProperty(el, 'clientWidth', { value: 200 });
      const event = { currentTarget: el } as unknown as MouseEvent;

      component.onDescriptionHover(event, 'APITY');

      expect(component.descriptionTooltipDisabled.get('APITY')).toBeTrue();
    });

    it('should not disable tooltip when element is overflowing', () => {
      const el = document.createElement('div');
      Object.defineProperty(el, 'scrollWidth', { value: 300 });
      Object.defineProperty(el, 'clientWidth', { value: 200 });
      const event = { currentTarget: el } as unknown as MouseEvent;

      component.onDescriptionHover(event, 'APITY');

      expect(component.descriptionTooltipDisabled.get('APITY')).toBeUndefined();
    });
  });

  describe('formatDate', () => {

    it('should format date as DD-MON-YYYY using moment', () => {
      const date = moment('2025-01-15').toDate();
      expect(component.formatDate(date)).toBe('15-JAN-2025');
    });

    it('should pad single-digit day with leading zero', () => {
      const date = moment('2025-03-05').toDate();
      expect(component.formatDate(date)).toBe('05-MAR-2025');
    });

    it('should format December correctly', () => {
      const date = moment('2025-12-31').toDate();
      expect(component.formatDate(date)).toBe('31-DEC-2025');
    });
  });

  describe('getStatusClass', () => {

    it('should return active for future termination date', () => {
      const futureDate = moment().add(1, 'year').toDate();
      expect(component.getStatusClass(futureDate)).toBe('active');
    });

    it('should return inactive for past termination date', () => {
      const pastDate = moment().subtract(1, 'year').toDate();
      expect(component.getStatusClass(pastDate)).toBe('inactive');
    });

    it('should return active for termination date that is today', () => {
      const today = moment().startOf('day').toDate();
      expect(component.getStatusClass(today)).toBe('active');
    });
  });
  describe('onNavigate', () => {

    it('should include correct status in navigation state for active record', () => {
      const row = { ...mockMasterCodes[0], termDate: null };
      component.onNavigate(row);
      const navArgs = mockRouter.navigate.calls.mostRecent().args[1] as any;
      expect(navArgs.state.codeTypeStatus).toBe('active');
    });

    it('should include correct status in navigation state for inactive record', () => {
      const row = { ...mockMasterCodes[0], termDate: moment().subtract(1, 'month').toDate() };
      component.onNavigate(row);
      const navArgs = mockRouter.navigate.calls.mostRecent().args[1] as any;
      expect(navArgs.state.codeTypeStatus).toBe('inactive');
    });
  });

  describe('clearFilters', () => {
    it('should reset searchTerm, currentFilters, pageIndex, and sort state', () => {
      spyOn(component, 'loadMasterCodes');
      component.searchTerm = 'test';
      component.currentFilters = { effectiveDate: moment().toDate(), effectiveDatePeriod: 'AFTER' };
      component.pageIndex = 3;
      component.sortDirection = 'D';

      component.clearFilters();

      expect(component.searchTerm).toBe('');
      expect(component.currentFilters).toEqual({});
      expect(component.pageIndex).toBe(0);
      expect(component.sortDirection).toBe('');
    });

  });
  describe('openFilter', () => {
    it('should apply filters and reload data when dialog closes with result', () => {
      const filters: MasterCodeFilter = {
        effectiveDate: moment('2025-01-11').toDate(),
        effectiveDatePeriod: 'AFTER'
      };
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(filters));
      spyOn((component as any).dialog, 'open').and.returnValue(mockDialogRef);
      mockService.getMasterCodes.and.returnValue(of({ data: mockMasterCodes, total: 2 }));

      component.openFilter({ currentTarget: document.createElement('button') } as unknown as MouseEvent);

      expect(component.currentFilters).toEqual(filters);
      expect(component.filterChips.length).toBeGreaterThan(0);
      expect(component.pageIndex).toBe(0);
    });

    it('should not apply filters when dialog is dismissed without result', () => {
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));
      spyOn((component as any).dialog, 'open').and.returnValue(mockDialogRef);

      component.currentFilters = {};
      component.openFilter({ currentTarget: document.createElement('button') } as unknown as MouseEvent);

      expect(component.currentFilters).toEqual({});
    });

    it('should set isFilterPanelOpen to true when opening', () => {
      const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRef.afterClosed.and.returnValue(of(undefined));
      spyOn((component as any).dialog, 'open').and.returnValue(mockDialogRef);

      component.isFilterPanelOpen = false;
      component.openFilter({ currentTarget: document.createElement('button') } as unknown as MouseEvent);

      expect(component.isFilterPanelOpen).toBeFalse();
    });
  });

  describe('Dialog Operations', () => {
    function createMockDialogRef() {
      const saveRequest = new Subject<any>();
      const ref = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      ref.afterClosed.and.returnValue(of(undefined));
      ref.componentInstance = { saveRequest };
      return ref;
    }

    describe('onAddNew', () => {

      it('should call createMasterCode and show success on save', () => {
        const mockDialogRef = createMockDialogRef();
        spyOn((component as any).dialog, 'open').and.returnValue(mockDialogRef);
        mockService.createMasterCode.and.returnValue(of({} as any));
        mockService.getMasterCodes.and.returnValue(of({ data: mockMasterCodes, total: 2 }));

        component.onAddNew();
        mockDialogRef.componentInstance.saveRequest.next({
          codeType: 'NEWT',
          description: 'New Code Type',
          effDate: '2027-01-01',
          terminationDate: null
        });

        expect(mockService.createMasterCode).toHaveBeenCalled();
        expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith(
          jasmine.stringContaining('NEWT')
        );
        expect(mockDialogRef.close).toHaveBeenCalled();
      });

    });

    describe('onEdit', () => {
      it('should open edit dialog with correct mode and row data', () => {
        const mockDialogRef = createMockDialogRef();
        const dialogSpy = spyOn((component as any).dialog, 'open').and.returnValue(mockDialogRef);

        component.onEdit(mockMasterCodes[0]);

        expect(dialogSpy).toHaveBeenCalled();
        const openArgs = dialogSpy.calls.mostRecent().args as any[];
        expect(openArgs[1].data.mode).toBe('edit');
        expect(openArgs[1].data.codeType).toBe('APITY');
      });

      it('should call updateMasterCode and show success on save', () => {
        const mockDialogRef = createMockDialogRef();
        spyOn((component as any).dialog, 'open').and.returnValue(mockDialogRef);
        mockService.updateMasterCode.and.returnValue(of({}));
        mockService.getMasterCodes.and.returnValue(of({ data: mockMasterCodes, total: 2 }));

        component.onEdit(mockMasterCodes[0]);
        mockDialogRef.componentInstance.saveRequest.next({
          codeType: 'APITY',
          code: 'APITY',
          description: 'Updated Description',
          effDate: '2027-01-01',
          terminationDate: null
        });

        expect(mockService.updateMasterCode).toHaveBeenCalledWith(
          'APITY', 'APITY', jasmine.objectContaining({ description: 'Updated Description' })
        );
        expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith(
          jasmine.stringContaining('APITY')
        );
        expect(mockDialogRef.close).toHaveBeenCalled();
      });

    });
  });
});
