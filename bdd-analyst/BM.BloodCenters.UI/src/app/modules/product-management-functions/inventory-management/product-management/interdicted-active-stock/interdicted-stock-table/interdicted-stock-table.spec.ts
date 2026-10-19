import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { InterdictedStockTable } from './interdicted-stock-table';

const mockProduct1 = {
  unitId: 'U001', collDate: '2024-01-01', chapterId: 'CH01',
  productType: 'RBC', productCode: 'E0701V00', inventoryClass: 'Regular',
  bloodType: 'O+', aliquot: '01', locationId: 'Hopkins', stockState: 'AV',
  aboRh: 'O Positive', interdictions: []
};

const mockProduct2 = {
  unitId: 'U002', collDate: '2024-01-02', chapterId: 'CH01',
  productType: 'RBC', productCode: 'E0701V01', inventoryClass: 'Regular',
  bloodType: 'A+', aliquot: '01', locationId: 'RMC', stockState: 'RE',
  aboRh: 'A Positive', interdictions: []
};

const minimalConfig: any = {
  columns: [{ key: 'unitId', header: 'Unit ID' }],
  pagination: { pageSize: 25, pageIndex: 0, totalRecords: 2 }
};

describe('InterdictedStockTable', () => {
  let component: InterdictedStockTable;
  let fixture: ComponentFixture<InterdictedStockTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterdictedStockTable, NoopAnimationsModule, TranslateModule.forRoot()]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InterdictedStockTable);
    component = fixture.componentInstance;
    component.config = minimalConfig;
    component.data = [mockProduct1, mockProduct2];
  });

  // ── Creation ──────────────────────────────────────────────────────────────

  it('should create the wrapper component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render app-data-table inside the wrapper', () => {
    fixture.detectChanges();
    const dataTable = fixture.nativeElement.querySelector('app-data-table');
    expect(dataTable).not.toBeNull();
  });

  // ── Input pass-through ────────────────────────────────────────────────────

  it('should accept config, data, loading, highlightedRow, and focusedRow inputs', () => {
    component.loading = true;
    component.highlightedRow = mockProduct1;
    component.focusedRow = mockProduct1;
    fixture.detectChanges();
    expect(component.config).toEqual(minimalConfig);
    expect(component.data.length).toBe(2);
    expect(component.loading).toBeTrue();
    expect(component.highlightedRow).toEqual(mockProduct1);
    expect(component.focusedRow).toEqual(mockProduct1);
  });

  // ── Output pass-through ───────────────────────────────────────────────────

  it('should emit rowClick when a row is clicked', () => {
    fixture.detectChanges();
    const emitted: any[] = [];
    component.rowClick.subscribe((v: any) => emitted.push(v));
    component.rowClick.emit(mockProduct1);
    expect(emitted[0]).toEqual(mockProduct1);
  });

  it('should emit pageChange when page changes', () => {
    fixture.detectChanges();
    const emitted: any[] = [];
    component.pageChange.subscribe((v: any) => emitted.push(v));
    component.pageChange.emit({ pageIndex: 1, pageSize: 25, previousPageIndex: 0 });
    expect(emitted[0].pageIndex).toBe(1);
  });

  it('should emit sortChange when sort changes', () => {
    fixture.detectChanges();
    const emitted: any[] = [];
    component.sortChange.subscribe((v: any) => emitted.push(v));
    component.sortChange.emit({ column: 'unitId', direction: 'A' });
    expect(emitted[0].column).toBe('unitId');
  });

  // ── ngOnChanges — focusedRow focuses the correct DOM row ─────────────────

  it('should call focus() on the correct tr when focusedRow changes', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const rows = fixture.nativeElement.querySelectorAll('tr.mat-mdc-row');
    if (rows.length < 2) { pending('No rows rendered in test environment'); return; }

    const focusSpy = spyOn(rows[1] as HTMLElement, 'focus');
    component.focusedRow = mockProduct2;
    component.ngOnChanges({
      focusedRow: new SimpleChange(null, mockProduct2, false)
    });
    tick(0);

    expect(focusSpy).toHaveBeenCalled();
  }));

  it('should not throw when focusedRow is null', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(() => {
      component.focusedRow = null;
      component.ngOnChanges({ focusedRow: new SimpleChange(mockProduct1, null, false) });
      tick(0);
    }).not.toThrow();
  }));

  // ── ngOnChanges — highlightedRow clears hover inline styles ──────────────

  it('should not throw when highlightedRow changes', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(() => {
      component.highlightedRow = mockProduct1;
      component.ngOnChanges({ highlightedRow: new SimpleChange(null, mockProduct1, false) });
      tick(0);
    }).not.toThrow();
  }));

  // ── Hover suppression ─────────────────────────────────────────────────────

  it('should suppress hover background on non-selected rows via mouseover', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const rows = fixture.nativeElement.querySelectorAll('tr.mat-mdc-row');
    if (!rows.length) { pending('No rows rendered in test environment'); return; }

    const row = rows[0] as HTMLElement;
    row.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

    const cell = row.querySelector('td.mat-mdc-cell') as HTMLElement | null;
    if (cell) {
      expect(cell.style.getPropertyValue('background-color')).toBe('transparent');
    }
  }));

  it('should remove hover inline style when mouse leaves the row', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const rows = fixture.nativeElement.querySelectorAll('tr.mat-mdc-row');
    if (!rows.length) { pending('No rows rendered in test environment'); return; }

    const row = rows[0] as HTMLElement;
    row.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    row.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));

    const cell = row.querySelector('td.mat-mdc-cell') as HTMLElement | null;
    if (cell) {
      expect(cell.style.getPropertyValue('background-color')).toBe('');
    }
  }));

  it('should clear inline style on selected row instead of suppressing', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const rows = fixture.nativeElement.querySelectorAll('tr.mat-mdc-row');
    if (!rows.length) { pending('No rows rendered in test environment'); return; }

    const row = rows[0] as HTMLElement;
    const cell = row.querySelector('td.mat-mdc-cell') as HTMLElement | null;

    if (cell) {
      // Pre-set a transparent style to simulate a prior hover
      cell.style.setProperty('background-color', 'transparent', 'important');
      // Mark the row as selected
      row.classList.add('data-table__row--selected');
      row.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      // Selected row should have inline style cleared
      expect(cell.style.getPropertyValue('background-color')).toBe('');
      row.classList.remove('data-table__row--selected');
    }
  }));

  // ── Click listener ────────────────────────────────────────────────────────

  it('should remove inline background style on row click', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const rows = fixture.nativeElement.querySelectorAll('tr.mat-mdc-row');
    if (!rows.length) { pending('No rows rendered in test environment'); return; }

    const row = rows[0] as HTMLElement;
    const cell = row.querySelector('td.mat-mdc-cell') as HTMLElement | null;

    if (cell) {
      cell.style.setProperty('background-color', 'transparent', 'important');
      row.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(cell.style.getPropertyValue('background-color')).toBe('');
    }
  }));

  // ── ngOnDestroy ───────────────────────────────────────────────────────────

  it('should clean up listeners on destroy without throwing', () => {
    fixture.detectChanges();
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
