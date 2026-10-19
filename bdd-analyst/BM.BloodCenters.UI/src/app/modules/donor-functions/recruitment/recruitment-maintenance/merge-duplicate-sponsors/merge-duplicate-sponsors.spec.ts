import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { MergeDuplicateSponsorsComponent } from './merge-duplicate-sponsors';
import { MergeDuplicateSponsorsService } from './services/merge-duplicate-sponsors.service';
import { HeaderService } from '@shared/services/header.service';
import {
  createMockHeaderService,
  createMockMatDialog,
  createMockMatSnackBar,
} from '@shared/testing/common-mocks';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DuplicateSponsorModel } from './models/merge-duplicate-sponsors.model';

describe('MergeDuplicateSponsorsComponent', () => {
  let component: MergeDuplicateSponsorsComponent;
  let fixture: ComponentFixture<MergeDuplicateSponsorsComponent>;
  let sponsorService: jasmine.SpyObj<MergeDuplicateSponsorsService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const makeSponsor = (overrides: Partial<DuplicateSponsorModel> = {}): DuplicateSponsorModel => ({
    sponsorId: 'S001',
    name: 'Sponsor A',
    programId: 'P1',
    systemName: 'SYS',
    streetName: '123 Main St',
    address1: 'Suite 100',
    address2: '',
    uspsId: '12345',
    intlAddress1: '',
    intlAddress2: '',
    intlAddress3: '',
    countryName: 'USA',
    intlAddrFlag: 'N',
    contactLastName: 'Doe',
    contactFirstName: 'John',
    noteId: 'N1',
    ...overrides,
  });

  beforeEach(async () => {
    sponsorService = jasmine.createSpyObj('MergeDuplicateSponsorsService', [
      'searchSponsorsLov',
      'retrieveSponsors',
      'getSponsorDrives',
      'mergeSponsors',
    ]);
    sponsorService.searchSponsorsLov.and.returnValue(of({ data: [], total: 0 }));

    dialog = createMockMatDialog();
    snackBar = createMockMatSnackBar();

    await TestBed.configureTestingModule({
      imports: [MergeDuplicateSponsorsComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: MergeDuplicateSponsorsService, useValue: sponsorService },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: HeaderService, useValue: createMockHeaderService({ chapterId: () => 'CH01' }) },
        { provide: PageHeaderService, useValue: jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle', 'getCurrentMenuItem'], { pageHeaderData: signal(undefined) }) },
      ],
    }).compileComponents();

    // Override at component level so mocks take precedence over
    // the standalone component's own MatDialogModule/MatSnackBarModule imports
    TestBed.overrideComponent(MergeDuplicateSponsorsComponent, {
      add: {
        providers: [
          { provide: MatDialog, useValue: dialog },
          { provide: MatSnackBar, useValue: snackBar },
        ],
      },
    });

    fixture = TestBed.createComponent(MergeDuplicateSponsorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onRetrieve', () => {
    it('should not call service when searchControl is empty', () => {
      component.searchControl.setValue('');
      component.onRetrieve();

      expect(sponsorService.retrieveSponsors).not.toHaveBeenCalled();
    });

    it('should set sponsorFrom and sponsorInto when 2+ sponsors returned', (done) => {
      const sponsors = [makeSponsor({ sponsorId: 'S001' }), makeSponsor({ sponsorId: 'S002' })];
      sponsorService.retrieveSponsors.and.returnValue(of(sponsors));
      component.searchControl.setValue('Test');

      component.onRetrieve();

      setTimeout(() => {
        expect(component.sponsorFrom?.sponsorId).toBe('S001');
        expect(component.sponsorInto?.sponsorId).toBe('S002');
        expect(component.isLoading).toBe(false);
        expect(component.hasSearched).toBe(true);
        done();
      });
    });

    it('should show snackbar warning when only one sponsor found', (done) => {
      sponsorService.retrieveSponsors.and.returnValue(of([makeSponsor()]));
      component.searchControl.setValue('Single');

      component.onRetrieve();

      setTimeout(() => {
        expect(snackBar.open).toHaveBeenCalledWith(
          jasmine.stringContaining('Only one sponsor found'),
          'Close',
          jasmine.anything()
        );
        expect(component.sponsorFrom).toBeNull();
        expect(component.sponsorInto).toBeNull();
        done();
      });
    });

    it('should show snackbar when no sponsors found', (done) => {
      sponsorService.retrieveSponsors.and.returnValue(of([]));
      component.searchControl.setValue('NoMatch');

      component.onRetrieve();

      setTimeout(() => {
        expect(snackBar.open).toHaveBeenCalledWith(
          jasmine.stringContaining('No sponsors found'),
          'Close',
          jasmine.anything()
        );
        done();
      });
    });

    it('should reset sponsors and stop loading on error', (done) => {
      sponsorService.retrieveSponsors.and.returnValue(throwError(() => ({ status: 500 })));
      component.searchControl.setValue('Error');

      component.onRetrieve();

      setTimeout(() => {
        expect(component.isLoading).toBe(false);
        expect(component.hasSearched).toBe(true);
        expect(component.sponsorFrom).toBeNull();
        expect(component.sponsorInto).toBeNull();
        done();
      });
    });
  });

  describe('swapDirection', () => {
    it('should swap sponsorFrom and sponsorInto', () => {
      const from = makeSponsor({ sponsorId: 'FROM' });
      const into = makeSponsor({ sponsorId: 'INTO' });
      component.sponsorFrom = from;
      component.sponsorInto = into;

      component.swapDirection();

      expect(component.sponsorFrom?.sponsorId).toBe('INTO');
      expect(component.sponsorInto?.sponsorId).toBe('FROM');
    });

    it('should not swap when sponsorFrom is null', () => {
      component.sponsorFrom = null;
      component.sponsorInto = makeSponsor();

      component.swapDirection();

      expect(component.sponsorFrom).toBeNull();
    });
  });

  describe('showDrives', () => {
    it('should open ViewDrivesDialog on success', (done) => {
      const drives = [{ driveId: 'D1', driveDate: '2025-01-01', driveType: 'M', driveTypeDisplay: 'Mobile', status: 'Active' }];
      sponsorService.getSponsorDrives.and.returnValue(of(drives as any));
      const sponsor = makeSponsor({ sponsorId: 'S100', name: 'Test Sponsor' });

      component.showDrives(sponsor);

      setTimeout(() => {
        expect(sponsorService.getSponsorDrives).toHaveBeenCalledWith('S100');
        expect(dialog.open).toHaveBeenCalledWith(
          jasmine.anything(),
          jasmine.objectContaining({
            data: jasmine.objectContaining({
              sponsorId: 'S100',
              sponsorName: 'Test Sponsor',
              drives: drives,
            }),
          })
        );
        done();
      });
    });

    it('should show error snackbar when getSponsorDrives fails', (done) => {
      sponsorService.getSponsorDrives.and.returnValue(throwError(() => ({ status: 500 })));

      component.showDrives(makeSponsor());

      setTimeout(() => {
        expect(snackBar.open).toHaveBeenCalledWith(
          'Failed to load drives for this sponsor.',
          'Close',
          jasmine.anything()
        );
        done();
      });
    });
  });

  describe('mergeSponsors', () => {
    it('should not open dialog when sponsors are not set', () => {
      component.sponsorFrom = null;
      component.sponsorInto = null;

      component.mergeSponsors();

      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('should open confirmation dialog when both sponsors are set', () => {
      component.sponsorFrom = makeSponsor({ sponsorId: 'S001' });
      component.sponsorInto = makeSponsor({ sponsorId: 'S002' });

      component.mergeSponsors();

      expect(dialog.open).toHaveBeenCalledWith(
        jasmine.anything(),
        jasmine.objectContaining({
          data: jasmine.objectContaining({
            title: jasmine.stringContaining('merge'),
          }),
        })
      );
    });

    it('should call performMerge on confirm and show success snackbar', (done) => {
      component.sponsorFrom = makeSponsor({ sponsorId: 'S001' });
      component.sponsorInto = makeSponsor({ sponsorId: 'S002' });

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('confirm'));
      dialog.open.and.returnValue(dialogRefSpy);

      sponsorService.mergeSponsors.and.returnValue(
        of({ success: true, message: 'Merged successfully' } as any)
      );

      component.mergeSponsors();

      setTimeout(() => {
        expect(sponsorService.mergeSponsors).toHaveBeenCalledWith({
          fromSponsorId: 'S001',
          toSponsorId: 'S002',
        });
        expect(snackBar.open).toHaveBeenCalledWith(
          'Merged successfully',
          'DISMISS',
          jasmine.anything()
        );
        done();
      });
    });

    it('should not call performMerge when dialog is cancelled', (done) => {
      component.sponsorFrom = makeSponsor({ sponsorId: 'S001' });
      component.sponsorInto = makeSponsor({ sponsorId: 'S002' });

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('cancel'));
      dialog.open.and.returnValue(dialogRefSpy);

      component.mergeSponsors();

      setTimeout(() => {
        expect(sponsorService.mergeSponsors).not.toHaveBeenCalled();
        done();
      });
    });

    it('should show error snackbar when merge fails', (done) => {
      component.sponsorFrom = makeSponsor({ sponsorId: 'S001' });
      component.sponsorInto = makeSponsor({ sponsorId: 'S002' });

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('confirm'));
      dialog.open.and.returnValue(dialogRefSpy);

      sponsorService.mergeSponsors.and.returnValue(throwError(() => ({ status: 500 })));

      component.mergeSponsors();

      setTimeout(() => {
        expect(component.isLoading).toBe(false);
        expect(snackBar.open).toHaveBeenCalledWith(
          'An error occurred while merging sponsors.',
          'DISMISS',
          jasmine.anything()
        );
        done();
      });
    });

    it('should show error snackbar when merge response has success=false', (done) => {
      component.sponsorFrom = makeSponsor({ sponsorId: 'S001' });
      component.sponsorInto = makeSponsor({ sponsorId: 'S002' });

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of('confirm'));
      dialog.open.and.returnValue(dialogRefSpy);

      sponsorService.mergeSponsors.and.returnValue(
        of({ success: false, message: 'Merge failed due to constraint' } as any)
      );

      component.mergeSponsors();

      setTimeout(() => {
        expect(snackBar.open).toHaveBeenCalledWith(
          'Merge failed due to constraint',
          'DISMISS',
          jasmine.anything()
        );
        done();
      });
    });
  });

  describe('canMerge', () => {
    it('should return true when both sponsors exist and not loading', () => {
      component.sponsorFrom = makeSponsor();
      component.sponsorInto = makeSponsor();
      component.isLoading = false;

      expect(component.canMerge).toBe(true);
    });

    it('should return false when sponsorFrom is null', () => {
      component.sponsorFrom = null;
      component.sponsorInto = makeSponsor();

      expect(component.canMerge).toBe(false);
    });

    it('should return false when isLoading is true', () => {
      component.sponsorFrom = makeSponsor();
      component.sponsorInto = makeSponsor();
      component.isLoading = true;

      expect(component.canMerge).toBe(false);
    });
  });

  describe('emptyStateMessage', () => {
    it('should return search prompt when hasSearched is false', () => {
      component.hasSearched = false;

      expect(component.emptyStateMessage).toContain('Use the search fields');
    });

    it('should return no-match message when hasSearched is true', () => {
      component.hasSearched = true;

      expect(component.emptyStateMessage).toContain('No sponsors found');
    });
  });

  describe('getContactName', () => {
    it('should join first and last name', () => {
      const sponsor = makeSponsor({ contactFirstName: 'Jane', contactLastName: 'Smith' });

      expect(component.getContactName(sponsor)).toBe('Jane Smith');
    });

    it('should return only first name when last name is empty', () => {
      const sponsor = makeSponsor({ contactFirstName: 'Jane', contactLastName: '' });

      expect(component.getContactName(sponsor)).toBe('Jane');
    });

    it('should return empty string when both names are empty', () => {
      const sponsor = makeSponsor({ contactFirstName: '', contactLastName: '' });

      expect(component.getContactName(sponsor)).toBe('');
    });
  });

  describe('getAddress', () => {
    it('should return domestic address when intlAddrFlag is N', () => {
      const sponsor = makeSponsor({
        intlAddrFlag: 'N',
        streetName: '123 Main St',
        address1: 'Suite 200',
      });

      expect(component.getAddress(sponsor)).toBe('123 Main St, Suite 200');
    });

    it('should return international address when intlAddrFlag is Y', () => {
      const sponsor = makeSponsor({
        intlAddrFlag: 'Y',
        intlAddress1: 'Line 1',
        intlAddress2: 'Line 2',
        intlAddress3: 'Line 3',
      });

      expect(component.getAddress(sponsor)).toBe('Line 1, Line 2, Line 3');
    });

    it('should skip empty parts in international address', () => {
      const sponsor = makeSponsor({
        intlAddrFlag: 'Y',
        intlAddress1: 'Line 1',
        intlAddress2: '',
        intlAddress3: 'Line 3',
      });

      expect(component.getAddress(sponsor)).toBe('Line 1, Line 3');
    });
  });

  describe('getUspsDisplay', () => {
    it('should join uspsId and countryName with separator', () => {
      const sponsor = makeSponsor({ uspsId: '12345', countryName: 'USA' });

      expect(component.getUspsDisplay(sponsor)).toBe('12345 / USA');
    });

    it('should return only countryName when uspsId is empty', () => {
      const sponsor = makeSponsor({ uspsId: '', countryName: 'Canada' });

      expect(component.getUspsDisplay(sponsor)).toBe('Canada');
    });
  });
});
