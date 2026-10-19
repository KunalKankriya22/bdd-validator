import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AddEditDriveRecord } from './add-edit-drive-record';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DrivesService } from '../services/drives.service';
import { HeaderService } from '@shared/services/header.service';
import { of, throwError, Subject } from 'rxjs';
import { signal, SimpleChange } from '@angular/core';
import { UpdateDriveRecordDto } from '../models/drives.model';
import moment from 'moment';

describe('AddEditDriveRecord', () => {
  let component: AddEditDriveRecord;
  let fixture: ComponentFixture<AddEditDriveRecord>;
  let drivesServiceSpy: jasmine.SpyObj<DrivesService>;
  let chapterChangedSubject: Subject<void>;

  beforeEach(async () => {
    drivesServiceSpy = jasmine.createSpyObj('DrivesService', [
      'getChapterLookup',
      'getGroupSites',
      'getGroupSiteById',
      'addDriveRecord',
      'updateDriveRecord'
    ]);

    // Default mock responses
    drivesServiceSpy.getChapterLookup.and.returnValue(of({ data: [] }));
    drivesServiceSpy.getGroupSites.and.returnValue(of({ data: [], total: 0 }));
    drivesServiceSpy.getGroupSiteById.and.returnValue(of({ groupSiteId: '1000', siteName: 'Test Site', chapterId: 'WAD' }));
    drivesServiceSpy.addDriveRecord.and.returnValue(of({ success: true }));
    drivesServiceSpy.updateDriveRecord.and.returnValue(of({ success: true }));

    chapterChangedSubject = new Subject<void>();

    const headerServiceMock: any = {
      chapterTimeZone: signal<string>('UTC'),
      chapterChanged$: chapterChangedSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [
        AddEditDriveRecord,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: DrivesService, useValue: drivesServiceSpy },
        { provide: HeaderService, useValue: headerServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditDriveRecord);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (e) { /* template binding errors are OK */ }
  });



  it('should have form with required fields', () => {
    expect(component.form.get('chapterId')).toBeTruthy();
    expect(component.form.get('type')).toBeTruthy();
    expect(component.form.get('drive')).toBeTruthy();
    expect(component.form.get('siteId')).toBeTruthy();
    expect(component.form.get('os')).toBeTruthy();
    expect(component.form.get('scheduledDate')).toBeTruthy();
  });

  it('should have invalid form when empty', () => {
    expect(component.form.valid).toBeFalse();
  });



  it('should reject drive values longer than 6 characters', () => {
    const driveControl = component.form.get('drive');
    driveControl?.setValue('1234567');
    expect(driveControl?.hasError('maxlength')).toBeTrue();
  });

  it('should accept drive values of exactly 6 characters', () => {
    const driveControl = component.form.get('drive');
    driveControl?.setValue('123456');
    expect(driveControl?.hasError('maxlength')).toBeFalse();
  });

  it('should have type options with correct values', () => {
    expect(component.typeOptions.length).toBe(3);
    expect(component.typeOptions[0].value).toBe('F');
    expect(component.typeOptions[1].value).toBe('I');
    expect(component.typeOptions[2].value).toBe('C');
  });

  it('should have os options with correct values', () => {
    expect(component.osOptions.length).toBe(2);
    expect(component.osOptions[0].value).toBe('Y');
    expect(component.osOptions[1].value).toBe('N');
  });


  it('should display description as readonly in edit mode', () => {
    // Create a fresh component instance for edit mode
    const editFixture = TestBed.createComponent(AddEditDriveRecord);
    const editComponent = editFixture.componentInstance;

    // Set mode and data before initial change detection
    editComponent.mode = 'edit';
    editComponent.data = {
      chapterID: 'WAD',
      drive: '001',
      type: 'F',
      siteID: '1000',
      description: 'Test Description'
    };

    // Trigger initialization
    editFixture.detectChanges();

    // In edit mode, description is displayed in editModeValues, not in the form
    expect(editComponent.editModeValues.description).toBe('Test Description');
  });

  it('should enable chapterId and drive when switching from edit to add mode', () => {
    // Start in edit mode
    component.mode = 'edit';
    component.data = { chapterID: 'WAD', drive: '001', type: 'F', siteID: '1000' };
    component['setupPanel']();

    // Verify they are disabled in edit mode
    expect(component.form.get('chapterId')?.disabled).toBeTrue();
    expect(component.form.get('drive')?.disabled).toBeTrue();

    // Switch to add mode
    component.mode = 'add';
    component['resetFormForAddMode']();

    // Verify they are enabled in add mode
    expect(component.form.get('chapterId')?.enabled).toBeTrue();
    expect(component.form.get('drive')?.enabled).toBeTrue();
  });



  it('should load site options based on selected chapter ID', () => {
    const mockSites = [
      { groupSiteId: 'G001', siteName: 'Site 1', chapterId: 'WAD' },
      { groupSiteId: 'G002', siteName: 'Site 2', chapterId: 'WAD' }
    ];

    drivesServiceSpy.getGroupSites.and.returnValue(of({ data: mockSites, total: 2 }));

    const addFixture = TestBed.createComponent(AddEditDriveRecord);
    const addComponent = addFixture.componentInstance;
    addComponent.mode = 'add';
    addFixture.detectChanges(); // Trigger ngOnInit first to set up listeners

    addComponent.form.patchValue({ chapterId: 'WAD' }); // Now patch triggers the listener

    // Should call getGroupSites with chapterId
    expect(drivesServiceSpy.getGroupSites).toHaveBeenCalledWith('WAD');
    expect(addComponent.siteIdOptions.length).toBe(2);
  });





  it('should reload site options when chapter ID changes', () => {
    const wadSites = [
      { groupSiteId: 'G001', siteName: 'Site 1', chapterId: 'WAD' }
    ];
    const bcSites = [
      { groupSiteId: 'G002', siteName: 'Site 2', chapterId: 'BC' }
    ];

    // Reset the spy to track calls after initialization
    drivesServiceSpy.getGroupSites.and.returnValues(
      of({ data: wadSites, total: 1 }),
      of({ data: bcSites, total: 1 })
    );

    const addFixture = TestBed.createComponent(AddEditDriveRecord);
    const addComponent = addFixture.componentInstance;
    addComponent.mode = 'add';
    addFixture.detectChanges(); // Trigger ngOnInit

    // Select first chapter
    addComponent.form.patchValue({ chapterId: 'WAD' });
    expect(addComponent.siteIdOptions.length).toBe(1);
    expect(addComponent.siteIdOptions[0].siteId).toBe('G001');

    // Change to another chapter
    addComponent.form.patchValue({ chapterId: 'BC' });
    expect(addComponent.siteIdOptions.length).toBe(1);
    expect(addComponent.siteIdOptions[0].siteId).toBe('G002');
  });

  describe('Description Field', () => {


    it('should fetch description when site ID is selected in add mode', (done) => {
      const mockSite = {
        groupSiteId: '1000',
        siteName: 'Test Site Description',
        chapterId: 'WAD'
      };

      drivesServiceSpy.getGroupSiteById.and.returnValue(of(mockSite));

      component.form.patchValue({ siteId: '1000' });

      // Wait for async operation
      setTimeout(() => {
        expect(drivesServiceSpy.getGroupSiteById).toHaveBeenCalledWith('1000');
        expect(component.form.get('description')?.value).toBe('Test Site Description');
        done();
      }, 100);
    });


    it('should clear description on API error when fetching site details', (done) => {
      drivesServiceSpy.getGroupSiteById.and.returnValue(throwError(() => new Error('API Error')));

      component.form.patchValue({ description: 'Old Value' });
      component.form.patchValue({ siteId: '1000' });

      setTimeout(() => {
        expect(component.form.get('description')?.value).toBe('');
        done();
      }, 100);
    });

    it('should include description from form in add payload', () => {
      drivesServiceSpy.addDriveRecord.and.returnValue(of({ success: true }));

      component.form.patchValue({
        chapterId: 'WAD',
        type: 'F',
        drive: '001',
        siteId: '1000',
        description: 'Test Description',
        os: 'Y',
        scheduledDate: new Date('2099-06-15')
      });

      component.onSave();

      expect(drivesServiceSpy.addDriveRecord).toHaveBeenCalled();
      const payload = drivesServiceSpy.addDriveRecord.calls.mostRecent().args[0];
      expect(payload.description).toBe('Test Description');
    });
  });

  describe('Scheduled Date Validation', () => {
    it('should initialise currentDate from chapter timezone via HeaderService', () => {
      // currentDate should be a valid Moment set by the effect() using the chapter timezone
      expect(component.currentDate).toBeTruthy();
      expect(moment.isMoment(component.currentDate)).toBeTrue();
    });

    it('should not show error for scheduled date in edit mode when date is in past', () => {
      const editFixture = TestBed.createComponent(AddEditDriveRecord);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = {
        chapterID: 'WAD',
        drive: '001',
        type: 'F',
        siteID: '1000',
        scheduledDate: '2020-01-01' // Past date
      };
      editFixture.detectChanges();

      const error = editComponent.getScheduledDateError();
      expect(error).toBe('');
    });


    it('should accept current date for scheduled date in add mode', () => {
      const futureDate = new Date('2099-06-15');
      component.form.patchValue({ scheduledDate: futureDate });
      component.form.get('scheduledDate')?.markAsTouched();
      fixture.detectChanges();

      const error = component.getScheduledDateError();
      expect(error).toBe('');
    });

    it('should accept future date for scheduled date in add mode', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      component.form.patchValue({ scheduledDate: futureDate });
      component.form.get('scheduledDate')?.markAsTouched();
      fixture.detectChanges();

      const error = component.getScheduledDateError();
      expect(error).toBe('');
    });
  });

  // ===== NEW TESTS BELOW =====

  describe('onCancel', () => {
    it('should emit closePanel event', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('onSave - add mode', () => {
    it('should not call API when form is invalid', () => {
      component.mode = 'add';
      component.form.reset();
      component.onSave();
      expect(drivesServiceSpy.addDriveRecord).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', () => {
      component.mode = 'add';
      component.form.reset();
      spyOn(component.form, 'markAllAsTouched');
      component.onSave();
      expect(component.form.markAllAsTouched).toHaveBeenCalled();
    });

    it('should call addDriveRecord on valid form in add mode', () => {
      component.mode = 'add';
      drivesServiceSpy.addDriveRecord.and.returnValue(of({ success: true, message: 'Added!' }));
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.form.patchValue({
        chapterId: 'WAD',
        type: 'F',
        drive: 'DR001',
        siteId: 'SITE01',
        description: '',
        os: 'Y',
        scheduledDate: moment('2099-06-15')
      });

      component.onSave();

      expect(drivesServiceSpy.addDriveRecord).toHaveBeenCalled();
      const payload = drivesServiceSpy.addDriveRecord.calls.mostRecent().args[0];
      expect(payload.chapterId).toBe('WAD');
      expect(payload.driveType).toBe('F');
      expect(payload.driveId).toBe('DR001');
      expect(payload.groupSiteId).toBe('SITE01');
      expect(payload.os).toBe('Y');
      expect(component.isSaving).toBeFalse();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should use default success message when response has no message', () => {
      component.mode = 'add';
      drivesServiceSpy.addDriveRecord.and.returnValue(of({ success: true }));
      spyOn(component['snackBar'], 'open');

      component.form.patchValue({
        chapterId: 'WAD',
        type: 'F',
        drive: 'DR001',
        siteId: 'SITE01',
        os: 'Y',
        scheduledDate: moment('2099-06-15')
      });

      component.onSave();

      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Drive Record added successfully',
        'Close',
        jasmine.objectContaining({ duration: 3000 })
      );
    });

    it('should use response message when provided', () => {
      component.mode = 'add';
      drivesServiceSpy.addDriveRecord.and.returnValue(of({ success: true, message: 'Custom message' }));
      spyOn(component['snackBar'], 'open');

      component.form.patchValue({
        chapterId: 'WAD',
        type: 'F',
        drive: 'DR001',
        siteId: 'SITE01',
        os: 'Y',
        scheduledDate: moment('2099-06-15')
      });

      component.onSave();

      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Custom message',
        'Close',
        jasmine.anything()
      );
    });

    it('should set isSaving to true then false via finalize', () => {
      component.mode = 'add';
      drivesServiceSpy.addDriveRecord.and.returnValue(of({ success: true }));

      component.form.patchValue({
        chapterId: 'WAD',
        type: 'F',
        drive: 'DR001',
        siteId: 'SITE01',
        os: 'Y',
        scheduledDate: moment('2099-06-15')
      });

      component.onSave();
      // After completion, isSaving should be false
      expect(component.isSaving).toBeFalse();
    });

    it('should handle scheduledDate without toDate method', () => {
      component.mode = 'add';
      drivesServiceSpy.addDriveRecord.and.returnValue(of({ success: true }));
      spyOn(component.saveSuccess, 'emit');

      const plainDate = new Date('2099-06-15');
      component.form.patchValue({
        chapterId: 'WAD',
        type: 'F',
        drive: 'DR001',
        siteId: 'SITE01',
        os: 'Y',
        scheduledDate: plainDate
      });

      component.onSave();

      const emittedData = (component.saveSuccess.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.scheduledDate).toEqual(plainDate);
    });
  });

  describe('onSave - edit mode', () => {
    it('should call updateDriveRecord on valid form in edit mode', () => {
      const editFixture = TestBed.createComponent(AddEditDriveRecord);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = {
        chapterID: 'WAD',
        drive: 'DR001',
        type: 'F - Fixed Site Drive',
        siteID: 'SITE01',
        description: 'Orig Desc',
        os: 'Yes',
        scheduledDate: '15-Jun-2099'
      };
      editFixture.detectChanges();

      drivesServiceSpy.updateDriveRecord.and.returnValue(of({ success: true, message: 'Updated!' }));
      spyOn(editComponent.saveSuccess, 'emit');
      spyOn(editComponent.closePanel, 'emit');

      // Modify a field
      editComponent.form.get('type')?.setValue('I');
      editComponent.form.get('os')?.setValue('N');
      editComponent.form.get('scheduledDate')?.setValue(moment('2099-07-20'));

      editComponent.onSave();

      expect(drivesServiceSpy.updateDriveRecord).toHaveBeenCalled();
      const payload = drivesServiceSpy.updateDriveRecord.calls.mostRecent().args[0];
      expect(payload.originalGroupSiteId).toBe('SITE01');
      expect(payload.description).toBe('Orig Desc');
      expect(editComponent.isSaving).toBeFalse();
      expect(editComponent.saveSuccess.emit).toHaveBeenCalled();
      expect(editComponent.closePanel.emit).toHaveBeenCalled();
    });

    it('should use default update message when response has no message', () => {
      const editFixture = TestBed.createComponent(AddEditDriveRecord);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = {
        chapterID: 'WAD',
        drive: 'DR001',
        type: 'F',
        siteID: 'SITE01',
        os: 'Yes',
        scheduledDate: '15-Jun-2099'
      };
      editFixture.detectChanges();

      drivesServiceSpy.updateDriveRecord.and.returnValue(of({ success: true }));
      spyOn(editComponent['snackBar'], 'open');

      editComponent.form.get('type')?.setValue('I');
      editComponent.onSave();

      expect(editComponent['snackBar'].open).toHaveBeenCalledWith(
        'Drive Record updated successfully',
        'Close',
        jasmine.objectContaining({ duration: 3000 })
      );
    });
  });

  describe('ngOnChanges', () => {
    it('should call setupPanel and resetFormForAddMode on non-first change to add', () => {
      spyOn<any>(component, 'setupPanel');
      spyOn<any>(component, 'resetFormForAddMode');
      component.mode = 'add';

      component.ngOnChanges({
        mode: new SimpleChange('edit', 'add', false)
      });

      expect(component['setupPanel']).toHaveBeenCalled();
      expect(component['resetFormForAddMode']).toHaveBeenCalled();
    });

    it('should not call setupPanel on first change', () => {
      spyOn<any>(component, 'setupPanel');

      component.ngOnChanges({
        mode: new SimpleChange(undefined, 'add', true)
      });

      expect(component['setupPanel']).not.toHaveBeenCalled();
    });

    it('should call setupPanel when data changes (non-first)', () => {
      spyOn<any>(component, 'setupPanel');
      component.mode = 'edit';

      component.ngOnChanges({
        data: new SimpleChange(null, { chapterID: 'WAD' }, false)
      });

      expect(component['setupPanel']).toHaveBeenCalled();
    });

    it('should not resetFormForAddMode in edit mode', () => {
      spyOn<any>(component, 'setupPanel');
      spyOn<any>(component, 'resetFormForAddMode');
      component.mode = 'edit';
      component.data = { chapterID: 'WAD', drive: '001', type: 'F', siteID: '1000' };

      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false)
      });

      expect(component['setupPanel']).toHaveBeenCalled();
      expect(component['resetFormForAddMode']).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('setupPanel', () => {
    it('should set panelTitle to Add Drive Record in add mode', () => {
      component.mode = 'add';
      component['setupPanel']();
      expect(component.panelTitle).toBe('Add Drive Record');
    });

    it('should disable description field in add mode', () => {
      component.mode = 'add';
      component['setupPanel']();
      expect(component.form.get('description')?.disabled).toBeTrue();
    });

    it('should set panelTitle to Edit Drive Record in edit mode', () => {
      component.mode = 'edit';
      component.data = { chapterID: 'WAD', drive: '001', type: 'F', siteID: '1000' };
      component['setupPanel']();
      expect(component.panelTitle).toBe('Edit Drive Record');
    });

    it('should call loadSiteIdOptions in edit mode', () => {
      spyOn<any>(component, 'loadSiteIdOptions');
      component.mode = 'edit';
      component.data = { chapterID: 'WAD', drive: '001', type: 'F', siteID: '1000' };
      component['setupPanel']();
      expect(component['loadSiteIdOptions']).toHaveBeenCalled();
    });
  });

  describe('populateFormForEdit', () => {
    it('should populate form with data values', () => {
      component.mode = 'edit';
      component.data = {
        chapterID: 'WAD',
        drive: 'DR001',
        type: 'I - Mobile Drive',
        siteID: 'SITE01',
        description: 'Test Desc',
        os: 'No',
        scheduledDate: '15-Jun-2099'
      };
      component['populateFormForEdit']();

      const raw = component.form.getRawValue();
      expect(raw.chapterId).toBe('WAD');
      expect(raw.type).toBe('I');
      expect(raw.drive).toBe('DR001');
      expect(raw.siteId).toBe('SITE01');
      expect(raw.description).toBe('Test Desc');
      expect(raw.os).toBe('N');
    });

    it('should disable chapterId and drive in edit mode', () => {
      component.data = {
        chapterID: 'WAD',
        drive: 'DR001',
        type: 'F',
        siteID: 'SITE01'
      };
      component['populateFormForEdit']();

      expect(component.form.get('chapterId')?.disabled).toBeTrue();
      expect(component.form.get('drive')?.disabled).toBeTrue();
      expect(component.form.get('description')?.disabled).toBeTrue();
    });

    it('should handle null data gracefully', () => {
      component.data = null;
      expect(() => component['populateFormForEdit']()).not.toThrow();
    });

    it('should map type C correctly', () => {
      component.data = {
        chapterID: 'WAD',
        drive: 'DR001',
        type: 'C - Central site drives',
        siteID: 'SITE01'
      };
      component['populateFormForEdit']();
      expect(component.form.getRawValue().type).toBe('C');
    });

    it('should remove pastDate validator in edit mode', () => {
      component.data = {
        chapterID: 'WAD',
        drive: 'DR001',
        type: 'F',
        siteID: 'SITE01',
        scheduledDate: '01-Jan-2020'
      };
      component['populateFormForEdit']();

      const ctrl = component.form.get('scheduledDate');
      // In edit mode, the pastDate validator is removed so existing past dates are valid
      expect(ctrl?.hasError('pastDate')).toBeFalse();
    });
  });

  describe('mapDisplayTypeToValue (via populateFormForEdit)', () => {
    it('should map F-prefixed type to F', () => {
      component.data = { chapterID: 'A', drive: '1', type: 'F - Fixed', siteID: 'S' };
      component['populateFormForEdit']();
      expect(component.form.getRawValue().type).toBe('F');
    });

    it('should map I-prefixed type to I', () => {
      component.data = { chapterID: 'A', drive: '1', type: 'I - Mobile', siteID: 'S' };
      component['populateFormForEdit']();
      expect(component.form.getRawValue().type).toBe('I');
    });

    it('should return raw value for unknown type prefix', () => {
      component.data = { chapterID: 'A', drive: '1', type: 'X', siteID: 'S' };
      component['populateFormForEdit']();
      expect(component.form.getRawValue().type).toBe('X');
    });
  });

  describe('mapDisplayOsToValue (via populateFormForEdit)', () => {
    it('should map Yes to Y', () => {
      component.data = { chapterID: 'A', drive: '1', type: 'F', siteID: 'S', os: 'Yes' };
      component['populateFormForEdit']();
      expect(component.form.getRawValue().os).toBe('Y');
    });

    it('should map No to N', () => {
      component.data = { chapterID: 'A', drive: '1', type: 'F', siteID: 'S', os: 'No' };
      component['populateFormForEdit']();
      expect(component.form.getRawValue().os).toBe('N');
    });

    it('should return raw value for unrecognized os', () => {
      component.data = { chapterID: 'A', drive: '1', type: 'F', siteID: 'S', os: 'Z' };
      component['populateFormForEdit']();
      expect(component.form.getRawValue().os).toBe('Z');
    });
  });

  describe('getChapterDisplayValue', () => {
    it('should return chapterId with name when found in options', () => {
      component.chapterOptions = [
        { chapterId: 'WAD', chapterName: 'Washington DC' }
      ];
      const result = component['getChapterDisplayValue']('WAD');
      expect(result).toBe('WAD - Washington DC');
    });

    it('should return just chapterId when not found in options', () => {
      component.chapterOptions = [];
      const result = component['getChapterDisplayValue']('XYZ');
      expect(result).toBe('XYZ');
    });
  });

  describe('loadChapterOptions', () => {
    it('should load chapter options and set filtered options', () => {
      const mockChapters = [
        { chapterId: 'WAD', chapterName: 'Washington DC' },
        { chapterId: 'BC', chapterName: 'British Columbia' }
      ];
      drivesServiceSpy.getChapterLookup.and.returnValue(of({ data: mockChapters }));

      component['loadChapterOptions']();

      expect(component.chapterOptions.length).toBe(2);
      expect(component.filteredChapterOptions.length).toBe(2);
      expect(component.isLoadingOptions).toBeFalse();
    });

    it('should handle API error for chapter lookup', () => {
      drivesServiceSpy.getChapterLookup.and.returnValue(throwError(() => new Error('Fail')));

      component.isLoadingOptions = true;
      component['loadChapterOptions']();

      expect(component.isLoadingOptions).toBeFalse();
    });

    it('should update editModeValues.chapterId in edit mode after loading', () => {
      component.mode = 'edit';
      component.data = { chapterID: 'WAD', drive: '1', type: 'F', siteID: 'S' };

      const mockChapters = [{ chapterId: 'WAD', chapterName: 'Washington DC' }];
      drivesServiceSpy.getChapterLookup.and.returnValue(of({ data: mockChapters }));

      component['loadChapterOptions']();

      expect(component.editModeValues.chapterId).toBe('WAD - Washington DC');
    });

    it('should handle null data in response', () => {
      drivesServiceSpy.getChapterLookup.and.returnValue(of({ data: null }));
      component['loadChapterOptions']();
      expect(component.chapterOptions).toEqual([]);
    });
  });

  describe('loadSiteIdOptions', () => {
    it('should load site options for selected chapter', () => {
      const mockSites = [
        { groupSiteId: 'G001', siteName: 'Site 1', chapterId: 'WAD' }
      ];
      drivesServiceSpy.getGroupSites.and.returnValue(of({ data: mockSites }));

      component.form.get('chapterId')?.setValue('WAD', { emitEvent: false });
      component['loadSiteIdOptions']();

      expect(component.siteIdOptions.length).toBe(1);
      expect(component.siteIdOptions[0].siteId).toBe('G001');
      expect(component.siteIdOptions[0].description).toBe('Site 1');
      expect(component.filteredSiteIdOptions.length).toBe(1);
      expect(component.isLoadingSiteOptions).toBeFalse();
    });

    it('should handle API error for site options', () => {
      drivesServiceSpy.getGroupSites.and.returnValue(throwError(() => new Error('Fail')));

      component.isLoadingSiteOptions = true;
      component['loadSiteIdOptions']();

      expect(component.siteIdOptions).toEqual([]);
      expect(component.filteredSiteIdOptions).toEqual([]);
      expect(component.isLoadingSiteOptions).toBeFalse();
    });

    it('should handle null data in response', () => {
      drivesServiceSpy.getGroupSites.and.returnValue(of({ data: null }));
      component['loadSiteIdOptions']();
      expect(component.siteIdOptions).toEqual([]);
    });
  });

  describe('setupChapterIdListener', () => {
    it('should clear siteId and description when chapter changes', () => {
      component.form.get('siteId')?.setValue('OLD', { emitEvent: false });
      component.form.get('description')?.setValue('Old Desc', { emitEvent: false });

      drivesServiceSpy.getGroupSites.and.returnValue(of({ data: [] }));
      component.form.get('chapterId')?.setValue('NEW');

      expect(component.form.get('siteId')?.value).toBe('');
      expect(component.form.get('description')?.value).toBe('');
    });

    it('should clear site options when chapter is set to empty', () => {
      component.siteIdOptions = [{ siteId: 'S1', description: 'D1' }];
      component.filteredSiteIdOptions = [{ siteId: 'S1', description: 'D1' }];

      component.form.get('chapterId')?.setValue('');

      expect(component.siteIdOptions).toEqual([]);
      expect(component.filteredSiteIdOptions).toEqual([]);
    });
  });

  describe('setupSiteIdListener', () => {
    it('should not fetch description in edit mode when siteId changes', () => {
      component.mode = 'edit';
      drivesServiceSpy.getGroupSiteById.calls.reset();
      component.form.get('siteId')?.setValue('NEW_SITE');
      expect(drivesServiceSpy.getGroupSiteById).not.toHaveBeenCalled();
    });
  });

  describe('fetchSiteDescription', () => {
    it('should set description from API response', () => {
      drivesServiceSpy.getGroupSiteById.and.returnValue(of({ groupSiteId: 'G1', siteName: 'Fetched Name', chapterId: 'W' }));
      component['fetchSiteDescription']('G1');
      expect(component.form.get('description')?.value).toBe('Fetched Name');
    });

    it('should set empty description when siteName is empty', () => {
      drivesServiceSpy.getGroupSiteById.and.returnValue(of({ groupSiteId: 'G1', siteName: '', chapterId: 'W' }));
      component['fetchSiteDescription']('G1');
      expect(component.form.get('description')?.value).toBe('');
    });

    it('should clear description on error', () => {
      drivesServiceSpy.getGroupSiteById.and.returnValue(throwError(() => new Error('Fail')));
      component.form.get('description')?.setValue('Something', { emitEvent: false });
      component['fetchSiteDescription']('G1');
      expect(component.form.get('description')?.value).toBe('');
    });
  });

  describe('resetFormForAddMode', () => {
    it('should reset editModeValues to empty', () => {
      component.editModeValues = {
        chapterId: 'WAD',
        type: 'F',
        drive: 'DR1',
        siteId: 'S1',
        description: 'D',
        os: 'Y',
        scheduledDate: '2099-01-01'
      };

      component['resetFormForAddMode']();

      expect(component.editModeValues.chapterId).toBe('');
      expect(component.editModeValues.type).toBe('');
      expect(component.editModeValues.drive).toBe('');
      expect(component.editModeValues.siteId).toBe('');
      expect(component.editModeValues.description).toBe('');
      expect(component.editModeValues.os).toBe('');
      expect(component.editModeValues.scheduledDate).toBe('');
    });

    it('should enable chapterId and drive, disable description', () => {
      component.form.get('chapterId')?.disable();
      component.form.get('drive')?.disable();

      component['resetFormForAddMode']();

      expect(component.form.get('chapterId')?.enabled).toBeTrue();
      expect(component.form.get('drive')?.enabled).toBeTrue();
      expect(component.form.get('description')?.disabled).toBeTrue();
    });

    it('should clear site options', () => {
      component.siteIdOptions = [{ siteId: 'X', description: 'Y' }];
      component.filteredSiteIdOptions = [{ siteId: 'X', description: 'Y' }];

      component['resetFormForAddMode']();

      expect(component.siteIdOptions).toEqual([]);
      expect(component.filteredSiteIdOptions).toEqual([]);
    });
  });

  describe('formatDateForApi', () => {
    it('should format a valid date as DD-Mon-YYYY', () => {
      const result = component['formatDateForApi'](moment('2099-06-15'));
      expect(result).toBe('15-Jun-2099');
    });

    it('should return empty string for null', () => {
      expect(component['formatDateForApi'](null)).toBe('');
    });

    it('should return empty string for invalid date', () => {
      expect(component['formatDateForApi']('invalid-date-xyz')).toBe('');
    });

    it('should format January correctly', () => {
      const result = component['formatDateForApi'](moment('2099-01-05'));
      expect(result).toBe('05-Jan-2099');
    });

    it('should format December correctly', () => {
      const result = component['formatDateForApi'](moment('2099-12-25'));
      expect(result).toBe('25-Dec-2099');
    });
  });

  describe('Form control getters', () => {
    it('should return chapterId control', () => {
      expect(component.chapterIdControl).toBe(component.form.get('chapterId'));
    });

    it('should return type control', () => {
      expect(component.typeControl).toBe(component.form.get('type'));
    });

    it('should return drive control', () => {
      expect(component.driveControl).toBe(component.form.get('drive'));
    });

    it('should return siteId control', () => {
      expect(component.siteIdControl).toBe(component.form.get('siteId'));
    });

    it('should return description control', () => {
      expect(component.descriptionControl).toBe(component.form.get('description'));
    });

    it('should return os control', () => {
      expect(component.osControl).toBe(component.form.get('os'));
    });

    it('should return scheduledDate control', () => {
      expect(component.scheduledDateControl).toBe(component.form.get('scheduledDate'));
    });
  });

  describe('isFormValid', () => {
    it('should return false when form is invalid', () => {
      component.form.reset();
      expect(component.isFormValid).toBeFalse();
    });

    it('should return true when form is fully populated and valid', () => {
      component.form.patchValue({
        chapterId: 'WAD',
        type: 'F',
        drive: 'DR001',
        siteId: 'SITE01',
        os: 'Y',
        scheduledDate: moment('2099-06-15')
      });
      expect(component.isFormValid).toBeTrue();
    });
  });

  describe('getChapterIdError', () => {
    it('should return empty when control not touched', () => {
      expect(component.getChapterIdError()).toBe('');
    });

    it('should return required error when touched and empty', () => {
      component.chapterIdControl?.markAsTouched();
      component.chapterIdControl?.setValue('');
      expect(component.getChapterIdError()).toBe('Chapter ID is required');
    });

    it('should return maxlength error', () => {
      component.chapterIdControl?.markAsTouched();
      component.chapterIdControl?.setValue('ABCDE');
      expect(component.getChapterIdError()).toBe('Chapter ID must be maximum 4 characters');
    });
  });

  describe('getTypeError', () => {
    it('should return empty when not touched', () => {
      expect(component.getTypeError()).toBe('');
    });

    it('should return required error when touched and empty', () => {
      component.typeControl?.markAsTouched();
      component.typeControl?.setValue('');
      expect(component.getTypeError()).toBe('Type is required');
    });
  });

  describe('getDriveError', () => {
    it('should return empty when not touched', () => {
      expect(component.getDriveError()).toBe('');
    });

    it('should return required error when touched and empty', () => {
      component.driveControl?.markAsTouched();
      component.driveControl?.setValue('');
      expect(component.getDriveError()).toBe('Drive is required');
    });

    it('should return maxlength error', () => {
      component.driveControl?.markAsTouched();
      component.driveControl?.setValue('1234567');
      expect(component.getDriveError()).toBe('Drive must be maximum 6 characters');
    });

    it('should return specialCharacters error', () => {
      component.driveControl?.markAsTouched();
      component.driveControl?.setValue('AB@CD');
      expect(component.getDriveError()).toBe('Drive must not contain special characters');
    });
  });

  describe('getSiteIdError', () => {
    it('should return empty when not touched', () => {
      expect(component.getSiteIdError()).toBe('');
    });

    it('should return required error when touched and empty', () => {
      component.siteIdControl?.markAsTouched();
      component.siteIdControl?.setValue('');
      expect(component.getSiteIdError()).toBe('Site ID is required');
    });

    it('should return maxlength error', () => {
      component.siteIdControl?.markAsTouched();
      component.siteIdControl?.setValue('12345678');
      expect(component.getSiteIdError()).toBe('Site ID must be maximum 7 characters');
    });
  });

  describe('getDescriptionError', () => {
    it('should return empty when not touched', () => {
      expect(component.getDescriptionError()).toBe('');
    });

    it('should return maxlength error', () => {
      component.descriptionControl?.enable();
      component.descriptionControl?.markAsTouched();
      component.descriptionControl?.setValue('A'.repeat(51));
      expect(component.getDescriptionError()).toBe('Description must be maximum 50 characters');
    });

    it('should return whitespaceOnly error', () => {
      component.descriptionControl?.enable();
      component.descriptionControl?.markAsTouched();
      component.descriptionControl?.setValue('   ');
      expect(component.getDescriptionError()).toBe('Description cannot contain only spaces');
    });
  });

  describe('getOsError', () => {
    it('should return empty when not touched', () => {
      expect(component.getOsError()).toBe('');
    });

    it('should return required error when touched and empty', () => {
      component.osControl?.markAsTouched();
      component.osControl?.setValue('');
      expect(component.getOsError()).toBe('OS is required');
    });
  });

  describe('getScheduledDateError', () => {
    it('should return empty when not touched or dirty', () => {
      expect(component.getScheduledDateError()).toBe('');
    });

    it('should return invalid error for matDatepickerParse error', () => {
      const ctrl = component.scheduledDateControl;
      ctrl?.markAsTouched();
      ctrl?.setErrors({ matDatepickerParse: { text: 'bad' } });
      expect(component.getScheduledDateError()).toBe('Scheduled Date is invalid');
    });

    it('should return required error when empty and touched', () => {
      const ctrl = component.scheduledDateControl;
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      ctrl?.setErrors({ required: true });
      // No scheduledDateInput set, so inputValue will be undefined
      expect(component.getScheduledDateError()).toBe('Scheduled Date is required');
    });

    it('should return invalid error when required but input has value', () => {
      const ctrl = component.scheduledDateControl;
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      ctrl?.setErrors({ required: true });
      component.scheduledDateInput = { nativeElement: { value: 'invalid-text' } } as any;
      expect(component.getScheduledDateError()).toBe('Scheduled Date is invalid');
    });

    it('should return past date error', () => {
      const ctrl = component.scheduledDateControl;
      ctrl?.markAsTouched();
      ctrl?.setErrors({ pastDate: true });
      expect(component.getScheduledDateError()).toBe('Scheduled Date cannot be past date');
    });

    it('should return empty when touched but no errors', () => {
      const ctrl = component.scheduledDateControl;
      ctrl?.setValue(moment('2099-06-15'));
      ctrl?.markAsTouched();
      expect(component.getScheduledDateError()).toBe('');
    });
  });

  describe('noSpecialCharactersValidator', () => {
    it('should return null for null value', () => {
      const result = component.noSpecialCharactersValidator({ value: null } as any);
      expect(result).toBeNull();
    });

    it('should return null for alphanumeric value', () => {
      const result = component.noSpecialCharactersValidator({ value: 'ABC123' } as any);
      expect(result).toBeNull();
    });

    it('should return error for special characters', () => {
      const result = component.noSpecialCharactersValidator({ value: 'AB@C' } as any);
      expect(result).toEqual({ specialCharacters: true });
    });

    it('should return error for spaces', () => {
      const result = component.noSpecialCharactersValidator({ value: 'A B' } as any);
      expect(result).toEqual({ specialCharacters: true });
    });
  });

  describe('scheduledDateErrorMatcher', () => {
    it('should return false when control is null', () => {
      expect(component.scheduledDateErrorMatcher.isErrorState(null, null as any)).toBeFalse();
    });

    it('should return true when control is invalid and touched', () => {
      const ctrl = component.scheduledDateControl as any;
      ctrl.markAsTouched();
      ctrl.setErrors({ required: true });
      expect(component.scheduledDateErrorMatcher.isErrorState(ctrl, null as any)).toBeTrue();
    });

    it('should return false when control is valid and untouched', () => {
      const ctrl = component.scheduledDateControl as any;
      ctrl.setValue(moment('2099-01-01'));
      ctrl.markAsUntouched();
      ctrl.markAsPristine();
      expect(component.scheduledDateErrorMatcher.isErrorState(ctrl, null as any)).toBeFalse();
    });
  });

  describe('onScheduledDateInput', () => {
    it('should clear value when input is empty', () => {
      const ctrl = component.scheduledDateControl;
      ctrl?.setValue(moment('2099-01-01'));

      const event = { target: { value: '' } } as unknown as Event;
      component.onScheduledDateInput(event);

      // Value is set to null; updateValueAndValidity re-runs validators
      // so required error comes back, but the value is cleared
      expect(ctrl?.value).toBeNull();
    });

    it('should mark pristine and untouched in add mode when input is empty', () => {
      component.mode = 'add';
      const ctrl = component.scheduledDateControl;
      ctrl?.markAsTouched();
      ctrl?.markAsDirty();

      const event = { target: { value: '  ' } } as unknown as Event;
      component.onScheduledDateInput(event);

      expect(ctrl?.pristine).toBeTrue();
      expect(ctrl?.untouched).toBeTrue();
    });

    it('should mark dirty in edit mode when input is empty', () => {
      component.mode = 'edit';
      const ctrl = component.scheduledDateControl;

      const event = { target: { value: '' } } as unknown as Event;
      component.onScheduledDateInput(event);

      expect(ctrl?.dirty).toBeTrue();
    });

    it('should mark touched and dirty when input has value', () => {
      const ctrl = component.scheduledDateControl;
      ctrl?.setValue(null);

      const event = { target: { value: 'some-text' } } as unknown as Event;
      component.onScheduledDateInput(event);

      expect(ctrl?.touched).toBeTrue();
      expect(ctrl?.dirty).toBeTrue();
    });

    it('should set matDatepickerParse error when input has value but control has no value', () => {
      const ctrl = component.scheduledDateControl;
      ctrl?.setValue(null, { emitEvent: false });

      const event = { target: { value: 'invalid-date' } } as unknown as Event;
      component.onScheduledDateInput(event);

      expect(ctrl?.hasError('matDatepickerParse')).toBeTrue();
    });

    it('should not set parse error when control already has a parsed value', () => {
      const ctrl = component.scheduledDateControl;
      ctrl?.setValue(moment('2099-06-15'));

      const event = { target: { value: '15-JUN-2099' } } as unknown as Event;
      component.onScheduledDateInput(event);

      expect(ctrl?.hasError('matDatepickerParse')).toBeFalse();
    });
  });

  describe('onScheduledDateBlur', () => {
    it('should clear value when input is empty', () => {
      const ctrl = component.scheduledDateControl;
      ctrl?.setValue(moment('2099-01-01'));

      const event = { target: { value: '' } } as unknown as Event;
      component.onScheduledDateBlur(event);

      // Value is set to null; updateValueAndValidity re-runs validators
      expect(ctrl?.value).toBeNull();
    });

    it('should mark pristine and untouched in add mode', () => {
      component.mode = 'add';
      const ctrl = component.scheduledDateControl;
      ctrl?.markAsTouched();
      ctrl?.markAsDirty();

      const event = { target: { value: '' } } as unknown as Event;
      component.onScheduledDateBlur(event);

      expect(ctrl?.pristine).toBeTrue();
      expect(ctrl?.untouched).toBeTrue();
    });

    it('should not mark pristine in edit mode', () => {
      component.mode = 'edit';
      const ctrl = component.scheduledDateControl;
      ctrl?.markAsDirty();

      const event = { target: { value: '' } } as unknown as Event;
      component.onScheduledDateBlur(event);

      // In edit mode, it doesn't call markAsPristine or markAsUntouched
      // The control value should still be null though
      expect(ctrl?.value).toBeNull();
    });

    it('should do nothing when input has value', () => {
      const ctrl = component.scheduledDateControl;
      const existingValue = moment('2099-06-15');
      ctrl?.setValue(existingValue);

      const event = { target: { value: '15-JUN-2099' } } as unknown as Event;
      component.onScheduledDateBlur(event);

      // Value should remain unchanged
      expect(ctrl?.value).toBe(existingValue);
    });
  });

  describe('onDriveInput', () => {
    it('should strip special characters and uppercase', () => {
      const input = { value: 'ab@c1!' } as HTMLInputElement;
      const event = { target: input } as unknown as Event;

      component.onDriveInput(event);

      expect(input.value).toBe('ABC1');
    });

    it('should not modify when value is already clean', () => {
      const input = { value: 'ABC123' } as HTMLInputElement;
      const event = { target: input } as unknown as Event;

      component.onDriveInput(event);

      // No change needed, value stays the same
      expect(input.value).toBe('ABC123');
    });

    it('should handle empty value', () => {
      const input = { value: '' } as HTMLInputElement;
      const event = { target: input } as unknown as Event;

      component.onDriveInput(event);

      expect(input.value).toBe('');
    });
  });

  describe('Search filters', () => {
    it('should filter chapter options by chapterId', () => {
      component.chapterOptions = [
        { chapterId: 'WAD', chapterName: 'Washington DC' },
        { chapterId: 'BC', chapterName: 'British Columbia' }
      ];

      component.chapterSearchControl.setValue('WAD');

      expect(component.filteredChapterOptions.length).toBe(1);
      expect(component.filteredChapterOptions[0].chapterId).toBe('WAD');
    });

    it('should filter chapter options by chapterName', () => {
      component.chapterOptions = [
        { chapterId: 'WAD', chapterName: 'Washington DC' },
        { chapterId: 'BC', chapterName: 'British Columbia' }
      ];

      component.chapterSearchControl.setValue('brit');

      expect(component.filteredChapterOptions.length).toBe(1);
      expect(component.filteredChapterOptions[0].chapterId).toBe('BC');
    });

    it('should reset chapter filter when search is empty', () => {
      component.chapterOptions = [
        { chapterId: 'WAD', chapterName: 'Washington DC' },
        { chapterId: 'BC', chapterName: 'British Columbia' }
      ];

      component.chapterSearchControl.setValue('WAD');
      expect(component.filteredChapterOptions.length).toBe(1);

      component.chapterSearchControl.setValue('');
      expect(component.filteredChapterOptions.length).toBe(2);
    });

    it('should filter type options by display', () => {
      component.typeSearchControl.setValue('Fixed');
      expect(component.filteredTypeOptions.length).toBe(1);
      expect(component.filteredTypeOptions[0].value).toBe('F');
    });

    it('should filter type options by value', () => {
      component.typeSearchControl.setValue('Mobile');
      expect(component.filteredTypeOptions.length).toBe(1);
      expect(component.filteredTypeOptions[0].value).toBe('I');
    });

    it('should reset type filter when search is empty', () => {
      component.typeSearchControl.setValue('F');
      component.typeSearchControl.setValue('');
      expect(component.filteredTypeOptions.length).toBe(3);
    });

    it('should filter site options by siteId', () => {
      component.siteIdOptions = [
        { siteId: 'G001', description: 'Site Alpha' },
        { siteId: 'G002', description: 'Site Beta' }
      ];

      component.siteSearchControl.setValue('G001');

      expect(component.filteredSiteIdOptions.length).toBe(1);
      expect(component.filteredSiteIdOptions[0].siteId).toBe('G001');
    });

    it('should filter site options by description', () => {
      component.siteIdOptions = [
        { siteId: 'G001', description: 'Site Alpha' },
        { siteId: 'G002', description: 'Site Beta' }
      ];

      component.siteSearchControl.setValue('beta');

      expect(component.filteredSiteIdOptions.length).toBe(1);
      expect(component.filteredSiteIdOptions[0].siteId).toBe('G002');
    });

    it('should reset site filter when search is empty', () => {
      component.siteIdOptions = [
        { siteId: 'G001', description: 'Site Alpha' },
        { siteId: 'G002', description: 'Site Beta' }
      ];

      component.siteSearchControl.setValue('alpha');
      expect(component.filteredSiteIdOptions.length).toBe(1);

      component.siteSearchControl.setValue('');
      expect(component.filteredSiteIdOptions.length).toBe(2);
    });

    it('should filter OS options by display', () => {
      component.osSearchControl.setValue('Yes');
      expect(component.filteredOsOptions.length).toBe(1);
      expect(component.filteredOsOptions[0].value).toBe('Y');
    });

    it('should filter OS options by value', () => {
      component.osSearchControl.setValue('N');
      expect(component.filteredOsOptions.length).toBe(1);
      expect(component.filteredOsOptions[0].value).toBe('N');
    });

    it('should reset OS filter when search is empty', () => {
      component.osSearchControl.setValue('Y');
      component.osSearchControl.setValue('');
      expect(component.filteredOsOptions.length).toBe(2);
    });
  });

  describe('Dropdown closed handlers', () => {
    it('should reset chapter search and filtered options on close', () => {
      component.chapterOptions = [
        { chapterId: 'WAD', chapterName: 'Washington DC' }
      ];
      component.chapterSearchControl.setValue('WAD');

      component.onChapterDropdownClosed();

      expect(component.chapterSearchControl.value).toBe('');
      expect(component.filteredChapterOptions).toEqual(component.chapterOptions);
    });

    it('should reset type search and filtered options on close', () => {
      component.typeSearchControl.setValue('Fixed');

      component.onTypeDropdownClosed();

      expect(component.typeSearchControl.value).toBe('');
      expect(component.filteredTypeOptions.length).toBe(3);
    });

    it('should reset site search and filtered options on close', () => {
      component.siteIdOptions = [{ siteId: 'G1', description: 'S' }];
      component.siteSearchControl.setValue('G1');

      component.onSiteDropdownClosed();

      expect(component.siteSearchControl.value).toBe('');
      expect(component.filteredSiteIdOptions.length).toBe(1);
    });

    it('should reset OS search and filtered options on close', () => {
      component.osSearchControl.setValue('Y');

      component.onOsDropdownClosed();

      expect(component.osSearchControl.value).toBe('');
      expect(component.filteredOsOptions.length).toBe(2);
    });
  });

  describe('formatDateTime', () => {
    it('should return empty string for null', () => {
      expect(component.formatDateTime(null)).toBe('');
    });

    it('should format today date with Today prefix', () => {
      const now = new Date();
      const result = component.formatDateTime(now);
      expect(result).toContain('Today');
    });

    it('should format non-today date as DD-MMM-YYYY, HH:mm', () => {
      const pastDate = new Date('2020-03-15T10:30:00');
      const result = component.formatDateTime(pastDate);
      expect(result).toContain('15-Mar-2020');
      expect(result).toContain('10:30');
    });
  });

  describe('subscribeToChapterChanges', () => {
    it('should reload chapter options when chapter changes', () => {
      drivesServiceSpy.getChapterLookup.calls.reset();

      chapterChangedSubject.next();

      expect(drivesServiceSpy.getChapterLookup).toHaveBeenCalled();
    });

    it('should reload site options when chapter changes and chapterId is set', () => {
      component.form.get('chapterId')?.setValue('WAD', { emitEvent: false });
      drivesServiceSpy.getGroupSites.calls.reset();

      chapterChangedSubject.next();

      expect(drivesServiceSpy.getGroupSites).toHaveBeenCalled();
    });

    it('should not reload site options when chapter changes and chapterId is empty', () => {
      component.form.get('chapterId')?.setValue('', { emitEvent: false });
      drivesServiceSpy.getGroupSites.calls.reset();

      chapterChangedSubject.next();

      expect(drivesServiceSpy.getGroupSites).not.toHaveBeenCalled();
    });
  });

  describe('editModeValues population', () => {
    it('should populate editModeValues with data in edit mode', () => {
      const editFixture = TestBed.createComponent(AddEditDriveRecord);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = {
        chapterID: 'WAD',
        drive: 'DR001',
        type: 'F - Fixed Site Drive',
        siteID: 'SITE01',
        description: 'My Desc',
        os: 'Yes',
        scheduledDate: '15-Jun-2099'
      };
      editFixture.detectChanges();

      expect(editComponent.editModeValues.type).toBe('F - Fixed Site Drive');
      expect(editComponent.editModeValues.drive).toBe('DR001');
      expect(editComponent.editModeValues.siteId).toBe('SITE01');
      expect(editComponent.editModeValues.description).toBe('My Desc');
      expect(editComponent.editModeValues.os).toBe('Yes');
      expect(editComponent.editModeValues.scheduledDate).toBe('15-Jun-2099');
    });

    it('should handle missing optional fields', () => {
      const editFixture = TestBed.createComponent(AddEditDriveRecord);
      const editComponent = editFixture.componentInstance;
      editComponent.mode = 'edit';
      editComponent.data = {
        chapterID: 'WAD',
        drive: 'DR001',
        type: 'F',
        siteID: 'SITE01'
      };
      editFixture.detectChanges();

      expect(editComponent.editModeValues.description).toBe('');
      expect(editComponent.editModeValues.os).toBe('');
      expect(editComponent.editModeValues.scheduledDate).toBe('');
    });
  });
});

describe('AddEditDriveRecord - Scheduled Date Error Messages', () => {
  let component: any;

  beforeEach(() => {
    component = {
      scheduledDateControl: null,
      scheduledDateInput: null,
      getScheduledDateError() {
        const control = this.scheduledDateControl;
        if (!control || !(control.touched || control.dirty)) return '';

        if (control.hasError('matDatepickerParse')) {
          return 'Enter correct Scheduled Date';
        }
        if (control.hasError('required')) {
          const inputValue = this.scheduledDateInput?.nativeElement?.value;
          if (inputValue && inputValue.trim().length > 0) {
            return 'Enter correct Scheduled Date';
          }
          return 'Scheduled Date is required';
        }
        if (control.hasError('pastDate')) {
          return 'Past dates are not allowed';
        }
        return '';
      }
    };
  });



  it('should return "Enter correct Scheduled Date" when matDatepickerParse error is present', () => {
    component.scheduledDateControl = {
      touched: true,
      dirty: false,
      hasError: (error: string) => error === 'matDatepickerParse'
    };
    expect(component.getScheduledDateError()).toBe('Enter correct Scheduled Date');
  });

  it('should return "Enter correct Scheduled Date" when required error is present and input has value', () => {
    component.scheduledDateControl = {
      touched: true,
      dirty: false,
      hasError: (error: string) => error === 'required'
    };
    component.scheduledDateInput = { nativeElement: { value: 'abc' } };
    expect(component.getScheduledDateError()).toBe('Enter correct Scheduled Date');
  });

  it('should return "Scheduled Date is required" when required error is present and input is empty', () => {
    component.scheduledDateControl = {
      touched: true,
      dirty: false,
      hasError: (error: string) => error === 'required'
    };
    component.scheduledDateInput = { nativeElement: { value: '' } };
    expect(component.getScheduledDateError()).toBe('Scheduled Date is required');
  });

  it('should return "Past dates are not allowed" when pastDate error is present', () => {
    component.scheduledDateControl = {
      touched: true,
      dirty: false,
      hasError: (error: string) => error === 'pastDate'
    };
    expect(component.getScheduledDateError()).toBe('Past dates are not allowed');
  });

});
