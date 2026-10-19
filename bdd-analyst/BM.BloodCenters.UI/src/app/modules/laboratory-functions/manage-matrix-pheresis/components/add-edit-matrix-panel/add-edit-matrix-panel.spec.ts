/**
 * Unit tests for AddEditMatrixPanelComponent
 * JIRA: MLT-12847
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEditMatrixPanelComponent } from './add-edit-matrix-panel';
import { MatrixPheresisService } from '../../services/matrix-pheresis.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HeaderService } from '@shared/services/header.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { SimpleChange } from '@angular/core';
import moment from 'moment';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditMatrixPanelComponent', () => {
  let component: AddEditMatrixPanelComponent;
  let fixture: ComponentFixture<AddEditMatrixPanelComponent>;
  let mockService: jasmine.SpyObj<MatrixPheresisService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {

    mockService = jasmine.createSpyObj('MatrixPheresisService', [
      'createMatrix',
      'updateMatrix'
    ]);
    mockSnackBar = createMockMatSnackBar();
    mockHeaderService = createMockHeaderService();
      TestBed.configureTestingModule({
      imports: [AddEditMatrixPanelComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: MatrixPheresisService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    


      mockService.createMatrix.calls.reset();


      mockService.updateMatrix.calls.reset();


    fixture = TestBed.createComponent(AddEditMatrixPanelComponent);
    component = fixture.componentInstance;
    component.procedures = [{ code: 'PH', codeDesc: 'Pheresis' }];
    component.productTypes = [{ productCode: 'PLT', productDesc: 'Platelets' }];


    });




  it('should initialize form in edit mode with disabled fields', () => {
    component.mode = 'edit';
    component.data = {
      proc: 'PH',
      procDesc: 'Pheresis',
      productType: 'PLT',
      productDesc: 'Platelets',
      numberProducts: '2',
      effDate: '2025-01-01',
      termDate: undefined
    };
    component.ngOnInit();

    expect(component.form.get('proc')?.disabled).toBe(true);
    expect(component.form.get('productType')?.disabled).toBe(true);
    expect(component.form.get('effDate')?.disabled).toBe(true);
  });



  it('should validate number of products pattern and range', () => {
    component.mode = 'add';
    component.ngOnInit();

    const numberProductsControl = component.form.get('numberProducts');

    // Valid values 0-4
    numberProductsControl?.setValue('0');
    expect(numberProductsControl?.hasError('invalidRange')).toBe(false);
    expect(numberProductsControl?.hasError('pattern')).toBe(false);

    numberProductsControl?.setValue('4');
    expect(numberProductsControl?.hasError('invalidRange')).toBe(false);
    expect(numberProductsControl?.hasError('pattern')).toBe(false);

    // Invalid range (5-9)
    numberProductsControl?.setValue('5');
    expect(numberProductsControl?.hasError('invalidRange')).toBe(true);
    expect(numberProductsControl?.hasError('pattern')).toBe(false);

    numberProductsControl?.setValue('9');
    expect(numberProductsControl?.hasError('invalidRange')).toBe(true);

    // Invalid pattern (non-numeric)
    numberProductsControl?.setValue('A');
    expect(numberProductsControl?.hasError('pattern')).toBe(true);

    // Empty is valid
    numberProductsControl?.setValue('');
    expect(numberProductsControl?.hasError('invalidRange')).toBe(false);
    expect(numberProductsControl?.hasError('pattern')).toBe(false);
  });







  it('should refresh form when mode changes from add to edit', () => {
    component.mode = 'add';
    component.ngOnInit();

    const mockData = {
      proc: 'PH',
      procDesc: 'Pheresis',
      productType: 'PLT',
      productDesc: 'Platelets',
      numberProducts: '2',
      effDate: '2025-01-01',
      termDate: undefined
    };

    component.mode = 'edit';
    component.data = mockData;
    component.ngOnChanges({
      mode: new SimpleChange('add', 'edit', false),
      data: new SimpleChange(null, mockData, false)
    });

    expect(component.form.get('proc')?.value).toBe('PH');
    expect(component.form.get('productType')?.value).toBe('PLT');
    expect(component.form.get('proc')?.disabled).toBe(true);
    expect(component.form.get('productType')?.disabled).toBe(true);
  });

  it('should refresh form when mode changes from edit to add', () => {
    const mockData = {
      proc: 'PH',
      procDesc: 'Pheresis',
      productType: 'PLT',
      productDesc: 'Platelets',
      numberProducts: '2',
      effDate: '2025-01-01',
      termDate: undefined
    };

    component.mode = 'edit';
    component.data = mockData;
    component.ngOnInit();

    component.mode = 'add';
    component.data = null;
    component.ngOnChanges({
      mode: new SimpleChange('edit', 'add', false)
    });

    expect(component.form.get('proc')?.value).toBeNull();
    expect(component.form.get('productType')?.value).toBeNull();
    expect(component.form.get('proc')?.disabled).toBe(false);
    expect(component.form.get('productType')?.disabled).toBe(false);
  });


});
