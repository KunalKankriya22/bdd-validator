import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { TranslateService } from '@ngx-translate/core';

import { UnitsAllocatedDialog, UnitsAllocatedDialogData } from './units-allocated-dialog';
import { SpecialOrderAllocationService } from '../../services/special-order-allocation.service';
import { AllocatedUnitDto } from '../../models/special-order-allocation.model';

describe('UnitsAllocatedDialog', () => {
  let component: UnitsAllocatedDialog;
  let fixture: ComponentFixture<UnitsAllocatedDialog>;
  let serviceSpy: jasmine.SpyObj<SpecialOrderAllocationService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<UnitsAllocatedDialog>>;
  let translateSpy: jasmine.SpyObj<TranslateService>;

  const mockData: UnitsAllocatedDialogData = {
    orderNo: '240500017',
    itemNo: 1
  };

  const mockAllocatedUnits: AllocatedUnitDto[] = [
    {
      itemNo: 1,
      unitId: 'W633318030402-H',
      productCode: 'E0385V00',
      productType: 'RBC',
      productStatus: 'AL',
      bloodType: 'OP',
      aliquot: '00',
      abo: 'O POS',
      rh: null,
      expirationDate: '2025-03-01T09:00:00Z',
      collectionDate: '2025-02-01',
      warehouse: 'A'
    }
  ];

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('SpecialOrderAllocationService', ['getAllocatedUnits']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    translateSpy = jasmine.createSpyObj<TranslateService>('TranslateService', ['instant', 'get']);
    translateSpy.instant.and.returnValue('');

    serviceSpy.getAllocatedUnits.and.returnValue(of(mockAllocatedUnits));

    await TestBed.configureTestingModule({
      imports: [UnitsAllocatedDialog, NoopAnimationsModule],
      providers: [
        { provide: SpecialOrderAllocationService, useValue: serviceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: TranslateService, useValue: translateSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UnitsAllocatedDialog);
    component = fixture.componentInstance;
  });

  it('should load allocated units on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(serviceSpy.getAllocatedUnits).toHaveBeenCalledWith('240500017', 1);
    expect(component.allocatedUnits().length).toBe(1);
  }));

  it('should handle loading state', () => {
    fixture.detectChanges();
    component.loading.set(true);
    fixture.detectChanges();

    expect(component.loading()).toBeTrue();
    const dataTable = fixture.debugElement.query(By.css('app-data-table'));
    expect(dataTable).toBeTruthy();
  });




});
