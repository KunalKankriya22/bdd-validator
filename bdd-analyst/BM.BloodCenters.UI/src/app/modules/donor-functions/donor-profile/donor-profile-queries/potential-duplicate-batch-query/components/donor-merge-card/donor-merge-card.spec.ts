import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DonorMergeCard } from './donor-merge-card';
import { DuplicateDonor, EMPTY_REVIEW_CATEGORY, EMPTY_MATCH_FLAGS } from '../../models/potential-duplicate-batch-query.model';

describe('DonorMergeCard', () => {
  let component: DonorMergeCard;
  let fixture: ComponentFixture<DonorMergeCard>;

  const mockDonor: DuplicateDonor = {
    donorId: 'DN20111045',
    setId: 'DP00000033',
    name: 'Christopher Hunter',
    dateOfBirth: '1960-01-11',
    ssn: null,
    sex: 'Male',
    mergeFlag: 'Primary',
    workPhone: '123-456-7890',
    homePhone: '972-345-6787',
    mobilePhone: null,
    address: '237 PLEASANT RUN KELLER TX 76248',
    resolvedByUser: 'admin',
    resolvedByUserName: 'admin',
    dateResolved: '2025-03-15',
    programId: '',
    chapterId: null,
    transactionId: null,
    comments: null,
    insertDate: null,
    insertUser: null,
    demographics: { ...EMPTY_REVIEW_CATEGORY },
    keydata: { ...EMPTY_REVIEW_CATEGORY },
    interdictions: { ...EMPTY_REVIEW_CATEGORY },
    donations: { ...EMPTY_REVIEW_CATEGORY },
    attributes: { ...EMPTY_REVIEW_CATEGORY },
    matchFlags: { ...EMPTY_MATCH_FLAGS }
  };

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [DonorMergeCard, NoopAnimationsModule]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(DonorMergeCard);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {

    it('should display card title', () => {
      component.title = 'Primary Merge';
      component.donor = mockDonor;
      fixture.detectChanges();

      const title = fixture.debugElement.query(By.css('.card-title'));
      expect(title.nativeElement.textContent).toBe('Primary Merge');
    });

    it('should display no data message when donor is null', () => {
      component.donor = null;
      fixture.detectChanges();

      const noData = fixture.debugElement.query(By.css('.no-data'));
      expect(noData).toBeTruthy();
      expect(noData.nativeElement.textContent).toContain('No donor information available');
    });
  });

  describe('Donor Information Display', () => {
    beforeEach(() => {
      component.donor = mockDonor;
      fixture.detectChanges();
    });


    it('should display donor name', () => {
      const fields = fixture.debugElement.queryAll(By.css('.field-value'));
      const nameField = fields[1];
      expect(nameField.nativeElement.textContent.trim()).toBe('Christopher Hunter');
    });

    it('should display formatted date of birth', () => {
      const fields = fixture.debugElement.queryAll(By.css('.field-value'));
      const dobField = fields[2];
      expect(dobField.nativeElement.textContent.trim()).toBe('11-JAN-1960');
    });

    it('should display sex', () => {
      const fields = fixture.debugElement.queryAll(By.css('.field-value'));
      const sexField = fields[3];
      expect(sexField.nativeElement.textContent.trim()).toBe('Male');
    });

    it('should display work phone', () => {
      const fields = fixture.debugElement.queryAll(By.css('.field-value'));
      const workPhoneField = fields[4];
      expect(workPhoneField.nativeElement.textContent.trim()).toBe('123-456-7890');
    });

    it('should display home phone', () => {
      const fields = fixture.debugElement.queryAll(By.css('.field-value'));
      const homePhoneField = fields[5];
      expect(homePhoneField.nativeElement.textContent.trim()).toBe('972-345-6787');
    });

    it('should display address', () => {
      const fields = fixture.debugElement.queryAll(By.css('.field-value'));
      const addressField = fields[6];
      expect(addressField.nativeElement.textContent.trim()).toBe('237 PLEASANT RUN KELLER TX 76248');
    });

    it('should display -- for null values', () => {
      component.donor = {
        ...mockDonor,
        workPhone: null,
        resolvedByUser: null,
        dateResolved: null
      };
      fixture.detectChanges();

      const fields = fixture.debugElement.queryAll(By.css('.field-value'));
      const workPhoneField = fields[4];
      const resolvedByField = fields[7];
      const dateResolvedField = fields[8];

      expect(workPhoneField.nativeElement.textContent.trim()).toBe('--');
      expect(resolvedByField.nativeElement.textContent.trim()).toBe('--');
      expect(dateResolvedField.nativeElement.textContent.trim()).toBe('--');
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      component.donor = mockDonor;
      component.showNavigation = true;
      fixture.detectChanges();
    });




    it('should have correct aria-label on navigation button', () => {
      const button = fixture.debugElement.query(By.css('.navigate-button'));
      expect(button.attributes['aria-label']).toBe('Check donor Christopher Hunter');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      component.title = 'Primary Merge';
      component.donor = mockDonor;
      fixture.detectChanges();
    });


    it('should have field labels for screen readers', () => {
      const labels = fixture.debugElement.queryAll(By.css('.field-label'));
      expect(labels.length).toBeGreaterThan(0);
      expect(labels[0].nativeElement.textContent).toBe('Donor ID');
    });
  });

  describe('Date Formatting', () => {
    it('should format valid date correctly', () => {
      const formatted = component.formatDate('2025-03-15');
      expect(formatted).toBe('15-MAR-2025');
    });


  });

  describe('Display Value Helper', () => {


    it('should return -- for undefined', () => {
      expect(component.displayValue(undefined)).toBe('--');
    });

  });

  describe('Has Donor Check', () => {
    it('should return true when donor exists', () => {
      component.donor = mockDonor;
      expect(component.hasDonor).toBeTrue();
    });

    it('should return false when donor is null', () => {
      component.donor = null;
      expect(component.hasDonor).toBeFalse();
    });
  });
});
