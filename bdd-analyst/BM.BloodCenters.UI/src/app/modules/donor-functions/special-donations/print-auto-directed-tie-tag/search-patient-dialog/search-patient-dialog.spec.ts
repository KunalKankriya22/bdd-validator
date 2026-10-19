import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { SearchPatientDialogComponent, SearchPatientDialogData } from './search-patient-dialog';
import type { PatientSearchResultDto } from '../models/print-auto-directed-tie-tag.models';

describe('SearchPatientDialogComponent', () => {
  let component: SearchPatientDialogComponent;
  let fixture: ComponentFixture<SearchPatientDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<SearchPatientDialogComponent>>;

  const mockPatientDtos: PatientSearchResultDto[] = [
    {
      patientId: 'PAT001', chapterId: '0001', lastName: 'Smith',
      firstName: 'John', dateOfBirth: '1980-01-15', surgeryId: 'SURG001', surgeryDate: '2024-01-15',
    },
    {
      patientId: 'PAT002', chapterId: '0001', lastName: 'Doe',
      firstName: 'Jane', dateOfBirth: '1990-05-20', surgeryId: 'SURG002', surgeryDate: '2024-01-20',
    },
    {
      patientId: 'PAT003', chapterId: '0001', lastName: 'Brown',
      firstName: 'Bob', dateOfBirth: null, surgeryId: null, surgeryDate: null,
    },
  ];

  const mockDialogData: SearchPatientDialogData = { patients: mockPatientDtos };

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
      imports: [SearchPatientDialogComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    });


    


      dialogRefSpy.close.calls.reset();


    fixture = TestBed.createComponent(SearchPatientDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should map patients from dialog data with rowId', () => {
    expect(component.patients.length).toBe(3);
    expect(component.patients[0].patientId).toBe('PAT001');
    expect(component.patients[0].rowId).toBeDefined();
  });



  it('should have SELECT disabled when no patient selected', () => {
    expect(component.isSelectDisabled).toBeTrue();
    expect(component.selectedPatient).toBeNull();
  });

  describe('Single-select behavior', () => {
    it('should select a patient', () => {
      component.onSelectionChange([component.patients[0]]);
      expect(component.selectedPatient).toEqual(component.patients[0]);
      expect(component.isSelectDisabled).toBeFalse();
    });

    it('should keep only the latest selection', () => {
      component.onSelectionChange([component.patients[0], component.patients[1]]);
      expect(component.selectedPatient).toEqual(component.patients[1]);
    });


  });

  describe('Dialog actions', () => {
    it('should close with selected patient on SELECT', () => {
      component.onSelectionChange([component.patients[0]]);
      component.onSelect();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(component.patients[0]);
    });

    it('should close with null on CANCEL', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
    });

    it('should close with null on CANCEL even if patient was selected', () => {
      component.onSelectionChange([component.patients[1]]);
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
    });
  });

  describe('Sorting', () => {
    it('should sort patients ascending on first click', () => {
      component.onSortChange({ column: 'lastName', direction: 'A' });
      expect(component.dataTableConfig.sortConfig?.direction).toBe('A');
    });

    it('should sort patients descending on second click', () => {
      component.onSortChange({ column: 'lastName', direction: 'A' });
      component.onSortChange({ column: 'lastName', direction: 'D' });
      expect(component.dataTableConfig.sortConfig?.direction).toBe('D');
    });


  });
});
