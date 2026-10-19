import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { ContractFormComponent } from './contract-form.component';
import { RegionalTestingContractService } from '../../services/regional-testing-contract.service';
import { RegionalTestingContract } from '../../models/regional-testing-contract.models';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ContractFormComponent', () => {
  let component: ContractFormComponent;
  let fixture: ComponentFixture<ContractFormComponent>;
  let contractServiceSpy: jasmine.SpyObj<RegionalTestingContractService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
  let routeParamsSubject: BehaviorSubject<any>;

  const mockContract: RegionalTestingContract = {
    contractId: 'CNT001',
    chapterId: 'OBK',
    contractType: 'T',
    customerName: 'Test Lab',
    customerId: 'CUST001',
    exportCode: 'US',
    agreementDate: null,
    effDate: '2026-06-01T00:00:00Z',
    termDate: null,
    addressId: 100,
    contactName: 'C',
    lastModifiedDate: '2026-06-16T00:00:00Z',
    programId: 'RGICNTCT',
    auditKey: 1000
  };

  beforeEach(() => {

    contractServiceSpy = jasmine.createSpyObj('RegionalTestingContractService', [
      'getContractById',
      'createContract',
      'updateContract'
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routeParamsSubject = new BehaviorSubject<any>({});
    activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      params: routeParamsSubject.asObservable()
    });



      TestBed.configureTestingModule({
      imports: [ContractFormComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RegionalTestingContractService, useValue: contractServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
      ]
    });


    


      contractServiceSpy.getContractById.calls.reset();


      contractServiceSpy.createContract.calls.reset();


      contractServiceSpy.updateContract.calls.reset();


      routerSpy.navigate.calls.reset();


    fixture = TestBed.createComponent(ContractFormComponent);
    component = fixture.componentInstance;


    });


  describe('Form Initialization', () => {
    it('should initialize Step 1 form with empty values', () => {
      fixture.detectChanges();

      expect(component.contractDetailsForm).toBeTruthy();
      expect(component.step1['contractType'].value).toBe('T');
      expect(component.step1['customerName'].value).toBe('');
      expect(component.step1['customerId'].value).toBe('');
      expect(component.step1['exportCode'].value).toBe('');
    });

    it('should initialize Step 2 form with empty values', () => {
      fixture.detectChanges();

      expect(component.contractTestsForm).toBeTruthy();
      expect(component.step2['showTerminated'].value).toBe('No');
      expect(component.step2['profileSetId'].value).toBe('');
    });

    it('should set default contract type to Testing', () => {
      fixture.detectChanges();

      expect(component.contractDetailsForm.get('contractType')?.value).toBe('T');
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      contractServiceSpy.getContractById.and.returnValue(of(mockContract));
    });



    it('should load contract data in edit mode', () => {
      fixture.detectChanges();
      routeParamsSubject.next({ contractId: 'CNT001' });

      expect(contractServiceSpy.getContractById).toHaveBeenCalledWith('CNT001');
      expect(component.step1['customerName'].value).toBe('Test Lab');
    });
  });

  describe('Step 1 Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should validate customer name max length', () => {
      const longName = 'A'.repeat(101);
      component.contractDetailsForm.patchValue({
        customerName: longName
      });

      expect(component.step1['customerName'].hasError('maxlength')).toBe(true);
    });

    it('should validate customer ID max length', () => {
      const longId = 'A'.repeat(21);
      component.contractDetailsForm.patchValue({
        customerId: longId
      });

      expect(component.step1['customerId'].hasError('maxlength')).toBe(true);
    });

    it('should validate export code max length', () => {
      const longCode = 'A'.repeat(11);
      component.contractDetailsForm.patchValue({
        exportCode: longCode
      });

      expect(component.step1['exportCode'].hasError('maxlength')).toBe(true);
    });
  });

  describe('Profile Tests Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should populate description when test ID changes', () => {
      component.onAddProfileTest();
      const testGroup = component.profileTests.at(0);

      testGroup.patchValue({ testId: 'HIV1' });
      component.onTestIdChange(0);

      expect(testGroup.get('description')?.value).toContain('HIV');
    });
  });

  describe('Save Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.contractDetailsForm.patchValue({
        contractType: 'T',
        customerName: 'New Lab',
        customerId: 'CUST002',
        exportCode: 'CA',
        effDate: new Date('2027-07-01')
      });
    });



    it('should update contract in edit mode', () => {
      (component as any).isEditMode.set(true);
      (component as any).contractId.set('CNT001');
      contractServiceSpy.updateContract.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Contract updated successfully'
      }));

      component.onSaveAndFinish();

      expect(contractServiceSpy.updateContract).toHaveBeenCalledWith(
        'CNT001',
        jasmine.any(Object)
      );
    });




  });
  describe('Scroll to Section', () => {
    it('should scroll to specified section', () => {
      const mockElement = jasmine.createSpyObj('HTMLElement', ['scrollIntoView']);
      spyOn(document, 'getElementById').and.returnValue(mockElement);

      component.scrollToSection('profile-tests');

      expect(document.getElementById).toHaveBeenCalledWith('profile-tests');
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start'
      });
    });
  });
});
