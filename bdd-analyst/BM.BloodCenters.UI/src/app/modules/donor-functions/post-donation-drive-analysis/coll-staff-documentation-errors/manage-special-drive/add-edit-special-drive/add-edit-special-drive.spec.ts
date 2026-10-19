import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Overlay } from '@angular/cdk/overlay';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import moment from 'moment';

import { AddEditSpecialDriveComponent } from './add-edit-special-drive';
import { SpecialDriveService } from '../services/special-drive.service';
import { CancelDriveService } from '../services/cancel-drive.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import {
  SpecialDriveDto,
  DriveCategoryLookup,
  ResourceLookup,
  LocationLookup,
  RecruiterLookup,
  SponsorLookup
} from '../models/special-drive.model';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockDrive: SpecialDriveDto = {
  driveId: 'SD001',
  chapterId: 'CH01',
  driveDate: '2025-06-15',
  driveType: 'F',
  driveCategory: 'A',
  status: 'CNFRM',
  locationId: 'LOC001',
  locationName: 'Test Location',
  recruiterId: 'REC001',
  recruiterName: 'Test Recruiter',
  scheduleStartTime: '09:00',
  scheduleEndTime: '17:00',
  programId: 'PROG001',
  sponsors: [{
    driveId: 'SD001',
    chapterId: 'CH01',
    sponsorId: 'SP001',
    sponsorName: 'Sponsor A',
    projectedShow: 100,
    projectedDraw: 80,
    projDeferralRate: 18
  }],
  resources: [{
    driveId: 'SD001',
    chapterId: 'CH01',
    resourceCode: 'RES01',
    resourceDescription: 'Resource One',
    numberRequired: 3
  }],
  notes: [{
    noteId: 'N1',
    noteSequence: 1,
    note: 'Test note',
    insertUser: 'user1',
    insertUserName: 'User One',
    insertDate: '2025-06-10'
  }]
};

const mockCategories: DriveCategoryLookup[] = [
  { code: 'A', description: 'Category A' },
  { code: 'B', description: 'Category B' }
];

const mockResources: ResourceLookup[] = [
  { code: 'RES01', description: 'Resource One' },
  { code: 'RES02', description: 'Resource Two' }
];

const mockLocations: LocationLookup[] = [
  { locationId: 'LOC001', locationName: 'Test Location' },
  { locationId: 'LOC002', locationName: 'Other Location' }
];

const mockRecruiters: RecruiterLookup[] = [
  { employeeId: 'REC001', employeeName: 'Test Recruiter' },
  { employeeId: 'REC002', employeeName: 'Another Recruiter' }
];

