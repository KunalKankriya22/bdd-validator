import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Overlay } from '@angular/cdk/overlay';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';

import { CommitReagentsForComponentComponent } from './commit-reagents-for-component';
import { CommitReagentsForComponentService } from './services/commit-reagents-for-component.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  CodeScheme,
  ProcessCodeDropdownDto,
  StageCodeDropdownDto,
  UnitInfoDto,
  UnitProductDto,
  ComponentInfoDto,
  KitDto,
  ReagentRowDto,
} from './models/commit-reagents-for-component.model';

const mockProcessCodes: ProcessCodeDropdownDto[] = [
  { code: 'FROZ', description: 'Freezing' },
  { code: 'WASH', description: 'Washing' },
];

const mockStageCodes: StageCodeDropdownDto[] = [
  { code: 'S1', description: 'Stage One' },
  { code: 'S2', description: 'Stage Two' },
];

const mockUnitInfo: UnitInfoDto = { collDate: '2025-01-15' };

const mockProducts: UnitProductDto[] = [
  { productCode: 'E0385V00', productDesc: 'Red Cells', componentPrefix: 'A' },
];

const mockComponentInfo: ComponentInfoDto = { aboRh: 'O Pos', expiryDate: '2026-12-31' };

const futureExpDate = moment().add(1, 'year').format('YYYY-MM-DD');

const mockReagents: ReagentRowDto[] = [
  { reagentName: 'Reagent A', manufacturer: 'Mfr A', lotNumber: 'LOT001', expDate: futureExpDate },
  { reagentName: 'Reagent B', manufacturer: 'Mfr B', lotNumber: 'LOT002', expDate: futureExpDate },
];

const mockKit: KitDto = { kitId: 'KIT123', reagents: mockReagents };

