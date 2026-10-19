import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { ViewPackStatusDialogComponent, ViewPackStatusDialogData } from './view-pack-status-dialog';

describe('ViewPackStatusDialogComponent', () => {
  let component: ViewPackStatusDialogComponent;
  let fixture: ComponentFixture<ViewPackStatusDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewPackStatusDialogComponent>>;

  const mockData: ViewPackStatusDialogData = {
    packedProducts: [
      { unitId: 'U001', displayUnitId: 'U-001', productCode: 'RBC', aboDesc: 'O+' },
      { unitId: 'U002', productCode: 'PLT', aboDesc: 'A-' }
    ],
    allocatedProducts: [
      { unitId: 'U003', displayUnitId: 'U-003', productCode: 'FFP', aboDesc: 'B+' }
    ]
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [ViewPackStatusDialogComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    });

    fixture = TestBed.createComponent(ViewPackStatusDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should receive packed and allocated products from dialog data', () => {
      expect(component.data.packedProducts.length).toBe(2);
      expect(component.data.allocatedProducts.length).toBe(1);
    });
  });

  describe('Table Configs', () => {
    it('should compute packed table config with count in header', () => {
      const config = component['packedTableConfig']();
      expect(config.columns[0].header).toContain('2');
      expect(config.columns.length).toBe(3);
    });

    it('should compute allocated table config with count in header', () => {
      const config = component['allocatedTableConfig']();
      expect(config.columns[0].header).toContain('1');
      expect(config.columns.length).toBe(3);
    });

    it('should use displayUnitId when available in packed table', () => {
      const config = component['packedTableConfig']();
      const formatter = config.columns[0].valueFormatter!;
      const result = formatter('U001', mockData.packedProducts[0] as any);
      expect(result).toBe('U-001');
    });

    it('should fall back to unitId when displayUnitId is not available', () => {
      const config = component['packedTableConfig']();
      const formatter = config.columns[0].valueFormatter!;
      const result = formatter('U002', mockData.packedProducts[1] as any);
      expect(result).toBe('U002');
    });

    it('should use displayUnitId in allocated table', () => {
      const config = component['allocatedTableConfig']();
      const formatter = config.columns[0].valueFormatter!;
      const result = formatter('U003', mockData.allocatedProducts[0] as any);
      expect(result).toBe('U-003');
    });
  });

  describe('Sorting', () => {
    it('should return unsorted packed products by default', () => {
      const sorted = component['sortedPacked']();
      expect(sorted).toEqual(mockData.packedProducts);
    });

    it('should sort packed products ascending', () => {
      component.onPackedSortChange({ column: 'unitId', direction: 'A' });
      const sorted = component['sortedPacked']();
      expect(sorted[0].unitId).toBe('U001');
      expect(sorted[1].unitId).toBe('U002');
    });

    it('should sort packed products descending', () => {
      component.onPackedSortChange({ column: 'unitId', direction: 'D' });
      const sorted = component['sortedPacked']();
      expect(sorted[0].unitId).toBe('U002');
      expect(sorted[1].unitId).toBe('U001');
    });

    it('should return unsorted allocated products by default', () => {
      const sorted = component['sortedAllocated']();
      expect(sorted).toEqual(mockData.allocatedProducts);
    });

    it('should sort allocated products on sort change', () => {
      component.onAllocatedSortChange({ column: 'productCode', direction: 'A' });
      const sorted = component['sortedAllocated']();
      expect(sorted[0].productCode).toBe('FFP');
    });
  });

  describe('Close', () => {
    it('should close dialog on close()', () => {
      component.close();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('Empty Data', () => {
    it('should handle empty packed and allocated lists', () => {
      const emptyData: ViewPackStatusDialogData = {
        packedProducts: [],
        allocatedProducts: []
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ViewPackStatusDialogComponent, NoopAnimationsModule, TranslateModule.forRoot()],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: emptyData }
        ]
      });

      const emptyFixture = TestBed.createComponent(ViewPackStatusDialogComponent);
      const emptyComponent = emptyFixture.componentInstance;
      emptyFixture.detectChanges();

      expect(emptyComponent['packedTableConfig']().columns[0].header).toContain('0');
      expect(emptyComponent['allocatedTableConfig']().columns[0].header).toContain('0');
      expect(emptyComponent['sortedPacked']().length).toBe(0);
      expect(emptyComponent['sortedAllocated']().length).toBe(0);
    });
  });
});
