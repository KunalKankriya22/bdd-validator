import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';

import { ViewBoxContentsDialogComponent } from './view-box-contents-dialog';
import { PackInvRejectsApiService } from '../services/pack-inv-rejects-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DiscardProductDto } from '../models/pack-inv-rejects.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ViewBoxContentsDialogComponent', () => {
  let component: ViewBoxContentsDialogComponent;
  let fixture: ComponentFixture<ViewBoxContentsDialogComponent>;
  let apiServiceSpy: jasmine.SpyObj<PackInvRejectsApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockProducts: DiscardProductDto[] = [
    {
      unitId: 'W1234-18-031310-Z',
      productCode: 'E2897V00',
      aliquot: '00',
      chapterId: 'CH01',
      bloodType: 'AB',
      productType: 'FFP CPD',
      productStatus: 'CI',
      collDate: '2024-01-15T00:00:00Z',
      expDate: '2025-01-11T13:17:00Z',
      boxId: 'BOX001',
      warehouseId: '1',
      discardType: 'RE',
      chkDigit: '12',
      productDesc: 'RBC',
      aboDesc: 'O Positive'
    },
    {
      unitId: 'W1234-18-031311-Z',
      productCode: 'E0701V00',
      aliquot: '00',
      chapterId: 'CH01',
      bloodType: 'O',
      productType: 'RBC',
      productStatus: 'CI',
      collDate: '2024-01-16T00:00:00Z',
      expDate: '2025-01-11T13:17:00Z',
      boxId: 'BOX001',
      warehouseId: '1',
      discardType: 'RE',
      chkDigit: '13',
      productDesc: 'Red Blood Cells',
      aboDesc: 'O Positive'
    }
  ];

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('PackInvRejectsApiService', ['getBoxContents']);
    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService();

    apiServiceSpy.getBoxContents.and.returnValue(of(mockProducts));
      TestBed.configureTestingModule({
      imports: [ViewBoxContentsDialogComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: PackInvRejectsApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });

    

      apiServiceSpy.getBoxContents.calls.reset();

      headerServiceSpy.getCurrentChapterTimezone.calls.reset();

      apiServiceSpy.getBoxContents.and.returnValue(of(mockProducts));
    fixture = TestBed.createComponent(ViewBoxContentsDialogComponent);
    component = fixture.componentInstance;

    });

  describe('Initialization', () => {

    it('should load box contents when boxId input is set', fakeAsync(() => {
      component.boxId = 'BOX001';
      fixture.detectChanges();
      component.ngOnChanges();
      tick();

      expect(apiServiceSpy.getBoxContents).toHaveBeenCalledWith('BOX001');
      expect(component.products()).toEqual(mockProducts);
      expect(component.loading()).toBeFalse();
    }));

    it('should have table config with correct columns', () => {
      const config = component.tableConfig();
      const columnKeys = config.columns.map((c: any) => c.key);

      expect(columnKeys).toContain('unitId');
      expect(columnKeys).toContain('expDate');
      expect(columnKeys).toContain('productType');
      expect(columnKeys).toContain('productCode');
      expect(columnKeys).toContain('aboDesc');
    });
  });

  describe('Loading Box Contents', () => {
    it('should handle error when loading fails', fakeAsync(() => {
      apiServiceSpy.getBoxContents.and.returnValue(throwError(() => new Error('Failed')));

      component.boxId = 'BOX001';
      component.ngOnChanges();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load box contents');
      expect(component.loading()).toBeFalse();
    }));
  });

  describe('Sorting', () => {
    beforeEach(fakeAsync(() => {
      component.boxId = 'BOX001';
      fixture.detectChanges();
      component.ngOnChanges();
      tick();
    }));

    it('should return sorted products via sortedProducts computed', () => {
      const sorted = component.sortedProducts();

      // Default sort is 'A' on unitId, so first item should be alphabetically first
      expect(sorted.length).toBe(2);
      expect(sorted[0].unitId.localeCompare(sorted[1].unitId)).toBeLessThanOrEqual(0);
    });
  });
  describe('Empty State', () => {
    it('should display empty state when no products', fakeAsync(() => {
      apiServiceSpy.getBoxContents.and.returnValue(of([]));

      component.boxId = 'BOX001';
      component.ngOnChanges();
      tick();

      expect(component.products()).toEqual([]);
    }));
  });

  describe('onClose', () => {
    it('should emit panelClosed event', () => {
      spyOn(component.panelClosed, 'emit');
      component.onClose();
      expect(component.panelClosed.emit).toHaveBeenCalled();
    });
  });

  describe('onSortChange', () => {
    it('should update sort config', () => {
      component.onSortChange({ column: 'expDate', direction: 'D' } as any);
      expect(component.sortConfig().column).toBe('expDate');
      expect(component.sortConfig().direction).toBe('D');
    });

    it('should reverse sort order when direction is D', fakeAsync(() => {
      component.boxId = 'BOX001';
      fixture.detectChanges();
      component.ngOnChanges();
      tick();

      component.onSortChange({ column: 'unitId', direction: 'D' } as any);
      const sorted = component.sortedProducts();
      expect(sorted.length).toBe(2);
      expect(sorted[0].unitId!.localeCompare(sorted[1].unitId!)).toBeGreaterThanOrEqual(0);
    }));
  });

  describe('Table Config Value Formatters', () => {
    beforeEach(fakeAsync(() => {
      component.boxId = 'BOX001';
      fixture.detectChanges();
      component.ngOnChanges();
      tick();
    }));

    it('should format expDate column with valid date', () => {
      const config = component.tableConfig();
      const expCol = config.columns.find((c: any) => c.key === 'expDate');
      const result = expCol?.valueFormatter?.(null, mockProducts[0]);
      expect(result).toContain('JAN');
      expect(result).toContain('2025');
    });

    it('should return dash for null expDate', () => {
      const config = component.tableConfig();
      const expCol = config.columns.find((c: any) => c.key === 'expDate');
      const result = expCol?.valueFormatter?.(null, { ...mockProducts[0], expDate: null });
      expect(result).toBe('-');
    });

    it('should return empty string expDate', () => {
      const config = component.tableConfig();
      const expCol = config.columns.find((c: any) => c.key === 'expDate');
      const result = expCol?.valueFormatter?.(null, { ...mockProducts[0], expDate: '' });
      expect(result).toBe('-');
    });

    it('should format productType column with productDesc fallback', () => {
      const config = component.tableConfig();
      const ptCol = config.columns.find((c: any) => c.key === 'productType');
      expect(ptCol?.valueFormatter?.(null, { ...mockProducts[0], productDesc: 'RBC' })).toBe('RBC');
      expect(ptCol?.valueFormatter?.(null, { ...mockProducts[0], productDesc: null, productType: 'FFP' })).toBe('FFP');
      expect(ptCol?.valueFormatter?.(null, { ...mockProducts[0], productDesc: null, productType: null })).toBe('-');
    });

    it('should format aboDesc column with bloodType fallback', () => {
      const config = component.tableConfig();
      const aboCol = config.columns.find((c: any) => c.key === 'aboDesc');
      expect(aboCol?.valueFormatter?.(null, { ...mockProducts[0], aboDesc: 'O Positive' })).toBe('O Positive');
      expect(aboCol?.valueFormatter?.(null, { ...mockProducts[0], aboDesc: null, bloodType: 'O+' })).toBe('O+');
      expect(aboCol?.valueFormatter?.(null, { ...mockProducts[0], aboDesc: null, bloodType: null })).toBe('-');
    });

    it('should include product count in unitId header', () => {
      const config = component.tableConfig();
      const unitCol = config.columns.find((c: any) => c.key === 'unitId');
      expect(unitCol?.header).toContain('(2)');
    });
  });

  describe('ngOnChanges with empty boxId', () => {
    it('should not load box contents when boxId is empty', fakeAsync(() => {
      component.boxId = '';
      component.ngOnChanges();
      tick();
      expect(apiServiceSpy.getBoxContents).not.toHaveBeenCalled();
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Footer Buttons', () => {
    it('should have a close button', () => {
      expect(component.footerButtons.length).toBe(1);
      expect(component.footerButtons[0].action).toBe('close');
    });
  });
});
