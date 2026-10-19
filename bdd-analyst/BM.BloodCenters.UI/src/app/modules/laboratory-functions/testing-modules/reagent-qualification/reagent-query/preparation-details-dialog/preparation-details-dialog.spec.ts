import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { PreparationDetailsDialogComponent, PreparationDetailsDialogData } from './preparation-details-dialog';
import { ReagentQueryService } from '../services/reagent-query.service';
import { PreparationDetailDto } from '../models/reagent-query.model';

describe('PreparationDetailsDialogComponent', () => {
  let component: PreparationDetailsDialogComponent;
  let fixture: ComponentFixture<PreparationDetailsDialogComponent>;
  let reagentQueryService: jasmine.SpyObj<ReagentQueryService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<PreparationDetailsDialogComponent>>;

  const mockDialogData: PreparationDetailsDialogData = {
    reagentId: 'RID001',
  };

  const mockDetails: PreparationDetailDto[] = [
    {
      reagentId: 'RID001',
      reagentName: 'Reagent One',
      reagentType: 'Type A',
      expiryDate: '2025-01-15T10:30:00',
      lotNumber: 'LOT001',
      quantity: '5',
    },
    {
      reagentId: 'RID002',
      reagentName: 'Reagent Two',
      reagentType: 'Type B',
      expiryDate: '2025-06-01T00:00:00',
      lotNumber: 'LOT002',
      quantity: '10',
    },
  ];

  beforeEach(() => {

    reagentQueryService = jasmine.createSpyObj<ReagentQueryService>('ReagentQueryService', ['getPreparationDetails']);
    dialogRef = jasmine.createSpyObj<MatDialogRef<PreparationDetailsDialogComponent>>('MatDialogRef', ['close']);

    reagentQueryService.getPreparationDetails.and.returnValue(of(mockDetails));



      TestBed.configureTestingModule({
imports: [
        PreparationDetailsDialogComponent,
        NoopAnimationsModule,
        MatDialogModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ReagentQueryService, useValue: reagentQueryService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    });


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(PreparationDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  it('should load preparation details on init', () => {
    expect(reagentQueryService.getPreparationDetails).toHaveBeenCalledWith('RID001');
    expect(component['details']()).toEqual(mockDetails);
    expect(component['loading']()).toBeFalse();
    expect(component['error']()).toBeNull();
  });

  it('should expose reagentId from dialog data', () => {
    expect(component['reagentId']()).toBe('RID001');
  });

  it('should set isEmpty false when details are loaded', () => {
    expect(component['isEmpty']()).toBeFalse();
  });


  it('should set error signal on API failure', () => {
    reagentQueryService.getPreparationDetails.and.returnValue(throwError(() => new Error('Server error')));

    fixture = TestBed.createComponent(PreparationDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component['error']()).toBe('Failed to load preparation details. Please try again.');
    expect(component['loading']()).toBeFalse();
    expect(component['details']()).toEqual([]);
  });

  it('should set isEmpty true and error on API failure', () => {
    reagentQueryService.getPreparationDetails.and.returnValue(throwError(() => new Error('Network error')));

    fixture = TestBed.createComponent(PreparationDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component['isEmpty']()).toBeTrue();
    expect(component['error']()).toBeTruthy();
  });



  it('should disable pagination in table config', () => {
    expect(component['tableConfig'].showPagination).toBeFalse();
  });

  it('should disable row highlight in table config', () => {
    expect(component['tableConfig'].enableRowHighlight).toBeFalse();
  });

  describe('formatDateTime (via expiryDate valueFormatter)', () => {
    let expiryFormatter: (v: string | null) => string;

    beforeEach(() => {
      const expiryCol = component['tableConfig'].columns.find(c => c.key === 'expiryDate');
      expiryFormatter = expiryCol!.valueFormatter as (v: string | null) => string;
    });


    it('should format valid date to DD-MMM-YYYY HH:mm', () => {
      const result = expiryFormatter('2025-01-15T10:30:00');
      expect(result).toContain('15-JAN-2025');
      expect(result).toContain('10:30');
    });


  });
});
