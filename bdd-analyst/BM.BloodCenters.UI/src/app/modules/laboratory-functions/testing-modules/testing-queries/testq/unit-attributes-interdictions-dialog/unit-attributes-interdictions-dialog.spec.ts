import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

import { UnitAttributesInterdictionsDialogComponent } from './unit-attributes-interdictions-dialog';
import { InterdictionQueryApiService } from '../../../../attributes-and-interdictions/interdiction-query/services/interdiction-query-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('UnitAttributesInterdictionsDialogComponent', () => {
  let component: UnitAttributesInterdictionsDialogComponent;
  let fixture: ComponentFixture<UnitAttributesInterdictionsDialogComponent>;
  let interdictionServiceSpy: jasmine.SpyObj<InterdictionQueryApiService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<UnitAttributesInterdictionsDialogComponent>>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;

  const mockResponse = {
    unitId: 'W12345678901234567',
    collectionDate: '2024-05-15',
    isArchived: false,
    unitAttributes: [
      { attribGroup: 'SP', attribCode: 'FI', attribType: 'Special Handling', attribDesc: 'Leuko Reduced', insertDats: '', insertUserId: null },
      { attribGroup: 'SP', attribCode: 'IR', attribType: 'Special Handling', attribDesc: 'Irradiated', insertDats: '', insertUserId: null },
    ],
    unitInterdictions: [
      { interCode: 'HOLD', interDesc: 'Quarantine Until Resolved', interType: 'Hold', insertDats: '', interUserId: null },
    ],
    componentInterdictions: [],
    componentAttributes: [],
  };

  const mockDialogData = {
    unitId: 'W12345678901234567',
    collectionDate: '2024-05-15',
  };

  beforeEach(() => {

    interdictionServiceSpy = jasmine.createSpyObj('InterdictionQueryApiService', ['queryInterdictions']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    snackbarSpy = createMockSnackbarService();

    interdictionServiceSpy.queryInterdictions.and.returnValue(of(mockResponse as any));



      TestBed.configureTestingModule({
imports: [UnitAttributesInterdictionsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: InterdictionQueryApiService, useValue: interdictionServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: SnackbarService, useValue: snackbarSpy },
      ],
    });


    });



  beforeEach(() => {


      interdictionServiceSpy.queryInterdictions.calls.reset();


      dialogRefSpy.close.calls.reset();


      interdictionServiceSpy.queryInterdictions.and.returnValue(of(mockResponse as any));


    fixture = TestBed.createComponent(UnitAttributesInterdictionsDialogComponent);
    component = fixture.componentInstance;


    });
  describe('Data Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should display attribute data correctly', () => {
      const firstRow = fixture.debugElement.query(By.css('.data-section:first-child tr.mat-mdc-row'));
      expect(firstRow.nativeElement.textContent).toContain('SP');
      expect(firstRow.nativeElement.textContent).toContain('FI');
      expect(firstRow.nativeElement.textContent).toContain('Leuko Reduced');
    });

    it('should display interdiction data correctly', () => {
      const firstRow = fixture.debugElement.query(By.css('.data-section:last-child tr.mat-mdc-row'));
      expect(firstRow.nativeElement.textContent).toContain('HOLD');
      expect(firstRow.nativeElement.textContent).toContain('Quarantine Until Resolved');
      expect(firstRow.nativeElement.textContent).toContain('Hold');
    });
  });

  describe('Empty State', () => {
    beforeEach(() => {
      interdictionServiceSpy.queryInterdictions.and.returnValue(
        of({ ...mockResponse, unitAttributes: [], unitInterdictions: [] } as any)
      );
      fixture.detectChanges();
    });

    it('should show "No attributes found" when empty', () => {
      const rows = fixture.debugElement.queryAll(By.css('.data-section:first-child tr.mat-mdc-row'));
      expect(rows.length).toBe(0);
    });

    it('should show "No interdictions found" when empty', () => {
      const rows = fixture.debugElement.queryAll(By.css('.data-section:last-child tr.mat-mdc-row'));
      expect(rows.length).toBe(0);
    });
  });

  describe('Dialog Actions', () => {


    it('should have CLOSE button in actions', () => {
      fixture.detectChanges();
      const closeButton = fixture.debugElement.query(By.css('mat-dialog-actions button'));
      expect(closeButton).toBeTruthy();
      expect(closeButton.nativeElement.textContent).toContain('CLOSE');
    });
  });
});
