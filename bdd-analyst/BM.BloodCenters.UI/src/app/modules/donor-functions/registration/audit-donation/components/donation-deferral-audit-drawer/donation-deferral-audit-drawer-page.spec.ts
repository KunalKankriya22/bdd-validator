import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { DonationDeferralAuditDrawerPageComponent } from './donation-deferral-audit-drawer-page';
import { DonationDeferralAuditDrawerComponent } from './donation-deferral-audit-drawer';

describe('DonationDeferralAuditDrawerPageComponent', () => {
  let component: DonationDeferralAuditDrawerPageComponent;
  let fixture: ComponentFixture<DonationDeferralAuditDrawerPageComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  /** Helper: create a dialogRef spy whose afterClosed emits undefined */
  function makeDialogRef(): jasmine.SpyObj<MatDialogRef<any>> {
    const ref = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed', 'close']);
    ref.afterClosed.and.returnValue(of(undefined));
    return ref;
  }

  beforeEach(async () => {
    const dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        DonationDeferralAuditDrawerPageComponent,
        NoopAnimationsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatDialogModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: MatDialog, useValue: dialogSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    fixture = TestBed.createComponent(DonationDeferralAuditDrawerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  // ---------------------------------------------------------------------------
  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize searchForm with a required transactionId control', () => {
      const ctrl = component.searchForm.get('transactionId');
      expect(ctrl).toBeTruthy();
      ctrl!.setValue('');
      expect(ctrl!.valid).toBe(false);
      ctrl!.setValue('TR001');
      expect(ctrl!.valid).toBe(true);
    });

    it('should expose form controls via f getter', () => {
      expect(component.f['transactionId']).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  describe('openDrawer — invalid form', () => {
    it('should markAllAsTouched and NOT open dialog when form is invalid', () => {
      component.searchForm.patchValue({ transactionId: '' });
      component.openDrawer();
      expect(component.f['transactionId'].touched).toBe(true);
      expect(mockDialog.open).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  describe('openDrawer — valid form', () => {
    it('should open DonationDeferralAuditDrawerComponent dialog with correct transactionId', () => {
      mockDialog.open.and.returnValue(makeDialogRef());
      component.searchForm.patchValue({ transactionId: 'TR02867427' });

      component.openDrawer();

      expect(mockDialog.open).toHaveBeenCalledWith(
        DonationDeferralAuditDrawerComponent,
        jasmine.objectContaining({
          data: { transactionId: 'TR02867427' },
        })
      );
    });

    it('should pass correct dialog dimensions', () => {
      mockDialog.open.and.returnValue(makeDialogRef());
      component.searchForm.patchValue({ transactionId: 'TR001' });

      component.openDrawer();

      const openArgs = mockDialog.open.calls.mostRecent().args[1] as any;
      expect(openArgs.width).toBe('1000px');
      expect(openArgs.position).toEqual({ right: '0', top: '64px' });
    });
  });

  // ---------------------------------------------------------------------------
  describe('ngOnDestroy', () => {
    it('should call destroy$.next() and destroy$.complete()', () => {
      const nextSpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
