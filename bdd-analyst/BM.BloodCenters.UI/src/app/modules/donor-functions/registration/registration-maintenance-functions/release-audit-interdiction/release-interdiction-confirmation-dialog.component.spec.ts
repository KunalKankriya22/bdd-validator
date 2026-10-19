import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import {
  ReleaseInterdictionConfirmationDialogComponent,
  ReleaseInterdictionConfirmationDialogData
} from './release-interdiction-confirmation-dialog.component';
import { Interdiction } from './release-audit-interdiction.models';

describe('ReleaseInterdictionConfirmationDialogComponent', () => {
  let component: ReleaseInterdictionConfirmationDialogComponent;
  let fixture: ComponentFixture<ReleaseInterdictionConfirmationDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ReleaseInterdictionConfirmationDialogComponent>>;

  const mockInterdiction: Interdiction = {
    interCode: 'BPHLD',
    interType: 'HOLD S',
    effectiveDate: '2020-01-21',
    terminationDate: '2026-02-25',
    releaseDate: null,
    releasedUser: '',
    insertedUser: 'ET1234',
    originated: 'INQR',
    reason: 'TATTO',
    groupMode: '',
    groupId: 'HQ0250',
    interDescription: 'Blood Pressure Hold',
    reasonRequired: false,
    isPermanentDeferral: false,
    canRelease: true,
    canRemove: false
  };

  const mockDialogData: ReleaseInterdictionConfirmationDialogData = {
    interdiction: mockInterdiction
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [ReleaseInterdictionConfirmationDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    });

    fixture = TestBed.createComponent(ReleaseInterdictionConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── Initialization ─────────────────────────────────────────────

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should inject dialog data with interdiction', () => {
      expect(component.data).toEqual(mockDialogData);
      expect(component.data.interdiction).toEqual(mockInterdiction);
    });

    it('should have the interdiction code accessible', () => {
      expect(component.data.interdiction.interCode).toBe('BPHLD');
    });

    it('should have the originated value accessible', () => {
      expect(component.data.interdiction.originated).toBe('INQR');
    });

    it('should have the reason value accessible', () => {
      expect(component.data.interdiction.reason).toBe('TATTO');
    });
  });

  // ─── Dialog Actions ─────────────────────────────────────────────

  describe('Dialog Actions', () => {
    it('should close the dialog with true when onYes is called', () => {
      component.onYes();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });

    it('should close the dialog with false when onNo is called', () => {
      component.onNo();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
    });

    it('should only call close once for onYes', () => {
      component.onYes();
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
    });

    it('should only call close once for onNo', () => {
      component.onNo();
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Template Rendering ─────────────────────────────────────────

  describe('Template Rendering', () => {
    it('should display the dialog title', () => {
      const title = fixture.nativeElement.querySelector('h2[mat-dialog-title]');
      expect(title).toBeTruthy();
      expect(title.textContent).toContain('Interdiction release alert');
    });

    it('should display the interdiction code in the message', () => {
      const content = fixture.nativeElement.querySelector('mat-dialog-content p');
      expect(content.textContent).toContain('[BPHLD]');
    });

    it('should display the originated value in the message', () => {
      const content = fixture.nativeElement.querySelector('mat-dialog-content p');
      expect(content.textContent).toContain('INQR');
    });

    it('should display the reason value in the message', () => {
      const content = fixture.nativeElement.querySelector('mat-dialog-content p');
      expect(content.textContent).toContain('TATTO');
    });

    it('should have a NO, CANCEL button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const cancelButton = Array.from(buttons).find(
        (btn: any) => btn.textContent.trim().includes('NO, CANCEL')
      );
      expect(cancelButton).toBeTruthy();
    });

    it('should have a YES button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const yesButton = Array.from(buttons).find(
        (btn: any) => btn.textContent.trim().includes('YES')
      );
      expect(yesButton).toBeTruthy();
    });

    it('should call onNo when NO, CANCEL button is clicked', () => {
      spyOn(component, 'onNo');
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const cancelButton = Array.from(buttons).find(
        (btn: any) => btn.textContent.trim().includes('NO, CANCEL')
      ) as HTMLButtonElement;
      cancelButton.click();
      expect(component.onNo).toHaveBeenCalled();
    });

    it('should call onYes when YES button is clicked', () => {
      spyOn(component, 'onYes');
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const yesButton = Array.from(buttons).find(
        (btn: any) => btn.textContent.trim().includes('YES')
      ) as HTMLButtonElement;
      yesButton.click();
      expect(component.onYes).toHaveBeenCalled();
    });
  });

  // ─── Edge Cases ─────────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('should handle interdiction with empty originated', () => {
      const dataWithEmpty: ReleaseInterdictionConfirmationDialogData = {
        interdiction: { ...mockInterdiction, originated: '' }
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ReleaseInterdictionConfirmationDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
          { provide: MAT_DIALOG_DATA, useValue: dataWithEmpty }
        ]
      });

      const emptyFixture = TestBed.createComponent(ReleaseInterdictionConfirmationDialogComponent);
      emptyFixture.detectChanges();

      const content = emptyFixture.nativeElement.querySelector('mat-dialog-content p');
      expect(content.textContent).toContain('[BPHLD]');
    });

    it('should handle interdiction with empty reason', () => {
      const dataWithEmpty: ReleaseInterdictionConfirmationDialogData = {
        interdiction: { ...mockInterdiction, reason: '' }
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ReleaseInterdictionConfirmationDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
          { provide: MAT_DIALOG_DATA, useValue: dataWithEmpty }
        ]
      });

      const emptyFixture = TestBed.createComponent(ReleaseInterdictionConfirmationDialogComponent);
      emptyFixture.detectChanges();

      const content = emptyFixture.nativeElement.querySelector('mat-dialog-content p');
      expect(content.textContent).toContain('[BPHLD]');
    });
  });
});
