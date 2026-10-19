import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, Subject, EMPTY } from 'rxjs';
import { signal } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';

import { PageHeaderService } from '@shared/services/page-header.service';

import { ViewTemplatePage } from './view-template-page';
import { HealthHistoryService } from '../../services/health-history.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { MenuService } from '@shared/services/menu.service';
import { HHTemplateModel, HHTemplateQuestionDto } from '../../models/health-history.model';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';

describe('ViewTemplatePage', () => {
  let component: ViewTemplatePage;
  let fixture: ComponentFixture<ViewTemplatePage>;
  let hhServiceSpy: jasmine.SpyObj<HealthHistoryService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let routerSpy: jasmine.SpyObj<Router>;
  let chapterTimezoneSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;
  let dateAdapterSpy: jasmine.SpyObj<DateAdapter<moment.Moment>>;

  const hhManagementPath = ROUTE_REGISTRY[RouteKey.HealthHistoryManagement].path;

  const mockTemplate: HHTemplateModel = {
    templateId: 'TMPL000001',
    donationType: 'AL',
    donationTypeDescription: 'Allogeneic',
    randomizeFlag: 'N',
    status: 'Active',
    effectiveDate: '2025-01-01',
    terminationDate: '2027-12-31'
  };

  const mockQuestion: HHTemplateQuestionDto = {
    donationType: 'AL', questionCode: 'Q001', templateId: 'TMPL000001',
    questionDescription: 'Test question', screenerAsk: 'D',
    abbrFlag: 'N', abbrDispSeq: null, repeatHhFlag: '',
    gender: 'A', displayOrder: 1, sortSequence: '1',
    parentQuestionCode: '', subQuestionFlag: 'N', parentRespFlag: 'N',
    gotoNotes: '', effDate: '2025-01-01', termDate: null,
    validCodeType: '', randomizationFlag: 'N',
    programId: '', insertDate: '', insertUser: '', auditKey: 0, chapterId: 'DAL'
  };

  const mockQuestions: HHTemplateQuestionDto[] = [
    mockQuestion,
    { ...mockQuestion, questionCode: 'Q002', questionDescription: 'Do you take medication?', sortSequence: '2', displayOrder: 2 }
  ];

  /**
   * Creates the component with optional template data set via history.state.
   * The constructor calls loadRouteState() which reads history.state,
   * so state must be pushed before createComponent().
   */
  function createComponent(template: HHTemplateModel | null = mockTemplate): void {
    if (template) {
      window.history.pushState({ data: template }, '', '');
    } else {
      window.history.pushState({}, '', '');
    }

    fixture = TestBed.createComponent(ViewTemplatePage);
    component = fixture.componentInstance;

    // Standalone components using inject() resolve from their own module imports,
    // not from TestBed providers. Override private services after creation.
    (component as any).snackBar = snackBarSpy;
    (component as any).hhService = hhServiceSpy;
    (component as any).router = routerSpy;
    (component as any).menuService = menuServiceSpy;
    (component as any).chapterTimezoneService = chapterTimezoneSpy;
    (component as any).dateAdapter = dateAdapterSpy;

    if (!template) {
      component.templateData = null;
    }

    fixture.detectChanges();
  }

  beforeEach(async () => {
    hhServiceSpy = jasmine.createSpyObj('HealthHistoryService', [
      'getTemplateQuestions', 'updateTemplateTermDate'
    ]);
    hhServiceSpy.getTemplateQuestions.and.returnValue(of(mockQuestions));
    hhServiceSpy.updateTemplateTermDate.and.returnValue(of({ success: true } as any));

    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    routerSpy = jasmine.createSpyObj('Router', [
      'navigate', 'getCurrentNavigation', 'createUrlTree', 'serializeUrl', 'parseUrl'
    ]);
    routerSpy.getCurrentNavigation.and.returnValue(null);
    routerSpy.createUrlTree.and.returnValue({});
    routerSpy.serializeUrl.and.returnValue('/');
    routerSpy.parseUrl.and.returnValue({} as any);
    // PageHeaderService (used by PageHeaderWithBreadcrumb) accesses router.events and router.url
    (routerSpy as any).events = EMPTY;
    (routerSpy as any).url = '/test';

    chapterTimezoneSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate', 'getChapterLocalDateTime'
    ]);
    chapterTimezoneSpy.getChapterLocalDate.and.returnValue(moment('2026-07-17'));

    menuServiceSpy = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));
    menuServiceSpy.findMenuItemByPath.and.returnValue(undefined);

    dateAdapterSpy = jasmine.createSpyObj('DateAdapter', ['parse', 'format']);
    dateAdapterSpy.parse.and.callFake((value: string) => {
      const parsed = moment(value, 'DD-MMM-YYYY', true);
      return parsed.isValid() ? parsed : null;
    });

    await TestBed.configureTestingModule({
      imports: [ViewTemplatePage, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HealthHistoryService, useValue: hhServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} } } },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneSpy },
        { provide: MenuService, useValue: menuServiceSpy },
        {
          provide: PageHeaderService,
          useValue: {
            getTitle: () => '',
            getSubtitle: () => undefined,
            getCurrentMenuItem: () => undefined,
            pageHeaderData: signal(undefined)
          }
        }
      ]
    }).compileComponents();
  });

  // ======================================================================
  // Initialization with template data
  // ======================================================================

  describe('initialization with template data', () => {
    beforeEach(() => createComponent(mockTemplate));

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should set templateData from history state', () => {
      expect(component.templateData).toEqual(mockTemplate);
    });

    it('should set today from chapter timezone service', () => {
      expect(component.today).toBeDefined();
      expect(component.today instanceof Date).toBe(true);
    });

    it('should set isEditable to true for Active status', () => {
      expect(component.isEditable).toBe(true);
    });

    it('should populate termDateControl when editable and terminationDate exists', () => {
      const termDate = component.termDateControl.value;
      expect(termDate).toBeTruthy();
      expect(moment.isMoment(termDate)).toBe(true);
    });

    it('should load template questions on init', () => {
      expect(hhServiceSpy.getTemplateQuestions).toHaveBeenCalledWith('TMPL000001', true);
    });

    it('should set assignedQuestions from service response', () => {
      expect(component.assignedQuestions.length).toBe(2);
      expect(component.assignedQuestions[0].questionCode).toBe('Q001');
    });

    it('should set isLoading to false after questions load', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should update detailTableConfig pagination totalRecords', () => {
      expect(component.detailTableConfig.pagination!.totalRecords).toBe(2);
    });

    it('should update headerConfig breadcrumbs with templateId', () => {
      const breadcrumbs = component.headerConfig.breadcrumbs;
      expect(breadcrumbs.length).toBe(3);
      expect(breadcrumbs[0].label).toBe('Home');
      expect(breadcrumbs[0].link).toBe('/home');
      expect(breadcrumbs[2].label).toBe('TMPL000001');
      expect(breadcrumbs[2].link).toBeNull();
    });

    it('should not navigate away when templateData is present', () => {
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  // ======================================================================
  // Initialization with Future status
  // ======================================================================

  describe('initialization with Future status', () => {
    it('should set isEditable to true for Future status', () => {
      createComponent({ ...mockTemplate, status: 'Future' });
      expect(component.isEditable).toBe(true);
    });

    it('should populate termDateControl for Future status with terminationDate', () => {
      createComponent({ ...mockTemplate, status: 'Future', terminationDate: '2028-06-01' });
      expect(component.termDateControl.value).toBeTruthy();
    });
  });

  // ======================================================================
  // Initialization with Inactive status
  // ======================================================================

  describe('initialization with Inactive status', () => {
    it('should set isEditable to false for Inactive status', () => {
      createComponent({ ...mockTemplate, status: 'Inactive' });
      expect(component.isEditable).toBe(false);
    });

    it('should not populate termDateControl when not editable', () => {
      createComponent({ ...mockTemplate, status: 'Inactive', terminationDate: '2025-06-01' });
      expect(component.termDateControl.value).toBeNull();
    });
  });

  // ======================================================================
  // Case-insensitive status handling
  // ======================================================================

  describe('case-insensitive status handling', () => {
    it('should handle uppercase ACTIVE', () => {
      createComponent({ ...mockTemplate, status: 'ACTIVE' });
      expect(component.isEditable).toBe(true);
    });

    it('should handle lowercase active', () => {
      createComponent({ ...mockTemplate, status: 'active' });
      expect(component.isEditable).toBe(true);
    });

    it('should handle mixed case fUtUrE', () => {
      createComponent({ ...mockTemplate, status: 'fUtUrE' });
      expect(component.isEditable).toBe(true);
    });

    it('should handle mixed case Inactive', () => {
      createComponent({ ...mockTemplate, status: 'INACTIVE' });
      expect(component.isEditable).toBe(false);
    });
  });

  // ======================================================================
  // Initialization without terminationDate
  // ======================================================================

  describe('initialization without terminationDate', () => {
    it('should leave termDateControl null when terminationDate is undefined', () => {
      createComponent({ ...mockTemplate, terminationDate: undefined });
      expect(component.termDateControl.value).toBeNull();
    });

    it('should leave termDateControl null when terminationDate is empty string', () => {
      createComponent({ ...mockTemplate, terminationDate: '' });
      expect(component.termDateControl.value).toBeNull();
    });
  });

  // ======================================================================
  // Initialization without template data (redirect)
  // ======================================================================

  describe('initialization without template data', () => {
    it('should redirect to management page with tab=2 when no template data', () => {
      createComponent(null);
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        [hhManagementPath],
        { queryParams: { tab: 2 } }
      );
    });

    it('should not load template questions when no template data', () => {
      hhServiceSpy.getTemplateQuestions.calls.reset();
      createComponent(null);
      expect(hhServiceSpy.getTemplateQuestions).not.toHaveBeenCalled();
    });

    it('should not set isEditable when no template data', () => {
      createComponent(null);
      expect(component.isEditable).toBe(false);
    });
  });

  // ======================================================================
  // Initialization via router navigation state
  // ======================================================================

  describe('initialization via router navigation state', () => {
    it('should load templateData from router getCurrentNavigation extras.state', () => {
      const navTemplate = { ...mockTemplate, templateId: 'TMPL_NAV' };
      routerSpy.getCurrentNavigation.and.returnValue({
        extras: { state: { data: navTemplate } }
      } as any);

      window.history.pushState({}, '', '');
      fixture = TestBed.createComponent(ViewTemplatePage);
      component = fixture.componentInstance;
      (component as any).snackBar = snackBarSpy;
      (component as any).hhService = hhServiceSpy;
      (component as any).router = routerSpy;
      (component as any).menuService = menuServiceSpy;
      (component as any).chapterTimezoneService = chapterTimezoneSpy;
      (component as any).dateAdapter = dateAdapterSpy;
      fixture.detectChanges();

      expect(component.templateData!.templateId).toBe('TMPL_NAV');
    });
  });

  // ======================================================================
  // Edge cases for initialization
  // ======================================================================

  describe('initialization edge cases', () => {
    it('should handle null status in templateData', () => {
      createComponent({ ...mockTemplate, status: null as any });
      expect(component.isEditable).toBe(false);
    });

    it('should handle empty status in templateData', () => {
      createComponent({ ...mockTemplate, status: '' });
      expect(component.isEditable).toBe(false);
    });

    it('should handle invalid terminationDate string', () => {
      createComponent({ ...mockTemplate, terminationDate: 'not-a-date' });
      // moment.utc('not-a-date').isValid() is false, so termDateControl stays null
      expect(component.termDateControl.value).toBeNull();
    });
  });

  // ======================================================================
  // ngOnDestroy
  // ======================================================================

  describe('ngOnDestroy', () => {
    beforeEach(() => createComponent());

    it('should call next on destroy$', () => {
      const nextSpy = spyOn(component['destroy$'], 'next');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
    });

    it('should call complete on destroy$', () => {
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ======================================================================
  // termDateControl valueChanges
  // ======================================================================

  describe('termDateControl valueChanges', () => {
    beforeEach(() => createComponent());

    it('should set isTermDateDirty to true when value changes', () => {
      component.isTermDateDirty = false;
      component.termDateControl.setValue(moment('2028-01-01'));
      expect(component.isTermDateDirty).toBe(true);
    });
  });

  // ======================================================================
  // loadTemplateQuestions
  // ======================================================================

  describe('loadTemplateQuestions', () => {
    beforeEach(() => createComponent());

    it('should update pagination totalRecords on success', () => {
      expect(component.detailTableConfig.pagination!.totalRecords).toBe(2);
    });

    it('should set assignedQuestions on success', () => {
      hhServiceSpy.getTemplateQuestions.and.returnValue(of([mockQuestion]));
      component['loadTemplateQuestions']();
      expect(component.assignedQuestions.length).toBe(1);
      expect(component.isLoading).toBe(false);
    });

    it('should handle error and clear questions', () => {
      hhServiceSpy.getTemplateQuestions.and.returnValue(throwError(() => new Error('fail')));
      component['loadTemplateQuestions']();
      expect(component.isLoading).toBe(false);
      expect(component.assignedQuestions).toEqual([]);
    });

    it('should not call service when templateData is null', () => {
      component.templateData = null;
      hhServiceSpy.getTemplateQuestions.calls.reset();
      component['loadTemplateQuestions']();
      expect(hhServiceSpy.getTemplateQuestions).not.toHaveBeenCalled();
    });

    it('should update detailTableConfig pagination with correct totalRecords', () => {
      const threeQuestions = [mockQuestion, { ...mockQuestion, questionCode: 'Q002' }, { ...mockQuestion, questionCode: 'Q003' }];
      hhServiceSpy.getTemplateQuestions.and.returnValue(of(threeQuestions));
      component['loadTemplateQuestions']();
      expect(component.detailTableConfig.pagination!.totalRecords).toBe(3);
    });
  });

  // ======================================================================
  // Initialization with questions load error
  // ======================================================================

  describe('initialization with questions load error', () => {
    it('should handle API error during init and set empty assignedQuestions', () => {
      hhServiceSpy.getTemplateQuestions.and.returnValue(throwError(() => new Error('Server error')));
      createComponent(mockTemplate);
      expect(component.assignedQuestions).toEqual([]);
      expect(component.isLoading).toBe(false);
    });
  });

  // ======================================================================
  // onUpdateTermDate
  // ======================================================================

  describe('onUpdateTermDate', () => {
    beforeEach(() => createComponent());

    describe('guard conditions', () => {
      it('should return early when templateData is null', () => {
        component.templateData = null;
        component.onUpdateTermDate();
        expect(hhServiceSpy.updateTemplateTermDate).not.toHaveBeenCalled();
      });

      it('should return early when isEditable is false', () => {
        component.isEditable = false;
        component.onUpdateTermDate();
        expect(hhServiceSpy.updateTemplateTermDate).not.toHaveBeenCalled();
      });

      it('should mark termDateControl as touched', () => {
        spyOn(component.termDateControl, 'markAsTouched');
        component.termDateControl.setValue(moment('2028-06-15'));
        component.onUpdateTermDate();
        expect(component.termDateControl.markAsTouched).toHaveBeenCalled();
      });

      it('should return early when getTermDateError returns an error string', () => {
        component.termDateControl.setErrors({ pastDate: true });
        component.onUpdateTermDate();
        expect(hhServiceSpy.updateTemplateTermDate).not.toHaveBeenCalled();
      });

      it('should set invalidDate error when termDate value is null', () => {
        component.termDateControl.setValue(null);
        component.onUpdateTermDate();
        expect(component.termDateControl.hasError('invalidDate')).toBe(true);
        expect(hhServiceSpy.updateTemplateTermDate).not.toHaveBeenCalled();
      });

      it('should set invalidDate error when termDate is not a moment object', () => {
        component.termDateControl.setValue('2028-01-01' as any);
        component.onUpdateTermDate();
        expect(component.termDateControl.hasError('invalidDate')).toBe(true);
      });

      it('should set invalidDate error when termDate moment is invalid', () => {
        const invalidMoment = moment('invalid-date');
        component.termDateControl.setValue(invalidMoment, { emitEvent: false });
        // Clear any datepicker-added errors so the invalidDate code path is reached
        component.termDateControl.setErrors(null);
        component.onUpdateTermDate();
        expect(component.termDateControl.hasError('invalidDate')).toBe(true);
      });
    });

    describe('success path', () => {
      const futureDate = moment('2028-06-15');

      beforeEach(() => {
        component.termDateControl.setValue(futureDate);
        component.isTermDateDirty = true;
        hhServiceSpy.getTemplateQuestions.calls.reset();
        hhServiceSpy.updateTemplateTermDate.and.returnValue(of({ success: true } as any));
      });

      it('should call updateTemplateTermDate with correct params', () => {
        component.onUpdateTermDate();
        expect(hhServiceSpy.updateTemplateTermDate).toHaveBeenCalledWith(
          'TMPL000001', 'AL', '2028-06-15'
        );
      });

      it('should set isSaving to true during API call', () => {
        const subject = new Subject<any>();
        hhServiceSpy.updateTemplateTermDate.and.returnValue(subject.asObservable());
        component.onUpdateTermDate();
        expect(component.isSaving).toBe(true);
        subject.next({ success: true });
        subject.complete();
      });

      it('should set isSaving to false after API call completes', () => {
        component.onUpdateTermDate();
        expect(component.isSaving).toBe(false);
      });

      it('should update templateData.terminationDate on success', () => {
        component.onUpdateTermDate();
        expect(component.templateData!.terminationDate).toBe('2028-06-15');
      });

      it('should reset isTermDateDirty to false on success', () => {
        component.onUpdateTermDate();
        expect(component.isTermDateDirty).toBe(false);
      });

      it('should show success snackbar', () => {
        component.onUpdateTermDate();
        expect(snackBarSpy.open).toHaveBeenCalledWith(
          'Termination date updated successfully.', 'DISMISS',
          jasmine.objectContaining({
            duration: 3000,
            panelClass: ['success-snackbar']
          })
        );
      });

      it('should reload template questions on success', () => {
        component.onUpdateTermDate();
        expect(hhServiceSpy.getTemplateQuestions).toHaveBeenCalledWith('TMPL000001', true);
      });
    });

    describe('error path', () => {
      beforeEach(() => {
        component.termDateControl.setValue(moment('2028-06-15'));
      });

      it('should show error snackbar with message from error.error.message', () => {
        hhServiceSpy.updateTemplateTermDate.and.returnValue(
          throwError(() => ({ error: { message: 'Date conflicts with existing template.' } }))
        );
        component.onUpdateTermDate();
        expect(snackBarSpy.open).toHaveBeenCalledWith(
          'Date conflicts with existing template.', 'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
      });

      it('should show fallback error message when no message in error body', () => {
        hhServiceSpy.updateTemplateTermDate.and.returnValue(
          throwError(() => ({ error: {} }))
        );
        component.onUpdateTermDate();
        expect(snackBarSpy.open).toHaveBeenCalledWith(
          'Failed to update termination date.', 'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
      });

      it('should show fallback error when error has no error property', () => {
        hhServiceSpy.updateTemplateTermDate.and.returnValue(
          throwError(() => ({}))
        );
        component.onUpdateTermDate();
        expect(snackBarSpy.open).toHaveBeenCalledWith(
          'Failed to update termination date.', 'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
      });

      it('should show message from error directly when error.error is the error itself', () => {
        hhServiceSpy.updateTemplateTermDate.and.returnValue(
          throwError(() => ({ message: 'Network timeout' }))
        );
        component.onUpdateTermDate();
        expect(snackBarSpy.open).toHaveBeenCalledWith(
          'Network timeout', 'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
      });

      it('should set isSaving to false after error (finalize)', () => {
        hhServiceSpy.updateTemplateTermDate.and.returnValue(
          throwError(() => new Error('API failure'))
        );
        component.onUpdateTermDate();
        expect(component.isSaving).toBe(false);
      });
    });
  });

  // ======================================================================
  // onTermDateInput
  // ======================================================================

  describe('onTermDateInput', () => {
    beforeEach(() => createComponent());

    it('should mark control as touched and dirty', () => {
      (component as any).termDateInput = { nativeElement: { value: '17-JUL-2028' } };
      dateAdapterSpy.parse.and.returnValue(moment('2028-07-17'));
      component.onTermDateInput();
      expect(component.termDateControl.touched).toBe(true);
      expect(component.termDateControl.dirty).toBe(true);
    });

    it('should clear pastDate error when input is empty', () => {
      (component as any).termDateInput = { nativeElement: { value: '' } };
      component.termDateControl.setErrors({ pastDate: true });
      component.onTermDateInput();
      expect(component.termDateControl.errors).toBeNull();
    });

    it('should clear invalidDate error when input is whitespace only', () => {
      (component as any).termDateInput = { nativeElement: { value: '  ' } };
      component.termDateControl.setErrors({ invalidDate: true });
      component.onTermDateInput();
      expect(component.termDateControl.errors).toBeNull();
    });

    it('should not clear errors when input is empty but errors are not pastDate/invalidDate', () => {
      (component as any).termDateInput = { nativeElement: { value: '' } };
      component.termDateControl.setErrors({ matDatepickerParse: { text: 'bad' } });
      component.onTermDateInput();
      // matDatepickerParse is not pastDate or invalidDate, so errors should remain
      expect(component.termDateControl.hasError('matDatepickerParse')).toBe(true);
    });

    it('should set pastDate error when parsed date is before chapter today', () => {
      (component as any).termDateInput = { nativeElement: { value: '01-JAN-2020' } };
      dateAdapterSpy.parse.and.returnValue(moment('2020-01-01'));
      component.onTermDateInput();
      expect(component.termDateControl.hasError('pastDate')).toBe(true);
    });

    it('should clear pastDate error when parsed date is in the future', () => {
      (component as any).termDateInput = { nativeElement: { value: '01-JAN-2028' } };
      component.termDateControl.setErrors({ pastDate: true });
      dateAdapterSpy.parse.and.returnValue(moment('2028-01-01'));
      component.onTermDateInput();
      expect(component.termDateControl.hasError('pastDate')).toBe(false);
    });

    it('should not set error when dateAdapter.parse returns null', () => {
      (component as any).termDateInput = { nativeElement: { value: 'invalid' } };
      dateAdapterSpy.parse.and.returnValue(null);
      component.onTermDateInput();
      // No pastDate error set because parsed is null
      expect(component.termDateControl.hasError('pastDate')).toBe(false);
    });

    it('should handle missing termDateInput gracefully', () => {
      (component as any).termDateInput = undefined;
      expect(() => component.onTermDateInput()).not.toThrow();
    });
  });

  // ======================================================================
  // onTermDateChange
  // ======================================================================

  describe('onTermDateChange', () => {
    beforeEach(() => createComponent());

    it('should set pastDate error when selected date is before chapter today', () => {
      component.onTermDateChange({ value: moment('2020-01-01') });
      expect(component.termDateControl.hasError('pastDate')).toBe(true);
    });

    it('should not set error when selected date is today or in the future', () => {
      component.onTermDateChange({ value: moment('2028-06-15') });
      expect(component.termDateControl.hasError('pastDate')).toBe(false);
    });

    it('should not set error when event value is null', () => {
      component.onTermDateChange({ value: null });
      expect(component.termDateControl.hasError('pastDate')).toBe(false);
    });

    it('should not set error when event value is not a moment', () => {
      component.onTermDateChange({ value: '2020-01-01' });
      expect(component.termDateControl.hasError('pastDate')).toBe(false);
    });

    it('should not set error when event value is undefined', () => {
      component.onTermDateChange({ value: undefined });
      expect(component.termDateControl.hasError('pastDate')).toBe(false);
    });
  });

  // ======================================================================
  // onTermDateBlur
  // ======================================================================

  describe('onTermDateBlur', () => {
    beforeEach(() => createComponent());

    it('should set invalidDate error when input has value, control has no value, and parse fails', fakeAsync(() => {
      (component as any).termDateInput = { nativeElement: { value: 'gibberish' } };
      component.termDateControl.setValue(null, { emitEvent: false });
      dateAdapterSpy.parse.and.returnValue(null);
      component.onTermDateBlur();
      tick(150);
      expect(component.termDateControl.hasError('invalidDate')).toBe(true);
    }));

    it('should set pastDate error when input parses to a past date and control has no value', fakeAsync(() => {
      (component as any).termDateInput = { nativeElement: { value: '01-JAN-2020' } };
      component.termDateControl.setValue(null, { emitEvent: false });
      dateAdapterSpy.parse.and.returnValue(moment('2020-01-01'));
      component.onTermDateBlur();
      tick(150);
      expect(component.termDateControl.hasError('pastDate')).toBe(true);
    }));

    it('should set the control value when input parses to a valid future date and control has no value', fakeAsync(() => {
      (component as any).termDateInput = { nativeElement: { value: '01-JAN-2028' } };
      component.termDateControl.setValue(null, { emitEvent: false });
      dateAdapterSpy.parse.and.returnValue(moment('2028-01-01'));
      component.onTermDateBlur();
      tick(150);
      expect(component.termDateControl.value).toBeTruthy();
      expect(moment.isMoment(component.termDateControl.value)).toBe(true);
    }));

    it('should set pastDate error when control already has a past date value', fakeAsync(() => {
      (component as any).termDateInput = { nativeElement: { value: '01-JAN-2020' } };
      component.termDateControl.setValue(moment('2020-01-01'), { emitEvent: false });
      component.onTermDateBlur();
      tick(150);
      expect(component.termDateControl.hasError('pastDate')).toBe(true);
    }));

    it('should not set error when control has a valid future date', fakeAsync(() => {
      (component as any).termDateInput = { nativeElement: { value: '01-JAN-2028' } };
      component.termDateControl.setValue(moment('2028-01-01'), { emitEvent: false });
      component.onTermDateBlur();
      tick(150);
      expect(component.termDateControl.errors).toBeNull();
    }));

    it('should handle empty input with no control value gracefully', fakeAsync(() => {
      (component as any).termDateInput = { nativeElement: { value: '' } };
      component.termDateControl.setValue(null, { emitEvent: false });
      component.onTermDateBlur();
      tick(150);
      expect(component.termDateControl.hasError('invalidDate')).toBe(false);
      expect(component.termDateControl.hasError('pastDate')).toBe(false);
    }));

    it('should mark control as touched', fakeAsync(() => {
      (component as any).termDateInput = { nativeElement: { value: '' } };
      component.onTermDateBlur();
      tick(150);
      expect(component.termDateControl.touched).toBe(true);
    }));

    it('should handle non-moment control value that is valid and past', fakeAsync(() => {
      (component as any).termDateInput = { nativeElement: { value: '01-JAN-2020' } };
      // Set a non-moment Date-like value
      component.termDateControl.setValue('2020-01-01' as any, { emitEvent: false });
      component.onTermDateBlur();
      tick(150);
      expect(component.termDateControl.hasError('pastDate')).toBe(true);
    }));
  });

  // ======================================================================
  // getTermDateError
  // ======================================================================

  describe('getTermDateError', () => {
    beforeEach(() => createComponent());

    it('should return pastDate message when control has pastDate error', () => {
      component.termDateControl.setErrors({ pastDate: true });
      expect(component.getTermDateError()).toBe('Termination Date cannot be in the past');
    });

    it('should return invalidDate message when control has invalidDate error', () => {
      component.termDateControl.setErrors({ invalidDate: true });
      expect(component.getTermDateError()).toBe('Termination Date is invalid');
    });

    it('should return invalid message when control has matDatepickerParse error', () => {
      component.termDateControl.setErrors({ matDatepickerParse: { text: 'bad' } });
      expect(component.getTermDateError()).toBe('Termination Date is invalid');
    });

    it('should return invalid message when input has value but control value is null', () => {
      (component as any).termDateInput = { nativeElement: { value: 'some-text' } };
      component.termDateControl.setValue(null, { emitEvent: false });
      expect(component.getTermDateError()).toBe('Termination Date is invalid');
    });

    it('should return empty string when no errors and no input mismatch', () => {
      component.termDateControl.setErrors(null);
      (component as any).termDateInput = { nativeElement: { value: '' } };
      expect(component.getTermDateError()).toBe('');
    });

    it('should return empty string when termDateInput is undefined', () => {
      component.termDateControl.setErrors(null);
      (component as any).termDateInput = undefined;
      expect(component.getTermDateError()).toBe('');
    });

    it('should return empty string when control has value and no errors', () => {
      component.termDateControl.setValue(moment('2028-01-01'), { emitEvent: false });
      component.termDateControl.setErrors(null);
      (component as any).termDateInput = { nativeElement: { value: '01-JAN-2028' } };
      expect(component.getTermDateError()).toBe('');
    });

    it('should prioritize pastDate over invalidDate when both present', () => {
      component.termDateControl.setErrors({ pastDate: true, invalidDate: true });
      expect(component.getTermDateError()).toBe('Termination Date cannot be in the past');
    });

    it('should return empty string when input value is whitespace only and control is null', () => {
      (component as any).termDateInput = { nativeElement: { value: '   ' } };
      component.termDateControl.setValue(null, { emitEvent: false });
      // hasInputValue checks trim() !== '', so whitespace-only is falsy
      // Actually '   '.trim() === '' so hasInputValue is false
      expect(component.getTermDateError()).toBe('');
    });
  });

  // ======================================================================
  // termDateErrorMatcher
  // ======================================================================

  describe('termDateErrorMatcher', () => {
    beforeEach(() => createComponent());

    it('should return false when control is null', () => {
      expect(component.termDateErrorMatcher.isErrorState(null as any, null as any)).toBe(false);
    });

    it('should return false when control is untouched and clean', () => {
      const control = new FormControl(null);
      expect(component.termDateErrorMatcher.isErrorState(control as any, null as any)).toBe(false);
    });

    it('should return true when control is touched and has error', () => {
      component.termDateControl.markAsTouched();
      component.termDateControl.setErrors({ pastDate: true });
      expect(component.termDateErrorMatcher.isErrorState(component.termDateControl as any, null as any)).toBe(true);
    });

    it('should return true when control is dirty and has error', () => {
      component.termDateControl.markAsDirty();
      component.termDateControl.setErrors({ invalidDate: true });
      expect(component.termDateErrorMatcher.isErrorState(component.termDateControl as any, null as any)).toBe(true);
    });

    it('should return false when control is touched but no error exists', () => {
      component.termDateControl.markAsTouched();
      component.termDateControl.setErrors(null);
      (component as any).termDateInput = { nativeElement: { value: '' } };
      expect(component.termDateErrorMatcher.isErrorState(component.termDateControl as any, null as any)).toBe(false);
    });
  });

  // ======================================================================
  // onBack
  // ======================================================================

  describe('onBack', () => {
    beforeEach(() => createComponent());

    it('should navigate to management page with tab=2', () => {
      component.onBack();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        [hhManagementPath],
        { queryParams: { tab: 2 } }
      );
    });
  });

  // ======================================================================
  // formatDate
  // ======================================================================

  describe('formatDate', () => {
    beforeEach(() => createComponent());

    it('should format ISO date string to DD-MMM-YYYY uppercase', () => {
      expect(component.formatDate('2025-01-15')).toBe('15-JAN-2025');
    });

    it('should format ISO date with time component', () => {
      expect(component.formatDate('2026-12-31T00:00:00Z')).toBe('31-DEC-2026');
    });

    it('should return dash for empty string', () => {
      expect(component.formatDate('')).toBe('-');
    });

    it('should return dash for null', () => {
      expect(component.formatDate(null as any)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(component.formatDate(undefined as any)).toBe('-');
    });

    it('should format various dates correctly', () => {
      expect(component.formatDate('2025-06-30')).toBe('30-JUN-2025');
      expect(component.formatDate('2024-02-29')).toBe('29-FEB-2024');
      expect(component.formatDate('2023-11-05')).toBe('05-NOV-2023');
    });
  });

  // ======================================================================
  // detailTableConfig columns
  // ======================================================================

  describe('detailTableConfig columns', () => {
    beforeEach(() => createComponent());

    it('should have 14 columns', () => {
      expect(component.detailTableConfig.columns.length).toBe(14);
    });

    it('should have questionCode as first column', () => {
      expect(component.detailTableConfig.columns[0].key).toBe('questionCode');
    });

    it('should have correct column keys in order', () => {
      const keys = component.detailTableConfig.columns.map(c => c.key);
      expect(keys).toEqual([
        'questionCode', 'screenerAsk', 'abbrFlag', 'abbrDispSeq',
        'repeatHhFlag', 'gender', 'displayOrder', 'sortSequence',
        'parentQuestionCode', 'parentRespFlag', 'subQuestionFlag',
        'gotoNotes', 'effDate', 'termDate'
      ]);
    });

    it('should format effDate column with date formatter', () => {
      const effDateCol = component.detailTableConfig.columns.find(c => c.key === 'effDate');
      expect(effDateCol).toBeDefined();
      expect(effDateCol!.valueFormatter!('2025-03-01', {} as any)).toBe('01-MAR-2025');
    });

    it('should format termDate column with date formatter', () => {
      const termDateCol = component.detailTableConfig.columns.find(c => c.key === 'termDate');
      expect(termDateCol).toBeDefined();
      expect(termDateCol!.valueFormatter!('2026-06-30', {} as any)).toBe('30-JUN-2026');
    });

    it('should return empty string for null termDate', () => {
      const termDateCol = component.detailTableConfig.columns.find(c => c.key === 'termDate');
      expect(termDateCol!.valueFormatter!(null as any, {} as any)).toBe('');
    });

    it('should return empty string for undefined termDate', () => {
      const termDateCol = component.detailTableConfig.columns.find(c => c.key === 'termDate');
      expect(termDateCol!.valueFormatter!(undefined as any, {} as any)).toBe('');
    });

    it('should have sortable questionCode column', () => {
      const col = component.detailTableConfig.columns.find(c => c.key === 'questionCode');
      expect(col!.sortable).toBe(true);
    });

    it('should have correct pagination defaults', () => {
      expect(component.detailTableConfig.pagination!.pageSize).toBe(25);
      expect(component.detailTableConfig.pagination!.pageIndex).toBe(0);
      expect(component.detailTableConfig.pagination!.pageSizeOptions).toEqual([10, 25, 50, 100]);
      expect(component.detailTableConfig.pagination!.showFirstLastButtons).toBe(true);
    });

    it('should have stickyHeader enabled', () => {
      expect(component.detailTableConfig.stickyHeader).toBe(true);
    });

    it('should show pagination', () => {
      expect(component.detailTableConfig.showPagination).toBe(true);
    });

    it('should have correct empty message', () => {
      expect(component.detailTableConfig.emptyMessage).toBe('No questions assigned');
    });
  });

  // ======================================================================
  // headerConfig
  // ======================================================================

  describe('headerConfig', () => {
    it('should have correct default breadcrumbs structure', () => {
      createComponent(mockTemplate);
      const breadcrumbs = component.headerConfig.breadcrumbs;
      expect(breadcrumbs.length).toBe(3);
      expect(breadcrumbs[0].label).toBe('Home');
      expect(breadcrumbs[0].link).toBe('/home');
      expect(breadcrumbs[1].label).toBe('Health History Management');
      expect(breadcrumbs[1].link).toContain('?tab=2');
    });

    it('should update breadcrumbs from menu service effect when menu items are available', () => {
      const menuSignal = signal([{ label: 'HH Mgmt', routePath: hhManagementPath }]);
      menuServiceSpy.getMenuItemsSignal.and.returnValue(menuSignal as any);
      menuServiceSpy.findMenuItemByPath.and.returnValue({ label: 'HH Management Custom' } as any);

      createComponent(mockTemplate);

      // Trigger the effect by updating signal
      menuSignal.set([{ label: 'HH Mgmt Updated', routePath: hhManagementPath }]);
      fixture.detectChanges();

      const breadcrumbs = component.headerConfig.breadcrumbs;
      expect(breadcrumbs[1].label).toBe('HH Management Custom');
    });

    it('should not update breadcrumbs when menu item is not found', () => {
      const menuSignal = signal([{ label: 'Other', routePath: '/other' }]);
      menuServiceSpy.getMenuItemsSignal.and.returnValue(menuSignal as any);
      menuServiceSpy.findMenuItemByPath.and.returnValue(undefined);

      createComponent(mockTemplate);
      menuSignal.set([{ label: 'Other Updated', routePath: '/other' }]);
      fixture.detectChanges();

      // Breadcrumb should still have the default label from ngOnInit
      const breadcrumbs = component.headerConfig.breadcrumbs;
      expect(breadcrumbs[1].label).toBe('Health History Management');
    });

    it('should not update breadcrumbs when menu items is empty', () => {
      menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));
      createComponent(mockTemplate);
      const breadcrumbs = component.headerConfig.breadcrumbs;
      expect(breadcrumbs[1].label).toBe('Health History Management');
    });
  });

  // ======================================================================
  // backLink property
  // ======================================================================

  describe('backLink', () => {
    it('should construct backLink with tab=2 query parameter', () => {
      createComponent(mockTemplate);
      const backLink = (component as any).backLink;
      expect(backLink).toContain(hhManagementPath);
      expect(backLink).toContain('?tab=2');
    });
  });

  // ======================================================================
  // loadRouteState
  // ======================================================================

  describe('loadRouteState', () => {
    it('should prefer router navigation state over history.state', () => {
      const navTemplate = { ...mockTemplate, templateId: 'FROM_NAV' };
      routerSpy.getCurrentNavigation.and.returnValue({
        extras: { state: { data: navTemplate } }
      } as any);

      window.history.pushState({ data: { ...mockTemplate, templateId: 'FROM_HISTORY' } }, '', '');
      fixture = TestBed.createComponent(ViewTemplatePage);
      component = fixture.componentInstance;
      (component as any).hhService = hhServiceSpy;
      (component as any).snackBar = snackBarSpy;
      (component as any).router = routerSpy;
      (component as any).menuService = menuServiceSpy;
      (component as any).chapterTimezoneService = chapterTimezoneSpy;
      (component as any).dateAdapter = dateAdapterSpy;

      expect(component.templateData!.templateId).toBe('FROM_NAV');
    });

    it('should fall back to history.state when router navigation is null', () => {
      routerSpy.getCurrentNavigation.and.returnValue(null);
      createComponent(mockTemplate);
      expect(component.templateData!.templateId).toBe('TMPL000001');
    });

    it('should set templateData to null when neither source has data', () => {
      routerSpy.getCurrentNavigation.and.returnValue(null);
      createComponent(null);
      expect(component.templateData).toBeNull();
    });

    it('should handle getCurrentNavigation returning object without extras', () => {
      routerSpy.getCurrentNavigation.and.returnValue({} as any);
      createComponent(mockTemplate);
      // Falls back to history.state
      expect(component.templateData!.templateId).toBe('TMPL000001');
    });

    it('should handle getCurrentNavigation returning object with extras but no state', () => {
      routerSpy.getCurrentNavigation.and.returnValue({ extras: {} } as any);
      createComponent(mockTemplate);
      // Falls back to history.state
      expect(component.templateData!.templateId).toBe('TMPL000001');
    });
  });
});
