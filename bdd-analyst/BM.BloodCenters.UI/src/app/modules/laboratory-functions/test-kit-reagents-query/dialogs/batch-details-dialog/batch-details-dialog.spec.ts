import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { BatchDetailsDialogComponent, BatchDetailsDialogData } from './batch-details-dialog';
import { TestKitReagentsQueryApiService } from '../../services/test-kit-reagents-query-api.service';
import { BatchDetailDto } from '../../models/test-kit-reagents-query.model';

describe('BatchDetailsDialogComponent', () => {
  let component: BatchDetailsDialogComponent;
  let fixture: ComponentFixture<BatchDetailsDialogComponent>;
  let apiSpy: jasmine.SpyObj<TestKitReagentsQueryApiService>;

  const mockDialogData: BatchDetailsDialogData = {
    testKitId: 'TK001',
  };

  const mockBatches: BatchDetailDto[] = [
    { tbId: 'B001', firstUnitId: 'U001', firstChkDigit: '1', lastUnitId: 'U050', lastChkDigit: '5' },
    { tbId: 'B002', firstUnitId: 'U051', firstChkDigit: null, lastUnitId: 'U100', lastChkDigit: null },
  ];

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('TestKitReagentsQueryApiService', ['getBatchDetails']);
    apiSpy.getBatchDetails.and.returnValue(of(mockBatches));

    TestBed.configureTestingModule({
      imports: [BatchDetailsDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TestKitReagentsQueryApiService, useValue: apiSpy },
      ],
    });

    fixture = TestBed.createComponent(BatchDetailsDialogComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  // -----------------------------------------------------------------------
  // Component creation
  // -----------------------------------------------------------------------

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // ngOnChanges
  // -----------------------------------------------------------------------

  describe('ngOnChanges', () => {
    it('should load data when isOpen is true and row is set', () => {
      component.row = mockDialogData;
      component.isOpen = true;
      component.ngOnChanges({} as any);

      expect(apiSpy.getBatchDetails).toHaveBeenCalledWith('TK001');
      expect(component['dataSource']()).toEqual(mockBatches);
      expect(component['loading']()).toBe(false);
    });

    it('should not load data when panel is closed', () => {
      component.row = mockDialogData;
      component.isOpen = false;
      component.ngOnChanges({} as any);

      expect(apiSpy.getBatchDetails).not.toHaveBeenCalled();
    });

    it('should not load data when row is null', () => {
      component.row = null;
      component.isOpen = true;
      component.ngOnChanges({} as any);

      expect(apiSpy.getBatchDetails).not.toHaveBeenCalled();
    });

    it('should set testKitId from row', () => {
      component.row = mockDialogData;
      component.isOpen = true;
      component.ngOnChanges({} as any);

      expect(component['testKitId']).toBe('TK001');
    });

    it('should initialize table config when opened', () => {
      component.row = mockDialogData;
      component.isOpen = true;
      component.ngOnChanges({} as any);

      expect(component['tableConfig'].columns.length).toBe(3);
      expect(component['tableConfig'].stickyHeader).toBe(true);
      expect(component['tableConfig'].showPagination).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // loadBatches - success
  // -----------------------------------------------------------------------

  describe('loadBatches - success', () => {
    beforeEach(() => {
      component.row = mockDialogData;
      component.isOpen = true;
    });

    it('should populate dataSource and set testKitId', () => {
      component.ngOnChanges({} as any);

      expect(component['dataSource']()).toEqual(mockBatches);
      expect(component['testKitId']).toBe('TK001');
      expect(component['loading']()).toBe(false);
    });

    it('should clear previous error on success', () => {
      component['error'].set('old error');
      component.ngOnChanges({} as any);

      expect(component['error']()).toBeNull();
    });

    it('should handle empty batch list', () => {
      apiSpy.getBatchDetails.and.returnValue(of([]));
      component.ngOnChanges({} as any);

      expect(component['dataSource']()).toEqual([]);
      expect(component['loading']()).toBe(false);
      expect(component['error']()).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // loadBatches - error
  // -----------------------------------------------------------------------

  describe('loadBatches - error', () => {
    beforeEach(() => {
      component.row = mockDialogData;
      component.isOpen = true;
    });

    it('should set error from nested errorResponse', () => {
      apiSpy.getBatchDetails.and.returnValue(
        throwError(() => ({
          error: { errorResponse: { error: 'Test kit not found' } },
        }))
      );
      component.ngOnChanges({} as any);

      expect(component['error']()).toBe('Test kit not found');
      expect(component['loading']()).toBe(false);
    });

    it('should use fallback error message when no nested error', () => {
      apiSpy.getBatchDetails.and.returnValue(
        throwError(() => new Error('Network failure'))
      );
      component.ngOnChanges({} as any);

      expect(component['error']()).toBe('Failed to load batch details');
      expect(component['loading']()).toBe(false);
    });

    it('should use fallback when error is null', () => {
      apiSpy.getBatchDetails.and.returnValue(throwError(() => null));
      component.ngOnChanges({} as any);

      expect(component['error']()).toBe('Failed to load batch details');
    });

    it('should not populate dataSource on error', () => {
      apiSpy.getBatchDetails.and.returnValue(
        throwError(() => new Error('fail'))
      );
      component.ngOnChanges({} as any);

      expect(component['dataSource']()).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // close
  // -----------------------------------------------------------------------

  describe('close', () => {
    it('should emit closePanel event', () => {
      spyOn(component.closePanel, 'emit');
      (component as any).close();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // formatUnitIdWithCheckDigit
  // -----------------------------------------------------------------------

  describe('formatUnitIdWithCheckDigit', () => {
    it('should combine unitId with check digit', () => {
      const result = (component as any).formatUnitIdWithCheckDigit('U001', '1');
      expect(result).toBe('U001-1');
    });

    it('should return unitId alone when check digit is null', () => {
      const result = (component as any).formatUnitIdWithCheckDigit('U001', null);
      expect(result).toBe('U001');
    });

    it('should return unitId alone when check digit is undefined', () => {
      const result = (component as any).formatUnitIdWithCheckDigit('U001', undefined);
      expect(result).toBe('U001');
    });

    it('should return empty string when unitId is null', () => {
      const result = (component as any).formatUnitIdWithCheckDigit(null, '1');
      expect(result).toBe('');
    });

    it('should return empty string when unitId is undefined', () => {
      const result = (component as any).formatUnitIdWithCheckDigit(undefined, '1');
      expect(result).toBe('');
    });
  });

  // -----------------------------------------------------------------------
  // Table config
  // -----------------------------------------------------------------------

  describe('table config', () => {
    beforeEach(() => {
      component.row = mockDialogData;
      component.isOpen = true;
      component.ngOnChanges({} as any);
    });

    it('should have 3 columns', () => {
      expect(component['tableConfig'].columns.length).toBe(3);
    });

    it('should configure tbId column', () => {
      const col = component['tableConfig'].columns[0];
      expect(col.key).toBe('tbId');
      expect(col.header).toBe('Batch ID');
      expect(col.sortable).toBe(false);
      expect(col.width).toBe('200px');
    });

    it('should configure firstUnitId column', () => {
      const col = component['tableConfig'].columns[1];
      expect(col.key).toBe('firstUnitId');
      expect(col.header).toBe('First Unit ID');
      expect(col.sortable).toBe(false);
      expect(col.width).toBe('250px');
    });

    it('should configure lastUnitId column', () => {
      const col = component['tableConfig'].columns[2];
      expect(col.key).toBe('lastUnitId');
      expect(col.header).toBe('Last Unit ID');
      expect(col.sortable).toBe(false);
      expect(col.width).toBe('250px');
    });

    it('should set emptyMessage', () => {
      expect(component['tableConfig'].emptyMessage).toBe('No batches found for this test kit.');
    });

    it('should set loadingMessage', () => {
      expect(component['tableConfig'].loadingMessage).toBe('Loading batch details...');
    });

    it('should have empty rowActions', () => {
      expect(component['tableConfig'].rowActions).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // Initial state
  // -----------------------------------------------------------------------

  describe('initial state', () => {
    it('should have empty dataSource before opening', () => {
      expect(component['dataSource']()).toEqual([]);
    });

    it('should not be loading initially', () => {
      expect(component['loading']()).toBe(false);
    });

    it('should have no error initially', () => {
      expect(component['error']()).toBeNull();
    });

    it('should have isOpen default to false', () => {
      expect(component.isOpen).toBe(false);
    });

    it('should have row default to null', () => {
      expect(component.row).toBeNull();
    });

    it('should have empty testKitId initially', () => {
      expect(component['testKitId']).toBe('');
    });
  });
});
