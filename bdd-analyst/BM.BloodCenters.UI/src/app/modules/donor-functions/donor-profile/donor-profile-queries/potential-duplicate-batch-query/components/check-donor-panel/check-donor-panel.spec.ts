import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CheckDonorPanel } from './check-donor-panel';
import { CheckSection } from '../../models/potential-duplicate-batch-query.model';

describe('CheckDonorPanel', () => {
  let component: CheckDonorPanel;
  let fixture: ComponentFixture<CheckDonorPanel>;

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [CheckDonorPanel, NoopAnimationsModule]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(CheckDonorPanel);
    component = fixture.componentInstance;
    component.donorName = 'Christopher Hunter';
    component.donorId = 'DN20111045';
    component.batchId = 'DP00000033';


    });

  describe('Initialization', () => {


    it('should initialize with demographics section expanded', () => {
      fixture.detectChanges();
      expect(component.expandedSection()).toBe('demographics');
    });

    it('should have all sections defined', () => {
      expect(component.sections.length).toBe(4);
      expect(component.sections[0].key).toBe('demographics');
      expect(component.sections[1].key).toBe('interdictions');
      expect(component.sections[2].key).toBe('donations');
      expect(component.sections[3].key).toBe('attributes');
    });
  });

  describe('Section Expansion', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should expand section when clicked', () => {
      component.onSectionExpanded('interdictions');
      expect(component.expandedSection()).toBe('interdictions');
    });

    it('should display all expansion panels', () => {
      const panels = fixture.debugElement.queryAll(By.css('mat-expansion-panel'));
      expect(panels.length).toBe(4);
    });

    it('should show Demographics panel first', () => {
      const panels = fixture.debugElement.queryAll(By.css('mat-panel-title span'));
      expect(panels[0].nativeElement.textContent.trim()).toBe('Demographics');
    });
  });

  describe('Section Navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark section as checked when NEXT is clicked', () => {
      component.onNext('demographics');
      expect(component.isSectionChecked('demographics')).toBeTrue();
    });

    it('should move to next section when NEXT is clicked', () => {
      component.onNext('demographics');
      expect(component.expandedSection()).toBe('interdictions');
    });

    it('should navigate through all sections', () => {
      component.onNext('demographics');
      expect(component.expandedSection()).toBe('interdictions');

      component.onNext('interdictions');
      expect(component.expandedSection()).toBe('donations');

      component.onNext('donations');
      expect(component.expandedSection()).toBe('attributes');
    });

    it('should not navigate past last section', () => {
      component.expandedSection.set('attributes');
      component.onNext('attributes');
      expect(component.expandedSection()).toBe('attributes');
    });
  });

  describe('Check and Continue', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark attributes as checked', () => {
      component.onCheckAndContinue();
      expect(component.isSectionChecked('attributes')).toBeTrue();
    });

    it('should emit checkCompleted with all checked sections', () => {
      spyOn(component.checkCompleted, 'emit');

      component.checkedSections.set(new Set(['demographics', 'interdictions', 'donations']));
      component.onCheckAndContinue();

      const emittedSections = (component.checkCompleted.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedSections).toContain('demographics');
      expect(emittedSections).toContain('interdictions');
      expect(emittedSections).toContain('donations');
      expect(emittedSections).toContain('attributes');
    });

  });

  describe('Section Icons', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show unchecked icon for unchecked section', () => {
      const icon = component.getSectionIcon('demographics');
      expect(icon).toBe('lock');
    });

    it('should show checked icon for checked section', () => {
      component.checkedSections.set(new Set(['demographics']));
      const icon = component.getSectionIcon('demographics');
      expect(icon).toBe('lock');
    });
  });

  describe('Section Content', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display NEXT button for non-last sections', () => {
      component.expandedSection.set('demographics');
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button[mat-raised-button]'));

      // Find the NEXT button
      const nextButton = buttons.find(btn =>
        btn.nativeElement.textContent.trim() === 'NEXT'
      );

      expect(nextButton).toBeTruthy();
      expect(nextButton?.nativeElement.textContent.trim()).toBe('NEXT');
    });

    it('should show section heading for demographics', fakeAsync(() => {
      component.expandedSection.set('demographics');
      fixture.detectChanges();

      flush();
      fixture.detectChanges();

      const content = fixture.debugElement.query(By.css('.section-heading h3'));
      expect(content.nativeElement.textContent.trim()).toBe('DEMOGRAPHICS WINDOW');
    }));
  });
  describe('Helper Methods', () => {
    it('should identify attributes as last section', () => {
      expect(component.isLastSection('attributes')).toBeTrue();
    });

    it('should not identify other sections as last', () => {
      expect(component.isLastSection('demographics')).toBeFalse();
      expect(component.isLastSection('interdictions')).toBeFalse();
      expect(component.isLastSection('donations')).toBeFalse();
    });

    it('should check if section is checked', () => {
      component.checkedSections.set(new Set(['demographics', 'interdictions']));

      expect(component.isSectionChecked('demographics')).toBeTrue();
      expect(component.isSectionChecked('interdictions')).toBeTrue();
      expect(component.isSectionChecked('donations')).toBeFalse();
      expect(component.isSectionChecked('attributes')).toBeFalse();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should have descriptive aria-labels on section action buttons', fakeAsync(() => {
      component.expandedSection.set('demographics');
      fixture.detectChanges();

      flush();
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.section-actions button[aria-label]'));
      expect(button.attributes['aria-label']).toContain('Demographics');
    }));
  });
});