const mockSponsors: SponsorLookup[] = [
  { sponsorId: 'SP001', name: 'Sponsor A' },
  { sponsorId: 'SP002', name: 'Sponsor B' }
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildTestBed(overrides: { mode?: 'add' | 'edit' | 'duplicate'; data?: SpecialDriveDto | null } = {}) {
  const driveServiceSpy = jasmine.createSpyObj<SpecialDriveService>('SpecialDriveService', [
    'getDriveCategories',
    'getResources',
    'getLocations',
    'getRecruiters',
    'getSponsors',
    'createDrive',
    'updateDrive'
  ]);

  driveServiceSpy.getDriveCategories.and.returnValue(of(mockCategories));
  driveServiceSpy.getResources.and.returnValue(of(mockResources));
  driveServiceSpy.getLocations.and.returnValue(of(mockLocations));
  driveServiceSpy.getRecruiters.and.returnValue(of(mockRecruiters));
  driveServiceSpy.getSponsors.and.returnValue(of(mockSponsors));
  driveServiceSpy.createDrive.and.returnValue(of({ success: true, message: 'Drive created successfully', statusCode: 200 }));
  driveServiceSpy.updateDrive.and.returnValue(of({ success: true, message: 'Drive updated successfully', statusCode: 200 }));

  const cancelDriveServiceSpy = jasmine.createSpyObj<CancelDriveService>('CancelDriveService', ['cancelDrive']);
  cancelDriveServiceSpy.cancelDrive.and.returnValue(of({} as any));

  // Yesterday in moment so the drive date validator never triggers startTimeAfterChapterTime
  const yesterdayMoment = moment().subtract(1, 'day');

  const headerServiceStub = {
    chapterId: signal('CH01'),
    chapterTimeZone: signal('America/New_York'),
    headerConfig: signal<any>({
      user: { name: 'Test User', id: 'usr001' }
    }),
    chapterChanged$: of(null)
  };

  const chapterTimezoneServiceStub = {
    chapterLocalDate: signal<any>(yesterdayMoment)
  };

  return { driveServiceSpy, cancelDriveServiceSpy, headerServiceStub, chapterTimezoneServiceStub };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AddEditSpecialDriveComponent', () => {
  let component: AddEditSpecialDriveComponent;
  let fixture: ComponentFixture<AddEditSpecialDriveComponent>;
  let driveServiceSpy: jasmine.SpyObj<SpecialDriveService>;
  let cancelDriveServiceSpy: jasmine.SpyObj<CancelDriveService>;
  let snackBar: MatSnackBar;
  let dialog: MatDialog;

  async function setup(mode: 'add' | 'edit' | 'duplicate' = 'add', data: SpecialDriveDto | null = null) {
    const { driveServiceSpy: dSpy, cancelDriveServiceSpy: cSpy, headerServiceStub, chapterTimezoneServiceStub } = buildTestBed({ mode, data });

    driveServiceSpy = dSpy;
    cancelDriveServiceSpy = cSpy;

    await TestBed.configureTestingModule({
      imports: [
        AddEditSpecialDriveComponent,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        provideRouter([]),
        { provide: SpecialDriveService, useValue: driveServiceSpy },
        { provide: CancelDriveService, useValue: cancelDriveServiceSpy },
        { provide: HeaderService, useValue: headerServiceStub },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceStub },
        Overlay
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditSpecialDriveComponent);
    component = fixture.componentInstance;
    component.mode = mode;
    component.data = data;

    snackBar = fixture.debugElement.injector.get(MatSnackBar);
    dialog = fixture.debugElement.injector.get(MatDialog);
    spyOn(snackBar, 'open');

    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // -------------------------------------------------------------------------
  // 1. Component Initialization
  // -------------------------------------------------------------------------

  describe('Component Initialization', () => {
    beforeEach(async () => {
      await setup('add');
    });

    it('should initialize driveForm with expected controls', () => {
      const controls = [
        'createAs', 'driveId', 'sponsorId', 'sponsorName', 'projectedShow',
        'deferralPercent', 'projectedDraw', 'driveDate', 'driveType', 'category',
        'startTime', 'endTime', 'locationId', 'locationName', 'recruiterId',
        'recruiterName', 'status', 'notes'
      ];
      controls.forEach(ctrl => {
        expect(component.driveForm.get(ctrl))
          .withContext(`expected form to contain control '${ctrl}'`)
          .not.toBeNull();
      });
    });

    it('should call all lookup services on init', () => {
      expect(driveServiceSpy.getDriveCategories).toHaveBeenCalled();
      expect(driveServiceSpy.getResources).toHaveBeenCalledWith('CH01');
      expect(driveServiceSpy.getLocations).toHaveBeenCalledWith('CH01');
      expect(driveServiceSpy.getRecruiters).toHaveBeenCalledWith('CH01');
      expect(driveServiceSpy.getSponsors).toHaveBeenCalled();
    });

    it('should initialize header config with breadcrumbs', () => {
      expect(component.headerConfig.breadcrumbs).toBeDefined();
      expect(component.headerConfig.breadcrumbs!.length).toBeGreaterThan(0);
    });

    it('should set 4 empty resource rows in add mode', () => {
      expect(component.resources.length).toBe(4);
      component.resources.forEach(r => {
        expect(r.resourceCode).toBe('');
        expect(r.resourceDescription).toBe('');
        expect(r.number).toBe(0);
      });
    });

    it('should default status to CNFRM', () => {
      expect(component.driveForm.get('status')?.value).toBe('CNFRM');
    });

    it('should default deferralPercent to 18', () => {
      expect(component.driveForm.get('deferralPercent')?.value).toBe(18);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Form Validation
  // -------------------------------------------------------------------------

  describe('Form Validation', () => {
    beforeEach(async () => {
      await setup('add');
    });



    it('isFormValid getter reflects form validity', () => {
      expect(component.isFormValid).toBeFalse();
      component.driveForm.patchValue({
        sponsorId: 'SP001',
        projectedShow: 50,
        deferralPercent: 18,
        driveDate: new Date('2099-12-31'),
        driveType: 'F',
        category: 'A',
        startTime: '09:00',
        endTime: '17:00',
        locationId: 'LOC001',
        recruiterId: 'REC001'
      });
      expect(component.isFormValid).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // 3. Computed / filtered signals
  // -------------------------------------------------------------------------

  describe('Computed / filtered signals', () => {
    beforeEach(async () => {
      await setup('add');
    });

    it('filteredSponsorOptions returns all options when search is empty', () => {
      component.sponsorSearch.set('');
      expect(component.filteredSponsorOptions().length).toBe(mockSponsors.length);
    });



    it('filteredLocationOptions returns all when search is empty', () => {
      component.locationSearch.set('');
      expect(component.filteredLocationOptions().length).toBe(mockLocations.length);
    });

    it('filteredLocationOptions filters by locationId', () => {
      component.locationSearch.set('loc001');
      expect(component.filteredLocationOptions().length).toBe(1);
    });


    it('filteredCategoryOptions returns all when search is empty', () => {
      component.categorySearch.set('');
      expect(component.filteredCategoryOptions().length).toBe(mockCategories.length);
    });

    it('filteredCategoryOptions filters by code', () => {
      component.categorySearch.set('a');
      const results = component.filteredCategoryOptions();
      expect(results.some(c => c.code === 'A')).toBeTrue();
    });


    it('filteredResourceOptions returns all when search is empty', () => {
      component.resourceSearch.set('');
      expect(component.filteredResourceOptions().length).toBe(mockResources.length);
    });


    it('filteredDriveTypeOptions returns all when search is empty', () => {
      component.driveTypeSearch.set('');
      expect(component.filteredDriveTypeOptions().length).toBe(3);
    });

  });

  // -------------------------------------------------------------------------
  // 4. Resource management
  // -------------------------------------------------------------------------

  describe('Resource management', () => {
    beforeEach(async () => {
      await setup('add');
    });

    it('getResourceSearchCtrl returns a FormControl', () => {
      const ctrl = component.getResourceSearchCtrl(0);
      expect(ctrl).toBeDefined();
      expect(ctrl).toBeInstanceOf(Object);
      expect(typeof ctrl.setValue).toBe('function');
    });

    it('getResourceSearchCtrl caches the control for the same index', () => {
      const ctrl1 = component.getResourceSearchCtrl(0);
      const ctrl2 = component.getResourceSearchCtrl(0);
      expect(ctrl1).toBe(ctrl2);
    });

    it('filteredResourceOptionsForRow returns all when no search', () => {
      const results = component.filteredResourceOptionsForRow(0);
      expect(results.length).toBe(mockResources.length);
    });

    it('onResourceCodeSelect sets description from lookup', () => {
      component.onResourceCodeSelect(0, 'RES01');
      expect(component.resources[0].resourceDescription).toBe('Resource One');
    });

    it('onResourceCodeSelect sets duplicate error (13002) when code already used on another row', () => {
      component.resources[1].resourceCode = 'RES01';
      component.onResourceCodeSelect(0, 'RES01');
      const error = component.getResourceError(0, 'code');
      expect(error?.errorCode).toBe('13002');
    });

    it('addNewResource appends an empty row', () => {
      const initialCount = component.resources.length;
      component.addNewResource();
      expect(component.resources.length).toBe(initialCount + 1);
      const newRow = component.resources[component.resources.length - 1];
      expect(newRow.resourceCode).toBe('');
      expect(newRow.number).toBe(0);
    });

    it('deleteResource removes the row at the specified index', () => {
      component.resources[0].resourceCode = 'RES01';
      component.deleteResource(0);
      expect(component.resources.every(r => r.resourceCode !== 'RES01')).toBeTrue();
    });

    it('deleteResource re-indexes errors after removal', () => {
      // Set an error on row index 1
      component.resources.push({ resourceCode: 'X', resourceDescription: '', number: 0 });
      (component as any).setResourceError(1, '11002', 'Invalid');
      // Delete row 0 — error should now be at index 0
      component.deleteResource(0);
      expect(component.resourceErrors.has(0)).toBeTrue();
      expect(component.resourceErrors.has(1)).toBeFalse();
    });

    it('onResourceChange marks error 11002 for invalid resource code', () => {
      component.resources[0].resourceCode = 'BADCODE';
      component.onResourceChange(0);
      const error = component.getResourceError(0, 'code');
      expect(error?.errorCode).toBe('11002');
    });

    it('onResourceChange marks error 13002 for duplicate resource code', () => {
      component.resources[0].resourceCode = 'RES01';
      component.resources[0].resourceDescription = 'Resource One';
      component.resources[1].resourceCode = 'RES01';
      component.onResourceChange(1);
      const error = component.getResourceError(1, 'code');
      expect(error?.errorCode).toBe('13002');
    });

    it('onResourceChange marks error 11131 for negative number', () => {
      component.resources[0].resourceCode = 'RES01';
      component.resources[0].resourceDescription = 'Resource One';
      component.resources[0].number = -1;
      component.onResourceChange(0);
      const error = component.getResourceError(0, 'number');
      expect(error?.errorCode).toBe('11131');
    });


    it('getResourceError returns null when no error exists', () => {
      expect(component.getResourceError(0, 'code')).toBeNull();
    });

    it('getResourceError returns error for code field with errorCode 11002', () => {
      (component as any).setResourceError(0, '11002', 'Invalid resource code.');
      expect(component.getResourceError(0, 'code')?.errorCode).toBe('11002');
    });

    it('getResourceError returns error for code field with errorCode 13002', () => {
      (component as any).setResourceError(0, '13002', 'Duplicate.');
      expect(component.getResourceError(0, 'code')?.errorCode).toBe('13002');
    });

    it('getResourceError returns error for number field with errorCode 11131', () => {
      (component as any).setResourceError(0, '11131', 'Negative.');
      expect(component.getResourceError(0, 'number')?.errorCode).toBe('11131');
    });

    it('getResourceError returns null when error field does not match', () => {
      (component as any).setResourceError(0, '11002', 'Invalid code.');
      expect(component.getResourceError(0, 'number')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 5. Note management
  // -------------------------------------------------------------------------

  describe('Note management', () => {
    beforeEach(async () => {
      await setup('edit', mockDrive);
    });

    it('noteItems getter maps comments to NoteItem format', () => {
      expect(component.noteItems.length).toBeGreaterThan(0);
      const first = component.noteItems[0];
      expect(first.text).toBe('Test note');
      expect(first.userName).toContain('User One');
    });

    it('onNoteAction add appends a note to comments', () => {
      const countBefore = component.comments.length;
      component.onNoteAction({ action: 'add', note: { id: 99, text: 'New Note', userName: 'Test User', timestamp: '', version: '' } });
      expect(component.comments.length).toBe(countBefore + 1);
      const added = component.comments[component.comments.length - 1];
      expect(added.note).toBe('New Note');
    });

    it('onNoteAction update changes existing note text', () => {
      component.onNoteAction({ action: 'update', note: { id: 1, text: 'Updated Note', userName: 'User One', timestamp: '', version: '' } });
      const updated = component.comments.find((c: any) => c.noteSequence === 1 || c.id === 1);
      expect(updated?.note || updated?.text).toBe('Updated Note');
    });

    it('onNoteAction delete removes the note', () => {
      const countBefore = component.comments.length;
      component.onNoteAction({ action: 'delete', note: { id: 1, text: 'Test note', userName: 'User One', timestamp: '', version: '' } });
      expect(component.comments.length).toBe(countBefore - 1);
    });
  });

  // -------------------------------------------------------------------------
  // 6. Time utilities
  // -------------------------------------------------------------------------

  describe('Time utilities', () => {
    beforeEach(async () => {
      await setup('add');
    });






    it('onTimeInput formats 4 digits into HH:MM', () => {
      const input = document.createElement('input');
      input.value = '0930';
      const event = { target: input } as unknown as Event;
      component.onTimeInput(event, 'startTime');
      expect(component.driveForm.get('startTime')?.value).toBe('09:30');
    });

    it('onTimeInput strips non-digit characters and formats as HH:MM', () => {
      const input = document.createElement('input');
      input.value = '09:30';
      const event = { target: input } as unknown as Event;
      component.onTimeInput(event, 'startTime');
      expect(component.driveForm.get('startTime')?.value).toBe('09:30');
    });

    it('onTimeInput handles partial input of 2 digits without colon', () => {
      const input = document.createElement('input');
      input.value = '09';
      const event = { target: input } as unknown as Event;
      component.onTimeInput(event, 'startTime');
      expect(component.driveForm.get('startTime')?.value).toBe('09');
    });

    it('onTimeInput formats 24-hour time 1800 as 18:00', () => {
      const input = document.createElement('input');
      input.value = '1800';
      const event = { target: input } as unknown as Event;
      component.onTimeInput(event, 'endTime');
      expect(component.driveForm.get('endTime')?.value).toBe('18:00');
    });
  });

  // -------------------------------------------------------------------------
  // 7. Form population (edit / duplicate mode)
  // -------------------------------------------------------------------------

  describe('Form population in edit mode', () => {
    beforeEach(async () => {
      await setup('edit', mockDrive);
    });

    it('populateForm fills sponsorId from data', () => {
      expect(component.driveForm.get('sponsorId')?.value).toBe('SP001');
    });

    it('populateForm fills projectedShow from data', () => {
      expect(component.driveForm.get('projectedShow')?.value).toBe(100);
    });

    it('populateForm fills driveType from data', () => {
      expect(component.driveForm.get('driveType')?.value).toBe('F');
    });

    it('populateForm fills locationId from data', () => {
      expect(component.driveForm.get('locationId')?.value).toBe('LOC001');
    });

    it('populateForm fills recruiterId from data', () => {
      expect(component.driveForm.get('recruiterId')?.value).toBe('REC001');
    });

    it('populateForm fills resources from data', () => {
      expect(component.resources.some(r => r.resourceCode === 'RES01')).toBeTrue();
    });

  });

  describe('Form population in duplicate mode', () => {
    beforeEach(async () => {
      await setup('duplicate', mockDrive);
    });

    it('resources are copied from source in duplicate mode', () => {
      expect(component.resources.some(r => r.resourceCode === 'RES01')).toBeTrue();
    });

    it('driveId options include source driveId in duplicate mode', () => {
      expect(component.driveIdOptionsSignal().includes('SD001')).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // 8. Submit
  // -------------------------------------------------------------------------

  describe('onSubmit', () => {
    describe('add mode', () => {
      beforeEach(async () => {
        await setup('add');
      });

      it('shows error snackbar if resource errors exist and does not call createDrive', () => {
        (component as any).setResourceError(0, '11002', 'Invalid resource code.');
        component.onSubmit();
        expect(snackBar.open).toHaveBeenCalledWith(
          jasmine.stringMatching(/resource/i),
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
        expect(driveServiceSpy.createDrive).not.toHaveBeenCalled();
      });

      it('marks form as touched and shows error if form is invalid', () => {
        component.onSubmit();
        expect(snackBar.open).toHaveBeenCalledWith(
          jasmine.stringMatching(/required/i),
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
        expect(driveServiceSpy.createDrive).not.toHaveBeenCalled();
      });

      it('calls createDrive and emits saveSuccess on valid form submission', fakeAsync(() => {
        component.driveForm.patchValue({
          sponsorId: 'SP001',
          projectedShow: 100,
          deferralPercent: 18,
          driveDate: new Date('2099-12-31'),
          driveType: 'F',
          category: 'A',
          startTime: '09:00',
          endTime: '17:00',
          locationId: 'LOC001',
          recruiterId: 'REC001'
        });
        spyOn(component.saveSuccess, 'emit');
        component.onSubmit();
        tick(500);
        expect(driveServiceSpy.createDrive).toHaveBeenCalled();
        expect(component.saveSuccess.emit).toHaveBeenCalled();
      }));

    });

    describe('edit mode', () => {
      beforeEach(async () => {
        await setup('edit', mockDrive);
      });

      it('calls updateDrive and emits saveSuccess on valid form submission', fakeAsync(() => {
        component.driveForm.patchValue({
          driveDate: new Date('2099-12-31'),
          startTime: '09:00',
          endTime: '17:00'
        });
        spyOn(component.saveSuccess, 'emit');
        component.onSubmit();
        tick(500);
        expect(driveServiceSpy.updateDrive).toHaveBeenCalled();
        expect(component.saveSuccess.emit).toHaveBeenCalled();
      }));

    });
  });

  // -------------------------------------------------------------------------
  // 9. Cancel drive
  // -------------------------------------------------------------------------

  describe('onCancelDrive', () => {
    beforeEach(async () => {
      await setup('edit', mockDrive);
    });



    it('calls cancelDriveService and emits saveSuccess on success', () => {
      spyOn(dialog, 'open').and.returnValue({
        afterClosed: () => of({ cancelCode: 'CNAVL', comments: 'Test reason' })
      } as any);
      spyOn(component.saveSuccess, 'emit');
      component.onCancelDrive();
      expect(cancelDriveServiceSpy.cancelDrive).toHaveBeenCalledWith(
        'SD001',
        { cancelReasonCode: 'CNAVL', cancelReason: 'Test reason', confirmCancellation: true }
      );
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    });


  });

  // -------------------------------------------------------------------------
  // 10. Utility
  // -------------------------------------------------------------------------

  describe('Utility', () => {
    beforeEach(async () => {
      await setup('add');
    });

    it('onClearAll resets form and restores 4 empty resource rows', () => {
      component.driveForm.patchValue({ sponsorId: 'SP001', driveType: 'F' });
      component.resources.push({ resourceCode: 'X', resourceDescription: 'X', number: 1 });
      (component as any).setResourceError(0, '11002', 'err');
      component.onClearAll();
      expect(component.driveForm.get('sponsorId')?.value).toBeFalsy();
      expect(component.resources.length).toBe(4);
      expect(component.resourceErrors.size).toBe(0);
    });


    it('currentUserName returns name from headerService', () => {
      expect(component.currentUserName).toBe('Test User');
    });

    it('ngOnDestroy completes destroy$', () => {
      const destroy$ = (component as any).destroy$;
      spyOn(destroy$, 'next').and.callThrough();
      spyOn(destroy$, 'complete').and.callThrough();
      component.ngOnDestroy();
      expect(destroy$.next).toHaveBeenCalled();
      expect(destroy$.complete).toHaveBeenCalled();
    });
  });
});
