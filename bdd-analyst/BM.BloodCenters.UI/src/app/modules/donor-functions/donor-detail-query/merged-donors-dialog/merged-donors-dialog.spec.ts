import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { MergedDonorsDialog } from './merged-donors-dialog';
import { DonorDetailQueryService } from '../services/donor-detail-query.service';
import {
  MergedDonor,
  MergeHoldUnit,
  MergedDonorInterdiction,
  PotentialDuplicate,
} from '../models/donor-detail-query.model';

describe('MergedDonorsDialog', () => {
  let component: MergedDonorsDialog;
  let fixture: ComponentFixture<MergedDonorsDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<MergedDonorsDialog>>;
  let mockService: jasmine.SpyObj<DonorDetailQueryService>;

  const mockMergedDonors: MergedDonor[] = [
    {
      secondaryDonorId: 'D100',
      gender: 'M',
      dateOfBirth: '1990-05-15',
      lastName: 'Smith',
      firstName: 'John',
      middleName: 'A',
    },
    {
      secondaryDonorId: 'D200',
      gender: 'F',
      dateOfBirth: '1985-11-22',
      lastName: 'Jones',
      firstName: 'Jane',
      middleName: 'B',
    },
  ];

  const mockHoldUnits: MergeHoldUnit[] = [
    { unitId: 'U001', collDate: '2025-03-10', donorId: '12345' },
    { unitId: 'U002', collDate: '2025-04-20', donorId: '12345' },
  ];

  const mockInterdictions: MergedDonorInterdiction[] = [
    {
      donorId: 'D100',
      interType: 'HOLD',
      interCode: 'DRDEF',
      unitId: 'U001',
      effDate: '2025-01-15',
      termDate: '',
    },
    {
      donorId: 'D200',
      interType: 'INTER',
      interCode: 'MEDHX',
      unitId: 'U002',
      effDate: '2025-02-10',
      termDate: '2025-06-10',
    },
  ];

  const mockDuplicates: PotentialDuplicate[] = [
    {
      setId: 'S1',
      donorId: 'D300',
      mergeFlag: 'Y',
      resolveUser: 'admin',
      resolveDate: '2025-05-01',
      demographicsUser: 'system',
      demographicsCheck: 'Y',
      demographicsDate: '2025-04-30',
    },
    {
      setId: 'S2',
      donorId: 'D400',
      mergeFlag: 'N',
      resolveUser: '',
      resolveDate: '',
      demographicsUser: '',
      demographicsCheck: 'N',
      demographicsDate: '',
    },
  ];

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('DonorDetailQueryService', [
      'getMergedDonors',
      'getMergeHoldUnits',
      'getMergedInterdictions',
      'getPotentialDuplicates',
      'formatDate',
    ]);
    mockService.getMergedDonors.and.returnValue(of(mockMergedDonors));
    mockService.getMergeHoldUnits.and.returnValue(of(mockHoldUnits));
    mockService.getMergedInterdictions.and.returnValue(of(mockInterdictions));
    mockService.getPotentialDuplicates.and.returnValue(of(mockDuplicates));
    mockService.formatDate.and.callFake((d: string) => d || '-');

    const mockTranslate = jasmine.createSpyObj('TranslateService', ['instant', 'get']);
    mockTranslate.instant.and.returnValue('');
    mockTranslate.get.and.returnValue(of(''));

    await TestBed.configureTestingModule({
      imports: [MergedDonorsDialog],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: '12345', donorName: 'Smith, John' } },
        { provide: DonorDetailQueryService, useValue: mockService },
        { provide: TranslateService, useValue: mockTranslate },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MergedDonorsDialog);
    component = fixture.componentInstance;
  });

  describe('Component creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have dialog data with donorId', () => {
      expect(component.data.donorId).toBe('12345');
    });

    it('should have dialog data with donorName', () => {
      expect(component.data.donorName).toBe('Smith, John');
    });

    it('should initialize with default signal values before ngOnInit', () => {
      expect(component.mergedDonors()).toEqual([]);
      expect(component.holdUnits()).toEqual([]);
      expect(component.mergedInterdictions()).toEqual([]);
      expect(component.duplicates()).toEqual([]);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });
  });

  describe('loadData - success', () => {
    it('should call all four service methods on init', () => {
      // Act
      fixture.detectChanges(); // triggers ngOnInit

      // Assert
      expect(mockService.getMergedDonors).toHaveBeenCalledWith('12345');
      expect(mockService.getMergeHoldUnits).toHaveBeenCalledWith('12345');
      expect(mockService.getMergedInterdictions).toHaveBeenCalledWith('12345');
      expect(mockService.getPotentialDuplicates).toHaveBeenCalledWith('12345');
    });

    it('should populate all four signals on success', () => {
      // Act
      fixture.detectChanges();

      // Assert
      expect(component.mergedDonors()).toEqual(mockMergedDonors);
      expect(component.holdUnits()).toEqual(mockHoldUnits);
      expect(component.mergedInterdictions()).toEqual(mockInterdictions);
      expect(component.duplicates()).toEqual(mockDuplicates);
    });

    it('should set loading to false after data loads', () => {
      // Act
      fixture.detectChanges();

      // Assert
      expect(component.loading()).toBe(false);
    });

    it('should clear any previous error on loadData', () => {
      // Arrange - simulate a previous error state
      component.error.set('Previous error');
      fixture.detectChanges();

      // Act
      component.loadData();

      // Assert
      expect(component.error()).toBeNull();
    });

    it('should set loading to true while data is being fetched', () => {
      // We verify loading is set to true at the start of loadData.
      let loadingDuringCall = false;
      mockService.getMergedDonors.and.callFake(() => {
        loadingDuringCall = component.loading();
        return of(mockMergedDonors);
      });

      // Act
      component.loadData();

      // Assert
      expect(loadingDuringCall).toBe(true);
    });
  });

  describe('loadData - empty results', () => {
    beforeEach(() => {
      mockService.getMergedDonors.and.returnValue(of([]));
      mockService.getMergeHoldUnits.and.returnValue(of([]));
      mockService.getMergedInterdictions.and.returnValue(of([]));
      mockService.getPotentialDuplicates.and.returnValue(of([]));
    });

    it('should handle empty merged donors data', () => {
      // Act
      fixture.detectChanges();

      // Assert
      expect(component.mergedDonors()).toEqual([]);
      expect(component.hasMergedDonors()).toBe(false);
    });

    it('should handle empty hold units data', () => {
      // Act
      fixture.detectChanges();

      // Assert
      expect(component.holdUnits()).toEqual([]);
      expect(component.hasHoldUnits()).toBe(false);
    });

    it('should handle empty interdictions data', () => {
      // Act
      fixture.detectChanges();

      // Assert
      expect(component.mergedInterdictions()).toEqual([]);
      expect(component.hasMergedInterdictions()).toBe(false);
    });

    it('should handle empty duplicates data', () => {
      // Act
      fixture.detectChanges();

      // Assert
      expect(component.duplicates()).toEqual([]);
      expect(component.hasDuplicates()).toBe(false);
    });

    it('should set loading to false even with empty results', () => {
      // Act
      fixture.detectChanges();

      // Assert
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });
  });

  describe('loadData - error handling', () => {
    it('should set error message when getMergedDonors fails', () => {
      // Arrange
      mockService.getMergedDonors.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.error()).toBe('Failed to load merged information. Please try again.');
      expect(component.loading()).toBe(false);
    });

    it('should set error message when getMergeHoldUnits fails', () => {
      // Arrange
      mockService.getMergeHoldUnits.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.error()).toBe('Failed to load merged information. Please try again.');
      expect(component.loading()).toBe(false);
    });

    it('should set error message when getMergedInterdictions fails', () => {
      // Arrange
      mockService.getMergedInterdictions.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.error()).toBe('Failed to load merged information. Please try again.');
      expect(component.loading()).toBe(false);
    });

    it('should set error message when getPotentialDuplicates fails', () => {
      // Arrange
      mockService.getPotentialDuplicates.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.error()).toBe('Failed to load merged information. Please try again.');
      expect(component.loading()).toBe(false);
    });

    it('should set error message when all calls fail', () => {
      // Arrange
      mockService.getMergedDonors.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      mockService.getMergeHoldUnits.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      mockService.getMergedInterdictions.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      mockService.getPotentialDuplicates.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.error()).toBe('Failed to load merged information. Please try again.');
      expect(component.loading()).toBe(false);
    });

    it('should not populate signals on error', () => {
      // Arrange
      mockService.getMergedDonors.and.returnValue(
        throwError(() => new Error('fail'))
      );

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.mergedDonors()).toEqual([]);
      expect(component.holdUnits()).toEqual([]);
      expect(component.mergedInterdictions()).toEqual([]);
      expect(component.duplicates()).toEqual([]);
    });
  });

  describe('onClose', () => {
    it('should close the dialog', () => {
      // Act
      component.onClose();

      // Assert
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should close the dialog without arguments', () => {
      // Act
      component.onClose();

      // Assert
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('Computed signals', () => {
    it('hasMergedDonors should return true when mergedDonors has data', () => {
      // Act
      fixture.detectChanges();

      // Assert
      expect(component.hasMergedDonors()).toBe(true);
    });

    it('hasMergedDonors should return false when mergedDonors is empty', () => {
      // Arrange
      mockService.getMergedDonors.and.returnValue(of([]));

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.hasMergedDonors()).toBe(false);
    });

    it('hasHoldUnits should return true when holdUnits has data', () => {
      // Act
      fixture.detectChanges();

      // Assert
      expect(component.hasHoldUnits()).toBe(true);
    });

    it('hasHoldUnits should return false when holdUnits is empty', () => {
      // Arrange
      mockService.getMergeHoldUnits.and.returnValue(of([]));

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.hasHoldUnits()).toBe(false);
    });

    it('hasMergedInterdictions should return true when mergedInterdictions has data', () => {
      // Act
      fixture.detectChanges();

      // Assert
      expect(component.hasMergedInterdictions()).toBe(true);
    });

    it('hasMergedInterdictions should return false when mergedInterdictions is empty', () => {
      // Arrange
      mockService.getMergedInterdictions.and.returnValue(of([]));

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.hasMergedInterdictions()).toBe(false);
    });

    it('hasDuplicates should return true when duplicates has data', () => {
      // Act
      fixture.detectChanges();

      // Assert
      expect(component.hasDuplicates()).toBe(true);
    });

    it('hasDuplicates should return false when duplicates is empty', () => {
      // Arrange
      mockService.getPotentialDuplicates.and.returnValue(of([]));

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.hasDuplicates()).toBe(false);
    });

    it('hasMergedDonors should react to mergedDonors signal changes', () => {
      // Arrange
      fixture.detectChanges();
      expect(component.hasMergedDonors()).toBe(true);

      // Act
      component.mergedDonors.set([]);

      // Assert
      expect(component.hasMergedDonors()).toBe(false);
    });

    it('hasHoldUnits should react to holdUnits signal changes', () => {
      // Arrange
      fixture.detectChanges();
      expect(component.hasHoldUnits()).toBe(true);

      // Act
      component.holdUnits.set([]);

      // Assert
      expect(component.hasHoldUnits()).toBe(false);
    });

    it('hasMergedInterdictions should react to mergedInterdictions signal changes', () => {
      // Arrange
      fixture.detectChanges();
      expect(component.hasMergedInterdictions()).toBe(true);

      // Act
      component.mergedInterdictions.set([]);

      // Assert
      expect(component.hasMergedInterdictions()).toBe(false);
    });

    it('hasDuplicates should react to duplicates signal changes', () => {
      // Arrange
      fixture.detectChanges();
      expect(component.hasDuplicates()).toBe(true);

      // Act
      component.duplicates.set([]);

      // Assert
      expect(component.hasDuplicates()).toBe(false);
    });
  });

  describe('Retry (loadData called again)', () => {
    it('should call loadData again when retrying after error', () => {
      // Arrange - first call fails
      mockService.getMergedDonors.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();
      expect(component.error()).toBe('Failed to load merged information. Please try again.');

      // Arrange - second call succeeds
      mockService.getMergedDonors.and.returnValue(of(mockMergedDonors));
      mockService.getMergeHoldUnits.and.returnValue(of(mockHoldUnits));
      mockService.getMergedInterdictions.and.returnValue(of(mockInterdictions));
      mockService.getPotentialDuplicates.and.returnValue(of(mockDuplicates));

      // Act
      component.loadData();

      // Assert
      expect(component.error()).toBeNull();
      expect(component.mergedDonors()).toEqual(mockMergedDonors);
      expect(component.holdUnits()).toEqual(mockHoldUnits);
      expect(component.mergedInterdictions()).toEqual(mockInterdictions);
      expect(component.duplicates()).toEqual(mockDuplicates);
      expect(component.loading()).toBe(false);
    });

    it('should reset loading state on retry', () => {
      // Arrange - first call fails
      mockService.getMergedDonors.and.returnValue(
        throwError(() => new Error('fail'))
      );
      fixture.detectChanges();

      // Arrange - second call succeeds
      mockService.getMergedDonors.and.returnValue(of(mockMergedDonors));

      // Act
      component.loadData();

      // Assert
      expect(component.loading()).toBe(false);
    });

    it('should clear previous error before retrying', () => {
      // Arrange - first call fails
      mockService.getMergedDonors.and.returnValue(
        throwError(() => new Error('fail'))
      );
      fixture.detectChanges();
      expect(component.error()).not.toBeNull();

      // Arrange - track error state at start of retry
      let errorDuringRetry: string | null = 'not-checked';
      mockService.getMergedDonors.and.callFake(() => {
        errorDuringRetry = component.error();
        return of(mockMergedDonors);
      });

      // Act
      component.loadData();

      // Assert
      expect(errorDuringRetry).toBeNull();
    });

    it('should increment service call counts on retry', () => {
      // Arrange
      fixture.detectChanges(); // first call via ngOnInit
      const initialDonorsCount = mockService.getMergedDonors.calls.count();
      const initialHoldUnitsCount = mockService.getMergeHoldUnits.calls.count();
      const initialInterdictionsCount = mockService.getMergedInterdictions.calls.count();
      const initialDuplicatesCount = mockService.getPotentialDuplicates.calls.count();

      // Act
      component.loadData(); // retry

      // Assert
      expect(mockService.getMergedDonors.calls.count()).toBe(initialDonorsCount + 1);
      expect(mockService.getMergeHoldUnits.calls.count()).toBe(initialHoldUnitsCount + 1);
      expect(mockService.getMergedInterdictions.calls.count()).toBe(initialInterdictionsCount + 1);
      expect(mockService.getPotentialDuplicates.calls.count()).toBe(initialDuplicatesCount + 1);
    });
  });

  describe('Table configurations', () => {
    it('should have mergedDonorsConfig with correct columns', () => {
      const config = component.mergedDonorsConfig;
      expect(config.columns.length).toBe(6);
      expect(config.columns[0].key).toBe('secondaryDonorId');
      expect(config.columns[1].key).toBe('gender');
      expect(config.columns[2].key).toBe('dateOfBirth');
      expect(config.columns[3].key).toBe('lastName');
      expect(config.columns[4].key).toBe('firstName');
      expect(config.columns[5].key).toBe('middleName');
    });

    it('should have holdUnitsConfig with correct columns', () => {
      const config = component.holdUnitsConfig;
      expect(config.columns.length).toBe(3);
      expect(config.columns[0].key).toBe('unitId');
      expect(config.columns[1].key).toBe('collDate');
      expect(config.columns[2].key).toBe('donorId');
    });

    it('should have interdictionsConfig with correct columns', () => {
      const config = component.interdictionsConfig;
      expect(config.columns.length).toBe(5);
      expect(config.columns[0].key).toBe('donorId');
      expect(config.columns[1].key).toBe('interCode');
      expect(config.columns[2].key).toBe('unitId');
      expect(config.columns[3].key).toBe('effDate');
      expect(config.columns[4].key).toBe('termDate');
    });

    it('should have duplicatesConfig with correct columns', () => {
      const config = component.duplicatesConfig;
      expect(config.columns.length).toBe(5);
      expect(config.columns[0].key).toBe('setId');
      expect(config.columns[1].key).toBe('donorId');
      expect(config.columns[2].key).toBe('mergeFlag');
      expect(config.columns[3].key).toBe('resolveUser');
      expect(config.columns[4].key).toBe('resolveDate');
    });

    it('should have stickyHeader enabled for all configs', () => {
      expect(component.mergedDonorsConfig.stickyHeader).toBe(true);
      expect(component.holdUnitsConfig.stickyHeader).toBe(true);
      expect(component.interdictionsConfig.stickyHeader).toBe(true);
      expect(component.duplicatesConfig.stickyHeader).toBe(true);
    });

    it('should have showTableOnEmpty set to false for all configs', () => {
      expect(component.mergedDonorsConfig.showTableOnEmpty).toBe(false);
      expect(component.holdUnitsConfig.showTableOnEmpty).toBe(false);
      expect(component.interdictionsConfig.showTableOnEmpty).toBe(false);
      expect(component.duplicatesConfig.showTableOnEmpty).toBe(false);
    });

    it('dateOfBirth column valueFormatter should call formatDate', () => {
      const dobCol = component.mergedDonorsConfig.columns.find(c => c.key === 'dateOfBirth');
      expect(dobCol?.valueFormatter).toBeDefined();

      const result = dobCol!.valueFormatter!('1990-05-15');
      expect(mockService.formatDate).toHaveBeenCalledWith('1990-05-15');
      expect(result).toBe('1990-05-15');
    });

    it('collDate column valueFormatter should call formatDate', () => {
      const collDateCol = component.holdUnitsConfig.columns.find(c => c.key === 'collDate');
      expect(collDateCol?.valueFormatter).toBeDefined();

      const result = collDateCol!.valueFormatter!('2025-03-10');
      expect(mockService.formatDate).toHaveBeenCalledWith('2025-03-10');
      expect(result).toBe('2025-03-10');
    });

    it('effDate column valueFormatter should call formatDate', () => {
      const effDateCol = component.interdictionsConfig.columns.find(c => c.key === 'effDate');
      expect(effDateCol?.valueFormatter).toBeDefined();

      const result = effDateCol!.valueFormatter!('2025-01-15');
      expect(mockService.formatDate).toHaveBeenCalledWith('2025-01-15');
      expect(result).toBe('2025-01-15');
    });

    it('interdictions termDate column valueFormatter should return dash for empty string', () => {
      const termDateCol = component.interdictionsConfig.columns.find(c => c.key === 'termDate');
      expect(termDateCol?.valueFormatter).toBeDefined();

      const result = termDateCol!.valueFormatter!('');
      expect(result).toBe('-');
    });

    it('interdictions termDate column valueFormatter should call formatDate for non-empty value', () => {
      const termDateCol = component.interdictionsConfig.columns.find(c => c.key === 'termDate');
      expect(termDateCol?.valueFormatter).toBeDefined();

      mockService.formatDate.calls.reset();
      const result = termDateCol!.valueFormatter!('2025-06-10');
      expect(mockService.formatDate).toHaveBeenCalledWith('2025-06-10');
      expect(result).toBe('2025-06-10');
    });

    it('resolveDate column valueFormatter should return dash for empty string', () => {
      const resolveDateCol = component.duplicatesConfig.columns.find(c => c.key === 'resolveDate');
      expect(resolveDateCol?.valueFormatter).toBeDefined();

      const result = resolveDateCol!.valueFormatter!('');
      expect(result).toBe('-');
    });

    it('resolveDate column valueFormatter should call formatDate for non-empty value', () => {
      const resolveDateCol = component.duplicatesConfig.columns.find(c => c.key === 'resolveDate');
      expect(resolveDateCol?.valueFormatter).toBeDefined();

      mockService.formatDate.calls.reset();
      const result = resolveDateCol!.valueFormatter!('2025-05-01');
      expect(mockService.formatDate).toHaveBeenCalledWith('2025-05-01');
      expect(result).toBe('2025-05-01');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy subject on destroy', () => {
      // Arrange
      fixture.detectChanges();

      // Act & Assert - should not throw
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
