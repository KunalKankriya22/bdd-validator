import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { TemporaryDriveQueryFilterPanel } from './temporary-drive-query-filter-panel';
import { TemporaryDriveFilterValue, FilterNameOption } from '../models/temporary-drive-query.model';
import { TemporaryDriveQueryService } from '../services/temporary-drive-query.service';

describe('TemporaryDriveQueryFilterPanel', () => {
  let component: TemporaryDriveQueryFilterPanel;
  let fixture: ComponentFixture<TemporaryDriveQueryFilterPanel>;
  let mockService: jasmine.SpyObj<TemporaryDriveQueryService>;

  const mockRecruiters: FilterNameOption[] = [
    { name: 'John Smith' },
    { name: 'Jane Doe' }
  ] as FilterNameOption[];

  const mockSponsors: FilterNameOption[] = [
    { name: 'Sponsor A' },
    { name: 'Sponsor B' }
  ] as FilterNameOption[];

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('TemporaryDriveQueryService', [
      'getFilterRecruiters',
      'getFilterSponsors'
    ]);
    mockService.getFilterRecruiters.and.returnValue(of({ data: mockRecruiters } as any));
    mockService.getFilterSponsors.and.returnValue(of({ data: mockSponsors } as any));

    await TestBed.configureTestingModule({
      imports: [
        TemporaryDriveQueryFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: TemporaryDriveQueryService, useValue: mockService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TemporaryDriveQueryFilterPanel);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize form with null values', () => {
      fixture.detectChanges();

      expect(component.filterForm.get('status')?.value).toBeNull();
      expect(component.filterForm.get('recruiterName')?.value).toBeNull();
      expect(component.filterForm.get('sponsorName')?.value).toBeNull();
    });

    it('should load recruiter and sponsor data from service', () => {
      fixture.detectChanges();

      expect(mockService.getFilterRecruiters).toHaveBeenCalled();
      expect(mockService.getFilterSponsors).toHaveBeenCalled();
      expect(component.recruiterNameOptions).toEqual(mockRecruiters);
      expect(component.sponsorNameOptions).toEqual(mockSponsors);
    });

    it('should handle service errors gracefully', () => {
      mockService.getFilterRecruiters.and.returnValue(throwError(() => new Error('fail')));
      mockService.getFilterSponsors.and.returnValue(throwError(() => new Error('fail')));

      fixture.detectChanges();

      expect(component.recruiterNameOptions).toEqual([]);
      expect(component.sponsorNameOptions).toEqual([]);
      expect(component.isLoadingRecruiters).toBeFalse();
      expect(component.isLoadingSponsors).toBeFalse();
    });

    it('should have static status options', () => {
      fixture.detectChanges();

      expect(component.statusOptions).toEqual([
        { code: 'U', description: 'Used' },
        { code: 'D', description: 'Deleted' }
      ]);
    });
  });

  describe('Apply Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit filter values on apply with status', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ status: 'U' });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        status: 'U',
        recruiterName: null,
        sponsorName: null
      });
    });

    it('should emit recruiter name from object value', () => {
      spyOn(component.apply, 'emit');

      const recruiter: FilterNameOption = { name: 'John Smith' } as FilterNameOption;
      component.filterForm.patchValue({ recruiterName: recruiter });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        recruiterName: 'John Smith'
      }));
    });

    it('should emit null for string recruiterName', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ status: 'U', recruiterName: 'partial text' });
      // Note: isApplyDisabled would be true with partial text, but testing emit logic
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        recruiterName: null
      }));
    });
  });

  describe('Clear Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all form controls on clear', () => {
      component.filterForm.patchValue({
        status: 'U',
        recruiterName: { name: 'John' },
        sponsorName: { name: 'Sponsor A' }
      });

      component.onClear();

      expect(component.filterForm.get('status')?.value).toBeNull();
      expect(component.filterForm.get('recruiterName')?.value).toBeNull();
      expect(component.filterForm.get('sponsorName')?.value).toBeNull();
    });
  });

  describe('Close', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be disabled when no filters are selected', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be enabled when status is selected', () => {
      component.filterForm.patchValue({ status: 'U' });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be enabled when recruiterName is an object', () => {
      component.filterForm.patchValue({ recruiterName: { name: 'John Smith' } });

      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be disabled when recruiterName is partial text', () => {
      component.filterForm.patchValue({ recruiterName: 'partial' });

      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should be disabled when sponsorName is partial text', () => {
      component.filterForm.patchValue({ sponsorName: 'partial' });

      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('Blur Handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set invalidRecruiter error on blur with text value', () => {
      component.filterForm.patchValue({ recruiterName: 'partial text' });
      component.onRecruiterBlur();

      expect(component.filterForm.get('recruiterName')?.hasError('invalidRecruiter')).toBeTrue();
    });

    it('should clear recruiter to null on blur with empty string', () => {
      component.filterForm.patchValue({ recruiterName: '' });
      component.onRecruiterBlur();

      expect(component.filterForm.get('recruiterName')?.value).toBeNull();
    });

    it('should set invalidSponsor error on blur with text value', () => {
      component.filterForm.patchValue({ sponsorName: 'partial text' });
      component.onSponsorBlur();

      expect(component.filterForm.get('sponsorName')?.hasError('invalidSponsor')).toBeTrue();
    });

    it('should clear sponsor to null on blur with empty string', () => {
      component.filterForm.patchValue({ sponsorName: '' });
      component.onSponsorBlur();

      expect(component.filterForm.get('sponsorName')?.value).toBeNull();
    });
  });

  describe('displayName', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return the name from an option', () => {
      expect(component.displayName({ name: 'Test' } as FilterNameOption)).toBe('Test');
    });

    it('should return empty string for null', () => {
      expect(component.displayName(null as any)).toBe('');
    });
  });
});
