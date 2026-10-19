import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';

import { EnterEquipmentMasterCodesComponent, EquipmentMasterCode } from './enter-equipment-master-codes';
import { EquipmentMasterCodeService } from './services/equipment-master-code.service';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { EquipmentMasterCodeFilter } from './models/equipment-master-code.model';
import { FilterEquipmentMasterCodesComponent, FilterEquipmentMasterCodesDialogData } from './filter-equipment-master-codes/filter-equipment-master-codes';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockCodeTypes = [
  { code: 'EQ', codeDesc: 'Equipment' },
  { code: 'SU', codeDesc: 'Supplies' },
];

const mockUserGroups = [
  { grpId: 'GRP1', descrip: 'Group 1' },
  { grpId: 'GRP2', descrip: 'Group 2' },
];

const mockDtos = [
  {
    codeType: 'EQ',
    code: 'A01',
    codeDesc: 'Centrifuge',
    effDate: '2024-01-01',
    termDate: null,
    restrictEdit: 'GRP1',
    modifiedBy: 'jdoe',
    lastModifiedDate: '2024-06-01',
  },
  {
    codeType: 'EQ',
    code: 'B02',
    codeDesc: 'Analyzer',
    effDate: '2023-05-15',
    termDate: null,
    restrictEdit: null,
    modifiedBy: null,
    lastModifiedDate: null,
  },
];

