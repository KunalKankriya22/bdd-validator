import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { CommunicationDialogComponent, CommunicationDialogData } from './communication-dialog';
import { NotificationLogService } from '../../../../services/notification-log.service';
import { DonorCommunication } from '../../../../models/notification-log.interface';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import moment from 'moment';
import { signal } from '@angular/core';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('CommunicationDialogComponent', () => {
  let snackbarServiceSpy: any;
  let headerServiceSpy: any;
  let chapterTimezoneServiceSpy: any;
  let dialogRefSpy: any;
  let serviceSpy: any;
  let component: CommunicationDialogComponent;
  let fixture: ComponentFixture<CommunicationDialogComponent>;
  let service: jasmine.SpyObj<NotificationLogService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<CommunicationDialogComponent>>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  const mockNewData: CommunicationDialogData = {
    mode: 'new',
    donorId: 'D12345',
  };

  const mockEditData: CommunicationDialogData = {
    mode: 'edit',
    donorId: 'D12345',
    communication: {
      // ✅ PATTERN: Required fields from DonorCommunication interface
      dateAndTime: '2026-04-28T10:30:00',
      communicationType: 'EMAIL',
      communicationTypeDescription: 'Email Communication',
      communicationCode: 'APPT',
      communicationCodeDescription: 'Appointment Reminder',
      actionCode: 'FOLLOW',
      actionCodeDescription: 'Follow Up',
      comments: 'Test communication',
      staffId: 'S001',
      staffName: 'Smith, John',
      insertUserName: 'Test User',
      letterId: '',
      targetDate: '2026-05-01T00:00:00Z',
      actionDate: '2026-05-02T00:00:00Z',
    },
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('NotificationLogService', [
      'getCommunicationTypes',
      'getCommunicationCodes',
      'createCommunication',
      'getAddDropdownValues',
      'getAddCommunicationCodes',
    ]);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);
    headerServiceSpy = createMockHeaderService({ chapterTimeZone: signal('-05:00') });
    snackbarServiceSpy = createMockSnackbarService();

    // Mock chapter date and timezone
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-04-30'));
      TestBed.configureTestingModule({
      imports: [
        CommunicationDialogComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
      ],
      providers: [
        { provide: NotificationLogService, useValue: serviceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockNewData },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ]
    });
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-04-30'));


    fixture = TestBed.createComponent(CommunicationDialogComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(NotificationLogService) as jasmine.SpyObj<NotificationLogService>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<CommunicationDialogComponent>>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    // Default mock responses
    service.getAddDropdownValues.and.returnValue(of({
      communicationTypes: [
        { code: 'EMAIL', description: 'Email Communication' },
        { code: 'PHONE', description: 'Phone Call' },
      ],
      staffList: [
        { staffId: 'S001', name: 'Doe, Jane' },
        { staffId: 'S002', name: 'Smith, John' },
      ],
      actionCodes: [
        { code: 'FOLLOW', description: 'Follow Up' },
        { code: 'CLOSE', description: 'Close Case' },
      ]
    }));
    service.getAddCommunicationCodes.and.returnValue(of([
      { code: 'APPT', description: 'Appointment Reminder' },
      { code: 'CONF', description: 'Confirmation' },
    ]));
    service.getCommunicationTypes.and.returnValue(of([
      { code: 'EMAIL', description: 'Email Communication' },
      { code: 'PHONE', description: 'Phone Call' },
    ]));
    service.getCommunicationCodes.and.returnValue(of([
      { code: 'APPT', description: 'Appointment Reminder' },
      { code: 'CONF', description: 'Confirmation' },
    ]));


    });


  it('should initialize in new mode', () => {
    // Act
    fixture.detectChanges();

    // Assert
    expect(component.isNewMode).toBe(true);
    expect(component.dialogTitle).toBe('Add New');
    expect(component.currentDateTime).toBeTruthy();
  });

  it('should load lookups on init in add mode', () => {
    // Act
    fixture.detectChanges();

    // Assert
    expect(service.getAddDropdownValues).toHaveBeenCalled();
    expect(component.communicationTypes().length).toBe(2);
    expect(component.staffList().length).toBe(2);
    expect(component.actionCodes().length).toBe(2);
  });



  it('should load communication codes when type changes in add mode', () => {
    // Arrange
    fixture.detectChanges();

    // Act
    component.form.patchValue({ communicationType: 'EMAIL' });

    // Assert
    expect(service.getAddCommunicationCodes).toHaveBeenCalledWith('EMAIL');
    expect(component.communicationCodes().length).toBe(2);
    expect(component.selectedTypeDesc()).toBe('Email Communication');
  });

  it('should update code description when code changes', () => {
    // Arrange
    component.communicationCodes.set([
      { value: 'APPT', label: 'APPT - Appointment Reminder' },
    ]);
    fixture.detectChanges();

    // Act
    component.form.patchValue({ communicationCode: 'APPT' });

    // Assert
    expect(component.selectedCodeDesc()).toBe('Appointment Reminder');
  });

  it('should filter staff based on search term', () => {
    // Arrange
    fixture.detectChanges();
    // staffList is populated from getAddDropdownValues in beforeEach

    // Act
    component.staffSearchControl.setValue('smith');

    // Assert
    // Should filter to only staff members with 'smith' in label
    expect(component.filteredStaff().length).toBe(1);
    expect(component.filteredStaff()[0].label).toContain('Smith');
  });

  it('should show all staff when search is empty', () => {
    // Arrange
    fixture.detectChanges();
    component.staffSearchControl.setValue('smith'); // First filter

    // Act
    component.staffSearchControl.setValue(''); // Clear search

    // Assert
    // Should show all staff members again
    expect(component.filteredStaff().length).toBe(2);
  });

  it('should populate form in edit mode', () => {
    // Arrange
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);
    headerServiceSpy = createMockHeaderService({ chapterTimeZone: signal('-05:00') });
    snackbarServiceSpy = createMockSnackbarService();
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-04-30'));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [
        CommunicationDialogComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
      ],
      providers: [
        { provide: NotificationLogService, useValue: service },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockEditData },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ]
    });
    service.getCommunicationCodes.and.returnValue(of([
      { code: 'APPT', description: 'Appointment Reminder' },
    ]));

    fixture = TestBed.createComponent(CommunicationDialogComponent);
    component = fixture.componentInstance;

    // Act
    fixture.detectChanges();

    // Assert
    expect(component.isNewMode).toBe(false);
    expect(component.dialogTitle).toBe('Details');
    expect(component.form.get('communicationType')?.value).toBe('EMAIL');
    expect(component.form.get('communicationCode')?.value).toBe('APPT');
    expect(component.form.get('comments')?.value).toBe('Test communication');
    expect(component.form.get('staffId')?.value).toBe('S001');
    expect(component.selectedStaffName()).toBe('Smith, John');
  });

  it('should disable all fields in edit mode', () => {
    // Arrange
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);
    const headerServiceSpy = createMockHeaderService({ chapterTimeZone: signal('-05:00') });
    const snackbarServiceSpy = createMockSnackbarService();
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-04-30'));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [
        CommunicationDialogComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
      ],
      providers: [
        { provide: NotificationLogService, useValue: service },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockEditData },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ]
    });
    service.getCommunicationCodes.and.returnValue(of([]));

    fixture = TestBed.createComponent(CommunicationDialogComponent);
    component = fixture.componentInstance;

    // Act
    fixture.detectChanges();

    // Assert - all fields are read-only in edit mode (no API to update)
    expect(component.form.get('communicationType')?.disabled).toBe(true);
    expect(component.form.get('communicationCode')?.disabled).toBe(true);
    expect(component.form.get('comments')?.disabled).toBe(true);
    expect(component.form.get('staffId')?.disabled).toBe(true);
    expect(component.form.get('actionCode')?.disabled).toBe(true);
    expect(component.form.get('targetDate')?.disabled).toBe(true);
    expect(component.form.get('actionDate')?.disabled).toBe(true);
  });

  it('should close dialog with save action when form is valid', () => {
    // Arrange
    const mockCommunication = {
      dateAndTime: '2026-04-30T10:00:00',
      communicationType: 'EMAIL',
      communicationTypeDescription: 'Email',
      communicationCode: 'APPT',
      communicationCodeDescription: 'Appointment',
      actionCode: '',
      actionCodeDescription: '',
      comments: '',
      staffId: '',
      staffName: '',
      insertUserName: 'Test User',
      letterId: ''
    };
    service.createCommunication.and.returnValue(of(mockCommunication));
    fixture.detectChanges();
    component.form.patchValue({
      communicationType: 'EMAIL',
      communicationCode: 'APPT',
    });

    // Act
    component.onSave();

    // Assert
    expect(service.createCommunication).toHaveBeenCalled();
    expect(snackbarService.showSuccess).toHaveBeenCalledWith('Communication saved successfully.');
    expect(dialogRef.close).toHaveBeenCalledWith(
      jasmine.objectContaining({
        action: 'save'
      })
    );
  });









  it('should handle error when loading dropdown values fails in add mode', () => {
    // Arrange
    service.getAddDropdownValues.and.returnValue(
      throwError(() => new Error('API Error'))
    );
    spyOn(console, 'error');

    // Act
    fixture.detectChanges();

    // Assert
    expect(console.error).toHaveBeenCalledWith(
      'Failed to load dropdown values:',
      jasmine.any(Error)
    );
  });

  it('should handle error when loading communication codes fails in add mode', () => {
    // Arrange
    service.getAddCommunicationCodes.and.returnValue(
      throwError(() => new Error('API Error'))
    );
    spyOn(console, 'error');
    fixture.detectChanges();

    // Act
    component.form.patchValue({ communicationType: 'EMAIL' });

    // Assert
    expect(console.error).toHaveBeenCalledWith(
      'Failed to load communication codes:',
      jasmine.any(Error)
    );
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject and clear interval', () => {
      fixture.detectChanges();
      const spy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should close dialog with cancel action', () => {
      fixture.detectChanges();
      component.onCancel();
      expect(dialogRef.close).toHaveBeenCalledWith({ action: 'cancel' });
    });
  });

  describe('onTypeChange with empty value', () => {
    it('should clear codes when type is empty', () => {
      fixture.detectChanges();
      component.form.patchValue({ communicationType: '' });
      expect(component.communicationCodes().length).toBe(0);
      expect(component.selectedTypeDesc()).toBe('');
    });
  });

  describe('onCodeChange with empty value', () => {
    it('should clear description when code is empty', () => {
      fixture.detectChanges();
      component.form.patchValue({ communicationCode: '' });
      expect(component.selectedCodeDesc()).toBe('');
    });
  });

  describe('onActionCodeChange', () => {
    it('should set action code description', () => {
      fixture.detectChanges();
      component.actionCodes.set([{ value: 'FOLLOW', label: 'FOLLOW - Follow Up' }]);
      component.form.patchValue({ actionCode: 'FOLLOW' });
      expect(component.selectedActionCodeDesc()).toBe('Follow Up');
    });

    it('should clear description when action code is empty', () => {
      fixture.detectChanges();
      component.form.patchValue({ actionCode: '' });
      expect(component.selectedActionCodeDesc()).toBe('');
    });
  });

  describe('onStaffChange', () => {
    it('should set staff name', () => {
      fixture.detectChanges();
      component.staffList.set([{ value: 'S001', label: 'S001 - Doe, Jane' }]);
      component.onStaffChange('S001');
      expect(component.selectedStaffName()).toBe('Doe, Jane');
    });

    it('should clear staff name when empty', () => {
      fixture.detectChanges();
      component.onStaffChange('');
      expect(component.selectedStaffName()).toBe('');
    });

    it('should clear staff name when comma only', () => {
      fixture.detectChanges();
      component.staffList.set([{ value: 'S001', label: 'S001 - ,' }]);
      component.onStaffChange('S001');
      expect(component.selectedStaffName()).toBe('');
    });
  });

  describe('preventLeadingAndMultipleSpaces', () => {
    it('should call InputValidationUtil', () => {
      fixture.detectChanges();
      const event = new KeyboardEvent('keydown', { key: ' ' });
      expect(() => component.preventLeadingAndMultipleSpaces(event, 'comments')).not.toThrow();
    });
  });

  describe('trimTrailingSpaces', () => {
    it('should trim trailing spaces', () => {
      fixture.detectChanges();
      component.form.patchValue({ comments: 'test  ' });
      component.trimTrailingSpaces('comments');
      expect(component.form.get('comments')?.value).toBe('test');
    });
  });

  describe('preventSpaceInput', () => {
    it('should not throw', () => {
      const event = new KeyboardEvent('keydown', { key: ' ' });
      expect(() => component.preventSpaceInput(event)).not.toThrow();
    });
  });

  describe('onTargetDateInput', () => {
    it('should store raw input and mark as touched', () => {
      fixture.detectChanges();
      const event = { target: { value: '01-JAN-2026' } } as unknown as Event;
      component.onTargetDateInput(event);
      expect(component.form.get('targetDate')?.touched).toBeTrue();
    });
  });

  describe('onActionDateInput', () => {
    it('should store raw input and mark as touched', () => {
      fixture.detectChanges();
      const event = { target: { value: '01-JAN-2026' } } as unknown as Event;
      component.onActionDateInput(event);
      expect(component.form.get('actionDate')?.touched).toBeTrue();
    });
  });

  describe('onTargetDateBlur', () => {
    it('should not throw', () => {
      fixture.detectChanges();
      const input = document.createElement('input');
      expect(() => component.onTargetDateBlur(input)).not.toThrow();
    });
  });

  describe('onActionDateBlur', () => {
    it('should not throw', () => {
      fixture.detectChanges();
      const input = document.createElement('input');
      expect(() => component.onActionDateBlur(input)).not.toThrow();
    });
  });

  describe('getTargetDateError', () => {
    it('should return empty for untouched control', () => {
      fixture.detectChanges();
      expect(component.getTargetDateError()).toBe('');
    });

    it('should return error for invalid date', () => {
      fixture.detectChanges();
      const control = component.form.get('targetDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      expect(component.getTargetDateError()).toBe('Target Date is invalid');
    });
  });

  describe('getActionDateError', () => {
    it('should return empty for untouched control', () => {
      fixture.detectChanges();
      expect(component.getActionDateError()).toBe('');
    });

    it('should return error for invalid date', () => {
      fixture.detectChanges();
      const control = component.form.get('actionDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      expect(component.getActionDateError()).toBe('Action Date is invalid');
    });
  });

  describe('hasVisibleDateError', () => {
    it('should return false when no errors', () => {
      fixture.detectChanges();
      expect(component.hasVisibleDateError).toBeFalse();
    });
  });

  describe('isSaveDisabled', () => {
    it('should return true when loading', () => {
      fixture.detectChanges();
      component.loading.set(true);
      expect(component.isSaveDisabled).toBeTrue();
    });

    it('should return true when form is invalid in new mode', () => {
      fixture.detectChanges();
      expect(component.isSaveDisabled).toBeTrue(); // required fields not filled
    });

    it('should return false in edit mode', () => {
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-04-30'));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CommunicationDialogComponent, ReactiveFormsModule, NoopAnimationsModule, HttpClientTestingModule],
        providers: [
          { provide: NotificationLogService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: mockEditData },
          { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
        ]
      });
      service.getCommunicationCodes.and.returnValue(of([]));
      const editFixture = TestBed.createComponent(CommunicationDialogComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();
      expect(editComponent.isSaveDisabled).toBeFalse();
    });
  });

  describe('formatDate', () => {
    it('should return dash for null', () => {
      fixture.detectChanges();
      expect(component.formatDate(null)).toBe('-');
    });

    it('should format a date string', () => {
      fixture.detectChanges();
      const result = component.formatDate('2026-01-15');
      expect(result).toBeTruthy();
    });

    it('should format a Date object', () => {
      fixture.detectChanges();
      const result = component.formatDate(new Date('2026-01-15'));
      expect(result).toBeTruthy();
    });
  });

  describe('trackByValue', () => {
    it('should return item value', () => {
      expect(component.trackByValue(0, { value: 'test', label: 'Test' })).toBe('test');
    });
  });

  describe('onSave - additional paths', () => {
    it('should return early if form is invalid', () => {
      fixture.detectChanges();
      component.onSave();
      expect(service.createCommunication).not.toHaveBeenCalled();
    });

    it('should return early if has visible date error', () => {
      fixture.detectChanges();
      component.form.patchValue({ communicationType: 'EMAIL', communicationCode: 'APPT' });
      const control = component.form.get('targetDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      component.onSave();
      expect(service.createCommunication).not.toHaveBeenCalled();
    });

    it('should handle save error', () => {
      service.createCommunication.and.returnValue(throwError(() => new Error('Save error')));
      spyOn(console, 'error');
      fixture.detectChanges();
      component.form.patchValue({ communicationType: 'EMAIL', communicationCode: 'APPT' });
      component.onSave();
      expect(component.loading()).toBeFalse();
    });
  });

  describe('setupComTypeSearch', () => {
    it('should filter communication types', () => {
      fixture.detectChanges();
      component.comTypeSearchControl.setValue('phone');
      expect(component.filteredComTypes().length).toBe(1);
      expect(component.filteredComTypes()[0].value).toBe('PHONE');
    });

    it('should show all when search is empty', () => {
      fixture.detectChanges();
      component.comTypeSearchControl.setValue('phone');
      component.comTypeSearchControl.setValue('');
      expect(component.filteredComTypes().length).toBe(2);
    });
  });

  describe('setupComCodeSearch', () => {
    it('should filter communication codes', () => {
      fixture.detectChanges();
      component.communicationCodes.set([
        { value: 'APPT', label: 'APPT - Appointment' },
        { value: 'CONF', label: 'CONF - Confirmation' },
      ]);
      component.comCodeSearchControl.setValue('appt');
      expect(component.filteredComCodes().length).toBe(1);
    });
  });

  describe('setupActionCodeSearch', () => {
    it('should filter action codes', () => {
      fixture.detectChanges();
      component.actionCodeSearchControl.setValue('follow');
      expect(component.filteredActionCodes().length).toBe(1);
      expect(component.filteredActionCodes()[0].value).toBe('FOLLOW');
    });
  });

  describe('targetDateErrorMatcher', () => {
    it('should return false for null control', () => {
      fixture.detectChanges();
      expect(component.targetDateErrorMatcher.isErrorState(null, null)).toBeFalse();
    });

    it('should return false for pristine untouched control', () => {
      fixture.detectChanges();
      const control = component.form.get('targetDate');
      expect(component.targetDateErrorMatcher.isErrorState(control as any, null)).toBeFalse();
    });

    it('should return true for invalid touched control', () => {
      fixture.detectChanges();
      const control = component.form.get('targetDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      expect(component.targetDateErrorMatcher.isErrorState(control as any, null)).toBeTrue();
    });
  });

  describe('actionDateErrorMatcher', () => {
    it('should return false for null control', () => {
      fixture.detectChanges();
      expect(component.actionDateErrorMatcher.isErrorState(null, null)).toBeFalse();
    });
  });

  describe('buildCreateRequest', () => {
    it('should build request with dates', () => {
      fixture.detectChanges();
      component.form.patchValue({
        communicationType: 'EMAIL',
        communicationCode: 'APPT',
        comments: 'Test',
        staffId: 'S001',
        actionCode: 'FOLLOW',
        targetDate: moment('2026-05-01'),
        actionDate: moment('2026-05-02'),
      });
      const request = component['buildCreateRequest']();
      expect(request.communicationType).toBe('EMAIL');
      expect(request.communicationCode).toBe('APPT');
      expect(request.targetDate).toContain('2026-05-01');
      expect(request.actionDate).toContain('2026-05-02');
    });

    it('should build request without dates', () => {
      fixture.detectChanges();
      component.form.patchValue({
        communicationType: 'EMAIL',
        communicationCode: 'APPT',
      });
      const request = component['buildCreateRequest']();
      expect(request.targetDate).toBeUndefined();
      expect(request.actionDate).toBeUndefined();
    });
  });

  describe('updateDateTime', () => {
    it('should set currentDateTime with timezone', () => {
      fixture.detectChanges();
      component['updateDateTime']();
      expect(component.currentDateTime()).toBeTruthy();
      expect(component.currentDateTime()).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });
  });

  describe('onSave in edit mode', () => {
    it('should close dialog with save action', () => {
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-04-30'));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CommunicationDialogComponent, ReactiveFormsModule, NoopAnimationsModule, HttpClientTestingModule],
        providers: [
          { provide: NotificationLogService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: mockEditData },
          { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
        ]
      });
      service.getCommunicationCodes.and.returnValue(of([]));
      const editFixture = TestBed.createComponent(CommunicationDialogComponent);
      const editComponent = editFixture.componentInstance;
      const editDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<CommunicationDialogComponent>>;
      editFixture.detectChanges();
      editComponent.onSave();
      expect(editDialogRef.close).toHaveBeenCalledWith({ action: 'save' });
    });
  });

  describe('loadExistingData with minimal data', () => {
    it('should handle communication without optional fields', () => {
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-04-30'));
      TestBed.resetTestingModule();
      const minimalComm: CommunicationDialogData = {
        mode: 'edit',
        donorId: 'D12345',
        communication: {
          dateAndTime: '2026-04-28T10:30:00',
          communicationType: 'EMAIL',
          communicationTypeDescription: 'Email',
          communicationCode: 'APPT',
          communicationCodeDescription: 'Appointment',
          actionCode: '',
          actionCodeDescription: '',
          comments: '',
          staffId: '',
          staffName: '',
          insertUserName: 'Test User',
          letterId: '',
        }
      };
      TestBed.configureTestingModule({
        imports: [CommunicationDialogComponent, ReactiveFormsModule, NoopAnimationsModule, HttpClientTestingModule],
        providers: [
          { provide: NotificationLogService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: minimalComm },
          { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
        ]
      });
      service.getCommunicationCodes.and.returnValue(of([]));
      const editFixture = TestBed.createComponent(CommunicationDialogComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();
      expect(editComponent.selectedStaffName()).toBe('');
      expect(editComponent.selectedActionCodeDesc()).toBe('');
    });
  });

  describe('updateDateTime - edge cases', () => {
    it('should return early when timezone is null', () => {
      headerServiceSpy = createMockHeaderService({ chapterTimeZone: signal(null as any) });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CommunicationDialogComponent, ReactiveFormsModule, NoopAnimationsModule, HttpClientTestingModule],
        providers: [
          { provide: NotificationLogService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: mockNewData },
          { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
        ]
      });
      serviceSpy.getAddDropdownValues.and.returnValue(of({
        communicationTypes: [], staffList: [], actionCodes: []
      }));
      const nullTzFixture = TestBed.createComponent(CommunicationDialogComponent);
      const nullTzComponent = nullTzFixture.componentInstance;
      nullTzFixture.detectChanges();
      // currentDateTime should remain empty since timezone is null
      expect(nullTzComponent.currentDateTime()).toBe('');
    });

    it('should return early when timezone is empty string', () => {
      headerServiceSpy = createMockHeaderService({ chapterTimeZone: signal('') });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CommunicationDialogComponent, ReactiveFormsModule, NoopAnimationsModule, HttpClientTestingModule],
        providers: [
          { provide: NotificationLogService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: mockNewData },
          { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
        ]
      });
      serviceSpy.getAddDropdownValues.and.returnValue(of({
        communicationTypes: [], staffList: [], actionCodes: []
      }));
      const emptyTzFixture = TestBed.createComponent(CommunicationDialogComponent);
      const emptyTzComponent = emptyTzFixture.componentInstance;
      emptyTzFixture.detectChanges();
      expect(emptyTzComponent.currentDateTime()).toBe('');
    });

    it('should handle positive timezone offset', () => {
      headerServiceSpy = createMockHeaderService({ chapterTimeZone: signal('+05:30') });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CommunicationDialogComponent, ReactiveFormsModule, NoopAnimationsModule, HttpClientTestingModule],
        providers: [
          { provide: NotificationLogService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: mockNewData },
          { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
        ]
      });
      serviceSpy.getAddDropdownValues.and.returnValue(of({
        communicationTypes: [], staffList: [], actionCodes: []
      }));
      const posTzFixture = TestBed.createComponent(CommunicationDialogComponent);
      const posTzComponent = posTzFixture.componentInstance;
      posTzFixture.detectChanges();
      expect(posTzComponent.currentDateTime()).toMatch(/\d{2}-[A-Z]{3}-\d{4}\s\d{2}:\d{2}/);
    });
  });

  describe('onTypeChange - edit mode branch', () => {
    it('should use getCommunicationCodes (not getAddCommunicationCodes) in edit mode', () => {
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-04-30'));
      TestBed.resetTestingModule();
      // Create edit mode data but with fields enabled for testing
      const editDataForTypeChange: CommunicationDialogData = {
        mode: 'edit',
        donorId: 'D12345',
        communication: {
          dateAndTime: '2026-04-28T10:30:00',
          communicationType: 'EMAIL',
          communicationTypeDescription: 'Email Communication',
          communicationCode: 'APPT',
          communicationCodeDescription: 'Appointment Reminder',
          actionCode: '',
          actionCodeDescription: '',
          comments: '',
          staffId: '',
          staffName: '',
          insertUserName: 'Test User',
          letterId: '',
        }
      };
      TestBed.configureTestingModule({
        imports: [CommunicationDialogComponent, ReactiveFormsModule, NoopAnimationsModule, HttpClientTestingModule],
        providers: [
          { provide: NotificationLogService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: editDataForTypeChange },
          { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
        ]
      });
      serviceSpy.getCommunicationCodes.and.returnValue(of([
        { code: 'APPT', description: 'Appointment Reminder' },
      ]));
      const editFixture = TestBed.createComponent(CommunicationDialogComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      // Enable the communicationType control so we can trigger changes
      editComponent.form.get('communicationType')?.enable();
      editComponent.communicationTypes.set([
        { value: 'EMAIL', label: 'EMAIL - Email Communication' },
        { value: 'PHONE', label: 'PHONE - Phone Call' },
      ]);

      // Trigger type change
      editComponent.form.patchValue({ communicationType: 'PHONE' });

      // In edit mode, should call getCommunicationCodes (not getAddCommunicationCodes)
      expect(serviceSpy.getCommunicationCodes).toHaveBeenCalledWith('D12345', 'PHONE');
    });
  });

  describe('onCodeChange - edge cases', () => {
    it('should set empty description when code not found in list', () => {
      fixture.detectChanges();
      component.communicationCodes.set([
        { value: 'APPT', label: 'APPT - Appointment Reminder' },
      ]);
      component.form.patchValue({ communicationCode: 'NONEXISTENT' });
      expect(component.selectedCodeDesc()).toBe('');
    });
  });

  describe('onActionCodeChange - edge cases', () => {
    it('should set empty description when action code not found in list', () => {
      fixture.detectChanges();
      component.actionCodes.set([
        { value: 'FOLLOW', label: 'FOLLOW - Follow Up' },
      ]);
      component.form.patchValue({ actionCode: 'NONEXISTENT' });
      expect(component.selectedActionCodeDesc()).toBe('');
    });
  });

  describe('onStaffChange - edge cases', () => {
    it('should set empty name when staff not found in list', () => {
      fixture.detectChanges();
      component.staffList.set([
        { value: 'S001', label: 'S001 - Doe, Jane' },
      ]);
      component.onStaffChange('NONEXISTENT');
      expect(component.selectedStaffName()).toBe('');
    });
  });

  describe('preventLeadingAndMultipleSpaces - edge cases', () => {
    it('should not throw when control name does not exist', () => {
      fixture.detectChanges();
      const event = new KeyboardEvent('keydown', { key: ' ' });
      expect(() => component.preventLeadingAndMultipleSpaces(event, 'nonExistentControl')).not.toThrow();
    });
  });

  describe('trimTrailingSpaces - edge cases', () => {
    it('should not throw when control name does not exist', () => {
      fixture.detectChanges();
      expect(() => component.trimTrailingSpaces('nonExistentControl')).not.toThrow();
    });
  });

  describe('getTargetDateError - additional branches', () => {
    it('should return error for matDatepickerParse error', () => {
      fixture.detectChanges();
      const control = component.form.get('targetDate');
      control?.setErrors({ matDatepickerParse: { text: 'invalid' } });
      control?.markAsTouched();
      expect(component.getTargetDateError()).toBe('Target Date is invalid');
    });

    it('should return error when control is dirty (not touched)', () => {
      fixture.detectChanges();
      const control = component.form.get('targetDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsDirty();
      expect(component.getTargetDateError()).toBe('Target Date is invalid');
    });

    it('should return empty when form is null', () => {
      fixture.detectChanges();
      const origForm = component.form;
      (component as any).form = null;
      expect(component.getTargetDateError()).toBe('');
      component.form = origForm;
    });

    it('should return error when control has no value but native input has text', () => {
      fixture.detectChanges();
      const control = component.form.get('targetDate');
      control?.setValue(null);
      control?.markAsTouched();
      // Set the ViewChild to simulate native input with text
      (component as any).targetDateNativeInput = {
        nativeElement: { value: 'invalid-date' }
      };
      expect(component.getTargetDateError()).toBe('Target Date is invalid');
    });
  });

  describe('getActionDateError - additional branches', () => {
    it('should return error for matDatepickerParse error', () => {
      fixture.detectChanges();
      const control = component.form.get('actionDate');
      control?.setErrors({ matDatepickerParse: { text: 'invalid' } });
      control?.markAsTouched();
      expect(component.getActionDateError()).toBe('Action Date is invalid');
    });

    it('should return error when control is dirty (not touched)', () => {
      fixture.detectChanges();
      const control = component.form.get('actionDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsDirty();
      expect(component.getActionDateError()).toBe('Action Date is invalid');
    });

    it('should return empty when form is null', () => {
      fixture.detectChanges();
      const origForm = component.form;
      (component as any).form = null;
      expect(component.getActionDateError()).toBe('');
      component.form = origForm;
    });

    it('should return error when control has no value but native input has text', () => {
      fixture.detectChanges();
      const control = component.form.get('actionDate');
      control?.setValue(null);
      control?.markAsTouched();
      (component as any).actionDateNativeInput = {
        nativeElement: { value: 'invalid-date' }
      };
      expect(component.getActionDateError()).toBe('Action Date is invalid');
    });
  });

  describe('hasVisibleDateError - returns true', () => {
    it('should return true when target date has error', () => {
      fixture.detectChanges();
      const control = component.form.get('targetDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      expect(component.hasVisibleDateError).toBeTrue();
    });

    it('should return true when action date has error', () => {
      fixture.detectChanges();
      const control = component.form.get('actionDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      expect(component.hasVisibleDateError).toBeTrue();
    });

    it('should return true when both dates have errors', () => {
      fixture.detectChanges();
      const targetControl = component.form.get('targetDate');
      targetControl?.setErrors({ invalidDate: true });
      targetControl?.markAsTouched();
      const actionControl = component.form.get('actionDate');
      actionControl?.setErrors({ invalidDate: true });
      actionControl?.markAsTouched();
      expect(component.hasVisibleDateError).toBeTrue();
    });
  });

  describe('isSaveDisabled - visible date error branch', () => {
    it('should return true in new mode when form is valid but has visible date error', () => {
      fixture.detectChanges();
      component.form.patchValue({
        communicationType: 'EMAIL',
        communicationCode: 'APPT',
      });
      // Set a date error
      const targetControl = component.form.get('targetDate');
      targetControl?.setErrors({ invalidDate: true });
      targetControl?.markAsTouched();
      expect(component.isSaveDisabled).toBeTrue();
    });
  });

  describe('targetDateErrorMatcher - native input text branch', () => {
    it('should return true when control has no value but native input has text', () => {
      fixture.detectChanges();
      const control = component.form.get('targetDate');
      control?.setValue(null);
      control?.markAsTouched();
      (component as any).targetDateNativeInput = {
        nativeElement: { value: 'some-text' }
      };
      expect(component.targetDateErrorMatcher.isErrorState(control as any, null)).toBeTrue();
    });

    it('should return false when control has no value and native input is empty', () => {
      fixture.detectChanges();
      const control = component.form.get('targetDate');
      control?.setValue(null);
      control?.markAsTouched();
      (component as any).targetDateNativeInput = {
        nativeElement: { value: '' }
      };
      expect(component.targetDateErrorMatcher.isErrorState(control as any, null)).toBeFalse();
    });

    it('should return false when control has no value and native input ref is undefined', () => {
      fixture.detectChanges();
      const control = component.form.get('targetDate');
      control?.setValue(null);
      control?.markAsTouched();
      (component as any).targetDateNativeInput = undefined;
      expect(component.targetDateErrorMatcher.isErrorState(control as any, null)).toBeFalse();
    });
  });

  describe('actionDateErrorMatcher - additional branches', () => {
    it('should return false for pristine untouched control', () => {
      fixture.detectChanges();
      const control = component.form.get('actionDate');
      expect(component.actionDateErrorMatcher.isErrorState(control as any, null)).toBeFalse();
    });

    it('should return true for invalid touched control', () => {
      fixture.detectChanges();
      const control = component.form.get('actionDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      expect(component.actionDateErrorMatcher.isErrorState(control as any, null)).toBeTrue();
    });

    it('should return true when control has no value but native input has text', () => {
      fixture.detectChanges();
      const control = component.form.get('actionDate');
      control?.setValue(null);
      control?.markAsTouched();
      (component as any).actionDateNativeInput = {
        nativeElement: { value: 'some-text' }
      };
      expect(component.actionDateErrorMatcher.isErrorState(control as any, null)).toBeTrue();
    });

    it('should return false when control has no value and native input is empty', () => {
      fixture.detectChanges();
      const control = component.form.get('actionDate');
      control?.setValue(null);
      control?.markAsTouched();
      (component as any).actionDateNativeInput = {
        nativeElement: { value: '' }
      };
      expect(component.actionDateErrorMatcher.isErrorState(control as any, null)).toBeFalse();
    });

    it('should return true for invalid dirty control', () => {
      fixture.detectChanges();
      const control = component.form.get('actionDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsDirty();
      expect(component.actionDateErrorMatcher.isErrorState(control as any, null)).toBeTrue();
    });
  });

  describe('onTargetDateInput - already touched', () => {
    it('should not call markAsTouched when control is already touched', () => {
      fixture.detectChanges();
      const control = component.form.get('targetDate');
      control?.markAsTouched();
      const spy = spyOn(control!, 'markAsTouched');
      const event = { target: { value: '01-JAN-2026' } } as unknown as Event;
      component.onTargetDateInput(event);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('onActionDateInput - already touched', () => {
    it('should not call markAsTouched when control is already touched', () => {
      fixture.detectChanges();
      const control = component.form.get('actionDate');
      control?.markAsTouched();
      const spy = spyOn(control!, 'markAsTouched');
      const event = { target: { value: '01-JAN-2026' } } as unknown as Event;
      component.onActionDateInput(event);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('onTargetDateBlur - restoration logic', () => {
    it('should restore raw input when control value is null and input is empty', (done) => {
      fixture.detectChanges();
      // Simulate user typing an invalid date
      const event = { target: { value: 'invalid-date' } } as unknown as Event;
      component.onTargetDateInput(event);

      const input = document.createElement('input');
      input.value = ''; // Material cleared it on blur
      component.form.get('targetDate')?.setValue(null);

      component.onTargetDateBlur(input);

      setTimeout(() => {
        expect(input.value).toBe('invalid-date');
        done();
      }, 10);
    });

    it('should not restore when control has a value', (done) => {
      fixture.detectChanges();
      const event = { target: { value: '01-JAN-2026' } } as unknown as Event;
      component.onTargetDateInput(event);

      const input = document.createElement('input');
      input.value = '';
      component.form.get('targetDate')?.setValue(moment('2026-01-01'));

      component.onTargetDateBlur(input);

      setTimeout(() => {
        expect(input.value).toBe('');
        done();
      }, 10);
    });

    it('should not restore when raw input is empty', (done) => {
      fixture.detectChanges();
      // No prior onTargetDateInput call => raw input is empty string
      const input = document.createElement('input');
      input.value = '';
      component.form.get('targetDate')?.setValue(null);

      component.onTargetDateBlur(input);

      setTimeout(() => {
        expect(input.value).toBe('');
        done();
      }, 10);
    });

    it('should not restore when input still has a value', (done) => {
      fixture.detectChanges();
      const event = { target: { value: 'invalid-date' } } as unknown as Event;
      component.onTargetDateInput(event);

      const input = document.createElement('input');
      input.value = 'existing'; // Input was not cleared
      component.form.get('targetDate')?.setValue(null);

      component.onTargetDateBlur(input);

      setTimeout(() => {
        expect(input.value).toBe('existing');
        done();
      }, 10);
    });
  });

  describe('onActionDateBlur - restoration logic', () => {
    it('should restore raw input when control value is null and input is empty', (done) => {
      fixture.detectChanges();
      const event = { target: { value: 'invalid-date' } } as unknown as Event;
      component.onActionDateInput(event);

      const input = document.createElement('input');
      input.value = '';
      component.form.get('actionDate')?.setValue(null);

      component.onActionDateBlur(input);

      setTimeout(() => {
        expect(input.value).toBe('invalid-date');
        done();
      }, 10);
    });

    it('should not restore when control has a value', (done) => {
      fixture.detectChanges();
      const event = { target: { value: '01-JAN-2026' } } as unknown as Event;
      component.onActionDateInput(event);

      const input = document.createElement('input');
      input.value = '';
      component.form.get('actionDate')?.setValue(moment('2026-01-01'));

      component.onActionDateBlur(input);

      setTimeout(() => {
        expect(input.value).toBe('');
        done();
      }, 10);
    });

    it('should not restore when raw input is empty', (done) => {
      fixture.detectChanges();
      const input = document.createElement('input');
      input.value = '';
      component.form.get('actionDate')?.setValue(null);

      component.onActionDateBlur(input);

      setTimeout(() => {
        expect(input.value).toBe('');
        done();
      }, 10);
    });

    it('should not restore when input still has a value', (done) => {
      fixture.detectChanges();
      const event = { target: { value: 'invalid-date' } } as unknown as Event;
      component.onActionDateInput(event);

      const input = document.createElement('input');
      input.value = 'existing';
      component.form.get('actionDate')?.setValue(null);

      component.onActionDateBlur(input);

      setTimeout(() => {
        expect(input.value).toBe('existing');
        done();
      }, 10);
    });
  });

  describe('setupComCodeSearch - empty search', () => {
    it('should show all codes when search is empty', () => {
      fixture.detectChanges();
      component.communicationCodes.set([
        { value: 'APPT', label: 'APPT - Appointment' },
        { value: 'CONF', label: 'CONF - Confirmation' },
      ]);
      component.comCodeSearchControl.setValue('appt');
      expect(component.filteredComCodes().length).toBe(1);
      component.comCodeSearchControl.setValue('');
      expect(component.filteredComCodes().length).toBe(2);
    });

    it('should show all codes when search is null', () => {
      fixture.detectChanges();
      component.communicationCodes.set([
        { value: 'APPT', label: 'APPT - Appointment' },
        { value: 'CONF', label: 'CONF - Confirmation' },
      ]);
      component.comCodeSearchControl.setValue(null);
      expect(component.filteredComCodes().length).toBe(2);
    });
  });

  describe('setupActionCodeSearch - empty search', () => {
    it('should show all action codes when search is empty', () => {
      fixture.detectChanges();
      component.actionCodeSearchControl.setValue('follow');
      expect(component.filteredActionCodes().length).toBe(1);
      component.actionCodeSearchControl.setValue('');
      expect(component.filteredActionCodes().length).toBe(2);
    });

    it('should show all action codes when search is null', () => {
      fixture.detectChanges();
      component.actionCodeSearchControl.setValue(null);
      expect(component.filteredActionCodes().length).toBe(2);
    });
  });

  describe('setupComTypeSearch - null search', () => {
    it('should show all types when search is null', () => {
      fixture.detectChanges();
      component.comTypeSearchControl.setValue(null);
      expect(component.filteredComTypes().length).toBe(2);
    });
  });

  describe('setupStaffSearch - null search', () => {
    it('should show all staff when search is null', () => {
      fixture.detectChanges();
      component.staffSearchControl.setValue(null);
      expect(component.filteredStaff().length).toBe(2);
    });
  });

  describe('ngOnDestroy - interval cleanup', () => {
    it('should call clearInterval when dateTimeInterval is set', () => {
      fixture.detectChanges();
      // In new mode, dateTimeInterval is set by ngOnInit
      expect((component as any).dateTimeInterval).toBeDefined();
      const clearSpy = spyOn(window, 'clearInterval');
      component.ngOnDestroy();
      expect(clearSpy).toHaveBeenCalledWith((component as any).dateTimeInterval);
    });

    it('should not call clearInterval when dateTimeInterval is not set', () => {
      // Use edit mode which does NOT set dateTimeInterval
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-04-30'));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CommunicationDialogComponent, ReactiveFormsModule, NoopAnimationsModule, HttpClientTestingModule],
        providers: [
          { provide: NotificationLogService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: mockEditData },
          { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
        ]
      });
      serviceSpy.getCommunicationCodes.and.returnValue(of([]));
      const editFixture = TestBed.createComponent(CommunicationDialogComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();
      // In edit mode, dateTimeInterval is never set
      expect((editComponent as any).dateTimeInterval).toBeUndefined();
      const destroySpy = spyOn(editComponent['destroy$'], 'next');
      const completeSpy = spyOn(editComponent['destroy$'], 'complete');
      editComponent.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('formatDate - additional cases', () => {
    it('should return dash for undefined', () => {
      fixture.detectChanges();
      expect(component.formatDate(undefined)).toBe('-');
    });
  });

  describe('buildCreateRequest - optional field handling', () => {
    it('should set comments to undefined when empty string', () => {
      fixture.detectChanges();
      component.form.patchValue({
        communicationType: 'EMAIL',
        communicationCode: 'APPT',
        comments: '',
        staffId: '',
        actionCode: '',
      });
      const request = component['buildCreateRequest']();
      expect(request.comments).toBeUndefined();
      expect(request.staffId).toBeUndefined();
      expect(request.actionCode).toBeUndefined();
    });

    it('should include comments when provided', () => {
      fixture.detectChanges();
      component.form.patchValue({
        communicationType: 'EMAIL',
        communicationCode: 'APPT',
        comments: 'Some comment',
        staffId: 'S001',
        actionCode: 'FOLLOW',
      });
      const request = component['buildCreateRequest']();
      expect(request.comments).toBe('Some comment');
      expect(request.staffId).toBe('S001');
      expect(request.actionCode).toBe('FOLLOW');
    });
  });

  describe('loadExistingData - no communication data', () => {
    it('should return early when communication is undefined', () => {
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-04-30'));
      TestBed.resetTestingModule();
      const noCommData: CommunicationDialogData = {
        mode: 'edit',
        donorId: 'D12345',
        // No communication property
      };
      TestBed.configureTestingModule({
        imports: [CommunicationDialogComponent, ReactiveFormsModule, NoopAnimationsModule, HttpClientTestingModule],
        providers: [
          { provide: NotificationLogService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: noCommData },
          { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
        ]
      });
      const noCommFixture = TestBed.createComponent(CommunicationDialogComponent);
      const noCommComponent = noCommFixture.componentInstance;
      noCommFixture.detectChanges();
      // Should not throw and form should be initialized but empty
      expect(noCommComponent.form.get('communicationType')?.value).toBe('');
      expect(noCommComponent.communicationTypes().length).toBe(0);
    });
  });

  describe('loadExistingData - dates handling', () => {
    it('should set null for missing targetDate and actionDate', () => {
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-04-30'));
      TestBed.resetTestingModule();
      const noDatesData: CommunicationDialogData = {
        mode: 'edit',
        donorId: 'D12345',
        communication: {
          dateAndTime: '2026-04-28T10:30:00',
          communicationType: 'EMAIL',
          communicationTypeDescription: 'Email',
          communicationCode: 'APPT',
          communicationCodeDescription: 'Appointment',
          actionCode: '',
          actionCodeDescription: '',
          comments: '',
          staffId: '',
          staffName: '',
          insertUserName: 'Test User',
          letterId: '',
          // no targetDate, no actionDate
        }
      };
      TestBed.configureTestingModule({
        imports: [CommunicationDialogComponent, ReactiveFormsModule, NoopAnimationsModule, HttpClientTestingModule],
        providers: [
          { provide: NotificationLogService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: noDatesData },
          { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
        ]
      });
      const noDatesFixture = TestBed.createComponent(CommunicationDialogComponent);
      const noDatesComponent = noDatesFixture.componentInstance;
      noDatesFixture.detectChanges();
      expect(noDatesComponent.form.get('targetDate')?.value).toBeNull();
      expect(noDatesComponent.form.get('actionDate')?.value).toBeNull();
    });

    it('should parse targetDate and actionDate when provided', () => {
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-04-30'));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CommunicationDialogComponent, ReactiveFormsModule, NoopAnimationsModule, HttpClientTestingModule],
        providers: [
          { provide: NotificationLogService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: mockEditData },
          { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
        ]
      });
      const datesFixture = TestBed.createComponent(CommunicationDialogComponent);
      const datesComponent = datesFixture.componentInstance;
      datesFixture.detectChanges();
      expect(moment.isMoment(datesComponent.form.get('targetDate')?.value)).toBeTrue();
      expect(moment.isMoment(datesComponent.form.get('actionDate')?.value)).toBeTrue();
    });
  });

  describe('loadExistingData - descriptions', () => {
    it('should set all descriptions from communication data', () => {
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-04-30'));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CommunicationDialogComponent, ReactiveFormsModule, NoopAnimationsModule, HttpClientTestingModule],
        providers: [
          { provide: NotificationLogService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: mockEditData },
          { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
        ]
      });
      const descFixture = TestBed.createComponent(CommunicationDialogComponent);
      const descComponent = descFixture.componentInstance;
      descFixture.detectChanges();
      expect(descComponent.selectedTypeDesc()).toBe('Email Communication');
      expect(descComponent.selectedCodeDesc()).toBe('Appointment Reminder');
      expect(descComponent.selectedActionCodeDesc()).toBe('Follow Up');
      expect(descComponent.selectedStaffName()).toBe('Smith, John');
    });

    it('should set empty description when communicationTypeDescription is missing', () => {
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-04-30'));
      TestBed.resetTestingModule();
      const noDescData: CommunicationDialogData = {
        mode: 'edit',
        donorId: 'D12345',
        communication: {
          dateAndTime: '2026-04-28T10:30:00',
          communicationType: '',
          communicationTypeDescription: '',
          communicationCode: '',
          communicationCodeDescription: '',
          actionCode: '',
          actionCodeDescription: '',
          comments: '',
          staffId: '',
          staffName: '',
          insertUserName: 'Test User',
          letterId: '',
        }
      };
      TestBed.configureTestingModule({
        imports: [CommunicationDialogComponent, ReactiveFormsModule, NoopAnimationsModule, HttpClientTestingModule],
        providers: [
          { provide: NotificationLogService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: noDescData },
          { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
        ]
      });
      const noDescFixture = TestBed.createComponent(CommunicationDialogComponent);
      const noDescComponent = noDescFixture.componentInstance;
      noDescFixture.detectChanges();
      // When type/code/action/staff are empty strings, the if blocks won't execute
      expect(noDescComponent.communicationTypes().length).toBe(0);
      expect(noDescComponent.communicationCodes().length).toBe(0);
      expect(noDescComponent.actionCodes().length).toBe(0);
      expect(noDescComponent.staffList().length).toBe(0);
    });
  });

  describe('loadLookups - error empties all arrays', () => {
    it('should set all arrays to empty on error', () => {
      service.getAddDropdownValues.and.returnValue(throwError(() => new Error('API Error')));
      spyOn(console, 'error');
      fixture.detectChanges();
      expect(component.communicationTypes().length).toBe(0);
      expect(component.filteredComTypes().length).toBe(0);
      expect(component.staffList().length).toBe(0);
      expect(component.filteredStaff().length).toBe(0);
      expect(component.actionCodes().length).toBe(0);
      expect(component.filteredActionCodes().length).toBe(0);
    });
  });

  describe('onTypeChange - error handling for communication codes', () => {
    it('should set loadingCodes to false on error', () => {
      fixture.detectChanges();
      service.getAddCommunicationCodes.and.returnValue(throwError(() => new Error('Code Error')));
      spyOn(console, 'error');
      component.form.patchValue({ communicationType: 'EMAIL' });
      expect(component.loadingCodes()).toBeFalse();
      expect(component.communicationCodes().length).toBe(0);
      expect(component.filteredComCodes().length).toBe(0);
    });
  });

  describe('onTypeChange - type description extraction', () => {
    it('should extract description after dash separator', () => {
      fixture.detectChanges();
      component.communicationTypes.set([
        { value: 'EMAIL', label: 'EMAIL - Email Communication' },
      ]);
      component.form.patchValue({ communicationType: 'EMAIL' });
      expect(component.selectedTypeDesc()).toBe('Email Communication');
    });

    it('should set empty description when type not found', () => {
      fixture.detectChanges();
      component.communicationTypes.set([
        { value: 'EMAIL', label: 'EMAIL - Email Communication' },
      ]);
      // The type change will load codes - mock the response
      service.getAddCommunicationCodes.and.returnValue(of([]));
      component.form.patchValue({ communicationType: 'NONEXISTENT' });
      expect(component.selectedTypeDesc()).toBe('');
    });
  });

  describe('onSave - marks all fields as touched', () => {
    it('should mark all fields as touched before validation', () => {
      fixture.detectChanges();
      const spy = spyOn(component.form, 'markAllAsTouched');
      component.onSave();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('saveNewCommunication - loading state', () => {
    it('should set loading to true during save and false after success', () => {
      const mockCommunication = {
        dateAndTime: '2026-04-30T10:00:00',
        communicationType: 'EMAIL',
        communicationTypeDescription: 'Email',
        communicationCode: 'APPT',
        communicationCodeDescription: 'Appointment',
        actionCode: '',
        actionCodeDescription: '',
        comments: '',
        staffId: '',
        staffName: '',
        insertUserName: 'Test User',
        letterId: ''
      };
      service.createCommunication.and.returnValue(of(mockCommunication));
      fixture.detectChanges();
      component.form.patchValue({
        communicationType: 'EMAIL',
        communicationCode: 'APPT',
      });
      component.onSave();
      // After the observable completes synchronously, loading should be false
      expect(component.loading()).toBeFalse();
    });

    it('should set loading to false after save error', () => {
      service.createCommunication.and.returnValue(throwError(() => new Error('Save error')));
      spyOn(console, 'error');
      fixture.detectChanges();
      component.form.patchValue({
        communicationType: 'EMAIL',
        communicationCode: 'APPT',
      });
      component.onSave();
      expect(component.loading()).toBeFalse();
      expect(console.error).toHaveBeenCalledWith('Failed to save communication:', jasmine.any(Error));
    });
  });

  describe('getNativeInputText - private method via error matchers', () => {
    it('should return empty string when nativeElement is null', () => {
      fixture.detectChanges();
      (component as any).targetDateNativeInput = { nativeElement: null };
      const control = component.form.get('targetDate');
      control?.setValue(null);
      control?.markAsTouched();
      // getNativeInputText should return '' -> isErrorState returns false
      expect(component.targetDateErrorMatcher.isErrorState(control as any, null)).toBeFalse();
    });

    it('should return empty string when value is whitespace only', () => {
      fixture.detectChanges();
      (component as any).targetDateNativeInput = { nativeElement: { value: '   ' } };
      const control = component.form.get('targetDate');
      control?.setValue(null);
      control?.markAsTouched();
      // trim() of '   ' is '' which is falsy -> isErrorState returns false
      expect(component.targetDateErrorMatcher.isErrorState(control as any, null)).toBeFalse();
    });
  });

  describe('loadExistingData - currentDateTime formatting', () => {
    it('should set currentDateTime from communication dateAndTime', () => {
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-04-30'));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CommunicationDialogComponent, ReactiveFormsModule, NoopAnimationsModule, HttpClientTestingModule],
        providers: [
          { provide: NotificationLogService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: mockEditData },
          { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
        ]
      });
      const dtFixture = TestBed.createComponent(CommunicationDialogComponent);
      const dtComponent = dtFixture.componentInstance;
      dtFixture.detectChanges();
      // currentDateTime should be set from DateFieldValidationUtility.formatDateTimeForUI
      expect(dtComponent.currentDateTime()).toBeTruthy();
    });
  });

  describe('loadExistingData - dropdown population', () => {
    it('should populate communicationType dropdown from existing data', () => {
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-04-30'));
      TestBed.resetTestingModule();
      // Mock getCommunicationCodes to return empty so onTypeChange (triggered by patchValue)
      // doesn't interfere with our assertions about loadExistingData's direct population
      serviceSpy.getCommunicationCodes.and.returnValue(of([]));
      TestBed.configureTestingModule({
        imports: [CommunicationDialogComponent, ReactiveFormsModule, NoopAnimationsModule, HttpClientTestingModule],
        providers: [
          { provide: NotificationLogService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: mockEditData },
          { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
          { provide: HeaderService, useValue: headerServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
        ]
      });
      const dropFixture = TestBed.createComponent(CommunicationDialogComponent);
      const dropComponent = dropFixture.componentInstance;
      dropFixture.detectChanges();

      // communicationTypes populated from existing data (1 entry from loadExistingData)
      expect(dropComponent.communicationTypes().length).toBe(1);
      expect(dropComponent.communicationTypes()[0].value).toBe('EMAIL');
      expect(dropComponent.communicationTypes()[0].label).toBe('EMAIL - Email Communication');

      // communicationCodes: loadExistingData sets 1 item, but onTypeChange (triggered by
      // patchValue) calls getCommunicationCodes which returns [] and overwrites.
      // So communicationCodes ends up empty from the API call.
      // actionCodes and staffList are not overwritten by onTypeChange.
      expect(dropComponent.actionCodes().length).toBe(1);
      expect(dropComponent.actionCodes()[0].value).toBe('FOLLOW');

      expect(dropComponent.staffList().length).toBe(1);
      expect(dropComponent.staffList()[0].value).toBe('S001');
    });
  });

  describe('search controls - filter by value', () => {
    it('should filter communication types by value', () => {
      fixture.detectChanges();
      component.comTypeSearchControl.setValue('EMAIL');
      expect(component.filteredComTypes().length).toBe(1);
      expect(component.filteredComTypes()[0].value).toBe('EMAIL');
    });

    it('should filter communication codes by value', () => {
      fixture.detectChanges();
      component.communicationCodes.set([
        { value: 'APPT', label: 'APPT - Appointment' },
        { value: 'CONF', label: 'CONF - Confirmation' },
      ]);
      component.comCodeSearchControl.setValue('CONF');
      expect(component.filteredComCodes().length).toBe(1);
      expect(component.filteredComCodes()[0].value).toBe('CONF');
    });

    it('should filter action codes by value', () => {
      fixture.detectChanges();
      component.actionCodeSearchControl.setValue('CLOSE');
      expect(component.filteredActionCodes().length).toBe(1);
      expect(component.filteredActionCodes()[0].value).toBe('CLOSE');
    });

    it('should filter staff by value', () => {
      fixture.detectChanges();
      component.staffSearchControl.setValue('S001');
      expect(component.filteredStaff().length).toBe(1);
      expect(component.filteredStaff()[0].value).toBe('S001');
    });
  });

  describe('initializeForm - form controls in new mode', () => {
    it('should enable all controls in new mode', () => {
      fixture.detectChanges();
      expect(component.form.get('communicationType')?.enabled).toBeTrue();
      expect(component.form.get('communicationCode')?.enabled).toBeTrue();
      expect(component.form.get('comments')?.enabled).toBeTrue();
      expect(component.form.get('staffId')?.enabled).toBeTrue();
      expect(component.form.get('actionCode')?.enabled).toBeTrue();
      expect(component.form.get('targetDate')?.enabled).toBeTrue();
      expect(component.form.get('actionDate')?.enabled).toBeTrue();
    });

    it('should have required validator on communicationType', () => {
      fixture.detectChanges();
      const control = component.form.get('communicationType');
      control?.setValue('');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should have required validator on communicationCode', () => {
      fixture.detectChanges();
      const control = component.form.get('communicationCode');
      control?.setValue('');
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should have maxLength validator on comments', () => {
      fixture.detectChanges();
      const control = component.form.get('comments');
      control?.setValue('a'.repeat(2001));
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should accept comments within maxLength', () => {
      fixture.detectChanges();
      const control = component.form.get('comments');
      control?.setValue('a'.repeat(2000));
      expect(control?.hasError('maxlength')).toBeFalsy();
    });
  });

  describe('onTypeChange - clears code selection', () => {
    it('should clear communicationCode when type changes', () => {
      fixture.detectChanges();
      component.form.patchValue({ communicationCode: 'APPT' });
      component.form.patchValue({ communicationType: 'PHONE' });
      expect(component.form.get('communicationCode')?.value).toBe('');
      expect(component.selectedCodeDesc()).toBe('');
    });
  });
});
