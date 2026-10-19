import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CustomerMismatchDialogComponent, CustomerMismatchDialogData } from './customer-mismatch-dialog';

describe('CustomerMismatchDialogComponent', () => {
  let component: CustomerMismatchDialogComponent;
  let fixture: ComponentFixture<CustomerMismatchDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CustomerMismatchDialogComponent>>;

  const mockDialogData: CustomerMismatchDialogData = {
    returnedFromId: 'CUST001',
    returnedFromName: 'Hospital A',
    shippedToId: 'CUST002',
    shippedToName: 'Hospital B',
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [CustomerMismatchDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerMismatchDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize returnAnyway to true', () => {
    expect(component.returnAnyway).toBeTrue();
  });

  it('should expose dialog data', () => {
    expect(component.data.returnedFromId).toBe('CUST001');
    expect(component.data.returnedFromName).toBe('Hospital A');
    expect(component.data.shippedToId).toBe('CUST002');
    expect(component.data.shippedToName).toBe('Hospital B');
  });

  it('should close dialog with null on cancel', () => {
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
  });

  it('should close dialog with proceed true when returnAnyway is checked', () => {
    component.returnAnyway = true;
    component.onReturn();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ proceed: true });
  });

  it('should close dialog with proceed false when returnAnyway is unchecked', () => {
    component.returnAnyway = false;
    component.onReturn();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ proceed: false });
  });

  it('should allow toggling returnAnyway checkbox', () => {
    component.returnAnyway = false;
    expect(component.returnAnyway).toBeFalse();
    component.returnAnyway = true;
    expect(component.returnAnyway).toBeTrue();
  });
});
