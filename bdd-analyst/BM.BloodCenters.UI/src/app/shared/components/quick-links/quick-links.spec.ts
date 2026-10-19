import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuickLinks } from './quick-links';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { QuickLink } from '@shared/interfaces/dialog.interface';

describe('QuickLinks', () => {
  let component: QuickLinks;
  let fixture: ComponentFixture<QuickLinks>;

  const mockLinks: QuickLink[] = [
    { id: 'link1', label: 'Link 1' },
    { id: 'link2', label: 'Link 2', disabled: true, tooltip: 'Disabled tooltip' },
    { id: 'link3', label: 'Link 3', tooltip: 'Active tooltip' }
  ];

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        QuickLinks,
        TranslateModule.forRoot()]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(QuickLinks);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Input properties', () => {


    it('should have default disabled as false', () => {
      expect(component.disabled).toBe(false);
    });

    it('should have default disabledTooltip as empty string', () => {
      expect(component.disabledTooltip).toBe('');
    });

    it('should accept custom title', () => {
      component.title = 'QUICK LINKS';
      expect(component.title).toBe('QUICK LINKS');
    });

    it('should accept custom links', () => {
      component.links = mockLinks;
      expect(component.links).toEqual(mockLinks);
    });
  });

  describe('onLinkClick', () => {
    beforeEach(() => {
      component.links = mockLinks;
    });

    it('should emit linkClick when enabled link is clicked', () => {
      spyOn(component.linkClick, 'emit');
      const event = new Event('click');
      spyOn(event, 'preventDefault');

      component.onLinkClick(mockLinks[0], event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.linkClick.emit).toHaveBeenCalledWith(mockLinks[0]);
    });



  });

  describe('getTooltip', () => {
    beforeEach(() => {
      component.links = mockLinks;
    });

    it('should return disabledTooltip when component is globally disabled', () => {
      component.disabled = true;
      component.disabledTooltip = 'All links disabled';

      const tooltip = component.getTooltip(mockLinks[0]);

      expect(tooltip).toBe('All links disabled');
    });

    it('should return link tooltip when link is disabled', () => {
      const tooltip = component.getTooltip(mockLinks[1]);

      expect(tooltip).toBe('Disabled tooltip');
    });

    it('should return link tooltip when link has tooltip', () => {
      const tooltip = component.getTooltip(mockLinks[2]);

      expect(tooltip).toBe('Active tooltip');
    });

  });

  describe('isLinkDisabled', () => {
    beforeEach(() => {
      component.links = mockLinks;
    });

    it('should return true when component is globally disabled', () => {
      component.disabled = true;

      expect(component.isLinkDisabled(mockLinks[0])).toBe(true);
    });

    it('should return true when link is disabled', () => {
      expect(component.isLinkDisabled(mockLinks[1])).toBe(true);
    });

    it('should return false when neither component nor link is disabled', () => {
      expect(component.isLinkDisabled(mockLinks[0])).toBe(false);
    });
  });

  describe('trackByLink', () => {
    it('should return link id as tracking key', () => {
      const link: QuickLink = { id: 'test-link', label: 'Test Link' };

      const result = component.trackByLink(0, link);

      expect(result).toBe('test-link');
    });

    it('should return correct id for different links', () => {
      expect(component.trackByLink(0, mockLinks[0])).toBe('link1');
      expect(component.trackByLink(1, mockLinks[1])).toBe('link2');
      expect(component.trackByLink(2, mockLinks[2])).toBe('link3');
    });
  });

  describe('Template rendering', () => {

    it('should render links', () => {
      component.links = mockLinks;
      fixture.detectChanges();

      const links = fixture.nativeElement.querySelectorAll('.quick-links__link');
      expect(links.length).toBe(3);
    });

    it('should apply disabled class to disabled links', () => {
      component.links = mockLinks;
      fixture.detectChanges();

      const disabledLinks = fixture.nativeElement.querySelectorAll('.quick-links__link--disabled');
      expect(disabledLinks.length).toBeGreaterThanOrEqual(1);
    });
  });
});
