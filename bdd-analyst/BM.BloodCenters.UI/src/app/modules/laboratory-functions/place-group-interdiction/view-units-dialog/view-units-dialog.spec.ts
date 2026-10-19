import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, EMPTY } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ViewUnitsDialog, ViewUnitsDialogData } from './view-units-dialog';
import { GroupInterdictionApiService } from '../services/group-interdiction-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { AffectedUnitsDto } from '../models/group-interdiction.model';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('ViewUnitsDialog', () => {
  let component: ViewUnitsDialog;
  let fixture: ComponentFixture<ViewUnitsDialog>;
  let apiServiceSpy: jasmine.SpyObj<GroupInterdictionApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewUnitsDialog>>;

  const mockDialogData: ViewUnitsDialogData = {
    controlMode: 'DRIVE',
    selectionValue: 'DRIVE1',
  };

  const mockUnits: AffectedUnitsDto[] = [
    { unitId: 'W633326042201', collDate: '2002-01-01T00:00:00Z', chkDigit: 'V' },
    { unitId: 'W633326042202', collDate: '2002-01-01T00:00:00Z', chkDigit: 'R' },
    { unitId: 'W633326042203', collDate: '2002-01-01T00:00:00Z', chkDigit: 'R' },
  ];

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('GroupInterdictionApiService', ['previewAffectedUnits']);
    snackbarServiceSpy = createMockSnackbarService();
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    apiServiceSpy.previewAffectedUnits.and.returnValue(of(mockUnits));



      TestBed.configureTestingModule({
      imports: [ViewUnitsDialog, NoopAnimationsModule],
      providers: [
        { provide: GroupInterdictionApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    });


    


      apiServiceSpy.previewAffectedUnits.calls.reset();


      dialogRefSpy.close.calls.reset();


      apiServiceSpy.previewAffectedUnits.and.returnValue(of(mockUnits));


    fixture = TestBed.createComponent(ViewUnitsDialog);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should load affected units on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.previewAffectedUnits).toHaveBeenCalledWith('DRIVE', 'DRIVE1');
      expect((component as any).units()).toEqual(mockUnits);
    }));


  });
  describe('Error Handling', () => {
    it('should show error message on load failure', fakeAsync(() => {
      apiServiceSpy.previewAffectedUnits.and.returnValue(throwError(() => new Error('API Error')));

      fixture.detectChanges();
      tick();

      expect((component as any).error()).toBe('Failed to load affected units.');
    }));

    it('should display error message in template', fakeAsync(() => {
      apiServiceSpy.previewAffectedUnits.and.returnValue(throwError(() => new Error('API Error')));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.nativeElement.textContent).toContain('Failed to load affected units');
    }));


  });

  describe('Empty State', () => {


    it('should compute isEmpty correctly', fakeAsync(() => {
      apiServiceSpy.previewAffectedUnits.and.returnValue(of([]));

      fixture.detectChanges();
      tick();

      expect((component as any).isEmpty()).toBeTrue();
    }));
  });

  describe('Units Table', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));



    it('should display correct columns', () => {
      expect((component as any).displayedColumns).toEqual(['unitId', 'collDate']);
    });



    it('should display unit ID with check digit', () => {
      const cells = fixture.debugElement.queryAll(By.css('td.mat-mdc-cell'));
      const firstUnitCell = cells[0];

      expect(firstUnitCell.nativeElement.textContent.trim()).toBe('W633326042201-V');
    });



    it('should compute hasUnits correctly', () => {
      expect((component as any).hasUnits()).toBeTrue();
    });
  });

  describe('Clear All Action', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should clear units when CLEAR ALL clicked', () => {
      (component as any).onClearAll();

      expect((component as any).units().length).toBe(0);
    });



    it('should show CLEAR ALL button only when units exist', () => {
      const clearBtn = fixture.debugElement.query(By.css(`[id$="-clear-all-btn"]`));
      expect(clearBtn).toBeTruthy();

      (component as any).units.set([]);
      fixture.detectChanges();

      const clearBtnAfter = fixture.debugElement.query(By.css(`[id$="-clear-all-btn"]`));
      expect(clearBtnAfter).toBeFalsy();
    });
  });
  describe('Date Formatting', () => {




    it('should handle undefined dates', () => {
      const formatted = (component as any).formatDate(undefined);
      expect(formatted).toBe('');
    });
  });


});
