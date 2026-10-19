import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PageHeaderWithBreadcrumb } from './page-header-with-breadcrumb';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderConfig, BreadcrumbItem, ActionButton } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';

describe('PageHeaderWithBreadcrumb', () => {
  let component: PageHeaderWithBreadcrumb;
  let fixture: ComponentFixture<PageHeaderWithBreadcrumb>;
  let compiled: HTMLElement;
  let mockPageHeaderService: any;

  const mockBreadcrumbs: BreadcrumbItem[] = [
    {
      label: 'Home',
      link: '/home',
      ariaLabel: 'Navigate to home'
    },
    {
      label: 'Products',
      link: '/products'
    },
    {
      label: 'Product Details',
      link: null
    }
  ];

  const mockActions: ActionButton[] = [
    {
      label: 'Add New',
      icon: 'add',
      color: 'primary',
      ariaLabel: 'Add new item',
      disabled: false,
      onClick: jasmine.createSpy('onClickSpy1')
    },
    {
      label: 'Export',
      icon: 'download',
      color: 'accent',
      disabled: false,
      onClick: jasmine.createSpy('onClickSpy2')
    },
    {
      label: 'Disabled Action',
      icon: 'block',
      disabled: true,
      onClick: jasmine.createSpy('onClickSpy3')
    }
  ];

  const mockConfig: PageHeaderConfig = {
    breadcrumbs: mockBreadcrumbs,
    title: 'Product Details',
    subtitle: 'View and manage product information',
    actions: mockActions
  };

  beforeEach(() => {

    mockPageHeaderService = {
      getTitle: jasmine.createSpy('getTitle').and.returnValue(undefined),
      getSubtitle: jasmine.createSpy('getSubtitle').and.returnValue(undefined),
      getCurrentMenuItem: jasmine.createSpy('getCurrentMenuItem').and.returnValue(undefined)
    };



      TestBed.configureTestingModule({
      imports: [
        PageHeaderWithBreadcrumb,
        TranslateModule.forRoot(),
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: PageHeaderService, useValue: mockPageHeaderService }
      ]
    });


    



    fixture = TestBed.createComponent(PageHeaderWithBreadcrumb);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;


    });


  describe('Breadcrumb rendering', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('config', mockConfig);
      fixture.detectChanges();
    });





    it('should render breadcrumb text without link for last item', () => {
      const breadcrumbItems = compiled.querySelectorAll('.breadcrumb__item');
      const lastItem = breadcrumbItems[breadcrumbItems.length - 1];
      const link = lastItem.querySelector('.breadcrumb__link');
      const span = lastItem.querySelector('span');

      expect(link).toBeNull();
      expect(span).toBeTruthy();
      expect(span?.textContent?.trim()).toBe('Product Details');
    });

    it('should render breadcrumb text without link for items without link property', () => {
      const configWithoutLink: PageHeaderConfig = {
        ...mockConfig,
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: 'No Link' }
        ]
      };
      fixture.componentRef.setInput('config', configWithoutLink);
      fixture.detectChanges();

      const breadcrumbItems = compiled.querySelectorAll('.breadcrumb__item');
      const lastItem = breadcrumbItems[breadcrumbItems.length - 1];
      const span = lastItem.querySelector('span');

      expect(span?.textContent?.trim()).toBe('No Link');
    });



    it('should set aria-current="page" on last breadcrumb item', () => {
      const breadcrumbItems = compiled.querySelectorAll('.breadcrumb__item');
      const lastItem = breadcrumbItems[breadcrumbItems.length - 1] as HTMLElement;

      expect(lastItem.getAttribute('aria-current')).toBe('page');
    });

    it('should not set aria-current on non-last breadcrumb items', () => {
      const breadcrumbItems = compiled.querySelectorAll('.breadcrumb__item');
      const firstItem = breadcrumbItems[0] as HTMLElement;

      expect(firstItem.getAttribute('aria-current')).toBeNull();
    });



    it('should use label as aria-label when ariaLabel is not provided', () => {
      const breadcrumbLinks = compiled.querySelectorAll('.breadcrumb__link');
      const secondLink = breadcrumbLinks[1] as HTMLElement;

      expect(secondLink.getAttribute('aria-label')).toBe('Products');
    });

    it('should render chevron icons between breadcrumb items', () => {
      const chevronIcons = compiled.querySelectorAll('.breadcrumb__item mat-icon');
      expect(chevronIcons.length).toBeGreaterThan(0);
    });


  });

  describe('Page header rendering', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('config', mockConfig);
      fixture.detectChanges();
    });

    it('should render page title', () => {
      const title = compiled.querySelector('.page-header__title');
      expect(title?.textContent?.trim()).toBe('Product Details');
    });

    it('should render page subtitle when provided', () => {
      const subtitle = compiled.querySelector('.page-header__subtitle');
      expect(subtitle?.textContent?.trim()).toBe('View and manage product information');
    });


  });

  describe('Action buttons rendering', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('config', mockConfig);
      fixture.detectChanges();
    });

    it('should render all action buttons', () => {
      const actionButtons = compiled.querySelectorAll('.page-header__button');
      expect(actionButtons.length).toBe(3);
    });

    it('should render action button icons', () => {
      const buttons = compiled.querySelectorAll('.page-header__button');
      const firstButtonIcon = buttons[0].querySelector('mat-icon');

      expect(firstButtonIcon?.textContent?.trim()).toBe('add');
    });

    it('should render action button labels', () => {
      const buttons = compiled.querySelectorAll('.page-header__button');
      const firstButtonLabel = buttons[0].querySelector('.button-label');

      expect(firstButtonLabel?.textContent?.trim()).toBe('Add New');
    });

    it('should set disabled attribute on disabled buttons', () => {
      const buttons = compiled.querySelectorAll('.page-header__button');
      const disabledButton = buttons[2] as HTMLButtonElement;

      expect(disabledButton.disabled).toBe(true);
    });

    it('should not set disabled attribute on enabled buttons', () => {
      const buttons = compiled.querySelectorAll('.page-header__button');
      const enabledButton = buttons[0] as HTMLButtonElement;

      expect(enabledButton.disabled).toBe(false);
    });

    it('should set custom aria-label on action buttons', () => {
      const buttons = compiled.querySelectorAll('.page-header__button');
      const firstButton = buttons[0] as HTMLElement;

      expect(firstButton.getAttribute('aria-label')).toBe('Add new item');
    });

    it('should use label as aria-label when ariaLabel is not provided', () => {
      const buttons = compiled.querySelectorAll('.page-header__button');
      const secondButton = buttons[1] as HTMLElement;

      expect(secondButton.getAttribute('aria-label')).toBe('Export');
    });




  });

  describe('Material action buttons (matButton)', () => {
    it('should render stroked and raised mat buttons when configured', () => {
      const matConfig: PageHeaderConfig = {
        breadcrumbs: mockBreadcrumbs,
        title: 'T',
        actions: [
          {
            label: 'Secondary',
            matButton: 'stroked',
            color: 'accent',
            onClick: jasmine.createSpy('strokedClick')
          },
          {
            label: 'Primary',
            matButton: 'raised',
            color: 'primary',
            onClick: jasmine.createSpy('raisedClick')
          }
        ]
      };
      fixture.componentRef.setInput('config', matConfig);
      fixture.detectChanges();

      const matButtons = compiled.querySelectorAll('.page-header__mat-button');
      expect(matButtons.length).toBe(2);
      const labels = Array.from(matButtons).map((b) =>
        b.querySelector('.button-label')?.textContent?.trim()
      );
      expect(labels).toEqual(['Secondary', 'Primary']);
    });


  });
  describe('onActionClick', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('config', mockConfig);
      fixture.detectChanges();
    });





    it('should not throw error when onClick is undefined', () => {
      const actionWithoutOnClick = { ...mockActions[0], onClick: undefined };
      expect(() => component.onActionClick(actionWithoutOnClick)).not.toThrow();
    });




  });

  describe('trackByLabel', () => {
    it('should return label of breadcrumb item', () => {
      const item = mockBreadcrumbs[0];
      const result = component.trackByLabel(0, item);

      expect(result).toBe('Home');
    });

    it('should return label of action button', () => {
      const action = mockActions[0];
      const result = component.trackByLabel(0, action);

      expect(result).toBe('Add New');
    });

    it('should return different labels for different items', () => {
      const result1 = component.trackByLabel(0, mockBreadcrumbs[0]);
      const result2 = component.trackByLabel(1, mockBreadcrumbs[1]);

      expect(result1).not.toBe(result2);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('config', mockConfig);
      fixture.detectChanges();
    });











    it('should have button type attribute set to button', () => {
      const buttons = compiled.querySelectorAll('.page-header__button');
      buttons.forEach(button => {
        expect(button.getAttribute('type')).toBe('button');
      });
    });
  });

  describe('Edge cases', () => {


    it('should handle config with only breadcrumbs and title', () => {
      const minimalConfig: PageHeaderConfig = {
        breadcrumbs: mockBreadcrumbs,
        title: 'Minimal Page'
      };
      fixture.componentRef.setInput('config', minimalConfig);
      fixture.detectChanges();

      const title = compiled.querySelector('.page-header__title');
      expect(title?.textContent?.trim()).toBe('Minimal Page');
    });

    it('should handle action button without icon', () => {
      const actionWithoutIcon: ActionButton = {
        label: 'No Icon',
        onClick: jasmine.createSpy('noIconSpy')
      };
      const configWithNoIconAction: PageHeaderConfig = {
        ...mockConfig,
        actions: [actionWithoutIcon]
      };
      fixture.componentRef.setInput('config', configWithNoIconAction);
      fixture.detectChanges();

      const button = compiled.querySelector('.page-header__button');
      const icon = button?.querySelector('mat-icon');
      const label = button?.querySelector('.button-label');

      expect(icon).toBeNull();
      expect(label?.textContent?.trim()).toBe('No Icon');
    });




  });
});
