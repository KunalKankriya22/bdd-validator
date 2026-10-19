import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AddEditInventoryProductType } from './add-edit-inventory-product-type';
import { InventoryProductTypesService } from '../services/inventory-product-types.service';
import { VALIDATION_INVENTORY_PRODUCT_TYPES } from 'src/app/core/constants/validation.constants';
import moment from 'moment';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditInventoryProductType', () => {
    let component: AddEditInventoryProductType;
    let fixture: ComponentFixture<AddEditInventoryProductType>;
    let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
    let mockService: jasmine.SpyObj<InventoryProductTypesService>;

    const mockFiltersResponse = {
        Item: {
            productGrouping: [
                { code: 'RB', description: 'Red Blood Cells' },
                { code: 'PL', description: 'Platelets' },
                { code: 'PS', description: 'Plasma' }
            ],
            LifeSpanIndicator: ['D', 'H', 'M']
        }
    };

    // Use dynamic dates to avoid test failures when hardcoded dates become past dates
    const futureEffectiveDate = moment().add(1, 'month').format('YYYY-MM-DD');
    const futureTerminationDate = moment().add(6, 'months').format('YYYY-MM-DD');

    const mockRecordData = {
        productType: 'RBC',
        shortName: 'RedCells',
        description: 'Red blood cells for transfusion',
        price: 250.00,
        lifeSpan: 42,
        lifeSpanInd: 'D',
        sortSequence: 1,
        productGrouping: 'RB',
        aboOnly: true,
        rhRequired: false,
        importAllowed: true,
        pooledProduct: false,
        specialInventory: false,
        effectiveDate: futureEffectiveDate,
        terminationDate: futureTerminationDate
    };

    beforeEach(async () => {

        mockSnackBar = createMockMatSnackBar();
        mockService = jasmine.createSpyObj('InventoryProductTypesService', [
            'getAvailableDropdowns',
            'getAvailableProductTypes',
            'createInventoryProductType',
            'updateInventoryProductType'
        ]);

        mockService.getAvailableDropdowns.and.returnValue(of(mockFiltersResponse));
        mockService.getAvailableProductTypes.and.returnValue(of([]));

        await TestBed.configureTestingModule({
            imports: [AddEditInventoryProductType, NoopAnimationsModule, HttpClientTestingModule],
            providers: [
                { provide: MatSnackBar, useValue: mockSnackBar },
                { provide: InventoryProductTypesService, useValue: mockService }
            ]
        }).compileComponents();
    });

    const createComponent = (mode: 'add' | 'edit', record: any = null) => {
        if (fixture) {
            fixture.destroy();
        }

        fixture = TestBed.createComponent(AddEditInventoryProductType);
        component = fixture.componentInstance;

        // Set inputs BEFORE detectChanges (which triggers ngOnInit)
        component.mode = mode;
        component.data = record;

        // Now trigger change detection and ngOnInit
        fixture.detectChanges();
    };

    describe('Component Initialization - Edit Mode', () => {
        beforeEach(fakeAsync(() => {
            createComponent('edit', mockRecordData);
            flush(); // Flush all async operations from component initialization
        }));

        it('should not disable productType field in edit mode', () => {
            // ProductType is shown as read-only card in template, not disabled in form
            expect(component.form.get('productType')?.disabled).toBe(false);
        });

        it('should populate form with record data', () => {
            expect(component.form.get('productType')?.value).toBe('RBC');
            expect(component.form.get('shortName')?.value).toBe('RedCells');
            expect(component.form.get('description')?.value).toBe('Red blood cells for transfusion');
            expect(component.form.get('price')?.value).toBe(250.00);
            expect(component.form.get('lifeSpan')?.value).toBe(42);
            expect(component.form.get('lifeSpanInd')?.value).toBe('D');
            expect(component.form.get('sortSequence')?.value).toBe(1);
            // ProductGrouping is patched asynchronously - flush was called in beforeEach
            expect(component.form.get('productGrouping')?.value).toBe('RB');
        });

        it('should convert boolean fields to Yes/No strings', () => {
            expect(component.form.get('aboOnly')?.value).toBe('Yes');
            expect(component.form.get('rhRequired')?.value).toBe('No');
            expect(component.form.get('importAllowed')?.value).toBe('Yes');
        });

        it('should convert date strings to moment objects', () => {
            const effectiveDate = component.form.get('effectiveDate')?.value;
            const terminationDate = component.form.get('terminationDate')?.value;
            expect(effectiveDate).toBeTruthy();
            expect(terminationDate).toBeTruthy();
        });

        it('should store originalTerminationDate when loading record with termination date', () => {
            // Access private property for testing
            const originalTermDate = (component as any).originalTerminationDate;
            expect(originalTermDate).toBe(futureTerminationDate);
        });

    });

    describe('Component Initialization - Edit Mode - Termination Date Validation', () => {
        it('should allow original past termination date without validation error', fakeAsync(() => {
            const pastTermDate = moment().subtract(6, 'months').format('YYYY-MM-DD');
            const recordWithPastTermDate = {
                ...mockRecordData,
                terminationDate: pastTermDate
            };

            createComponent('edit', recordWithPastTermDate);
            flush();

            // Original past date should be stored
            const originalTermDate = (component as any).originalTerminationDate;
            expect(originalTermDate).toBe(pastTermDate);

            // Form with original past date should not have pastDate error
            // (The validator allows the original past date)
            const termDateControl = component.form.get('terminationDate');
            expect(termDateControl?.hasError('pastDate')).toBe(false);
        }));

        it('should reject NEW past termination date in edit mode', fakeAsync(() => {
            createComponent('edit', mockRecordData);
            flush();

            // Try to change to a new past date
            const newPastDate = moment().subtract(1, 'month');
            component.form.get('terminationDate')?.setValue(newPastDate);
            component.form.get('terminationDate')?.markAsTouched();
            component.form.get('terminationDate')?.updateValueAndValidity();
            fixture.detectChanges();
            tick();

            // Should be invalid with new past date
            expect(component.form.get('terminationDate')?.invalid).toBe(true);
        }));

        it('should allow today and future dates in edit mode', fakeAsync(() => {
            const pastEffDate = moment().subtract(1, 'month').format('YYYY-MM-DD');
            const recordWithPastEffDate = {
                ...mockRecordData,
                effectiveDate: pastEffDate,
                terminationDate: null
            };
            createComponent('edit', recordWithPastEffDate);
            flush();

            // Try today's date
            const today = moment();
            component.form.get('terminationDate')?.setValue(today);
            component.form.get('terminationDate')?.markAsTouched();
            component.form.get('terminationDate')?.updateValueAndValidity();
            fixture.detectChanges();
            tick();

            expect(component.form.get('terminationDate')?.valid).toBe(true);

            // Try future date
            const futureDate = moment().add(1, 'year');
            component.form.get('terminationDate')?.setValue(futureDate);
            component.form.get('terminationDate')?.updateValueAndValidity();
            fixture.detectChanges();
            tick();

            expect(component.form.get('terminationDate')?.valid).toBe(true);
        }));
    });

    describe('Form Validation', () => {
        beforeEach(() => {
            createComponent('add');
        });

        describe('productType field', () => {
            it('should require productType', () => {
                const control = component.form.get('productType');
                control?.setValue('');
                expect(control?.hasError('required')).toBe(true);
            });


            it('should validate maxLength', () => {
                const control = component.form.get('productType');
                control?.setValue('TOOLONG');
                expect(control?.hasError('maxlength')).toBe(true);
            });

        });

        describe('shortName field', () => {
            it('should require shortName', () => {
                const control = component.form.get('shortName');
                control?.setValue('');
                expect(control?.hasError('required')).toBe(true);
            });

            it('should validate maxLength of 10 characters', () => {
                const control = component.form.get('shortName');
                control?.setValue('12345678901'); // 11 chars
                expect(control?.hasError('maxlength')).toBe(true);
            });

            it('should accept special characters (no character restriction per FMB)', () => {
                const control = component.form.get('shortName');
                control?.setValue('RBC-Type1');
                expect(control?.hasError('invalidCharacters')).toBeFalsy();
                expect(control?.valid).toBe(true);
            });

            it('should accept values with spaces (no space restriction per FMB)', () => {
                const control = component.form.get('shortName');
                control?.setValue('Red Cell');
                expect(control?.hasError('multipleSpaces')).toBeFalsy();
                expect(control?.hasError('leadingTrailingSpaces')).toBeFalsy();
                expect(control?.valid).toBe(true);
            });

            it('should accept values with multiple consecutive spaces', () => {
                const control = component.form.get('shortName');
                control?.setValue('Red  Cell');
                expect(control?.hasError('multipleSpaces')).toBeFalsy();
                expect(control?.valid).toBe(true);
            });
        });

        describe('description field', () => {
            it('should require description', () => {
                const control = component.form.get('description');
                control?.setValue('');
                expect(control?.hasError('required')).toBe(true);
            });

            it('should validate maxLength', () => {
                const control = component.form.get('description');
                control?.setValue('a'.repeat(51));
                expect(control?.hasError('maxlength')).toBe(true);
            });
        });

        describe('price field', () => {
            it('should validate minimum value', () => {
                const control = component.form.get('price');
                control?.setValue(-1000000);
                expect(control?.hasError('min')).toBe(true);

                control?.setValue(-100.50);
                expect(control?.hasError('min')).toBe(false);
                expect(control?.valid).toBe(true);
            });

        });

        describe('lifeSpan field', () => {
            it('should validate minimum value', () => {
                const control = component.form.get('lifeSpan');
                control?.setValue(-1);
                expect(control?.hasError('min')).toBe(true);
            });

            it('should validate maximum value', () => {
                const control = component.form.get('lifeSpan');
                control?.setValue(100000);
                expect(control?.hasError('max')).toBe(true);
            });
        });

        describe('sortSequence field', () => {
            it('should validate minimum value', () => {
                const control = component.form.get('sortSequence');
                control?.setValue(-1);
                expect(control?.hasError('min')).toBe(true);
            });

            it('should validate maximum value', () => {
                const control = component.form.get('sortSequence');
                control?.setValue(100);
                expect(control?.hasError('max')).toBe(true);
            });
        });

        describe('productGrouping field', () => {
            it('should require productGrouping', () => {
                const control = component.form.get('productGrouping');
                control?.setValue('');
                expect(control?.hasError('required')).toBe(true);
            });

            it('should validate maxLength', () => {
                const control = component.form.get('productGrouping');
                control?.setValue('a'.repeat(51));
                expect(control?.hasError('maxlength')).toBe(true);
            });
        });

        describe('effectiveDate field', () => {
            it('should require effectiveDate', () => {
                const control = component.form.get('effectiveDate');
                control?.setValue(null);
                expect(control?.hasError('required')).toBe(true);
            });
        });
    });

    describe('Custom lifeSpan Validator', () => {
        beforeEach(() => {
            createComponent('add');
        });

        it('should clear error when dependent field value is removed', () => {
            // Set lifeSpan with value and empty unit - should show error on unit
            component.form.patchValue({
                lifeSpan: 42,
                lifeSpanInd: ''
            });
            component.form.updateValueAndValidity();
            fixture.detectChanges();

            expect(component.form.get('lifeSpanInd')?.hasError('interdependent')).toBe(true);
            expect(component.form.get('lifeSpanInd')?.touched).toBe(true);

            // Now remove lifeSpan value - error should clear
            component.form.patchValue({
                lifeSpan: null
            });
            component.form.updateValueAndValidity();
            fixture.detectChanges();

            expect(component.form.get('lifeSpanInd')?.hasError('interdependent')).toBe(false);
        });

        it('should clear error when user fills the dependent field', () => {
            // Set lifeSpan with value and empty unit - should show error on unit
            component.form.patchValue({
                lifeSpan: 42,
                lifeSpanInd: ''
            });
            component.form.updateValueAndValidity();
            fixture.detectChanges();

            expect(component.form.get('lifeSpanInd')?.hasError('interdependent')).toBe(true);

            // Fill in the unit - error should clear
            component.form.patchValue({
                lifeSpanInd: 'D'
            });
            component.form.updateValueAndValidity();
            fixture.detectChanges();

            expect(component.form.get('lifeSpanInd')?.hasError('interdependent')).toBe(false);
            expect(component.form.get('lifeSpan')?.hasError('interdependent')).toBe(false);
        });

    });

    describe('onSave - Add Mode', () => {
        beforeEach(fakeAsync(() => {
            createComponent('add');
            flush(); // Allow async operations to complete
        }));

        it('should create new product type with valid data', fakeAsync(() => {
            const mockResponse = { Success: true };
            mockService.createInventoryProductType.and.returnValue(of(mockResponse));

            const tomorrow = moment().add(1, 'day');
            const nextYear = moment().add(1, 'year');

            // Set all required fields to ensure form validity
            component.form.patchValue({
                productType: 'RBC',
                shortName: 'RedCells',
                description: 'Red blood cells',
                price: 250,
                lifeSpan: 42,
                lifeSpanInd: 'D',
                sortSequence: 1,
                productGrouping: 'RB',
                aboOnly: 'Yes',
                rhRequired: 'No',
                importAllowed: 'Yes',
                pooledProduct: true,
                specialInventory: false,
                effectiveDate: tomorrow,
                terminationDate: nextYear
            });
            component.form.updateValueAndValidity();
            fixture.detectChanges();
            tick(); // Allow validators to process

            component.onSave();
            flush();

            expect(mockService.createInventoryProductType).toHaveBeenCalled();
            const payload = mockService.createInventoryProductType.calls.mostRecent().args[0];
            expect(payload.productType).toBe('RBC');
            expect(payload.shortName).toBe('RedCells');
            expect(payload.productGrouping).toBe('RB');
            expect(payload.aboOnly).toBe(true);
            expect(payload.poolProduct).toBe(true);
            expect(payload.shipAnyRh).toBe(false);
            expect(payload.aboFlag).toBe(true);
        }));

        it('should use product grouping code as-is', fakeAsync(() => {
            const mockResponse = { Success: true };
            mockService.createInventoryProductType.and.returnValue(of(mockResponse));

            const tomorrow = moment().add(1, 'day');

            // Set all required fields to ensure form validity
            component.form.patchValue({
                productType: 'PLT',
                shortName: 'Platelets',
                description: 'Platelet product',
                productGrouping: 'PL',
                effectiveDate: tomorrow
            });
            component.form.updateValueAndValidity();
            fixture.detectChanges();
            tick(); // Allow validators to process

            component.onSave();
            flush();

            expect(mockService.createInventoryProductType).toHaveBeenCalled();
            const payload = mockService.createInventoryProductType.calls.mostRecent().args[0];
            expect(payload.productGrouping).toBe('PL');
        }));

        it('should not save when product grouping is empty (required field)', fakeAsync(() => {
            const mockResponse = { Success: true };
            mockService.createInventoryProductType.and.returnValue(of(mockResponse));

            const tomorrow = moment().add(1, 'day');

            // Set all required fields except productGrouping
            component.form.patchValue({
                productType: 'PLT',
                shortName: 'Platelets',
                description: 'Platelet product',
                productGrouping: '', // Required field - empty
                effectiveDate: tomorrow
            });
            component.form.updateValueAndValidity();
            fixture.detectChanges();
            tick(); // Allow validators to process

            component.onSave();
            flush();

            // Should NOT save because productGrouping is required
            expect(mockService.createInventoryProductType).not.toHaveBeenCalled();
            expect(component.form.invalid).toBe(true);
        }));

        it('should handle null/empty optional fields correctly', fakeAsync(() => {
            const mockResponse = { Success: true };
            mockService.createInventoryProductType.and.returnValue(of(mockResponse));

            const tomorrow = moment().add(1, 'day');

            // Set all required fields to ensure form validity
            component.form.patchValue({
                productType: 'RBC',
                shortName: 'RedCells',
                description: 'Red blood cells',
                price: null,
                lifeSpan: null,
                lifeSpanInd: '',
                sortSequence: null,
                productGrouping: 'RB',
                aboOnly: '',
                rhRequired: '',
                importAllowed: '',
                effectiveDate: tomorrow,
                terminationDate: null
            });
            component.form.updateValueAndValidity();
            fixture.detectChanges();
            tick(); // Allow validators to process

            component.onSave();
            flush();

            expect(mockService.createInventoryProductType).toHaveBeenCalled();
            const payload = mockService.createInventoryProductType.calls.mostRecent().args[0];
            expect(payload.standardPrice).toBeUndefined();
            expect(payload.lifeSpan).toBeUndefined();
            expect(payload.lifeSpanIndicator).toBeUndefined();
            expect(payload.sortSequence).toBeUndefined();
            expect(payload.terminationDate).toBeUndefined();
            expect(payload.aboOnly).toBe(false);
            expect(payload.shipAnyRh).toBe(false);
            expect(payload.aboFlag).toBe(false);
        }));

        it('should convert Yes to true for boolean fields', fakeAsync(() => {
            const mockResponse = { Success: true };
            mockService.createInventoryProductType.and.returnValue(of(mockResponse));

            const tomorrow = moment().add(1, 'day');

            // Set all required fields to ensure form validity
            component.form.patchValue({
                productType: 'RBC',
                shortName: 'RedCells',
                description: 'Red blood cells',
                productGrouping: 'RB',
                aboOnly: 'Yes',
                rhRequired: 'Yes',
                importAllowed: 'Yes',
                effectiveDate: tomorrow
            });
            component.form.updateValueAndValidity();
            fixture.detectChanges();
            tick(); // Allow validators to process

            component.onSave();
            flush();

            expect(mockService.createInventoryProductType).toHaveBeenCalled();
            const payload = mockService.createInventoryProductType.calls.mostRecent().args[0];
            expect(payload.aboOnly).toBe(true);
            expect(payload.shipAnyRh).toBe(true);
            expect(payload.aboFlag).toBe(true);
        }));

        it('should convert No to false for boolean fields', fakeAsync(() => {
            const mockResponse = { Success: true };
            mockService.createInventoryProductType.and.returnValue(of(mockResponse));

            const tomorrow = moment().add(1, 'day');

            // Set all required fields to ensure form validity
            component.form.patchValue({
                productType: 'RBC',
                shortName: 'RedCells',
                description: 'Red blood cells',
                productGrouping: 'RB',
                aboOnly: 'No',
                rhRequired: 'No',
                importAllowed: 'No',
                effectiveDate: tomorrow
            });
            component.form.updateValueAndValidity();
            fixture.detectChanges();
            tick(); // Allow validators to process

            component.onSave();
            flush();

            expect(mockService.createInventoryProductType).toHaveBeenCalled();
            const payload = mockService.createInventoryProductType.calls.mostRecent().args[0];
            expect(payload.aboOnly).toBe(false);
            expect(payload.shipAnyRh).toBe(false);
            expect(payload.aboFlag).toBe(false);
        }));

    });

    describe('onSave - Edit Mode', () => {
        beforeEach(fakeAsync(() => {
            createComponent('edit', mockRecordData);
            flush(); // Allow async operations to complete
        }));

        it('should update existing product type', fakeAsync(() => {
            const mockResponse = { Success: true };
            mockService.updateInventoryProductType.and.returnValue(of(mockResponse));

            component.form.patchValue({
                price: 300,
                description: 'Updated description'
            });
            component.form.updateValueAndValidity();
            fixture.detectChanges();
            tick(); // Allow validators to process

            component.onSave();
            flush();

            expect(mockService.updateInventoryProductType).toHaveBeenCalled();
            const args = mockService.updateInventoryProductType.calls.mostRecent().args;
            expect(args[0]).toBe('RBC');
            expect(args[1].standardPrice).toBe(300);
            expect(args[1].description).toBe('Updated description');
        }));

    });

    describe('loadDropdowns', () => {
        beforeEach(() => {
            createComponent('add');
        });

        it('should load dropdown options from service', () => {
            expect(component.groupingOptionsSignal()).toEqual([
                { code: 'RB', description: 'Red Blood Cells' },
                { code: 'PL', description: 'Platelets' },
                { code: 'PS', description: 'Plasma' }
            ]);
            expect(component.lifeSpanIndOptions).toEqual(['D', 'H', 'M']);
        });

        it('should initialize grouping options signal as empty array', () => {
            mockService.getAvailableDropdowns.and.returnValue(of({ Item: { productGrouping: [], LifeSpanIndicator: [] } }));
            createComponent('add');
            expect(component.groupingOptionsSignal()).toEqual([]);
        });

        it('should filter grouping options based on search', () => {
            createComponent('add');

            // Initially, all options should be visible
            expect(component.filteredGroupingOptions()).toEqual([
                { code: 'RB', description: 'Red Blood Cells' },
                { code: 'PL', description: 'Platelets' },
                { code: 'PS', description: 'Plasma' }
            ]);

            // Search by code
            component.groupingSearch.set('rb');
            expect(component.filteredGroupingOptions()).toEqual([
                { code: 'RB', description: 'Red Blood Cells' }
            ]);

            // Search by description
            component.groupingSearch.set('plate');
            expect(component.filteredGroupingOptions()).toEqual([
                { code: 'PL', description: 'Platelets' }
            ]);

            // Clear search
            component.groupingSearch.set('');
            expect(component.filteredGroupingOptions()).toEqual([
                { code: 'RB', description: 'Red Blood Cells' },
                { code: 'PL', description: 'Platelets' },
                { code: 'PS', description: 'Plasma' }
            ]);
        });

        it('should return empty array when search has no matches', () => {
            createComponent('add');
            component.groupingSearch.set('xyz');
            expect(component.filteredGroupingOptions()).toEqual([]);
        });

        it('should update filtered options when grouping options signal changes', () => {
            createComponent('add');

            // Set new options
            const newOptions = [
                { code: 'XX', description: 'Test Option 1' },
                { code: 'YY', description: 'Test Option 2' }
            ];
            component.groupingOptionsSignal.set(newOptions);

            expect(component.filteredGroupingOptions()).toEqual(newOptions);
        });

    });

    describe('formatDate', () => {
        beforeEach(() => {
            createComponent('add');
        });

        it('should format date as YYYY-MM-DD', () => {
            const date = moment().add(1, 'month').date(20);
            const formatted = (component as any).formatDate(date);
            const expected = date.format('YYYY-MM-DD');
            expect(formatted).toBe(expected);
        });

        it('should pad single digit months', () => {
            const date = moment().month(0).date(5); // January 5th
            const formatted = (component as any).formatDate(date);
            const expected = date.format('YYYY-MM-DD');
            expect(formatted).toBe(expected);
        });

        it('should pad single digit days', () => {
            const date = moment().date(1); // 1st of current month
            const formatted = (component as any).formatDate(date);
            const expected = date.format('YYYY-MM-DD');
            expect(formatted).toBe(expected);
        });

        it('should handle dates at year boundaries', () => {
            const date = moment().month(11).date(31); // December 31st
            const formatted = (component as any).formatDate(date);
            const expected = date.format('YYYY-MM-DD');
            expect(formatted).toBe(expected);
        });
    });

    describe('Integration Tests', () => {
        it('should complete full add workflow', fakeAsync(() => {
            const mockResponse = { Success: true };
            mockService.createInventoryProductType.and.returnValue(of(mockResponse));

            createComponent('add');
            flush(); // Allow async operations to complete

            const tomorrow = moment().add(1, 'day');
            const expectedDate = tomorrow.format('YYYY-MM-DD');

            // Set all required fields to ensure form validity
            component.form.patchValue({
                productType: 'NEW',
                shortName: 'NewType',
                description: 'New product type',
                price: 100,
                lifeSpan: 30,
                lifeSpanInd: 'D',
                sortSequence: 5,
                productGrouping: 'RB',
                aboOnly: 'Yes',
                rhRequired: 'No',
                importAllowed: 'Yes',
                pooledProduct: false,
                specialInventory: true,
                effectiveDate: tomorrow,
                terminationDate: null
            });
            component.form.updateValueAndValidity();
            fixture.detectChanges();
            tick(); // Allow validators to process

            expect(component.form.valid).toBe(true);
            component.onSave();
            flush();

            expect(mockService.createInventoryProductType).toHaveBeenCalled();
            const payload = mockService.createInventoryProductType.calls.mostRecent().args[0];

            expect(payload.productType).toBe('NEW');
            expect(payload.productGrouping).toBe('RB');
            expect(payload.standardPrice).toBe(100);
            expect(payload.lifeSpan).toBe(30);
            expect(payload.lifeSpanIndicator).toBe('D');
            expect(payload.aboOnly).toBe(true);
            expect(payload.specialProductType).toBe(true);
            expect(payload.effectiveDate).toBe(expectedDate);
        }));

        it('should complete full edit workflow', fakeAsync(() => {
            const mockResponse = { Success: true };
            mockService.updateInventoryProductType.and.returnValue(of(mockResponse));

            createComponent('edit', mockRecordData);
            flush(); // Allow async operations to complete

            component.form.patchValue({
                price: 300,
                sortSequence: 10
            });
            component.form.updateValueAndValidity();
            fixture.detectChanges();
            tick(); // Allow validators to process

            expect(component.form.valid).toBe(true);
            component.onSave();
            flush();

            expect(mockService.updateInventoryProductType).toHaveBeenCalled();
            const args = mockService.updateInventoryProductType.calls.mostRecent().args;
            expect(args[0]).toBe('RBC');
            expect(args[1].standardPrice).toBe(300);
            expect(args[1].sortSequence).toBe(10);
        }));

        it('should handle cancel during add workflow', () => {
            createComponent('add');
            spyOn(component.closePanel, 'emit');

            component.form.patchValue({
                productType: 'TEST',
                shortName: 'Test'
            });
            component.form.updateValueAndValidity();

            component.onCancel();

            expect(component.closePanel.emit).toHaveBeenCalled();
            expect(mockService.createInventoryProductType).not.toHaveBeenCalled();
        });
    });

    describe('Error Getter Methods', () => {
        beforeEach(() => {
            createComponent('add');
        });

        describe('getLifeSpanError', () => {
            it('should return error message when field is touched and has interdependent error', () => {
                component.form.patchValue({
                    lifeSpan: null,
                    lifeSpanInd: 'D'
                });
                component.form.updateValueAndValidity();
                fixture.detectChanges();

                const error = component.getLifeSpanError();
                expect(error).toBe('Life span is required');
            });

            it('should return validation error when field is touched and has pattern error', () => {
                const control = component.form.get('lifeSpan');
                control?.setValue('abc');
                control?.markAsTouched();
                fixture.detectChanges();

                const error = component.getLifeSpanError();
                expect(error).toBe('Life Span must be a whole number');
            });

        });

        describe('getLifeSpanIndError', () => {
            it('should return error message when field is touched and has interdependent error', () => {
                component.form.patchValue({
                    lifeSpan: 42,
                    lifeSpanInd: ''
                });
                component.form.updateValueAndValidity();
                fixture.detectChanges();

                const error = component.getLifeSpanIndError();
                expect(error).toBe('Lifespan Unit is required');
            });

        });
    });

    describe('Edge Cases', () => {

        it('should handle missing record in edit mode', () => {
            createComponent('edit', null);
            expect(component.form.get('productType')?.value).toBe('');
        });

        it('should handle empty string values in numeric fields', fakeAsync(() => {
            const mockResponse = { Success: true };
            mockService.createInventoryProductType.and.returnValue(of(mockResponse));

            createComponent('add');
            flush(); // Allow async operations to complete

            const tomorrow = moment().add(1, 'day');

            // Set all required fields to ensure form validity
            component.form.patchValue({
                productType: 'TEST',
                shortName: 'Test',
                description: 'Test',
                price: '',
                lifeSpan: '',
                sortSequence: '',
                productGrouping: 'RB',
                effectiveDate: tomorrow
            });
            component.form.updateValueAndValidity();
            fixture.detectChanges();
            tick(); // Allow validators to process

            component.onSave();
            flush();

            expect(mockService.createInventoryProductType).toHaveBeenCalled();
            const payload = mockService.createInventoryProductType.calls.mostRecent().args[0];
            expect(payload.standardPrice).toBeUndefined();
            expect(payload.lifeSpan).toBeUndefined();
            expect(payload.sortSequence).toBeUndefined();
        }));

    });
});
