import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

import { PagqResultsTableComponent } from './pagq-results-table.component';
import { ProductAntigenSearchResult, UnitAntigenDetail } from '../../models/products-with-antigens.models';

describe('PagqResultsTableComponent', () => {
  let component: PagqResultsTableComponent;
  let fixture: ComponentFixture<PagqResultsTableComponent>;

  const mockAntigens: UnitAntigenDetail[] = [
    { antigenId: 'D', antigenDescription: 'D Antigen', result: 'P', confirmed: 'Yes' },
    { antigenId: 'K', antigenDescription: 'K Antigen', result: 'N', confirmed: null }
  ];

  const mockResults: ProductAntigenSearchResult[] = [
    {
      unitId: 'UNIT001',
      productCode: 'RBC',
      aboRhType: 'O POS',
      expirationDate: '2026-06-30T00:00:00',
      warehouseId: '1',
      antigenProfile: mockAntigens
    },
    {
      unitId: 'UNIT002',
      productCode: 'PLT',
      aboRhType: 'A POS',
      expirationDate: '2026-07-15T00:00:00',
      warehouseId: '2',
      antigenProfile: []
    }
  ];

  beforeAll(async () => {
    await TestBed.configureTestingModule({
      teardown: { destroyAfterEach: false },
      imports: [PagqResultsTableComponent, NoopAnimationsModule]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PagqResultsTableComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should initialize with empty results', () => {
      fixture.detectChanges();
      expect(component.dataSource.data.length).toBe(0);
    });

    it('should have correct displayed columns', () => {
      expect(component.displayedColumns).toEqual([
        'unitId', 'productCode', 'aboRhType', 'expirationDate', 'warehouseId'
      ]);
    });

    it('should have default page size options', () => {
      expect(component.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });
  });

  describe('Data Display', () => {
    beforeEach(() => {
      component.results = mockResults;
      component.totalCount = 2;
      component.loading = false;
      fixture.detectChanges();
    });

    it('should display results in table', () => {
      component.ngOnChanges({
        results: {
          currentValue: mockResults,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();

      expect(component.dataSource.data.length).toBe(2);
    });
  });

  describe('ngOnChanges', () => {
    it('should update isLoading when loading changes', () => {
      component.loading = true;
      component.ngOnChanges({
        loading: {
          currentValue: true,
          previousValue: false,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component['isLoading']()).toBeTrue();
    });

    it('should set isEmpty to true when results are null', () => {
      component.results = null as any;
      component.ngOnChanges({
        results: {
          currentValue: null,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component['isEmpty']()).toBeTrue();
    });

    it('should set isEmpty to true when results are empty', () => {
      component.results = [];
      component.ngOnChanges({
        results: {
          currentValue: [],
          previousValue: mockResults,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component['isEmpty']()).toBeTrue();
    });

    it('should clear selection when results change', () => {
      component['selectedRow'].set(mockResults[0]);
      component.results = mockResults;
      component.ngOnChanges({
        results: {
          currentValue: mockResults,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component['selectedRow']()).toBeNull();
    });

    it('should set hasSearched when totalCount > 0', () => {
      component.totalCount = 10;
      component.ngOnChanges({
        totalCount: {
          currentValue: 10,
          previousValue: 0,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component['hasSearched']()).toBeTrue();
    });

    it('should not set hasSearched when totalCount is 0', () => {
      component['hasSearched'].set(false);
      component.totalCount = 0;
      component.ngOnChanges({
        totalCount: {
          currentValue: 0,
          previousValue: 0,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component['hasSearched']()).toBeFalse();
    });
  });

  describe('Row Selection', () => {
    it('should select a row', () => {
      const emitSpy = spyOn(component.rowSelect, 'emit');
      component.onRowSelect(mockResults[0]);
      expect(component['selectedRow']()).toEqual(mockResults[0]);
      expect(emitSpy).toHaveBeenCalledWith(mockResults[0]);
    });

    it('should deselect when clicking same row', () => {
      const emitSpy = spyOn(component.rowSelect, 'emit');
      component.onRowSelect(mockResults[0]);
      component.onRowSelect(mockResults[0]);
      expect(component['selectedRow']()).toBeNull();
      expect(emitSpy).toHaveBeenCalledWith(null);
    });

    it('should switch selection to different row', () => {
      component.onRowSelect(mockResults[0]);
      component.onRowSelect(mockResults[1]);
      expect(component['selectedRow']()?.unitId).toBe('UNIT002');
    });
  });

  describe('Page Change', () => {
    it('should emit page change event', () => {
      const emitSpy = spyOn(component.pageChange, 'emit');
      const pageEvent: PageEvent = { pageIndex: 1, pageSize: 25, length: 100 };
      component.onPageChange(pageEvent);
      expect(emitSpy).toHaveBeenCalledWith(pageEvent);
    });
  });

  describe('Sort Change', () => {
    it('should emit sort change event', () => {
      const emitSpy = spyOn(component.sortChange, 'emit');
      const sortEvent: Sort = { active: 'unitId', direction: 'asc' };
      component.onSortChange(sortEvent);
      expect(emitSpy).toHaveBeenCalledWith(sortEvent);
    });
  });

  describe('Format Date', () => {
    it('should return dash for null date', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return dash for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(component.formatDate('')).toBe('-');
    });

    it('should format valid date string', () => {
      const result = component.formatDate('2026-06-30T14:30:00');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
    });

    it('should return dash for invalid date string', () => {
      expect(component.formatDate('not-a-date')).toBe('-');
    });
  });

  describe('Antigen Result Label', () => {
    it('should return Positive for P', () => {
      expect(component.getAntigenResultLabel('P')).toBe('Positive');
    });

    it('should return Positive for POSITIVE', () => {
      expect(component.getAntigenResultLabel('POSITIVE')).toBe('Positive');
    });

    it('should return Negative for N', () => {
      expect(component.getAntigenResultLabel('N')).toBe('Negative');
    });

    it('should return Negative for NEGATIVE', () => {
      expect(component.getAntigenResultLabel('NEGATIVE')).toBe('Negative');
    });

    it('should return Reactive for R', () => {
      expect(component.getAntigenResultLabel('R')).toBe('Reactive');
    });

    it('should return Reactive for REACTIVE', () => {
      expect(component.getAntigenResultLabel('REACTIVE')).toBe('Reactive');
    });

    it('should return Not Tested for NT', () => {
      expect(component.getAntigenResultLabel('NT')).toBe('Not Tested');
    });

    it('should return original value for unknown', () => {
      expect(component.getAntigenResultLabel('X')).toBe('X');
    });

    it('should return dash for null or empty', () => {
      expect(component.getAntigenResultLabel('')).toBe('-');
    });
  });

  describe('Antigen Icon Class', () => {
    it('should return positive class for P result', () => {
      const antigen: UnitAntigenDetail = { antigenId: 'D', result: 'P', antigenDescription: 'D', confirmed: null };
      expect(component.getAntigenIconClass(antigen)).toBe('positive');
    });

    it('should return positive class for POSITIVE result', () => {
      const antigen: UnitAntigenDetail = { antigenId: 'D', result: 'POSITIVE', antigenDescription: 'D', confirmed: null };
      expect(component.getAntigenIconClass(antigen)).toBe('positive');
    });

    it('should return negative class for N result', () => {
      const antigen: UnitAntigenDetail = { antigenId: 'D', result: 'N', antigenDescription: 'D', confirmed: null };
      expect(component.getAntigenIconClass(antigen)).toBe('negative');
    });

    it('should return negative class for NEGATIVE result', () => {
      const antigen: UnitAntigenDetail = { antigenId: 'D', result: 'NEGATIVE', antigenDescription: 'D', confirmed: null };
      expect(component.getAntigenIconClass(antigen)).toBe('negative');
    });

    it('should return not-tested class for unknown result', () => {
      const antigen: UnitAntigenDetail = { antigenId: 'D', result: 'X', antigenDescription: 'D', confirmed: null };
      expect(component.getAntigenIconClass(antigen)).toBe('not-tested');
    });
  });

  describe('Antigen Initial', () => {
    it('should return first character uppercased', () => {
      expect(component.getAntigenInitial('d')).toBe('D');
    });

    it('should return ? for empty string', () => {
      expect(component.getAntigenInitial('')).toBe('?');
    });
  });

  describe('Confirmed Antigens', () => {
    it('should return antigen profile from row', () => {
      const row = mockResults[0];
      const result = component.getConfirmedAntigens(row);
      expect(result).toEqual(mockAntigens);
    });

    it('should return empty array for null profile', () => {
      const row = { ...mockResults[0], antigenProfile: undefined } as any;
      const result = component.getConfirmedAntigens(row);
      expect(result).toEqual([]);
    });

    it('should return empty array for null row', () => {
      const result = component.getConfirmedAntigens(null as any);
      expect(result).toEqual([]);
    });
  });

  describe('Data Updates', () => {
    it('should update data source when results change', () => {
      component.results = mockResults;
      component.ngOnChanges({
        results: {
          currentValue: mockResults,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.dataSource.data.length).toBe(2);
    });
  });

  describe('Track By Function', () => {
    it('should track antigens by antigenId', () => {
      const antigen = mockAntigens[0];
      const result = component.trackByAntigenId(0, antigen);
      expect(result).toBe(antigen.antigenId);
    });
  });

  describe('Has Data', () => {
    it('should return true when has results and not loading', () => {
      component.results = mockResults;
      component.loading = false;
      component.ngOnChanges({
        results: {
          currentValue: mockResults,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.hasData()).toBeTrue();
    });

    it('should return false when loading', () => {
      component.results = mockResults;
      component.loading = true;
      component.ngOnChanges({
        loading: {
          currentValue: true,
          previousValue: false,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.hasData()).toBeFalse();
    });

    it('should return false when empty and not searched', () => {
      expect(component.hasData()).toBeFalse();
    });
  });

  describe('Element ID', () => {
    it('should generate unique element IDs', () => {
      const id = component['elementId']('test');
      expect(id).toContain('pagq-results-table-');
      expect(id).toContain('-test');
    });
  });
});
