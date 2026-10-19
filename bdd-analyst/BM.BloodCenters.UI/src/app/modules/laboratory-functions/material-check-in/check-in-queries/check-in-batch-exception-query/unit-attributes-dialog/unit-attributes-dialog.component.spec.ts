import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import {
  UnitAttributesDialogComponent,
  UnitAttributesDialogData,
} from './unit-attributes-dialog.component';
import { CheckInBatchExceptionApiService } from '../services/check-in-batch-exception-api.service';
import { UnitAttributeDto } from '../models/check-in-batch-exception.model';

describe('UnitAttributesDialogComponent', () => {
  let component: UnitAttributesDialogComponent;
  let fixture: ComponentFixture<UnitAttributesDialogComponent>;
  let apiServiceSpy: jasmine.SpyObj<CheckInBatchExceptionApiService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<UnitAttributesDialogComponent>>;

  const mockDialogData: UnitAttributesDialogData = {
    unitId: 'W123418031306',
    collDate: '2025-01-11T00:00:00Z',
  };

  const mockAttributes: UnitAttributeDto[] = [
    {
      attributeGroup: 'PHER',
      groupDescription: 'Apheresis Donation Procedures',
      attributeCode: 'PP',
      codeDescription: 'Plateletpheresis',
    },
    {
      attributeGroup: 'QUAL',
      groupDescription: 'Quality Attributes',
      attributeCode: '14',
      codeDescription: 'Incomplete Check-In Data',
    },
  ];

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('CheckInBatchExceptionApiService', [
      'getUnitAttributes',
    ]);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    apiServiceSpy.getUnitAttributes.and.returnValue(of(mockAttributes));



      TestBed.configureTestingModule({
imports: [UnitAttributesDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: CheckInBatchExceptionApiService, useValue: apiServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    });


    });



  beforeEach(() => {


      apiServiceSpy.getUnitAttributes.calls.reset();


      dialogRefSpy.close.calls.reset();


      apiServiceSpy.getUnitAttributes.and.returnValue(of(mockAttributes));


    fixture = TestBed.createComponent(UnitAttributesDialogComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {

    it('should load attributes on init', () => {
      fixture.detectChanges();

      expect(apiServiceSpy.getUnitAttributes).toHaveBeenCalledWith(
        mockDialogData.unitId,
        mockDialogData.collDate
      );
      expect((component as any).attributes()).toEqual(mockAttributes);
      expect((component as any).loading()).toBeFalse();
    });

  });
  describe('Attributes Table', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should display attribute data correctly', () => {
      const firstRow = fixture.nativeElement.querySelector('tr.mat-mdc-row');
      const cells = firstRow.querySelectorAll('td');

      expect(cells[0].textContent.trim()).toBe(mockAttributes[0].attributeGroup);
      expect(cells[1].textContent.trim()).toBe(mockAttributes[0].groupDescription);
      expect(cells[2].textContent.trim()).toBe(mockAttributes[0].attributeCode);
      expect(cells[3].textContent.trim()).toBe(mockAttributes[0].codeDescription);
    });

  });

  describe('Dialog Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should have CLOSE button in actions', () => {
      const closeButton = fixture.nativeElement.querySelector('.dialog-actions button');
      expect(closeButton).toBeTruthy();
      expect(closeButton.textContent.trim()).toBe('CLOSE');
    });
  });

});
