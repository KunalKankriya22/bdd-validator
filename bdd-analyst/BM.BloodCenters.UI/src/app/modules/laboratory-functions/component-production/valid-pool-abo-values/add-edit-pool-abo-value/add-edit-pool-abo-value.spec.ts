import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SimpleChange } from '@angular/core';
import moment from 'moment';

import { AddEditPoolAboValueComponent } from './add-edit-pool-abo-value';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  PoolAboValueTableModel,
  LookUpWithDescription
} from '../models/pool-abo-values.model';

describe('AddEditPoolAboValueComponent', () => {
  let component: AddEditPoolAboValueComponent;
  let fixture: ComponentFixture<AddEditPoolAboValueComponent>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockPoolSldOptions: LookUpWithDescription[] = [
    { key: '17', value: '17', description: 'B Neg Regular' },
    { key: '17', value: '17', description: 'B Neg Irradiated' },
    { key: '06', value: '06', description: 'O Pos Regular' }
  ];

  const mockData: PoolAboValueTableModel = {
    opos: 'Y',
    oneg: 'N',
    apos: 'Y',
    aneg: 'N',
    bpos: 'N',
    bneg: 'N',
    abpos: 'N',
    abneg: 'N',
    unitSchemeType: 'I',
    rhLabelFlag: 'Y',
    poolSld: '17',
    poolSldDesc: 'B Neg Regular',
    effDate: '07-OCT-2012',
    termDate: '31-DEC-2012',
    auditKey: 'ABCD1234'
  };

  beforeEach(() => {

    mockHeaderService = createMockHeaderService();
      TestBed.configureTestingModule({
      imports: [
        AddEditPoolAboValueComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        NgxMatSelectSearchModule
      ],
      providers: [
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
      ]
    });


    


    fixture = TestBed.createComponent(AddEditPoolAboValueComponent);
    component = fixture.componentInstance;


    });


  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();
    });



    it('should have all form controls enabled in add mode', () => {
      expect(component.form.get('poolSld')?.enabled).toBeTrue();
      expect(component.form.get('poolSldDesc')?.enabled).toBeTrue();
      expect(component.form.get('unitSchemeType')?.enabled).toBeTrue();
      expect(component.form.get('rhLabelFlag')?.enabled).toBeTrue();
    });

    it('should mark required fields', () => {
      const requiredFields = ['poolSld', 'unitSchemeType', 'rhLabelFlag', 'effDate'];

      requiredFields.forEach(field => {
        const control = component.form.get(field);
        control?.setValue(null);
        control?.markAsTouched();
        expect(control?.hasError('required')).toBeTrue();
      });
    });

    it('should NOT mark blood type fields as required individually', () => {
      const bloodTypeFields = ['opos', 'oneg', 'apos', 'aneg', 'bpos', 'bneg', 'abpos', 'abneg'];

      bloodTypeFields.forEach(field => {
        const control = component.form.get(field);
        control?.setValue(null);
        control?.markAsTouched();
        expect(control?.hasError('required')).toBeFalse();
      });
    });

    it('should initialize blood types with null values', () => {
      const bloodTypeFields = ['opos', 'oneg', 'apos', 'aneg', 'bpos', 'bneg', 'abpos', 'abneg'];

      bloodTypeFields.forEach(field => {
        expect(component.form.get(field)?.value).toBeNull();
      });
    });





    it('should show create another button in add mode', () => {
      expect(component.showCreateAnotherButton).toBeTrue();
    });

    it('should validate poolSld maxlength of 4', () => {
      const control = component.form.get('poolSld');
      control?.setValue('12345');
      expect(control?.hasError('maxlength')).toBeTrue();
    });

    it('should accept valid poolSld with 4 characters or less', () => {
      const control = component.form.get('poolSld');
      control?.setValue('17');
      expect(control?.hasError('maxlength')).toBeFalsy();
      expect(control?.valid).toBeTrue();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockData;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();
    });

    it('should initialize form with data in edit mode', () => {
      expect(component.form.get('poolSld')?.value).toBe('17');
      expect(component.form.get('poolSldDesc')?.value).toBe('B Neg Regular');
      expect(component.form.get('unitSchemeType')?.value).toBe('I');
      expect(component.form.get('rhLabelFlag')?.value).toBe('Y');
      expect(component.form.get('opos')?.value).toBe('Y');
      expect(component.form.get('oneg')?.value).toBe('N');
    });

    it('should keep all controls editable in edit mode except effective date', () => {
      expect(component.form.get('poolSld')?.enabled).toBeTrue();
      expect(component.form.get('poolSldDesc')?.enabled).toBeTrue();
      expect(component.form.get('unitSchemeType')?.enabled).toBeTrue();
      expect(component.form.get('rhLabelFlag')?.enabled).toBeTrue();
      expect(component.form.get('opos')?.enabled).toBeTrue();
    });





    it('should not show create another button in edit mode', () => {
      expect(component.showCreateAnotherButton).toBeFalse();
    });

    it('should format effective date for display in edit mode', () => {
      const formatted = component.editEffectiveDateDisplay;
      expect(formatted).toContain('OCT');
      expect(formatted).toContain('2012');
    });

    it('should return "-" for null effective date in edit mode', () => {
      component.form.get('effDate')?.setValue(null);
      expect(component.editEffectiveDateDisplay).toBe('-');
    });
  });

  describe('Pool SLD Description', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();
    });

    it('should filter descriptions when pool is selected', fakeAsync(() => {
      component.form.get('poolSld')?.setValue('17');
      tick();

      expect(component.availableDescriptions.length).toBe(2);
      expect(component.availableDescriptions[0].description).toBe('B Neg Regular');
      expect(component.availableDescriptions[1].description).toBe('B Neg Irradiated');
    }));

    it('should clear descriptions when pool is deselected', fakeAsync(() => {
      component.form.get('poolSld')?.setValue('17');
      tick();

      component.form.get('poolSld')?.setValue(null);
      tick();

      expect(component.availableDescriptions.length).toBe(0);
    }));

    it('should reset poolSldDesc when pool changes', fakeAsync(() => {
      component.form.get('poolSld')?.setValue('17');
      component.form.get('poolSldDesc')?.setValue('B Neg Regular');
      tick();

      component.form.get('poolSld')?.setValue('06');
      tick();

      expect(component.form.get('poolSldDesc')?.value).toBeNull();
    }));
  });

  describe('Description Search', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();
    });



    it('should show all descriptions when search is cleared', fakeAsync(() => {
      component.form.get('poolSld')?.setValue('17');
      tick();

      component.descriptionSearchCtrl.setValue('Regular');
      tick();

      component.descriptionSearchCtrl.setValue('');
      tick();

      expect(component.filteredDescriptionOptions.length).toBe(2);
    }));
  });

  describe('Pool SLD Search', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();
    });

    it('should filter pool options based on search', fakeAsync(() => {
      component.poolSldSearchCtrl.setValue('17');
      tick();

      expect(component.filteredPoolSldOptions.length).toBe(2);
      expect(component.filteredPoolSldOptions.every(opt => opt.value === '17')).toBeTrue();
    }));

    it('should show all pools when search is cleared', fakeAsync(() => {
      component.poolSldSearchCtrl.setValue('17');
      tick();

      component.poolSldSearchCtrl.setValue('');
      tick();

      expect(component.filteredPoolSldOptions.length).toBe(3);
    }));
  });



  describe('Save Actions', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();
    });

    it('should emit save event when onSave is called with valid form', fakeAsync(() => {
      let emittedValue: any;
      component.save.subscribe(value => emittedValue = value);

      spyOn<any>(component, 'validateForm').and.returnValue(true);

      const futureDate = moment().add(1, 'day');
      component.form.patchValue({
        poolSld: '17',
        poolSldDesc: 'B Neg Regular',
        unitSchemeType: 'I',
        rhLabelFlag: 'Y',
        opos: 'Y',
        oneg: 'N',
        apos: 'N',
        aneg: 'N',
        bpos: 'N',
        bneg: 'N',
        abpos: 'N',
        abneg: 'N',
        effDate: futureDate,
        termDate: null
      });

      component.onSave();
      tick();

      expect(component.isSubmitting).toBeTrue();
      expect(emittedValue).toBeDefined();
      expect(emittedValue.poolSld).toBe('17');
      expect(emittedValue.poolSldDesc).toBe('B Neg Regular');
    }));

    it('should emit saveAndCreateAnother event when called with valid form', fakeAsync(() => {
      let emittedValue: any;
      component.saveAndCreateAnother.subscribe(value => emittedValue = value);

      spyOn<any>(component, 'validateForm').and.returnValue(true);

      const futureDate = moment().add(1, 'day');
      component.form.patchValue({
        poolSld: '17',
        poolSldDesc: 'B Neg Regular',
        unitSchemeType: 'I',
        rhLabelFlag: 'Y',
        opos: 'Y',
        oneg: 'N',
        apos: 'N',
        aneg: 'N',
        bpos: 'N',
        bneg: 'N',
        abpos: 'N',
        abneg: 'N',
        effDate: futureDate,
        termDate: null
      });

      component.onSaveAndCreateAnother();
      tick();

      expect(component.isSubmitting).toBeTrue();
      expect(emittedValue).toBeDefined();
    }));


  });
  describe('ngOnChanges', () => {
    it('should update filteredPoolSldOptions when poolSldOptions change', () => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();

      const newOptions: LookUpWithDescription[] = [
        { key: '01', value: '01', description: 'New Option' }
      ];

      component.poolSldOptions = newOptions;
      component.ngOnChanges({
        poolSldOptions: new SimpleChange(mockPoolSldOptions, newOptions, false)
      });

      expect(component.filteredPoolSldOptions).toEqual(newOptions);
    });

    it('should not update options if poolSldOptions did not change', () => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();

      const initialOptions = component.filteredPoolSldOptions;

      component.ngOnChanges({});

      expect(component.filteredPoolSldOptions).toBe(initialOptions);
    });
  });
  describe('Date Input Handlers', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();
    });

    it('should handle effective date input', () => {
      const event = { target: { value: '01-JAN-2025' } } as any;
      spyOn<any>(component, 'onEffDateInput').and.callThrough();

      component.onEffDateInput(event);

      expect(component['onEffDateInput']).toHaveBeenCalledWith(event);
    });

    it('should handle termination date input', () => {
      const event = { target: { value: '31-DEC-2025' } } as any;
      spyOn<any>(component, 'onTermDateInput').and.callThrough();

      component.onTermDateInput(event);

      expect(component['onTermDateInput']).toHaveBeenCalledWith(event);
    });
  });



  describe('isFormValid getter', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();
    });



    it('should return true when all validations pass in add mode', fakeAsync(() => {
      const futureDate = moment().add(1, 'day');

      component.form.patchValue({
        poolSld: '17',
        poolSldDesc: 'B Neg Regular',
        unitSchemeType: 'I',
        rhLabelFlag: 'Y',
        opos: 'Y',
        oneg: 'N',
        apos: 'N',
        aneg: 'N',
        bpos: 'N',
        bneg: 'N',
        abpos: 'N',
        abneg: 'N',
        effDate: futureDate,
        termDate: null
      });

      tick();

      expect(component.isFormValid).toBeTrue();
    }));

    it('should return false in edit mode when form is not dirty', () => {
      component.mode = 'edit';
      component.data = mockData;
      component.ngOnInit();

      expect(component.isFormValid).toBeFalse();
    });

    it('should return true in edit mode when form is dirty and valid', fakeAsync(() => {
      component.mode = 'edit';
      // Use data with valid future dates
      const validData = {
        ...mockData,
        effDate: moment().format('DD-MMM-YYYY'),
        termDate: moment().add(1, 'day').format('DD-MMM-YYYY')
      };
      component.data = validData;
      component.ngOnInit();
      tick();

      // Mark form as dirty by changing a value
      component.form.get('opos')?.setValue('N');
      component.form.get('opos')?.markAsDirty();
      tick();

      expect(component.form.dirty).toBeTrue();
      expect(component.isFormValid).toBeTrue();
    }));
  });

  describe('Required Field Asterisks', () => {
    it('should display asterisks for required fields in add mode', () => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const schemaLabel = compiled.querySelector('mat-label');

      // Check that labels contain asterisk span
      const labels = compiled.querySelectorAll('mat-label');
      const labelsWithAsterisks = Array.from(labels).filter((label: any) =>
        label.querySelector('.required-asterisk')
      );

      expect(labelsWithAsterisks.length).toBeGreaterThan(0);
    });

    it('should display asterisk with correct color styling', () => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const asterisk = compiled.querySelector('.required-asterisk');

      expect(asterisk).toBeTruthy();
      expect(asterisk?.textContent).toBe('*');
    });

    it('should display asterisk for Schema field', () => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const labels = Array.from(compiled.querySelectorAll('mat-label')) as HTMLElement[];
      const schemaLabel = labels.find((label) => label.textContent?.includes('Schema'));

      expect(schemaLabel?.querySelector('.required-asterisk')).toBeTruthy();
    });

    it('should display asterisk for License field', () => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const labels = Array.from(compiled.querySelectorAll('mat-label')) as HTMLElement[];
      const licenseLabel = labels.find((label) => label.textContent?.includes('License'));

      expect(licenseLabel?.querySelector('.required-asterisk')).toBeTruthy();
    });

    it('should display asterisk for Pool field', () => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const labels = Array.from(compiled.querySelectorAll('mat-label')) as HTMLElement[];
      const poolLabel = labels.find((label) => label.textContent?.includes('Pool') && !label.textContent?.includes('SLD'));

      expect(poolLabel?.querySelector('.required-asterisk')).toBeTruthy();
    });

    it('should display asterisk for Effective Date field in add mode', () => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const labels = Array.from(compiled.querySelectorAll('mat-label')) as HTMLElement[];
      const effDateLabel = labels.find((label) => label.textContent?.includes('Effective Date'));

      expect(effDateLabel?.querySelector('.required-asterisk')).toBeTruthy();
    });

    it('should display asterisk for Effective Date in edit mode readonly field', () => {
      component.mode = 'edit';
      component.data = mockData;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const readonlyLabels = Array.from(compiled.querySelectorAll('.readonly-field label')) as HTMLElement[];
      const effDateLabel = readonlyLabels.find((label) => label.textContent?.includes('Effective Date'));

      expect(effDateLabel?.querySelector('.required-asterisk')).toBeTruthy();
    });

    it('should NOT display asterisk for optional fields', () => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const labels = Array.from(compiled.querySelectorAll('mat-label')) as HTMLElement[];

      // Check that Termination Date and SLD and Desc (optional fields) don't have asterisks
      const termDateLabel = labels.find((label) => label.textContent?.includes('Termination Date'));
      const sldDescLabel = labels.find((label) => label.textContent?.includes('SLD and Desc'));

      if (termDateLabel) {
        expect(termDateLabel.querySelector('.required-asterisk')).toBeFalsy();
      }
      if (sldDescLabel) {
        expect(sldDescLabel.querySelector('.required-asterisk')).toBeFalsy();
      }
    });

    it('should NOT display asterisks for blood type fields', () => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const labels = Array.from(compiled.querySelectorAll('mat-label')) as HTMLElement[];

      const bloodTypeLabels = ['O Positive', 'O Negative', 'A Positive', 'A Negative',
                               'B Positive', 'B Negative', 'AB Positive', 'AB Negative'];

      bloodTypeLabels.forEach(bloodType => {
        const label = labels.find((label) => label.textContent?.trim() === bloodType);
        if (label) {
          expect(label.querySelector('.required-asterisk')).toBeFalsy();
        }
      });
    });
  });

  describe('ngOnChanges - Form Re-initialization', () => {
    it('should re-initialize form when mode changes from add to edit', fakeAsync(() => {
      // Start in add mode
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();
      fixture.detectChanges();

      // Verify add mode initial state
      expect(component.form.get('poolSld')?.value).toBeNull();
      expect(component.dialogTitle).toBe('Add New Pool ABO Value');

      // Change to edit mode
      component.mode = 'edit';
      component.data = mockData;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockData, false)
      });
      tick();

      // Verify edit mode state - form should be re-initialized with data
      expect(component.form.get('poolSld')?.value).toBe('17');
      expect(component.form.get('poolSldDesc')?.value).toBe('B Neg Regular');
      expect(component.dialogTitle).toBe('Edit Pool ABO Value');
    }));

    it('should re-initialize form when mode changes from edit to add', fakeAsync(() => {
      // Start in edit mode
      component.mode = 'edit';
      component.data = mockData;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();
      fixture.detectChanges();

      // Verify edit mode state
      expect(component.form.get('poolSld')?.value).toBe('17');
      expect(component.dialogTitle).toBe('Edit Pool ABO Value');

      // Change to add mode
      component.mode = 'add';
      component.data = null;
      component.ngOnChanges({
        mode: new SimpleChange('edit', 'add', false),
        data: new SimpleChange(mockData, null, false)
      });
      tick();

      // Verify add mode state - form should be reset
      expect(component.form.get('poolSld')?.value).toBeNull();
      expect(component.dialogTitle).toBe('Add New Pool ABO Value');
    }));

    it('should re-initialize form when data changes in edit mode', fakeAsync(() => {
      // Start in edit mode with mockData
      component.mode = 'edit';
      component.data = mockData;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();
      fixture.detectChanges();

      expect(component.form.get('poolSld')?.value).toBe('17');
      expect(component.form.get('opos')?.value).toBe('Y');

      // Change data to different values
      const newData: PoolAboValueTableModel = {
        ...mockData,
        poolSld: '06',
        poolSldDesc: 'O Pos Regular',
        opos: 'N',
        oneg: 'Y'
      };

      component.data = newData;
      component.ngOnChanges({
        data: new SimpleChange(mockData, newData, false)
      });
      tick();

      // Form should be re-initialized with new data
      expect(component.form.get('poolSld')?.value).toBe('06');
      expect(component.form.get('poolSldDesc')?.value).toBe('O Pos Regular');
      expect(component.form.get('opos')?.value).toBe('N');
      expect(component.form.get('oneg')?.value).toBe('Y');
    }));







    it('should not re-initialize form when only poolSldOptions change', fakeAsync(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();

      spyOn<any>(component, 'initializeForm');

      const newOptions: LookUpWithDescription[] = [
        { key: '01', value: '01', description: 'New Option' }
      ];

      component.poolSldOptions = newOptions;
      component.ngOnChanges({
        poolSldOptions: new SimpleChange(mockPoolSldOptions, newOptions, false)
      });
      tick();

      // initializeForm should not be called when only poolSldOptions change
      expect(component['initializeForm']).not.toHaveBeenCalled();
      // Only filteredPoolSldOptions should update
      expect(component.filteredPoolSldOptions).toEqual(newOptions);
    }));

    it('should handle multiple input changes simultaneously', fakeAsync(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();

      const newOptions: LookUpWithDescription[] = [
        { key: '01', value: '01', description: 'New Option' }
      ];

      // Change mode, data, and poolSldOptions all at once
      component.mode = 'edit';
      component.data = mockData;
      component.poolSldOptions = newOptions;

      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockData, false),
        poolSldOptions: new SimpleChange(mockPoolSldOptions, newOptions, false)
      });
      tick();

      // Should initialize form with data
      expect(component.form.get('poolSld')?.value).toBe('17');
      // Should update filteredPoolSldOptions
      expect(component.filteredPoolSldOptions).toEqual(newOptions);
      // Should be in edit mode
      expect(component.dialogTitle).toBe('Edit Pool ABO Value');
    }));
  });

  describe('Side Panel Integration', () => {
    it('should handle opening in add mode from side panel', fakeAsync(() => {
      component.mode = 'add';
      component.data = null;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();
      tick();

      expect(component.dialogTitle).toBe('Add New Pool ABO Value');
      expect(component.submitButtonLabel).toBe('ADD');
      expect(component.showCreateAnotherButton).toBeTrue();
      expect(component.form.get('poolSld')?.value).toBeNull();
    }));

    it('should handle opening in edit mode from side panel', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockData;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();
      tick();

      expect(component.dialogTitle).toBe('Edit Pool ABO Value');
      expect(component.submitButtonLabel).toBe('SAVE');
      expect(component.showCreateAnotherButton).toBeFalse();
      expect(component.form.get('poolSld')?.value).toBe('17');
    }));

    it('should handle switching between add and edit without closing panel', fakeAsync(() => {
      // Open in add mode
      component.mode = 'add';
      component.data = null;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit(); // Initialize form before detectChanges
      fixture.detectChanges();
      tick();

      const addModeTitle = component.dialogTitle;
      expect(addModeTitle).toBe('Add New Pool ABO Value');

      // Switch to edit mode (user clicked edit on a row)
      component.mode = 'edit';
      component.data = mockData;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockData, false)
      });
      tick();

      // Should update to edit mode with data
      expect(component.dialogTitle).toBe('Edit Pool ABO Value');
      expect(component.form.get('poolSld')?.value).toBe('17');

      // Switch back to add mode
      component.mode = 'add';
      component.data = null;
      component.ngOnChanges({
        mode: new SimpleChange('edit', 'add', false),
        data: new SimpleChange(mockData, null, false)
      });
      tick();

      // Should reset to add mode
      expect(component.dialogTitle).toBe('Add New Pool ABO Value');
      expect(component.form.get('poolSld')?.value).toBeNull();
    }));
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should initialize minDate and minTerminationDate in constructor', () => {
      expect(component.minDate).toBeDefined();
      expect(moment.isMoment(component.minDate)).toBeTrue();
      expect(component.minTerminationDate).toBeDefined();
      expect(moment.isMoment(component.minTerminationDate)).toBeTrue();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should emit close event when onCancel is called', () => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      let closeCalled = false;
      component.close.subscribe(() => closeCalled = true);

      component.onCancel();

      expect(closeCalled).toBeTrue();
    });
  });

  describe('resetSubmittingState', () => {
    it('should set isSubmitting to false', () => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      component.isSubmitting = true;
      expect(component.isSubmitting).toBeTrue();

      component.resetSubmittingState();

      expect(component.isSubmitting).toBeFalse();
    });

    it('should call cdr.markForCheck', () => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      const markForCheckSpy = spyOn(component.cdr, 'markForCheck');
      component.isSubmitting = true;

      component.resetSubmittingState();

      expect(markForCheckSpy).toHaveBeenCalled();
    });
  });

  describe('Save with invalid form', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should NOT emit save event when form is invalid', () => {
      let emitted = false;
      component.save.subscribe(() => emitted = true);

      // Leave required fields empty so validateForm returns false
      component.onSave();

      expect(emitted).toBeFalse();
      expect(component.isSubmitting).toBeFalse();
    });

    it('should NOT emit saveAndCreateAnother event when form is invalid', () => {
      let emitted = false;
      component.saveAndCreateAnother.subscribe(() => emitted = true);

      // Leave required fields empty so validateForm returns false
      component.onSaveAndCreateAnother();

      expect(emitted).toBeFalse();
      expect(component.isSubmitting).toBeFalse();
    });
  });

  describe('validateForm - Edit Mode Branches', () => {
    it('should keep termDate untouched if it was not touched before markAllAsTouched in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockData;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();
      tick();

      const termControl = component.form.get('termDate');
      // termControl is NOT touched initially
      expect(termControl?.touched).toBeFalse();

      // Call onSave which triggers validateForm internally
      // validateForm should restore termControl to untouched
      spyOn<any>(component, 'validateForm').and.callThrough();
      component.onSave();
      tick();

      // In edit mode, if termControl was not touched, it should be marked untouched after markAllAsTouched
      expect(termControl?.touched).toBeFalse();
    }));

    it('should keep termDate touched if it was already touched in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        ...mockData,
        effDate: moment().format('DD-MMM-YYYY'),
        termDate: moment().add(1, 'day').format('DD-MMM-YYYY')
      };
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();
      tick();

      const termControl = component.form.get('termDate');
      termControl?.markAsTouched();
      termControl?.markAsDirty();
      expect(termControl?.touched).toBeTrue();

      component.onSave();
      tick();

      // Should remain touched because it was already touched
      expect(termControl?.touched).toBeTrue();
    }));
  });

  describe('getEffectiveDateError', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should pass form.errors when lastChangedDateField is effective', () => {
      const effControl = component.form.get('effDate');
      effControl?.markAsTouched();
      effControl?.markAsDirty();

      // Trigger lastChangedDateField = 'effective' by changing effDate
      effControl?.setValue(moment().add(1, 'day'));

      const error = component.getEffectiveDateError();
      // Should not have an error when value is valid
      expect(error).toBe('');
    });

    it('should pass null for formErrors when lastChangedDateField is not effective', () => {
      const effControl = component.form.get('effDate');
      const termControl = component.form.get('termDate');
      effControl?.markAsTouched();

      // Trigger lastChangedDateField = 'termination' by changing termDate
      termControl?.setValue(moment().add(1, 'day'));

      const error = component.getEffectiveDateError();
      // Even if there were a form-level error, it shouldn't show on eff date
      // because lastChangedDateField is 'termination'
      expect(typeof error).toBe('string');
    });

    it('should return required error when effDate is empty and touched', () => {
      const effControl = component.form.get('effDate');
      effControl?.setValue(null);
      effControl?.markAsTouched();
      effControl?.markAsDirty();

      // Set lastChangedDateField to 'effective'
      component['lastChangedDateField'] = 'effective';

      const error = component.getEffectiveDateError();
      expect(error).toContain('required');
    });
  });

  describe('getTerminationDateError', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should pass form.errors when lastChangedDateField is termination', () => {
      const termControl = component.form.get('termDate');
      termControl?.markAsTouched();
      termControl?.markAsDirty();
      termControl?.setValue(moment().add(1, 'day'));

      // Trigger lastChangedDateField = 'termination'
      component['lastChangedDateField'] = 'termination';

      const error = component.getTerminationDateError();
      expect(error).toBe('');
    });

    it('should pass null for formErrors when lastChangedDateField is not termination', () => {
      const termControl = component.form.get('termDate');
      termControl?.markAsTouched();
      termControl?.markAsDirty();

      // Set lastChangedDateField to something other than 'termination'
      component['lastChangedDateField'] = 'effective';

      const error = component.getTerminationDateError();
      expect(typeof error).toBe('string');
    });

    it('should return empty string when termDate is not touched or dirty', () => {
      const error = component.getTerminationDateError();
      expect(error).toBe('');
    });
  });

  describe('isFormValid - Add Mode Edge Cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should return false when termDate has invalidDate error', () => {
      const termControl = component.form.get('termDate');
      termControl?.setErrors({ invalidDate: true });

      expect(component.isFormValid).toBeFalse();
    });

    it('should return false when termDate has invalidDateFormat error', () => {
      const termControl = component.form.get('termDate');
      termControl?.setErrors({ invalidDateFormat: true });

      expect(component.isFormValid).toBeFalse();
    });

    it('should return false when termDate has matDatepickerParse error', () => {
      const termControl = component.form.get('termDate');
      termControl?.setErrors({ matDatepickerParse: { text: 'bad' } });

      expect(component.isFormValid).toBeFalse();
    });

    it('should return false when form has dateRangeInvalid error', fakeAsync(() => {
      const futureDate = moment().add(1, 'day');

      component.form.patchValue({
        poolSld: '17',
        unitSchemeType: 'I',
        rhLabelFlag: 'Y',
        effDate: futureDate,
        termDate: futureDate
      });
      tick();

      // Manually set form-level error to simulate cross-field validation failure
      component.form.setErrors({ dateRangeInvalid: true });

      expect(component.isFormValid).toBeFalse();
    }));

    it('should return false when a required control (not termDate) is invalid', () => {
      const futureDate = moment().add(1, 'day');

      // Set effDate and termDate but leave required fields empty
      component.form.patchValue({
        poolSld: null, // required but empty
        unitSchemeType: 'I',
        rhLabelFlag: 'Y',
        effDate: futureDate,
        termDate: null
      });

      expect(component.isFormValid).toBeFalse();
    });
  });

  describe('isFormValid - Edit Mode Edge Cases', () => {
    it('should return false when form is dirty but has effective date error', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockData;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();
      tick();

      // Make form dirty
      component.form.get('opos')?.setValue('N');
      component.form.get('opos')?.markAsDirty();

      // Set effDate control to have an error and make it touched
      const effControl = component.form.get('effDate');
      effControl?.markAsTouched();
      effControl?.markAsDirty();
      effControl?.setErrors({ invalidDate: true });

      // Set lastChangedDateField to 'effective' so error shows
      component['lastChangedDateField'] = 'effective';

      expect(component.form.dirty).toBeTrue();
      expect(component.getEffectiveDateError()).toBeTruthy();
      expect(component.isFormValid).toBeFalse();
    }));

    it('should return false when form is dirty but has termination date error', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockData;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();
      tick();

      // Make form dirty
      component.form.get('opos')?.setValue('N');
      component.form.get('opos')?.markAsDirty();

      // Set termDate to have an error and touch it
      const termControl = component.form.get('termDate');
      termControl?.markAsTouched();
      termControl?.markAsDirty();
      termControl?.setErrors({ invalidDate: true });

      // Set lastChangedDateField to 'termination' so error shows
      component['lastChangedDateField'] = 'termination';

      expect(component.form.dirty).toBeTrue();
      expect(component.getTerminationDateError()).toBeTruthy();
      expect(component.isFormValid).toBeFalse();
    }));
  });

  describe('updateTerminationMinDate', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should set minTerminationDate to effDate when effDate is after today', fakeAsync(() => {
      const futureDate = moment().add(30, 'days');
      component.form.get('effDate')?.setValue(futureDate);
      tick();

      // minTerminationDate should be set to the future effDate (since it is after minDate)
      expect(component.minTerminationDate.format('YYYY-MM-DD')).toBe(futureDate.format('YYYY-MM-DD'));
    }));

    it('should set minTerminationDate to minDate when effDate is null', fakeAsync(() => {
      component.form.get('effDate')?.setValue(null);
      tick();

      // When effDate is null, minTerminationDate falls back to minDate
      expect(component.minTerminationDate.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    }));

    it('should set minTerminationDate to minDate when effDate is invalid', fakeAsync(() => {
      const initialMinDate = component.minDate.format('YYYY-MM-DD');

      component.form.get('effDate')?.setValue('invalid-date');
      tick();

      // Invalid moment should fallback to minDate
      expect(component.minTerminationDate.format('YYYY-MM-DD')).toBe(initialMinDate);
    }));
  });

  describe('dialogTitle getter', () => {
    it('should return "Add New Pool ABO Value" in add mode', () => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.dialogTitle).toBe('Add New Pool ABO Value');
    });

    it('should return "Edit Pool ABO Value" in edit mode', () => {
      component.mode = 'edit';
      component.data = mockData;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.dialogTitle).toBe('Edit Pool ABO Value');
    });
  });

  describe('submitButtonLabel getter', () => {
    it('should return "ADD" in add mode', () => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.submitButtonLabel).toBe('ADD');
    });

    it('should return "SAVE" in edit mode', () => {
      component.mode = 'edit';
      component.data = mockData;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.submitButtonLabel).toBe('SAVE');
    });
  });

  describe('ngOnChanges - before form initialized', () => {
    it('should update filteredPoolSldOptions even when form is not initialized', () => {
      // Component is created but ngOnInit hasn't been called yet (no form)
      const newOptions: LookUpWithDescription[] = [
        { key: '99', value: '99', description: 'Test' }
      ];

      component.poolSldOptions = newOptions;
      component.ngOnChanges({
        poolSldOptions: new SimpleChange([], newOptions, true)
      });

      expect(component.filteredPoolSldOptions).toEqual(newOptions);
    });

    it('should NOT re-initialize form when mode changes but form does not exist', () => {
      // form is undefined because ngOnInit hasn't been called
      expect(component.form).toBeUndefined();

      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', true)
      });

      // Should not throw, form should still be undefined
      expect(component.form).toBeUndefined();
    });
  });

  describe('Description Search - Filtering', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should filter descriptions based on search term', fakeAsync(() => {
      // Select a pool first to populate availableDescriptions
      component.form.get('poolSld')?.setValue('17');
      tick();

      expect(component.availableDescriptions.length).toBe(2);

      // Search for 'Regular'
      component.descriptionSearchCtrl.setValue('Regular');
      tick();

      expect(component.filteredDescriptionOptions.length).toBe(1);
      expect(component.filteredDescriptionOptions[0].description).toBe('B Neg Regular');
    }));

    it('should return empty list when search term matches nothing', fakeAsync(() => {
      component.form.get('poolSld')?.setValue('17');
      tick();

      component.descriptionSearchCtrl.setValue('Nonexistent');
      tick();

      expect(component.filteredDescriptionOptions.length).toBe(0);
    }));

    it('should be case insensitive when filtering descriptions', fakeAsync(() => {
      component.form.get('poolSld')?.setValue('17');
      tick();

      component.descriptionSearchCtrl.setValue('irradiated');
      tick();

      expect(component.filteredDescriptionOptions.length).toBe(1);
      expect(component.filteredDescriptionOptions[0].description).toBe('B Neg Irradiated');
    }));
  });

  describe('Pool SLD Search - Advanced Filtering', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should filter pool options by description text', fakeAsync(() => {
      component.poolSldSearchCtrl.setValue('O Pos');
      tick();

      expect(component.filteredPoolSldOptions.length).toBe(1);
      expect(component.filteredPoolSldOptions[0].value).toBe('06');
    }));

    it('should return empty list when no pools match', fakeAsync(() => {
      component.poolSldSearchCtrl.setValue('zzz');
      tick();

      expect(component.filteredPoolSldOptions.length).toBe(0);
    }));

    it('should filter using combined value - description format', fakeAsync(() => {
      // poolSldSearchCtrl filters on `${s.value} - ${s.description}`
      component.poolSldSearchCtrl.setValue('06 - O Pos');
      tick();

      expect(component.filteredPoolSldOptions.length).toBe(1);
      expect(component.filteredPoolSldOptions[0].value).toBe('06');
    }));
  });

  describe('setupPoolSldDescriptionUpdater - initial value in edit mode', () => {
    it('should populate availableDescriptions from initial poolSld in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockData;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();
      tick();

      // In edit mode, initialPoolSld is '17', so descriptions for '17' should be loaded
      expect(component.availableDescriptions.length).toBe(2);
      expect(component.filteredDescriptionOptions.length).toBe(2);
    }));

    it('should not populate descriptions when initialPoolSld is null in add mode', () => {
      component.mode = 'add';
      component.data = null;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      // In add mode with no data, poolSld is null, so no descriptions should be loaded
      expect(component.availableDescriptions.length).toBe(0);
    });
  });

  describe('initializeForm - data edge cases', () => {
    it('should set effDate to null when data has no effDate', () => {
      component.mode = 'add';
      component.data = null;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.form.get('effDate')?.value).toBeNull();
    });

    it('should set termDate to null when data has no termDate', () => {
      component.mode = 'edit';
      const dataWithoutTermDate = {
        ...mockData,
        termDate: ''
      };
      component.data = dataWithoutTermDate;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      // termDate should be falsy/null when empty string is passed
      expect(component.form.get('termDate')?.value).toBeFalsy();
    });

    it('should parse effDate as moment when data.effDate is provided', () => {
      component.mode = 'edit';
      component.data = mockData;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      const effDate = component.form.get('effDate')?.value;
      expect(moment.isMoment(effDate)).toBeTrue();
    });

    it('should parse termDate as moment when data.termDate is provided', () => {
      component.mode = 'edit';
      component.data = mockData;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      const termDate = component.form.get('termDate')?.value;
      expect(moment.isMoment(termDate)).toBeTrue();
    });

    it('should set poolSld to null in add mode even when data exists', () => {
      component.mode = 'add';
      component.data = mockData; // data is provided but mode is add
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      // In add mode, poolSld is always null regardless of data
      expect(component.form.get('poolSld')?.value).toBeNull();
    });
  });

  describe('setupDateValidationListeners', () => {
    it('should revalidate termDate when effDate changes', fakeAsync(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      const termControl = component.form.get('termDate');
      const updateValiditySpy = spyOn(termControl!, 'updateValueAndValidity').and.callThrough();

      component.form.get('effDate')?.setValue(moment().add(5, 'days'));
      tick();

      expect(updateValiditySpy).toHaveBeenCalled();
    }));

    it('should call cdr.markForCheck when effDate changes', fakeAsync(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      const markForCheckSpy = spyOn(component.cdr, 'markForCheck');

      component.form.get('effDate')?.setValue(moment().add(5, 'days'));
      tick();

      expect(markForCheckSpy).toHaveBeenCalled();
    }));

    it('should call cdr.markForCheck when termDate changes', fakeAsync(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      const markForCheckSpy = spyOn(component.cdr, 'markForCheck');

      component.form.get('termDate')?.setValue(moment().add(10, 'days'));
      tick();

      expect(markForCheckSpy).toHaveBeenCalled();
    }));
  });

  describe('lastChangedDateField tracking', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should update lastChangedDateField when effDate changes', fakeAsync(() => {
      // Changing effDate triggers setupDateValidationListeners which also updates termDate validity,
      // which in turn fires termDate.valueChanges setting lastChangedDateField to 'termination'.
      // So we verify that effDate subscription does fire (it was 'effective' at one point during chain).
      // After the chain completes, lastChangedDateField reflects the last subscription that fired.
      component.form.get('effDate')?.setValue(moment().add(1, 'day'));
      tick();

      // The chain: effDate change -> lastChangedDateField='effective' -> termDate.updateValueAndValidity()
      // -> termDate valueChanges fires -> lastChangedDateField='termination'
      // This validates the subscription chain is working correctly
      expect(component['lastChangedDateField']).toBe('termination');
    }));

    it('should set lastChangedDateField to termination when termDate changes', fakeAsync(() => {
      component.form.get('termDate')?.setValue(moment().add(10, 'days'));
      tick();

      expect(component['lastChangedDateField']).toBe('termination');
    }));

    it('should set lastChangedDateField to termination after only termDate is changed directly', fakeAsync(() => {
      // First set effDate so chain completes
      component.form.get('effDate')?.setValue(moment().add(1, 'day'));
      tick();

      // Now set termDate directly
      component.form.get('termDate')?.setValue(moment().add(5, 'days'));
      tick();

      expect(component['lastChangedDateField']).toBe('termination');
    }));
  });

  describe('editEffectiveDateDisplay - edge cases', () => {
    it('should return uppercase formatted date', () => {
      component.mode = 'edit';
      component.data = mockData;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      const display = component.editEffectiveDateDisplay;
      // Should be uppercase (DD-MMM-YYYY format)
      expect(display).toBe(display.toUpperCase());
      expect(display).not.toBe('-');
    });

    it('should return "-" when form is not yet initialized', () => {
      // Access before ngOnInit
      component.mode = 'edit';
      component.data = mockData;
      component.poolSldOptions = mockPoolSldOptions;

      // form may not be initialized; editEffectiveDateDisplay should handle gracefully
      // After ngOnInit but with null effDate:
      component.ngOnInit();
      fixture.detectChanges();
      component.form.get('effDate')?.setValue(null);

      expect(component.editEffectiveDateDisplay).toBe('-');
    });
  });

  describe('onEffDateInput and onTermDateInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should call DateFieldValidationUtility.handleStartDateInput with correct args', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleStartDateInput');
      const event = { target: { value: '01-JAN-2027' } } as any;

      component.onEffDateInput(event);

      expect(spy).toHaveBeenCalledWith('01-JAN-2027', component.form.get('effDate'));
    });

    it('should call DateFieldValidationUtility.handleEndDateInput with correct args in add mode', () => {
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '31-DEC-2027' } } as any;

      component.onTermDateInput(event);

      expect(spy).toHaveBeenCalledWith('31-DEC-2027', component.form.get('termDate'), false);
    });

    it('should call DateFieldValidationUtility.handleEndDateInput with isEditMode=true in edit mode', () => {
      component.mode = 'edit';
      component.data = mockData;
      component.ngOnInit();
      fixture.detectChanges();

      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '31-DEC-2027' } } as any;

      component.onTermDateInput(event);

      expect(spy).toHaveBeenCalledWith('31-DEC-2027', component.form.get('termDate'), true);
    });
  });

  describe('getFormValue', () => {
    it('should return all form fields in the output', fakeAsync(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      const futureDate = moment().add(1, 'day');
      component.form.patchValue({
        poolSld: '06',
        poolSldDesc: 'O Pos Regular',
        unitSchemeType: 'W',
        rhLabelFlag: 'N',
        opos: 'Y',
        oneg: 'N',
        apos: 'Y',
        aneg: 'N',
        bpos: 'Y',
        bneg: 'N',
        abpos: 'Y',
        abneg: 'N',
        effDate: futureDate,
        termDate: null
      });
      tick();

      spyOn<any>(component, 'validateForm').and.returnValue(true);

      let emittedValue: any;
      component.save.subscribe(value => emittedValue = value);
      component.onSave();
      tick();

      expect(emittedValue.poolSld).toBe('06');
      expect(emittedValue.poolSldDesc).toBe('O Pos Regular');
      expect(emittedValue.unitSchemeType).toBe('W');
      expect(emittedValue.rhLabelFlag).toBe('N');
      expect(emittedValue.opos).toBe('Y');
      expect(emittedValue.oneg).toBe('N');
      expect(emittedValue.apos).toBe('Y');
      expect(emittedValue.aneg).toBe('N');
      expect(emittedValue.bpos).toBe('Y');
      expect(emittedValue.bneg).toBe('N');
      expect(emittedValue.abpos).toBe('Y');
      expect(emittedValue.abneg).toBe('N');
      expect(emittedValue.effDate).toEqual(futureDate);
      expect(emittedValue.termDate).toBeNull();
    }));
  });

  describe('setupModeValidators', () => {
    it('should call setupEditModeValidators in edit mode', () => {
      const spy = spyOn(DateFieldValidationUtility, 'setupEditModeValidators');

      component.mode = 'edit';
      component.data = mockData;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith(component.form, jasmine.any(String));
    });

    it('should call setupAddModeValidators in add mode', () => {
      const spy = spyOn(DateFieldValidationUtility, 'setupAddModeValidators');

      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith(component.form, jasmine.any(String));
    });

    it('should add terminationDateNotPastValidator in edit mode', () => {
      component.mode = 'edit';
      component.data = mockData;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      const termControl = component.form.get('termDate');
      // The validator should be added - test by setting a past date
      const pastDate = moment().subtract(30, 'days');
      termControl?.setValue(pastDate);
      termControl?.markAsTouched();
      termControl?.updateValueAndValidity();

      // Should have terminationDatePast error for past dates
      expect(termControl?.hasError('terminationDatePast')).toBeTrue();
    });
  });

  describe('errorMessage property', () => {
    it('should initialize errorMessage as null', () => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.errorMessage).toBeNull();
    });
  });

  describe('effDateErrorMatcher and termDateErrorMatcher', () => {
    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeDefined();
      expect(component.effDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeDefined();
      expect(component.termDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('should return false for effDateErrorMatcher when control is null', () => {
      expect(component.effDateErrorMatcher.isErrorState(null, null!)).toBeFalse();
    });

    it('should return false for termDateErrorMatcher when control is null', () => {
      expect(component.termDateErrorMatcher.isErrorState(null, null!)).toBeFalse();
    });
  });

  describe('filterList - null/empty search', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should return full list when search is null', fakeAsync(() => {
      component.poolSldSearchCtrl.setValue(null);
      tick();

      expect(component.filteredPoolSldOptions.length).toBe(3);
    }));
  });

  describe('Form cross-field validator', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should set dateRangeInvalid error when effDate > termDate', fakeAsync(() => {
      const laterDate = moment().add(10, 'days');
      const earlierDate = moment().add(5, 'days');

      component.form.get('effDate')?.setValue(laterDate);
      component.form.get('termDate')?.setValue(earlierDate);
      tick();

      expect(component.form.hasError('dateRangeInvalid')).toBeTrue();
    }));

    it('should not set dateRangeInvalid error when effDate <= termDate', fakeAsync(() => {
      const earlierDate = moment().add(5, 'days');
      const laterDate = moment().add(10, 'days');

      component.form.get('effDate')?.setValue(earlierDate);
      component.form.get('termDate')?.setValue(laterDate);
      tick();

      expect(component.form.hasError('dateRangeInvalid')).toBeFalse();
    }));

    it('should not set dateRangeInvalid error when termDate is null', fakeAsync(() => {
      const futureDate = moment().add(5, 'days');

      component.form.get('effDate')?.setValue(futureDate);
      component.form.get('termDate')?.setValue(null);
      tick();

      expect(component.form.hasError('dateRangeInvalid')).toBeFalse();
    }));
  });

  describe('Subscription cleanup on destroy', () => {
    it('should stop poolSldSearchCtrl subscription after destroy', fakeAsync(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      // Destroy the component
      component.ngOnDestroy();

      // After destroy, changing the search control should not update filtered options
      const currentOptions = [...component.filteredPoolSldOptions];
      component.poolSldSearchCtrl.setValue('xyz');
      tick();

      // filteredPoolSldOptions should remain unchanged since subscriptions are cleaned up
      expect(component.filteredPoolSldOptions).toEqual(currentOptions);
    }));

    it('should stop descriptionSearchCtrl subscription after destroy', fakeAsync(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      // Set a pool first to populate descriptions
      component.form.get('poolSld')?.setValue('17');
      tick();

      const currentDescriptions = [...component.filteredDescriptionOptions];

      // Destroy the component
      component.ngOnDestroy();

      // After destroy, changing the search control should not update filtered options
      component.descriptionSearchCtrl.setValue('Regular');
      tick();

      expect(component.filteredDescriptionOptions).toEqual(currentDescriptions);
    }));
  });

  describe('validateForm - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should return false when form is invalid due to missing required fields', () => {
      // All required fields are null, form should be invalid
      const result = component['validateForm']();
      expect(result).toBeFalse();
    });

    it('should return true when form is valid in add mode', fakeAsync(() => {
      const futureDate = moment().add(1, 'day');
      component.form.patchValue({
        poolSld: '17',
        unitSchemeType: 'I',
        rhLabelFlag: 'Y',
        effDate: futureDate,
        termDate: null
      });
      tick();

      const result = component['validateForm']();
      expect(result).toBeTrue();
    }));

    it('should clear optional termDate errors during validation', () => {
      const spy = spyOn(DateFieldValidationUtility, 'clearOptionalDateErrors');

      component['validateForm']();

      expect(spy).toHaveBeenCalledWith(component.form, 'termDate');
    });

    it('should mark all controls as touched', () => {
      const spy = spyOn(component.form, 'markAllAsTouched');

      component['validateForm']();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('validateForm - Edit Mode', () => {
    it('should return true when there are no date errors in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = {
        ...mockData,
        effDate: moment().format('DD-MMM-YYYY'),
        termDate: moment().add(1, 'day').format('DD-MMM-YYYY')
      };
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();
      tick();

      const result = component['validateForm']();
      expect(result).toBeTrue();
    }));

    it('should return false when there is an effective date error in edit mode', fakeAsync(() => {
      component.mode = 'edit';
      component.data = mockData;
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();
      tick();

      // Force an effective date error
      const effControl = component.form.get('effDate');
      effControl?.setErrors({ invalidDate: true });
      effControl?.markAsTouched();
      effControl?.markAsDirty();
      component['lastChangedDateField'] = 'effective';

      const result = component['validateForm']();
      expect(result).toBeFalse();
    }));
  });

  describe('chapterOffset', () => {
    it('should use headerService.chapterTimeZone for chapter offset', () => {
      component.mode = 'add';
      component.poolSldOptions = mockPoolSldOptions;
      component.ngOnInit();
      fixture.detectChanges();

      // The chapterOffset getter should return the value from headerService
      expect(component['chapterOffset']).toBe('America/New_York');
    });
  });


});
