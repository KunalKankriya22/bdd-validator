import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { of, throwError } from 'rxjs';

import { AddEditRuleComponent } from './add-edit-rule';
import { AntigenConfigRulesService } from '../services/antigen-config-rules.service';
import { AntigenConfigRule } from '../models/antigen-config-rules.model';
import { DD_MON_YYYY_FORMATS, UppercaseMomentDateAdapter } from '@shared/date/date-formats';

const MOCK_RULE: AntigenConfigRule = {
  primaryRuleId: 4006,
  antigenCode: 'Fya',
  antigenGroup: 'Duffy',
  labelingAntigenCode: 'Fya',
  noOfUnits: 2,
  effDate: '2023-10-30T00:00:00',
  termDate: null,
  details: [
    { ruleId: 4006.1, testType: 'SER', testId: 'Fya', licApproveFlag: 'U', noOfTests: 1, effDate: '2023-10-30T00:00:00', termDate: null },
    { ruleId: 4006.2, testType: 'MOL', testId: 'FY1(Fya)', licApproveFlag: 'U', noOfTests: 1, effDate: '2023-10-30T00:00:00', termDate: null },
  ],
};

describe('AddEditRuleComponent', () => {
  let component: AddEditRuleComponent;
  let fixture: ComponentFixture<AddEditRuleComponent>;
  let mockService: jasmine.SpyObj<AntigenConfigRulesService>;

  beforeEach(() => {

    mockService = jasmine.createSpyObj('AntigenConfigRulesService', ['create', 'update']);
    mockService.create.and.returnValue(of({ success: true, message: 'Created', error: null, errorCode: null, statusCode: 200, data: null, item: null, total: null }));
    mockService.update.and.returnValue(of({ success: true, message: 'Updated', error: null, errorCode: null, statusCode: 200, data: null, item: null, total: null }));



      TestBed.configureTestingModule({
      imports: [AddEditRuleComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: AntigenConfigRulesService, useValue: mockService },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: DateAdapter, useClass: UppercaseMomentDateAdapter, deps: [MAT_DATE_LOCALE] },
      ],
    });


    


      mockService.create.calls.reset();


      mockService.update.calls.reset();


      mockService.create.and.returnValue(of({ success: true, message: 'Created', error: null, errorCode: null, statusCode: 200, data: null, item: null, total: null }));


      mockService.update.and.returnValue(of({ success: true, message: 'Updated', error: null, errorCode: null, statusCode: 200, data: null, item: null, total: null }));


    fixture = TestBed.createComponent(AddEditRuleComponent);
    component = fixture.componentInstance;
    component.serTestIds = ['Fya', 'Fyb'];
    component.molTestIds = ['FY1(Fya)', 'FY2(Fyb)'];
    component.labelingAntigens = ['Fya'];
    component.antigenGroups = ['Duffy'];
    component.antigenGroup = 'Duffy';
    component.antigenCode = 'Fya';
    fixture.detectChanges();


    });


  // ── Mode & title ──────────────────────────────────────────────────────────

  it('should default to add mode', () => {
    expect(component.mode).toBe('add');
    expect(component.isAdd).toBeTrue();
    expect(component.isEdit).toBeFalse();
  });

  it('should return correct panel title for add mode', () => {
    expect(component.panelTitle).toBe('Add New Primary Rule and Details');
  });

  it('should return correct panel title for edit mode', () => {
    component.mode = 'edit';
    expect(component.panelTitle).toBe('Edit Primary Rule and Details');
  });

  // ── Form init (add mode) ──────────────────────────────────────────────────



  it('should initialise noOfUnits to 2 in add mode', () => {
    expect(component.form.get('noOfUnits')?.value).toBe(2);
  });

  it('should mark primaryRuleId required in add mode', () => {
    const ctrl = component.form.get('primaryRuleId');
    ctrl?.setValue(null);
    ctrl?.markAsTouched();
    expect(ctrl?.hasError('required')).toBeTrue();
  });

  it('should mark effDate required in add mode', () => {
    const ctrl = component.form.get('effDate');
    ctrl?.setValue(null);
    ctrl?.markAsTouched();
    expect(ctrl?.hasError('required')).toBeTrue();
  });





  it('should clamp noOfUnits to max 3', () => {
    component.form.get('noOfUnits')?.setValue(5);
    expect(component.details.length).toBe(3);
  });

  it('should clamp noOfUnits to min 1', () => {
    component.form.get('noOfUnits')?.setValue(0);
    expect(component.details.length).toBe(1);
  });

  // ── Form init (edit mode) ─────────────────────────────────────────────────

  it('should populate form with existing rule data in edit mode', () => {
    component.mode = 'edit';
    component.data = MOCK_RULE;
    component.ngOnChanges({
      mode: { currentValue: 'edit', previousValue: 'add', firstChange: false, isFirstChange: () => false },
      data: { currentValue: MOCK_RULE, previousValue: null, firstChange: false, isFirstChange: () => false },
    });

    expect(component.details.length).toBe(2);
    const raw = component.form.getRawValue();
    expect(raw.primaryRuleId).toBe(4006);
    expect(raw.noOfUnits).toBe(2);
  });

  // ── Test ID / lic options ─────────────────────────────────────────────────

  it('should return serTestIds when testType is SER', () => {
    component.details.at(0).patchValue({ testType: 'SER' });
    expect(component.getTestIdOptions(0)).toEqual(['Fya', 'Fyb']);
  });

  it('should return molTestIds when testType is MOL', () => {
    component.details.at(0).patchValue({ testType: 'MOL' });
    expect(component.getTestIdOptions(0)).toEqual(['FY1(Fya)', 'FY2(Fyb)']);
  });

  it('should return serLicOptions when testType is SER', () => {
    component.details.at(0).patchValue({ testType: 'SER' });
    const opts = component.getLicOptions(0);
    expect(opts.map(o => o.value)).toContain('L');
    expect(opts.map(o => o.value)).toContain('U');
  });

  it('should return molLicOptions when testType is MOL', () => {
    component.details.at(0).patchValue({ testType: 'MOL' });
    const opts = component.getLicOptions(0);
    expect(opts.map(o => o.value)).toContain('A');
  });

  it('should reset testId and licApproveFlag on test type change', () => {
    component.details.at(0).patchValue({ testType: 'SER', testId: 'Fya', licApproveFlag: 'L' });
    component.onTestTypeChange(0);
    expect(component.details.at(0).get('testId')?.value).toBeNull();
    expect(component.details.at(0).get('licApproveFlag')?.value).toBeNull();
  });

  // ── Cancel ────────────────────────────────────────────────────────────────



  // ── Save (add mode) ───────────────────────────────────────────────────────



  it('should call create service and emit saveSuccess and closePanel on valid add save', () => {
    spyOn(component.saveSuccess, 'emit');
    spyOn(component.closePanel, 'emit');

    component.form.patchValue({ primaryRuleId: 9001, noOfUnits: 1, effDate: new Date(new Date().getFullYear() + 2, 0, 1), labelingAntigenCode: 'Fya' });
    component.details.at(0).patchValue({ ruleId: '9001.1', testType: 'SER', testId: 'Fya', licApproveFlag: 'U', noOfTests: 1 });

    component.onSave();

    expect(mockService.create).toHaveBeenCalled();
    expect(component.saveSuccess.emit).toHaveBeenCalled();
    expect(component.closePanel.emit).toHaveBeenCalled();
    expect(component.isSaving).toBeFalse();
  });

  it('should call create and NOT close panel on saveAndAddAnother', () => {
    spyOn(component.saveSuccess, 'emit');
    spyOn(component.closePanel, 'emit');

    component.form.patchValue({ primaryRuleId: 9002, noOfUnits: 1, effDate: new Date(new Date().getFullYear() + 2, 0, 1), labelingAntigenCode: 'Fya' });
    component.details.at(0).patchValue({ ruleId: '9002.1', testType: 'SER', testId: 'Fya', licApproveFlag: 'U', noOfTests: 1 });

    component.onSaveAndAddAnother();

    expect(mockService.create).toHaveBeenCalled();
    expect(component.saveSuccess.emit).toHaveBeenCalled();
    expect(component.closePanel.emit).not.toHaveBeenCalled();
  });

  it('should set errorMessage and reset isSaving on create failure', () => {
    mockService.create.and.returnValue(throwError(() => ({ error: { message: 'Duplicate ID' } })));

    component.form.patchValue({ primaryRuleId: 9003, noOfUnits: 1, effDate: new Date(new Date().getFullYear() + 2, 0, 1), labelingAntigenCode: 'Fya' });
    component.details.at(0).patchValue({ ruleId: '9003.1', testType: 'SER', testId: 'Fya', licApproveFlag: 'U', noOfTests: 1 });

    component.onSave();

    expect(component.isSaving).toBeFalse();
    expect(component.errorMessage).toBe('Duplicate ID');
  });

  // ── Save (edit mode) ──────────────────────────────────────────────────────

  it('should call update service and emit saveSuccess and closePanel on valid edit save', () => {
    component.mode = 'edit';
    component.data = MOCK_RULE;
    component.ngOnChanges({
      mode: { currentValue: 'edit', previousValue: 'add', firstChange: false, isFirstChange: () => false },
      data: { currentValue: MOCK_RULE, previousValue: null, firstChange: false, isFirstChange: () => false },
    });
    fixture.detectChanges();

    spyOn(component.saveSuccess, 'emit');
    spyOn(component.closePanel, 'emit');

    component.onSave();

    expect(mockService.update).toHaveBeenCalledWith(4006, jasmine.any(Object));
    expect(component.saveSuccess.emit).toHaveBeenCalled();
    expect(component.closePanel.emit).toHaveBeenCalled();
    expect(component.isSaving).toBeFalse();
  });

  it('should set errorMessage and reset isSaving on update failure', () => {
    component.mode = 'edit';
    component.data = MOCK_RULE;
    component.ngOnChanges({
      mode: { currentValue: 'edit', previousValue: 'add', firstChange: false, isFirstChange: () => false },
      data: { currentValue: MOCK_RULE, previousValue: null, firstChange: false, isFirstChange: () => false },
    });
    mockService.update.and.returnValue(throwError(() => ({ error: { message: 'Update failed' } })));

    component.onSave();

    expect(component.isSaving).toBeFalse();
    expect(component.errorMessage).toBe('Update failed');
  });

  // ── Date formatter ────────────────────────────────────────────────────────

  it('should format date to DD-MON-YYYY', () => {
    expect(component.formatDisplayDate('2023-10-30T00:00:00')).toBe('30-OCT-2023');
  });





  // ── Label helpers ─────────────────────────────────────────────────────────

  it('should return correct test type label', () => {
    expect(component.getTestTypeLabel('SER')).toBe('Serological');
    expect(component.getTestTypeLabel('MOL')).toBe('Molecular');
    expect(component.getTestTypeLabel('XYZ')).toBe('XYZ');
  });

  it('should return correct lic label', () => {
    expect(component.getLicLabel('L')).toBe('Licensed');
    expect(component.getLicLabel('U')).toBe('Unlicensed');
    expect(component.getLicLabel('A')).toBe('Approved');
    expect(component.getLicLabel('Z')).toBe('Z');
  });

  // ── FormArray accessor ────────────────────────────────────────────────────

  it('should expose details FormArray', () => {
    expect(component.details).toBeTruthy();
    expect(component.details.length).toBeGreaterThan(0);
  });
});
