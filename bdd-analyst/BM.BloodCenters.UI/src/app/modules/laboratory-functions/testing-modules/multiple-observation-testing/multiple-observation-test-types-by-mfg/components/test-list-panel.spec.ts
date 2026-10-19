import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subject, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { TestListPanelComponent } from './test-list-panel';
import { TestTypesApiService } from '../services/test-types-api.service';
import { TestLookupDto } from '../models/test-types.model';

describe('TestListPanelComponent', () => {
  let component: TestListPanelComponent;
  let fixture: ComponentFixture<TestListPanelComponent>;
  let testTypesApiServiceSpy: jasmine.SpyObj<TestTypesApiService>;

  const mockTests: TestLookupDto[] = [
    { testId: 'ABORH', testDesc: 'ABO and Rh Blood Grouping' },
    { testId: 'ANTSC', testDesc: 'Antibody Screen' },
    { testId: 'DAT', testDesc: 'Direct Antiglobulin Test' }
  ];

  beforeEach(() => {

    testTypesApiServiceSpy = jasmine.createSpyObj('TestTypesApiService', [
      'getTestsLookup'
    ]);
    testTypesApiServiceSpy.getTestsLookup.and.returnValue(of(mockTests));

      TestBed.configureTestingModule({
imports: [TestListPanelComponent, NoopAnimationsModule],
      providers: [
        { provide: TestTypesApiService, useValue: testTypesApiServiceSpy }
      ]
    });

    });

  beforeEach(() => {

      testTypesApiServiceSpy.getTestsLookup.calls.reset();

      testTypesApiServiceSpy.getTestsLookup.and.returnValue(of(mockTests));

    fixture = TestBed.createComponent(TestListPanelComponent);
    component = fixture.componentInstance;

    });

  describe('Initialization', () => {

    it('should load tests on init', () => {
      fixture.detectChanges();

      expect(testTypesApiServiceSpy.getTestsLookup).toHaveBeenCalled();
      expect((component as any).allTests()).toEqual(mockTests);
      expect((component as any).filteredTests()).toEqual(mockTests);
    });

    it('should set loading state while fetching tests', fakeAsync(() => {
      const subject = new Subject<TestLookupDto[]>();
      testTypesApiServiceSpy.getTestsLookup.and.returnValue(subject.asObservable());

      expect((component as any).loading()).toBeFalse();

      fixture.detectChanges();
      expect((component as any).loading()).toBeTrue();

      subject.next(mockTests);
      subject.complete();
      tick();
      expect((component as any).loading()).toBeFalse();
    }));
  });

  describe('Test List Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display all tests', () => {
      const testItems = fixture.debugElement.queryAll(By.css('.test-item'));
      expect(testItems.length).toBe(3);
    });
  });

  describe('Test Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark test as selected based on input', () => {
      fixture.componentRef.setInput('selectedTestId', 'ABORH');
      fixture.detectChanges();

      expect(component.isSelected(mockTests[0])).toBeTrue();
      expect(component.isSelected(mockTests[1])).toBeFalse();
    });

    it('should apply selected styles to selected test', () => {
      fixture.componentRef.setInput('selectedTestId', 'ABORH');
      fixture.detectChanges();

      const firstItem = fixture.debugElement.query(By.css('.test-item'));
      expect(firstItem.nativeElement.classList.contains('active')).toBeTrue();
    });
  });
  describe('Error State', () => {
    it('should display error message', () => {
      testTypesApiServiceSpy.getTestsLookup.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      expect((component as any).error()).toBe('API Error');

      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.nativeElement.textContent).toContain('API Error');
    });

    it('should show retry button on error', () => {
      fixture.detectChanges(); // trigger ngOnInit first
      (component as any).error.set('Test error');
      (component as any).loading.set(false);
      (component as any).filteredTests.set([]);
      fixture.detectChanges();

      const retryButton = fixture.debugElement.query(By.css('.error-container button'));
      expect(retryButton).toBeTruthy();
      expect(retryButton.nativeElement.textContent).toContain('Retry');
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no tests found', () => {
      fixture.detectChanges(); // trigger ngOnInit first
      (component as any).allTests.set([]);
      (component as any).filteredTests.set([]);
      (component as any).loading.set(false);
      (component as any).error.set(null);
      fixture.detectChanges();

      const emptyContainer = fixture.debugElement.query(By.css('.empty-container'));
      expect(emptyContainer).toBeTruthy();
      expect(emptyContainer.nativeElement.textContent).toContain('No tests found');
    });
  });

  describe('Computed Signals', () => {
    it('should compute hasTests based on filteredTests', () => {
      (component as any).filteredTests.set(mockTests);
      expect(component.hasTests()).toBeTrue();

      (component as any).filteredTests.set([]);
      expect(component.hasTests()).toBeFalse();
    });

    it('should compute isEmpty correctly', () => {
      (component as any).loading.set(false);
      (component as any).error.set(null);
      (component as any).filteredTests.set([]);
      expect(component.isEmpty()).toBeTrue();

      (component as any).filteredTests.set(mockTests);
      expect(component.isEmpty()).toBeFalse();

      (component as any).filteredTests.set([]);
      (component as any).loading.set(true);
      expect(component.isEmpty()).toBeFalse();
    });
  });

  describe('Retry Functionality', () => {
    it('should clear error on retry', () => {
      (component as any).error.set('Previous error');

      component.retry();

      expect((component as any).error()).toBeNull();
    });
  });
});
