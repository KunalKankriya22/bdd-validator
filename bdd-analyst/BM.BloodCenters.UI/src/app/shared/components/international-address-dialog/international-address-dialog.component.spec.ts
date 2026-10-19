import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Component, input, output, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { of } from 'rxjs';

import { InternationalAddressDialogComponent } from './international-address-dialog.component';
import { InternationalAddressService } from '../../services/international-address.service';
import {
  InternationalAddressModel,
  InternationalAddressDialogData
} from '../../models/international-address.model';

@Component({
  selector: 'app-international-address-form',
  standalone: true,
  template: ''
})
class MockInternationalAddressFormComponent {
  existingAddress = input<InternationalAddressModel | null>(null);
  showActions = input<boolean>(true);
  targetTable = input<string | null>(null);
  recordKeyValues = input<string[]>([]);
  chapterId = input<string>('');
  existingAddressId = input<number | null>(null);

  applied = output<InternationalAddressModel>();
  saved = output<number>();
  cancelled = output<void>();

  addressForm = new FormGroup({});
  isSubmitting = signal(false);

  onSubmit(): void {}
  onClear(): void {}
}

describe('InternationalAddressDialogComponent', () => {
  let mockAddressService: any;
  let component: InternationalAddressDialogComponent;
  let fixture: ComponentFixture<InternationalAddressDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<InternationalAddressDialogComponent>>;

  const mockDialogData: InternationalAddressDialogData = {
    existingAddress: {
      streetName: '123 Main St',
      addr1: 'Apt 4B',
      addr2: null,
      addr3: null,
      country: 'United States',
      postalCode: '12345',
      homePhoneNo: null,
      workPhoneNo: null,
      workPhoneExt: null,
      mobilePhoneNo: null,
      faxNo: null,
      email: 'test@example.com',
      intlAddrFlag: 'Y',
      modifiedFlag: 'Y'
    },
    targetTable: 'SPONSOR_CONTACT',
    recordKeyValues: ['1', '2'],
    chapterId: 'CH01',
    existingAddressId: 100
  };

  beforeEach(() => {

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    mockAddressService = jasmine.createSpyObj('InternationalAddressService', ['getCountries']);
    mockAddressService.getCountries.and.returnValue(of([]));



      TestBed.configureTestingModule({
      imports: [InternationalAddressDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: InternationalAddressService, useValue: mockAddressService }
      ]
    })
      .overrideComponent(InternationalAddressDialogComponent, {
        set: {
          imports: [
            MatButtonModule,
            MatIconModule,
            MockInternationalAddressFormComponent
          ]
        }
      });


    


      mockDialogRef.close.calls.reset();


      mockAddressService.getCountries.calls.reset();


      mockAddressService.getCountries.and.returnValue(of([]));


    fixture = TestBed.createComponent(InternationalAddressDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('button label', () => {
    it('should show SAVE when targetTable is provided', () => {
      expect(component.data.targetTable).toBe('SPONSOR_CONTACT');
    });
  });
});

describe('InternationalAddressDialogComponent - local mode (no targetTable)', () => {
  let component: InternationalAddressDialogComponent;
  let fixture: ComponentFixture<InternationalAddressDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<InternationalAddressDialogComponent>>;

  const localDialogData: InternationalAddressDialogData = {
    existingAddress: {
      streetName: '789 Elm St',
      addr1: null,
      addr2: null,
      addr3: null,
      country: 'Germany',
      postalCode: '10115',
      homePhoneNo: null,
      workPhoneNo: null,
      workPhoneExt: null,
      mobilePhoneNo: null,
      faxNo: null,
      email: null,
      intlAddrFlag: 'Y',
      modifiedFlag: 'Y'
    },
    targetTable: null,
    recordKeyValues: [],
    chapterId: '',
    existingAddressId: null
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    const mockAddressService = jasmine.createSpyObj('InternationalAddressService', ['getCountries']);
    mockAddressService.getCountries.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [InternationalAddressDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: localDialogData },
        { provide: InternationalAddressService, useValue: mockAddressService }
      ]
    })
      .overrideComponent(InternationalAddressDialogComponent, {
        set: {
          imports: [
            MatButtonModule,
            MatIconModule,
            MockInternationalAddressFormComponent
          ]
        }
      });

    fixture = TestBed.createComponent(InternationalAddressDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create in local mode', () => {
    expect(component).toBeTruthy();
    expect(component.data.targetTable).toBeNull();
  });



  it('should close dialog with address data on apply (no DB save)', () => {
    const addressData: InternationalAddressModel = {
      streetName: '789 Elm St',
      addr1: null,
      addr2: null,
      addr3: null,
      country: 'Germany',
      postalCode: '10115',
      homePhoneNo: null,
      workPhoneNo: null,
      workPhoneExt: null,
      mobilePhoneNo: null,
      faxNo: null,
      email: null,
      intlAddrFlag: 'Y',
      modifiedFlag: 'Y'
    };

    component.onApplied(addressData);

    expect(mockDialogRef.close).toHaveBeenCalledOnceWith(addressData);
  });

  it('should pre-populate existing address data', () => {
    expect(component.data.existingAddress?.streetName).toBe('789 Elm St');
    expect(component.data.existingAddress?.country).toBe('Germany');
  });
});