const mockApiResponse = { data: mockDtos, total: 2 };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDialogRefSpy(closeValue: any = undefined): jasmine.SpyObj<MatDialogRef<any>> {
  const afterClosed$ = new Subject<any>();
  const ref = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed', 'close']);
  ref.afterClosed.and.returnValue(afterClosed$.asObservable());
  (ref as any)._afterClosed$ = afterClosed$;
  return ref;
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('EnterEquipmentMasterCodesComponent', () => {
  let fixture: ComponentFixture<EnterEquipmentMasterCodesComponent>;
  let component: EnterEquipmentMasterCodesComponent;

  let serviceSpy: jasmine.SpyObj<EquipmentMasterCodeService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: { open: jasmine.Spy };
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<any>>;

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj<EquipmentMasterCodeService>(
      'EquipmentMasterCodeService',
      ['getCodeTypes', 'getUserGroups', 'getByCodeType', 'create', 'update', 'delete'],
    );

    snackbarSpy = jasmine.createSpyObj<SnackbarService>('SnackbarService', ['showSuccess', 'showError']);

    dialogRefSpy = buildDialogRefSpy();
    dialogSpy = { open: jasmine.createSpy('open').and.returnValue(dialogRefSpy) };

    TestBed.configureTestingModule({
      imports: [
        EnterEquipmentMasterCodesComponent,
        NoopAnimationsModule,
        ReactiveFormsModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: EquipmentMasterCodeService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        // Provide MatDialog via the component's injector token
        { provide: 'MatDialog', useValue: dialogSpy },
      ],
    })
      // Override MatDialog directly so the DI token resolves correctly
      .overrideProvider(
        MatDialog,
        { useValue: dialogSpy },
      );
  
    serviceSpy.getCodeTypes.and.returnValue(of(mockCodeTypes));
    serviceSpy.getUserGroups.and.returnValue(of(mockUserGroups));
    serviceSpy.getByCodeType.and.returnValue(of(mockApiResponse));

    // Rebuild dialogRef with a fresh Subject for each test
    dialogRefSpy = buildDialogRefSpy();
    dialogSpy.open.and.returnValue(dialogRefSpy);
    dialogSpy.open.calls.reset();

    fixture = TestBed.createComponent(EnterEquipmentMasterCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Initialization ──────────────────────────────────────────────────────────

  describe('Initialization', () => {

    it('should load code types and user groups on init', () => {
      expect(serviceSpy.getCodeTypes).toHaveBeenCalledTimes(1);
      expect(serviceSpy.getUserGroups).toHaveBeenCalledTimes(1);
    });

    it('should map code types to masterCodeTypes', () => {
      expect(component.masterCodeTypes).toEqual([
        { value: 'EQ', label: 'Equipment' },
        { value: 'SU', label: 'Supplies' },
      ]);
    });

    it('should map user groups to userGroupOptions', () => {
      expect(component.userGroupOptions).toEqual([
        { value: 'GRP1', label: 'Group 1' },
        { value: 'GRP2', label: 'Group 2' },
      ]);
    });

    it('should not have retrieved data yet', () => {
      expect(component.hasRetrieved).toBeFalse();
    });

  });

  // ── selectedTypeDescription ─────────────────────────────────────────────────

  describe('selectedTypeDescription', () => {
    it('should return "-" when no master code type is selected', () => {
      expect(component.selectedTypeDescription).toBe('-');
    });

    it('should return description for selected code type', () => {
      component.filterForm.get('masterCodeType')?.setValue('EQ');
      expect(component.selectedTypeDescription).toBe('Equipment');
    });

    it('should return "-" for unknown code type value', () => {
      component.filterForm.get('masterCodeType')?.setValue('UNKNOWN');
      expect(component.selectedTypeDescription).toBe('-');
    });
  });

  // ── onRetrieve ──────────────────────────────────────────────────────────────

  describe('onRetrieve', () => {
    it('should mark masterCodeType as touched and not load data when invalid', () => {
      component.onRetrieve();
      expect(component.filterForm.get('masterCodeType')?.touched).toBeTrue();
      expect(serviceSpy.getByCodeType).not.toHaveBeenCalled();
      expect(component.hasRetrieved).toBeFalse();
    });

    it('should set hasRetrieved and call loadData when valid', () => {
      component.filterForm.get('masterCodeType')?.setValue('EQ');
      component.onRetrieve();
      expect(component.hasRetrieved).toBeTrue();
      expect(serviceSpy.getByCodeType).toHaveBeenCalled();
    });


  });

  // ── loadData ────────────────────────────────────────────────────────────────

  describe('loadData (via onRetrieve)', () => {
    beforeEach(() => {
      component.filterForm.get('masterCodeType')?.setValue('EQ');
      component.onRetrieve();
    });

    it('should call getByCodeType with correct codeType', () => {
      expect(serviceSpy.getByCodeType).toHaveBeenCalledWith(
        'EQ',
        undefined,
        jasmine.any(Number),
        jasmine.any(Number),
        undefined,
        undefined,
      );
    });

    it('should populate masterCodes from DTO mapping', () => {
      expect(component.masterCodes.length).toBe(2);
      expect(component.masterCodes[0].code).toBe('A01');
      expect(component.masterCodes[0].description).toBe('Centrifuge');
      expect(component.masterCodes[0].userGroup).toBe('GRP1');
    });

    it('should map null dates to null', () => {
      expect(component.masterCodes[1].terminationDate).toBeNull();
      expect(component.masterCodes[1].modifiedBy).toBeNull();
      expect(component.masterCodes[1].modificationDate).toBeNull();
    });

    it('should set totalRecords', () => {
      expect(component.totalRecords).toBe(2);
    });



    it('should pass active filters to getByCodeType', () => {
      const filter: EquipmentMasterCodeFilter = {
        userGroup: 'GRP1',
        effectiveDate: new Date('2024-01-01'),
        effectiveDatePeriod: 'AFTER',
      };
      component.currentFilters = filter;
      component.filterForm.get('masterCodeType')?.setValue('EQ');
      component.onRetrieve();
      expect(serviceSpy.getByCodeType).toHaveBeenCalledWith(
        'EQ', undefined, jasmine.any(Number), jasmine.any(Number), undefined, filter,
      );
    });

  });

  // ── onSearch ────────────────────────────────────────────────────────────────

  describe('onSearch', () => {
    beforeEach(() => {
      component.filterForm.get('masterCodeType')?.setValue('EQ');
      component.onRetrieve();
    });


    it('should call getByCodeType with search term', () => {
      component.onSearch('analyzer');
      const callArgs = serviceSpy.getByCodeType.calls.mostRecent().args;
      expect(callArgs[1]).toBe('analyzer');
    });
  });

  // ── onSort ──────────────────────────────────────────────────────────────────

  describe('onSort', () => {
    beforeEach(() => {
      component.filterForm.get('masterCodeType')?.setValue('EQ');
      component.onRetrieve();
    });

    it('should cycle: "" -> "A" -> "D" -> ""', () => {
      expect(component.sortDirection).toBe('');

      component.onSort();
      expect(component.sortDirection).toBe('A');

      component.onSort();
      expect(component.sortDirection).toBe('D');

      component.onSort();
      expect(component.sortDirection).toBe('');
    });

    it('should reset pageIndex on sort', () => {
      component.pageIndex = 2;
      component.onSort();
      expect(component.pageIndex).toBe(0);
    });
  });

  // ── getSortIcon ─────────────────────────────────────────────────────────────

  describe('getSortIcon', () => {
    it('should return unfold_more when not sorted', () => {
      component.sortDirection = '';
      expect(component.getSortIcon()).toBe('unfold_more');
    });

    it('should return arrow_upward when ascending', () => {
      component.sortDirection = 'A';
      expect(component.getSortIcon()).toBe('arrow_upward');
    });

    it('should return arrow_downward when descending', () => {
      component.sortDirection = 'D';
      expect(component.getSortIcon()).toBe('arrow_downward');
    });
  });

  // ── onPageChange ────────────────────────────────────────────────────────────


  // ── Filter: openFilter ──────────────────────────────────────────────────────

  describe('openFilter', () => {
    beforeEach(() => {
      component.filterForm.get('masterCodeType')?.setValue('EQ');
      component.onRetrieve();
    });

    function fireOpenFilter(): void {
      const fakeRect = { left: 100, bottom: 200, right: 300, top: 160, width: 200, height: 40 } as DOMRect;
      const btn = document.createElement('button');
      spyOn(btn, 'getBoundingClientRect').and.returnValue(fakeRect);
      spyOn(btn, 'blur');

      const event = new MouseEvent('click');
      Object.defineProperty(event, 'currentTarget', { value: btn });
      component.openFilter(event);
    }

    it('should set isFilterPanelOpen to true', () => {
      fireOpenFilter();
      expect(component.isFilterPanelOpen).toBeTrue();
    });


    it('should pass currentFilters and userGroupOptions in dialog data', () => {
      const activeFilter: EquipmentMasterCodeFilter = { userGroup: 'GRP1' };
      component.currentFilters = activeFilter;
      fireOpenFilter();
      const passedData: FilterEquipmentMasterCodesDialogData =
        dialogSpy.open.calls.mostRecent().args[1].data;
      expect(passedData.currentFilters).toBe(activeFilter);
      expect(passedData.userGroupOptions).toEqual(component.userGroupOptions);
    });

    it('should reset isFilterPanelOpen to false when dialog closes with no result', () => {
      fireOpenFilter();
      (dialogRefSpy as any)._afterClosed$.next(undefined);
      expect(component.isFilterPanelOpen).toBeFalse();
    });

    it('should apply returned filters and create chips', () => {
      const returnedFilters: EquipmentMasterCodeFilter = {
        userGroup: 'GRP1',
        effectiveDate: new Date('2024-01-01'),
        effectiveDatePeriod: 'AFTER',
      };
      fireOpenFilter();
      (dialogRefSpy as any)._afterClosed$.next(returnedFilters);

      expect(component.currentFilters).toEqual(returnedFilters);
      expect(component.filterChips.length).toBeGreaterThan(0);
      expect(component.pageIndex).toBe(0);
      expect(serviceSpy.getByCodeType).toHaveBeenCalled();
    });

    it('should create User Group chip when userGroup filter is applied', () => {
      const returnedFilters: EquipmentMasterCodeFilter = { userGroup: 'GRP2' };
      fireOpenFilter();
      (dialogRefSpy as any)._afterClosed$.next(returnedFilters);

      const ugChip = component.filterChips.find(c => c.key === 'userGroup');
      expect(ugChip).toBeDefined();
      expect(ugChip?.label).toBe('User Group: GRP2');
    });

    it('should create Effective Date chip with correct symbol', () => {
      const returnedFilters: EquipmentMasterCodeFilter = {
        effectiveDate: new Date('2024-03-15'),
        effectiveDatePeriod: 'BEFORE',
      };
      fireOpenFilter();
      (dialogRefSpy as any)._afterClosed$.next(returnedFilters);

      const chip = component.filterChips.find(c => c.key === 'effectiveDate');
      expect(chip?.label).toContain('≤');
    });
  });

  // ── Filter: removeFilterChip ────────────────────────────────────────────────

  describe('removeFilterChip', () => {
    beforeEach(() => {
      component.filterForm.get('masterCodeType')?.setValue('EQ');
      component.hasRetrieved = true;
      component.currentFilters = {
        userGroup: 'GRP1',
        effectiveDate: new Date('2024-01-01'),
        effectiveDatePeriod: 'AFTER',
      };
      component.filterChips = [
        { key: 'userGroup', label: 'User Group: GRP1', value: 'GRP1', removable: true },
        { key: 'effectiveDate', label: 'Effective Date ≥ ...', value: new Date('2024-01-01'), removable: true },
      ];
    });


    it('should remove effectiveDate and period when effectiveDate chip is removed', () => {
      component.removeFilterChip('effectiveDate');
      expect(component.currentFilters.effectiveDate).toBeUndefined();
      expect(component.currentFilters.effectiveDatePeriod).toBeUndefined();
    });


  });

  // ── Filter: clearAllFiltersChips ────────────────────────────────────────────


  // ── onClearAll ──────────────────────────────────────────────────────────────

  describe('onClearAll', () => {
    beforeEach(() => {
      component.filterForm.get('masterCodeType')?.setValue('EQ');
      component.onRetrieve();
      component.currentFilters = { userGroup: 'GRP1' };
      component.filterChips = [
        { key: 'userGroup', label: 'User Group: GRP1', value: 'GRP1', removable: true },
      ];
    });

    it('should reset hasRetrieved to false', () => {
      component.onClearAll();
      expect(component.hasRetrieved).toBeFalse();
    });

    it('should clear masterCodes', () => {
      component.onClearAll();
      expect(component.masterCodes).toEqual([]);
    });





    it('should remove header actions', () => {
      component.onClearAll();
      expect(component.headerConfig.actions).toEqual([]);
    });
  });

  // ── Side Panel ───────────────────────────────────────────────────────────────

  describe('Side Panel', () => {
    const mockRow: EquipmentMasterCode = {
      codeType: 'EQ',
      code: 'A01',
      description: 'Centrifuge',
      effectiveDate: '01-JAN-2024',
      terminationDate: null,
      userGroup: 'GRP1',
      modifiedBy: 'jdoe',
      modificationDate: '01-JUN-24',
    };

    it('should open add panel with correct mode', () => {
      component.filterForm.get('masterCodeType')?.setValue('EQ');
      component.hasRetrieved = true;
      component.onAddNew();
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData?.codeType).toBe('EQ');
    });

    it('should open edit panel with row data', () => {
      component.onEdit(mockRow);
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData?.code).toBe('A01');
      expect(component.sidePanelData?.description).toBe('Centrifuge');
    });

    it('should set selectedRow when editing', () => {
      component.onEdit(mockRow);
      expect(component.selectedRow).toBe(mockRow);
    });

    it('should close side panel and clear selectedRow', () => {
      component.onEdit(mockRow);
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.selectedRow).toBeNull();
    });


  });

  // ── isRowHighlighted ────────────────────────────────────────────────────────

  describe('isRowHighlighted', () => {
    const row: EquipmentMasterCode = {
      codeType: 'EQ', code: 'A01', description: 'Test',
      effectiveDate: null, terminationDate: null,
      userGroup: null, modifiedBy: null, modificationDate: null,
    };

    it('should return true when selectedRow matches row code', () => {
      component.selectedRow = row;
      expect(component.isRowHighlighted(row)).toBeTrue();
    });

    it('should return false when no row is selected', () => {
      component.selectedRow = null;
      expect(component.isRowHighlighted(row)).toBeFalse();
    });

    it('should return false when different row is selected', () => {
      component.selectedRow = { ...row, code: 'B99' };
      expect(component.isRowHighlighted(row)).toBeFalse();
    });
  });

  // ── onDescriptionHover ──────────────────────────────────────────────────────

  describe('onDescriptionHover', () => {
    it('should disable tooltip when text is not truncated', () => {
      const el = document.createElement('span');
      Object.defineProperty(el, 'scrollWidth', { value: 80 });
      Object.defineProperty(el, 'clientWidth', { value: 100 });
      const event = { target: el } as unknown as MouseEvent;
      component.onDescriptionHover(event, 'A01');
      expect(component.descriptionTooltipDisabled.get('A01')).toBeTrue();
    });

    it('should not disable tooltip when text is truncated', () => {
      const el = document.createElement('span');
      Object.defineProperty(el, 'scrollWidth', { value: 200 });
      Object.defineProperty(el, 'clientWidth', { value: 100 });
      const event = { target: el } as unknown as MouseEvent;
      component.onDescriptionHover(event, 'A01');
      expect(component.descriptionTooltipDisabled.get('A01')).toBeFalse();
    });
  });

  // ── Cleanup ─────────────────────────────────────────────────────────────────
});
