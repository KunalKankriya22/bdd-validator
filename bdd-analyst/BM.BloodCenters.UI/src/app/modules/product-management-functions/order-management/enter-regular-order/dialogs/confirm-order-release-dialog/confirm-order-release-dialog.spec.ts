import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';

import { ConfirmOrderReleaseDialogComponent } from './confirm-order-release-dialog';

describe('ConfirmOrderReleaseDialogComponent', () => {
  let component: ConfirmOrderReleaseDialogComponent;
  let fixture: ComponentFixture<ConfirmOrderReleaseDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ConfirmOrderReleaseDialogComponent>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ConfirmOrderReleaseDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmOrderReleaseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── Component creation ───────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Dialog title ─────────────────────────────────────────────────

  describe('dialog title', () => {
    it('should display "Confirm Order Release" as the dialog title', () => {
      const titleEl = fixture.nativeElement.querySelector('[mat-dialog-title], h2');
      expect(titleEl).toBeTruthy();
      expect(titleEl.textContent).toContain('Confirm Order Release');
    });
  });

  // ─── Dialog content ───────────────────────────────────────────────

  describe('dialog content', () => {
    it('should display the confirmation question', () => {
      const contentEl = fixture.nativeElement.querySelector('mat-dialog-content');
      expect(contentEl).toBeTruthy();
      expect(contentEl.textContent).toContain('Are you sure you want to release this order for allocation?');
    });

    it('should display the action description', () => {
      const contentEl = fixture.nativeElement.querySelector('mat-dialog-content');
      expect(contentEl.textContent).toContain('This action will proceed with assigning the order accordingly.');
    });
  });

  // ─── Buttons ──────────────────────────────────────────────────────

  describe('buttons', () => {
    it('should have a cancel button with label "NO, CANCEL"', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const cancelButton = Array.from(buttons).find(
        (btn: any) => btn.textContent.trim() === 'NO, CANCEL'
      );
      expect(cancelButton).toBeTruthy();
    });

    it('should have a confirm button with label "YES, RELEASE ORDER"', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const confirmButton = Array.from(buttons).find(
        (btn: any) => btn.textContent.trim() === 'YES, RELEASE ORDER'
      );
      expect(confirmButton).toBeTruthy();
    });

    it('should have the confirm button styled as primary', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button[mat-raised-button]');
      const primaryButton = Array.from(buttons).find(
        (btn: any) => btn.getAttribute('color') === 'primary'
      );
      expect(primaryButton).toBeTruthy();
    });
  });

  // ─── onConfirm ────────────────────────────────────────────────────

  describe('onConfirm', () => {
    it('should close dialog with true on confirm', () => {
      component.onConfirm();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });

    it('should close dialog exactly once on confirm', () => {
      component.onConfirm();
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
    });
  });

  // ─── onCancel ─────────────────────────────────────────────────────

  describe('onCancel', () => {
    it('should close dialog with false on cancel', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
    });

    it('should close dialog exactly once on cancel', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
    });
  });
});
