import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { AddressDetailsDialogComponent } from './address-details-dialog.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AddressDetailsDialogComponent', () => {
  let component: AddressDetailsDialogComponent;
  let fixture: ComponentFixture<AddressDetailsDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddressDetailsDialogComponent>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [AddressDetailsDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddressDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });




  it('should require country', () => {
    const country = component.form.get('country');
    // Country has a default value of 'US', so it is valid initially
    expect(country?.hasError('required')).toBe(false);

    // Clearing it should trigger the required error
    country?.setValue('');
    expect(country?.hasError('required')).toBe(true);

    country?.setValue('US');
    expect(country?.hasError('required')).toBe(false);
  });



  it('should clear all fields', () => {
    component.form.patchValue({
      addressLine1: '123 Main St',
      city: 'Test City',
      state: 'CA'
    });

    component.onClearAll();

    // form.reset() sets fields not in the reset object to null
    expect(component.form.get('addressLine1')?.value).toBeNull();
    expect(component.form.get('city')?.value).toBeNull();
  });



});