describe('CommitReagentsForComponentComponent', () => {
  let component: CommitReagentsForComponentComponent;
  let fixture: ComponentFixture<CommitReagentsForComponentComponent>;
  let serviceSpy: jasmine.SpyObj<CommitReagentsForComponentService>;
  let snackBarOpenSpy: jasmine.Spy;
  let headerServiceStub: { chapterChanged$: Subject<void> };

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('CommitReagentsForComponentService', [
      'getProcessCodes',
      'getStageCodes',
      'getUnitInfo',
      'getUnitProducts',
      'getComponentInfo',
      'checkKit',
      'getLatestKit',
      'updateKit',
      'createKit',
      'getCodeScheme',
    ]);
    serviceSpy.getProcessCodes.and.returnValue(of(mockProcessCodes));
    serviceSpy.getStageCodes.and.returnValue(of(mockStageCodes));
    serviceSpy.getUnitInfo.and.returnValue(of(mockUnitInfo));
    serviceSpy.getUnitProducts.and.returnValue(of(mockProducts));
    serviceSpy.getComponentInfo.and.returnValue(of(mockComponentInfo));
    serviceSpy.checkKit.and.returnValue(of(mockKit));
    serviceSpy.getLatestKit.and.returnValue(of(null));
    serviceSpy.updateKit.and.returnValue(of(void 0));
    serviceSpy.createKit.and.returnValue(of({ kitId: 123 }));
    serviceSpy.getCodeScheme.and.returnValue(of('I' as CodeScheme));

    headerServiceStub = { chapterChanged$: new Subject<void>() };

    const pageHeaderServiceStub = {
      pageHeaderData: signal<{ title: string; subtitle?: string } | null>({ title: 'Commit Reagents', subtitle: 'Test subtitle' }),
    };

    const chapterTimezoneServiceStub = {
      getChapterLocalDate: () => moment(),
      isChapterLocalDateAvailable: () => true,
    };

    await TestBed.configureTestingModule({
      imports: [CommitReagentsForComponentComponent, NoopAnimationsModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: CommitReagentsForComponentService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceStub },
        { provide: PageHeaderService, useValue: pageHeaderServiceStub },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceStub },
        Overlay,
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CommitReagentsForComponentComponent);
    component = fixture.componentInstance;
    // Spy on the REAL MatSnackBar instance from the component's injector
    const snackBar = fixture.debugElement.injector.get(MatSnackBar);
    snackBarOpenSpy = spyOn(snackBar, 'open');
    fixture.detectChanges();
  });

  // ── Initialization ──────────────────────────────────────────────────────────

  describe('Initialization', () => {


    it('should initialize headerForm with empty values', () => {
      expect(component.headerForm.get('processCode')?.value).toBe('');
      expect(component.headerForm.get('stageCode')?.value).toBe('');
      expect(component.headerForm.get('productCode')?.value).toBe('');
    });

    it('should not have data initially', () => {
      expect(component.hasData).toBeFalse();
    });

    it('should not be in edit mode initially', () => {
      expect(component.isEditMode).toBeFalse();
    });

    it('should have minExpDate as a Moment representing the chapter local date', () => {
      const minDate = component.minExpDate;
      expect(moment.isMoment(minDate)).toBeTrue();
      expect(minDate.format('YYYY-MM-DD')).toBe(moment().format('YYYY-MM-DD'));
    });

    it('expDateFilter should allow a future Moment date', () => {
      expect(component.expDateFilter(moment().add(1, 'day'))).toBeTrue();
    });

    it('expDateFilter should reject a past Moment date', () => {
      expect(component.expDateFilter(moment().subtract(1, 'day'))).toBeFalse();
    });

    it('expDateFilter should allow null', () => {
      expect(component.expDateFilter(null)).toBeTrue();
    });

  });

  // ── Computed State ──────────────────────────────────────────────────────────

  describe('Computed State', () => {
    it('isStageDisabled should be true when no process code', () => {
      expect(component.isStageDisabled).toBeTrue();
    });

    it('isStageDisabled should be false when process code is selected', () => {
      component.headerForm.patchValue({ processCode: 'FROZ' });
      expect(component.isStageDisabled).toBeFalse();
    });

    it('isProductDisabled should be true when no collDate resolved', () => {
      expect(component.isProductDisabled).toBeTrue();
    });

    it('isRetrieveEnabled should be false when fields are missing', () => {
      expect(component.isRetrieveEnabled).toBeFalse();
    });

    it('isRetrieveEnabled should be true when all fields, collDate and componentPrefix are present', () => {
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      component.headerForm.patchValue({ processCode: 'FROZ', stageCode: 'S1', productCode: 'E0385V00' });
      component.collDate = '2025-01-15';
      component.componentPrefix = 'A';
      expect(component.isRetrieveEnabled).toBeTrue();
    });

    it('isRetrieveEnabled should be false while loading unit info', () => {
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      component.headerForm.patchValue({ processCode: 'FROZ', stageCode: 'S1', productCode: 'E0385V00' });
      component.collDate = '2025-01-15';
      component.componentPrefix = 'A';
      component.isLoadingUnitInfo = true;
      expect(component.isRetrieveEnabled).toBeFalse();
    });
  });

  // ── Code Scheme / showComponentPrefix ───────────────────────────────────────

  describe('Code Scheme', () => {
    it('should load code scheme on init and default to I', () => {
      expect(serviceSpy.getCodeScheme).toHaveBeenCalled();
      expect(component.codeScheme).toBe('I');
    });

    it('showComponentPrefix should be false for ISBT chapter even when componentPrefix is set', () => {
      component.codeScheme = 'I';
      component.componentPrefix = 'A';
      expect(component.showComponentPrefix).toBeFalse();
    });

    it('showComponentPrefix should be false for Codabar chapter when componentPrefix is null', () => {
      component.codeScheme = 'C';
      component.componentPrefix = null;
      expect(component.showComponentPrefix).toBeFalse();
    });

    it('showComponentPrefix should be true for Codabar chapter when componentPrefix is set', () => {
      component.codeScheme = 'C';
      component.componentPrefix = 'A';
      expect(component.showComponentPrefix).toBeTrue();
    });

    it('should reload code scheme on chapter change', fakeAsync(() => {
      serviceSpy.getCodeScheme.calls.reset();
      headerServiceStub.chapterChanged$.next();
      tick();
      expect(serviceSpy.getCodeScheme).toHaveBeenCalled();
    }));

    it('should reset codeScheme to I on resetAll', () => {
      component.codeScheme = 'C';
      component.resetAll();
      expect(component.codeScheme).toBe('I');
    });
  });

  // ── Process Code Change ─────────────────────────────────────────────────────

  describe('onProcessCodeChange', () => {
    it('should load stage codes when process code is selected', fakeAsync(() => {
      component.headerForm.patchValue({ processCode: 'FROZ' });
      component.onProcessCodeChange();
      tick();

      expect(serviceSpy.getStageCodes).toHaveBeenCalledWith('FROZ');
      expect(component.stageCodes.length).toBe(2);
    }));

    it('should clear stage codes when process code is cleared', fakeAsync(() => {
      component.stageCodes = mockStageCodes;
      component.headerForm.patchValue({ processCode: '' });
      component.onProcessCodeChange();
      tick();

      expect(component.stageCodes.length).toBe(0);
    }));

  });

  // ── Unit ID Post Validate ──────────────────────────────────────────────────

  describe('onUnitPostValidate', () => {
    it('should call getUnitInfo with parsedUnitId and resolve collDate', fakeAsync(() => {
      const mockEvent = {
        data: { parsedUnitId: 'U001' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.headerForm.patchValue({ processCode: 'FROZ' });
      component.onUnitPostValidate(mockEvent as any);
      tick();

      expect(serviceSpy.getUnitInfo).toHaveBeenCalledWith('U001');
      expect(component.collDate).toBe('2025-01-15');
      expect(mockEvent.confirm).toHaveBeenCalled();
    }));

    it('should call event.reject when collDate is missing in response', fakeAsync(() => {
      serviceSpy.getUnitInfo.and.returnValue(of(null));
      const mockEvent = {
        data: { parsedUnitId: 'BAD' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(mockEvent as any);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('Unit ID not found');
      expect(component.collDate).toBeNull();
    }));

    it('should call event.reject on API error', fakeAsync(() => {
      serviceSpy.getUnitInfo.and.returnValue(throwError(() => new Error('Network error')));
      const mockEvent = {
        data: { parsedUnitId: 'ERR' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(mockEvent as any);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('Unit ID not found');
    }));


    it('onUnitCleared should clear collDate and componentPrefix', () => {
      component.collDate = '2025-01-15';
      component.componentPrefix = 'A';
      component.onUnitCleared();

      expect(component.collDate).toBeNull();
      expect(component.componentPrefix).toBeNull();
    });

  });

  // ── Product Code Change ─────────────────────────────────────────────────────

  describe('onProductCodeChange', () => {
    beforeEach(fakeAsync(() => {
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('U001');
      component.headerForm.patchValue({ processCode: 'FROZ', stageCode: 'S1' });
      component.unitProducts = mockProducts;
      component.collDate = '2025-01-15';
      component.headerForm.patchValue({ productCode: 'E0385V00' });
    }));

    it('should load component info on product selection', fakeAsync(() => {
      component.onProductCodeChange();
      tick();

      expect(serviceSpy.getComponentInfo).toHaveBeenCalled();
      expect(component.aboRh).toBe('O Pos');
      expect(component.expiryDate).toBe('31-DEC-2026 00:00');
    }));

    it('should set componentPrefix from selected product', fakeAsync(() => {
      component.onProductCodeChange();
      tick();

      expect(component.componentPrefix).toBe('A');
    }));
  });

  // ── Retrieve ────────────────────────────────────────────────────────────────

  describe('onRetrieve', () => {
    beforeEach(() => {
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('U001');
      component.headerForm.patchValue({ processCode: 'FROZ', stageCode: 'S1', productCode: 'E0385V00' });
      component.collDate = '2025-01-15';
      component.componentPrefix = 'A';
    });

    it('should call checkKit with correct params', fakeAsync(() => {
      component.onRetrieve();
      tick();

      expect(serviceSpy.checkKit).toHaveBeenCalledWith('U001', '2025-01-15', 'E0385V00', 'A', 'FROZ', 'S1');
    }));

    it('should set view mode and hasData when kit exists', fakeAsync(() => {
      component.onRetrieve();
      tick();

      expect(component.hasData).toBeTrue();
      expect(component.isEditMode).toBeFalse();
      expect(component.kitId).toBe('KIT123');
      expect(component.saveMode).toBe('EDIT');
      expect(component.viewReagents.length).toBe(2);
    }));

    it('should go to INSERT mode when no kit exists', fakeAsync(() => {
      serviceSpy.checkKit.and.returnValue(of(null));
      serviceSpy.getLatestKit.and.returnValue(of(null));
      component.onRetrieve();
      tick();

      expect(component.saveMode).toBe('INSERT');
      expect(component.isEditMode).toBeTrue();
    }));



    it('should show blank edit form without calling getLatestKit when component is expired and in INSERT mode', () => {
      // Setup: simulate expired component
      component.isComponentExpired = true;
      component.saveMode = 'INSERT';
      component.hasData = false;

      // Act: call loadLatestKitTemplate via onRetrieve flow (or invoke private method via any)
      (component as any).loadLatestKitTemplate('PROC', 'STAG');

      // Assert: blank row shown, no API call made
      expect(serviceSpy.getLatestKit).not.toHaveBeenCalled();
      expect(component.hasData).toBeTrue();
      expect(component.isEditMode).toBeTrue();
      expect(component.rowsArray.length).toBe(1);
    });
  });

  // ── Edit Mode ───────────────────────────────────────────────────────────────

  describe('Edit Mode', () => {
    beforeEach(fakeAsync(() => {
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('U001');
      component.headerForm.patchValue({ processCode: 'FROZ', stageCode: 'S1', productCode: 'E0385V00' });
      component.collDate = '2025-01-15';
      component.componentPrefix = 'A';
      component.onRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should enter edit mode when ADD/EDIT REAGENT is clicked', () => {
      component.onAddEditReagent();
      expect(component.isEditMode).toBeTrue();
    });


    it('should add an empty row on ADD NEW REAGENT and mark dirty', () => {
      component.onAddEditReagent();
      const before = component.rowsArray.length;
      component.onAddNewReagent();
      expect(component.rowsArray.length).toBe(before + 1);
      expect(component.editForm.dirty).toBeTrue();
    });

    it('should delete a row on DELETE and mark dirty', () => {
      component.onAddEditReagent();
      const before = component.rowsArray.length;
      component.onDeleteRow(0);
      expect(component.rowsArray.length).toBe(before - 1);
      expect(component.editForm.dirty).toBeTrue();
    });

    it('should exit edit mode on CANCEL', () => {
      component.onAddEditReagent();
      component.onCancel();
      expect(component.isEditMode).toBeFalse();
    });


    it('should keep hasData true after cancel when view reagents exist', () => {
      component.onAddEditReagent();
      component.onCancel();
      expect(component.hasData).toBeTrue();
    });
  });

  // ── isSaveDisabled ──────────────────────────────────────────────────────────

  describe('isSaveDisabled', () => {
    beforeEach(fakeAsync(() => {
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('U001');
      component.headerForm.patchValue({ processCode: 'FROZ', stageCode: 'S1', productCode: 'E0385V00' });
      component.collDate = '2025-01-15';
      component.componentPrefix = 'A';
      component.onRetrieve();
      tick();
      component.onAddEditReagent();
    }));

    it('should be true in EDIT mode when form is pristine', () => {
      expect(component.saveMode).toBe('EDIT');
      expect(component.editForm.pristine).toBeTrue();
      expect(component.isSaveDisabled).toBeTrue();
    });

    it('should be false in EDIT mode after making a change', () => {
      component.onAddNewReagent();
      expect(component.isSaveDisabled).toBeFalse();
    });

    it('should be true when no rows exist', () => {
      component.rowsArray.clear();
      component.editForm.markAsDirty();
      expect(component.isSaveDisabled).toBeTrue();
    });

    it('should be true while saving', () => {
      component.editForm.markAsDirty();
      component.isSaving = true;
      expect(component.isSaveDisabled).toBeTrue();
    });
  });

  // ── Save — UPDATE ───────────────────────────────────────────────────────────

  describe('onSave (UPDATE existing kit)', () => {
    beforeEach(fakeAsync(() => {
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('U001');
      component.headerForm.patchValue({ processCode: 'FROZ', stageCode: 'S1', productCode: 'E0385V00' });
      component.collDate = '2025-01-15';
      component.componentPrefix = 'A';
      component.onRetrieve();
      tick();
      component.onAddEditReagent();
      component.editForm.markAsDirty();
    }));

    it('should call updateKit with correct payload', fakeAsync(() => {
      component.onSave();
      tick();

      expect(serviceSpy.updateKit).toHaveBeenCalledWith(
        'KIT123',
        jasmine.objectContaining({ reagents: jasmine.any(Array) })
      );
    }));


    it('should exit edit mode after successful save', fakeAsync(() => {
      component.onSave();
      tick();

      expect(component.isEditMode).toBeFalse();
    }));

    it('should keep hasData and criteria after save', fakeAsync(() => {
      component.onSave();
      tick();

      expect(component.hasData).toBeTrue();
      expect(component.headerForm.get('processCode')?.value).toBe('FROZ');
    }));


  });

  // ── Save — INSERT ───────────────────────────────────────────────────────────

  describe('onSave (INSERT new kit)', () => {
    beforeEach(fakeAsync(() => {
      serviceSpy.checkKit.and.returnValue(of(null));
      serviceSpy.getLatestKit.and.returnValue(of(null));
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('U001');
      component.headerForm.patchValue({ processCode: 'FROZ', stageCode: 'S1', productCode: 'E0385V00' });
      component.collDate = '2025-01-15';
      component.componentPrefix = 'A';
      component.onRetrieve();
      tick();
      component.editForm.markAsDirty();
    }));


    it('should switch saveMode to EDIT after successful create', fakeAsync(() => {
      component.rowsArray.at(0).patchValue({
        reagentName: 'R1', manufacturer: 'M1', lotNumber: 'L1', expDate: futureExpDate,
      });
      component.onSave();
      tick();

      expect(component.saveMode).toBe('EDIT');
    }));

    it('should capture kitId as string from createKit response and not call checkKit', fakeAsync(() => {
      component.rowsArray.at(0).patchValue({
        reagentName: 'R1', manufacturer: 'M1', lotNumber: 'L1', expDate: futureExpDate,
      });
      serviceSpy.checkKit.calls.reset();
      component.onSave();
      tick();

      expect(serviceSpy.checkKit).not.toHaveBeenCalled();
      expect(component.kitId).toBe('123');
      expect(component.saveMode).toBe('EDIT');
    }));

  });

  // ── Search ──────────────────────────────────────────────────────────────────

  describe('Search', () => {
    beforeEach(fakeAsync(() => {
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('U001');
      component.headerForm.patchValue({ processCode: 'FROZ', stageCode: 'S1', productCode: 'E0385V00' });
      component.collDate = '2025-01-15';
      component.componentPrefix = 'A';
      component.onRetrieve();
      tick();
      fixture.detectChanges();
    }));



    it('should show all reagents when search is cleared', () => {
      component.onSearch('Reagent A');
      component.onSearch('');
      expect(component.filteredReagents.length).toBe(2);
    });

  });

  // ── Filter Chips ─────────────────────────────────────────────────────────────

  describe('Filter Chips', () => {
    it('should return empty array when no filters applied', () => {
      expect(component.filterChips.length).toBe(0);
    });



  });

  // ── Apply Filter (date logic) ────────────────────────────────────────────────

  describe('applyFilter date logic', () => {
    beforeEach(fakeAsync(() => {
      spyOnProperty(component.unitIdField, 'isValid', 'get').and.returnValue(true);
      spyOnProperty(component.unitIdField, 'parsedUnitId', 'get').and.returnValue('U001');
      component.headerForm.patchValue({ processCode: 'FROZ', stageCode: 'S1', productCode: 'E0385V00' });
      component.collDate = '2025-01-15';
      component.componentPrefix = 'A';
      component.onRetrieve();
      tick();
    }));

    it('should filter reagents expiring after a date', () => {
      const past = moment().subtract(1, 'month').toISOString();
      component.appliedFilters = { period: 'after', expirationDate: past };
      component.applyFilter();
      expect(component.filteredReagents.length).toBe(2);
    });

    it('should filter reagents expiring before a date', () => {
      const past = moment().subtract(1, 'month').toISOString();
      component.appliedFilters = { period: 'before', expirationDate: past };
      component.applyFilter();
      expect(component.filteredReagents.length).toBe(0);
    });

    it('should show all reagents when no date filter applied', () => {
      component.appliedFilters = null;
      component.applyFilter();
      expect(component.filteredReagents.length).toBe(2);
    });
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  describe('Helpers', () => {
    it('getProcessDescription should return description for selected code', () => {
      component.headerForm.patchValue({ processCode: 'FROZ' });
      expect(component.getProcessDescription()).toBe('Freezing');
    });

    it('getProcessDescription should return dash when nothing selected', () => {
      expect(component.getProcessDescription()).toBe('-');
    });

    it('getStageDescription should return description for selected stage', () => {
      component.stageCodes = mockStageCodes;
      component.headerForm.patchValue({ stageCode: 'S1' });
      expect(component.getStageDescription()).toBe('Stage One');
    });

    it('getProductLabel should return code and desc', () => {
      const label = component.getProductLabel(mockProducts[0]);
      expect(label).toBe('E0385V00 - Red Cells');
    });

    it('getProductLabel should return code only when no desc', () => {
      const p: UnitProductDto = { productCode: 'X01', productDesc: '', componentPrefix: 'A' };
      expect(component.getProductLabel(p)).toBe('X01');
    });
  });

  // ── Chapter Change ───────────────────────────────────────────────────────────

  describe('Chapter Change', () => {

    it('should clear all data on chapter change', fakeAsync(() => {
      component.hasData = true;
      headerServiceStub.chapterChanged$.next();
      tick();

      expect(component.hasData).toBeFalse();
    }));
  });

  // ── Reset All ────────────────────────────────────────────────────────────────

  describe('resetAll', () => {
    it('should reset criteria form and clear all state', fakeAsync(() => {
      component.headerForm.patchValue({ processCode: 'FROZ', stageCode: 'S1' });
      component.collDate = '2025-01-15';
      component.hasData = true;

      component.resetAll();

      expect(component.headerForm.get('processCode')?.value).toBeNull();
      expect(component.collDate).toBeNull();
      expect(component.hasData).toBeFalse();
    }));
  });
});
