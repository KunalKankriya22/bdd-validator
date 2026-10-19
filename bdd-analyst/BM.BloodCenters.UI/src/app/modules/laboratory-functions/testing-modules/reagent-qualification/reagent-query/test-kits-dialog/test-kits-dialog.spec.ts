import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { TestKitsDialogComponent, TestKitsDialogData } from './test-kits-dialog';
import { ReagentQueryService } from '../services/reagent-query.service';
import { TestKitDto, TestKitsResponse } from '../models/reagent-query.model';

describe('TestKitsDialogComponent', () => {
  let component: TestKitsDialogComponent;
  let fixture: ComponentFixture<TestKitsDialogComponent>;
  let reagentQueryService: jasmine.SpyObj<ReagentQueryService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<TestKitsDialogComponent>>;

  const mockDialogData: TestKitsDialogData = {
    reagentId: 'RID001',
    testId: 'T001',
  };

  const mockKits: TestKitDto[] = [
    { kitId: '1001', qcStatus: 'QC Complete' },
    { kitId: '1002', qcStatus: 'Pending' },
  ];

  const mockResponse: TestKitsResponse = {
    reagentId: 'RID001',
    kits: mockKits,
  };

  beforeEach(() => {

    reagentQueryService = jasmine.createSpyObj<ReagentQueryService>('ReagentQueryService', ['getTestKits']);
    dialogRef = jasmine.createSpyObj<MatDialogRef<TestKitsDialogComponent>>('MatDialogRef', ['close']);

    reagentQueryService.getTestKits.and.returnValue(of(mockResponse));



      TestBed.configureTestingModule({
      imports: [
        TestKitsDialogComponent,
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


    



    fixture = TestBed.createComponent(TestKitsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should load test kits on init', () => {
    expect(reagentQueryService.getTestKits).toHaveBeenCalledWith('RID001', 'T001');
    expect(component['testKits']()).toEqual(mockKits);
    expect(component['loading']()).toBeFalse();
  });

  it('should auto-select the first kit after loading', () => {
    expect(component['selectedKit']()).toEqual(mockKits[0]);
  });

  it('should not auto-select when kits are empty', () => {
    reagentQueryService.getTestKits.and.returnValue(of({ reagentId: 'RID001', kits: [] }));

    fixture = TestBed.createComponent(TestKitsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component['selectedKit']()).toBeNull();
  });

  it('should update selectedKit when a row is clicked', () => {
    component['onKitRowClick'](mockKits[1]);
    expect(component['selectedKit']()).toEqual(mockKits[1]);
  });

  it('should expose reagentId from dialog data', () => {
    expect(component['reagentId']()).toBe('RID001');
  });

  it('should set isEmpty false when kits are loaded', () => {
    expect(component['isEmpty']()).toBeFalse();
  });

  it('should set error state on API error', () => {
    reagentQueryService.getTestKits.and.returnValue(throwError(() => new Error('Server error')));

    fixture = TestBed.createComponent(TestKitsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component['error']()).toBe('Failed to load test kits. Please try again.');
    expect(component['loading']()).toBeFalse();
    expect(component['testKits']()).toEqual([]);
  });

  it('should set empty kits when response kits is empty', () => {
    reagentQueryService.getTestKits.and.returnValue(of({ reagentId: 'RID001', kits: [] }));

    fixture = TestBed.createComponent(TestKitsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component['testKits']()).toEqual([]);
  });







  it('should disable pagination in table config', () => {
    expect(component['tableConfig'].showPagination).toBeFalse();
  });
});
