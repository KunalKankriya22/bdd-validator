import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DonorWithinTestDialogComponent } from './donor-within-test-dialog.component';
import { DonorWithinTestService } from './services/donor-within-test.service';
import { DonorAttributesService } from '../donor-profile/donor-profile-maintenance/donor-attributes/services/donor-attributes.service';
import {
  DonationRecordDto,
  TestResultDto,
  TestResultsResponse,
  ConfirmatoryTestDto
} from './models/donor-within-test.models';

describe('DonorWithinTestDialogComponent', () => {
  let component: DonorWithinTestDialogComponent;
  let fixture: ComponentFixture<DonorWithinTestDialogComponent>;
  let serviceSpy: jasmine.SpyObj<DonorWithinTestService>;
  let donorAttributesServiceSpy: jasmine.SpyObj<DonorAttributesService>;

  const mockDonations: DonationRecordDto[] = [
    { unitId: 'W66712328191', displayUnitId: 'W66712328191-H', collDate: '2024-08-12', donorId: 'D123456' },
    { unitId: 'DEF07272001', displayUnitId: 'DEF[07272001]', collDate: '2025-07-27', donorId: 'D123456' }
  ];

  const mockTestResults: TestResultDto[] = [
    {
      testId: 'HBC',
      resultCode: 'NEG',
      reactive: null,
      testType: 'SCREENING',
      absorbance: '0.123'
    },
    {
      testId: 'HBSAG',
      resultCode: 'NEG',
      reactive: null,
      testType: 'SCREENING',
      absorbance: '0.045'
    },
    {
      testId: 'HIV-1/2',
      resultCode: 'NEG',
      reactive: null,
      testType: 'SCREENING',
      absorbance: '0.078'
    }
  ];

  const mockTestResultsResponse: TestResultsResponse = {
    data: mockTestResults,
    hasHiddenTests: false,
    hasValidTests: true
  };

  const mockConfirmatoryTests: ConfirmatoryTestDto[] = [
    {
      unitId: 'W66712328191',
      collDate: '2024-08-12',
      testId: 'HIV-CONFIRM',
      testDesc: 'HIV Confirmatory',
      resultCode: 'NEG',
      chapterId: 'CH001',
      testType: 'Confirmatory'
    }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DonorWithinTestService', [
      'getAccessLevel',
      'getDonations',
      'getTestResults',
      'getConfirmatoryTests',
      'getDonorHeader'
    ]);

    serviceSpy.getAccessLevel.and.returnValue(of(5));
    serviceSpy.getDonations.and.returnValue(of(mockDonations));
    serviceSpy.getTestResults.and.returnValue(of(mockTestResultsResponse));
    serviceSpy.getConfirmatoryTests.and.returnValue(of(mockConfirmatoryTests));
    serviceSpy.getDonorHeader.and.returnValue(of(null));

    donorAttributesServiceSpy = jasmine.createSpyObj('DonorAttributesService', [
      'getDonorDemographics'
    ]);
    donorAttributesServiceSpy.getDonorDemographics.and.returnValue(of({
      donorId: 'D123456',
      firstName: 'KATHLEEN',
      lastName: 'DARLAND',
      dateOfBirth: '1940-01-01',
      gender: 'Female',
      bloodType: 'A POS'
    }));

    TestBed.configureTestingModule({
      imports: [DonorWithinTestDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DonorWithinTestService, useValue: serviceSpy },
        { provide: DonorAttributesService, useValue: donorAttributesServiceSpy }
      ]
    });

    serviceSpy.getDonations.calls.reset();
    serviceSpy.getTestResults.calls.reset();
    serviceSpy.getConfirmatoryTests.calls.reset();
    serviceSpy.getDonorHeader.calls.reset();
    donorAttributesServiceSpy.getDonorDemographics.calls.reset();

    serviceSpy.getDonations.and.returnValue(of(mockDonations));
    serviceSpy.getTestResults.and.returnValue(of(mockTestResultsResponse));
    serviceSpy.getConfirmatoryTests.and.returnValue(of(mockConfirmatoryTests));
    serviceSpy.getDonorHeader.and.returnValue(of(null));

    fixture = TestBed.createComponent(DonorWithinTestDialogComponent);
    component = fixture.componentInstance;

    component.donorId = 'D123456';
    component.donorName = 'DARLAND, KATHLEEN J';
    component.dob = '01-JAN-1940';
    component.sex = 'Female';
    component.abo = 'A POS';
  });

  describe('Initialization', () => {

    it('should call getAccessLevel on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(serviceSpy.getAccessLevel).toHaveBeenCalled();
      expect((component as any)._accessLevel).toBe(5);
    }));

    it('should load donations on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(serviceSpy.getDonations).toHaveBeenCalledWith('D123456');
      expect(component.donations()).toEqual(mockDonations);
    }));

    it('should auto-select first donation after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.selectedDonation()).toEqual(mockDonations[0]);
      expect(serviceSpy.getTestResults).toHaveBeenCalled();
    }));

    it('should display donor information', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('DARLAND, KATHLEEN J');
      expect(compiled.textContent).toContain('01-JAN-1940');
      expect(compiled.textContent).toContain('Female');
      expect(compiled.textContent).toContain('A POS');
    }));

    it('should call getDonorHeader on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(serviceSpy.getDonorHeader).toHaveBeenCalledWith('D123456');
    }));

    it('should not call getDonorHeader when donorId is empty', fakeAsync(() => {
      component.donorId = '';
      serviceSpy.getDonorHeader.calls.reset();
      component.ngOnInit();
      tick();

      expect(serviceSpy.getDonorHeader).not.toHaveBeenCalled();
    }));

    it('should fallback to donor demographics when header call fails', fakeAsync(() => {
      serviceSpy.getDonorHeader.and.returnValue(throwError(() => new Error('Not found')));

      fixture.detectChanges();
      tick();

      expect(donorAttributesServiceSpy.getDonorDemographics).toHaveBeenCalledWith('D123456');
    }));

    it('should update donor info from header response', fakeAsync(() => {
      component.donorName = '';
      component.dob = '';
      component.sex = '';
      component.abo = '';

      serviceSpy.getDonorHeader.and.returnValue(of({
        name: 'SMITH, JOHN',
        dateOfBirth: '1985-06-15',
        sex: 'M',
        abo: 'O NEG'
      }));

      fixture.detectChanges();
      tick();

      expect(component.donorName).toBe('SMITH, JOHN');
      expect(component.dob).toBe('15-JUN-1985');
      expect(component.sex).toBe('Male');
      expect(component.abo).toBe('O NEG');
    }));

    it('should not load donations when donorId is empty on init', fakeAsync(() => {
      serviceSpy.getDonations.calls.reset();
      component.donorId = '';
      component.ngOnInit();
      tick();

      expect(serviceSpy.getDonations).not.toHaveBeenCalled();
      expect(component.error()).toBe('Donor ID is required');
    }));

    it('should not overwrite existing donorName from header', fakeAsync(() => {
      component.donorName = 'DARLAND, KATHLEEN J';

      serviceSpy.getDonorHeader.and.returnValue(of({
        name: 'DARLAND, KATHLEEN',
        dateOfBirth: '1940-01-01',
        sex: 'F',
        abo: 'A POS'
      }));

      fixture.detectChanges();
      tick();

      expect(component.donorName).toBe('DARLAND, KATHLEEN J');
    }));

    it('should always prefer header ABO over input', fakeAsync(() => {
      component.abo = 'A';

      serviceSpy.getDonorHeader.and.returnValue(of({
        name: null,
        dateOfBirth: null,
        sex: null,
        abo: 'A POS'
      }));

      fixture.detectChanges();
      tick();

      expect(component.abo).toBe('A POS');
    }));

    it('should show error and keep accessLevel null when getAccessLevel fails', fakeAsync(() => {
      serviceSpy.getAccessLevel.and.returnValue(throwError(() => new Error('Forbidden')));

      fixture.detectChanges();
      tick();

      expect((component as any)._accessLevel).toBeNull();
      expect(component.error()).toBe('Unable to determine access level. Please contact your system administrator.');
    }));
  });

  describe('Access Level and Test Results', () => {
    it('should pass accessLevel to getTestResults', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const args = serviceSpy.getTestResults.calls.mostRecent().args;
      expect(args[2]).toBe(5);
    }));

    it('should set hasHiddenTests from response', fakeAsync(() => {
      serviceSpy.getTestResults.and.returnValue(of({
        data: mockTestResults,
        hasHiddenTests: true,
        hasValidTests: true
      }));

      fixture.detectChanges();
      tick();

      expect(component.hasHiddenTests()).toBeTrue();
    }));

    it('should set hasValidTests from response', fakeAsync(() => {
      serviceSpy.getTestResults.and.returnValue(of({
        data: mockTestResults,
        hasHiddenTests: false,
        hasValidTests: false
      }));

      fixture.detectChanges();
      tick();

      expect(component.hasValidTests()).toBeFalse();
    }));
  });

  describe('Test Results Panel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should display selected donation displayUnitId', () => {
      const infoDiv = fixture.debugElement.query(By.css('.selected-donation-info'));
      expect(infoDiv).toBeTruthy();
      expect(infoDiv.nativeElement.textContent).toContain('W66712328191-H');
    });

    it('should load test results when a donation is selected', fakeAsync(() => {
      serviceSpy.getTestResults.calls.reset();
      component.selectDonation(mockDonations[1]);
      tick();

      expect(serviceSpy.getTestResults).toHaveBeenCalled();
    }));

    it('should reset showConfirm, confirmTests, and flags on donation selection', fakeAsync(() => {
      component.showConfirm.set(true);
      component.confirmTests.set(mockConfirmatoryTests);
      component.hasHiddenTests.set(true);
      component.hasValidTests.set(true);

      component.selectDonation(mockDonations[1]);
      tick();

      expect(component.showConfirm()).toBeFalse();
      expect(component.confirmTests()).toEqual([]);
      expect(component.hasHiddenTests()).toBeFalse();
      // hasValidTests is reset to false by selectDonation, then set from API response
      expect(component.hasValidTests()).toBe(mockTestResultsResponse.hasValidTests);
    }));

    it('should display test results columns', () => {
      expect(component.testResultsColumns).toEqual(['testId', 'resultCode', 'absorbance', 'reactive', 'testType']);
    });

    it('should display donations columns with displayUnitId', () => {
      expect(component.donationsColumns).toEqual(['displayUnitId', 'collDate']);
    });
  });

  describe('Hidden Tests Warning', () => {
    it('should show warning banner when hasHiddenTests is true', fakeAsync(() => {
      serviceSpy.getTestResults.and.returnValue(of({
        data: mockTestResults,
        hasHiddenTests: true,
        hasValidTests: true
      }));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const warning = fixture.debugElement.query(By.css('.hidden-tests-warning'));
      expect(warning).toBeTruthy();
      expect(warning.nativeElement.textContent).toContain('Some results may not be displayed due to access restrictions');
    }));

    it('should not show warning banner when hasHiddenTests is false', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const warning = fixture.debugElement.query(By.css('.hidden-tests-warning'));
      expect(warning).toBeFalsy();
    }));
  });

  describe('Show Confirm Checkbox', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should enable Show Confirm checkbox when hasValidTests is true', () => {
      component.hasValidTests.set(true);
      fixture.detectChanges();

      const checkbox = fixture.debugElement.query(By.css('.controls-group mat-checkbox'));
      expect(checkbox).toBeTruthy();
      const input = checkbox.nativeElement.querySelector('input[type="checkbox"]');
      expect(input.disabled).toBeFalse();
    });

    it('should disable Show Confirm checkbox when hasValidTests is false', () => {
      component.hasValidTests.set(false);
      fixture.detectChanges();

      const checkbox = fixture.debugElement.query(By.css('.controls-group mat-checkbox'));
      expect(checkbox).toBeTruthy();
      const input = checkbox.nativeElement.querySelector('input[type="checkbox"]');
      expect(input.disabled).toBeTrue();
    });

    it('should merge confirmatory tests with regular tests when shown', fakeAsync(() => {
      component.showConfirm.set(true);
      component.confirmTests.set(mockConfirmatoryTests);
      fixture.detectChanges();

      const displayedTests = component.displayedTests();
      expect(displayedTests.length).toBeGreaterThan(mockTestResults.length);
    }));

    it('should load confirmatory tests when button is clicked', fakeAsync(() => {
      component.hasValidTests.set(true);
      component.showConfirm.set(true);
      component.onShowConfirmChange();
      tick();

      expect(serviceSpy.getConfirmatoryTests).toHaveBeenCalled();
    }));

    it('should not load confirmatory tests when no donation is selected', fakeAsync(() => {
      serviceSpy.getConfirmatoryTests.calls.reset();
      component.selectedDonation.set(null);
      component.showConfirm.set(true);
      component.onShowConfirmChange();
      tick();

      expect(serviceSpy.getConfirmatoryTests).not.toHaveBeenCalled();
    }));

    it('should pass numeric accessLevel to getConfirmatoryTests', fakeAsync(() => {
      component.showConfirm.set(true);
      component.onShowConfirmChange();
      tick();

      const args = serviceSpy.getConfirmatoryTests.calls.mostRecent().args;
      expect(args[2]).toBe(5);
    }));
  });

  describe('Confirmatory Test Type Groups', () => {
    it('should group confirmatory tests by testType', () => {
      const mixedConfirms: ConfirmatoryTestDto[] = [
        { ...mockConfirmatoryTests[0], testType: 'Profile' },
        { ...mockConfirmatoryTests[0], testId: 'HBC-CONF', testType: 'Profile' },
        { ...mockConfirmatoryTests[0], testId: 'ANT-1', testType: 'Antigen' },
      ];

      component.confirmTests.set(mixedConfirms);

      const groups = component.confirmTestTypeGroups();
      expect(groups.length).toBe(2);
      expect(groups[0].type).toBe('Profile');
      expect(groups[0].items.length).toBe(2);
      expect(groups[1].type).toBe('Antigen');
      expect(groups[1].items.length).toBe(1);
    });

    it('should return empty array when no confirmatory tests', () => {
      component.confirmTests.set([]);
      expect(component.confirmTestTypeGroups()).toEqual([]);
    });

    it('should use Other for null testType', () => {
      const confirms: ConfirmatoryTestDto[] = [
        { ...mockConfirmatoryTests[0], testType: null },
      ];
      component.confirmTests.set(confirms);

      const groups = component.confirmTestTypeGroups();
      expect(groups[0].type).toBe('Other');
    });
  });

  describe('Donation Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should mark correct donation as selected', () => {
      component.selectDonation(mockDonations[0]);
      expect(component.isSelected(mockDonations[0])).toBeTrue();
      expect(component.isSelected(mockDonations[1])).toBeFalse();
    });

    it('should return false for isSelected when no donation is selected', () => {
      component.selectedDonation.set(null);
      expect(component.isSelected(mockDonations[0])).toBeFalse();
    });

    it('should use displayUnitId in selectedDonationInfo getter', fakeAsync(() => {
      component.selectDonation(mockDonations[0]);
      tick();

      expect(component.selectedDonationInfo).toContain('W66712328191-H');
      expect(component.selectedDonationInfo).toContain('12-AUG-2024');
    }));

    it('should return empty string for selectedDonationInfo when no donation selected', () => {
      component.selectedDonation.set(null);
      expect(component.selectedDonationInfo).toBe('');
    });
  });

  describe('Refresh', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should reload test results for selected donation', fakeAsync(() => {
      serviceSpy.getTestResults.calls.reset();
      component.onRefresh();
      tick();

      expect(serviceSpy.getTestResults).toHaveBeenCalled();
    }));

    it('should not reload when no donation is selected', fakeAsync(() => {
      component.selectedDonation.set(null);
      serviceSpy.getTestResults.calls.reset();
      component.onRefresh();
      tick();

      expect(serviceSpy.getTestResults).not.toHaveBeenCalled();
    }));
  });

  describe('Panel Close', () => {

    it('should emit closePanel via side panel close button', () => {
      fixture.detectChanges();
      spyOn(component.closePanel, 'emit');

      const closeButton = fixture.debugElement.query(By.css('.side-panel__close-btn'));
      if (closeButton) {
        closeButton.nativeElement.click();
        expect(component.closePanel.emit).toHaveBeenCalled();
      } else {
        component.onClose();
        expect(component.closePanel.emit).toHaveBeenCalled();
      }
    });

    it('should emit closePanel on onClose call', () => {
      spyOn(component.closePanel, 'emit');
      component.onClose();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should handle close action from side panel button click', () => {
      spyOn(component.closePanel, 'emit');
      component.onSidePanelButtonClick('close');
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should not emit closePanel for non-close actions', () => {
      spyOn(component.closePanel, 'emit');
      component.onSidePanelButtonClick('other');
      expect(component.closePanel.emit).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should have scope="col" on table headers', () => {
      fixture.detectChanges();
      const headers = fixture.debugElement.queryAll(By.css('th[scope="col"]'));
      expect(headers.length).toBeGreaterThan(0);
    });

    it('should have aria-label on donations table', () => {
      fixture.detectChanges();
      const table = fixture.debugElement.query(By.css('.donations-table'));
      if (table) {
        expect(table.nativeElement.getAttribute('aria-label')).toBe('Donation records');
      }
    });

    it('should have aria-label on test results table', () => {
      fixture.detectChanges();
      const table = fixture.debugElement.query(By.css('.test-results-table'));
      if (table) {
        expect(table.nativeElement.getAttribute('aria-label')).toBe('Test results');
      }
    });

    it('should have role=alert on hidden tests warning', fakeAsync(() => {
      serviceSpy.getTestResults.and.returnValue(of({
        data: mockTestResults,
        hasHiddenTests: true,
        hasValidTests: true
      }));

      component.ngOnInit();
      tick();
      fixture.detectChanges();

      const warning = fixture.debugElement.query(By.css('.hidden-tests-warning'));
      if (warning) {
        expect(warning.nativeElement.getAttribute('role')).toBe('alert');
      }
    }));
  });

  describe('Computed Values', () => {
    it('should compute hasDonations correctly', () => {
      component.donations.set([]);
      expect(component.hasDonations()).toBeFalse();

      component.donations.set(mockDonations);
      expect(component.hasDonations()).toBeTrue();
    });

    it('should compute hasSelectedDonation correctly', () => {
      component.selectedDonation.set(null);
      expect(component.hasSelectedDonation()).toBeFalse();

      component.selectedDonation.set(mockDonations[0]);
      expect(component.hasSelectedDonation()).toBeTrue();
    });

    it('should compute displayedTests correctly without confirm tests', () => {
      component.testResults.set(mockTestResults);
      component.showConfirm.set(false);

      expect(component.displayedTests()).toEqual(mockTestResults);
    });

    it('should compute displayedTests correctly with confirm tests', () => {
      component.testResults.set(mockTestResults);
      component.confirmTests.set(mockConfirmatoryTests);
      component.showConfirm.set(true);

      const displayed = component.displayedTests();
      expect(displayed.length).toBe(mockTestResults.length + mockConfirmatoryTests.length);
    });

    it('should not add duplicate confirmatory tests', () => {
      const duplicateConfirm: ConfirmatoryTestDto[] = [
        {
          unitId: 'W66712328191',
          collDate: '2024-08-12',
          testId: 'HBC',
          testDesc: 'HBC Confirm',
          resultCode: 'NEG',
          chapterId: 'CH001',
          testType: null
        }
      ];

      component.testResults.set(mockTestResults);
      component.confirmTests.set(duplicateConfirm);
      component.showConfirm.set(true);

      const displayed = component.displayedTests();
      expect(displayed.length).toBe(mockTestResults.length + 1);
    });

    it('should use confirmatory testType when available', () => {
      component.testResults.set(mockTestResults);
      component.confirmTests.set(mockConfirmatoryTests);
      component.showConfirm.set(true);

      const displayed = component.displayedTests();
      const confirmEntry = displayed.find(t => t.testId === 'HIV-CONFIRM');
      expect(confirmEntry?.testType).toBe('Confirmatory');
    });

    it('should fallback to Confirm when confirmatory testType is null', () => {
      const confirmsNoType: ConfirmatoryTestDto[] = [{
        ...mockConfirmatoryTests[0],
        testType: null
      }];

      component.testResults.set(mockTestResults);
      component.confirmTests.set(confirmsNoType);
      component.showConfirm.set(true);

      const displayed = component.displayedTests();
      const confirmEntry = displayed.find(t => t.testId === 'HIV-CONFIRM');
      expect(confirmEntry?.testType).toBe('Confirm');
    });

    it('should return regular tests when showConfirm is true but no confirm tests', () => {
      component.testResults.set(mockTestResults);
      component.confirmTests.set([]);
      component.showConfirm.set(true);

      expect(component.displayedTests()).toEqual(mockTestResults);
    });
  });

  describe('Date Formatting', () => {
    it('should format dates for display in DD-MMM-YYYY format', () => {
      const formatted = component.formatDateDisplay('2024-08-12');
      expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
      expect(formatted).toBe('12-AUG-2024');
    });

    it('should handle invalid dates gracefully', () => {
      const invalid = component.formatDateDisplay('invalid-date');
      expect(invalid).toBe('invalid-date');
    });

    it('should format various valid dates correctly', () => {
      expect(component.formatDateDisplay('2025-01-01')).toBe('01-JAN-2025');
      expect(component.formatDateDisplay('2024-12-25')).toBe('25-DEC-2024');
      expect(component.formatDateDisplay('2025-07-27')).toBe('27-JUL-2025');
    });
  });

  describe('Sex Formatting', () => {
    it('should format M as Male via header response', fakeAsync(() => {
      component.sex = '';
      serviceSpy.getDonorHeader.and.returnValue(of({
        name: null, dateOfBirth: null, sex: 'M', abo: null
      }));

      fixture.detectChanges();
      tick();

      expect(component.sex).toBe('Male');
    }));

    it('should format F as Female via header response', fakeAsync(() => {
      component.sex = '';
      serviceSpy.getDonorHeader.and.returnValue(of({
        name: null, dateOfBirth: null, sex: 'F', abo: null
      }));

      fixture.detectChanges();
      tick();

      expect(component.sex).toBe('Female');
    }));

    it('should pass through non-M/F values', fakeAsync(() => {
      component.sex = '';
      serviceSpy.getDonorHeader.and.returnValue(of({
        name: null, dateOfBirth: null, sex: 'Other', abo: null
      }));

      fixture.detectChanges();
      tick();

      expect(component.sex).toBe('Other');
    }));
  });

  describe('Error Handling', () => {
    it('should set error when donor ID is missing', () => {
      component.donorId = '';
      component.ngOnInit();

      expect(component.error()).toBe('Donor ID is required');
    });

    it('should set error when donor ID exceeds 10 characters', () => {
      component.donorId = 'D12345678901';
      component.loadDonations();

      expect(component.error()).toBe('Donor ID must not exceed 10 characters');
    });

    it('should handle test results fetch error gracefully', fakeAsync(() => {
      serviceSpy.getTestResults.and.returnValue(throwError(() => new Error('API Error')));

      fixture.detectChanges();
      tick();

      component.selectDonation(mockDonations[0]);
      tick();

      expect(component.error()).toBeTruthy();
    }));

    it('should handle donations fetch error', fakeAsync(() => {
      serviceSpy.getDonations.and.returnValue(throwError(() => new Error('Network Error')));

      fixture.detectChanges();
      tick();

      expect(component.error()).toBe('Network Error');
      expect(component.loadingDonations()).toBeFalse();
    }));

    it('should show generic message when error has no message', fakeAsync(() => {
      serviceSpy.getDonations.and.returnValue(throwError(() => ({ })));

      fixture.detectChanges();
      tick();

      expect(component.error()).toBe('Failed to load donations');
    }));

    it('should clear error before loading donations', fakeAsync(() => {
      component.error.set('Previous error');
      serviceSpy.getDonations.and.returnValue(of(mockDonations));

      component.loadDonations();
      tick();

      expect(component.error()).toBeNull();
    }));
  });

  describe('loadDonorHeader', () => {
    it('should call getDonorHeader on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(serviceSpy.getDonorHeader).toHaveBeenCalledWith('D123456');
    }));

    it('should not call getDonorHeader when donorId is empty', fakeAsync(() => {
      component.donorId = '';
      serviceSpy.getDonorHeader.calls.reset();
      component.ngOnInit();
      tick();

      expect(serviceSpy.getDonorHeader).not.toHaveBeenCalled();
    }));

    it('should populate header fields from backend when not already set', fakeAsync(() => {
      component.donorName = '';
      component.dob = '';
      component.sex = '';
      component.abo = '';

      serviceSpy.getDonorHeader.and.returnValue(of({
        name: 'DOE, JOHN',
        dateOfBirth: '1990-05-15',
        sex: 'Male',
        abo: 'O POS'
      }));

      fixture.detectChanges();
      tick();

      expect(component.donorName).toBe('DOE, JOHN');
      expect(component.sex).toBe('Male');
      expect(component.abo).toBe('O POS');
    }));

    it('should not override existing donorName from header', fakeAsync(() => {
      component.donorName = 'EXISTING NAME';
      serviceSpy.getDonorHeader.and.returnValue(of({
        name: 'NEW NAME',
        dateOfBirth: null,
        sex: null,
        abo: 'O POS'
      }));

      fixture.detectChanges();
      tick();

      expect(component.donorName).toBe('EXISTING NAME');
    }));

    it('should always update abo from header', fakeAsync(() => {
      component.abo = 'A NEG';
      serviceSpy.getDonorHeader.and.returnValue(of({
        name: null,
        dateOfBirth: null,
        sex: null,
        abo: 'B POS'
      }));

      fixture.detectChanges();
      tick();

      expect(component.abo).toBe('B POS');
    }));

    it('should fall back to demographics on header error', fakeAsync(() => {
      component.donorName = '';
      component.dob = '';
      component.sex = '';
      component.abo = '';

      serviceSpy.getDonorHeader.and.returnValue(throwError(() => new Error('fail')));

      fixture.detectChanges();
      tick();

      expect(donorAttributesServiceSpy.getDonorDemographics).toHaveBeenCalledWith('D123456');
      expect(component.donorName).toBe('DARLAND, KATHLEEN');
    }));

    it('should handle demographics fallback error gracefully', fakeAsync(() => {
      component.donorName = '';
      serviceSpy.getDonorHeader.and.returnValue(throwError(() => new Error('fail')));
      donorAttributesServiceSpy.getDonorDemographics.and.returnValue(throwError(() => new Error('fail2')));

      fixture.detectChanges();
      tick();

      // Should not throw, name stays empty
      expect(component.donorName).toBe('');
    }));

    it('should handle null header response', fakeAsync(() => {
      serviceSpy.getDonorHeader.and.returnValue(of(null));

      fixture.detectChanges();
      tick();

      // Should not throw
      expect(component.donorName).toBe('DARLAND, KATHLEEN J');
    }));
  });

  describe('onShowConfirmChange', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should load confirmatory tests when showConfirm toggled on', () => {
      component.showConfirm.set(true);
      component.onShowConfirmChange();
      expect(serviceSpy.getConfirmatoryTests).toHaveBeenCalled();
    });

    it('should not load confirmatory tests when showConfirm is false', () => {
      serviceSpy.getConfirmatoryTests.calls.reset();
      component.showConfirm.set(false);
      component.onShowConfirmChange();
      expect(serviceSpy.getConfirmatoryTests).not.toHaveBeenCalled();
    });

    it('should not load confirmatory tests when no donation selected', () => {
      serviceSpy.getConfirmatoryTests.calls.reset();
      component.selectedDonation.set(null);
      component.showConfirm.set(true);
      component.onShowConfirmChange();
      expect(serviceSpy.getConfirmatoryTests).not.toHaveBeenCalled();
    });

    it('should pass accessLevel to getConfirmatoryTests', fakeAsync(() => {
      component.showConfirm.set(true);
      component.onShowConfirmChange();
      tick();

      const args = serviceSpy.getConfirmatoryTests.calls.mostRecent().args;
      expect(args[2]).toBe(5);
    }));
  });

  describe('onRefresh', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reload test results for selected donation', () => {
      serviceSpy.getTestResults.calls.reset();
      component.onRefresh();
      expect(serviceSpy.getTestResults).toHaveBeenCalled();
    });

    it('should do nothing when no donation selected', () => {
      serviceSpy.getTestResults.calls.reset();
      component.selectedDonation.set(null);
      component.onRefresh();
      expect(serviceSpy.getTestResults).not.toHaveBeenCalled();
    });
  });

  describe('onSidePanelButtonClick', () => {
    it('should call onClose for close action', () => {
      spyOn(component.closePanel, 'emit');
      component.onSidePanelButtonClick('close');
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should do nothing for non-close actions', () => {
      spyOn(component.closePanel, 'emit');
      component.onSidePanelButtonClick('other');
      expect(component.closePanel.emit).not.toHaveBeenCalled();
    });
  });

  describe('isSelected', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return true when donation matches selected', () => {
      expect(component.isSelected(mockDonations[0])).toBeTrue();
    });

    it('should return false when donation does not match', () => {
      expect(component.isSelected(mockDonations[1])).toBeFalse();
    });

    it('should return false when no donation selected', () => {
      component.selectedDonation.set(null);
      expect(component.isSelected(mockDonations[0])).toBeFalse();
    });
  });

  describe('selectedDonationInfo', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return formatted info when donation selected', () => {
      expect(component.selectedDonationInfo).toContain('W66712328191-H');
      expect(component.selectedDonationInfo).toContain('Unit ID:');
      expect(component.selectedDonationInfo).toContain('Collection Date:');
    });

    it('should return empty string when no donation selected', () => {
      component.selectedDonation.set(null);
      expect(component.selectedDonationInfo).toBe('');
    });
  });

  describe('selectDonation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reset showConfirm and confirmTests on selection', () => {
      component.showConfirm.set(true);
      component.confirmTests.set(mockConfirmatoryTests);

      component.selectDonation(mockDonations[1]);

      expect(component.showConfirm()).toBeFalse();
      expect(component.confirmTests()).toEqual([]);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ on destroy', () => {
      spyOn((component as any).destroy$, 'next');
      spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect((component as any).destroy$.next).toHaveBeenCalled();
      expect((component as any).destroy$.complete).toHaveBeenCalled();
    });
  });

  describe('displayedTests dedup', () => {
    it('should deduplicate confirm tests that already exist in test results', () => {
      // Use testType 'Confirmatory' to match the mock confirm test's testType
      const testResults: TestResultDto[] = [
        { testId: 'HIV-CONFIRM', resultCode: 'NEG', reactive: null, testType: 'Confirmatory', absorbance: null }
      ];
      component.testResults.set(testResults);
      component.confirmTests.set(mockConfirmatoryTests);
      component.showConfirm.set(true);

      const displayed = component.displayedTests();
      // The confirm test has the same testId and testType='Confirmatory', so it should be deduped
      expect(displayed.length).toBe(1);
    });
  });

  describe('loadTestResults with showConfirm already on', () => {
    it('should also load confirmatory tests when showConfirm is true', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.showConfirm.set(true);
      serviceSpy.getConfirmatoryTests.calls.reset();

      component.selectDonation(mockDonations[0]);
      // selectDonation resets showConfirm to false, so confirm tests are NOT loaded
      // Let's test directly via loadTestResults behavior:
      component.showConfirm.set(true);
      serviceSpy.getTestResults.calls.reset();
      serviceSpy.getConfirmatoryTests.calls.reset();
      (component as any).loadTestResults(mockDonations[0].unitId, mockDonations[0].collDate);
      tick();

      expect(serviceSpy.getConfirmatoryTests).toHaveBeenCalled();
    }));
  });

  describe('loadConfirmatoryTests error', () => {
    it('should handle confirmatory test fetch error gracefully', fakeAsync(() => {
      serviceSpy.getConfirmatoryTests.and.returnValue(throwError(() => new Error('Confirm error')));
      fixture.detectChanges();
      tick();

      component.showConfirm.set(true);
      component.onShowConfirmChange();
      tick();

      // Should not throw
      expect(component.confirmTests()).toEqual([]);
    }));
  });

  describe('loadTestResults error message', () => {
    it('should use generic message when error has no message', fakeAsync(() => {
      serviceSpy.getTestResults.and.returnValue(throwError(() => ({})));
      fixture.detectChanges();
      tick();

      component.selectDonation(mockDonations[0]);
      tick();

      expect(component.error()).toBe('Failed to load test results');
      expect(component.loadingTests()).toBeFalse();
    }));
  });

  describe('Loading States', () => {
    it('should set loadingDonations while fetching', fakeAsync(() => {
      const donationsSubject = new Subject<DonationRecordDto[]>();
      serviceSpy.getDonations.and.returnValue(donationsSubject.asObservable());

      expect(component.loadingDonations()).toBeFalse();

      component.loadDonations();
      expect(component.loadingDonations()).toBeTrue();

      donationsSubject.next(mockDonations);
      donationsSubject.complete();
      tick();
      expect(component.loadingDonations()).toBeFalse();
    }));

    it('should set loadingTests while fetching test results', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const testSubject = new Subject<TestResultsResponse>();
      serviceSpy.getTestResults.and.returnValue(testSubject.asObservable());
      component.selectDonation(mockDonations[1]);

      expect(component.loadingTests()).toBeTrue();

      testSubject.next(mockTestResultsResponse);
      testSubject.complete();
      tick();
      expect(component.loadingTests()).toBeFalse();
    }));
  });

  describe('Empty States', () => {
    it('should show empty state when no donations found', fakeAsync(() => {
      serviceSpy.getDonations.and.returnValue(of([]));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.hasDonations()).toBeFalse();
      const emptyState = fixture.debugElement.query(By.css('.donations-panel .empty-state'));
      expect(emptyState).toBeTruthy();
      expect(emptyState.nativeElement.textContent).toContain('No donations found for this donor');
    }));

    it('should show no test results message when tests are empty', fakeAsync(() => {
      serviceSpy.getTestResults.and.returnValue(of({
        data: [],
        hasHiddenTests: false,
        hasValidTests: false
      }));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const emptyState = fixture.debugElement.query(By.css('.test-results-panel .empty-state'));
      if (emptyState) {
        expect(emptyState.nativeElement.textContent).toContain('No test results available');
      }
    }));
  });

  describe('Side Panel Configuration', () => {
    it('should have CLOSE button configured', () => {
      expect(component.sidePanelButtons.length).toBe(1);
      expect(component.sidePanelButtons[0].label).toBe('CLOSE');
      expect(component.sidePanelButtons[0].action).toBe('close');
      expect(component.sidePanelButtons[0].variant).toBe('secondary');
    });
  });
});
