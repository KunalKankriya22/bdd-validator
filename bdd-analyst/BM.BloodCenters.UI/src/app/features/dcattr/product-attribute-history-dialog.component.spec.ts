import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subject, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ProductAttributeHistoryDialogComponent } from './product-attribute-history-dialog.component';
import { DcattrService } from './dcattr.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { ProductAttributeLogDto } from './dcattr.models';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('ProductAttributeHistoryDialogComponent', () => {
  let component: ProductAttributeHistoryDialogComponent;
  let fixture: ComponentFixture<ProductAttributeHistoryDialogComponent>;
  let dcattrServiceSpy: jasmine.SpyObj<DcattrService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ProductAttributeHistoryDialogComponent>>;

  const mockDialogData = {
    unitId: '12345678901234',
    collDate: '2026-01-15T00:00:00Z',
    productCode: 'RBC001'
  };

  const mockHistoryData: ProductAttributeLogDto[] = [
    {
      oldProductCode: 'RBC001',
      attribCode: 'CMV',
      newProductCode: 'RBC002',
      attribDate: '2026-05-28T10:30:00Z',
      insertDate: '2026-05-28T10:30:00Z'
    },
    {
      oldProductCode: 'RBC002',
      attribCode: 'IRRAD',
      newProductCode: 'RBC003',
      attribDate: '2026-01-20T14:20:00Z',
      insertDate: '2026-01-20T14:20:00Z'
    },
    {
      oldProductCode: 'RBC003',
      attribCode: 'CMV',
      newProductCode: 'RBC004',
      attribDate: '2026-02-15T09:15:00Z',
      insertDate: '2026-02-15T09:15:00Z'
    }
  ];

  beforeEach(() => {

    dcattrServiceSpy = jasmine.createSpyObj('DcattrService', ['getAttributeHistory']);
    snackbarServiceSpy = createMockSnackbarService();
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
      imports: [ProductAttributeHistoryDialogComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: DcattrService, useValue: dcattrServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    });


    


      dcattrServiceSpy.getAttributeHistory.calls.reset();


      dialogRefSpy.close.calls.reset();


    fixture = TestBed.createComponent(ProductAttributeHistoryDialogComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should load history on init', fakeAsync(() => {
      dcattrServiceSpy.getAttributeHistory.and.returnValue(of(mockHistoryData));

      fixture.detectChanges();
      tick();

      expect(dcattrServiceSpy.getAttributeHistory).toHaveBeenCalledWith(
        '12345678901234',
        '2026-01-15T00:00:00Z',
        'RBC001'
      );
      expect(component.historyData.length).toBe(3);
    }));

    it('should generate unique component ID', () => {
      expect(component.componentId).toMatch(/^history-dialog-\d+$/);
    });
  });

  describe('Load History', () => {
    it('should populate history data', fakeAsync(() => {
      dcattrServiceSpy.getAttributeHistory.and.returnValue(of(mockHistoryData));

      fixture.detectChanges();
      tick();

      expect(component.historyData.length).toBe(3);
      expect(component.historyData[0].attribCode).toBe('CMV');
      expect(component.historyData[0].oldProductCode).toBe('RBC001');
    }));

    it('should handle error when loading history fails', fakeAsync(() => {
      dcattrServiceSpy.getAttributeHistory.and.returnValue(
        throwError(() => ({ message: 'Failed to load history' }))
      );

      fixture.detectChanges();
      tick();

      expect(component.error()).toBe('Failed to load history');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load history');
    }));

    it('should set empty data when no history found', fakeAsync(() => {
      dcattrServiceSpy.getAttributeHistory.and.returnValue(of([]));

      fixture.detectChanges();
      tick();

      expect(component.historyData.length).toBe(0);
    }));
  });
  describe('Date Formatting', () => {
    it('should format date in DD-MMM-YYYY via tableConfig valueFormatter', () => {
      const attribDateCol = component.tableConfig.columns.find(c => c.key === 'attribDate');
      expect(attribDateCol?.valueFormatter).toBeDefined();
      expect(attribDateCol!.valueFormatter!('2026-05-28T10:30:00Z', {} as any)).toBe('28-MAY-2026');
    });



    it('should return "-" for invalid date', () => {
      const attribDateCol = component.tableConfig.columns.find(c => c.key === 'attribDate');
      expect(attribDateCol!.valueFormatter!('invalid-date', {} as any)).toBe('-');
    });
  });
  describe('Table Config', () => {
    it('should have all required columns configured', () => {
      const columnKeys = component.tableConfig.columns.map(c => c.key);
      expect(columnKeys).toContain('oldProductCode');
      expect(columnKeys).toContain('attribCode');
      expect(columnKeys).toContain('newProductCode');
      expect(columnKeys).toContain('attribDate');
      expect(columnKeys).toContain('insertDate');
    });


  });
  describe('Unique ID Generation', () => {
    it('should generate unique component IDs across multiple instances', () => {
      const fixture2 = TestBed.createComponent(ProductAttributeHistoryDialogComponent);
      const component2 = fixture2.componentInstance;

      expect(component.componentId).not.toBe(component2.componentId);
      expect(component.elementId('title')).not.toBe(component2.elementId('title'));
    });
  });
});
