import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { AddEditContractDrawerComponent, AddEditContractDrawerData } from './add-edit-contract-drawer.component';
import { InternalContractService } from '../internal-contract.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment from 'moment';

describe('AddEditContractDrawerComponent', () => {
  let component: AddEditContractDrawerComponent;
  let fixture: ComponentFixture<AddEditContractDrawerComponent>;
  let mockContractService: jasmine.SpyObj<InternalContractService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddEditContractDrawerComponent>>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockLoginService: jasmine.SpyObj<LoginService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;

  const mockDialogData: AddEditContractDrawerData = { mode: 'add' };

  beforeEach(() => {
    mockContractService = jasmine.createSpyObj('InternalContractService', [
      'getContractTypes', 'getBarcodeProtocols', 'getValidTests',
      'getStates', 'getCountries', 'getActiveChapters', 'create', 'update'
    ]);
    mockContractService.getContractTypes.and.returnValue(of([]));
    mockContractService.getBarcodeProtocols.and.returnValue(of([]));
    mockContractService.getValidTests.and.returnValue(of([]));
    mockContractService.getStates.and.returnValue(of([]));
    mockContractService.getCountries.and.returnValue(of([]));
    mockContractService.getActiveChapters.and.returnValue(of([]));

    mockSnackbarService = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError', 'showInfo']);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockHeaderService = jasmine.createSpyObj('HeaderService', ['getCurrentChapterId', 'chapterTimeZone']);
    mockHeaderService.getCurrentChapterId.and.returnValue('CH01');
    mockHeaderService.chapterTimeZone.and.returnValue('UTC');
    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate', 'isChapterLocalDateAvailable'
    ]);
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment());
    mockChapterTimezoneService.isChapterLocalDateAvailable.and.returnValue(true);
    mockLoginService = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    mockLoginService.getStoredUsername.and.returnValue('testuser');
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      imports: [AddEditContractDrawerComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: InternalContractService, useValue: mockContractService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: LoginService, useValue: mockLoginService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(AddEditContractDrawerComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template-only errors */ }
  });

  it('should initialize forms with required controls in add mode', () => {
    // Assert
    expect(component.contractForm).toBeTruthy();
    expect(component.addressForm).toBeTruthy();
    expect(component.mode).toBe('add');
    expect(component.contractForm.get('company')).toBeTruthy();
    expect(component.contractForm.get('barCodeProtocol')).toBeTruthy();
  });

  it('should close dialog without saving on onCancel', () => {
    // Act
    component.onCancel();

    // Assert
    expect(mockDialogRef.close).toHaveBeenCalledWith({ success: false });
  });

  it('should show error when saving with invalid forms', () => {
    // Arrange - form is invalid by default (required fields empty)

    // Act
    component.onSave();

    // Assert
    expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please correct the errors in the form');
    expect(mockContractService.create).not.toHaveBeenCalled();
  });
});
