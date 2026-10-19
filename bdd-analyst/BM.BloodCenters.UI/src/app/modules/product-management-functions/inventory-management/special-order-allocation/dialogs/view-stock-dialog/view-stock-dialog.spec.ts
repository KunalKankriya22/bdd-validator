import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { ViewStockDialog, ViewStockDialogData } from './view-stock-dialog';
import { SpecialOrderAllocationService } from '../../services/special-order-allocation.service';
import { InventorySummaryApiDto } from '../../models/special-order-allocation.model';

describe('ViewStockDialog', () => {
  let component: ViewStockDialog;
  let fixture: ComponentFixture<ViewStockDialog>;
  let serviceSpy: jasmine.SpyObj<SpecialOrderAllocationService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewStockDialog>>;
  let translateSpy: jasmine.SpyObj<TranslateService>;

  const mockData: ViewStockDialogData = {
    productType: 'RBC',
    bloodType: 'OP'
  };

  const mockInventorySummary: InventorySummaryApiDto = {
    minimal: 10,
    optimal: 50,
    maxTier: 3,
    tiers: [
      { tier: 1, fromDay: 0, toDay: 3, unitPrice: 100, inStock: 20, onOrder: 5, allocated: 3, packed: 2, available: 10 },
      { tier: 2, fromDay: 4, toDay: 7, unitPrice: 80, inStock: 15, onOrder: 3, allocated: 2, packed: 1, available: 9 }
    ]
  };

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('SpecialOrderAllocationService', ['getInventorySummary']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    translateSpy = jasmine.createSpyObj<TranslateService>('TranslateService', ['instant', 'get']);
    translateSpy.instant.and.returnValue('');

    serviceSpy.getInventorySummary.and.returnValue(of(mockInventorySummary));

    await TestBed.configureTestingModule({
      imports: [ViewStockDialog, NoopAnimationsModule],
      providers: [
        { provide: SpecialOrderAllocationService, useValue: serviceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: TranslateService, useValue: translateSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewStockDialog);
    component = fixture.componentInstance;
  });

  it('should initialize with product options', () => {
    fixture.detectChanges();
    expect(component.productOptions().length).toBeGreaterThan(0);
  });

  it('should set initial selected product', () => {
    fixture.detectChanges();
    expect(component.selectedProduct()).toBe('RBC');
  });





  it('should reload stock summary when product changes', (done) => {
    fixture.detectChanges();

    component.onProductChange('PLT');

    setTimeout(() => {
      expect(component.selectedProduct()).toBe('PLT');
      expect(serviceSpy.getInventorySummary).toHaveBeenCalledWith('PLT', 'OP');
      done();
    }, 600);
  });
});
