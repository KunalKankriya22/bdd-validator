import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { ViewBoxContentsDialogComponent, ViewBoxContentsDialogData } from './view-box-contents-dialog';

describe('ViewBoxContentsDialogComponent', () => {
  let component: ViewBoxContentsDialogComponent;
  let fixture: ComponentFixture<ViewBoxContentsDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewBoxContentsDialogComponent>>;

  const mockData: ViewBoxContentsDialogData = {
    contents: [
      {
        unitId: 'U001',
        displayUnitId: 'U-001',
        expirationDate: '2026-12-31T14:30:00',
        productType: 'RBC',
        productCode: 'E0385V00',
        aboDesc: 'O Positive'
      },
      {
        unitId: 'U002',
        expirationDate: '2026-11-15T00:00:00',
        productType: 'PLT',
        productCode: 'E2807100',
        aboDesc: 'A Negative'
      },
      {
        unitId: 'U003',
        productType: 'FFP',
        productCode: 'E0701100',
        aboDesc: 'B Positive'
      }
    ]
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [ViewBoxContentsDialogComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    });

    fixture = TestBed.createComponent(ViewBoxContentsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should receive contents from dialog data', () => {
      expect(component.data.contents.length).toBe(3);
    });
  });

  describe('Table Config', () => {
    it('should compute table config with count in header', () => {
      const config = component['tableConfig']();
      expect(config.columns[0].header).toContain('3');
    });

    it('should have 5 columns', () => {
      const config = component['tableConfig']();
      expect(config.columns.length).toBe(5);
      expect(config.columns.map(c => c.key)).toEqual([
        'unitId', 'expirationDate', 'productType', 'productCode', 'aboDesc'
      ]);
    });

    it('should use displayUnitId when available', () => {
      const config = component['tableConfig']();
      const formatter = config.columns[0].valueFormatter!;
      const result = formatter('U001', mockData.contents[0] as any);
      expect(result).toBe('U-001');
    });

    it('should fall back to unitId when displayUnitId is not available', () => {
      const config = component['tableConfig']();
      const formatter = config.columns[0].valueFormatter!;
      const result = formatter('U002', mockData.contents[1] as any);
      expect(result).toBe('U002');
    });

    it('should format expiration date in DD-MMM-YYYY HH:mm format', () => {
      const config = component['tableConfig']();
      const formatter = config.columns[1].valueFormatter!;
      const result = formatter('2026-12-31T14:30:00', undefined as any);
      expect(result).toBe('31-DEC-2026 14:30');
    });

    it('should return empty string for null expiration date', () => {
      const config = component['tableConfig']();
      const formatter = config.columns[1].valueFormatter!;
      const result = formatter(null as any, undefined as any);
      expect(result).toBe('');
    });
  });

  describe('Sorting', () => {
    it('should return unsorted contents by default', () => {
      const sorted = component['sortedContents']();
      expect(sorted).toEqual(mockData.contents);
    });

    it('should sort contents ascending by unitId', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' });
      const sorted = component['sortedContents']();
      expect(sorted[0].unitId).toBe('U001');
      expect(sorted[2].unitId).toBe('U003');
    });

    it('should sort contents descending by unitId', () => {
      component.onSortChange({ column: 'unitId', direction: 'D' });
      const sorted = component['sortedContents']();
      expect(sorted[0].unitId).toBe('U003');
      expect(sorted[2].unitId).toBe('U001');
    });

    it('should sort by productCode', () => {
      component.onSortChange({ column: 'productCode', direction: 'A' });
      const sorted = component['sortedContents']();
      expect(sorted[0].productCode).toBe('E0385V00');
      expect(sorted[1].productCode).toBe('E0701100');
      expect(sorted[2].productCode).toBe('E2807100');
    });

    it('should reset to default sort', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' });
      component.onSortChange({ column: '', direction: 'default' });
      const sorted = component['sortedContents']();
      expect(sorted).toEqual(mockData.contents);
    });
  });

  describe('Format Date', () => {
    it('should format valid date', () => {
      const result = component.formatDate('2026-08-05T14:30:00');
      expect(result).toBe('05-AUG-2026 14:30');
    });

    it('should return empty string for null', () => {
      expect(component.formatDate(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(component.formatDate(undefined)).toBe('');
    });

    it('should return original string for invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('not-a-date');
    });
  });

  describe('Close', () => {
    it('should close dialog on close()', () => {
      component.close();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('Empty Data', () => {
    it('should handle empty contents list', () => {
      const emptyData: ViewBoxContentsDialogData = { contents: [] };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ViewBoxContentsDialogComponent, NoopAnimationsModule, TranslateModule.forRoot()],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: emptyData }
        ]
      });

      const emptyFixture = TestBed.createComponent(ViewBoxContentsDialogComponent);
      const emptyComponent = emptyFixture.componentInstance;
      emptyFixture.detectChanges();

      expect(emptyComponent['tableConfig']().columns[0].header).toContain('0');
      expect(emptyComponent['sortedContents']().length).toBe(0);
    });
  });
});
