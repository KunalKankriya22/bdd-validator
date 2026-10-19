import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AlternateDemographicsDialog } from './alternate-demographics-dialog';

describe('AlternateDemographicsDialog (donor-registration)', () => {
  let component: AlternateDemographicsDialog;
  let fixture: ComponentFixture<AlternateDemographicsDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AlternateDemographicsDialog>>;

  const mockData = {
    mode: 'local' as const,
    localAddress: {
      streetName: '123 Main St',
      suiteApt: 'Apt 4',
      city: 'Boston',
      floor: '2',
      zip: '02101',
      country: 'US'
    },
    internationalAddress: {
      address1: '1234 Strasse',
      address2: '',
      address3: '',
      address4: '',
      city: 'Berlin',
      country: 'Germany',
      postalCode: '10115'
    },
    phoneInfo: {
      mobilePhone: '6175551234',
      otherContact: '',
      alternateIntlPhone: '',
      preferredContact: 'M'
    }
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AlternateDemographicsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize forms from data', () => {
    expect(component).toBeTruthy();
    expect(component.localForm.get('streetName')?.value).toBe('123 Main St');
    expect(component.internationalForm.get('address1')?.value).toBe('1234 Strasse');
    expect(component.phoneForm.get('mobilePhone')?.value).toBe('6175551234');
  });

  it('should default active tab from data mode', () => {
    expect(component.activeTab()).toBe('local');
  });

  it('should switch active tab on onTabChange', () => {
    component.onTabChange(1);
    expect(component.activeTab()).toBe('international');

    component.onTabChange(0);
    expect(component.activeTab()).toBe('local');
  });

  it('should close dialog with form data on onApply', () => {
    component.onApply();

    expect(mockDialogRef.close).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'apply',
        data: expect.objectContaining({
          localAddress: expect.objectContaining({ streetName: '123 Main St' }),
          internationalAddress: expect.objectContaining({ address1: '1234 Strasse' }),
          phoneInfo: expect.objectContaining({ mobilePhone: '6175551234' }),
          mode: 'local'
        })
      })
    );
  });

  it('should reset all forms on onClear', () => {
    component.onClear();

    expect(component.localForm.get('streetName')?.value).toBeNull();
    expect(component.internationalForm.get('address1')?.value).toBeNull();
    expect(component.phoneForm.get('mobilePhone')?.value).toBeNull();
  });

  it('should close dialog with cancel action on onCancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ action: 'cancel' });
  });
});

describe('AlternateDemographicsDialog - no existing data', () => {
  let component: AlternateDemographicsDialog;
  let fixture: ComponentFixture<AlternateDemographicsDialog>;

  beforeEach(async () => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [AlternateDemographicsDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'international' } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AlternateDemographicsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize forms with empty defaults when no data provided', () => {
    expect(component.localForm.get('streetName')?.value).toBe('');
    expect(component.internationalForm.get('address1')?.value).toBe('');
    expect(component.phoneForm.get('mobilePhone')?.value).toBe('');
  });

  it('should set active tab to international from data mode', () => {
    expect(component.activeTab()).toBe('international');
  });
});
