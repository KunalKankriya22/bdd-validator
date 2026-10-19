import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { AddressDialogComponent, AddressDialogData } from './address-dialog';
import { ImportedBloodContractService } from '../imported-blood-contract.service';
import { SnackbarService } from '../../../../shared/services/snackbar.service';

describe('AddressDialogComponent', () => {
  let component: AddressDialogComponent;
  let fixture: ComponentFixture<AddressDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddressDialogComponent>>;
  let serviceSpy: jasmine.SpyObj<ImportedBloodContractService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;

  const defaultDialogData: AddressDialogData = {
    address: null,
    contractId: 'C001',
    contractType: 'IMP',
    currentContract: {
      company: 'TEST_CO',
      barCodeProtocol: 'ISBT',
    },
  };

  function createComponent(data: AddressDialogData = defaultDialogData) {
    TestBed.resetTestingModule();
    serviceSpy = jasmine.createSpyObj('ImportedBloodContractService', [
      'getStateCodes',
      'getCountries',
      'update',
    ]);
    serviceSpy.getStateCodes.and.returnValue(of([
      { code: 'CA', description: 'California' },
      { code: 'NY', description: 'New York' },
    ]));
    serviceSpy.getCountries.and.returnValue(of([
      { code: 'US', description: 'United States' },
    ]));
    serviceSpy.update.and.returnValue(of({ success: true }));

    snackbarSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [AddressDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: ImportedBloodContractService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
      ],
    });

    fixture = TestBed.createComponent(AddressDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    createComponent();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should build the address form with required validators', () => {
    expect(component.addressForm).toBeTruthy();
    expect(component.addressForm.get('addr1')?.hasError('required')).toBeTrue();
    expect(component.addressForm.get('city')?.hasError('required')).toBeTrue();
    expect(component.addressForm.get('zip')?.hasError('required')).toBeTrue();
    expect(component.addressForm.get('country')?.hasError('required')).toBeTrue();
  });

  it('should load state codes on init', () => {
    expect(serviceSpy.getStateCodes).toHaveBeenCalled();
    expect(component.stateCodes().length).toBe(2);
  });

  it('should load countries on init', () => {
    expect(serviceSpy.getCountries).toHaveBeenCalled();
    expect(component.countries().length).toBe(1);
  });

  it('should close dialog with undefined on cancel', () => {
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(undefined);
  });

  it('should not call update when form is invalid on apply', () => {
    component.onApply();
    expect(serviceSpy.update).not.toHaveBeenCalled();
  });

  it('should patch form when address data is provided', () => {
    createComponent({
      ...defaultDialogData,
      address: {
        addressId: 1,
        addr1: '123 Main St',
        city: 'Los Angeles',
        stateCode: 'CA',
        zip: '90001',
        country: 'US',
        intFlag: 'N',
      } as any,
    });

    expect(component.addressForm.get('addr1')?.value).toBe('123 Main St');
    expect(component.addressForm.get('city')?.value).toBe('Los Angeles');
  });

  it('should clear stateCode validators when intFlag is checked', fakeAsync(() => {
    component.addressForm.get('intFlag')?.setValue(true);
    tick();
    component.addressForm.get('stateCode')?.updateValueAndValidity();
    expect(component.addressForm.get('stateCode')?.hasError('required')).toBeFalse();
  }));

  it('should reset form to original values on reset with existing address', () => {
    createComponent({
      ...defaultDialogData,
      address: {
        addressId: 1,
        addr1: '123 Main St',
        city: 'LA',
        stateCode: 'CA',
        zip: '90001',
        country: 'US',
        intFlag: 'N',
      } as any,
    });

    component.addressForm.get('addr1')?.setValue('Changed');
    component.onReset();
    expect(component.addressForm.get('addr1')?.value).toBe('123 Main St');
  });

  it('should call service update and close dialog on successful apply', fakeAsync(() => {
    component.addressForm.patchValue({
      addr1: '456 Oak Ave',
      city: 'San Francisco',
      stateCode: 'CA',
      zip: '94102',
      country: 'US',
    });

    component.onApply();
    tick();

    expect(serviceSpy.update).toHaveBeenCalled();
    expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Address saved successfully');
    expect(dialogRefSpy.close).toHaveBeenCalled();
  }));

  it('should handle state search filtering', () => {
    component.onStateSearchChange('cal');
    const filtered = component.filteredStates();
    expect(filtered.length).toBe(1);
    expect(filtered[0].code).toBe('CA');
  });
});
