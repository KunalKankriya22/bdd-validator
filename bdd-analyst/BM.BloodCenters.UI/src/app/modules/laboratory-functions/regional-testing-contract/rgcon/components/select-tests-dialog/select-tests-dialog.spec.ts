import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import {
  SelectTestsDialogComponent,
  SelectTestsDialogData,
} from './select-tests-dialog';
import { RegionalTestingContractApiService } from '../../services/regional-testing-contract-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';

describe('SelectTestsDialogComponent', () => {
  let component: SelectTestsDialogComponent;
  let fixture: ComponentFixture<SelectTestsDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<SelectTestsDialogComponent>>;
  let apiServiceSpy: jasmine.SpyObj<RegionalTestingContractApiService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;

  const mockTests = [
    { testId: 'ABO', description: 'ABO Typing', testGroup: 'BLOOD_GROUP' },
    { testId: 'RH', description: 'Rh Typing', testGroup: 'BLOOD_GROUP' },
    { testId: 'HIV', description: 'HIV Test', testGroup: 'VIRAL' },
  ];

  const defaultDialogData: SelectTestsDialogData = {
    contractId: 'C001',
    selectedTests: [{ testId: 'ABO', group: 'BLOOD_GROUP', description: 'ABO Typing' }],
  };

  function createComponent(data: SelectTestsDialogData = defaultDialogData) {
    TestBed.resetTestingModule();
    apiServiceSpy = jasmine.createSpyObj('RegionalTestingContractApiService', ['getTestLookups']);
    apiServiceSpy.getTestLookups.and.returnValue(of(mockTests));

    snackbarSpy = jasmine.createSpyObj('SnackbarService', ['showError']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [SelectTestsDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: RegionalTestingContractApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
      ],
    });

    fixture = TestBed.createComponent(SelectTestsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    createComponent();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load tests on init', () => {
    expect(apiServiceSpy.getTestLookups).toHaveBeenCalledWith('C001');
    expect(component['allTests']().length).toBe(3);
  });

  it('should initialize with pre-selected tests', () => {
    expect(component['selectedTestIds']().has('ABO')).toBeTrue();
  });

  it('should extract unique test groups', () => {
    expect(component['testGroups']().length).toBe(2);
    expect(component['testGroups']()).toContain('BLOOD_GROUP');
    expect(component['testGroups']()).toContain('VIRAL');
  });

  it('should toggle test selection on', () => {
    component.toggleTest('RH');
    expect(component.isSelected('RH')).toBeTrue();
  });

  it('should toggle test selection off', () => {
    component.toggleTest('ABO');
    expect(component.isSelected('ABO')).toBeFalse();
  });

  it('should clear all selections', () => {
    component.onClearAll();
    expect(component['selectedTestIds']().size).toBe(0);
  });

  it('should close dialog with selected tests on save', () => {
    component.onSave();
    expect(dialogRefSpy.close).toHaveBeenCalled();
    const result = dialogRefSpy.close.calls.mostRecent().args[0];
    expect(result.length).toBe(1);
    expect(result[0].testId).toBe('ABO');
  });

  it('should close dialog without result on cancel', () => {
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });

  it('should handle error when loading tests fails', () => {
    TestBed.resetTestingModule();
    apiServiceSpy = jasmine.createSpyObj('RegionalTestingContractApiService', ['getTestLookups']);
    apiServiceSpy.getTestLookups.and.returnValue(throwError(() => new Error('API error')));
    snackbarSpy = jasmine.createSpyObj('SnackbarService', ['showError']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [SelectTestsDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: defaultDialogData },
        { provide: RegionalTestingContractApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
      ],
    });

    fixture = TestBed.createComponent(SelectTestsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load tests');
    expect(component['loading']()).toBeFalse();
  });
});
