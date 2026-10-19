import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { CumulativeLogsDialog } from './cumulative-logs-dialog';
import { DonorDetailQueryService } from '../services/donor-detail-query.service';
import { CellLoss, InterdictionHold } from '../models/donor-detail-query.model';

describe('CumulativeLogsDialog', () => {
  let component: CumulativeLogsDialog;
  let fixture: ComponentFixture<CumulativeLogsDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<CumulativeLogsDialog>>;
  let mockService: jasmine.SpyObj<DonorDetailQueryService>;

  const mockCellLoss: CellLoss[] = [
    { cellType: 'RBC', daysBetween: 56, cumulativeLoss: 200 },
    { cellType: 'PLASM', daysBetween: 28, cumulativeLoss: 450 },
  ];

  const mockHolds: InterdictionHold[] = [
    {
      interType: 'HOLD',
      interCode: 'DRDEF',
      description: 'Deferred',
      originatedFrom: 'AUDIT',
      effDate: '2025-01-15',
      termDate: '',
      donorId: '12345',
      transactionId: 'T1',
      unitId: 'U1',
      reasonCode: 'R1',
    },
    {
      interType: 'HOLD',
      interCode: 'MEDHX',
      description: 'Medical History',
      originatedFrom: 'DONOR',
      effDate: '2025-02-10',
      termDate: '2025-06-10',
      donorId: '12345',
      transactionId: 'T2',
      unitId: 'U2',
      reasonCode: 'R2',
    },
  ];

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('DonorDetailQueryService', [
      'getCellLoss',
      'getInterdictionHolds',
      'formatDate',
    ]);
    mockService.getCellLoss.and.returnValue(of(mockCellLoss));
    mockService.getInterdictionHolds.and.returnValue(of(mockHolds));
    mockService.formatDate.and.callFake((d: string) => d || '-');

    const mockTranslate = jasmine.createSpyObj('TranslateService', ['instant', 'get']);
    mockTranslate.instant.and.returnValue('');
    mockTranslate.get.and.returnValue(of(''));

    await TestBed.configureTestingModule({
      imports: [CumulativeLogsDialog],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: '12345' } },
        { provide: DonorDetailQueryService, useValue: mockService },
        { provide: TranslateService, useValue: mockTranslate },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CumulativeLogsDialog);
    component = fixture.componentInstance;
  });

  describe('Component creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have dialog data with donorId', () => {
      expect(component.data.donorId).toBe('12345');
    });

    it('should initialize with default signal values before ngOnInit', () => {
      expect(component.cellLoss()).toEqual([]);
      expect(component.holds()).toEqual([]);
      expect(component.loading()).toBe(false);
      expect(component.holdsLoading()).toBe(false);
      expect(component.error()).toBeNull();
      expect(component.holdsFilter()).toBe('active');
    });
  });

  describe('loadData - success', () => {
    it('should call getCellLoss and getInterdictionHolds on init', () => {
      // Act
      fixture.detectChanges(); // triggers ngOnInit

      // Assert
      expect(mockService.getCellLoss).toHaveBeenCalledWith('12345');
      expect(mockService.getInterdictionHolds).toHaveBeenCalledWith('12345', 'active');
    });

    it('should populate cellLoss and holds signals on success', () => {
      // Act
      fixture.detectChanges();

      // Assert
      expect(component.cellLoss()).toEqual(mockCellLoss);
      expect(component.holds()).toEqual(mockHolds);
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
      // We need to verify loading is set to true at the start of loadData.
      // Since our mock returns synchronously, we verify the call was made.
      let loadingDuringCall = false;
      mockService.getCellLoss.and.callFake(() => {
        loadingDuringCall = component.loading();
        return of(mockCellLoss);
      });

      // Act
      component.loadData();

      // Assert
      expect(loadingDuringCall).toBe(true);
    });
  });

  describe('loadData - empty results', () => {
    beforeEach(() => {
      mockService.getCellLoss.and.returnValue(of([]));
      mockService.getInterdictionHolds.and.returnValue(of([]));
    });

    it('should handle empty cell loss data', () => {
      // Act
      fixture.detectChanges();

      // Assert
      expect(component.cellLoss()).toEqual([]);
      expect(component.hasCellLoss()).toBe(false);
    });

    it('should handle empty holds data', () => {
      // Act
      fixture.detectChanges();

      // Assert
      expect(component.holds()).toEqual([]);
      expect(component.hasHolds()).toBe(false);
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
    it('should set error message when getCellLoss fails', () => {
      // Arrange
      mockService.getCellLoss.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.error()).toBe('Failed to load data. Please try again.');
      expect(component.loading()).toBe(false);
    });

    it('should set error message when getInterdictionHolds fails', () => {
      // Arrange
      mockService.getInterdictionHolds.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.error()).toBe('Failed to load data. Please try again.');
      expect(component.loading()).toBe(false);
    });

    it('should set error message when both calls fail', () => {
      // Arrange
      mockService.getCellLoss.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      mockService.getInterdictionHolds.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.error()).toBe('Failed to load data. Please try again.');
      expect(component.loading()).toBe(false);
    });

    it('should not populate cellLoss or holds on error', () => {
      // Arrange
      mockService.getCellLoss.and.returnValue(
        throwError(() => new Error('fail'))
      );

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.cellLoss()).toEqual([]);
      expect(component.holds()).toEqual([]);
    });
  });

  describe('onHoldsFilterChange', () => {
    beforeEach(() => {
      fixture.detectChanges(); // load initial data
    });

    it('should update holdsFilter signal', () => {
      // Act
      component.onHoldsFilterChange('all');

      // Assert
      expect(component.holdsFilter()).toBe('all');
    });

    it('should set holdsLoading to true while fetching', () => {
      // Arrange
      let holdsLoadingDuringCall = false;
      mockService.getInterdictionHolds.and.callFake(() => {
        holdsLoadingDuringCall = component.holdsLoading();
        return of(mockHolds);
      });

      // Act
      component.onHoldsFilterChange('all');

      // Assert
      expect(holdsLoadingDuringCall).toBe(true);
    });

    it('should call getInterdictionHolds with new filter', () => {
      // Arrange
      mockService.getInterdictionHolds.calls.reset();

      // Act
      component.onHoldsFilterChange('all');

      // Assert
      expect(mockService.getInterdictionHolds).toHaveBeenCalledWith('12345', 'all');
    });

    it('should update holds data on success', () => {
      // Arrange
      const newHolds: InterdictionHold[] = [
        {
          interType: 'HOLD',
          interCode: 'NEW',
          description: 'New Hold',
          originatedFrom: 'SYSTEM',
          effDate: '2025-03-01',
          termDate: '2025-04-01',
          donorId: '12345',
          transactionId: 'T3',
          unitId: 'U3',
          reasonCode: 'R3',
        },
      ];
      mockService.getInterdictionHolds.and.returnValue(of(newHolds));

      // Act
      component.onHoldsFilterChange('all');

      // Assert
      expect(component.holds()).toEqual(newHolds);
      expect(component.holdsLoading()).toBe(false);
    });

    it('should set holdsLoading to false on success', () => {
      // Act
      component.onHoldsFilterChange('all');

      // Assert
      expect(component.holdsLoading()).toBe(false);
    });

    it('should switch back to active filter', () => {
      // Act
      component.onHoldsFilterChange('all');
      mockService.getInterdictionHolds.calls.reset();
      component.onHoldsFilterChange('active');

      // Assert
      expect(component.holdsFilter()).toBe('active');
      expect(mockService.getInterdictionHolds).toHaveBeenCalledWith('12345', 'active');
    });
  });

  describe('onHoldsFilterChange - error', () => {
    beforeEach(() => {
      fixture.detectChanges(); // load initial data
    });

    it('should set holdsLoading to false on error', () => {
      // Arrange
      mockService.getInterdictionHolds.and.returnValue(
        throwError(() => new Error('Filter error'))
      );

      // Act
      component.onHoldsFilterChange('all');

      // Assert
      expect(component.holdsLoading()).toBe(false);
    });

    it('should preserve existing holds data on filter error', () => {
      // Arrange - holds were populated during init
      const existingHolds = component.holds();
      mockService.getInterdictionHolds.and.returnValue(
        throwError(() => new Error('Filter error'))
      );

      // Act
      component.onHoldsFilterChange('all');

      // Assert
      expect(component.holds()).toEqual(existingHolds);
    });

    it('should not set the main error signal on filter error', () => {
      // Arrange
      mockService.getInterdictionHolds.and.returnValue(
        throwError(() => new Error('Filter error'))
      );

      // Act
      component.onHoldsFilterChange('all');

      // Assert
      expect(component.error()).toBeNull();
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

  describe('Computed signals: hasCellLoss and hasHolds', () => {
    it('hasCellLoss should return true when cellLoss has data', () => {
      // Act
      fixture.detectChanges();

      // Assert
      expect(component.hasCellLoss()).toBe(true);
    });

    it('hasCellLoss should return false when cellLoss is empty', () => {
      // Arrange
      mockService.getCellLoss.and.returnValue(of([]));

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.hasCellLoss()).toBe(false);
    });

    it('hasHolds should return true when holds has data', () => {
      // Act
      fixture.detectChanges();

      // Assert
      expect(component.hasHolds()).toBe(true);
    });

    it('hasHolds should return false when holds is empty', () => {
      // Arrange
      mockService.getInterdictionHolds.and.returnValue(of([]));

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.hasHolds()).toBe(false);
    });

    it('hasCellLoss should react to cellLoss signal changes', () => {
      // Arrange
      fixture.detectChanges();
      expect(component.hasCellLoss()).toBe(true);

      // Act
      component.cellLoss.set([]);

      // Assert
      expect(component.hasCellLoss()).toBe(false);
    });

    it('hasHolds should react to holds signal changes', () => {
      // Arrange
      fixture.detectChanges();
      expect(component.hasHolds()).toBe(true);

      // Act
      component.holds.set([]);

      // Assert
      expect(component.hasHolds()).toBe(false);
    });
  });

  describe('Retry (loadData called again)', () => {
    it('should call loadData again when retrying after error', () => {
      // Arrange - first call fails
      mockService.getCellLoss.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();
      expect(component.error()).toBe('Failed to load data. Please try again.');

      // Arrange - second call succeeds
      mockService.getCellLoss.and.returnValue(of(mockCellLoss));
      mockService.getInterdictionHolds.and.returnValue(of(mockHolds));

      // Act
      component.loadData();

      // Assert
      expect(component.error()).toBeNull();
      expect(component.cellLoss()).toEqual(mockCellLoss);
      expect(component.holds()).toEqual(mockHolds);
      expect(component.loading()).toBe(false);
    });

    it('should reset loading state on retry', () => {
      // Arrange - first call fails
      mockService.getCellLoss.and.returnValue(
        throwError(() => new Error('fail'))
      );
      fixture.detectChanges();

      // Arrange - second call succeeds
      mockService.getCellLoss.and.returnValue(of(mockCellLoss));

      // Act
      component.loadData();

      // Assert
      expect(component.loading()).toBe(false);
    });

    it('should clear previous error before retrying', () => {
      // Arrange - first call fails
      mockService.getCellLoss.and.returnValue(
        throwError(() => new Error('fail'))
      );
      fixture.detectChanges();
      expect(component.error()).not.toBeNull();

      // Arrange - track error state at start of retry
      let errorDuringRetry: string | null = 'not-checked';
      mockService.getCellLoss.and.callFake(() => {
        errorDuringRetry = component.error();
        return of(mockCellLoss);
      });

      // Act
      component.loadData();

      // Assert
      expect(errorDuringRetry).toBeNull();
    });

    it('should increment service call counts on retry', () => {
      // Arrange
      fixture.detectChanges(); // first call via ngOnInit
      const initialCellLossCallCount = mockService.getCellLoss.calls.count();
      const initialHoldsCallCount = mockService.getInterdictionHolds.calls.count();

      // Act
      component.loadData(); // retry

      // Assert
      expect(mockService.getCellLoss.calls.count()).toBe(initialCellLossCallCount + 1);
      expect(mockService.getInterdictionHolds.calls.count()).toBe(initialHoldsCallCount + 1);
    });
  });

  describe('Table configurations', () => {
    it('should have cellLossTableConfig with correct columns', () => {
      const config = component.cellLossTableConfig;
      expect(config.columns.length).toBe(3);
      expect(config.columns[0].key).toBe('cellType');
      expect(config.columns[1].key).toBe('daysBetween');
      expect(config.columns[2].key).toBe('cumulativeLoss');
    });

    it('should have holdsTableConfig with correct columns', () => {
      const config = component.holdsTableConfig;
      expect(config.columns.length).toBe(6);
      expect(config.columns[0].key).toBe('interType');
      expect(config.columns[1].key).toBe('interCode');
      expect(config.columns[2].key).toBe('description');
      expect(config.columns[3].key).toBe('originatedFrom');
      expect(config.columns[4].key).toBe('effDate');
      expect(config.columns[5].key).toBe('termDate');
    });

    it('should have stickyHeader enabled for cellLossTableConfig', () => {
      expect(component.cellLossTableConfig.stickyHeader).toBe(true);
    });

    it('should have stickyHeader enabled for holdsTableConfig', () => {
      expect(component.holdsTableConfig.stickyHeader).toBe(true);
    });

    it('effDate column valueFormatter should call formatDate', () => {
      const effDateCol = component.holdsTableConfig.columns.find(c => c.key === 'effDate');
      expect(effDateCol?.valueFormatter).toBeDefined();

      const result = effDateCol!.valueFormatter!('2025-01-15');
      expect(mockService.formatDate).toHaveBeenCalledWith('2025-01-15');
      expect(result).toBe('2025-01-15');
    });

    it('termDate column valueFormatter should return dash for empty string', () => {
      const termDateCol = component.holdsTableConfig.columns.find(c => c.key === 'termDate');
      expect(termDateCol?.valueFormatter).toBeDefined();

      const result = termDateCol!.valueFormatter!('');
      expect(result).toBe('-');
      expect(mockService.formatDate).not.toHaveBeenCalledWith('');
    });

    it('termDate column valueFormatter should call formatDate for non-empty value', () => {
      const termDateCol = component.holdsTableConfig.columns.find(c => c.key === 'termDate');
      expect(termDateCol?.valueFormatter).toBeDefined();

      const result = termDateCol!.valueFormatter!('2025-06-10');
      expect(mockService.formatDate).toHaveBeenCalledWith('2025-06-10');
      expect(result).toBe('2025-06-10');
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

  describe('loadData uses current holdsFilter', () => {
    it('should pass current holdsFilter value to getInterdictionHolds', () => {
      // Arrange - change filter before loading
      component.holdsFilter.set('all');
      mockService.getInterdictionHolds.calls.reset();

      // Act
      component.loadData();

      // Assert
      expect(mockService.getInterdictionHolds).toHaveBeenCalledWith('12345', 'all');
    });
  });
});
