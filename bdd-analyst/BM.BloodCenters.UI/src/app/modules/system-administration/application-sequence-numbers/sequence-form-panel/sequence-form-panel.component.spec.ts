import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { SequenceFormPanelComponent } from './sequence-form-panel.component';
import { ChapterLookupService } from '../services/chapter-lookup.service';
import { ApplicationSequenceNumbersApiService } from '../services/application-sequence-numbers-api.service';
import { ApplicationSequenceNumber, ChapterLookup } from '../interfaces/application-sequence-number.interface';

describe('SequenceFormPanelComponent', () => {
  let apiServiceSpy: any;
  let chapterServiceSpy: any;
  let component: SequenceFormPanelComponent;
  let fixture: ComponentFixture<SequenceFormPanelComponent>;
  let chapterService: jasmine.SpyObj<ChapterLookupService>;
  let apiService: jasmine.SpyObj<ApplicationSequenceNumbersApiService>;

  const mockChapters: ChapterLookup[] = [
    { chapterId: 'IBC', chapterName: 'Versiti - IN DTL' },
    { chapterId: 'CH01', chapterName: 'Chapter 01' },
    { chapterId: 'CH02', chapterName: 'Chapter 02' }
  ];

  const mockSequenceData: ApplicationSequenceNumber = {
    chapterId: 'IBC',
    chapterName: 'Versiti - IN DTL',
    numberType: 'GELTUBE_BOX',
    maxNumber: 2000,
    startingNumber: 310,
    resetCycle: 'D',
    lastResetDate: new Date('2026-01-15T10:30:00Z')
  };

  beforeEach(() => {

    chapterServiceSpy = jasmine.createSpyObj('ChapterLookupService', ['getChapters']);
    apiServiceSpy = jasmine.createSpyObj('ApplicationSequenceNumbersApiService', [
      'createSequenceNumber',
      'updateSequenceNumber'
    ]);



      TestBed.configureTestingModule({
      imports: [
        SequenceFormPanelComponent,
        NoopAnimationsModule,
        MatSnackBarModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: ChapterLookupService, useValue: chapterServiceSpy },
        { provide: ApplicationSequenceNumbersApiService, useValue: apiServiceSpy }
      ]
    });


    


      chapterServiceSpy.getChapters.calls.reset();


      apiServiceSpy.createSequenceNumber.calls.reset();


      apiServiceSpy.updateSequenceNumber.calls.reset();


    chapterService = TestBed.inject(ChapterLookupService) as jasmine.SpyObj<ChapterLookupService>;
    apiService = TestBed.inject(ApplicationSequenceNumbersApiService) as jasmine.SpyObj<ApplicationSequenceNumbersApiService>;

    // Default mock response
    chapterService.getChapters.and.returnValue(of(mockChapters));


    });

  describe('Component Initialization', () => {
    it('should create component and load chapters', () => {
      fixture = TestBed.createComponent(SequenceFormPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component).toBeTruthy();
      expect(chapterService.getChapters).toHaveBeenCalled();
      expect(component.chapters().length).toBe(3);
    });

    it('should initialize form in add mode with empty values', () => {
      fixture = TestBed.createComponent(SequenceFormPanelComponent);
      component = fixture.componentInstance;
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.title()).toBe('Add New Sequence');
      expect(component.saveButtonText()).toBe('ADD');
      expect(component.form.get('chapterId')?.value).toBe('');
      expect(component.form.get('numberType')?.value).toBe('');
    });
  });

  describe('Edit Mode', () => {
    it('should populate form with existing data in edit mode', () => {
      fixture = TestBed.createComponent(SequenceFormPanelComponent);
      component = fixture.componentInstance;
      component.mode = 'edit';
      component.data = mockSequenceData;
      fixture.detectChanges();

      expect(component.title()).toBe('Edit Sequence');
      expect(component.saveButtonText()).toBe('SAVE');
      expect(component.form.get('chapterId')?.value).toBe('IBC');
      expect(component.form.get('numberType')?.value).toBe('GELTUBE_BOX');
      expect(component.form.get('maxNumber')?.value).toBe(2000);
      expect(component.selectedChapterName()).toBe('Versiti - IN DTL');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(SequenceFormPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should mark form as invalid when required fields are empty', () => {
      expect(component.form.valid).toBeFalse();
      expect(component.form.get('chapterId')?.hasError('required')).toBeTrue();
      expect(component.form.get('numberType')?.hasError('required')).toBeTrue();
      expect(component.form.get('maxNumber')?.hasError('required')).toBeTrue();
    });

    it('should have valid form structure with all controls', () => {
      expect(component.form.contains('chapterId')).toBeTrue();
      expect(component.form.contains('numberType')).toBeTrue();
      expect(component.form.contains('maxNumber')).toBeTrue();
      expect(component.form.contains('startingNumber')).toBeTrue();
      expect(component.form.contains('lastResetDate')).toBeTrue();
    });
  });

  describe('MaxNumber Int32 Validation', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(SequenceFormPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should accept Int32.MaxValue (2147483647) for maxNumber', () => {
      const control = component.form.get('maxNumber');
      control?.setValue(2147483647);
      control?.markAsTouched();
      fixture.detectChanges();

      expect(control?.hasError('max')).toBeFalse();
      expect(control?.valid).toBeTrue();
    });

    it('should reject values greater than Int32.MaxValue for maxNumber', () => {
      const control = component.form.get('maxNumber');
      control?.setValue(2147483648);
      control?.markAsTouched();
      fixture.detectChanges();

      expect(control?.hasError('max')).toBeTrue();
      expect(control?.valid).toBeFalse();
      expect(component.getMaxNumberError()).toContain('2,147,483,647');
    });

    it('should reject 9999999999 for maxNumber', () => {
      const control = component.form.get('maxNumber');
      control?.setValue(9999999999);
      control?.markAsTouched();
      fixture.detectChanges();

      expect(control?.hasError('max')).toBeTrue();
      expect(control?.valid).toBeFalse();
    });

    it('should enforce min value (0) for maxNumber', () => {
      const control = component.form.get('maxNumber');
      control?.setValue(-1);
      control?.markAsTouched();
      fixture.detectChanges();

      expect(control?.hasError('min')).toBeTrue();
      expect(control?.valid).toBeFalse();
    });

    it('should accept valid values within range for maxNumber', () => {
      const control = component.form.get('maxNumber');
      control?.setValue(1000000);
      control?.markAsTouched();
      fixture.detectChanges();

      expect(control?.hasError('max')).toBeFalse();
      expect(control?.hasError('min')).toBeFalse();
      expect(control?.valid).toBeTrue();
    });
  });





  describe('Number Type Special Character Prevention', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(SequenceFormPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should block special characters via preventSpecialChars', () => {
      const specialChars = ['$', '&', '@', '#', '*', '!', '%', '^', '(', ')'];
      specialChars.forEach(char => {
        const event = new KeyboardEvent('keydown', { key: char, cancelable: true });
        component.preventSpecialChars(event);
        expect(event.defaultPrevented).toBeTrue();
      });
    });

    it('should allow alphanumeric and underscore via preventSpecialChars', () => {
      const validChars = ['A', 'z', '0', '9', '_'];
      validChars.forEach(char => {
        const event = new KeyboardEvent('keydown', { key: char, cancelable: true });
        component.preventSpecialChars(event);
        expect(event.defaultPrevented).toBeFalse();
      });
    });

    it('should allow navigation keys via preventSpecialChars', () => {
      const navKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'];
      navKeys.forEach(key => {
        const event = new KeyboardEvent('keydown', { key, cancelable: true });
        component.preventSpecialChars(event);
        expect(event.defaultPrevented).toBeFalse();
      });
    });

    it('should strip special characters from input via onNumberTypeInput', () => {
      const input = document.createElement('input');
      input.value = 'ABC$&@#*123';
      const event = { target: input } as unknown as Event;
      component.onNumberTypeInput(event);
      expect(component.form.get('numberType')?.value).toBe('ABC123');
    });
  });

  describe('Error Handling', () => {
    it('should handle chapter loading error gracefully', () => {
      // Reset and reconfigure TestBed with error service
      TestBed.resetTestingModule();
      
      const errorChapterService = jasmine.createSpyObj('ChapterLookupService', ['getChapters']);
      errorChapterService.getChapters.and.returnValue(of([])); // Service returns empty array on error
      
      TestBed.configureTestingModule({
        imports: [
          SequenceFormPanelComponent,
          NoopAnimationsModule,
          MatSnackBarModule,
          TranslateModule.forRoot()
        ],
        providers: [
          { provide: ChapterLookupService, useValue: errorChapterService },
          { provide: ApplicationSequenceNumbersApiService, useValue: apiService }
        ]
      });
      
      fixture = TestBed.createComponent(SequenceFormPanelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.chapters().length).toBe(0);
    });

    it('should handle create error and reset submitting state', fakeAsync(() => {
      fixture = TestBed.createComponent(SequenceFormPanelComponent);
      component = fixture.componentInstance;
      component.mode = 'add';
      fixture.detectChanges();

      const error = { error: { message: 'Creation failed' } };
      apiService.createSequenceNumber.and.returnValue(throwError(() => error));

      // Fill form with valid data using individual setValue
      const formControls = component.form.controls;
      formControls['chapterId'].setValue('IBC');
      formControls['numberType'].setValue('GELTUBE_BOX');
      formControls['maxNumber'].setValue(2000);
      formControls['startingNumber'].setValue(310);
      formControls['resetCycle'].setValue('D');
      formControls['lastResetDate'].setValue(new Date('2026-01-15'));

      component.form.updateValueAndValidity();
      fixture.detectChanges();
      tick(100);

      component.onSubmit();
      tick();
      flush();

      expect(component.isSubmitting()).toBeFalse();
    }));
  });


});