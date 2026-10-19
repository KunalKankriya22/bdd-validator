import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { TestServiceCheckInComponent } from './test-service-check-in.component';
import { TestServiceCheckInApiService } from './services/test-service-check-in-api.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { HeaderService } from '../../../shared/services/header.service';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('TestServiceCheckInComponent', () => {
  let component: TestServiceCheckInComponent;
  let fixture: ComponentFixture<TestServiceCheckInComponent>;
  let mockApiService: jasmine.SpyObj<TestServiceCheckInApiService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('TestServiceCheckInApiService', [
      'validateContract',
      'getOpenBatches',
      'generateBatchId',
      'getContractTests',
      'checkInUnits',
      'validateUnitId'
    ]);

    mockSnackbarService = createMockSnackbarService();

    mockHeaderService = createMockHeaderService();

    await TestBed.configureTestingModule({
      imports: [
        TestServiceCheckInComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: TestServiceCheckInApiService, useValue: mockApiService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestServiceCheckInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should validate contract on blur', () => {
    const mockContract = {
      contractId: 'TS12345',
      company: 'Test Company',
      barCodeProtocol: 'X' as const,
      ediInputInd: 'N' as const,
      redTubeCount: 2,
      purpleTubeCount: 2,
      effDate: new Date(),
      termDate: null
    };

    mockApiService.validateContract.and.returnValue(of(mockContract));

    component.checkInForm.patchValue({ contractId: 'TS12345' });
    component.onContractBlur();

    expect(mockApiService.validateContract).toHaveBeenCalledWith('TS12345');
    expect(component.selectedContract()).toEqual(mockContract);
  });

  it('should handle contract validation error', () => {
    mockApiService.validateContract.and.returnValue(
      throwError(() => ({ error: { message: 'Contract not found' } }))
    );

    component.checkInForm.patchValue({ contractId: 'INVALID' });
    component.onContractBlur();

    expect(component.selectedContract()).toBeNull();
    expect(mockSnackbarService.showError).toHaveBeenCalled();
  });

});
