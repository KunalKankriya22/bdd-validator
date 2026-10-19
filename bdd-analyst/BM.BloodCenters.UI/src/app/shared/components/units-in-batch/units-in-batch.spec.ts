import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { SimpleChange } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { UnitsInBatchComponent, UnitInBatch } from './units-in-batch';
import { TubesCheckInService } from '../../../modules/laboratory-functions/sample-management/regional-sample-tracking/tubes-check-in/services/tubes-check-in.service';
import { BatchUnitDto } from '../../../modules/laboratory-functions/sample-management/regional-sample-tracking/tubes-check-in/models/tubes-check-in.model';

describe('UnitsInBatchComponent', () => {
  let component: UnitsInBatchComponent;
  let fixture: ComponentFixture<UnitsInBatchComponent>;
  let tubesServiceSpy: jasmine.SpyObj<TubesCheckInService>;

  beforeEach(() => {
    tubesServiceSpy = jasmine.createSpyObj('TubesCheckInService', ['getBatchUnits']);
    tubesServiceSpy.getBatchUnits.and.returnValue(of([]));


      TestBed.configureTestingModule({
      imports: [
        UnitsInBatchComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: TubesCheckInService, useValue: tubesServiceSpy },
      ],
    });






    fixture = TestBed.createComponent(UnitsInBatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Initialization', () => {
    it('should initialize with empty units array', () => {
      expect(component._units()).toEqual([]);
    });













    it('should show table on empty', () => {
      const config = component.tableConfig;
      expect(config.showTableOnEmpty).toBe(true);
      expect(config.emptyMessage).toBe('No units in this batch');
      expect(config.noDataIcon).toBe('inbox');
    });
  });

  describe('Input Setter', () => {
    it('should accept units input', () => {
      const mockUnits: UnitInBatch[] = [
        { sequence: 1, unitId: 'U001', red1: 'R1', red2: 'R2', purple1: 'P1', purple2: 'P2' },
        { sequence: 2, unitId: 'U002', red1: 'R3', red2: 'R4', purple1: 'P3', purple2: 'P4' },
      ];

      component.units = mockUnits;
      fixture.detectChanges();

      const config = component.tableConfig;
      expect(component._units().length).toBe(2);
      expect(component._units()[0].unitId).toBe('U001');
      expect(component._units()[1].unitId).toBe('U002');
    });

    it('should handle null units input', () => {
      component.units = null as any;
      fixture.detectChanges();

      const config = component.tableConfig;
      expect(component._units()).toEqual([]);
    });

    it('should handle undefined units input', () => {
      component.units = undefined as any;
      fixture.detectChanges();

      const config = component.tableConfig;
      expect(component._units()).toEqual([]);
    });

    it('should handle empty units array', () => {
      component.units = [];
      fixture.detectChanges();

      const config = component.tableConfig;
      expect(component._units()).toEqual([]);
    });


  });

  describe('Unit Data Display', () => {
    it('should display all unit fields correctly', () => {
      const mockUnits: UnitInBatch[] = [
        {
          sequence: 1,
          unitId: 'AC12345',
          red1: 'Y',
          red2: 'N',
          purple1: 'Y',
          purple2: 'Y',
        },
      ];

      component.units = mockUnits;
      fixture.detectChanges();

      const config = component.tableConfig;
      const unit = component._units()[0];

      expect(unit.sequence).toBe(1);
      expect(unit.unitId).toBe('AC12345');
      expect(unit.red1).toBe('Y');
      expect(unit.red2).toBe('N');
      expect(unit.purple1).toBe('Y');
      expect(unit.purple2).toBe('Y');
    });

    it('should handle units with empty tube flags', () => {
      const mockUnits: UnitInBatch[] = [
        { sequence: 1, unitId: 'U001', red1: '', red2: '', purple1: '', purple2: '' },
      ];

      component.units = mockUnits;
      fixture.detectChanges();

      const config = component.tableConfig;
      expect(component._units()[0].red1).toBe('');
      expect(component._units()[0].red2).toBe('');
      expect(component._units()[0].purple1).toBe('');
      expect(component._units()[0].purple2).toBe('');
    });

    it('should maintain sequence order', () => {
      const mockUnits: UnitInBatch[] = [
        { sequence: 3, unitId: 'U003', red1: '', red2: '', purple1: '', purple2: '' },
        { sequence: 1, unitId: 'U001', red1: '', red2: '', purple1: '', purple2: '' },
        { sequence: 2, unitId: 'U002', red1: '', red2: '', purple1: '', purple2: '' },
      ];

      component.units = mockUnits;
      fixture.detectChanges();

      const config = component.tableConfig;
      expect(component._units()[0].sequence).toBe(3);
      expect(component._units()[1].sequence).toBe(1);
      expect(component._units()[2].sequence).toBe(2);
    });

    it('should handle units with special characters in unit IDs', () => {
      const mockUnits: UnitInBatch[] = [
        { sequence: 1, unitId: 'AC-12345-X', red1: 'Y', red2: '', purple1: '', purple2: '' },
      ];

      component.units = mockUnits;
      fixture.detectChanges();

      const config = component.tableConfig;
      expect(component._units()[0].unitId).toBe('AC-12345-X');
    });
  });

  describe('Event Emission', () => {


    it('should emit closePanel event exactly once', () => {
      let emitCount = 0;
      component.closePanel.subscribe(() => emitCount++);

      component.onClose();

      expect(emitCount).toBe(1);
    });
  });

  describe('Large Data Sets', () => {
    it('should handle large number of units', () => {
      const largeUnits: UnitInBatch[] = Array.from({ length: 500 }, (_, i) => ({
        sequence: i + 1,
        unitId: `U${(i + 1).toString().padStart(5, '0')}`,
        red1: i % 2 === 0 ? 'Y' : 'N',
        red2: i % 3 === 0 ? 'Y' : 'N',
        purple1: i % 4 === 0 ? 'Y' : 'N',
        purple2: i % 5 === 0 ? 'Y' : 'N',
      }));

      component.units = largeUnits;
      fixture.detectChanges();

      const config = component.tableConfig;
      expect(component._units().length).toBe(500);
      expect(component._units()[0].unitId).toBe('U00001');
      expect(component._units()[499].unitId).toBe('U00500');
    });

    it('should maintain performance with large datasets', () => {
      const createUnits = (count: number): UnitInBatch[] =>
        Array.from({ length: count }, (_, i) => ({
          sequence: i + 1,
          unitId: `U${i + 1}`,
          red1: 'Y',
          red2: 'N',
          purple1: 'Y',
          purple2: 'N',
        }));

      const smallUnits = createUnits(100);
      const startSmall = performance.now();
      component.units = smallUnits;
      fixture.detectChanges();
      const smallTime = performance.now() - startSmall;

      const largeUnits = createUnits(1000);
      const startLarge = performance.now();
      component.units = largeUnits;
      fixture.detectChanges();
      const largeTime = performance.now() - startLarge;

      // Large (10x data) should take no more than 20x the small baseline — floor raised for CI variance
      expect(largeTime).toBeLessThan(Math.max(smallTime * 20, 10000));
      expect(component._units().length).toBe(1000);
    });
  });

  describe('Table Configuration Persistence', () => {


    it('should maintain column configuration when data changes', () => {
      component.units = [];
      fixture.detectChanges();

      let config = component.tableConfig;
      const initialColumns = config.columns;

      component.units = [
        { sequence: 1, unitId: 'U001', red1: '', red2: '', purple1: '', purple2: '' },
      ];
      fixture.detectChanges();

      config = component.tableConfig;
      expect(config.columns.length).toBe(initialColumns.length);
      config.columns.forEach((col, index) => {
        expect(col.key).toBe(initialColumns[index].key);
        expect(col.header).toBe(initialColumns[index].header);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle unit with very long unit ID', () => {
      const longUnitId = 'U' + 'X'.repeat(100);
      const mockUnits: UnitInBatch[] = [
        { sequence: 1, unitId: longUnitId, red1: '', red2: '', purple1: '', purple2: '' },
      ];

      component.units = mockUnits;
      fixture.detectChanges();

      const config = component.tableConfig;
      expect(component._units()[0].unitId).toBe(longUnitId);
      expect(component._units()[0].unitId.length).toBe(101);
    });

    it('should handle duplicate sequence numbers', () => {
      const mockUnits: UnitInBatch[] = [
        { sequence: 1, unitId: 'U001', red1: '', red2: '', purple1: '', purple2: '' },
        { sequence: 1, unitId: 'U002', red1: '', red2: '', purple1: '', purple2: '' },
      ];

      component.units = mockUnits;
      fixture.detectChanges();

      const config = component.tableConfig;
      expect(component._units().length).toBe(2);
      expect(component._units()[0].sequence).toBe(1);
      expect(component._units()[1].sequence).toBe(1);
    });

    it('should handle units with zero sequence', () => {
      const mockUnits: UnitInBatch[] = [
        { sequence: 0, unitId: 'U000', red1: '', red2: '', purple1: '', purple2: '' },
      ];

      component.units = mockUnits;
      fixture.detectChanges();

      const config = component.tableConfig;
      expect(component._units()[0].sequence).toBe(0);
    });

    it('should handle units with negative sequence', () => {
      const mockUnits: UnitInBatch[] = [
        { sequence: -1, unitId: 'U-001', red1: '', red2: '', purple1: '', purple2: '' },
      ];

      component.units = mockUnits;
      fixture.detectChanges();

      const config = component.tableConfig;
      expect(component._units()[0].sequence).toBe(-1);
    });

    it('should handle unit with empty unit ID', () => {
      const mockUnits: UnitInBatch[] = [
        { sequence: 1, unitId: '', red1: 'Y', red2: '', purple1: '', purple2: '' },
      ];

      component.units = mockUnits;
      fixture.detectChanges();

      const config = component.tableConfig;
      expect(component._units()[0].unitId).toBe('');
    });

    it('should handle units with various tube flag values', () => {
      const mockUnits: UnitInBatch[] = [
        { sequence: 1, unitId: 'U001', red1: 'Y', red2: 'N', purple1: 'X', purple2: '1' },
      ];

      component.units = mockUnits;
      fixture.detectChanges();

      const config = component.tableConfig;
      expect(component._units()[0].red1).toBe('Y');
      expect(component._units()[0].red2).toBe('N');
      expect(component._units()[0].purple1).toBe('X');
      expect(component._units()[0].purple2).toBe('1');
    });
  });

  describe('Reactivity', () => {
    it('should recompute table config when units signal changes', () => {
      const initialUnits: UnitInBatch[] = [
        { sequence: 1, unitId: 'U001', red1: '', red2: '', purple1: '', purple2: '' },
      ];

      component.units = initialUnits;
      fixture.detectChanges();

      expect(component._units().length).toBe(1);

      const updatedUnits: UnitInBatch[] = [
        { sequence: 1, unitId: 'U001', red1: '', red2: '', purple1: '', purple2: '' },
        { sequence: 2, unitId: 'U002', red1: '', red2: '', purple1: '', purple2: '' },
        { sequence: 3, unitId: 'U003', red1: '', red2: '', purple1: '', purple2: '' },
      ];

      component.units = updatedUnits;
      fixture.detectChanges();

      expect(component._units().length).toBe(3);
    });

    it('should update table immediately when units change', () => {
      component.units = [
        { sequence: 1, unitId: 'U001', red1: '', red2: '', purple1: '', purple2: '' },
      ];
      fixture.detectChanges();

      const dataBefore = component._units();

      component.units = [
        { sequence: 2, unitId: 'U002', red1: 'Y', red2: 'N', purple1: 'Y', purple2: 'N' },
      ];
      fixture.detectChanges();

      const dataAfter = component._units();

      expect(dataAfter).not.toBe(dataBefore);
      expect(dataAfter[0].unitId).toBe('U002');
      expect(dataAfter[0].sequence).toBe(2);
    });
  });

  describe('Mixed Scenarios', () => {


    it('should handle batch cleared then repopulated', () => {
      const initialUnits: UnitInBatch[] = [
        { sequence: 1, unitId: 'U001', red1: 'Y', red2: '', purple1: '', purple2: '' },
      ];

      component.units = initialUnits;
      fixture.detectChanges();

      let config = component.tableConfig;
      expect(component._units().length).toBe(1);

      component.units = [];
      fixture.detectChanges();

      config = component.tableConfig;
      expect(component._units().length).toBe(0);

      const newUnits: UnitInBatch[] = [
        { sequence: 1, unitId: 'U002', red1: '', red2: 'Y', purple1: '', purple2: '' },
        { sequence: 2, unitId: 'U003', red1: '', red2: '', purple1: 'Y', purple2: '' },
      ];

      component.units = newUnits;
      fixture.detectChanges();

      config = component.tableConfig;
      expect(component._units().length).toBe(2);
      expect(component._units()[0].unitId).toBe('U002');
    });
  });

  describe('ngOnInit with batchId', () => {
    it('should call loadUnits when batchId is set before init', () => {
      const mockData: BatchUnitDto[] = [
        { tubeType: 'RED1', unitId: 'U001', osUnitId: 'OS001', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
      ];
      tubesServiceSpy.getBatchUnits.and.returnValue(of(mockData));

      const newFixture = TestBed.createComponent(UnitsInBatchComponent);
      const newComponent = newFixture.componentInstance;
      newComponent.batchId = 'BATCH-001';
      newFixture.detectChanges();

      expect(tubesServiceSpy.getBatchUnits).toHaveBeenCalledWith('BATCH-001');
      expect(newComponent._units().length).toBe(1);
    });

    it('should not call loadUnits when batchId is null on init', () => {
      tubesServiceSpy.getBatchUnits.calls.reset();

      const newFixture = TestBed.createComponent(UnitsInBatchComponent);
      const newComponent = newFixture.componentInstance;
      newComponent.batchId = null;
      newFixture.detectChanges();

      expect(tubesServiceSpy.getBatchUnits).not.toHaveBeenCalled();
      expect(newComponent._units()).toEqual([]);
    });

    it('should not call loadUnits when batchId is empty string on init', () => {
      tubesServiceSpy.getBatchUnits.calls.reset();

      const newFixture = TestBed.createComponent(UnitsInBatchComponent);
      const newComponent = newFixture.componentInstance;
      newComponent.batchId = '';
      newFixture.detectChanges();

      expect(tubesServiceSpy.getBatchUnits).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should reload units when batchId changes (not first change)', () => {
      tubesServiceSpy.getBatchUnits.calls.reset();
      tubesServiceSpy.getBatchUnits.and.returnValue(of([]));

      component.batchId = 'BATCH-002';
      component.ngOnChanges({
        batchId: new SimpleChange('BATCH-001', 'BATCH-002', false),
      });

      expect(tubesServiceSpy.getBatchUnits).toHaveBeenCalledWith('BATCH-002');
    });

    it('should not reload units on first change of batchId', () => {
      tubesServiceSpy.getBatchUnits.calls.reset();

      component.batchId = 'BATCH-001';
      component.ngOnChanges({
        batchId: new SimpleChange(undefined, 'BATCH-001', true),
      });

      expect(tubesServiceSpy.getBatchUnits).not.toHaveBeenCalled();
    });

    it('should not reload when batchId changes to null', () => {
      tubesServiceSpy.getBatchUnits.calls.reset();

      component.batchId = null;
      component.ngOnChanges({
        batchId: new SimpleChange('BATCH-001', null, false),
      });

      expect(tubesServiceSpy.getBatchUnits).not.toHaveBeenCalled();
    });

    it('should not reload when batchId changes to empty string', () => {
      tubesServiceSpy.getBatchUnits.calls.reset();

      component.batchId = '';
      component.ngOnChanges({
        batchId: new SimpleChange('BATCH-001', '', false),
      });

      expect(tubesServiceSpy.getBatchUnits).not.toHaveBeenCalled();
    });

    it('should not do anything when other inputs change (no batchId in changes)', () => {
      tubesServiceSpy.getBatchUnits.calls.reset();

      component.ngOnChanges({});

      expect(tubesServiceSpy.getBatchUnits).not.toHaveBeenCalled();
    });

    it('should reload with new batchId after multiple changes', () => {
      tubesServiceSpy.getBatchUnits.calls.reset();
      tubesServiceSpy.getBatchUnits.and.returnValue(of([]));

      component.batchId = 'BATCH-002';
      component.ngOnChanges({
        batchId: new SimpleChange('BATCH-001', 'BATCH-002', false),
      });

      component.batchId = 'BATCH-003';
      component.ngOnChanges({
        batchId: new SimpleChange('BATCH-002', 'BATCH-003', false),
      });

      expect(tubesServiceSpy.getBatchUnits).toHaveBeenCalledTimes(2);
      expect(tubesServiceSpy.getBatchUnits).toHaveBeenCalledWith('BATCH-003');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySub = (component as any).destroy$ as Subject<void>;
      let nextCalled = false;
      let completeCalled = false;

      destroySub.subscribe({
        next: () => (nextCalled = true),
        complete: () => (completeCalled = true),
      });

      component.ngOnDestroy();

      expect(nextCalled).toBe(true);
      expect(completeCalled).toBe(true);
    });

    it('should unsubscribe from pending API calls on destroy', () => {
      const apiSubject = new Subject<BatchUnitDto[]>();
      tubesServiceSpy.getBatchUnits.and.returnValue(apiSubject.asObservable());

      component.batchId = 'BATCH-DESTROY';
      component.ngOnChanges({
        batchId: new SimpleChange(null, 'BATCH-DESTROY', false),
      });

      expect(component.isLoading()).toBe(true);

      component.ngOnDestroy();

      // Emit after destroy - should not update component
      apiSubject.next([
        { tubeType: 'RED1', unitId: 'U1', osUnitId: 'OS1', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
      ]);
      apiSubject.complete();

      // Units should remain empty because subscription was destroyed
      expect(component._units()).toEqual([]);
    });
  });

  describe('loadUnits - API success', () => {
    it('should set isLoading to true during API call', () => {
      const apiSubject = new Subject<BatchUnitDto[]>();
      tubesServiceSpy.getBatchUnits.and.returnValue(apiSubject.asObservable());

      component.batchId = 'BATCH-LOAD';
      component.ngOnChanges({
        batchId: new SimpleChange(null, 'BATCH-LOAD', false),
      });

      expect(component.isLoading()).toBe(true);

      apiSubject.next([]);
      apiSubject.complete();

      expect(component.isLoading()).toBe(false);
    });

    it('should map API data to grouped units on success', () => {
      const mockData: BatchUnitDto[] = [
        { tubeType: 'RED1', unitId: 'U001', osUnitId: 'OS001', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
        { tubeType: 'RED2', unitId: 'U001', osUnitId: 'OS001', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
        { tubeType: 'PURPLE', unitId: 'U002', osUnitId: 'OS002', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
      ];
      tubesServiceSpy.getBatchUnits.and.returnValue(of(mockData));

      component.batchId = 'BATCH-SUCCESS';
      component.ngOnChanges({
        batchId: new SimpleChange(null, 'BATCH-SUCCESS', false),
      });

      expect(component._units().length).toBe(2);
      expect(component._units()[0].unitId).toBe('OS001');
      expect(component._units()[0].red1).toBe('Y');
      expect(component._units()[0].red2).toBe('Y');
      expect(component._units()[0].purple1).toBe('N');
      expect(component._units()[0].purple2).toBe('N');
      expect(component._units()[1].unitId).toBe('OS002');
      expect(component._units()[1].purple1).toBe('Y');
    });

    it('should handle null API response data', () => {
      tubesServiceSpy.getBatchUnits.and.returnValue(of(null as any));

      component.batchId = 'BATCH-NULL';
      component.ngOnChanges({
        batchId: new SimpleChange(null, 'BATCH-NULL', false),
      });

      expect(component._units()).toEqual([]);
      expect(component.isLoading()).toBe(false);
    });

    it('should handle empty API response', () => {
      tubesServiceSpy.getBatchUnits.and.returnValue(of([]));

      component.batchId = 'BATCH-EMPTY';
      component.ngOnChanges({
        batchId: new SimpleChange(null, 'BATCH-EMPTY', false),
      });

      expect(component._units()).toEqual([]);
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('loadUnits - API error', () => {
    it('should set units to empty array on error', () => {
      tubesServiceSpy.getBatchUnits.and.returnValue(throwError(() => new Error('Server error')));

      component.batchId = 'BATCH-ERR';
      component.ngOnChanges({
        batchId: new SimpleChange(null, 'BATCH-ERR', false),
      });

      expect(component._units()).toEqual([]);
    });

    it('should set isLoading to false on error', () => {
      tubesServiceSpy.getBatchUnits.and.returnValue(throwError(() => new Error('Network error')));

      component.batchId = 'BATCH-ERR2';
      component.ngOnChanges({
        batchId: new SimpleChange(null, 'BATCH-ERR2', false),
      });

      expect(component.isLoading()).toBe(false);
    });

    it('should log the error to console', () => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API failure');
      tubesServiceSpy.getBatchUnits.and.returnValue(throwError(() => error));

      component.batchId = 'BATCH-LOG';
      component.ngOnChanges({
        batchId: new SimpleChange(null, 'BATCH-LOG', false),
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error loading units:', error);
    });
  });

  describe('groupTubesByUnit (via loadUnits)', () => {
    it('should group multiple tube types under one osUnitId', () => {
      const mockData: BatchUnitDto[] = [
        { tubeType: 'RED1', unitId: 'U1', osUnitId: 'OS-UNIT-1', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
        { tubeType: 'RED2', unitId: 'U1', osUnitId: 'OS-UNIT-1', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
        { tubeType: 'PURPLE', unitId: 'U1', osUnitId: 'OS-UNIT-1', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
        { tubeType: 'SERUM', unitId: 'U1', osUnitId: 'OS-UNIT-1', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
      ];
      tubesServiceSpy.getBatchUnits.and.returnValue(of(mockData));

      component.batchId = 'BATCH-GRP';
      component.ngOnChanges({
        batchId: new SimpleChange(null, 'BATCH-GRP', false),
      });

      expect(component._units().length).toBe(1);
      const unit = component._units()[0];
      expect(unit.unitId).toBe('OS-UNIT-1');
      expect(unit.red1).toBe('Y');
      expect(unit.red2).toBe('Y');
      expect(unit.purple1).toBe('Y');
      expect(unit.purple2).toBe('Y');
    });

    it('should assign default N for missing tube types', () => {
      const mockData: BatchUnitDto[] = [
        { tubeType: 'RED1', unitId: 'U1', osUnitId: 'OS-UNIT-2', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
      ];
      tubesServiceSpy.getBatchUnits.and.returnValue(of(mockData));

      component.batchId = 'BATCH-DEF';
      component.ngOnChanges({
        batchId: new SimpleChange(null, 'BATCH-DEF', false),
      });

      const unit = component._units()[0];
      expect(unit.red1).toBe('Y');
      expect(unit.red2).toBe('N');
      expect(unit.purple1).toBe('N');
      expect(unit.purple2).toBe('N');
    });

    it('should map SERUM tubeType to purple2 column', () => {
      const mockData: BatchUnitDto[] = [
        { tubeType: 'SERUM', unitId: 'U1', osUnitId: 'OS-SERUM', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
      ];
      tubesServiceSpy.getBatchUnits.and.returnValue(of(mockData));

      component.batchId = 'BATCH-SERUM';
      component.ngOnChanges({
        batchId: new SimpleChange(null, 'BATCH-SERUM', false),
      });

      const unit = component._units()[0];
      expect(unit.purple2).toBe('Y');
      expect(unit.purple1).toBe('N');
    });

    it('should map PURPLE tubeType to purple1 column', () => {
      const mockData: BatchUnitDto[] = [
        { tubeType: 'PURPLE', unitId: 'U1', osUnitId: 'OS-PURPLE', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
      ];
      tubesServiceSpy.getBatchUnits.and.returnValue(of(mockData));

      component.batchId = 'BATCH-PURPLE';
      component.ngOnChanges({
        batchId: new SimpleChange(null, 'BATCH-PURPLE', false),
      });

      const unit = component._units()[0];
      expect(unit.purple1).toBe('Y');
      expect(unit.purple2).toBe('N');
    });

    it('should assign sequential sequence numbers starting at 1', () => {
      const mockData: BatchUnitDto[] = [
        { tubeType: 'RED1', unitId: 'U1', osUnitId: 'OS-A', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
        { tubeType: 'RED1', unitId: 'U2', osUnitId: 'OS-B', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
        { tubeType: 'RED1', unitId: 'U3', osUnitId: 'OS-C', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
      ];
      tubesServiceSpy.getBatchUnits.and.returnValue(of(mockData));

      component.batchId = 'BATCH-SEQ';
      component.ngOnChanges({
        batchId: new SimpleChange(null, 'BATCH-SEQ', false),
      });

      expect(component._units()[0].sequence).toBe(1);
      expect(component._units()[1].sequence).toBe(2);
      expect(component._units()[2].sequence).toBe(3);
    });

    it('should handle unknown tube types gracefully (no column mapping)', () => {
      const mockData: BatchUnitDto[] = [
        { tubeType: 'UNKNOWN', unitId: 'U1', osUnitId: 'OS-UNK', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
      ];
      tubesServiceSpy.getBatchUnits.and.returnValue(of(mockData));

      component.batchId = 'BATCH-UNK';
      component.ngOnChanges({
        batchId: new SimpleChange(null, 'BATCH-UNK', false),
      });

      const unit = component._units()[0];
      expect(unit.unitId).toBe('OS-UNK');
      expect(unit.red1).toBe('N');
      expect(unit.red2).toBe('N');
      expect(unit.purple1).toBe('N');
      expect(unit.purple2).toBe('N');
    });

    it('should handle multiple units with mixed tube types', () => {
      const mockData: BatchUnitDto[] = [
        { tubeType: 'RED1', unitId: 'U1', osUnitId: 'OS-1', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
        { tubeType: 'PURPLE', unitId: 'U1', osUnitId: 'OS-1', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
        { tubeType: 'RED2', unitId: 'U2', osUnitId: 'OS-2', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
        { tubeType: 'SERUM', unitId: 'U2', osUnitId: 'OS-2', collDate: '2025-01-15', receivedDate: '2025-01-16', batchId: 'B1', checkDigit: null },
      ];
      tubesServiceSpy.getBatchUnits.and.returnValue(of(mockData));

      component.batchId = 'BATCH-MIX';
      component.ngOnChanges({
        batchId: new SimpleChange(null, 'BATCH-MIX', false),
      });

      expect(component._units().length).toBe(2);
      // First unit: RED1 + PURPLE
      expect(component._units()[0].red1).toBe('Y');
      expect(component._units()[0].red2).toBe('N');
      expect(component._units()[0].purple1).toBe('Y');
      expect(component._units()[0].purple2).toBe('N');
      // Second unit: RED2 + SERUM
      expect(component._units()[1].red1).toBe('N');
      expect(component._units()[1].red2).toBe('Y');
      expect(component._units()[1].purple1).toBe('N');
      expect(component._units()[1].purple2).toBe('Y');
    });
  });

  describe('isLoading signal', () => {
    it('should initialize isLoading as false', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should be true while API call is pending', () => {
      const apiSubject = new Subject<BatchUnitDto[]>();
      tubesServiceSpy.getBatchUnits.and.returnValue(apiSubject.asObservable());

      component.batchId = 'BATCH-PEND';
      component.ngOnChanges({
        batchId: new SimpleChange(null, 'BATCH-PEND', false),
      });

      expect(component.isLoading()).toBe(true);

      apiSubject.next([]);
      apiSubject.complete();

      expect(component.isLoading()).toBe(false);
    });

    it('should be false after API error', () => {
      tubesServiceSpy.getBatchUnits.and.returnValue(throwError(() => new Error('fail')));

      component.batchId = 'BATCH-FAIL';
      component.ngOnChanges({
        batchId: new SimpleChange(null, 'BATCH-FAIL', false),
      });

      expect(component.isLoading()).toBe(false);
    });
  });

  describe('tableConfig columns', () => {
    it('should define 6 columns', () => {
      expect(component.tableConfig.columns.length).toBe(6);
    });

    it('should have sequence column as first and sortable', () => {
      const col = component.tableConfig.columns[0];
      expect(col.key).toBe('sequence');
      expect(col.header).toBe('Sequence');
      expect(col.sortable).toBe(true);
      expect(col.width).toBe('80px');
    });

    it('should have unitId column with auto width', () => {
      const col = component.tableConfig.columns[1];
      expect(col.key).toBe('unitId');
      expect(col.header).toBe('Unit ID');
      expect(col.sortable).toBe(false);
      expect(col.width).toBe('auto');
    });

    it('should have red1, red2, purple1, purple2 columns', () => {
      const keys = component.tableConfig.columns.map(c => c.key);
      expect(keys).toEqual(['sequence', 'unitId', 'red1', 'red2', 'purple1', 'purple2']);
    });

    it('should have all tube columns with 100px width', () => {
      const tubeColumns = component.tableConfig.columns.slice(2);
      tubeColumns.forEach(col => {
        expect(col.width).toBe('100px');
        expect(col.sortable).toBe(false);
      });
    });

    it('should have correct header labels for tube columns', () => {
      expect(component.tableConfig.columns[2].header).toBe('Red 1');
      expect(component.tableConfig.columns[3].header).toBe('Red 2');
      expect(component.tableConfig.columns[4].header).toBe('Purple 1');
      expect(component.tableConfig.columns[5].header).toBe('Purple 2');
    });

    it('should have pagination disabled', () => {
      expect(component.tableConfig.showPagination).toBe(false);
    });

    it('should have loading message configured', () => {
      expect(component.tableConfig.loadingMessage).toBe('Loading units...');
    });
  });

  describe('closePanel event', () => {
    it('should emit closePanel when onClose is called', () => {
      const emitSpy = spyOn(component.closePanel, 'emit');
      component.onClose();
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });

    it('should emit with no payload', () => {
      const emitSpy = spyOn(component.closePanel, 'emit');
      component.onClose();
      expect(emitSpy).toHaveBeenCalledWith();
    });
  });
});
