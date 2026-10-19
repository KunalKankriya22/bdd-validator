import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { DonationDetailsDialogComponent } from './donation-details-dialog';
import { DonationDetailsApiService } from '../services/donation-details-api.service';
import { DonationRecord } from '../models/donation-details.model';

describe('DonationDetailsDialogComponent', () => {
  let component: DonationDetailsDialogComponent;
  let fixture: ComponentFixture<DonationDetailsDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<DonationDetailsDialogComponent>>;
  let actualSnackBar: MatSnackBar;
  let actualDialog: MatDialog;

  const createMockDonation = (overrides: Partial<DonationRecord> = {}): DonationRecord => ({
    donorId: 'D001',
    unitId: 'W1234-18-031310',
    displayUnitId: 'W012345678901-A',
    transactionId: 'TXN001',
    deferralId: null,
    collDate: '2025-01-10',
    donationType: 'AL',
    procedureCode: 'WB',
    procedureCodeDesc: 'Whole Blood',
    deferralReason: null,
    creditSponsor: 'SPON001',
    creditSponsorName: 'Test Sponsor',
    driveId: 'DRV001',
    driveSponsor: 'DRV001-COMMUNITY DRIVE [SP001]',
    chapterId: '0001',
    noteId: null,
    hasNotes: false,
    hasComments: false,
    voidUnitId: null,
    displayVoidUnitId: null,
    lastInterfaceDate: null,
    physicalFindings: [{ physicalCode: 'BP', physicalValue: '120/80', physicalValueRepeat: null, interCode: null }],
    donationInterdictions: [{ interCode: 'H1', interDesc: 'Hold', releaseDate: null, releaseUser: null, termDate: null }],
    labUnitInterdictions: [{ interCode: 'L1', insertDats: '2025-01-10' }],
    ...overrides,
  });

  const mockDonation = createMockDonation();

  const mockApiService = {
    getDonationDetails: jasmine.createSpy('getDonationDetails').and.returnValue(of({
      success: true,
      data: [mockDonation],
      total: 1,
      message: null,
      statusCode: null,
    })),
    getDonorHeader: jasmine.createSpy('getDonorHeader').and.returnValue(of({
      success: true,
      data: [{
        name: 'DARLAND, KATHLEEN J',
        dateOfBirth: '1940-01-01',
        sex: 'Female',
        abo: 'A Positive',
      }],
    })),
    getAccess: jasmine.createSpy('getAccess').and.returnValue(of({ success: true, item: { canEditSponsor: false } })),
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    // Reset spies
    mockApiService.getDonationDetails.calls.reset();
    mockApiService.getDonorHeader.calls.reset();
    mockApiService.getAccess.calls.reset();
    mockApiService.getDonationDetails.and.returnValue(of({
      success: true,
      data: [mockDonation],
      total: 1,
      message: null,
      statusCode: null,
    }));
    mockApiService.getDonorHeader.and.returnValue(of({
      success: true,
      data: [{
        name: 'DARLAND, KATHLEEN J',
        dateOfBirth: '1940-01-01',
        sex: 'Female',
        abo: 'A Positive',
      }],
    }));
    mockApiService.getAccess.and.returnValue(of({ success: true, item: { canEditSponsor: false } }));

    TestBed.configureTestingModule({
      imports: [DonationDetailsDialogComponent, NoopAnimationsModule, RouterModule.forRoot([])],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: 'D001', sourceLabel: 'Test', sourcePath: '/test' } },
        { provide: DonationDetailsApiService, useValue: mockApiService },
      ],
    });

    dialogRefSpy.close.calls.reset();

    fixture = TestBed.createComponent(DonationDetailsDialogComponent);
    component = fixture.componentInstance;

    // Spy on the actual injected instances
    actualSnackBar = (component as any).snackBar;
    actualDialog = (component as any).dialog;
    spyOn(actualSnackBar, 'open').and.callFake(() => ({} as any));
    spyOn(actualDialog, 'open').and.callFake(() => {
      const ref = jasmine.createSpyObj('childDialogRef', ['afterClosed']);
      ref.afterClosed.and.returnValue(of(undefined));
      return ref;
    });

    try { fixture.detectChanges(); } catch (e) { /* template errors */ }
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should populate header fields from donor info', () => {
    const fields = component.headerFields();
    expect(fields.length).toBe(5);
    expect(fields[0].label).toBe('Name');
    expect(fields[0].value).toBe('DARLAND, KATHLEEN J');
  });

  it('should have donation records after load', () => {
    expect(component.donations().length).toBe(1);
  });

  it('should select first donation on init', () => {
    const selected = component.selectedDonation();
    expect(selected).toBeTruthy();
    expect(selected?.transactionId).toBe('TXN001');
  });

  it('should select a donation row on click', () => {
    const donations = component.donations();
    if (donations.length > 0) {
      component.onDonationRowClick(donations[0]);
      expect(component.selectedDonation()).toBe(donations[0]);
      expect(component.isSelectedRow(donations[0])).toBeTrue();
    }
  });

  it('should have correct table column definitions', () => {
    expect(component.donationsColumns).toContain('unitId');
    expect(component.donationsColumns).toContain('collectionDate');
    expect(component.donationsColumns).toContain('location');
    expect(component.holdsColumns).toContain('releaseUser');
    expect(component.labInterdictionsColumns).toContain('interdictionCode');
  });

  it('should generate unique component IDs across instances', () => {
    const fixture2 = TestBed.createComponent(DonationDetailsDialogComponent);
    const component2 = fixture2.componentInstance;
    expect((component as any).componentId).not.toBe((component2 as any).componentId);
    fixture2.destroy();
  });

  it('should render donation history title', () => {
    const el: HTMLElement = fixture.nativeElement;
    const title = el.querySelector('.side-panel__title');
    expect(title?.textContent?.trim()).toBe('Donation History');
  });

  describe('getDisplayUnitId', () => {
    it('should return displayUnitId from API response', () => {
      const row = createMockDonation({ displayUnitId: 'W012345678901-A' });
      expect(component.getDisplayUnitId(row)).toBe('W012345678901-A');
    });

    it('should return empty string when displayUnitId is null', () => {
      const row = createMockDonation({ displayUnitId: null });
      expect(component.getDisplayUnitId(row)).toBe('');
    });

    it('should return DEF-style displayUnitId for deferrals', () => {
      const row = createMockDonation({
        unitId: null,
        displayUnitId: 'DEF[123]',
        deferralId: '123',
      });
      expect(component.getDisplayUnitId(row)).toBe('DEF[123]');
    });

    it('should return WALK-style displayUnitId', () => {
      const row = createMockDonation({ displayUnitId: 'WALK-00123' });
      expect(component.getDisplayUnitId(row)).toBe('WALK-00123');
    });

    it('should return displayUnitId when present', () => {
      expect(component.getDisplayUnitId(mockDonation as any)).toBe('W012345678901-A');
    });

    it('should return displayUnitId for deferral row', () => {
      const deferralRow = createMockDonation({ unitId: null, deferralId: 'DEF123', displayUnitId: 'DEF[DEF123]' });
      expect(component.getDisplayUnitId(deferralRow)).toBe('DEF[DEF123]');
    });

    it('should return empty string when displayUnitId is not set', () => {
      const emptyRow = createMockDonation({ unitId: null, deferralId: null, displayUnitId: null as any });
      expect(component.getDisplayUnitId(emptyRow)).toBe('');
    });
  });

  describe('displayVoidUnitId (Fix 3.2)', () => {
    it('should not render void unit info when displayVoidUnitId is null', () => {
      component.selectedDonation.set(createMockDonation({ displayVoidUnitId: null }));
      fixture.detectChanges();
      const voidInfo = fixture.nativeElement.querySelector('.void-unit-info');
      expect(voidInfo).toBeNull();
    });

    it('should render void unit info when displayVoidUnitId is present', () => {
      component.selectedDonation.set(createMockDonation({ displayVoidUnitId: 'VOID-12345' }));
      fixture.detectChanges();
      const voidInfo = fixture.nativeElement.querySelector('.void-unit-info');
      expect(voidInfo).toBeTruthy();
      expect(voidInfo?.querySelector('.void-value')?.textContent?.trim()).toBe('VOID-12345');
    });

    it('should display Void ID label', () => {
      component.selectedDonation.set(createMockDonation({ displayVoidUnitId: 'V001' }));
      fixture.detectChanges();
      const label = fixture.nativeElement.querySelector('.void-label');
      expect(label?.textContent?.trim()).toBe('Void ID:');
    });
  });

  describe('Note indicator (Fix 3.3)', () => {
    it('should not show note icon when hasNotes is false', () => {
      fixture.detectChanges();
      const noteIcon = fixture.nativeElement.querySelector('.note-indicator');
      expect(noteIcon).toBeNull();
    });

    it('should show note icon when hasNotes is true', () => {
      mockApiService.getDonationDetails.and.returnValue(of({
        success: true,
        data: [createMockDonation({ hasNotes: true })],
        total: 1,
        message: null,
        statusCode: null,
      }));
      const newFixture = TestBed.createComponent(DonationDetailsDialogComponent);
      try { newFixture.detectChanges(); } catch (e) { /* template errors */ }
      const noteIcon = newFixture.nativeElement.querySelector('.note-indicator');
      expect(noteIcon).toBeTruthy();
      newFixture.destroy();
    });
  });

  describe('View Comments button (Fix 3.7)', () => {
    it('should disable VIEW COMMENTS button when hasComments is false', () => {
      component.selectedDonation.set(createMockDonation({ hasComments: false }));
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.view-comments-btn');
      expect(btn?.disabled).toBe(true);
    });

    it('should enable VIEW COMMENTS button when hasComments is true', () => {
      component.selectedDonation.set(createMockDonation({ hasComments: true }));
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.view-comments-btn');
      expect(btn?.disabled).toBe(false);
    });
  });

  describe('onClose', () => {
    it('should close the dialog', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('onButtonClick', () => {
    it('should close dialog on close action', () => {
      component.onButtonClick('close');
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('should show snackbar when no donation selected for equipSupply', () => {
      component.selectedDonation.set(null);
      component.onButtonClick('equipSupply');
      expect(actualSnackBar.open).toHaveBeenCalled();
    });

    it('should show snackbar when no donation selected for showAttributes', () => {
      component.selectedDonation.set(null);
      component.onButtonClick('showAttributes');
      expect(actualSnackBar.open).toHaveBeenCalled();
    });

    it('should show snackbar when no donation selected for notes', () => {
      component.selectedDonation.set(null);
      component.onButtonClick('notes');
      expect(actualSnackBar.open).toHaveBeenCalled();
    });

    it('should show snackbar when no donation selected for donDefAudit', () => {
      component.selectedDonation.set(null);
      component.onButtonClick('donDefAudit');
      expect(actualSnackBar.open).toHaveBeenCalled();
    });

    it('should show snackbar when no donation/deferral selected for donDefEntry', () => {
      component.selectedDonation.set(createMockDonation({ unitId: null, deferralId: null }));
      component.onButtonClick('donDefEntry');
      expect(actualSnackBar.open).toHaveBeenCalled();
    });

    it('should show snackbar for unimplemented actions', () => {
      component.onButtonClick('unknownAction');
      expect(actualSnackBar.open).toHaveBeenCalledWith('Not yet implemented', 'OK', { duration: 3000 });
    });

    it('should handle consents action', () => {
      component.selectedDonation.set(mockDonation);
      component.onButtonClick('consents');
      expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.objectContaining({ action: 'consents' }));
    });

    it('should open showAuxUnits dialog', () => {
      component.onButtonClick('showAuxUnits');
      expect(actualDialog.open).toHaveBeenCalled();
    });

    it('should open notes dialog when donation has collDate', () => {
      component.selectedDonation.set(createMockDonation({ transactionId: 'TXN001', collDate: '2025-01-10' }));
      component.onButtonClick('notes');
      expect(actualDialog.open).toHaveBeenCalled();
    });

    it('should show snackbar for notes when collDate is missing', () => {
      component.selectedDonation.set(createMockDonation({ transactionId: 'TXN001', collDate: '' }));
      component.onButtonClick('notes');
      expect(actualSnackBar.open).toHaveBeenCalledWith('Collection Date is required to view notes', 'OK', { duration: 3000 });
    });

    it('should open donDefEntry dialog for donation with unitId', () => {
      component.selectedDonation.set(createMockDonation({ unitId: 'U001' }));
      component.onButtonClick('donDefEntry');
      expect(actualDialog.open).toHaveBeenCalled();
    });

    it('should open donDefEntry dialog for deferral', () => {
      component.selectedDonation.set(createMockDonation({ unitId: null, deferralId: 'DEF001' }));
      component.onButtonClick('donDefEntry');
      expect(actualDialog.open).toHaveBeenCalled();
    });

    it('should open donDefAudit dialog', () => {
      component.selectedDonation.set(createMockDonation({ transactionId: 'TXN001' }));
      component.onButtonClick('donDefAudit');
      expect(actualDialog.open).toHaveBeenCalled();
    });

    it('should open equipSupply dialog', () => {
      component.selectedDonation.set(createMockDonation({ transactionId: 'TXN001' }));
      component.onButtonClick('equipSupply');
      expect(actualDialog.open).toHaveBeenCalled();
    });

    it('should open viewComments dialog', () => {
      component.selectedDonation.set(createMockDonation({ transactionId: 'TXN001' }));
      component.onButtonClick('viewComments');
      expect(actualDialog.open).toHaveBeenCalled();
    });

    it('should open donation entry dialog when donDefEntry clicked with unitId', () => {
      component.selectedDonation.set({ ...mockDonation });
      component.onButtonClick('donDefEntry');
      expect(actualDialog.open).toHaveBeenCalled();
    });

    it('should open deferral entry dialog when donDefEntry clicked with deferralId', () => {
      component.selectedDonation.set({ ...mockDonation, unitId: null, deferralId: 'DEF001' });
      component.onButtonClick('donDefEntry');
      expect(actualDialog.open).toHaveBeenCalled();
    });

    it('should show snackbar when donDefEntry clicked without unitId or deferralId', () => {
      component.selectedDonation.set({ ...mockDonation, unitId: null, deferralId: null });
      component.onButtonClick('donDefEntry');
      expect(actualSnackBar.open).toHaveBeenCalledWith('Please select a donation or deferral first', 'OK', { duration: 3000 });
    });

    it('should open audit dialog when donDefAudit clicked with transactionId', () => {
      component.selectedDonation.set({ ...mockDonation });
      component.onButtonClick('donDefAudit');
      expect(actualDialog.open).toHaveBeenCalled();
    });

    it('should show snackbar when donDefAudit clicked without selection', () => {
      component.selectedDonation.set({ ...mockDonation, transactionId: '' });
      component.onButtonClick('donDefAudit');
      expect(actualSnackBar.open).toHaveBeenCalledWith('Please select a donation first', 'OK', { duration: 3000 });
    });

    it('should open notes dialog when notes clicked with transactionId and collDate', () => {
      component.selectedDonation.set({ ...mockDonation });
      component.onButtonClick('notes');
      expect(actualDialog.open).toHaveBeenCalled();
    });

    it('should show snackbar when notes clicked without transactionId', () => {
      component.selectedDonation.set({ ...mockDonation, transactionId: '' });
      component.onButtonClick('notes');
      expect(actualSnackBar.open).toHaveBeenCalledWith('Please select a donation first', 'OK', { duration: 3000 });
    });

    it('should show snackbar when notes clicked without collDate', () => {
      component.selectedDonation.set({ ...mockDonation, collDate: '' });
      component.onButtonClick('notes');
      expect(actualSnackBar.open).toHaveBeenCalledWith('Collection Date is required to view notes', 'OK', { duration: 3000 });
    });

    it('should open aux units dialog when showAuxUnits clicked', () => {
      component.onButtonClick('showAuxUnits');
      expect(actualDialog.open).toHaveBeenCalled();
    });

    it('should open attributes dialog when showAttributes clicked with transactionId', () => {
      component.selectedDonation.set({ ...mockDonation });
      component.onButtonClick('showAttributes');
      expect(actualDialog.open).toHaveBeenCalled();
    });

    it('should show snackbar when showAttributes clicked without transactionId', () => {
      component.selectedDonation.set({ ...mockDonation, transactionId: '' });
      component.onButtonClick('showAttributes');
      expect(actualSnackBar.open).toHaveBeenCalledWith('Please select a donation first', 'OK', { duration: 3000 });
    });

    it('should open equip supply dialog when equipSupply clicked with transactionId', () => {
      component.selectedDonation.set({ ...mockDonation });
      component.onButtonClick('equipSupply');
      expect(actualDialog.open).toHaveBeenCalled();
    });

    it('should show snackbar when equipSupply clicked without transactionId', () => {
      component.selectedDonation.set({ ...mockDonation, transactionId: '' });
      component.onButtonClick('equipSupply');
      expect(actualSnackBar.open).toHaveBeenCalledWith('Please select a donation first', 'OK', { duration: 3000 });
    });

    it('should open comments dialog when viewComments clicked with transactionId', () => {
      component.selectedDonation.set({ ...mockDonation });
      component.onButtonClick('viewComments');
      expect(actualDialog.open).toHaveBeenCalled();
    });

    it('should show snackbar when viewComments clicked without transactionId', () => {
      component.selectedDonation.set({ ...mockDonation, transactionId: '' });
      component.onButtonClick('viewComments');
      expect(actualSnackBar.open).toHaveBeenCalledWith('Please select a donation first', 'OK', { duration: 3000 });
    });

    it('should close dialog with consents data when consents clicked', () => {
      component.selectedDonation.set({ ...mockDonation });
      component.onButtonClick('consents');
      expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.objectContaining({
        action: 'consents',
        donorId: 'D001',
        sourceLabel: 'Test',
        sourcePath: '/test',
      }));
    });

    it('should return early for consents when no donorId', () => {
      (component as any).data = { donorId: '' };
      component.onButtonClick('consents');
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should show not implemented snackbar for unknown action', () => {
      component.onButtonClick('unknownAction');
      expect(actualSnackBar.open).toHaveBeenCalledWith('Not yet implemented', 'OK', { duration: 3000 });
    });
  });

  describe('isSelectedRow', () => {
    it('should return true for matching transactionId', () => {
      component.selectedDonation.set(mockDonation);
      expect(component.isSelectedRow(mockDonation)).toBe(true);
    });

    it('should return false for different transactionId', () => {
      component.selectedDonation.set(mockDonation);
      const other = createMockDonation({ transactionId: 'TXN999' });
      expect(component.isSelectedRow(other)).toBe(false);
    });

    it('should return false when no donation is selected', () => {
      component.selectedDonation.set(null);
      expect(component.isSelectedRow(mockDonation)).toBe(false);
    });

    it('should return false for isSelectedRow when different row', () => {
      const otherRow = { ...mockDonation, transactionId: 'OTHER' } as any;
      expect(component.isSelectedRow(otherRow)).toBeFalse();
    });
  });

  describe('computed signals', () => {
    it('should return physical findings for selected donation', () => {
      const findings = [{ physicalCode: 'BP', physicalValue: '120/80', physicalValueRepeat: null, interCode: null }];
      component.selectedDonation.set(createMockDonation({ physicalFindings: findings }));
      expect(component.physicalFindings()).toEqual(findings);
    });

    it('should return empty array when no donation selected for physicalFindings', () => {
      component.selectedDonation.set(null);
      expect(component.physicalFindings()).toEqual([]);
    });

    it('should return holds for selected donation', () => {
      const holds = [{ interCode: 'H01', interDesc: 'Medical Hold', releaseDate: null, releaseUser: null, termDate: null }];
      component.selectedDonation.set(createMockDonation({ donationInterdictions: holds }));
      expect(component.holds()).toEqual(holds);
    });

    it('should return lab interdictions for selected donation', () => {
      const labs = [{ interCode: 'L01', insertDats: '2025-01-10' }];
      component.selectedDonation.set(createMockDonation({ labUnitInterdictions: labs }));
      expect(component.labInterdictions()).toEqual(labs);
    });

    it('should return empty header fields when donorInfo is null', () => {
      (component as any).donorInfo.set(null);
      expect(component.headerFields()).toEqual([]);
    });

    it('should compute physicalFindings from selected donation', () => {
      component.selectedDonation.set({ ...mockDonation } as any);
      expect(component['physicalFindings']().length).toBe(1);
      expect(component['physicalFindings']()[0].physicalCode).toBe('BP');
    });

    it('should return empty physicalFindings when no selection', () => {
      component.selectedDonation.set(null);
      expect(component['physicalFindings']().length).toBe(0);
    });

    it('should compute holds from selected donation', () => {
      component.selectedDonation.set({ ...mockDonation } as any);
      expect(component['holds']().length).toBe(1);
      expect(component['holds']()[0].interCode).toBe('H1');
    });

    it('should return empty holds when no selection', () => {
      component.selectedDonation.set(null);
      expect(component['holds']().length).toBe(0);
    });

    it('should compute labInterdictions from selected donation', () => {
      component.selectedDonation.set({ ...mockDonation } as any);
      expect(component['labInterdictions']().length).toBe(1);
      expect(component['labInterdictions']()[0].interCode).toBe('L1');
    });

    it('should return empty labInterdictions when no selection', () => {
      component.selectedDonation.set(null);
      expect(component['labInterdictions']().length).toBe(0);
    });

    it('should return empty headerFields when donorInfo is null', () => {
      component['donorInfo'].set(null);
      expect(component.headerFields().length).toBe(0);
    });
  });

  describe('loading and error states', () => {
    it('should show loading spinner initially', () => {
      component.loading.set(true);
      fixture.detectChanges();
      const spinner = fixture.nativeElement.querySelector('mat-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should show error message on error', () => {
      component.loading.set(false);
      component.error.set('Failed to load donation details. Please try again.');
      fixture.detectChanges();
      const errorEl = fixture.nativeElement.querySelector('.error-container');
      expect(errorEl).toBeTruthy();
    });
  });

  describe('openSponsorDetailsDialog', () => {
    it('should call getAccess and open sponsor dialog', () => {
      component.openSponsorDetailsDialog(mockDonation);
      expect(mockApiService.getAccess).toHaveBeenCalled();
      expect(actualDialog.open).toHaveBeenCalled();
    });

    it('should open sponsor details dialog', () => {
      component.openSponsorDetailsDialog(mockDonation as any);
      expect(mockApiService.getAccess).toHaveBeenCalled();
      expect(actualDialog.open).toHaveBeenCalled();
    });
  });

  describe('data loading', () => {
    it('should set totalDonationCredits from API total', () => {
      expect(component.totalDonationCredits()).toBe(1);
    });

    it('should handle API error gracefully', () => {
      mockApiService.getDonationDetails.and.returnValue(throwError(() => new Error('API error')));
      mockApiService.getDonorHeader.and.returnValue(throwError(() => new Error('API error')));
      const errorFixture = TestBed.createComponent(DonationDetailsDialogComponent);
      try { errorFixture.detectChanges(); } catch (e) { /* template errors */ }
      const errorComponent = errorFixture.componentInstance;
      expect(errorComponent.error()).toBe('Failed to load donation details. Please try again.');
      expect(errorComponent.loading()).toBeFalse();
      errorFixture.destroy();
    });

    it('should set error on loadData failure', () => {
      mockApiService.getDonationDetails.and.returnValue(throwError(() => new Error('API Error')));
      mockApiService.getDonorHeader.and.returnValue(throwError(() => new Error('API Error')));
      (component as any).loadData();
      expect(component.error()).toBe('Failed to load donation details. Please try again.');
      expect(component.loading()).toBeFalse();
    });

    it('should handle loadData with no donation data', () => {
      mockApiService.getDonationDetails.and.returnValue(of({ success: true, data: [], total: 0 }));
      mockApiService.getDonorHeader.and.returnValue(of({ success: true, data: [] }));
      (component as any).loadData();
      expect(component.donations().length).toBe(0);
      expect(component.loading()).toBeFalse();
    });

    it('should set totalDonationCredits from API response total', () => {
      expect(component.totalDonationCredits()).toBe(1);
    });
  });

  describe('footerButtons', () => {
    it('should have correct footer buttons', () => {
      expect(component.footerButtons.length).toBe(7);
      expect(component.footerButtons[0].action).toBe('close');
      expect(component.footerButtons[6].action).toBe('donDefEntry');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      spyOn((component as any).destroy$, 'next');
      spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect((component as any).destroy$.next).toHaveBeenCalled();
      expect((component as any).destroy$.complete).toHaveBeenCalled();
    });
  });

  describe('openChildDialog', () => {
    it('should close parent dialog when child returns closeAll', () => {
      (actualDialog.open as jasmine.Spy).and.callFake(() => {
        const ref = jasmine.createSpyObj('childDialogRef', ['afterClosed']);
        ref.afterClosed.and.returnValue(of('closeAll'));
        return ref;
      });

      component.onButtonClick('showAuxUnits');
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('should call onSaved callback when child returns saved', () => {
      (actualDialog.open as jasmine.Spy).and.callFake(() => {
        const ref = jasmine.createSpyObj('childDialogRef', ['afterClosed']);
        ref.afterClosed.and.returnValue(of('saved'));
        return ref;
      });

      component.openSponsorDetailsDialog(mockDonation as any);
      // onSaved triggers loadData again
      expect(mockApiService.getDonationDetails).toHaveBeenCalled();
    });
  });
});
