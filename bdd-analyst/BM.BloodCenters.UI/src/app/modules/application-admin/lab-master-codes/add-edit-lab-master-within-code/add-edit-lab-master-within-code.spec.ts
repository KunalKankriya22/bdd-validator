import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { AddEditLabMasterWithinCode, LabMasterCodeDialogData } from './add-edit-lab-master-within-code';
import moment from 'moment';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AddEditLabMasterWithinCode', () => {
    let component: AddEditLabMasterWithinCode;
    let fixture: ComponentFixture<AddEditLabMasterWithinCode>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddEditLabMasterWithinCode>>;

    const baseDialogData: LabMasterCodeDialogData = {
        mode: 'add',
        codeType: 'TEST',
        codeTypeDescription: 'TEST TYPE'
    };

    function createTestBed(dialogData: LabMasterCodeDialogData): void {
        const ref = jasmine.createSpyObj('MatDialogRef', ['close']);
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [
                AddEditLabMasterWithinCode,
                ReactiveFormsModule,
                MatDialogModule,
                MatButtonModule,
                MatInputModule,
                MatFormFieldModule,
                MatDatepickerModule,
                MatIconModule,
                MatProgressSpinnerModule],
            providers: [
                { provide: MatDialogRef, useValue: ref },
                { provide: MAT_DIALOG_DATA, useValue: dialogData },
                { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
                { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting()
            ]
        });
        fixture = TestBed.createComponent(AddEditLabMasterWithinCode);
        component = fixture.componentInstance;
        mockDialogRef = ref;
        fixture.detectChanges();
    }

    beforeEach(() => {

        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);



        TestBed.configureTestingModule({
            imports: [
                AddEditLabMasterWithinCode,
                ReactiveFormsModule,
                MatDialogModule,
                MatButtonModule,
                MatInputModule,
                MatFormFieldModule,
                MatDatepickerModule,
                MatIconModule,
                MatProgressSpinnerModule],
            providers: [
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: baseDialogData },
                { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
                { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting()
            ]
        });


      


        mockDialogRef.close.calls.reset();


        fixture = TestBed.createComponent(AddEditLabMasterWithinCode);
        component = fixture.componentInstance;
        fixture.detectChanges();


      });
    describe('Form Validation - ADD Mode', () => {


        it('should validate code field as required', () => {
            const codeControl = component.form.get('code');
            expect(codeControl?.valid).toBeFalsy();
            expect(codeControl?.hasError('required')).toBeTruthy();
        });

        it('should validate code field for alphanumeric characters only', () => {
            const codeControl = component.form.get('code');
            codeControl?.setValue('TEST@123');
            expect(codeControl?.hasError('alphanumeric')).toBeTruthy();

            codeControl?.setValue('TEST123');
            expect(codeControl?.hasError('alphanumeric')).toBeFalsy();
        });

        it('should validate code max length of 5 characters', () => {
            const codeControl = component.form.get('code');
            codeControl?.setValue('TEST12');
            expect(codeControl?.hasError('trimmedMaxLength')).toBeTruthy();

            codeControl?.setValue('TEST1');
            expect(codeControl?.hasError('trimmedMaxLength')).toBeFalsy();
        });

        it('should validate description as required', () => {
            const descControl = component.form.get('description');
            expect(descControl?.valid).toBeFalsy();
            expect(descControl?.hasError('required')).toBeTruthy();
        });

        it('should validate description max length of 500 characters', () => {
            const descControl = component.form.get('description');
            const longDescription = 'A'.repeat(501);
            descControl?.setValue(longDescription);
            expect(descControl?.hasError('trimmedMaxLength')).toBeTruthy();

            descControl?.setValue('Valid description');
            expect(descControl?.hasError('trimmedMaxLength')).toBeFalsy();
        });

        it('should validate effective date as required', () => {
            const effectiveControl = component.form.get('effectiveDate');
            expect(effectiveControl?.valid).toBeFalsy();
            expect(effectiveControl?.hasError('required')).toBeTruthy();
        });



        it('should validate numerical value field format', () => {
            const numControl = component.form.get('numericalValue');

            numControl?.setValue('ABC');
            expect(numControl?.hasError('numericalValue')).toBeTruthy();

            numControl?.setValue('12345');
            expect(numControl?.hasError('numericalValue')).toBeFalsy();

            numControl?.setValue('1234');
            expect(numControl?.hasError('numericalValue')).toBeFalsy();
        });

        it('should validate sequence fields as integers', () => {
            const seq1Control = component.form.get('sequence1');
            const seq2Control = component.form.get('sequence2');
            const seq3Control = component.form.get('sequence3');

            seq1Control?.setValue('999');
            expect(seq1Control?.hasError('integer')).toBeFalsy();

            seq2Control?.setValue('10000');
            expect(seq2Control?.hasError('integer')).toBeFalsy();

            seq3Control?.setValue('ABC');
            expect(seq3Control?.hasError('integer')).toBeTruthy();
        });


    });

    describe('Form Validation - EDIT Mode', () => {
        const editData: LabMasterCodeDialogData = {
            mode: 'edit',
            codeType: 'TEST',
            codeTypeDescription: 'TEST TYPE',
            code: 'CODE1',
            description: 'Test Description',
            effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            terminationDate: null,
            numericalValue: 100,
            sequence1: 1,
            sequence2: 2,
            sequence3: 3
        };

        beforeEach(() => {
            createTestBed(editData);
        });



        it('should have numeric fields enabled in edit mode', () => {
            expect(component.form.get('numericalValue')?.disabled).toBeFalsy();
            expect(component.form.get('sequence1')?.disabled).toBeFalsy();
            expect(component.form.get('sequence2')?.disabled).toBeFalsy();
            expect(component.form.get('sequence3')?.disabled).toBeFalsy();
        });



        it('should populate numeric fields with existing data in edit mode', () => {
            expect(component.form.get('numericalValue')?.value).toBe(100);
            expect(component.form.get('sequence1')?.value).toBe(1);
            expect(component.form.get('sequence2')?.value).toBe(2);
            expect(component.form.get('sequence3')?.value).toBe(3);
        });

        it('should allow editing numeric fields in edit mode', () => {
            component.form.get('numericalValue')?.setValue(999);
            component.form.get('sequence1')?.setValue(10);
            component.form.get('sequence2')?.setValue(20);
            component.form.get('sequence3')?.setValue(30);

            expect(component.form.get('numericalValue')?.value).toBe(999);
            expect(component.form.get('sequence1')?.value).toBe(10);
            expect(component.form.get('sequence2')?.value).toBe(20);
            expect(component.form.get('sequence3')?.value).toBe(30);
        });

        it('should still validate numericalValue field in edit mode', () => {
            const numControl = component.form.get('numericalValue');
            numControl?.setValue('ABC');
            expect(numControl?.hasError('numericalValue')).toBeTruthy();

            numControl?.setValue(12345);
            expect(numControl?.hasError('numericalValue')).toBeFalsy();
        });

        it('should still validate sequence fields as integers in edit mode', () => {
            const seq3Control = component.form.get('sequence3');
            seq3Control?.setValue('XYZ');
            expect(seq3Control?.hasError('integer')).toBeTruthy();

            seq3Control?.setValue(5);
            expect(seq3Control?.hasError('integer')).toBeFalsy();
        });
    });

    describe('Error Message Methods', () => {
        beforeEach(() => {
            component.form.markAllAsTouched();
        });



        it('should return description error message', () => {
            const descControl = component.form.get('description');
            descControl?.setValue('');
            descControl?.markAsTouched();

            expect(component.getDescriptionError()).toBe('Description is required');

            descControl?.setValue('A'.repeat(501));
            expect(component.getDescriptionError()).toContain('must not exceed');
        });

        it('should return effective date error message', () => {
            const effectiveControl = component.form.get('effectiveDate');
            effectiveControl?.setValue(null);
            effectiveControl?.markAsTouched();

            expect(component.getEffectiveDateError()).toBe('Effective Date is required');
        });



        it('should return termination date error message', () => {
            const effectiveControl = component.form.get('effectiveDate');
            const terminationControl = component.form.get('terminationDate');

            effectiveControl?.setValue(moment('2027-06-01'));
            terminationControl?.setValue(moment('2027-03-01'));
            fixture.detectChanges();
            terminationControl?.markAsTouched();

            expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
        });

        it('should return numerical value error message', () => {
            const numControl = component.form.get('numericalValue');
            numControl?.setValue('ABC');
            numControl?.markAsTouched();

            expect(component.getNumericalValueError()).toContain('Must be a valid number');
        });
    });

    describe('Character Count Methods', () => {
        it('should calculate code remaining characters', () => {
            component.form.get('code')?.setValue('AB');
            expect(component.getCodeRemainingCharacters()).toBe('Characters Remaining: 3/5');
        });

        it('should calculate description remaining characters', () => {
            component.form.get('description')?.setValue('Test');
            expect(component.getDescriptionRemainingCharacters()).toBe('Characters Remaining: 496/500');
        });


    });

    describe('Panel Actions', () => {




        it('should emit save result on successful save in ADD mode', fakeAsync(() => {
            let savedResult: any;
            component.saveRequest.subscribe(result => savedResult = result);

            component.form.patchValue({
                code: 'TEST1',
                description: 'Test Description',
                effectiveDate: moment('2027-01-15'),
                terminationDate: moment('2027-12-31'),
                numericalValue: 123,
                sequence1: 1,
                sequence2: 2,
                sequence3: 3
            });
            fixture.detectChanges();
            component.form.updateValueAndValidity();

            component.onSave();
            tick();

            expect(savedResult).toEqual(jasmine.objectContaining({
                code: 'TEST1',
                description: 'Test Description',
                codeType: 'TEST'
            }));
        }));

        it('should emit save result on successful save in EDIT mode', fakeAsync(() => {
            const editData: LabMasterCodeDialogData = {
                mode: 'edit',
                codeType: 'TEST',
                codeTypeDescription: 'TEST TYPE',
                code: 'CODE1',
                description: 'Original Description'
            };
            createTestBed(editData);

            let savedResult: any;
            component.saveRequest.subscribe(result => savedResult = result);

            component.form.patchValue({
                description: 'Updated Description',
                effectiveDate: moment('2027-01-15')
            });
            component.form.markAsDirty();
            fixture.detectChanges();
            component.form.updateValueAndValidity();

            component.onSave();
            tick();

            expect(savedResult).toEqual(jasmine.objectContaining({
                code: 'CODE1',
                description: 'Updated Description',
                codeType: 'TEST'
            }));
        }));

        it('should handle null termination date on save', fakeAsync(() => {
            let savedResult: any;
            component.saveRequest.subscribe(result => savedResult = result);

            component.form.patchValue({
                code: 'TEST1',
                description: 'Test Description',
                effectiveDate: moment('2027-01-15'),
                terminationDate: null
            });
            fixture.detectChanges();
            component.form.updateValueAndValidity();

            component.onSave();
            tick();

            expect(savedResult).toEqual(jasmine.objectContaining({
                terminationDate: null
            }));
        }));


    });
    describe('Date Formatting', () => {


        it('should format a date in DD-MMM-YYYY format', () => {
            const date = moment().add(1, 'year').startOf('month');
            expect(component.formatDate(date.toDate())).toBe(date.format('DD-MMM-YYYY'));
        });
    });

    describe('editEffectiveDateDisplay Getter', () => {


        it('should return formatted uppercase date when effective date is set', () => {
            const testDate = moment().add(1, 'year');
            component.form.get('effectiveDate')?.setValue(testDate);
            const expected = testDate.format('DD-MMM-YYYY').toUpperCase();
            expect(component.editEffectiveDateDisplay).toBe(expected);
        });
    });

    describe('Computed Remaining Characters Getters', () => {
        it('should return correct remaining code characters', () => {
            component.form.get('code')?.setValue('AB');
            expect(component.codeRemainingChars).toBe(3);
        });

        it('should return max when code is empty', () => {
            component.form.get('code')?.setValue('');
            expect(component.codeRemainingChars).toBe(5);
        });

        it('should return zero when code is at max length', () => {
            component.form.get('code')?.setValue('ABCDE');
            expect(component.codeRemainingChars).toBe(0);
        });

        it('should return correct remaining description characters', () => {
            component.form.get('description')?.setValue('Test');
            expect(component.descriptionRemainingChars).toBe(496);
        });

        it('should return max when description is empty', () => {
            component.form.get('description')?.setValue('');
            expect(component.descriptionRemainingChars).toBe(500);
        });
    });

    describe('Input Handler Methods', () => {
        function createKeyboardEvent(key: string): KeyboardEvent {
            const event = new KeyboardEvent('keydown', { key, bubbles: true });
            spyOn(event, 'preventDefault');
            return event;
        }

        function createInputEvent(value: string): { event: Event; input: HTMLInputElement } {
            const input = document.createElement('input');
            input.value = value;
            const event = { target: input } as unknown as Event;
            return { event, input };
        }
        describe('onCodeInput()', () => {
            it('should strip whitespace from value and update form control', () => {
                const { event } = createInputEvent('AB CD');
                component.onCodeInput(event);
                expect(component.form.get('code')?.value).toBe('ABCD');
            });

            it('should strip leading/trailing spaces', () => {
                const { event, input } = createInputEvent('  AB  ');
                component.onCodeInput(event);
                expect(input.value).toBe('AB');
            });

            it('should not modify input when there is no whitespace', () => {
                const { event, input } = createInputEvent('ABCD');
                component.onCodeInput(event);
                expect(input.value).toBe('ABCD');
            });
        });

        describe('onIntegerInput()', () => {
            it('should strip "e" from value', () => {
                const { event, input } = createInputEvent('12e3');
                component.onIntegerInput(event, 'sequence1', 4);
                expect(input.value).toBe('123');
            });

            it('should strip "E" from value', () => {
                const { event, input } = createInputEvent('12E3');
                component.onIntegerInput(event, 'sequence1', 4);
                expect(input.value).toBe('123');
            });

            it('should strip decimal part', () => {
                const { event, input } = createInputEvent('12.5');
                component.onIntegerInput(event, 'sequence1', 4);
                expect(input.value).toBe('12');
            });

            it('should truncate to maxDigits', () => {
                const { event, input } = createInputEvent('12345');
                component.onIntegerInput(event, 'sequence1', 4);
                expect(input.value).toBe('1234');
            });

            it('should handle negative values and truncate digits after minus', () => {
                const { event, input } = createInputEvent('-12345');
                component.onIntegerInput(event, 'sequence1', 4);
                expect(input.value).toBe('-1234');
            });

            it('should set control to null when only "e" is entered', () => {
                const { event } = createInputEvent('e');
                component.onIntegerInput(event, 'sequence1', 4);
                expect(component.form.get('sequence1')?.value).toBeNull();
            });

            it('should update form control with numeric value', () => {
                const { event } = createInputEvent('e99');
                component.onIntegerInput(event, 'sequence2', 4);
                expect(component.form.get('sequence2')?.value).toBe(99);
            });
        });

        describe('onDecimalInput()', () => {
            it('should strip "e" from value', () => {
                const { event, input } = createInputEvent('12e3');
                component.onDecimalInput(event, 'numericalValue');
                expect(input.value).toBe('123');
            });

            it('should strip "E" from value', () => {
                const { event, input } = createInputEvent('12E3');
                component.onDecimalInput(event, 'numericalValue');
                expect(input.value).toBe('123');
            });

            it('should clamp integer digits to 7', () => {
                const { event, input } = createInputEvent('12345678');
                component.onDecimalInput(event, 'numericalValue');
                expect(input.value).toBe('1234567');
            });

            it('should clamp decimal digits to 3', () => {
                const { event, input } = createInputEvent('123.4567');
                component.onDecimalInput(event, 'numericalValue');
                expect(input.value).toBe('123.456');
            });

            it('should preserve negative sign when clamping integer digits', () => {
                const { event, input } = createInputEvent('-12345678');
                component.onDecimalInput(event, 'numericalValue');
                expect(input.value).toBe('-1234567');
            });

            it('should preserve negative sign and clamp decimal digits', () => {
                const { event, input } = createInputEvent('-12.4567');
                component.onDecimalInput(event, 'numericalValue');
                expect(input.value).toBe('-12.456');
            });

            it('should set control to null for invalid partial input', () => {
                const { event } = createInputEvent('-');
                component.onDecimalInput(event, 'numericalValue');
                // '-' is unchanged so no setValue call, value stays at initial (0)
                expect(component.form.get('numericalValue')?.value).toBe(0);
            });

            it('should update form control with numeric value after strip', () => {
                const { event } = createInputEvent('1e23');
                component.onDecimalInput(event, 'numericalValue');
                expect(component.form.get('numericalValue')?.value).toBe(123);
            });
        });
    });

    describe('Code Type Display Logic', () => {
        it('should display code type from injected dialog data', () => {
            // codeTypeDisplay is set from MAT_DIALOG_DATA in ngOnInit
            // baseDialogData has codeType: 'TEST', codeTypeDescription: 'TEST TYPE'
            expect(component.codeTypeDisplay).toBe('TEST - TEST TYPE');
        });

        it('should display combined code type and description', () => {
            const dataWithCodeType: LabMasterCodeDialogData = {
                mode: 'add',
                codeType: 'MASTR',
                codeTypeDescription: 'Master Type Description'
            };
            createTestBed(dataWithCodeType);
            expect(component.codeTypeDisplay).toBe('MASTR - Master Type Description');
        });
    });
});
