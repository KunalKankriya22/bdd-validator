import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';

import { SendLetterDialog } from './send-letter-dialog';
import { SendLetterApiService } from './send-letter-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('SendLetterDialog', () => {
  let component: SendLetterDialog;
  let fixture: ComponentFixture<SendLetterDialog>;
  let apiServiceSpy: jasmine.SpyObj<SendLetterApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('SendLetterApiService', [
      'getCommunicationTypes',
      'getCommunicationCodes',
      'getLettersList',
      'getLetterDetail',
      'generateLetter',
      'saveLetter',
    ]);
    apiServiceSpy.getCommunicationTypes.and.returnValue(of([
      { code: 'EM', description: 'Email' },
      { code: 'ML', description: 'Mail' },
    ]));
    apiServiceSpy.getCommunicationCodes.and.returnValue(of([
      { code: 'C01', description: 'Code 01' },
    ]));
    apiServiceSpy.getLettersList.and.returnValue(of([
      { letterCode: 'L01', letterTitle: 'Test Letter' },
    ]));
    apiServiceSpy.getLetterDetail.and.returnValue(of({
      letterCode: 'L01',
      letterContent: 'Dear {DONOR_NAME}, ...',
    }));
    apiServiceSpy.generateLetter.and.returnValue(of({
      mergedText: 'Dear John Doe, ...',
      donorId: 'D001',
    }));
    apiServiceSpy.saveLetter.and.returnValue(of({ letterSeqNo: '12345' }));

    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService();

    await TestBed.configureTestingModule({
      imports: [SendLetterDialog, NoopAnimationsModule],
      providers: [
        { provide: SendLetterApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SendLetterDialog);
    component = fixture.componentInstance;
    component.data = { donorIds: ['D001'] } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load comm types and letters list on init', () => {
    expect(apiServiceSpy.getCommunicationTypes).toHaveBeenCalled();
    expect(apiServiceSpy.getLettersList).toHaveBeenCalled();
    expect(component.commTypes.length).toBe(2);
    expect(component.lettersList.length).toBe(1);
  });

  it('should initialize form with required fields', () => {
    expect(component.form.get('commType')).toBeTruthy();
    expect(component.form.get('commCode')).toBeTruthy();
    expect(component.form.get('letterCode')).toBeTruthy();
  });

  it('should start in INITIAL dialog state', () => {
    expect(component.dialogState).toBe('INITIAL');
  });

  it('should enable commCode when commType is selected', fakeAsync(() => {
    component.form.get('commType')?.setValue('EM');
    tick();
    expect(component.form.get('commCode')?.enabled).toBeTrue();
    expect(apiServiceSpy.getCommunicationCodes).toHaveBeenCalledWith('EM');
  }));

  it('should retrieve letter template on onRetrieve', fakeAsync(() => {
    component.form.get('letterCode')?.setValue('L01');
    component.onRetrieve();
    tick();
    expect(apiServiceSpy.getLetterDetail).toHaveBeenCalledWith('L01');
    expect(component.dialogState).toBe('RETRIEVED');
    expect(component.templateText).toContain('Dear');
  }));

  it('should generate merged letter on onGenerate', fakeAsync(() => {
    component.letterDetail = { letterCode: 'L01', letterContent: 'Dear {DONOR_NAME}, ...' } as any;
    component.dialogState = 'RETRIEVED';
    component.onGenerate();
    tick();
    expect(apiServiceSpy.generateLetter).toHaveBeenCalled();
    expect(component.dialogState).toBe('GENERATED');
    expect(component.mergedText).toContain('John Doe');
  }));

  it('should emit closePanel with letterSent false on cancel', () => {
    spyOn(component.closePanel, 'emit');
    component.onCancel();
    expect(component.closePanel.emit).toHaveBeenCalledWith({ letterSent: false });
  });

  it('should return correct isRetrieveEnabled status', () => {
    expect(component.isRetrieveEnabled).toBeFalse();

    component.form.get('commType')?.setValue('EM');
    component.form.get('commCode')?.enable();
    component.form.get('commCode')?.setValue('C01');
    component.form.get('letterCode')?.setValue('L01');
    component.dialogState = 'INITIAL';
    expect(component.isRetrieveEnabled).toBeTrue();
  });

  it('should set mergedTextTouched on onSaveAttempt when text is empty', () => {
    component.dialogState = 'GENERATED';
    component.mergedText = '';
    component.onSaveAttempt();
    expect(component.mergedTextTouched).toBeTrue();
  });
});
