import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { AddEditGroupSites } from './add-edit-group-sites';
import { GroupSitesService } from '../services/group-sites.service';
import { GroupSitesModel, ChapterLookup } from '../models/group-sites.model';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditGroupSites', () => {
  let component: AddEditGroupSites;
  let fixture: ComponentFixture<AddEditGroupSites>;
  let mockGroupSitesService: jasmine.SpyObj<GroupSitesService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockGroupSitesData: GroupSitesModel = {
    chapterId: '001',
    groupSiteId: 'S1540',
    groupSiteInd: 'S',
    siteName: 'Test Site Name',
    osokFlag: 'Y',
    effectiveDate: moment().add(1, 'days').toDate(),
    terminationDate: null,
    lastModifiedDate: new Date('2026-12-01T00:00:00'),
    type: 'Site',
    code: 'S1540',
    name: 'Test Site Name',
    outOfState: true,
    status: 'Active'
  };

  const mockChapterLookups: ChapterLookup[] = [
    { chapterId: '001', chapterName: 'Chapter 1' },
    { chapterId: '002', chapterName: 'Chapter 2' },
    { chapterId: '003', chapterName: 'Chapter 3' }
  ];

  beforeEach(() => {

    mockGroupSitesService = jasmine.createSpyObj('GroupSitesService', [
      'getChapterIds',
      'getActiveChapterIds',
      'addGroupSite',
      'updateGroupSite'
    ]);

    mockSnackBar = createMockMatSnackBar();

    mockGroupSitesService.getChapterIds.and.returnValue(of(mockChapterLookups));
    mockGroupSitesService.getActiveChapterIds.and.returnValue(of(mockChapterLookups));



      TestBed.configureTestingModule({
      imports: [AddEditGroupSites, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        FormBuilder,
        { provide: GroupSitesService, useValue: mockGroupSitesService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    });


    


      mockGroupSitesService.getChapterIds.calls.reset();


      mockGroupSitesService.getActiveChapterIds.calls.reset();


      mockGroupSitesService.addGroupSite.calls.reset();


      mockGroupSitesService.updateGroupSite.calls.reset();


      mockSnackBar.open.calls.reset();


      mockGroupSitesService.getChapterIds.and.returnValue(of(mockChapterLookups));


      mockGroupSitesService.getActiveChapterIds.and.returnValue(of(mockChapterLookups));


    fixture = TestBed.createComponent(AddEditGroupSites);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {


    it('should load chapter IDs on init', () => {
      fixture.detectChanges();

      expect(mockGroupSitesService.getActiveChapterIds).toHaveBeenCalled();
      expect(component.chapterIdOptions).toEqual(mockChapterLookups);
    });



    it('should have type options of Group and Site', () => {
      expect(component.typeOptions).toEqual(['Group', 'Site']);
    });


    it('should initialize chapterToday to current date', () => {
      const today = moment().startOf('day');
      expect(component.chapterToday.format('YYYY-MM-DD')).toBe(today.format('YYYY-MM-DD'));
    });
  });

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });


    it('should mark required fields as invalid when empty', () => {
      component.form.markAllAsTouched();

      expect(component.form.get('chapterId')?.valid).toBeFalse();
      expect(component.form.get('type')?.valid).toBeFalse();
      expect(component.form.get('code')?.valid).toBeFalse();
      expect(component.form.get('name')?.valid).toBeFalse();
      expect(component.form.get('effectiveDate')?.valid).toBeFalse();
    });

    it('should have required validators on all required fields', () => {
      expect(component.form.get('chapterId')?.hasError('required')).toBeTrue();
      expect(component.form.get('type')?.hasError('required')).toBeTrue();
      expect(component.form.get('code')?.hasError('required')).toBeTrue();
      expect(component.form.get('name')?.hasError('required')).toBeTrue();
      expect(component.form.get('effectiveDate')?.hasError('required')).toBeTrue();
    });

    it('should not have required validator on terminationDate', () => {
      expect(component.form.get('terminationDate')?.hasError('required')).toBeFalse();
    });



    it('should map UI type "Group" to API groupSiteInd "G"', () => {
      mockGroupSitesService.addGroupSite.and.returnValue(of({ message: 'Success' }));

      component.form.patchValue({
        chapterId: '001',
        type: 'Group',
        code: 'G100',
        name: 'Test Group',
        outOfState: false,
        effectiveDate: moment().add(1, 'days')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();

      const callArgs = mockGroupSitesService.addGroupSite.calls.mostRecent().args[0];
      expect(callArgs.groupSiteInd).toBe('G');
    });

    it('should map UI type "Site" to API groupSiteInd "S"', () => {
      mockGroupSitesService.addGroupSite.and.returnValue(of({ message: 'Success' }));

      component.form.patchValue({
        chapterId: '001',
        type: 'Site',
        code: 'S100',
        name: 'Test Site',
        outOfState: false,
        effectiveDate: moment().add(1, 'day')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();

      const callArgs = mockGroupSitesService.addGroupSite.calls.mostRecent().args[0];
      expect(callArgs.groupSiteInd).toBe('S');
    });

    it('should map UI outOfState true to API osokFlag "Y"', () => {
      mockGroupSitesService.addGroupSite.and.returnValue(of({ message: 'Success' }));

      component.form.patchValue({
        chapterId: '001',
        type: 'Site',
        code: 'S100',
        name: 'Test Site',
        outOfState: true,
        effectiveDate: moment().add(1, 'day')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();

      const callArgs = mockGroupSitesService.addGroupSite.calls.mostRecent().args[0];
      expect(callArgs.osokFlag).toBe('Y');
    });

    it('should map UI outOfState false to API osokFlag "N"', () => {
      mockGroupSitesService.addGroupSite.and.returnValue(of({ message: 'Success' }));

      component.form.patchValue({
        chapterId: '001',
        type: 'Site',
        code: 'S100',
        name: 'Test Site',
        outOfState: false,
        effectiveDate: moment().add(1, 'day')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();

      const callArgs = mockGroupSitesService.addGroupSite.calls.mostRecent().args[0];
      expect(callArgs.osokFlag).toBe('N');
    });

    it('should trim whitespace from text fields before submitting', () => {
      mockGroupSitesService.addGroupSite.and.returnValue(of({ message: 'Success' }));

      component.form.patchValue({
        chapterId: '001',
        type: 'Site',
        code: ' S100 ',
        name: ' Test Site ',
        outOfState: false,
        effectiveDate: moment().add(1, 'day')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();

      const callArgs = mockGroupSitesService.addGroupSite.calls.mostRecent().args[0];
      expect(callArgs.chapterId).toBe('001');
      expect(callArgs.groupSiteId).toBe('S100');
      expect(callArgs.siteName).toBe('Test Site');
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockGroupSitesData;
      fixture.detectChanges();
    });



    it('should keep editable fields enabled in edit mode', () => {
      expect(component.form.get('type')?.enabled).toBeTrue();
      expect(component.form.get('name')?.enabled).toBeTrue();
      expect(component.form.get('outOfState')?.enabled).toBeTrue();
      // Gap 2: Effective Date is always editable in edit mode
      expect(component.form.get('effectiveDate')?.enabled).toBeTrue();
      expect(component.form.get('terminationDate')?.enabled).toBeTrue();
    });


    it('should remove validators from disabled fields in edit mode', () => {
      const chapterIdControl = component.form.get('chapterId');
      const codeControl = component.form.get('code');

      expect(chapterIdControl?.hasError('required')).toBeFalse();
      expect(codeControl?.hasError('required')).toBeFalse();
    });

    it('should map API groupSiteInd "G" to UI type "Group"', () => {
      const groupData = {
        ...mockGroupSitesData,
        groupSiteInd: 'G',
        type: 'Group'
      };
      component.data = groupData;
      component.mode = 'edit';
      component.ngOnInit();

      expect(component.form.get('type')?.value).toBe('Group');
    });

    it('should map API groupSiteInd "S" to UI type "Site"', () => {
      expect(component.form.get('type')?.value).toBe('Site');
    });

    it('should map API osokFlag "Y" to UI outOfState true', () => {
      expect(component.form.get('outOfState')?.value).toBe(true);
    });

    it('should map API osokFlag "N" to UI outOfState false', () => {
      const dataWithOsokN = {
        ...mockGroupSitesData,
        osokFlag: 'N',
        outOfState: false
      };
      component.data = dataWithOsokN;
      component.mode = 'edit';
      component.ngOnInit();

      expect(component.form.get('outOfState')?.value).toBe(false);
    });

    it('should handle dates correctly when populating form', () => {
      const effectiveDate = component.form.get('effectiveDate')?.value;
      const expectedDate = moment(mockGroupSitesData.effectiveDate).format('YYYY-MM-DD');
      expect(moment.isMoment(effectiveDate)).toBeTrue();
      expect(effectiveDate?.format('YYYY-MM-DD')).toBe(expectedDate);
    });


    describe('Edit Mode - Past Termination Date Handling', () => {
      it('should store original termination date in editModeValues', () => {
        const pastTermDate = moment().subtract(30, 'days').toDate();
        const dataWithPastTerm = {
          ...mockGroupSitesData,
          terminationDate: pastTermDate
        };

        component.mode = 'edit';
        component.data = dataWithPastTerm;
        component.ngOnInit();

        const expected = moment(pastTermDate).format('YYYY-MM-DD');
        expect(component.editModeValues.terminationDate).toBe(expected);
      });

      it('should set minTermDate to past termination date if it is before effective date', () => {
        const effectiveDate = moment('2018-12-06').toDate();
        const terminationDate = moment('2026-03-31').toDate(); // In the past now
        const dataWithPastTerm = {
          ...mockGroupSitesData,
          effectiveDate,
          terminationDate
        };

        component.mode = 'edit';
        component.data = dataWithPastTerm;
        component.ngOnInit();

        const expected = moment('2018-12-06');
        expect(component.minTermDate.format('YYYY-MM-DD')).toBe(expected.format('YYYY-MM-DD'));
      });

      it('should not have validation error on form load with past termination date', () => {
        const effectiveDate = moment('2018-12-06').toDate();
        const terminationDate = moment('2026-03-31').toDate();
        const dataWithPastTerm = {
          ...mockGroupSitesData,
          effectiveDate,
          terminationDate
        };

        component.mode = 'edit';
        component.data = dataWithPastTerm;
        fixture.detectChanges();

        // Form should be valid (pristine state)
        expect(component.form.valid).toBeTrue();

        // Termination date control should not have errors
        const termControl = component.form.get('terminationDate');
        expect(termControl?.errors).toBeNull();
      });

      it('should allow saving changes to name without touching past termination date', () => {
        mockGroupSitesService.updateGroupSite.and.returnValue(of({ message: 'Success' }));

        const effectiveDate = moment('2018-12-06').toDate();
        const terminationDate = moment('2026-03-31').toDate();
        const dataWithPastTerm = {
          ...mockGroupSitesData,
          effectiveDate,
          terminationDate,
          name: 'Original Name'
        };

        component.mode = 'edit';
        component.data = dataWithPastTerm;
        fixture.detectChanges();

        // Change only the name
        component.form.patchValue({ name: 'Updated Name' });
        component.form.markAsDirty();
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        // Form should be valid and save should work
        expect(component.isFormValid).toBeTrue();

        component.onSave();

        expect(mockGroupSitesService.updateGroupSite).toHaveBeenCalled();
        const callArgs = mockGroupSitesService.updateGroupSite.calls.mostRecent().args[0];
        expect(callArgs.siteName).toBe('Updated Name');
      });

      it('should set chapterToday for calendar display in edit mode', () => {
        component.mode = 'edit';
        component.data = mockGroupSitesData;
        fixture.detectChanges();

        expect(component.chapterToday).toBeDefined();
        expect(moment.isMoment(component.chapterToday)).toBeTrue();

        // Should be today, not the termination date
        const today = moment().startOf('day');
        expect(component.chapterToday.format('YYYY-MM-DD')).toBe(today.format('YYYY-MM-DD'));
      });
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should show chapter ID required error', () => {
      component.form.get('chapterId')?.markAsTouched();
      expect(component.getChapterIdError()).toBe('Chapter ID is required');
    });

    it('should show type required error', () => {
      component.form.get('type')?.markAsTouched();
      expect(component.getTypeError()).toBe('Type is required');
    });

    it('should show code required error', () => {
      component.form.get('code')?.markAsTouched();
      expect(component.getCodeError()).toBe('Code is required');
    });

    it('should show name required error', () => {
      component.form.get('name')?.markAsTouched();
      expect(component.getNameError()).toBe('Name is required');
    });

    it('should show effective date required error', () => {
      component.form.get('effectiveDate')?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });



  });

  describe('Mode Changes', () => {
    it('should reset form when switching from edit to add mode', () => {
      component.mode = 'edit';
      component.data = mockGroupSitesData;
      fixture.detectChanges();

      component.mode = 'add';
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: 'edit',
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.form.get('chapterId')?.value).toBeNull();
      expect(component.form.get('code')?.value).toBeNull();
      expect(component.form.get('chapterId')?.enabled).toBeTrue();
      expect(component.form.get('code')?.enabled).toBeTrue();
    });

    it('should populate form when switching from add to edit mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      component.mode = 'edit';
      component.data = mockGroupSitesData;
      component.ngOnChanges({
        mode: {
          currentValue: 'edit',
          previousValue: 'add',
          firstChange: false,
          isFirstChange: () => false
        },
        data: {
          currentValue: mockGroupSitesData,
          previousValue: null,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.form.get('chapterId')?.value).toBe('001');
      expect(component.form.get('chapterId')?.disabled).toBeTrue();
    });


    it('should re-enable and add validators when switching to add mode', () => {
      component.mode = 'edit';
      component.data = mockGroupSitesData;
      fixture.detectChanges();

      component.mode = 'add';
      component.ngOnChanges({
        mode: {
          currentValue: 'add',
          previousValue: 'edit',
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.form.get('chapterId')?.enabled).toBeTrue();
      expect(component.form.get('code')?.enabled).toBeTrue();
    });
  });


  describe('Error Handling', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });
   

    it('should handle chapter IDs loading error', (done) => {
      mockGroupSitesService.getActiveChapterIds.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      spyOn(console, 'error');

      component.ngOnInit();

      setTimeout(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error loading active chapter IDs:',
          jasmine.any(Error)
        );
        expect(component.isLoadingOptions).toBeFalse();
        done();
      }, 10);
    });
  });

  describe('Loading States', () => {

    it('should set isSaving to true while saving', () => {
      const delayedResponse = new Subject<any>();
      mockGroupSitesService.addGroupSite.and.returnValue(delayedResponse.asObservable());

      component.mode = 'add';
      component.form.patchValue({
        chapterId: '001',
        type: 'Site',
        code: 'S100',
        name: 'Test Site',
        outOfState: false,
        effectiveDate: moment().add(1, 'day')
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();

      expect(component.isSaving).toBeTrue();

      delayedResponse.next({ message: 'Success' });
      delayedResponse.complete();

      expect(component.isSaving).toBeFalse();
    });

    // Error handling is managed by authInterceptor globally — no component-level error test needed
  });

  describe('Form Control Getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return chapterId control', () => {
      expect(component.chapterIdControl).toBe(component.form.get('chapterId'));
    });

    it('should return type control', () => {
      expect(component.typeControl).toBe(component.form.get('type'));
    });

    it('should return code control', () => {
      expect(component.codeControl).toBe(component.form.get('code'));
    });

    it('should return name control', () => {
      expect(component.nameControl).toBe(component.form.get('name'));
    });


  });
  describe('Date Handling', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should handle moment dates when converting to API payload', () => {
      mockGroupSitesService.addGroupSite.and.returnValue(of({ message: 'Success' }));

      const testDate = moment().add(1, 'day');
      component.form.patchValue({
        chapterId: '001',
        type: 'Site',
        code: 'S100',
        name: 'Test Site',
        outOfState: false,
        effectiveDate: testDate,
        terminationDate: null
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();

      const callArgs = mockGroupSitesService.addGroupSite.calls.mostRecent().args[0];
      expect(callArgs.effectiveDate).toEqual(testDate.format('YYYY-MM-DD'));
    });


    it('should convert moment termination date to Date object', () => {
      mockGroupSitesService.addGroupSite.and.returnValue(of({ message: 'Success' }));

      const effectiveDate = moment().add(1, 'day');
      const testDate = moment().add(30, 'days');
      component.form.patchValue({
        chapterId: '001',
        type: 'Site',
        code: 'S100',
        name: 'Test Site',
        outOfState: false,
        effectiveDate: effectiveDate,
        terminationDate: testDate
      });
      fixture.detectChanges();
      component.form.updateValueAndValidity();

      component.onSave();

      const callArgs = mockGroupSitesService.addGroupSite.calls.mostRecent().args[0];
      expect(callArgs.terminationDate).toEqual(testDate.format('YYYY-MM-DD'));
    });
  });

  describe('Date Validation Messages', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    describe('Cross-Field Date Range Validation', () => {
      it('should show error only on effective date when effective date was changed last and is after termination date', () => {
        const terminationDate = moment().add(5, 'days');
        const effectiveDate = moment().add(10, 'days');

        // Set termination date first
        component.form.patchValue({ terminationDate });
        component.form.get('terminationDate')?.markAsTouched();
        component.form.get('terminationDate')?.markAsDirty();
        fixture.detectChanges();

        // Set effective date after termination (INVALID)
        component['lastChangedDateField'] = 'effectiveDate';
        component.form.patchValue({ effectiveDate });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        // Effective date should show error
        expect(component.getEffectiveDateError()).toBe('Effective Date must be less than or equal to Termination Date');

        // Termination date should NOT show error (even though it has matDatepickerMin error)
        expect(component.getTerminationDateError()).toBe('');

        // ErrorStateMatcher should only mark effective date as error
        expect(component.effectiveDateErrorMatcher.isErrorState(component.form.get('effectiveDate') as any, null)).toBeTrue();
        expect(component.terminationDateErrorMatcher.isErrorState(component.form.get('terminationDate') as any, null)).toBeFalse();
      });

      it('should show error only on termination date when termination date was changed last and is before effective date', () => {
        const effectiveDate = moment().add(10, 'days');
        const terminationDate = moment().add(5, 'days');

        // Set effective date first
        component.form.patchValue({ effectiveDate });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();
        fixture.detectChanges();

        // Set termination date before effective (INVALID)
        component['lastChangedDateField'] = 'terminationDate';
        component.form.patchValue({ terminationDate });
        component.form.get('terminationDate')?.markAsTouched();
        component.form.get('terminationDate')?.markAsDirty();
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        // Termination date should show error
        expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');

        // Effective date should NOT show error
        expect(component.getEffectiveDateError()).toBe('');

        // ErrorStateMatcher should only mark termination date as error
        expect(component.terminationDateErrorMatcher.isErrorState(component.form.get('terminationDate') as any, null)).toBeTrue();
        expect(component.effectiveDateErrorMatcher.isErrorState(component.form.get('effectiveDate') as any, null)).toBeFalse();
      });

      it('should move error to termination date when user changes termination date after effective date error', () => {
        const effectiveDate = moment().add(10, 'days');
        const terminationDateInvalid = moment().add(5, 'days');
        const terminationDateValid = moment().add(15, 'days');

        // Set up initial invalid state with effective date changed last
        component['lastChangedDateField'] = 'effectiveDate';
        component.form.patchValue({
          effectiveDate,
          terminationDate: terminationDateInvalid
        });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();
        component.form.get('terminationDate')?.markAsTouched();
        component.form.get('terminationDate')?.markAsDirty();
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        // Initially, error should be on effective date
        expect(component.getEffectiveDateError()).toBe('Effective Date must be less than or equal to Termination Date');
        expect(component.getTerminationDateError()).toBe('');

        // User changes termination date (still invalid)
        component['lastChangedDateField'] = 'terminationDate';
        component.form.patchValue({ terminationDate: terminationDateInvalid });
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        // Now error should move to termination date
        expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
        expect(component.getEffectiveDateError()).toBe('');
      });

      it('should clear errors when user fixes the date range by changing termination date', () => {
        const effectiveDate = moment().add(10, 'days');
        const terminationDateInvalid = moment().add(5, 'days');
        const terminationDateValid = moment().add(15, 'days');

        // Set up invalid state with all required fields populated
        component['lastChangedDateField'] = 'terminationDate';
        component.form.patchValue({
          chapterId: '001',
          type: 'Site',
          code: 'S100',
          name: 'Test Site',
          outOfState: false,
          effectiveDate,
          terminationDate: terminationDateInvalid
        });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();
        component.form.get('terminationDate')?.markAsTouched();
        component.form.get('terminationDate')?.markAsDirty();
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        expect(component.getTerminationDateError()).not.toBe('');

        // Fix by changing termination date to valid value
        component.form.patchValue({ terminationDate: terminationDateValid });
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        // Both fields should have no errors
        expect(component.getEffectiveDateError()).toBe('');
        expect(component.getTerminationDateError()).toBe('');
        expect(component.form.valid).toBeTrue();
      });

      it('should clear errors when user fixes the date range by changing effective date', () => {
        const effectiveDateInvalid = moment().add(10, 'days');
        const effectiveDateValid = moment().add(2, 'days');
        const terminationDate = moment().add(5, 'days');

        // Set up invalid state with all required fields populated
        component['lastChangedDateField'] = 'effectiveDate';
        component.form.patchValue({
          chapterId: '001',
          type: 'Site',
          code: 'S100',
          name: 'Test Site',
          outOfState: false,
          effectiveDate: effectiveDateInvalid,
          terminationDate
        });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();
        component.form.get('terminationDate')?.markAsTouched();
        component.form.get('terminationDate')?.markAsDirty();
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        expect(component.getEffectiveDateError()).not.toBe('');

        // Fix by changing effective date to valid value
        component.form.patchValue({ effectiveDate: effectiveDateValid });
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        // Both fields should have no errors
        expect(component.getEffectiveDateError()).toBe('');
        expect(component.getTerminationDateError()).toBe('');
        expect(component.form.valid).toBeTrue();
      });
    });

    describe('ErrorStateMatcher Behavior', () => {
      it('should show error state only on last changed field when dateRangeInvalid exists', () => {
        const effectiveDate = moment().add(10, 'days');
        const terminationDate = moment().add(5, 'days');

        component['lastChangedDateField'] = 'effectiveDate';
        component.form.patchValue({ effectiveDate, terminationDate });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();
        component.form.get('terminationDate')?.markAsTouched();
        component.form.get('terminationDate')?.markAsDirty();
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        const effectiveControl = component.form.get('effectiveDate');
        const terminationControl = component.form.get('terminationDate');

        expect(component.effectiveDateErrorMatcher.isErrorState(effectiveControl as any, null)).toBeTrue();
        expect(component.terminationDateErrorMatcher.isErrorState(terminationControl as any, null)).toBeFalse();
      });

      it('should show field-level errors when no cross-field error exists', () => {
        // Set effective date as required (empty = required error)
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();
        fixture.detectChanges();

        const effectiveControl = component.form.get('effectiveDate');

        expect(component.effectiveDateErrorMatcher.isErrorState(effectiveControl as any, null)).toBeTrue();
        expect(component.getEffectiveDateError()).toBe('Effective Date is required');
      });

      it('should not show error when control is not touched or dirty', () => {
        const effectiveDate = moment().add(10, 'days');
        const terminationDate = moment().add(5, 'days');

        component.form.patchValue({ effectiveDate, terminationDate });
        // Don't mark as touched or dirty
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        const effectiveControl = component.form.get('effectiveDate');
        const terminationControl = component.form.get('terminationDate');

        expect(component.effectiveDateErrorMatcher.isErrorState(effectiveControl as any, null)).toBeFalse();
        expect(component.terminationDateErrorMatcher.isErrorState(terminationControl as any, null)).toBeFalse();
      });
    });

    describe('matDatepickerMin Suppression', () => {
      it('should suppress matDatepickerMin error on termination date when effective date was last changed', () => {
        const effectiveDate = moment().add(10, 'days');
        const terminationDate = moment().add(5, 'days');

        // Effective date was changed last
        component['lastChangedDateField'] = 'effectiveDate';
        component.form.patchValue({ effectiveDate, terminationDate });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();
        component.form.get('terminationDate')?.markAsTouched();
        component.form.get('terminationDate')?.markAsDirty();
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        // Termination control should have matDatepickerMin error
        const terminationControl = component.form.get('terminationDate');
        expect(terminationControl?.hasError('matDatepickerMin')).toBeTrue();

        // But error message should be suppressed because effective date was last changed
        expect(component.getTerminationDateError()).toBe('');
      });

      it('should show matDatepickerMin error on termination date when termination date was last changed', () => {
        const effectiveDate = moment().add(10, 'days');
        const terminationDate = moment().add(5, 'days');

        // Termination date was changed last
        component['lastChangedDateField'] = 'terminationDate';
        component.form.patchValue({ effectiveDate, terminationDate });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();
        component.form.get('terminationDate')?.markAsTouched();
        component.form.get('terminationDate')?.markAsDirty();
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        // Termination control should have matDatepickerMin error
        const terminationControl = component.form.get('terminationDate');
        expect(terminationControl?.hasError('matDatepickerMin')).toBeTrue();

        // Error message should show because termination date was last changed
        expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
      });
    });

    describe('Independent Field Errors', () => {
      it('should show both field errors when they are independent (no cross-field error)', () => {
        // Clear both dates to trigger required errors
        component.form.patchValue({
          effectiveDate: null,
          terminationDate: null
        });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();
        component.form.get('terminationDate')?.markAsTouched();
        component.form.get('terminationDate')?.markAsDirty();
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        // Both should show their respective errors
        expect(component.getEffectiveDateError()).toBe('Effective Date is required');
        // Termination date is not required, so no error
        expect(component.getTerminationDateError()).toBe('');

        // ErrorStateMatcher should show errors for invalid controls
        const effectiveControl = component.form.get('effectiveDate');
        expect(component.effectiveDateErrorMatcher.isErrorState(effectiveControl as any, null)).toBeTrue();
      });

      it('should show effective date field-level error when no cross-field error exists', () => {
        // Set invalid date (matDatepickerParse error)
        component.form.get('effectiveDate')?.setErrors({ matDatepickerParse: { text: 'invalid' } });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();
        fixture.detectChanges();

        expect(component.getEffectiveDateError()).toBe('Effective date is invalid');
        expect(component.effectiveDateErrorMatcher.isErrorState(component.form.get('effectiveDate') as any, null)).toBeTrue();
      });

      it('should show termination date field-level error when no cross-field error exists', () => {
        // Set invalid date format error
        component.form.get('terminationDate')?.setErrors({ invalidDateFormat: true });
        component.form.get('terminationDate')?.markAsTouched();
        component.form.get('terminationDate')?.markAsDirty();
        fixture.detectChanges();

        expect(component.getTerminationDateError()).toBe('Termination date is invalid');
        expect(component.terminationDateErrorMatcher.isErrorState(component.form.get('terminationDate') as any, null)).toBeTrue();
      });
    });

    describe('Edge Cases', () => {
      it('should handle null lastChangedDateField when form has dateRangeInvalid error', () => {
        const effectiveDate = moment().add(10, 'days');
        const terminationDate = moment().add(5, 'days');

        // Set lastChangedDateField to null
        component['lastChangedDateField'] = null;
        component.form.patchValue({ effectiveDate, terminationDate });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();
        component.form.get('terminationDate')?.markAsTouched();
        component.form.get('terminationDate')?.markAsDirty();
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        // Neither field should show cross-field error message
        expect(component.getEffectiveDateError()).toBe('');
        expect(component.getTerminationDateError()).toBe('');

        // ErrorStateMatcher should not show errors when lastChangedDateField is null
        expect(component.effectiveDateErrorMatcher.isErrorState(component.form.get('effectiveDate') as any, null)).toBeFalse();
        expect(component.terminationDateErrorMatcher.isErrorState(component.form.get('terminationDate') as any, null)).toBeFalse();
      });

      it('should default to termination date error on form submit when lastChangedDateField is null', () => {
        const effectiveDate = moment().add(10, 'days');
        const terminationDate = moment().add(5, 'days');

        component['lastChangedDateField'] = null;
        component.form.patchValue({ effectiveDate, terminationDate });
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        // Trigger save (which calls markAllAsTouched and sets default)
        component.onSave();

        // Should set lastChangedDateField to terminationDate
        expect((component as any).lastChangedDateField).toEqual('terminationDate');
      });

      it('should handle valid date range with no errors', () => {
        const effectiveDate = moment().add(5, 'days');
        const terminationDate = moment().add(10, 'days');

        component.form.patchValue({ effectiveDate, terminationDate });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();
        component.form.get('terminationDate')?.markAsTouched();
        component.form.get('terminationDate')?.markAsDirty();
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        // No errors should be shown
        expect(component.getEffectiveDateError()).toBe('');
        expect(component.getTerminationDateError()).toBe('');

        // Form should be valid
        expect(component.form.errors?.['dateRangeInvalid']).toBeFalsy();
        expect(component.effectiveDateErrorMatcher.isErrorState(component.form.get('effectiveDate') as any, null)).toBeFalse();
        expect(component.terminationDateErrorMatcher.isErrorState(component.form.get('terminationDate') as any, null)).toBeFalse();
      });

      it('should handle equal effective and termination dates (valid)', () => {
        const sameDate = moment().add(5, 'days');

        component.form.patchValue({
          effectiveDate: sameDate.clone(),
          terminationDate: sameDate.clone()
        });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();
        component.form.get('terminationDate')?.markAsTouched();
        component.form.get('terminationDate')?.markAsDirty();
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        // No errors should be shown (same date is valid)
        expect(component.getEffectiveDateError()).toBe('');
        expect(component.getTerminationDateError()).toBe('');
        expect(component.form.errors?.['dateRangeInvalid']).toBeFalsy();
      });
    });
  });

  describe('terminationDateFilter', () => {
    describe('Add Mode', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should allow today and future dates', () => {
        const today = moment();
        const future = moment().add(5, 'days');

        expect(component.terminationDateFilter(today)).toBeTrue();
        expect(component.terminationDateFilter(future)).toBeTrue();
      });

      it('should block past dates', () => {
        const yesterday = moment().subtract(1, 'day');
        const lastWeek = moment().subtract(7, 'days');

        expect(component.terminationDateFilter(yesterday)).toBeFalse();
        expect(component.terminationDateFilter(lastWeek)).toBeFalse();
      });

    });

    describe('Edit Mode - With Past Termination Date', () => {
      beforeEach(() => {
        component.mode = 'edit';
        const pastDate = moment().subtract(30, 'days');
        component.editModeValues.terminationDate = pastDate.format('YYYY-MM-DD');
        fixture.detectChanges();
      });

      it('should allow the original past termination date', () => {
        const originalDate = moment(component.editModeValues.terminationDate);
        expect(component.terminationDateFilter(originalDate)).toBeTrue();
      });

      it('should block other past dates', () => {
        const yesterday = moment().subtract(1, 'day');
        const lastWeek = moment().subtract(7, 'days');

        // These are different from the original date (30 days ago)
        expect(component.terminationDateFilter(yesterday)).toBeFalse();
        expect(component.terminationDateFilter(lastWeek)).toBeFalse();
      });

      it('should allow today and future dates', () => {
        const today = moment();
        const tomorrow = moment().add(1, 'day');

        expect(component.terminationDateFilter(today)).toBeTrue();
        expect(component.terminationDateFilter(tomorrow)).toBeTrue();
      });
    });

    describe('Edit Mode - Without Termination Date', () => {
      beforeEach(() => {
        component.mode = 'edit';
        component.editModeValues.terminationDate = null;
        fixture.detectChanges();
      });

      it('should allow today and future dates', () => {
        const today = moment();
        const future = moment().add(10, 'days');

        expect(component.terminationDateFilter(today)).toBeTrue();
        expect(component.terminationDateFilter(future)).toBeTrue();
      });

      it('should block past dates', () => {
        const yesterday = moment().subtract(1, 'day');
        expect(component.terminationDateFilter(yesterday)).toBeFalse();
      });
    });

    describe('Cross-Field Effective Date Constraint', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should block dates before effective date in add mode', () => {
        const effectiveDate = moment().add(10, 'days');
        component.form.patchValue({ effectiveDate });
        fixture.detectChanges();

        const beforeEffective = moment().add(5, 'days');
        const afterEffective = moment().add(15, 'days');

        expect(component.terminationDateFilter(beforeEffective)).toBeFalse();
        expect(component.terminationDateFilter(afterEffective)).toBeTrue();
      });

      it('should allow effective date itself', () => {
        const effectiveDate = moment().add(10, 'days');
        component.form.patchValue({ effectiveDate });
        fixture.detectChanges();

        expect(component.terminationDateFilter(effectiveDate.clone())).toBeTrue();
      });
    });
  });

  describe('chapterToday Property', () => {
    it('should initialize with current date', () => {
      component.ngOnInit();
      const today = moment().startOf('day');
      expect(component.chapterToday.format('YYYY-MM-DD')).toBe(today.format('YYYY-MM-DD'));
    });

    it('should update when chapter changes in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const beforeChange = component.chapterToday.clone();
      component.onChapterChange('001');

      // Should still be today (unless timezone handling changes it)
      expect(component.chapterToday).toBeDefined();
      expect(moment.isMoment(component.chapterToday)).toBeTrue();
    });

    it('should be set in edit mode', () => {
      component.mode = 'edit';
      component.data = mockGroupSitesData;
      fixture.detectChanges();

      expect(component.chapterToday).toBeDefined();
      expect(moment.isMoment(component.chapterToday)).toBeTrue();
    });
  });
});
