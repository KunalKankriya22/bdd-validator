import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import moment from 'moment';

import { AddEditPhysicalFindingsTemplateComponent } from './add-edit-physical-findings-template';
import { PhysicalFindingsTemplateService } from '../services/physical-findings-template.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  PhysicalFindingsTemplateModel,
  AvailablePhysicalCode,
  PhysicalFindingRecord
} from '../models/physical-findings-template.model';

class MockTranslateLoader implements TranslateLoader {
  getTranslation() { return of({}); }
}

describe('AddEditPhysicalFindingsTemplateComponent', () => {
  let component: AddEditPhysicalFindingsTemplateComponent;
  let fixture: ComponentFixture<AddEditPhysicalFindingsTemplateComponent>;
  let templateServiceSpy: jasmine.SpyObj<PhysicalFindingsTemplateService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockAddDropdowns = {
    donationTypes: [
      { key: 'Directed', value: 'DI' },
      { key: 'Autologous', value: 'AU' }
    ]
  };

  const mockProcedureCodes = {
    data: [
      { code: 'WB', description: 'Whole Blood' },
      { code: 'PLT', description: 'Platelet' }
    ]
  };

  const mockPhysicalCodes = {
    data: [
      { physicalCode: 'ARMK', description: 'Arm check', boxNumber: 1, dataType: 'C' },
      { physicalCode: 'BPCK', description: 'Blood pressure check', boxNumber: 2, dataType: 'N' },
      { physicalCode: 'TEMP', description: 'Temperature', boxNumber: 3, dataType: 'N' }
    ]
  };

  const mockTemplateDetails = {
    data: [
      { physicalCode: 'ARMK', physicalCodeDescription: 'Arm check', sortSequence: 1, boxNumber: 1, dataType: 'C', auditKey: 101 },
      { physicalCode: 'BPCK', physicalCodeDescription: 'Blood pressure check', sortSequence: 2, boxNumber: 2, dataType: 'N', auditKey: 102 }
    ]
  };

  const mockEditData: Partial<PhysicalFindingsTemplateModel> = {
    templateId: 'TMPL001',
    donationType: 'DI',
    procedureCode: 'WB',
    effDate: '2025-01-15',
    termDate: '2025-12-31',
    status: 'ACTIVE',
    donationTypeDescription: 'Directed',
    procedureCodeDescription: 'Whole Blood'
  } as PhysicalFindingsTemplateModel;

  const mockFutureEditData: Partial<PhysicalFindingsTemplateModel> = {
    templateId: 'TMPL002',
    donationType: 'DI',
    procedureCode: 'WB',
    effDate: moment().add(3, 'months').format('YYYY-MM-DD'),
    termDate: null,
    status: 'FUTURE',
    donationTypeDescription: 'Directed',
    procedureCodeDescription: 'Whole Blood'
  } as PhysicalFindingsTemplateModel;

  let realRouter: Router;

  function createComponent(mode: 'add' | 'edit' = 'add', editData: any = null) {
    Object.defineProperty(window.history, 'state', {
      value: { mode, data: editData },
      writable: true,
      configurable: true
    });

    realRouter = TestBed.inject(Router);
    spyOn(realRouter, 'getCurrentNavigation').and.returnValue({
      extras: { state: { mode, data: editData } }
    } as any);
    routerSpy = realRouter as any;
    spyOn(realRouter, 'navigate');

    fixture = TestBed.createComponent(AddEditPhysicalFindingsTemplateComponent);
    component = fixture.componentInstance;
    (component as any).snackBar = snackBarSpy;
    (component as any).dialog = dialogSpy;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    templateServiceSpy = jasmine.createSpyObj('PhysicalFindingsTemplateService', [
      'getAddDropdowns',
      'getProcedureCodes',
      'getAvailablePhysicalCodes',
      'getTemplateDetails',
      'createTemplate',
      'updateTemplate'
    ]);
    templateServiceSpy.getAddDropdowns.and.returnValue(of(mockAddDropdowns));
    templateServiceSpy.getProcedureCodes.and.returnValue(of(mockProcedureCodes));
    templateServiceSpy.getAvailablePhysicalCodes.and.returnValue(of(mockPhysicalCodes));
    templateServiceSpy.getTemplateDetails.and.returnValue(of(mockTemplateDetails));

    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    const mockHeaderService = {
      chapterId: jasmine.createSpy().and.returnValue('CH001'),
      chapterTimeZone: jasmine.createSpy().and.returnValue('America/New_York'),
      getCurrentChapterId: jasmine.createSpy().and.returnValue('CH001')
    };

    const mockPageHeaderService = {
      pageHeaderData: signal({ title: 'Physical Findings Template', subtitle: '' })
    };

    await TestBed.configureTestingModule({
      imports: [
        AddEditPhysicalFindingsTemplateComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: MockTranslateLoader }
        })
      ],
      providers: [
        { provide: PhysicalFindingsTemplateService, useValue: templateServiceSpy },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService }
      ]
    }).compileComponents();
  });

  describe('Add Mode', () => {
    beforeEach(() => {
      createComponent('add');
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should set mode to add', () => {
      expect(component.mode).toBe('add');
    });

    it('should set header title to Add New Template', () => {
      expect(component.headerConfig.title).toBe('Add New Template');
    });

    it('should have correct breadcrumbs in add mode', () => {
      expect(component.headerConfig.breadcrumbs.length).toBe(3);
      expect(component.headerConfig.breadcrumbs[2].label).toBe('Add New Template');
    });

    it('should initialize form with required validators', () => {
      expect(component.form.get('donationType')?.hasError('required')).toBeTrue();
      expect(component.form.get('effectiveDate')?.hasError('required')).toBeTrue();
      // procedureCode is disabled initially (enabled when donationType is selected), so it doesn't validate
      component.form.get('procedureCode')?.enable();
      expect(component.form.get('procedureCode')?.hasError('required')).toBeTrue();
    });

    it('should have templateId field disabled', () => {
      expect(component.form.get('templateId')?.disabled).toBeTrue();
    });

    it('should enable donationType in add mode', () => {
      expect(component.form.get('donationType')?.enabled).toBeTrue();
    });

    it('should disable procedureCode initially (until donation type selected)', () => {
      expect(component.form.get('procedureCode')?.disabled).toBeTrue();
    });

    it('should load donation type options', () => {
      expect(templateServiceSpy.getAddDropdowns).toHaveBeenCalled();
      expect(component.donationTypeOptions.length).toBe(2);
    });

    it('should load available physical codes in add mode', () => {
      component.form.get('donationType')?.setValue('DI');
      component.form.get('procedureCode')?.setValue('WB');
      expect(templateServiceSpy.getAvailablePhysicalCodes).toHaveBeenCalled();
      expect(component.availablePhysicalCodes.length).toBe(3);
    });

    it('should set isTemplateRetrieved to true in add mode', () => {
      expect(component.isTemplateRetrieved).toBeTrue();
    });

    it('should have empty selected physical records', () => {
      expect(component.selectedPhysicalRecords.length).toBe(0);
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      createComponent('edit', mockEditData);
    });

    it('should set mode to edit', () => {
      expect(component.mode).toBe('edit');
    });

    it('should set header title to Edit Template', () => {
      expect(component.headerConfig.title).toBe('Edit Template');
    });

    it('should populate form with edit data', () => {
      const raw = component.form.getRawValue();
      expect(raw.donationType).toBe('DI');
      expect(raw.templateId).toBe('TMPL001');
    });

    it('should disable donationType in edit mode', () => {
      expect(component.form.get('donationType')?.disabled).toBeTrue();
    });

    it('should disable procedureCode in edit mode', () => {
      expect(component.form.get('procedureCode')?.disabled).toBeTrue();
    });

    it('should disable effectiveDate in edit mode for ACTIVE status', () => {
      expect(component.form.get('effectiveDate')?.disabled).toBeTrue();
    });

    it('should load procedure codes for the donation type', () => {
      expect(templateServiceSpy.getProcedureCodes).toHaveBeenCalledWith('DI');
    });

    it('should load template details', () => {
      expect(templateServiceSpy.getTemplateDetails).toHaveBeenCalledWith('TMPL001', 'DI', 'WB');
    });

    it('should populate selected physical records from template details', () => {
      expect(component.selectedPhysicalRecords.length).toBe(2);
      expect(component.selectedPhysicalRecords[0].physicalCode).toBe('ARMK');
      expect(component.selectedPhysicalRecords[1].physicalCode).toBe('BPCK');
    });

    it('should store initial physical codes for change detection', () => {
      expect(component['initialPhysicalCodes']).toBeTruthy();
      const parsed = JSON.parse(component['initialPhysicalCodes']);
      expect(parsed.length).toBe(2);
    });
  });

  describe('Edit Mode - FUTURE Status', () => {
    beforeEach(() => {
      createComponent('edit', mockFutureEditData);
    });

    it('should enable effectiveDate in edit mode for FUTURE status', () => {
      expect(component.form.get('effectiveDate')?.enabled).toBeTrue();
    });

    it('should disable donationType and procedureCode in FUTURE edit mode', () => {
      expect(component.form.get('donationType')?.disabled).toBeTrue();
      expect(component.form.get('procedureCode')?.disabled).toBeTrue();
    });

    it('should store initial effective date for change detection', () => {
      expect(component['initialEffectiveDate']).toBeTruthy();
    });

    it('should detect effective date change in FUTURE edit mode', () => {
      component.form.get('effectiveDate')?.setValue(moment().add(6, 'months'));
      expect(component['hasFormChanged']()).toBeTrue();
    });

    it('should return false for hasFormChanged when nothing changed', () => {
      expect(component['hasFormChanged']()).toBeFalse();
    });

    it('should include effectiveDate in update DTO for FUTURE template', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      templateServiceSpy.updateTemplate.and.returnValue(of({ message: 'OK' }));

      component.form.get('effectiveDate')?.setValue(moment().add(6, 'months'));
      component.onSave();

      const call = templateServiceSpy.updateTemplate.calls.mostRecent();
      expect(call.args[0].effectiveDate).toBeDefined();
    });

    it('should not include effectiveDate in update DTO for ACTIVE template', () => {
      createComponent('edit', mockEditData);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      templateServiceSpy.updateTemplate.and.returnValue(of({ message: 'OK' }));

      component.form.get('terminationDate')?.setValue(moment().add(1, 'year'));
      component.onSave();

      const call = templateServiceSpy.updateTemplate.calls.mostRecent();
      expect(call.args[0].effectiveDate).toBeUndefined();
    });
  });

  describe('Form Listeners', () => {
    beforeEach(() => {
      createComponent('add');
    });

    it('should load procedure codes when donation type changes in add mode', () => {
      templateServiceSpy.getProcedureCodes.calls.reset();
      component.form.get('donationType')?.setValue('AU');
      expect(templateServiceSpy.getProcedureCodes).toHaveBeenCalledWith('AU');
    });

    it('should enable procedure code when donation type is selected in add mode', () => {
      component.form.get('donationType')?.setValue('DI');
      expect(component.form.get('procedureCode')?.enabled).toBeTrue();
    });

    it('should disable procedure code when donation type is cleared in add mode', () => {
      component.form.get('donationType')?.setValue('DI');
      component.form.get('donationType')?.setValue('');
      expect(component.form.get('procedureCode')?.disabled).toBeTrue();
    });

    it('should reset procedure code when donation type changes', () => {
      component.form.get('donationType')?.setValue('DI');
      component.form.patchValue({ procedureCode: 'WB' });
      component.form.get('donationType')?.setValue('AU');
      expect(component.form.get('procedureCode')?.value).toBe('');
    });

    it('should track lastChangedDateField for effective date', () => {
      component.form.get('effectiveDate')?.setValue(moment());
      expect(component['lastChangedDateField']).toBe('effective');
    });

    it('should track lastChangedDateField for termination date', () => {
      component.form.get('terminationDate')?.setValue(moment());
      expect(component['lastChangedDateField']).toBe('termination');
    });
  });

  describe('Dropdown Search', () => {
    beforeEach(() => {
      createComponent('add');
    });

    it('should filter donation type options by search term', () => {
      component.donationTypeSearchControl.setValue('Dir');
      expect(component.filteredDonationTypeOptions.length).toBe(1);
      expect(component.filteredDonationTypeOptions[0].value).toBe('DI');
    });

    it('should filter procedure code options by search term', () => {
      component.form.get('donationType')?.setValue('DI');
      component.procedureCodeSearchControl.setValue('Whole');
      expect(component.filteredProcedureCodeOptions.length).toBe(1);
    });

    it('should reset donation type search on dropdown open', () => {
      component.donationTypeSearchControl.setValue('test');
      component.onDonationTypeDropdownOpened(true);
      expect(component.donationTypeSearchControl.value).toBe('');
      expect(component.filteredDonationTypeOptions.length).toBe(2);
    });

    it('should not reset on dropdown close', () => {
      component.donationTypeSearchControl.setValue('test');
      component.onDonationTypeDropdownOpened(false);
      expect(component.donationTypeSearchControl.value).toBe('test');
    });

    it('should reset procedure code search on dropdown open', () => {
      component.form.get('donationType')?.setValue('DI');
      component.procedureCodeSearchControl.setValue('test');
      component.onProcedureCodeDropdownOpened(true);
      expect(component.procedureCodeSearchControl.value).toBe('');
    });
  });

  describe('Physical Code Selection', () => {
    const mockCode: AvailablePhysicalCode = {
      physicalCode: 'ARMK',
      description: 'Arm check',
      boxNumber: 1,
      dataType: 'C'
    };

    const mockCode2: AvailablePhysicalCode = {
      physicalCode: 'BPCK',
      description: 'Blood pressure check',
      boxNumber: 2,
      dataType: 'N'
    };

    beforeEach(() => {
      createComponent('add');
    });

    it('should add a physical code to selected records', () => {
      component.onAddPhysicalCode(mockCode);
      expect(component.selectedPhysicalRecords.length).toBe(1);
      expect(component.selectedPhysicalRecords[0].physicalCode).toBe('ARMK');
      expect(component.selectedPhysicalRecords[0].sequence).toBe(1);
    });

    it('should assign correct sequence numbers', () => {
      component.onAddPhysicalCode(mockCode);
      component.onAddPhysicalCode(mockCode2);
      expect(component.selectedPhysicalRecords[0].sequence).toBe(1);
      expect(component.selectedPhysicalRecords[1].sequence).toBe(2);
    });

    it('should remove a physical code from selected records', () => {
      component.onAddPhysicalCode(mockCode);
      component.onAddPhysicalCode(mockCode2);
      component.onRemovePhysicalCode(mockCode);
      expect(component.selectedPhysicalRecords.length).toBe(1);
      expect(component.selectedPhysicalRecords[0].physicalCode).toBe('BPCK');
    });

    it('should re-sequence after removal', () => {
      component.onAddPhysicalCode(mockCode);
      component.onAddPhysicalCode(mockCode2);
      component.onRemovePhysicalCode(mockCode);
      expect(component.selectedPhysicalRecords[0].sequence).toBe(1);
    });

    it('should check if code is selected', () => {
      expect(component.isCodeSelected(mockCode)).toBeFalse();
      component.onAddPhysicalCode(mockCode);
      expect(component.isCodeSelected(mockCode)).toBeTrue();
    });

    it('should toggle - add when not selected', () => {
      component.onTogglePhysicalCode(mockCode);
      expect(component.selectedPhysicalRecords.length).toBe(1);
    });

    it('should toggle - remove when already selected', () => {
      component.onAddPhysicalCode(mockCode);
      component.onTogglePhysicalCode(mockCode);
      expect(component.selectedPhysicalRecords.length).toBe(0);
    });
  });

  describe('Physical Code Search', () => {
    beforeEach(() => {
      createComponent('add');
      // Physical codes are now loaded only when both donationType and procedureCode are set
      component.form.get('donationType')?.setValue('DI');
      component.form.get('procedureCode')?.setValue('WB');
    });

    it('should filter available codes by search text', () => {
      const event = { target: { value: 'arm' } } as any;
      component.onSearchPhysicalCodes(event);
      expect(component.filteredPhysicalCodes.length).toBe(1);
      expect(component.filteredPhysicalCodes[0].physicalCode).toBe('ARMK');
    });

    it('should show all codes when search is empty', () => {
      const event = { target: { value: '' } } as any;
      component.onSearchPhysicalCodes(event);
      expect(component.filteredPhysicalCodes.length).toBe(3);
    });

    it('should filter by physical code', () => {
      const event = { target: { value: 'BPCK' } } as any;
      component.onSearchPhysicalCodes(event);
      expect(component.filteredPhysicalCodes.length).toBe(1);
    });

    it('should be case insensitive', () => {
      const event = { target: { value: 'TEMP' } } as any;
      component.onSearchPhysicalCodes(event);
      expect(component.filteredPhysicalCodes.length).toBe(1);
    });
  });

  describe('Drag and Drop', () => {
    beforeEach(() => {
      createComponent('add');
      const codes: AvailablePhysicalCode[] = [
        { physicalCode: 'ARMK', description: 'Arm check', boxNumber: 1 },
        { physicalCode: 'BPCK', description: 'BP check', boxNumber: 2 },
        { physicalCode: 'TEMP', description: 'Temperature', boxNumber: 3 }
      ];
      codes.forEach(c => component.onAddPhysicalCode(c));
    });

    it('should reorder records on drop', () => {
      const event = {
        previousIndex: 0,
        currentIndex: 2,
        container: { data: component.selectedPhysicalRecords },
        previousContainer: { data: component.selectedPhysicalRecords },
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: new MouseEvent('drop'),
        item: {} as any
      } as any;

      component.onDropRecord(event);

      expect(component.selectedPhysicalRecords[0].physicalCode).toBe('BPCK');
      expect(component.selectedPhysicalRecords[2].physicalCode).toBe('ARMK');
    });

    it('should re-sequence after drop', () => {
      const event = {
        previousIndex: 0,
        currentIndex: 2,
        container: { data: component.selectedPhysicalRecords },
        previousContainer: { data: component.selectedPhysicalRecords },
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: new MouseEvent('drop'),
        item: {} as any
      } as any;

      component.onDropRecord(event);

      expect(component.selectedPhysicalRecords[0].sequence).toBe(1);
      expect(component.selectedPhysicalRecords[1].sequence).toBe(2);
      expect(component.selectedPhysicalRecords[2].sequence).toBe(3);
    });

    it('should not change order when dropped in same position', () => {
      const event = {
        previousIndex: 1,
        currentIndex: 1,
        container: { data: component.selectedPhysicalRecords },
        previousContainer: { data: component.selectedPhysicalRecords },
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: new MouseEvent('drop'),
        item: {} as any
      } as any;

      component.onDropRecord(event);

      expect(component.selectedPhysicalRecords[0].physicalCode).toBe('ARMK');
      expect(component.selectedPhysicalRecords[1].physicalCode).toBe('BPCK');
    });
  });

  describe('onCancel', () => {
    beforeEach(() => {
      createComponent('add');
    });

    it('should navigate to template list', () => {
      component.onCancel();
      expect(routerSpy.navigate).toHaveBeenCalledWith([
        '/donor-functions/registration/registration-administration/physical-findings-template'
      ]);
    });
  });

  describe('onClearAll', () => {
    beforeEach(() => {
      createComponent('add');
    });

    it('should clear all selected physical records', () => {
      component.onAddPhysicalCode({ physicalCode: 'ARMK', description: 'Arm', boxNumber: 1 });
      component.onClearAll();
      expect(component.selectedPhysicalRecords.length).toBe(0);
    });
  });

  describe('Save Confirmation Dialog', () => {
    beforeEach(() => {
      createComponent('add');
    });

    it('should not show dialog when form is invalid', () => {
      component.onSave();
      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(templateServiceSpy.createTemplate).not.toHaveBeenCalled();
    });

    it('should not show dialog when no physical codes selected', () => {
      component.form.patchValue({
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: moment()
      });
      component.form.get('procedureCode')?.enable();
      component.onSave();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Please add at least one Physical Code',
        'Dismiss',
        jasmine.any(Object)
      );
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should show current template confirmation for add mode with today effective date', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);

      component.form.patchValue({
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: moment()
      });
      component.form.get('procedureCode')?.enable();
      component.onAddPhysicalCode({ physicalCode: 'ARMK', description: 'Arm', boxNumber: 1, dataType: 'C' });

      component.onSave();

      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.title).toBe('Decision Message');
      expect(dialogData.message).toBe('Do you want to make this set of questions a current template?');
      expect(dialogData.confirmText).toBe('YES');
      expect(dialogData.cancelText).toBe('NO');
    });

    it('should show future template confirmation for add mode with future effective date', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);

      component.form.patchValue({
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: moment().add(3, 'months')
      });
      component.form.get('procedureCode')?.enable();
      component.onAddPhysicalCode({ physicalCode: 'ARMK', description: 'Arm', boxNumber: 1, dataType: 'C' });

      component.onSave();

      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.message).toBe('Do you want to make this set of questions a future template?');
    });

    it('should not call API when user clicks NO on confirmation', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);

      component.form.patchValue({
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: moment()
      });
      component.form.get('procedureCode')?.enable();
      component.onAddPhysicalCode({ physicalCode: 'ARMK', description: 'Arm', boxNumber: 1, dataType: 'C' });

      component.onSave();

      expect(templateServiceSpy.createTemplate).not.toHaveBeenCalled();
    });

    it('should show future template confirmation in edit mode for FUTURE status', () => {
      createComponent('edit', mockFutureEditData);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);

      component.form.get('effectiveDate')?.setValue(moment().add(4, 'months'));
      component.onSave();

      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.message).toBe('Do you want to make this set of questions a future template?');
    });

    it('should show current template confirmation in edit mode for ACTIVE status', () => {
      createComponent('edit', mockEditData);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);

      component.form.get('terminationDate')?.setValue(moment().add(1, 'year'));
      component.onSave();

      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.message).toBe('Do you want to make this set of questions a current template?');
    });
  });

  describe('onSave - Add Mode', () => {
    beforeEach(() => {
      createComponent('add');
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
    });

    it('should not save when form is invalid', () => {
      component.onSave();
      expect(templateServiceSpy.createTemplate).not.toHaveBeenCalled();
    });

    it('should not save when no physical codes selected', () => {
      component.form.patchValue({
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: moment()
      });
      component.form.get('procedureCode')?.enable();
      component.onSave();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Please add at least one Physical Code',
        'Dismiss',
        jasmine.any(Object)
      );
    });

    it('should call createTemplate on valid save after confirmation', () => {
      templateServiceSpy.createTemplate.and.returnValue(of({
        message: 'Template created successfully',
        data: [{ templateId: 'TMPL002' }]
      }));

      component.form.patchValue({
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: moment()
      });
      component.form.get('procedureCode')?.enable();
      component.onAddPhysicalCode({ physicalCode: 'ARMK', description: 'Arm', boxNumber: 1, dataType: 'C' });

      component.onSave();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(templateServiceSpy.createTemplate).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donationType: 'DI',
          procedureCode: 'WB',
          resolveOverlaps: false
        })
      );
    });

    it('should show success message and navigate after create', () => {
      templateServiceSpy.createTemplate.and.returnValue(of({
        message: 'Template created successfully',
        data: [{ templateId: 'TMPL002' }]
      }));

      component.form.patchValue({
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: moment()
      });
      component.form.get('procedureCode')?.enable();
      component.onAddPhysicalCode({ physicalCode: 'ARMK', description: 'Arm', boxNumber: 1, dataType: 'C' });

      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('TMPL002'),
        'Dismiss',
        jasmine.any(Object)
      );
      expect(routerSpy.navigate).toHaveBeenCalled();
    });

    it('should show fallback message when no templateId returned', () => {
      templateServiceSpy.createTemplate.and.returnValue(of({
        message: 'Created',
        data: undefined
      }));

      component.form.patchValue({
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: moment()
      });
      component.form.get('procedureCode')?.enable();
      component.onAddPhysicalCode({ physicalCode: 'ARMK', description: 'Arm', boxNumber: 1, dataType: 'C' });

      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith('Created', 'Dismiss', jasmine.any(Object));
    });

    it('should show default fallback message when no templateId and no response message', () => {
      templateServiceSpy.createTemplate.and.returnValue(of({
        message: '',
        data: []
      }));

      component.form.patchValue({
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: moment()
      });
      component.form.get('procedureCode')?.enable();
      component.onAddPhysicalCode({ physicalCode: 'ARMK', description: 'Arm', boxNumber: 1, dataType: 'C' });

      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith('Template created successfully', 'Dismiss', jasmine.any(Object));
    });

    it('should use default overlap message when 409 error has no message', () => {
      let firstCall = true;
      dialogSpy.open.and.callFake((_comp: any, config: any) => {
        if (firstCall) {
          firstCall = false;
          return { afterClosed: () => of(true) } as any;
        }
        return { afterClosed: () => of(false) } as any;
      });

      templateServiceSpy.createTemplate.and.returnValue(
        throwError(() => ({ status: 409, error: {} }))
      );

      component.form.patchValue({
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: moment()
      });
      component.form.get('procedureCode')?.enable();
      component.onAddPhysicalCode({ physicalCode: 'ARMK', description: 'Arm', boxNumber: 1, dataType: 'C' });

      component.onSave();

      expect(dialogSpy.open).toHaveBeenCalledTimes(2);
      const overlapDialogData = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(overlapDialogData.message).toContain('active template with the same parameters already exists');
    });

    it('should handle physical codes with null dataType and auditKey in create payload', () => {
      templateServiceSpy.createTemplate.and.returnValue(of({
        message: 'OK',
        data: [{ templateId: 'TMPL005' }]
      }));

      component.form.patchValue({
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: moment()
      });
      component.form.get('procedureCode')?.enable();
      component.onAddPhysicalCode({ physicalCode: 'ARMK', description: 'Arm', boxNumber: 1 });

      component.onSave();

      const call = templateServiceSpy.createTemplate.calls.mostRecent();
      expect(call.args[0].physicalCodes[0].dataType).toBeUndefined();
      expect(call.args[0].physicalCodes[0].auditKey).toBeUndefined();
    });

    it('should not save with null procedureCode (sends as null)', () => {
      templateServiceSpy.createTemplate.and.returnValue(of({
        message: 'OK', data: [{ templateId: 'T1' }]
      }));

      component.form.patchValue({
        donationType: 'DI',
        procedureCode: '',
        effectiveDate: moment()
      });
      component.form.get('procedureCode')?.enable();
      component.form.get('procedureCode')?.clearValidators();
      component.form.get('procedureCode')?.updateValueAndValidity();
      component.onAddPhysicalCode({ physicalCode: 'ARMK', description: 'Arm', boxNumber: 1 });

      component.onSave();

      const call = templateServiceSpy.createTemplate.calls.mostRecent();
      expect(call.args[0].procedureCode).toBeNull();
    });

    it('should show overlap confirmation on 409 error', () => {
      let firstCall = true;
      dialogSpy.open.and.callFake((_comp: any, config: any) => {
        if (firstCall) {
          firstCall = false;
          return { afterClosed: () => of(true) } as any;
        }
        return { afterClosed: () => of(false) } as any;
      });

      templateServiceSpy.createTemplate.and.returnValue(
        throwError(() => ({ status: 409, error: { message: 'Overlap detected' } }))
      );

      component.form.patchValue({
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: moment()
      });
      component.form.get('procedureCode')?.enable();
      component.onAddPhysicalCode({ physicalCode: 'ARMK', description: 'Arm', boxNumber: 1, dataType: 'C' });

      component.onSave();

      expect(dialogSpy.open).toHaveBeenCalledTimes(2);
    });

    it('should retry create with resolveOverlaps=true on confirmation', () => {
      let callCount = 0;
      templateServiceSpy.createTemplate.and.callFake((dto: any) => {
        callCount++;
        if (!dto.resolveOverlaps) {
          return throwError(() => ({ status: 409, error: { message: 'Overlap' } }));
        }
        return of({ message: 'Created with overlap resolved', data: [{ templateId: 'TMPL003' }] });
      });

      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);

      component.form.patchValue({
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: moment()
      });
      component.form.get('procedureCode')?.enable();
      component.onAddPhysicalCode({ physicalCode: 'ARMK', description: 'Arm', boxNumber: 1, dataType: 'C' });

      component.onSave();

      expect(callCount).toBe(2);
    });

    it('should set isSaving to true during save', () => {
      templateServiceSpy.createTemplate.and.returnValue(of({ message: 'OK', data: [] }));

      component.form.patchValue({
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: moment()
      });
      component.form.get('procedureCode')?.enable();
      component.onAddPhysicalCode({ physicalCode: 'ARMK', description: 'Arm', boxNumber: 1, dataType: 'C' });

      component.onSave();

      // After finalize, isSaving should be false
      expect(component.isSaving).toBeFalse();
    });
  });

  describe('onSave - Edit Mode', () => {
    beforeEach(() => {
      createComponent('edit', mockEditData);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
    });

    it('should call updateTemplate on valid save after confirmation', () => {
      templateServiceSpy.updateTemplate.and.returnValue(of({ message: 'Updated successfully' }));

      // Change termination date to trigger hasFormChanged
      component.form.get('terminationDate')?.setValue(moment().add(1, 'year'));
      component.onSave();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(templateServiceSpy.updateTemplate).toHaveBeenCalledWith(
        jasmine.objectContaining({
          templateId: 'TMPL001',
          donationType: 'DI',
          resolveOverlaps: false
        })
      );
    });

    it('should show success message after update', () => {
      templateServiceSpy.updateTemplate.and.returnValue(of({ message: 'Updated successfully' }));

      component.form.get('terminationDate')?.setValue(moment().add(1, 'year'));
      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith('Updated successfully', 'Dismiss', jasmine.any(Object));
    });

    it('should show overlap confirmation on 409 during update', () => {
      let callIndex = 0;
      dialogSpy.open.and.callFake(() => {
        callIndex++;
        if (callIndex === 1) return { afterClosed: () => of(true) } as any;
        return { afterClosed: () => of(false) } as any;
      });

      templateServiceSpy.updateTemplate.and.returnValue(
        throwError(() => ({ status: 409, error: { message: 'Overlap' } }))
      );

      component.form.get('terminationDate')?.setValue(moment().add(1, 'year'));
      component.onSave();

      expect(dialogSpy.open).toHaveBeenCalledTimes(2);
    });

    it('should retry update with resolveOverlaps=true on confirmation', () => {
      let callCount = 0;
      templateServiceSpy.updateTemplate.and.callFake((dto: any) => {
        callCount++;
        if (!dto.resolveOverlaps) {
          return throwError(() => ({ status: 409, error: { message: 'Overlap' } }));
        }
        return of({ message: 'Updated with overlap resolved' });
      });

      component.form.get('terminationDate')?.setValue(moment().add(1, 'year'));
      component.onSave();

      expect(callCount).toBe(2);
    });

    it('should use fallback message when response message is empty on update', () => {
      templateServiceSpy.updateTemplate.and.returnValue(of({ message: '' }));

      component.form.get('terminationDate')?.setValue(moment().add(1, 'year'));
      component.onSave();

      expect(snackBarSpy.open).toHaveBeenCalledWith('Template updated successfully', 'Dismiss', jasmine.any(Object));
    });

    it('should use default overlap message when 409 error has no message on update', () => {
      let callIndex = 0;
      dialogSpy.open.and.callFake(() => {
        callIndex++;
        if (callIndex === 1) return { afterClosed: () => of(true) } as any;
        return { afterClosed: () => of(false) } as any;
      });

      templateServiceSpy.updateTemplate.and.returnValue(
        throwError(() => ({ status: 409, error: {} }))
      );

      component.form.get('terminationDate')?.setValue(moment().add(1, 'year'));
      component.onSave();

      expect(dialogSpy.open).toHaveBeenCalledTimes(2);
      const overlapDialogData = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(overlapDialogData.message).toContain('active template with the same parameters already exists');
    });

    it('should handle physical codes with auditKey in update payload', () => {
      templateServiceSpy.updateTemplate.and.returnValue(of({ message: 'OK' }));

      component.form.get('terminationDate')?.setValue(moment().add(1, 'year'));
      component.onSave();

      const call = templateServiceSpy.updateTemplate.calls.mostRecent();
      expect(call.args[0].physicalCodes).toBeDefined();
    });

    it('should handle update with null procedureCode', () => {
      templateServiceSpy.updateTemplate.and.returnValue(of({ message: 'OK' }));

      component.form.get('terminationDate')?.setValue(moment().add(1, 'year'));
      component.form.patchValue({ procedureCode: '' }, { emitEvent: false });
      component.onSave();

      const call = templateServiceSpy.updateTemplate.calls.mostRecent();
      expect(call.args[0].procedureCode).toBeNull();
    });
  });

  describe('Form Validation - isFormValid', () => {
    beforeEach(() => {
      createComponent('add');
    });

    it('should return false when form is invalid', () => {
      expect(component.isFormValid).toBeFalse();
    });

    it('should return false when form is valid but no physical codes in add mode', () => {
      component.form.patchValue({
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: moment()
      });
      component.form.get('procedureCode')?.enable();
      expect(component.isFormValid).toBeFalse();
    });

    it('should return true when form is valid and has physical codes in add mode', () => {
      component.form.patchValue({
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: moment()
      });
      component.form.get('procedureCode')?.enable();
      component.onAddPhysicalCode({ physicalCode: 'ARMK', description: 'Arm', boxNumber: 1 });
      expect(component.isFormValid).toBeTrue();
    });
  });

  describe('Form Validation - isFormValid in edit mode', () => {
    beforeEach(() => {
      createComponent('edit', mockEditData);
    });

    it('should return false when no changes made', () => {
      expect(component.isFormValid).toBeFalse();
    });

    it('should return true when termination date changed', () => {
      component.form.get('terminationDate')?.setValue(moment().add(2, 'years'));
      expect(component.isFormValid).toBeTrue();
    });

    it('should return true when physical codes changed', () => {
      component.onAddPhysicalCode({ physicalCode: 'TEMP', description: 'Temperature', boxNumber: 3, dataType: 'N' });
      expect(component.isFormValid).toBeTrue();
    });
  });

  describe('Error Message Getters', () => {
    beforeEach(() => {
      createComponent('add');
    });

    it('should return empty string for untouched donation type', () => {
      expect(component.getDonationTypeError()).toBe('');
    });

    it('should return required error for touched empty donation type', () => {
      component.form.get('donationType')?.markAsTouched();
      expect(component.getDonationTypeError()).toBe('Donation Type is required');
    });

    it('should return empty string for untouched procedure code', () => {
      expect(component.getProcedureCodeError()).toBe('');
    });

    it('should return required error for touched empty procedure code', () => {
      component.form.get('procedureCode')?.enable();
      component.form.get('procedureCode')?.markAsTouched();
      expect(component.getProcedureCodeError()).toBe('Procedure Code is required');
    });
  });

  describe('Display Getters', () => {
    beforeEach(() => {
      createComponent('add');
    });

    it('should return formatted donation type display', () => {
      component.donationTypeOptions = [{ key: 'Directed', value: 'DI' }];
      component.form.patchValue({ donationType: 'DI' });
      expect(component.donationTypeDisplay).toBe('DI - Directed');
    });

    it('should return dash when no donation type', () => {
      component.donationTypeOptions = [];
      expect(component.donationTypeDisplay).toBe('-');
    });

    it('should return formatted procedure code display', () => {
      component.procedureCodeOptions = [{ key: 'Whole Blood', value: 'WB' }];
      component.form.patchValue({ procedureCode: 'WB' });
      expect(component.procedureCodeDisplay).toBe('WB - Whole Blood');
    });

    it('should return dash when no procedure code', () => {
      expect(component.procedureCodeDisplay).toBe('-');
    });

    it('should return raw value when donation type option not found', () => {
      component.donationTypeOptions = [];
      component.form.patchValue({ donationType: 'XX' });
      expect(component.donationTypeDisplay).toBe('XX');
    });

    it('should return raw value when procedure code option not found', () => {
      component.procedureCodeOptions = [];
      component.form.get('procedureCode')?.enable();
      component.form.patchValue({ procedureCode: 'XX' });
      expect(component.procedureCodeDisplay).toBe('XX');
    });

    it('should return formatted effective date display', () => {
      component.form.patchValue({ effectiveDate: moment('2025-01-15') });
      expect(component.effectiveDateDisplay).toBe('15-JAN-2025');
    });

    it('should return dash when no effective date', () => {
      expect(component.effectiveDateDisplay).toBe('-');
    });
  });

  describe('terminationMinDate', () => {
    beforeEach(() => {
      createComponent('add');
    });

    it('should return minDate when no effective date', () => {
      expect(component.terminationMinDate).toEqual(component.minDate);
    });

    it('should return effective date when it is after minDate', () => {
      const futureDate = moment().add(1, 'year');
      component.form.patchValue({ effectiveDate: futureDate });
      const result = component.terminationMinDate;
      expect(moment.isMoment(result)).toBeTrue();
    });
  });

  describe('Date Input Handlers', () => {
    beforeEach(() => {
      createComponent('add');
    });

    it('should handle effective date input', () => {
      const event = { target: { value: '15-JAN-2025' } } as any;
      expect(() => component.onEffectiveDateInput(event)).not.toThrow();
    });

    it('should handle termination date input', () => {
      const event = { target: { value: '31-DEC-2025' } } as any;
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });
  });

  describe('Form Control Getters', () => {
    beforeEach(() => {
      createComponent('add');
    });

    it('should return donationType control', () => {
      expect(component.donationTypeControl).toBeTruthy();
    });

    it('should return procedureCode control', () => {
      expect(component.procedureCodeControl).toBeTruthy();
    });

    it('should return templateId control', () => {
      expect(component.templateIdControl).toBeTruthy();
    });

    it('should return effectiveDate control', () => {
      expect(component.effectiveDateControl).toBeTruthy();
    });

    it('should return terminationDate control', () => {
      expect(component.terminationDateControl).toBeTruthy();
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      createComponent('add');
    });

    it('should complete destroy$ subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      createComponent('add');
    });

    it('should handle dropdown load error gracefully', () => {
      templateServiceSpy.getAddDropdowns.and.returnValue(throwError(() => new Error('API Error')));
      const consoleSpy = spyOn(console, 'error');
      component['loadDropdowns']();
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle procedure codes load error gracefully', () => {
      templateServiceSpy.getProcedureCodes.and.returnValue(throwError(() => new Error('API Error')));
      const consoleSpy = spyOn(console, 'error');
      component['loadProcedureCodes']('DI');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle physical codes load error gracefully', () => {
      templateServiceSpy.getAvailablePhysicalCodes.and.returnValue(throwError(() => new Error('API Error')));
      const consoleSpy = spyOn(console, 'error');
      component['loadAvailablePhysicalCodes']();
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should handle null data from getAvailablePhysicalCodes', () => {
      templateServiceSpy.getAvailablePhysicalCodes.and.returnValue(of({ data: null } as any));
      component['loadAvailablePhysicalCodes']();
      expect(component.availablePhysicalCodes).toEqual([]);
    });

    it('should handle null data from getAddDropdowns', () => {
      templateServiceSpy.getAddDropdowns.and.returnValue(of({ donationTypes: null } as any));
      component['loadDropdowns']();
      expect(component.donationTypeOptions).toEqual([]);
    });

    it('should handle null data from getProcedureCodes', () => {
      templateServiceSpy.getProcedureCodes.and.returnValue(of({ data: null } as any));
      component['loadProcedureCodes']('DI');
      expect(component.procedureCodeOptions).toEqual([]);
    });
  });

  describe('Edit Mode - populateFormForEdit with alternate field names', () => {
    it('should handle effectiveDate/terminationDate field names', () => {
      const editDataAlt = {
        templateId: 'TMPL002',
        donationType: 'AU',
        procedureCode: 'PLT',
        effectiveDate: '2025-03-01',
        terminationDate: '2025-09-30'
      } as any;

      createComponent('edit', editDataAlt);

      const raw = component.form.getRawValue();
      expect(raw.donationType).toBe('AU');
      expect(raw.templateId).toBe('TMPL002');
    });

    it('should handle edit data with no procedure code', () => {
      const editDataNoProcCode = {
        templateId: 'TMPL003',
        donationType: 'DI',
        procedureCode: '',
        effDate: '2025-01-15',
        termDate: null
      } as any;

      createComponent('edit', editDataNoProcCode);

      const raw = component.form.getRawValue();
      expect(raw.procedureCode).toBe('');
    });

    it('should handle edit data with null dates', () => {
      const editDataNoDates = {
        templateId: 'TMPL004',
        donationType: 'DI',
        procedureCode: 'WB',
        effDate: null,
        termDate: null
      } as any;

      createComponent('edit', editDataNoDates);

      const raw = component.form.getRawValue();
      expect(raw.effectiveDate).toBeNull();
      expect(raw.terminationDate).toBeNull();
    });

    it('should handle edit data without donationType for procedure codes', () => {
      const editDataNoDonType = {
        templateId: 'TMPL005',
        donationType: '',
        procedureCode: '',
        effDate: '2025-01-15',
        termDate: null
      } as any;

      createComponent('edit', editDataNoDonType);

      expect(templateServiceSpy.getProcedureCodes).not.toHaveBeenCalled();
    });
  });

  describe('hasFormChanged in add mode', () => {
    beforeEach(() => {
      createComponent('add');
    });

    it('should always return true in add mode', () => {
      expect(component['hasFormChanged']()).toBeTrue();
    });
  });

  describe('getEffectiveDateError and getTerminationDateError', () => {
    beforeEach(() => {
      createComponent('add');
    });

    it('should return effective date error when lastChangedDateField is effective', () => {
      component['lastChangedDateField'] = 'effective';
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });

    it('should return termination date error when lastChangedDateField is termination', () => {
      component['lastChangedDateField'] = 'termination';
      const result = component.getTerminationDateError();
      expect(typeof result).toBe('string');
    });

    it('should handle effectiveDate error without matching lastChangedDateField', () => {
      component['lastChangedDateField'] = 'termination';
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });

    it('should handle terminationDate error without matching lastChangedDateField', () => {
      component['lastChangedDateField'] = 'effective';
      const result = component.getTerminationDateError();
      expect(typeof result).toBe('string');
    });
  });

  describe('showCodesRequiredError', () => {
    beforeEach(() => {
      createComponent('add');
    });

    it('should initialize to false', () => {
      expect(component.showCodesRequiredError).toBeFalse();
    });

    it('should set to true when saving with no physical codes', () => {
      component.form.patchValue({
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: moment()
      });
      component.form.get('procedureCode')?.enable();
      component.onSave();
      expect(component.showCodesRequiredError).toBeTrue();
    });

    it('should reset to false when adding a physical code', () => {
      component.showCodesRequiredError = true;
      component.onAddPhysicalCode({ physicalCode: 'ARMK', description: 'Arm', boxNumber: 1 });
      expect(component.showCodesRequiredError).toBeFalse();
    });
  });

  describe('onDragHandleKeydown', () => {
    beforeEach(() => {
      createComponent('add');
      const codes: AvailablePhysicalCode[] = [
        { physicalCode: 'ARMK', description: 'Arm check', boxNumber: 1 },
        { physicalCode: 'BPCK', description: 'BP check', boxNumber: 2 },
        { physicalCode: 'TEMP', description: 'Temperature', boxNumber: 3 }
      ];
      codes.forEach(c => component.onAddPhysicalCode(c));
    });

    it('should move item up on ArrowUp', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      spyOn(event, 'preventDefault');

      component.onDragHandleKeydown(event, 1);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.selectedPhysicalRecords[0].physicalCode).toBe('BPCK');
      expect(component.selectedPhysicalRecords[1].physicalCode).toBe('ARMK');
    });

    it('should re-sequence after moving up', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      component.onDragHandleKeydown(event, 1);

      expect(component.selectedPhysicalRecords[0].sequence).toBe(1);
      expect(component.selectedPhysicalRecords[1].sequence).toBe(2);
      expect(component.selectedPhysicalRecords[2].sequence).toBe(3);
    });

    it('should not move up when at first position', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      component.onDragHandleKeydown(event, 0);
      expect(component.selectedPhysicalRecords[0].physicalCode).toBe('ARMK');
    });

    it('should move item down on ArrowDown', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      spyOn(event, 'preventDefault');

      component.onDragHandleKeydown(event, 1);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.selectedPhysicalRecords[1].physicalCode).toBe('TEMP');
      expect(component.selectedPhysicalRecords[2].physicalCode).toBe('BPCK');
    });

    it('should re-sequence after moving down', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      component.onDragHandleKeydown(event, 0);

      expect(component.selectedPhysicalRecords[0].sequence).toBe(1);
      expect(component.selectedPhysicalRecords[1].sequence).toBe(2);
      expect(component.selectedPhysicalRecords[2].sequence).toBe(3);
    });

    it('should not move down when at last position', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      component.onDragHandleKeydown(event, 2);
      expect(component.selectedPhysicalRecords[2].physicalCode).toBe('TEMP');
    });

    it('should not do anything for non-arrow keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onDragHandleKeydown(event, 1);
      expect(component.selectedPhysicalRecords[0].physicalCode).toBe('ARMK');
      expect(component.selectedPhysicalRecords[1].physicalCode).toBe('BPCK');
      expect(component.selectedPhysicalRecords[2].physicalCode).toBe('TEMP');
    });

    it('should update liveAnnouncement on ArrowUp', (done) => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      component.onDragHandleKeydown(event, 2);
      setTimeout(() => {
        expect(component.liveAnnouncement).toContain('moved to position');
        done();
      });
    });

    it('should update liveAnnouncement on ArrowDown', (done) => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      component.onDragHandleKeydown(event, 0);
      setTimeout(() => {
        expect(component.liveAnnouncement).toContain('moved to position');
        done();
      });
    });
  });

  describe('liveAnnouncement', () => {
    beforeEach(() => {
      createComponent('add');
    });

    it('should initialize to empty string', () => {
      expect(component.liveAnnouncement).toBe('');
    });
  });

  describe('onSave - dateRangeInvalid', () => {
    beforeEach(() => {
      createComponent('add');
    });

    it('should not save when dateRangeInvalid error exists', () => {
      component.form.patchValue({
        donationType: 'DI',
        procedureCode: 'WB',
        effectiveDate: moment().add(1, 'year'),
        terminationDate: moment().subtract(1, 'year')
      });
      component.form.get('procedureCode')?.enable();
      component.form.setErrors({ dateRangeInvalid: true });

      component.onSave();

      expect(templateServiceSpy.createTemplate).not.toHaveBeenCalled();
    });
  });
});
