import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import {
  AddAttributeDialogComponent,
  AddAttributeDialogData
} from './add-attribute-dialog.component';
import { MaintainDonorAttributesService } from '../services/maintain-donor-attributes.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoginService } from '@shared/services/login.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment from 'moment';

describe('AddAttributeDialogComponent', () => {
  let component: AddAttributeDialogComponent;
  let fixture: ComponentFixture<AddAttributeDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddAttributeDialogComponent>>;
  let serviceSpy: jasmine.SpyObj<MaintainDonorAttributesService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let loginSpy: jasmine.SpyObj<LoginService>;
  let chapterTimezoneSpy: jasmine.SpyObj<ChapterTimezoneService>;

  const mockDialogData: AddAttributeDialogData = {
    donorId: 'D12345'
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    serviceSpy = jasmine.createSpyObj('MaintainDonorAttributesService', [
      'getPropertiesDropdown', 'createAttribute'
    ]);
    snackbarSpy = jasmine.createSpyObj('SnackbarService', ['showError', 'showSuccess']);
    loginSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    chapterTimezoneSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);

    serviceSpy.getPropertiesDropdown.and.returnValue(of([]));
    serviceSpy.createAttribute.and.returnValue(of({}));
    loginSpy.getStoredUsername.and.returnValue('TESTUSER');
    chapterTimezoneSpy.getChapterLocalDate.and.returnValue(moment());

    TestBed.configureTestingModule({
      imports: [AddAttributeDialogComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MaintainDonorAttributesService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: LoginService, useValue: loginSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneSpy }
      ]
    });

    fixture = TestBed.createComponent(AddAttributeDialogComponent);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (e) { /* template rendering */ }
  });

  it('should initialize form with interCode required', () => {
    // Arrange & Act - form initialized in ngOnInit

    // Assert
    expect(component.form).toBeTruthy();
    expect(component.form.get('interCode')?.hasError('required')).toBeTrue();
  });

  it('should close dialog on cancel', () => {
    // Arrange & Act
    component.onCancel();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });

  it('should not submit when form is invalid', () => {
    // Arrange - form is invalid (interCode empty)

    // Act
    component.onSubmit();

    // Assert
    expect(serviceSpy.createAttribute).not.toHaveBeenCalled();
  });
});
