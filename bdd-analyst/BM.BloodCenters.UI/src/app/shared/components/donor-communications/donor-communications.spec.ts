import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { DonorCommunicationsComponent } from './donor-communications';
import { DonorCommunicationsService } from './services/donor-communications.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { LoggingService } from '@shared/services/logging.service';
import { DonorCommunication } from './models/donor-communications.model';
import { createMockSnackbarService, createMockTranslateService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('DonorCommunicationsComponent', () => {
  let component: DonorCommunicationsComponent;
  let fixture: ComponentFixture<DonorCommunicationsComponent>;
  let serviceSpy: jasmine.SpyObj<DonorCommunicationsService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let chapterTimezoneSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let headerSpy: jasmine.SpyObj<HeaderService>;
  let loginSpy: jasmine.SpyObj<LoginService>;
  let translateSpy: jasmine.SpyObj<TranslateService>;

  const donorDob = moment().subtract(36, 'years').format('YYYY-MM-DD');
  const now = moment();
  const comDate = now.toISOString();
  const oldDate = '2000-06-08';
  const recentDate = '2026-07-01';
  const twoDaysFromNow = moment().add(2, 'days').format('YYYY-MM-DD');
  const threeDaysFromNow = moment().add(3, 'days').format('YYYY-MM-DD');

  const mockCommunications: DonorCommunication[] = [
    {
      donorId: 'DN00418881',
      sequenceNumber: 1,
      chapterId: 'DAL',
      comDate: oldDate,
      comType: 'TELE',
      comTypeDesc: 'Telephone',
      comCode: 'COMM',
      comCodeDesc: 'Communication',
      comDesc: 'Called donor',
      targetDate: threeDaysFromNow,
      actionCode: 'SEND',
      actionCodeDesc: 'Send Letter',
      actionDate: twoDaysFromNow,
      insertDate: oldDate,
      insertUser: 'DONSYS',
      userName: 'A. Donsys'
    },
    {
      donorId: 'DN00418881',
      sequenceNumber: 2,
      chapterId: 'DAL',
      comDate: recentDate,
      comType: 'TELE',
      comTypeDesc: 'Telephone',
      comCode: 'COMM',
      comCodeDesc: 'Communication',
      comDesc: 'Follow up',
      insertDate: recentDate,
      insertUser: 'NITOR1',
      userName: 'Nitor, User1'
    }
  ];

  const mockTypes = [
    { code: 'TELE', description: 'Telephone' },
    { code: 'MAIL', description: 'Mail Communication' }
  ];

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('DonorCommunicationsService', [
      'getCommunications',
      'getCommunicationTypes',
      'getCommunicationCodes',
      'getActionCodes',
      'getLetters',
      'getLetterCodes',
      'getLetterText',
      'getDonorHeader',
      'checkDlcomAccess',
      'updateCommunication',
      'createCommunication',
      'generateLetter',
      'saveAndPrintLetter',
      'retrieveLetterTemplate',
      'getUserFullName'
    ]);
    snackbarSpy = createMockSnackbarService();
    chapterTimezoneSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate',
      'getChapterLocalDateTime'
    ]);
    headerSpy = createMockHeaderService();
    loginSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    translateSpy = createMockTranslateService();

    serviceSpy.getCommunications.and.returnValue(of({
      data: mockCommunications,
      totalCount: 2,
      pageNumber: 1,
      pageSize: 1000
    }));
    serviceSpy.getCommunicationTypes.and.returnValue(of(mockTypes));
    serviceSpy.getCommunicationCodes.and.returnValue(of([]));
    serviceSpy.getActionCodes.and.returnValue(of([]));
    serviceSpy.getLetters.and.returnValue(of([]));
    serviceSpy.getLetterCodes.and.returnValue(of([]));
    serviceSpy.getLetterText.and.returnValue(of(''));
    serviceSpy.getDonorHeader.and.returnValue(of({
      name: 'HARPER, SHIRLEY J',
      dateOfBirth: donorDob,
      sex: 'F',
      abo: 'B Neg'
    }));
    serviceSpy.checkDlcomAccess.and.returnValue(of(true));
    serviceSpy.updateCommunication.and.returnValue(of(mockCommunications[0]));
    serviceSpy.createCommunication.and.returnValue(of({}));
    serviceSpy.getUserFullName.and.returnValue(of('Nitor, User1'));
    chapterTimezoneSpy.getChapterLocalDate.and.returnValue(moment());
    chapterTimezoneSpy.getChapterLocalDateTime.and.returnValue(moment());
    loginSpy.getStoredUsername.and.returnValue('NITOR1');
    translateSpy.instant.and.returnValue('');
    translateSpy.get.and.returnValue(of(''));

    await TestBed.configureTestingModule({
      imports: [DonorCommunicationsComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DonorCommunicationsService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialog, useValue: createMockMatDialog() },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: LoginService, useValue: loginSpy },
        { provide: TranslateService, useValue: translateSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DonorCommunicationsComponent);
    component = fixture.componentInstance;
    component.donorId = 'DN00418881';
  });

  // ──────────────────────────────────────────────
  // Initialization & Loading
  // ──────────────────────────────────────────────

  describe('Initialization', () => {

    it('should load communications on init', () => {
      fixture.detectChanges();
      expect(serviceSpy.getCommunications).toHaveBeenCalledWith('DN00418881', 1, 1000, 'comDate', 'desc');
      expect(component.communications().length).toBe(2);
    });

    it('should load donor header on init', () => {
      fixture.detectChanges();
      expect(serviceSpy.getDonorHeader).toHaveBeenCalledWith('DN00418881');
      expect(component.donorHeader()?.name).toBe('HARPER, SHIRLEY J');
    });

    it('should show error and close if donorId is missing', () => {
      component.donorId = '';
      const closeSpy = spyOn(component.closePanel, 'emit');
      fixture.detectChanges();
      expect(snackbarSpy.showError).toHaveBeenCalled();
      expect(closeSpy).toHaveBeenCalled();
    });

  });

  describe('Loading States', () => {
    it('should set loading signals correctly', () => {
      expect(component.initialLoading()).toBe(true);
      fixture.detectChanges();
      expect(component.initialLoading()).toBe(false);
      expect(component.loading()).toBe(false);
    });

    it('should handle error when loading communications fails', () => {
      serviceSpy.getCommunications.and.returnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load communications');
      expect(component.loading()).toBe(false);
    });

    it('should use fallback donor header on error', () => {
      serviceSpy.getDonorHeader.and.returnValue(throwError(() => new Error('fail')));
      component.donorName = 'Test Donor';
      fixture.detectChanges();
      expect(component.donorHeader()?.name).toBe('Test Donor');
    });
  });

  // ──────────────────────────────────────────────
  // BUG-3: Sort Order (newest first)
  // ──────────────────────────────────────────────

  describe('BUG-3: Sort order', () => {
    beforeEach(() => fixture.detectChanges());

    it('should sort communications by comDate descending (newest first)', () => {
      // detectChanges already called in beforeEach
    });


    it('should return all communications when search text is empty', () => {
      component.searchText.set('');
      expect(component.filteredCommunications().length).toBe(2);
    });

    it('should filter by communication type', () => {
      component.searchText.set('tele');
      expect(component.filteredCommunications().length).toBe(2);
    });

    it('should return empty for non-matching search', () => {
      component.searchText.set('MAIL');
      expect(component.filteredCommunications().length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // Row Selection (BUG-2: User Name)
  // ──────────────────────────────────────────────

  describe('Row Selection', () => {
    beforeEach(() => fixture.detectChanges());

    it('should set selected communication on row click', () => {
      component.onRowClick(mockCommunications[0]);
      expect(component.selectedCommunication()).toEqual(mockCommunications[0]);
      expect(component.selectedNote()).toBe('Called donor');
    });


    it('should use insertUser if userName not available', () => {
      const comm = { ...mockCommunications[0], userName: undefined };
      component.onRowClick(comm);
      expect(component.selectedUserName()).toBe('DONSYS');
    });
  });

  // ──────────────────────────────────────────────
  // BUG-4: New Panel Date/Time (chapter timezone)
  // ──────────────────────────────────────────────

  describe('BUG-4: New Panel', () => {
    afterEach(() => component.ngOnDestroy());

    it('should use ChapterTimezoneService for date/time', () => {
      fixture.detectChanges();
      component.onNew();
      expect(chapterTimezoneSpy.getChapterLocalDateTime).toHaveBeenCalled();
    });

    it('should set panel current user', () => {
      fixture.detectChanges();
      component.onNew();
      expect(component.panelCurrentUser()).toBe('NITOR1');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 3.6: Staff Name in New Panel
  // ──────────────────────────────────────────────

  describe('Gap 3.6: Staff name lookup', () => {
    afterEach(() => component.ngOnDestroy());

    it('should look up full user name when opening new panel', () => {
      fixture.detectChanges();
      component.onNew();
      expect(serviceSpy.getUserFullName).toHaveBeenCalledWith('NITOR1');
      expect(component.panelCurrentUserName()).toBe('Nitor, User1');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 3.1 & 3.2: Details Mode Update + DLCOM
  // ──────────────────────────────────────────────

  describe('Gap 3.1: Details mode editing', () => {
    beforeEach(() => fixture.detectChanges());
    afterEach(() => component.ngOnDestroy());

    it('should open details panel in details mode', () => {
      component.selectedCommunication.set(mockCommunications[0]);
      component.onDetails();
      expect(component.sidePanelOpen()).toBe(true);
      expect(component.sidePanelMode()).toBe('details');
    });

    it('should keep comments and actionDate enabled in details mode', () => {
      component.openDetailsPanel(mockCommunications[0]);
      expect(component.sidePanelForm.get('comments')?.disabled).toBe(false);
      expect(component.sidePanelForm.get('actionDate')?.disabled).toBe(false);
    });

    it('should disable actionCode and targetDate in details mode', () => {
      component.openDetailsPanel(mockCommunications[0]);
      expect(component.sidePanelForm.get('actionCode')?.disabled).toBe(true);
      expect(component.sidePanelForm.get('targetDate')?.disabled).toBe(true);
    });

    it('should keep communicationType disabled in details mode', () => {
      component.openDetailsPanel(mockCommunications[0]);
      expect(component.sidePanelForm.get('communicationType')?.disabled).toBe(true);
    });

    it('should include SAVE button when DLCOM access granted', () => {
      component.openDetailsPanel(mockCommunications[0]);
      const buttons = component.getPanelButtons();
      expect(buttons.some(b => b.label === 'SAVE')).toBe(true);
      expect(buttons.some(b => b.label === 'CLOSE')).toBe(true);
    });

    it('should load action codes from API in details mode', () => {
      component.openDetailsPanel(mockCommunications[0]);
      expect(serviceSpy.getActionCodes).toHaveBeenCalledWith('TELE');
    });


    it('should initialize form when opening new panel', () => {
      component.onNew();
      component.panelActionCodes.set([
        { value: '1DNLT', label: '1DNLT - Mail first time donor letter', targetDays: 7 }
      ]);
      component.panelFilteredActionCodes.set([...component.panelActionCodes()]);
      component.sidePanelForm.get('actionCode')?.setValue('1DNLT');

      const targetDate = component.sidePanelForm.get('targetDate')?.value;
      expect(targetDate).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────
  // BUG-7: Details Label
  // ──────────────────────────────────────────────

  describe('BUG-7: Details panel date label', () => {
    afterEach(() => component.ngOnDestroy());

    it('should show "Date and Time" label in details mode', () => {
      fixture.detectChanges();
      component.openDetailsPanel(mockCommunications[0]);
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const dateLabel = compiled.querySelector('.details-display .field-label');
      expect(dateLabel?.textContent?.trim()).toBe('Date and Time');
    });
  });

  // ──────────────────────────────────────────────
  // BUG-8: View Letters Close Button
  // ──────────────────────────────────────────────

  describe('BUG-8: View Letters', () => {
    beforeEach(() => fixture.detectChanges());

    it('should return CLOSE button for view letters panel', () => {
      const buttons = component.getViewLettersButtons();
      expect(buttons.length).toBe(1);
      expect(buttons[0].label).toBe('CLOSE');
      expect(buttons[0].action).toBe('close');
    });

    it('should close view letters on button click', () => {
      component.viewLettersOpen.set(true);
      component.onViewLettersButtonClick('close');
      expect(component.viewLettersOpen()).toBe(false);
    });

    it('should open view letters panel', () => {
      component.onViewLetters();
      expect(component.viewLettersOpen()).toBe(true);
      expect(serviceSpy.getLetters).toHaveBeenCalled();
    });

    it('should close view letters and reset state', () => {
      component.viewLettersOpen.set(true);
      component.selectedLetter.set({ letterId: 'L1', letterDate: '2026-01-01' });
      component.letterText.set('Some text');
      component.closeViewLetters();
      expect(component.viewLettersOpen()).toBe(false);
      expect(component.selectedLetter()).toBeNull();
      expect(component.letterText()).toBe('');
    });
  });

  // ──────────────────────────────────────────────
  // Gap 3.7: P_HIDE_LETTER
  // ──────────────────────────────────────────────

  describe('Gap 3.7: hideSendLetter input', () => {
    it('should default hideSendLetter to false', () => {
      expect(component.hideSendLetter).toBe(false);
    });

    it('should accept hideSendLetter input', () => {
      component.hideSendLetter = true;
      expect(component.hideSendLetter).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // Panel Close & Misc
  // ──────────────────────────────────────────────

  describe('Panel operations', () => {
    beforeEach(() => fixture.detectChanges());
    afterEach(() => component.ngOnDestroy());

    it('should close side panel and reset state', () => {
      component.onNew();
      expect(component.sidePanelOpen()).toBe(true);
      component.closeSidePanel();
      expect(component.sidePanelOpen()).toBe(false);
      expect(component.sidePanelData()).toBeNull();
    });

    it('should emit closePanel on onClose', () => {
      const closeSpy = spyOn(component.closePanel, 'emit');
      component.onClose();
      expect(closeSpy).toHaveBeenCalled();
    });

    it('should show error if details clicked without selection', () => {
      component.selectedCommunication.set(null);
      component.onDetails();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please select a communication first');
    });

    it('should handle panel button click for save', () => {
      component.onNew();
      const saveSpy = spyOn(component, 'onPanelSave');
      component.onPanelButtonClick('save');
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should handle panel button click for close', () => {
      component.onNew();
      component.onPanelButtonClick('close');
      expect(component.sidePanelOpen()).toBe(false);
    });

    it('should handle panel button click for cancel', () => {
      component.onNew();
      component.onPanelButtonClick('cancel');
      expect(component.sidePanelOpen()).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // Send Letter Panel
  // ──────────────────────────────────────────────

  describe('Send Letter panel', () => {
    beforeEach(() => fixture.detectChanges());
    afterEach(() => component.ngOnDestroy());

    it('should open send letter panel', () => {
      component.onSendLetters();
      expect(component.sendLetterOpen()).toBe(true);
    });

    it('should close send letter panel and reset state', () => {
      component.onSendLetters();
      component.closeSendLetter();
      expect(component.sendLetterOpen()).toBe(false);
      expect(component.generatedLetterText()).toBe('');
    });

    it('should return correct send letter buttons', () => {
      component.onSendLetters();
      const buttons = component.getSendLetterButtons();
      expect(buttons.some(b => b.label === 'CLOSE')).toBe(true);
      expect(buttons.some(b => b.label === 'GENERATE')).toBe(true);
      expect(buttons.some(b => b.label === 'SAVE & PRINT')).toBe(true);
      expect(buttons.some(b => b.label === 'RETRIEVE')).toBe(true);
    });

    it('should handle send letter button clicks', () => {
      component.onSendLetters();
      component.onSendLetterButtonClick('close');
      expect(component.sendLetterOpen()).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // Table Sort & Search
  // ──────────────────────────────────────────────

  describe('Table sort', () => {
    beforeEach(() => fixture.detectChanges());

    it('should convert sort event and reload', () => {
      component.onTableSort({ column: 'comDate', direction: 'A' });
      expect(component.currentSort).toEqual({ active: 'comDate', direction: 'asc' });
      expect(serviceSpy.getCommunications).toHaveBeenCalledTimes(2);
    });

    it('should handle descending sort', () => {
      component.onTableSort({ column: 'targetDate', direction: 'D' });
      expect(component.currentSort).toEqual({ active: 'targetDate', direction: 'desc' });
    });

    it('should handle default sort direction', () => {
      component.onTableSort({ column: 'comDate', direction: 'default' });
      expect(component.currentSort.direction).toBe('');
    });
  });

  describe('onSearch', () => {
    it('should update search text signal', () => {
      component.onSearch('TELE');
      expect(component.searchText()).toBe('TELE');
    });
  });

  // ──────────────────────────────────────────────
  // Escape key
  // ──────────────────────────────────────────────

  describe('Escape key', () => {
    beforeEach(() => fixture.detectChanges());
    afterEach(() => component.ngOnDestroy());

    it('should close side panel on escape key', () => {
      component.onNew();
      expect(component.sidePanelOpen()).toBe(true);
      component.onEscapeKey();
      expect(component.sidePanelOpen()).toBe(false);
    });

    it('should do nothing if no panel is open', () => {
      component.onEscapeKey();
      expect(component.sidePanelOpen()).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // Panel Type/Code Changes
  // ──────────────────────────────────────────────

  describe('Panel type change', () => {
    afterEach(() => component.ngOnDestroy());

    it('should load codes when type is selected', () => {
      fixture.detectChanges();
      component.onNew();
      serviceSpy.getCommunicationCodes.and.returnValue(of([
        { code: 'COMM', description: 'Communication' }
      ]));
      serviceSpy.getActionCodes.and.returnValue(of([
        { code: 'SEND', description: 'Send', targetDays: 5 }
      ]));

      component.onPanelTypeChange('TELE');

      expect(serviceSpy.getCommunicationCodes).toHaveBeenCalledWith('TELE');
      expect(serviceSpy.getActionCodes).toHaveBeenCalledWith('TELE');
      expect(component.panelCommunicationCodes().length).toBe(1);
    });

    it('should clear codes when type is empty', () => {
      fixture.detectChanges();
      component.onNew();
      component.onPanelTypeChange('');
      expect(component.panelCommunicationCodes().length).toBe(0);
      expect(component.panelActionCodes().length).toBe(0);
    });

    it('should handle code loading error', () => {
      fixture.detectChanges();
      component.onNew();
      serviceSpy.getCommunicationCodes.and.returnValue(throwError(() => new Error('fail')));
      serviceSpy.getActionCodes.and.returnValue(throwError(() => new Error('fail')));
      component.onPanelTypeChange('TELE');
      expect(component.panelCommunicationCodes().length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // Save New Communication
  // ──────────────────────────────────────────────

  describe('Save new communication', () => {
    afterEach(() => component.ngOnDestroy());

    it('should save new communication and reload', () => {
      fixture.detectChanges();
      component.onNew();
      component.sidePanelForm.patchValue({
        communicationType: 'TELE',
        communicationCode: 'COMM',
        comments: 'Test comment'
      });
      component.sidePanelForm.markAllAsTouched();
      component.onPanelSave();
      expect(serviceSpy.createCommunication).toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Communication saved successfully');
    });

    it('should not save when form is invalid', () => {
      fixture.detectChanges();
      component.onNew();
      component.sidePanelForm.markAllAsTouched();
      component.onPanelSave();
      expect(serviceSpy.createCommunication).not.toHaveBeenCalled();
    });

    it('should show error on save failure', () => {
      fixture.detectChanges();
      component.onNew();
      serviceSpy.createCommunication.and.returnValue(throwError(() => ({ error: { Message: 'Save failed' } })));
      component.sidePanelForm.patchValue({
        communicationType: 'TELE',
        communicationCode: 'COMM'
      });
      component.sidePanelForm.markAllAsTouched();
      component.onPanelSave();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Save failed');
    });

    it('should not save when already loading', () => {
      fixture.detectChanges();
      component.onNew();
      component.sidePanelLoading.set(true);
      component.onPanelSave();
      expect(serviceSpy.createCommunication).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // Date Input Handlers
  // ──────────────────────────────────────────────

  describe('Date input handlers', () => {
    afterEach(() => component.ngOnDestroy());

    it('should handle target date input', () => {
      fixture.detectChanges();
      component.onNew();
      const event = { target: { value: '01-JAN-2026' } } as unknown as Event;
      component.onPanelTargetDateInput(event);
      expect(component.sidePanelForm.get('targetDate')?.touched).toBe(true);
    });

    it('should handle action date input', () => {
      fixture.detectChanges();
      component.onNew();
      const event = { target: { value: '15-FEB-2026' } } as unknown as Event;
      component.onPanelActionDateInput(event);
      expect(component.sidePanelForm.get('actionDate')?.touched).toBe(true);
    });

    it('should return empty string for date errors when control is untouched', () => {
      fixture.detectChanges();
      component.onNew();
      expect(component.getPanelTargetDateError()).toBe('');
      expect(component.getPanelActionDateError()).toBe('');
    });
  });

  // ──────────────────────────────────────────────
  // isPanelSaveDisabled
  // ──────────────────────────────────────────────

  describe('isPanelSaveDisabled', () => {
    afterEach(() => component.ngOnDestroy());

    it('should be true when loading', () => {
      fixture.detectChanges();
      component.onNew();
      component.sidePanelLoading.set(true);
      expect(component.isPanelSaveDisabled).toBe(true);
    });

    it('should be true when form is invalid', () => {
      fixture.detectChanges();
      component.onNew();
      expect(component.isPanelSaveDisabled).toBe(true);
    });

    it('should be false when form is valid', () => {
      fixture.detectChanges();
      component.onNew();
      component.sidePanelForm.patchValue({
        communicationType: 'TELE',
        communicationCode: 'COMM'
      });
      expect(component.isPanelSaveDisabled).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // Comments Character Count & Input Validation
  // ──────────────────────────────────────────────

  describe('Comments validation', () => {
    afterEach(() => component.ngOnDestroy());

    it('should return character count', () => {
      fixture.detectChanges();
      component.onNew();
      component.sidePanelForm.patchValue({ comments: 'Hello' });
      expect(component.getPanelCommentsCharacterCount()).toBe('5 / 2000');
    });

    it('should return 0 / 2000 for empty comments', () => {
      fixture.detectChanges();
      component.onNew();
      expect(component.getPanelCommentsCharacterCount()).toBe('0 / 2000');
    });
  });

  // ──────────────────────────────────────────────
  // Send Letter Type/Code Change
  // ──────────────────────────────────────────────

  describe('Send letter type/code change', () => {
    afterEach(() => component.ngOnDestroy());

    it('should load codes on type change in send letter', () => {
      fixture.detectChanges();
      component.onSendLetters();
      serviceSpy.getCommunicationCodes.and.returnValue(of([
        { code: 'COMM', description: 'Communication' }
      ]));

      component.sendLetterForm.patchValue({ communicationType: 'TELE' });
      component.onSendLetterTypeChange();
      expect(serviceSpy.getCommunicationCodes).toHaveBeenCalledWith('TELE');
    });

    it('should clear codes when type cleared in send letter', () => {
      fixture.detectChanges();
      component.onSendLetters();
      component.sendLetterForm.patchValue({ communicationType: '' });
      component.onSendLetterTypeChange();
      expect(component.panelCommunicationCodes().length).toBe(0);
    });

    it('should set code description on code change', () => {
      fixture.detectChanges();
      component.onSendLetters();
      component.panelCommunicationCodes.set([
        { value: 'COMM', label: 'COMM - Communication' }
      ]);
      component.sendLetterForm.patchValue({ communicationCode: 'COMM' });
      component.onSendLetterCodeChange();
      expect(component.panelSelectedCodeDesc()).toBe('Communication');
    });
  });

  // ──────────────────────────────────────────────
  // Letter Code Handling
  // ──────────────────────────────────────────────

  describe('Letter code handling', () => {
    afterEach(() => component.ngOnDestroy());

    it('should set selected letter code and clear generated text', () => {
      fixture.detectChanges();
      component.letterCodes.set([
        { code: 'DALC', description: 'DAL Communication' }
      ]);
      component.onLetterCodeChange('DALC');
      expect(component.selectedLetterCode()?.code).toBe('DALC');
      expect(component.generatedLetterText()).toBe('');
    });

    it('should set null when code not found', () => {
      fixture.detectChanges();
      component.letterCodes.set([]);
      component.onLetterCodeChange('NONEXIST');
      expect(component.selectedLetterCode()).toBeNull();
    });
  });

  // ──────────────────────────────────────────────
  // Update failure in details mode
  // ──────────────────────────────────────────────

  describe('Update communication error handling', () => {
    afterEach(() => component.ngOnDestroy());

    it('should show error on update failure', () => {
      fixture.detectChanges();
      serviceSpy.updateCommunication.and.returnValue(throwError(() => ({ error: { Message: 'Update failed' } })));
      component.openDetailsPanel(mockCommunications[0]);
      component.sidePanelForm.patchValue({ comments: 'Changed' });
      component.sidePanelForm.markAsDirty();
      component.onPanelSave();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Update failed');
      expect(component.sidePanelLoading()).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // Generate & Save Letter
  // ──────────────────────────────────────────────

  describe('Generate letter', () => {
    afterEach(() => component.ngOnDestroy());

    it('should generate letter when form is valid with template', () => {
      fixture.detectChanges();
      component.onSendLetters();
      serviceSpy.generateLetter.and.returnValue(of('Dear Donor, thank you.'));
      component.sendLetterForm.patchValue({
        communicationType: 'TELE',
        communicationCode: 'COMM',
        letterCode: 'DALC'
      });
      component.selectedLetterCode.set({ code: 'DALC', description: 'DAL Comm', letterText: 'Template {{name}}' });
      component.onGenerateLetter();
      expect(serviceSpy.generateLetter).toHaveBeenCalled();
      expect(component.generatedLetterText()).toBe('Dear Donor, thank you.');
    });

    it('should show error when form is invalid', () => {
      fixture.detectChanges();
      component.onSendLetters();
      component.onGenerateLetter();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please fill in all required fields');
    });

    it('should show error when template not loaded', () => {
      fixture.detectChanges();
      component.onSendLetters();
      component.sendLetterForm.patchValue({
        communicationType: 'TELE',
        communicationCode: 'COMM',
        letterCode: 'DALC'
      });
      component.selectedLetterCode.set(null);
      component.onGenerateLetter();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Letter template not loaded. Please select a letter code first.');
    });
  });

  describe('Gap 3.1 & 3.2: Details Mode Update + DLCOM', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    afterEach(() => {
      component.ngOnDestroy();
    });

    it('should check DLCOM access when opening details panel', () => {
      component.selectedCommunication.set(mockCommunications[0]);
      component.onDetails();

      expect(serviceSpy.checkDlcomAccess).toHaveBeenCalled();
    });

    it('should enable comments and actionDate when DLCOM access granted', () => {
      serviceSpy.checkDlcomAccess.and.returnValue(of(true));
      component.selectedCommunication.set(mockCommunications[0]);
      component.onDetails();

      expect(component.dlcomAccessGranted()).toBe(true);
      expect(component.sidePanelForm.get('comments')?.enabled).toBe(true);
      expect(component.sidePanelForm.get('actionDate')?.enabled).toBe(true);
    });

    it('should disable all editable fields when DLCOM access denied', () => {
      serviceSpy.checkDlcomAccess.and.returnValue(of(false));
      component.selectedCommunication.set(mockCommunications[0]);
      component.onDetails();

      expect(component.dlcomAccessGranted()).toBe(false);
      expect(component.sidePanelForm.get('comments')?.disabled).toBe(true);
      expect(component.sidePanelForm.get('actionDate')?.disabled).toBe(true);
    });

    it('should always disable type, code, actionCode, targetDate in details mode', () => {
      component.selectedCommunication.set(mockCommunications[0]);
      component.onDetails();

      expect(component.sidePanelForm.get('communicationType')?.disabled).toBe(true);
      expect(component.sidePanelForm.get('communicationCode')?.disabled).toBe(true);
      expect(component.sidePanelForm.get('actionCode')?.disabled).toBe(true);
      expect(component.sidePanelForm.get('targetDate')?.disabled).toBe(true);
    });

    it('should include SAVE button when DLCOM access granted', () => {
      serviceSpy.checkDlcomAccess.and.returnValue(of(true));
      component.selectedCommunication.set(mockCommunications[0]);
      component.onDetails();

      const buttons = component.getPanelButtons();
      const saveBtn = buttons.find(b => b.label === 'SAVE');
      expect(saveBtn).toBeDefined();
    });

    it('should hide SAVE button when DLCOM access denied', () => {
      serviceSpy.checkDlcomAccess.and.returnValue(of(false));
      component.selectedCommunication.set(mockCommunications[0]);
      component.onDetails();

      const buttons = component.getPanelButtons();
      const saveBtn = buttons.find(b => b.label === 'SAVE');
      expect(saveBtn).toBeUndefined();
    });

    it('should call updateCommunication on save in details mode', () => {
      component.selectedCommunication.set(mockCommunications[0]);
      component.onDetails();
      component.sidePanelForm.get('comments')?.setValue('Updated comment');
      component.sidePanelForm.get('comments')?.markAsDirty();

      component.onPanelSave();

      expect(serviceSpy.updateCommunication).toHaveBeenCalledWith(
        'DN00418881',
        1,
        jasmine.objectContaining({ comDesc: 'Updated comment' })
      );
    });

    it('should only send comDesc and actionDate in update DTO', () => {
      component.selectedCommunication.set(mockCommunications[0]);
      component.onDetails();
      component.sidePanelForm.get('comments')?.setValue('New comment');
      component.sidePanelForm.get('comments')?.markAsDirty();

      component.onPanelSave();

      const dto = serviceSpy.updateCommunication.calls.mostRecent().args[2];
      expect(dto.comDesc).toBe('New comment');
      expect((dto as any).actionCode).toBeUndefined();
      expect((dto as any).targetDate).toBeUndefined();
    });

    it('should show success snackbar after successful update', () => {
      component.selectedCommunication.set(mockCommunications[0]);
      component.onDetails();
      component.sidePanelForm.get('comments')?.setValue('Updated');
      component.sidePanelForm.get('comments')?.markAsDirty();

      component.onPanelSave();

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Communication updated successfully');
    });

    it('should show error snackbar on update failure', () => {
      serviceSpy.updateCommunication.and.returnValue(
        throwError(() => ({ error: { Message: 'Update failed' } }))
      );
      component.selectedCommunication.set(mockCommunications[0]);
      component.onDetails();
      component.sidePanelForm.get('comments')?.setValue('Updated');
      component.sidePanelForm.get('comments')?.markAsDirty();

      component.onPanelSave();

      expect(snackbarSpy.showError).toHaveBeenCalled();
    });

    it('should disable SAVE when form is pristine', () => {
      component.selectedCommunication.set(mockCommunications[0]);
      component.onDetails();

      expect(component.isDetailsSaveDisabled).toBe(true);
    });

    it('should enable SAVE when form is dirty', () => {
      component.selectedCommunication.set(mockCommunications[0]);
      component.onDetails();
      component.sidePanelForm.get('comments')?.setValue('Changed');
      component.sidePanelForm.get('comments')?.markAsDirty();

      expect(component.isDetailsSaveDisabled).toBe(false);
    });

    it('should populate actionDate in details form from existing data', () => {
      component.selectedCommunication.set(mockCommunications[0]);
      component.onDetails();

      const actionDateValue = component.sidePanelForm.get('actionDate')?.value;
      expect(actionDateValue).toBeTruthy();
      expect(moment.isMoment(actionDateValue)).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // HEAD-preserved tests
  // ──────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      component.ngOnInit();
      const spy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('loadDonorHeader - error', () => {
    it('should use input properties on error', () => {
      serviceSpy.getDonorHeader.and.returnValue(throwError(() => new Error('fail')));
      component.donorName = 'Fallback Name';
      component.ngOnInit();
      expect(component.donorHeader()).toBeTruthy();
      expect(component.donorHeader()?.name).toBe('Fallback Name');
    });

    it('should use dash when no input properties on error', () => {
      serviceSpy.getDonorHeader.and.returnValue(throwError(() => new Error('fail')));
      component.donorName = undefined;
      component.ngOnInit();
      expect(component.donorHeader()?.name).toBe('-');
    });
  });

  describe('extractPanelErrorMessage', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return null for non-object error', () => {
      expect(component['extractPanelErrorMessage'](null)).toBeNull();
      expect(component['extractPanelErrorMessage']('string')).toBeNull();
    });

    it('should extract Message from error', () => {
      expect(component['extractPanelErrorMessage']({ error: { Message: 'Test' } })).toBe('Test');
    });

    it('should extract Error from error', () => {
      expect(component['extractPanelErrorMessage']({ error: { Error: 'TestErr' } })).toBe('TestErr');
    });

    it('should extract ErrorResponse.Error', () => {
      expect(component['extractPanelErrorMessage']({ error: { ErrorResponse: { Error: 'Nested' } } })).toBe('Nested');
    });

    it('should map ErrorCode to message', () => {
      expect(component['extractPanelErrorMessage']({ error: { ErrorCode: '18015' } })).toBe('Communication Type is required');
    });

    it('should return null for unknown ErrorCode', () => {
      expect(component['extractPanelErrorMessage']({ error: { ErrorCode: '99999' } })).toBeNull();
    });

    it('should return null for empty error object', () => {
      expect(component['extractPanelErrorMessage']({ error: {} })).toBeNull();
    });
  });

  describe('formatDate', () => {
    it('should format ISO date', () => {
      expect(component.formatDate('2024-01-15')).toBe('15-JAN-2024');
    });

    it('should return dash for null', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should handle invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('-');
    });
  });

  describe('onLetterClick', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should load letter text on click', () => {
      serviceSpy.getLetterText.and.returnValue(of('Dear Donor...'));
      const letter = { letterId: 'L1', letterDate: '2024-01-01', comments: 'Test' } as any;
      component.onLetterClick(letter);
      expect(component.selectedLetter()).toEqual(letter);
      expect(component.letterText()).toBe('Dear Donor...');
    });

    it('should handle empty letter text', () => {
      serviceSpy.getLetterText.and.returnValue(of(''));
      const letter = { letterId: 'L1', letterDate: '2024-01-01', comments: 'Test' } as any;
      component.onLetterClick(letter);
      expect(component.letterText()).toBe('No letter content available');
    });

    it('should handle error loading letter text', () => {
      serviceSpy.getLetterText.and.returnValue(throwError(() => new Error('fail')));
      const letter = { letterId: 'L1', letterDate: '2024-01-01', comments: 'Test' } as any;
      component.onLetterClick(letter);
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load letter content');
    });
  });

  describe('View Letters - error', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should handle error loading letter history', () => {
      serviceSpy.getLetters.and.returnValue(throwError(() => new Error('fail')));
      component.onViewLetters();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load letter history');
    });
  });

  describe('panelTrackByValue and trackByValue', () => {
    it('should return value', () => {
      expect(component.panelTrackByValue(0, { value: 'V1', label: 'Label' })).toBe('V1');
      expect(component.trackByValue(0, { value: 'V2', label: 'Label2' })).toBe('V2');
    });
  });

  describe('trackByCommunication', () => {
    it('should return donorId-sequenceNumber', () => {
      expect(component.trackByCommunication(0, mockCommunications[0])).toBe('DN00418881-1');
    });
  });

  describe('loadLetterCodes - error', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should handle error loading letter codes', () => {
      serviceSpy.getLetterCodes.and.returnValue(throwError(() => new Error('fail')));
      component.onSendLetters();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load letter codes');
    });
  });

  describe('loadPanelLookups', () => {
    beforeEach(() => { fixture.detectChanges(); });
    afterEach(() => { component.ngOnDestroy(); });

    it('should handle empty types response', () => {
      serviceSpy.getCommunicationTypes.and.returnValue(of([]));
      component.onNew();
      expect(component.panelCommunicationTypes().length).toBe(0);
    });

    it('should handle error loading types', () => {
      serviceSpy.getCommunicationTypes.and.returnValue(throwError(() => new Error('fail')));
      component.onNew();
      expect(component.panelCommunicationTypes().length).toBe(0);
    });
  });

  describe('getPanelButtons', () => {
    beforeEach(() => { fixture.detectChanges(); });
    afterEach(() => { component.ngOnDestroy(); });

    it('should return cancel and save buttons for new mode', () => {
      component.onNew();
      const buttons = component.getPanelButtons();
      expect(buttons.length).toBe(2);
      expect(buttons[0].label).toBe('CANCEL');
      expect(buttons[1].label).toBe('SAVE');
    });
  });

  describe('onPanelCodeChange via form', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.onNew();
    });
    afterEach(() => { component.ngOnDestroy(); });

    it('should set code description when code changes', () => {
      component.panelCommunicationCodes.set([
        { value: 'THK', label: 'THK - Thank You' }
      ]);
      component.sidePanelForm.get('communicationCode')?.setValue('THK');
      expect(component.panelSelectedCodeDesc()).toBe('Thank You');
    });

    it('should clear code description when empty', () => {
      component.sidePanelForm.get('communicationCode')?.setValue('');
      expect(component.panelSelectedCodeDesc()).toBe('');
    });
  });

  describe('onPanelActionCodeChange via form', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.onNew();
    });
    afterEach(() => { component.ngOnDestroy(); });

    it('should set action code description', () => {
      component.panelActionCodes.set([
        { value: 'SEND', label: 'SEND - Send Letter' }
      ]);
      component.sidePanelForm.get('actionCode')?.setValue('SEND');
      expect(component.panelSelectedActionCodeDesc()).toBe('Send Letter');
    });

    it('should clear action code description when empty', () => {
      component.sidePanelForm.get('actionCode')?.setValue('');
      expect(component.panelSelectedActionCodeDesc()).toBe('');
    });
  });

  describe('hasPanelVisibleDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.onNew();
    });
    afterEach(() => { component.ngOnDestroy(); });

    it('should return false when no date errors', () => {
      expect(component.hasPanelVisibleDateError).toBe(false);
    });
  });

  describe('onSaveAndPrintLetter', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.onSendLetters();
    });

    it('should show error if form is invalid', () => {
      component.onSaveAndPrintLetter();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please fill in all required fields');
    });

    it('should save and print on success', () => {
      serviceSpy.saveAndPrintLetter.and.returnValue(of({}));
      component.sendLetterForm.patchValue({
        communicationType: 'TELE',
        communicationCode: 'COMM',
        letterCode: 'LC1'
      });
      component.generatedLetterText.set('Letter text');
      component.onSaveAndPrintLetter();
      expect(serviceSpy.saveAndPrintLetter).toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Letter saved successfully');
    });

    it('should handle save error', () => {
      serviceSpy.saveAndPrintLetter.and.returnValue(throwError(() => new Error('fail')));
      component.sendLetterForm.patchValue({
        communicationType: 'TELE',
        communicationCode: 'COMM',
        letterCode: 'LC1'
      });
      component.generatedLetterText.set('Letter text');
      component.onSaveAndPrintLetter();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to save letter');
    });
  });

  describe('onLetterCodeDropdownClosed', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.onSendLetters();
    });

    it('should retrieve letter template when code is selected', () => {
      serviceSpy.retrieveLetterTemplate.and.returnValue(of({ code: 'LC1', letterText: 'Hello' } as any));
      component.sendLetterForm.get('letterCode')?.setValue('LC1');
      component.onLetterCodeDropdownClosed();
      expect(serviceSpy.retrieveLetterTemplate).toHaveBeenCalledWith('LC1');
    });

    it('should handle template retrieval error', () => {
      serviceSpy.retrieveLetterTemplate.and.returnValue(throwError(() => new Error('fail')));
      component.sendLetterForm.get('letterCode')?.setValue('LC1');
      component.onLetterCodeDropdownClosed();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to retrieve letter template');
    });

    it('should not retrieve if no letter code selected', () => {
      component.sendLetterForm.get('letterCode')?.setValue('');
      component.onLetterCodeDropdownClosed();
      expect(serviceSpy.retrieveLetterTemplate).not.toHaveBeenCalled();
    });
  });

  describe('onGenerateLetter - handle error', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.onSendLetters();
    });

    it('should handle generate error', () => {
      serviceSpy.generateLetter.and.returnValue(throwError(() => new Error('fail')));
      component.sendLetterForm.patchValue({
        communicationType: 'TELE',
        communicationCode: 'COMM',
        letterCode: 'LC1'
      });
      component.selectedLetterCode.set({ code: 'LC1', letterText: 'Template' } as any);
      component.onGenerateLetter();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to generate letter');
    });
  });

  describe('onSendLetterButtonClick', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.onSendLetters();
    });

    it('should close on close action', () => {
      component.onSendLetterButtonClick('close');
      expect(component.sendLetterOpen()).toBe(false);
    });

    it('should call save and print on action', () => {
      spyOn(component, 'onSaveAndPrintLetter');
      component.onSendLetterButtonClick('save & print');
      expect(component.onSaveAndPrintLetter).toHaveBeenCalled();
    });

    it('should call generate on action', () => {
      spyOn(component, 'onGenerateLetter');
      component.onSendLetterButtonClick('generate');
      expect(component.onGenerateLetter).toHaveBeenCalled();
    });

    it('should retrieve letter template on retrieve action', () => {
      serviceSpy.retrieveLetterTemplate.and.returnValue(of({ code: 'LC1', letterText: 'Test' } as any));
      component.sendLetterForm.get('letterCode')?.setValue('LC1');
      component.onSendLetterButtonClick('retrieve');
      expect(serviceSpy.retrieveLetterTemplate).toHaveBeenCalledWith('LC1');
    });
  });

  describe('panelPreventSpaceInput', () => {
    it('should prevent space input', () => {
      const event = { key: ' ', preventDefault: jasmine.createSpy() } as any;
      component.panelPreventSpaceInput(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('searchBarConfig', () => {
    it('should have correct configuration', () => {
      expect(component.searchBarConfig.placeholder).toBe('Search by Communication Type');
      expect(component.searchBarConfig.minLength).toBe(2);
      expect(component.searchBarConfig.debounceTime).toBe(300);
      expect(component.searchBarConfig.searchOnEnterOnly).toBe(true);
    });
  });

  describe('dataSource computed', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return communications array', () => {
      expect(component.dataSource()).toEqual(component.communications());
    });

    it('should update when communications change', () => {
      const newComms = [{ ...mockCommunications[0], sequenceNumber: 99 }];
      component.communications.set(newComms);
      expect(component.dataSource().length).toBe(1);
      expect(component.dataSource()[0].sequenceNumber).toBe(99);
    });
  });
});
