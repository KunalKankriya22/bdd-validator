import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';
import { SponsorDetailsDialogComponent } from './sponsor-details-dialog';
import { DonationDetailsApiService } from '../services/donation-details-api.service';
import { SponsorDetailsDialogData } from '../models/donation-details.model';

describe('SponsorDetailsDialogComponent', () => {
  let component: SponsorDetailsDialogComponent;
  let fixture: ComponentFixture<SponsorDetailsDialogComponent>;
  let dialogRefSpy: { close: jest.Mock };
  let snackBarOpenSpy: jest.SpyInstance;
  let mockApiService: {
    searchSponsors: jest.Mock;
    updateCreditSponsor: jest.Mock;
  };

  const defaultDialogData: SponsorDetailsDialogData = {
    unitId: 'UNIT001',
    collDate: '2025-03-15',
    driveId: 'DRV001',
    creditSponsor: 'SPONSOR1',
    creditSponsorName: 'Test Sponsor',
    canEditSponsor: true,
  };

  const mockSponsors = [
    { sponsorId: 'SP1', name: 'Sponsor One' },
    { sponsorId: 'SP2', name: 'Sponsor Two' },
    { sponsorId: 'SP3', name: null },
  ];

  function createComponent(dialogData?: Partial<SponsorDetailsDialogData>) {
    const data = { ...defaultDialogData, ...dialogData };
    dialogRefSpy = { close: jest.fn() };
    mockApiService = {
      searchSponsors: jest.fn().mockReturnValue(of({ success: true, data: mockSponsors })),
      updateCreditSponsor: jest.fn().mockReturnValue(of({ success: true, item: true })),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SponsorDetailsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: DonationDetailsApiService, useValue: mockApiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SponsorDetailsDialogComponent);
    component = fixture.componentInstance;
    snackBarOpenSpy = jest.spyOn(component['snackBar'], 'open');
  }

  beforeEach(() => {
    createComponent();
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // --- ngOnInit ---

  describe('ngOnInit', () => {
    it('should load sponsors when creditSponsor is provided', () => {
      expect(mockApiService.searchSponsors).toHaveBeenCalledWith('SPONSOR1');
      expect(component.sponsors().length).toBe(3);
    });

    it('should not load sponsors when creditSponsor is null', () => {
      createComponent({ creditSponsor: null });
      fixture.detectChanges();
      expect(mockApiService.searchSponsors).not.toHaveBeenCalled();
      expect(component.sponsors()).toEqual([]);
    });

    it('should not load sponsors when creditSponsor is empty string', () => {
      createComponent({ creditSponsor: '' });
      fixture.detectChanges();
      expect(mockApiService.searchSponsors).not.toHaveBeenCalled();
    });
  });

  // --- ngOnDestroy ---

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySpy = jest.spyOn(component['destroy$'], 'next');
      const completeSpy = jest.spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // --- selectedSponsorName computed ---

  describe('selectedSponsorName', () => {
    it('should return "-" when no sponsor is selected', () => {
      expect(component.selectedSponsorName()).toBe('-');
    });

    it('should return sponsor name when a matching sponsor is selected', () => {
      component.selectedSponsorId.set('SP1');
      expect(component.selectedSponsorName()).toBe('Sponsor One');
    });

    it('should return "-" when selected sponsor id does not match any sponsor', () => {
      component.selectedSponsorId.set('NONEXISTENT');
      expect(component.selectedSponsorName()).toBe('-');
    });

    it('should return "-" when matching sponsor has null name', () => {
      component.selectedSponsorId.set('SP3');
      expect(component.selectedSponsorName()).toBe('-');
    });
  });

  // --- onSponsorSearch ---

  describe('onSponsorSearch', () => {
    it('should call loadSponsors when search text has 3 or more characters', () => {
      mockApiService.searchSponsors.mockClear();
      component.onSponsorSearch('ABC');
      expect(mockApiService.searchSponsors).toHaveBeenCalledWith('ABC');
    });

    it('should call loadSponsors when search text has more than 3 characters', () => {
      mockApiService.searchSponsors.mockClear();
      component.onSponsorSearch('ABCDE');
      expect(mockApiService.searchSponsors).toHaveBeenCalledWith('ABCDE');
    });

    it('should not call loadSponsors when search text has fewer than 3 characters', () => {
      mockApiService.searchSponsors.mockClear();
      component.onSponsorSearch('AB');
      expect(mockApiService.searchSponsors).not.toHaveBeenCalled();
    });

    it('should not call loadSponsors when search text is empty', () => {
      mockApiService.searchSponsors.mockClear();
      component.onSponsorSearch('');
      expect(mockApiService.searchSponsors).not.toHaveBeenCalled();
    });

    it('should update sponsors signal with response data', () => {
      const newSponsors = [{ sponsorId: 'NEW1', name: 'New Sponsor' }];
      mockApiService.searchSponsors.mockReturnValue(of({ success: true, data: newSponsors }));
      component.onSponsorSearch('NEW');
      expect(component.sponsors()).toEqual(newSponsors);
    });

    it('should set sponsors to empty array when response data is null', () => {
      mockApiService.searchSponsors.mockReturnValue(of({ success: true, data: null }));
      component.onSponsorSearch('TEST');
      expect(component.sponsors()).toEqual([]);
    });
  });

  // --- onSave ---

  describe('onSave', () => {
    it('should not call API when sponsorId is null', () => {
      component.selectedSponsorId.set(null);
      component.onSave();
      expect(mockApiService.updateCreditSponsor).not.toHaveBeenCalled();
    });

    it('should not call API when unitId is null', () => {
      createComponent({ unitId: null });
      fixture.detectChanges();
      component.selectedSponsorId.set('SP1');
      component.onSave();
      expect(mockApiService.updateCreditSponsor).not.toHaveBeenCalled();
    });

    it('should not set saving to true when early return', () => {
      component.selectedSponsorId.set(null);
      component.onSave();
      expect(component.saving()).toBe(false);
    });

    it('should set saving to true during save', () => {
      const saveSubject = new Subject<any>();
      mockApiService.updateCreditSponsor.mockReturnValue(saveSubject.asObservable());
      component.selectedSponsorId.set('SP1');
      component.onSave();
      expect(component.saving()).toBe(true);
    });

    it('should call updateCreditSponsor with correct parameters on success', () => {
      component.selectedSponsorId.set('SP1');
      component.onSave();
      expect(mockApiService.updateCreditSponsor).toHaveBeenCalledWith('UNIT001', '2025-03-15', 'SP1');
    });

    it('should show success snackbar on successful save', () => {
      component.selectedSponsorId.set('SP1');
      component.onSave();
      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Credit sponsor updated successfully',
        'Close',
        {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        },
      );
    });

    it('should set saving to false after successful save', () => {
      component.selectedSponsorId.set('SP1');
      component.onSave();
      expect(component.saving()).toBe(false);
    });

    it('should close dialog with "saved" on successful save', () => {
      component.selectedSponsorId.set('SP1');
      component.onSave();
      expect(dialogRefSpy.close).toHaveBeenCalledWith('saved');
    });

    it('should show error snackbar on save failure', () => {
      mockApiService.updateCreditSponsor.mockReturnValue(throwError(() => new Error('Server error')));
      component.selectedSponsorId.set('SP1');
      component.onSave();
      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Error updating credit sponsor',
        'Close',
        {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar'],
        },
      );
    });

    it('should set saving to false after save failure', () => {
      mockApiService.updateCreditSponsor.mockReturnValue(throwError(() => new Error('Server error')));
      component.selectedSponsorId.set('SP1');
      component.onSave();
      expect(component.saving()).toBe(false);
    });

    it('should not close dialog on save failure', () => {
      mockApiService.updateCreditSponsor.mockReturnValue(throwError(() => new Error('Server error')));
      component.selectedSponsorId.set('SP1');
      component.onSave();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });
  });

  // --- onCancel ---

  describe('onCancel', () => {
    it('should close the dialog without a result', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  // --- onBack ---

  describe('onBack', () => {
    it('should close the dialog without a result', () => {
      component.onBack();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  // --- onClose ---

  describe('onClose', () => {
    it('should close the dialog with "closeAll"', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalledWith('closeAll');
    });
  });

  // --- formatDate ---

  describe('formatDate', () => {
    it('should return "-" for null input', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should format a valid date string correctly', () => {
      expect(component.formatDate('2025-01-15')).toBe('15-JAN-2025');
    });

    it('should format dates in different months', () => {
      expect(component.formatDate('2025-06-05')).toBe('05-JUN-2025');
      expect(component.formatDate('2025-12-25')).toBe('25-DEC-2025');
    });

    it('should pad single-digit days with leading zero', () => {
      expect(component.formatDate('2025-03-01')).toBe('01-MAR-2025');
    });

    it('should handle double-digit days without extra padding', () => {
      expect(component.formatDate('2025-10-31')).toBe('31-OCT-2025');
    });
  });

  // --- Initial signal values ---

  describe('initial state', () => {
    it('should initialize saving as false', () => {
      createComponent({ creditSponsor: null });
      fixture.detectChanges();
      expect(component.saving()).toBe(false);
    });

    it('should initialize selectedSponsorId as null', () => {
      createComponent({ creditSponsor: null });
      fixture.detectChanges();
      expect(component.selectedSponsorId()).toBeNull();
    });

    it('should expose dialog data', () => {
      expect(component.data.unitId).toBe('UNIT001');
      expect(component.data.collDate).toBe('2025-03-15');
      expect(component.data.canEditSponsor).toBe(true);
    });
  });
});
