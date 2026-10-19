import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import {
  LinkUnitWarningDialogComponent,
  LinkUnitWarningDialogData,
} from './link-unit-warning-dialog';

describe('LinkUnitWarningDialogComponent', () => {
  let component: LinkUnitWarningDialogComponent;
  let fixture: ComponentFixture<LinkUnitWarningDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<LinkUnitWarningDialogComponent>>;

  const singleWarningData: LinkUnitWarningDialogData = {
    warnings: [
      { warningCode: 'SAME_PATIENT_UNIT', message: 'Unit is already linked to another donor for same Patient.' }
    ]
  };

  const multipleWarningsData: LinkUnitWarningDialogData = {
    warnings: [
      { warningCode: 'SAME_PATIENT_UNIT', message: 'Unit is already linked to another donor for same Patient.' },
      { warningCode: 'DONOR_NOT_ASSOCIATED', message: 'Corresponding donor is not associated with this patient.' }
    ]
  };

  function createComponent(data: LinkUnitWarningDialogData): void {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [LinkUnitWarningDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    });

    fixture = TestBed.createComponent(LinkUnitWarningDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('with single warning', () => {
    beforeEach(() => createComponent(singleWarningData));

    it('should display warning title', () => {
      const title = fixture.nativeElement.querySelector('.dialog-title');
      expect(title.textContent.trim()).toBe('Warning');
    });

    it('should display the warning message', () => {
      const messages = fixture.nativeElement.querySelectorAll('.warning-message');
      expect(messages.length).toBe(1);
      expect(messages[0].textContent).toContain('Unit is already linked to another donor for same Patient.');
    });


    it('should show confirmation text', () => {
      const text = fixture.nativeElement.querySelector('.confirmation-text p');
      expect(text.textContent.trim()).toBe('Do you want to continue?');
    });

    it('should have No button on the left and Yes button on the right', () => {
      const buttons = fixture.nativeElement.querySelectorAll('.dialog-actions button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent.trim()).toBe('No');
      expect(buttons[1].textContent.trim()).toBe('Yes');
    });






    it('should have warning icon', () => {
      const icon = fixture.nativeElement.querySelector('.warning-icon');
      expect(icon).toBeTruthy();
      expect(icon.textContent.trim()).toBe('warning');
    });
  });

  describe('with multiple warnings', () => {
    beforeEach(() => createComponent(multipleWarningsData));

    it('should display all warning messages', () => {
      const messages = fixture.nativeElement.querySelectorAll('.warning-message');
      expect(messages.length).toBe(2);
    });

    it('should display correct labels for each warning code', () => {
      const strongs = fixture.nativeElement.querySelectorAll('.warning-message strong');
      expect(strongs[0].textContent.trim()).toContain('SAME PATIENT UNIT');
      expect(strongs[1].textContent.trim()).toContain('DONOR NOT ASSOCIATED');
    });
  });

  describe('getWarningLabel', () => {
    beforeEach(() => createComponent(singleWarningData));

    it('should return correct label for SAME_PATIENT_UNIT', () => {
      expect(component['getWarningLabel']('SAME_PATIENT_UNIT')).toBe('SAME PATIENT UNIT');
    });

    it('should return correct label for DIFFERENT_DONOR_UNIT', () => {
      expect(component['getWarningLabel']('DIFFERENT_DONOR_UNIT')).toBe('DIFFERENT DONOR UNIT');
    });

    it('should return correct label for DONOR_NOT_ASSOCIATED', () => {
      expect(component['getWarningLabel']('DONOR_NOT_ASSOCIATED')).toBe('DONOR NOT ASSOCIATED');
    });

    it('should return correct label for UNREGISTERED_UNIT', () => {
      expect(component['getWarningLabel']('UNREGISTERED_UNIT')).toBe('UNREGISTERED UNIT');
    });

    it('should return WARNING for unknown code', () => {
      expect(component['getWarningLabel']('UNKNOWN_CODE')).toBe('WARNING');
    });
  });

});
