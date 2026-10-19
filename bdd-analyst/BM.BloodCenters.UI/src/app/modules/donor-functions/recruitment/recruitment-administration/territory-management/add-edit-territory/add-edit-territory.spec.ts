import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { AddEditTerritory } from './add-edit-territory';
import { TerritoryService } from '../services/territory.service';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditTerritory', () => {
  let component: AddEditTerritory;
  let fixture: ComponentFixture<AddEditTerritory>;
  let territoryServiceSpy: jasmine.SpyObj<TerritoryService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const mockTerritory = {
    territoryId: 'TERRY00478',
    chapterId: 'DAL',
    territoryShortName: 'ABILENE',
    territoryName: 'Abilene community Center',
    territoryGroup: 'CCOLL',
    territoryType: 'TRTMR',
    effDate: '2026-05-04',
    termDate: '2027-07-14',
    comments: 'Test description',
    programId: 'VDITERTR',
    insertDate: '2026-01-01',
    insertUser: 'ADMIN',
    auditKey: 1,
    modificationDate: '2026-03-15'
  };

  beforeEach(() => {

    territoryServiceSpy = jasmine.createSpyObj('TerritoryService', ['addTerritory', 'updateTerritory', 'getFilterOptions']);
    snackBarSpy = createMockMatSnackBar();

    territoryServiceSpy.getFilterOptions.and.returnValue(
      of({ groups: [{ code: 'CCOLL', description: 'Collection' }], types: [{ code: 'TRTMR', description: 'Territory' }] })
    );



      TestBed.configureTestingModule({
      imports: [AddEditTerritory, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TerritoryService, useValue: territoryServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });


    


      territoryServiceSpy.addTerritory.calls.reset();


      territoryServiceSpy.updateTerritory.calls.reset();


      territoryServiceSpy.getFilterOptions.calls.reset();


    fixture = TestBed.createComponent(AddEditTerritory);
    component = fixture.componentInstance;
    component.groups = [{ code: 'CCOLL', description: 'Collection' }];
    component.types = [{ code: 'TRTMR', description: 'Territory' }];


    });

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should create in add mode', () => {
      expect(component).toBeTruthy();
      expect(component.panelTitle).toBe('Add New Territory');
      expect(component.lastUpdated).toBe('');
    });

    it('should have invalid form when empty', () => {
      expect(component.isFormValid).toBeFalse();
    });



    it('should validate max length for short name', () => {
      component.form.get('territoryShortName')?.setValue('12345678901');
      component.form.get('territoryShortName')?.markAsTouched();
      expect(component.getShortNameError()).toBe('Short Name cannot exceed 10 characters');
    });








  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockTerritory;
      fixture.detectChanges();
    });

    it('should create in edit mode', () => {
      expect(component.panelTitle).toBe('Edit Territory');
    });

    it('should show last modified date', () => {
      expect(component.lastUpdated).toContain('Last Modified:');
    });



    it('should call updateTerritory on save', () => {
      territoryServiceSpy.updateTerritory.and.returnValue(of({ success: true, message: 'Updated' }));
      spyOn(component.closePanel, 'emit');
      spyOn(component.saveSuccess, 'emit');

      // Ensure form is valid
      expect(component.form.valid).toBeTrue();
      component.onSave();

      expect(territoryServiceSpy.updateTerritory).toHaveBeenCalled();
    });


  });
});
