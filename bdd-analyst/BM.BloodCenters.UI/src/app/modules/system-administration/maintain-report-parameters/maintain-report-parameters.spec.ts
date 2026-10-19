import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MaintainReportParameters } from './maintain-report-parameters';
import { ReportParameterService } from '../maintain-report-parameters/services/maintain-report-parameters';
import { ReportParameter } from './models/report-parameter.model';
import { CODE_TYPE_OPTIONS } from './models/code-type.model';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('MaintainReportParameters', () => {
  let component: MaintainReportParameters;
  let fixture: ComponentFixture<MaintainReportParameters>;
  let serviceSpy: jasmine.SpyObj<ReportParameterService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockParameters: ReportParameter[] = [
    {
      parameterCode: 'AGE',
      description: 'Age',
      prompt: 'Age',
      parameterType: 'NUMBER',
      isList: false,
      isUpper: false
    } as ReportParameter
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ReportParameterService', [
      'getReportParameters',
      'getParameterTypes',
      'getCodeTypes',
      'search',
      'create',
      'update'
    ]);

    snackBarSpy = createMockMatSnackBar();
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/',
      events: of(new NavigationEnd(0, '/', '/'))
    });
    routerSpy.createUrlTree.and.returnValue({} as any);
    routerSpy.serializeUrl.and.returnValue('');

    serviceSpy.getReportParameters.and.returnValue(of(mockParameters));
    serviceSpy.getParameterTypes.and.returnValue(
      of({
        parameterTypes: ['CHAR', 'NUMBER'],
        isUpperValues: [true, false],
        isListValues: [true, false]
      })
    );
    serviceSpy.getCodeTypes.and.returnValue(of(CODE_TYPE_OPTIONS));



      TestBed.configureTestingModule({
      imports: [MaintainReportParameters],
      providers: [
        provideHttpClient(),
        { provide: ReportParameterService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } }
      ]
    });


    


      serviceSpy.getReportParameters.calls.reset();


      serviceSpy.getParameterTypes.calls.reset();


      serviceSpy.getCodeTypes.calls.reset();


      serviceSpy.search.calls.reset();


      serviceSpy.create.calls.reset();


      serviceSpy.update.calls.reset();


      routerSpy.navigate.calls.reset();


      routerSpy.createUrlTree.calls.reset();


      routerSpy.serializeUrl.calls.reset();


      routerSpy.createUrlTree.and.returnValue({} as any);


      routerSpy.serializeUrl.and.returnValue('');


      serviceSpy.getReportParameters.and.returnValue(of(mockParameters));


      serviceSpy.getCodeTypes.and.returnValue(of(CODE_TYPE_OPTIONS));


    fixture = TestBed.createComponent(MaintainReportParameters);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  /* =========================
     BASIC
  ========================= */


  /* =========================
     INIT
  ========================= */

  it('should load parameters and filter metadata on init', () => {
    expect(serviceSpy.getReportParameters).toHaveBeenCalled();
    expect(serviceSpy.getParameterTypes).toHaveBeenCalled();
    expect(serviceSpy.getCodeTypes).toHaveBeenCalled();
    expect(component.parameters.length).toBe(1);
  });

  it('should populate codeTypes from backend on init', () => {
    expect(component.codeTypes).toEqual(CODE_TYPE_OPTIONS);
    expect(component.codeTypes.length).toBe(5);
  });

  /* =========================
     NAVIGATION
  ========================= */



  /* =========================
     FILTER
  ========================= */

  it('should apply filter and close filter panel', () => {
    serviceSpy.search.and.returnValue(of([]));

    component.filterForm.patchValue({
      keyword: 'AGE',
      parameterType: 'NUMBER'
    });

    component.showFilter = true;
    component.onApplyFilter();

    expect(serviceSpy.search).toHaveBeenCalled();
    expect(component.showFilter).toBeFalse();
  });

  it('should clear filters and reload list', () => {
    component.showFilter = true;
    component.onClearFilter();

    expect(serviceSpy.getReportParameters).toHaveBeenCalled();
    expect(component.showFilter).toBeFalse();
  });

  /* =========================
     ADD / EDIT
  ========================= */

  it('should switch to ADD mode', () => {
    component.onAddNew();
    expect(component.mode).toBe('ADD');
    expect(component.selectedParameter).toBeNull();
    expect(component.form.get('parameterCode')?.enabled).toBeTrue();
  });

  it('should switch to EDIT mode on select', () => {
    component.onSelectParameter(mockParameters[0]);

    expect(component.mode).toBe('EDIT');
    expect(component.selectedParameter).toEqual(mockParameters[0]);
    expect(component.form.get('parameterCode')?.disabled).toBeTrue();
  });

  /* =========================
     SAVE
  ========================= */



  it('should create parameter in ADD mode', () => {
    serviceSpy.create.and.returnValue(of(mockParameters[0]));

    component.onAddNew();
    component.form.patchValue({
      parameterCode: 'AGE',
      description: 'Age',
      prompt: 'Age',
      parameterType: 'NUMBER',
      isList: false,
      isUpper: false
    });

    component.onSave();

    expect(serviceSpy.create).toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  it('should update parameter in EDIT mode', () => {
    serviceSpy.update.and.returnValue(of(mockParameters[0]));

    component.onSelectParameter(mockParameters[0]);
    component.form.patchValue({
      description: 'Updated'
    });

    component.onSave();

    expect(serviceSpy.update).toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  it('should reset the form and enable parameterCode in ADD mode on clear', () => {
    // Arrange
    component.mode = 'ADD';

    component.form.patchValue({
      parameterCode: 'AGE',
      isUpper: true,
      isList: true
    });

    component.form.get('parameterCode')?.disable();

    // Act
    component.onClear();

    // Assert
    expect(component.form.get('isUpper')?.value).toBeFalse();
    expect(component.form.get('isList')?.value).toBeFalse();
    expect(component.form.get('parameterCode')?.enabled).toBeTrue();
  });

  it('should reset the form and keep parameterCode disabled in EDIT mode', () => {
    // Arrange
    component.mode = 'EDIT';

    component.form.patchValue({
      parameterCode: 'AGE',
      isUpper: true,
      isList: true
    });

    component.form.get('parameterCode')?.disable();

    // Act
    component.onClear();

    // Assert
    expect(component.form.get('isUpper')?.value).toBeFalse();
    expect(component.form.get('isList')?.value).toBeFalse();
    expect(component.form.get('parameterCode')?.disabled).toBeTrue();
  });

  it('should preserve parameterCode value on clear in EDIT mode', () => {
    component.onSelectParameter(mockParameters[0]);
    component.form.patchValue({ description: 'Changed' });

    component.onClear();

    expect(component.form.getRawValue().parameterCode).toBe('AGE');
    expect(component.form.get('description')?.value).toBeNull();
  });

  /* =========================
     SANITIZE INPUT
  ========================= */

  it('should strip leading spaces from input', () => {
    component.onAddNew();
    component.form.get('description')?.setValue('  Hello');

    component.sanitizeInput('description');

    expect(component.form.get('description')?.value).toBe('Hello');
  });

  it('should allow single trailing space while typing', () => {
    component.onAddNew();
    component.form.get('description')?.setValue('Hello ');

    component.sanitizeInput('description');

    expect(component.form.get('description')?.value).toBe('Hello ');
  });

  it('should collapse multiple spaces between words to single space', () => {
    component.onAddNew();
    component.form.get('description')?.setValue('Hello  World');

    component.sanitizeInput('description');

    expect(component.form.get('description')?.value).toBe('Hello World');
  });

  it('should trim trailing spaces on blur', () => {
    component.onAddNew();
    component.form.get('description')?.setValue('Hello ');

    component.trimInput('description');

    expect(component.form.get('description')?.value).toBe('Hello');
  });

  it('should not modify input without leading spaces', () => {
    component.onAddNew();
    component.form.get('description')?.setValue('Hello World');

    component.sanitizeInput('description');

    expect(component.form.get('description')?.value).toBe('Hello World');
  });

  it('should handle non-existent control gracefully', () => {
    expect(() => component.sanitizeInput('nonExistent')).not.toThrow();
  });

  /* =========================
     SUCCESS MESSAGE FORMAT
  ========================= */


});
