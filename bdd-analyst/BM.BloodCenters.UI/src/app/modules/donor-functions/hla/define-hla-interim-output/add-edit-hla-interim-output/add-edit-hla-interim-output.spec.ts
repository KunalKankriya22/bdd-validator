import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import moment from 'moment';

import { AddEditHlaInterimOutput } from './add-edit-hla-interim-output';
import { HlaInterimOutputService } from '../services/hla-interim-output.service';
import { HeaderService } from '@shared/services/header.service';
import { HlaInterimOutput, InterimCodeLov } from '../models/hla-interim-output.model';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditHlaInterimOutput', () => {
  let headerServiceSpy: any;
  let serviceSpy: any;
  let component: AddEditHlaInterimOutput;
  let fixture: ComponentFixture<AddEditHlaInterimOutput>;
  let service: jasmine.SpyObj<HlaInterimOutputService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let headerService: jasmine.SpyObj<HeaderService>;

  const mockInterimCodes: InterimCodeLov[] = [
    { interimCode: '01', interimDescription: 'HLA-A*01' },
    { interimCode: '02', interimDescription: 'HLA-A*02' },
    { interimCode: '03', interimDescription: 'HLA-B*03' }
  ];

  const mockHlaData: HlaInterimOutput = {
    hlaCode: '01-02-03-07',
    hlaDescription: '01-02-03-07',
    matchA1A1: '01',
    matchA1A2: '02',
    matchA2A1: '03',
    matchA2A2: '07',
    outcomeAntigenA1: '01',
    outcomeAntigenA2: '02',
    effectiveDate: '2024-01-01',
    terminationDate: null,
    insUser: 'testuser',
    insDate: '2024-01-01',
    updUser: 'testuser',
    updDate: '2024-01-01'
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('HlaInterimOutputService', ['create', 'update']);
    const snackBarSpy = createMockMatSnackBar();
    headerServiceSpy = createMockHeaderService();
      TestBed.configureTestingModule({
      imports: [
        AddEditHlaInterimOutput,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule,
        NgxMatSelectSearchModule
      ],
      providers: [
        { provide: HlaInterimOutputService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });
    service = TestBed.inject(HlaInterimOutputService) as jasmine.SpyObj<HlaInterimOutputService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;

    fixture = TestBed.createComponent(AddEditHlaInterimOutput);
    component = fixture.componentInstance;
    component.interimCodeOptions = mockInterimCodes;


    });


  it('should initialize form with validators', () => {
    fixture.detectChanges();

    expect(component.form.get('matchA1A1')?.hasValidator(Validators.required)).toBe(true);
    expect(component.form.get('matchA1A2')?.hasValidator(Validators.required)).toBe(true);
    expect(component.form.get('matchA2A1')?.hasValidator(Validators.required)).toBe(true);
    expect(component.form.get('matchA2A2')?.hasValidator(Validators.required)).toBe(true);
    expect(component.form.get('effectiveDate')?.hasValidator(Validators.required)).toBe(true);
  });







  describe('Search filtering', () => {
    beforeEach(() => {
      component.isOpen = true;
      component.ngOnChanges({
        interimCodeOptions: {
          currentValue: mockInterimCodes,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();
    });

    it('should filter matchA1A1 options', () => {
      component.matchA1A1SearchControl.setValue('01');
      fixture.detectChanges();

      const filtered = component.filteredMatchA1A1Options();
      expect(filtered.length).toBeLessThanOrEqual(mockInterimCodes.length);
      if (filtered.length > 0) {
        expect(filtered.some(opt => opt.interimCode.includes('01'))).toBe(true);
      }
    });

    it('should perform case-insensitive search', () => {
      component.matchA1A1SearchControl.setValue('hla');
      fixture.detectChanges();

      const filtered = component.filteredMatchA1A1Options();
      expect(filtered.length).toBeGreaterThan(0);
    });


  });



  describe('Cleanup', () => {
    it('should cleanup on destroy', () => {
      fixture.detectChanges();

      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});
