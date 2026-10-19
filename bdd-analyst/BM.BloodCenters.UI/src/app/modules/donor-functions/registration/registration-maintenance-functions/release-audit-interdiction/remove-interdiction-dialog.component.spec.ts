import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';

import {
  RemoveInterdictionDialogComponent,
  RemoveInterdictionDialogData
} from './remove-interdiction-dialog.component';
import { Interdiction, RemovalReason } from './release-audit-interdiction.models';
import { ReleaseAuditInterdictionService } from './release-audit-interdiction.service';

describe('RemoveInterdictionDialogComponent', () => {
  let component: RemoveInterdictionDialogComponent;
  let fixture: ComponentFixture<RemoveInterdictionDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<RemoveInterdictionDialogComponent>>;
  let serviceSpy: jasmine.SpyObj<ReleaseAuditInterdictionService>;

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

  const mockRemovalReasons: RemovalReason[] = [
    { code: 'R01', description: 'Reason one' },
    { code: 'R02', description: 'Reason two' },
    { code: 'R03', description: 'Reason three' }
  ];

  function createComponent(dialogData: RemoveInterdictionDialogData): void {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: dialogData });
    TestBed.compileComponents();

    fixture = TestBed.createComponent(RemoveInterdictionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    serviceSpy = jasmine.createSpyObj('ReleaseAuditInterdictionService', ['getRemovalReasons']);
    serviceSpy.getRemovalReasons.and.returnValue(of(mockRemovalReasons));

    await TestBed.configureTestingModule({
      imports: [
        RemoveInterdictionDialogComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { interdiction: mockInterdiction, reasonRequired: false } },
        { provide: ReleaseAuditInterdictionService, useValue: serviceSpy }
      ]
    }).compileComponents();

    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<RemoveInterdictionDialogComponent>>;
    fixture = TestBed.createComponent(RemoveInterdictionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── Initialization ─────────────────────────────────────────────

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should inject dialog data', () => {
      expect(component.data.interdiction).toEqual(mockInterdiction);
      expect(component.data.reasonRequired).toBeFalse();
    });

    it('should initialize the form with termDate set to today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(component.form).toBeTruthy();
      expect(component.form.get('termDate')?.value).toBe(today);
    });

    it('should initialize reasonCode as empty string', () => {
      expect(component.form.get('reasonCode')?.value).toBe('');
    });

    it('should call getRemovalReasons on init', () => {
      expect(serviceSpy.getRemovalReasons).toHaveBeenCalled();
    });

    it('should populate removalReasons signal after loading', () => {
      expect(component.removalReasons()).toEqual(mockRemovalReasons);
    });

    it('should set loadingReasons to false after reasons load', () => {
      expect(component.loadingReasons()).toBeFalse();
    });
  });

  // ─── Form Validation (reasonRequired = false) ───────────────────

  describe('Form Validation - reason not required', () => {
    it('should not require reasonCode when reasonRequired is false', () => {
      expect(component.form.get('reasonCode')?.valid).toBeTrue();
    });

    it('should require termDate', () => {
      component.form.get('termDate')?.setValue('');
      expect(component.form.get('termDate')?.hasError('required')).toBeTrue();
    });

    it('should be valid when termDate is set and reasonCode is optional', () => {
      expect(component.form.valid).toBeTrue();
    });

    it('should be invalid when termDate is cleared', () => {
      component.form.get('termDate')?.setValue('');
      expect(component.form.invalid).toBeTrue();
    });
  });

  // ─── Form Validation (reasonRequired = true) ────────────────────

  describe('Form Validation - reason required', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      serviceSpy = jasmine.createSpyObj('ReleaseAuditInterdictionService', ['getRemovalReasons']);
      serviceSpy.getRemovalReasons.and.returnValue(of(mockRemovalReasons));

      TestBed.configureTestingModule({
        imports: [
          RemoveInterdictionDialogComponent,
          NoopAnimationsModule,
          HttpClientTestingModule,
          ReactiveFormsModule,
          MatDialogModule,
          MatButtonModule,
          MatFormFieldModule,
          MatInputModule,
          MatSelectModule,
          MatProgressSpinnerModule,
          TranslateModule.forRoot()
        ],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: { interdiction: mockInterdiction, reasonRequired: true } },
          { provide: ReleaseAuditInterdictionService, useValue: serviceSpy }
        ]
      }).compileComponents();

      dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<RemoveInterdictionDialogComponent>>;
      fixture = TestBed.createComponent(RemoveInterdictionDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should require reasonCode when reasonRequired is true', () => {
      expect(component.form.get('reasonCode')?.hasError('required')).toBeTrue();
    });

    it('should be invalid when reasonCode is empty and required', () => {
      expect(component.form.invalid).toBeTrue();
    });

    it('should be valid when reasonCode and termDate are both set', () => {
      component.form.get('reasonCode')?.setValue('R01');
      expect(component.form.valid).toBeTrue();
    });
  });

  // ─── isPermanent ────────────────────────────────────────────────

  describe('isPermanent', () => {
    it('should return false when isPermanentDeferral is false', () => {
      expect(component.isPermanent()).toBeFalse();
    });

    it('should return true when isPermanentDeferral is true', () => {
      TestBed.resetTestingModule();
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      const svcSpy = jasmine.createSpyObj('ReleaseAuditInterdictionService', ['getRemovalReasons']);
      svcSpy.getRemovalReasons.and.returnValue(of([]));

      const permanentInterdiction: Interdiction = {
        ...mockInterdiction,
        isPermanentDeferral: true
      };

      TestBed.configureTestingModule({
        imports: [
          RemoveInterdictionDialogComponent,
          NoopAnimationsModule,
          HttpClientTestingModule,
          ReactiveFormsModule,
          MatDialogModule,
          MatButtonModule,
          MatFormFieldModule,
          MatInputModule,
          MatSelectModule,
          MatProgressSpinnerModule,
          TranslateModule.forRoot()
        ],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: { interdiction: permanentInterdiction, reasonRequired: false } },
          { provide: ReleaseAuditInterdictionService, useValue: svcSpy }
        ]
      }).compileComponents();

      const permFixture = TestBed.createComponent(RemoveInterdictionDialogComponent);
      const permComponent = permFixture.componentInstance;
      permFixture.detectChanges();

      expect(permComponent.isPermanent()).toBeTrue();
    });
  });

  // ─── Removal Reasons Loading ────────────────────────────────────

  describe('Removal Reasons Loading', () => {
    it('should set loadingReasons to true during loading', fakeAsync(() => {
      const reasonsSubject = new Subject<RemovalReason[]>();
      serviceSpy.getRemovalReasons.and.returnValue(reasonsSubject.asObservable());

      TestBed.resetTestingModule();
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

      TestBed.configureTestingModule({
        imports: [
          RemoveInterdictionDialogComponent,
          NoopAnimationsModule,
          HttpClientTestingModule,
          ReactiveFormsModule,
          MatDialogModule,
          MatButtonModule,
          MatFormFieldModule,
          MatInputModule,
          MatSelectModule,
          MatProgressSpinnerModule,
          TranslateModule.forRoot()
        ],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: { interdiction: mockInterdiction, reasonRequired: false } },
          { provide: ReleaseAuditInterdictionService, useValue: serviceSpy }
        ]
      }).compileComponents();

      const loadFixture = TestBed.createComponent(RemoveInterdictionDialogComponent);
      const loadComponent = loadFixture.componentInstance;
      loadFixture.detectChanges();

      expect(loadComponent.loadingReasons()).toBeTrue();

      reasonsSubject.next(mockRemovalReasons);
      reasonsSubject.complete();
      tick();

      expect(loadComponent.loadingReasons()).toBeFalse();
      expect(loadComponent.removalReasons()).toEqual(mockRemovalReasons);
    }));

    it('should set loadingReasons to false on error', fakeAsync(() => {
      TestBed.resetTestingModule();
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      const errorServiceSpy = jasmine.createSpyObj('ReleaseAuditInterdictionService', ['getRemovalReasons']);
      errorServiceSpy.getRemovalReasons.and.returnValue(throwError(() => new Error('Network error')));

      TestBed.configureTestingModule({
        imports: [
          RemoveInterdictionDialogComponent,
          NoopAnimationsModule,
          HttpClientTestingModule,
          ReactiveFormsModule,
          MatDialogModule,
          MatButtonModule,
          MatFormFieldModule,
          MatInputModule,
          MatSelectModule,
          MatProgressSpinnerModule,
          TranslateModule.forRoot()
        ],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: { interdiction: mockInterdiction, reasonRequired: false } },
          { provide: ReleaseAuditInterdictionService, useValue: errorServiceSpy }
        ]
      }).compileComponents();

      const errFixture = TestBed.createComponent(RemoveInterdictionDialogComponent);
      const errComponent = errFixture.componentInstance;
      errFixture.detectChanges();
      tick();

      expect(errComponent.loadingReasons()).toBeFalse();
      expect(errComponent.removalReasons()).toEqual([]);
    }));
  });

  // ─── onRemove ───────────────────────────────────────────────────

  describe('onRemove', () => {
    it('should close dialog with result when form is valid', () => {
      const today = new Date().toISOString().split('T')[0];
      component.form.get('reasonCode')?.setValue('R01');

      component.onRemove();

      expect(dialogRef.close).toHaveBeenCalledWith({
        confirmed: true,
        reasonCode: 'R01',
        termDate: today
      });
    });

    it('should close dialog with null reasonCode when reasonCode is empty', () => {
      const today = new Date().toISOString().split('T')[0];

      component.onRemove();

      expect(dialogRef.close).toHaveBeenCalledWith({
        confirmed: true,
        reasonCode: null,
        termDate: today
      });
    });

    it('should mark all fields as touched when form is invalid', () => {
      component.form.get('termDate')?.setValue('');
      spyOn(component.form, 'markAllAsTouched');

      component.onRemove();

      expect(component.form.markAllAsTouched).toHaveBeenCalled();
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should not close dialog when form is invalid', () => {
      component.form.get('termDate')?.setValue('');

      component.onRemove();

      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should use the custom termDate value from the form', () => {
      component.form.get('termDate')?.setValue('2026-12-31');

      component.onRemove();

      expect(dialogRef.close).toHaveBeenCalledWith(jasmine.objectContaining({
        termDate: '2026-12-31'
      }));
    });
  });

  // ─── onClose ────────────────────────────────────────────────────

  describe('onClose', () => {
    it('should close the dialog with null', () => {
      component.onClose();
      expect(dialogRef.close).toHaveBeenCalledWith(null);
    });

    it('should only call close once', () => {
      component.onClose();
      expect(dialogRef.close).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Template Rendering ─────────────────────────────────────────

  describe('Template Rendering', () => {
    it('should display the dialog title', () => {
      const title = fixture.nativeElement.querySelector('h2[mat-dialog-title]');
      expect(title).toBeTruthy();
      expect(title.textContent).toContain('Remove Interdiction');
    });

    it('should display the interdiction code', () => {
      const content = fixture.nativeElement.querySelector('mat-dialog-content');
      expect(content.textContent).toContain('BPHLD');
    });

    it('should display the originated value', () => {
      const content = fixture.nativeElement.querySelector('mat-dialog-content');
      expect(content.textContent).toContain('INQR');
    });

    it('should display the reason value', () => {
      const content = fixture.nativeElement.querySelector('mat-dialog-content');
      expect(content.textContent).toContain('TATTO');
    });

    it('should have a CLOSE button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const closeButton = Array.from(buttons).find(
        (btn: any) => btn.textContent.trim().includes('CLOSE')
      );
      expect(closeButton).toBeTruthy();
    });

    it('should have a REMOVE button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const removeButton = Array.from(buttons).find(
        (btn: any) => btn.textContent.trim().includes('REMOVE')
      );
      expect(removeButton).toBeTruthy();
    });
  });
});
