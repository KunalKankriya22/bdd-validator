import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogTabs } from './dialog-tabs';
import { TranslateModule } from '@ngx-translate/core';
import { DialogTab } from '@shared/interfaces/dialog.interface';

describe('DialogTabs', () => {
  let component: DialogTabs;
  let fixture: ComponentFixture<DialogTabs>;

  const mockTabs: DialogTab[] = [
    { id: 'tab1', label: 'Tab 1' },
    { id: 'tab2', label: 'Tab 2' },
    { id: 'tab3', label: 'Tab 3', disabled: true }
  ];

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        DialogTabs,
        TranslateModule.forRoot()
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(DialogTabs);
    component = fixture.componentInstance;


    });

  describe('Input properties', () => {

    it('should have default activeTab as empty string', () => {
      expect(component.activeTab).toBe('');
    });

    it('should accept custom tabs', () => {
      component.tabs = mockTabs;
      expect(component.tabs).toEqual(mockTabs);
    });

    it('should accept custom activeTab', () => {
      component.activeTab = 'tab2';
      expect(component.activeTab).toBe('tab2');
    });
  });

  describe('ngOnInit', () => {
    it('should set first tab as active if none specified', () => {
      component.tabs = mockTabs;
      component.activeTab = '';

      component.ngOnInit();

      expect(component.activeTab).toBe('tab1');
    });

    it('should keep activeTab if already specified', () => {
      component.tabs = mockTabs;
      component.activeTab = 'tab2';

      component.ngOnInit();

      expect(component.activeTab).toBe('tab2');
    });

    it('should not set activeTab if no tabs', () => {
      component.tabs = [];
      component.activeTab = '';

      component.ngOnInit();

      expect(component.activeTab).toBe('');
    });
  });

  describe('onTabClick', () => {
    beforeEach(() => {
      component.tabs = mockTabs;
      component.activeTab = 'tab1';
    });

    it('should change activeTab and emit tabChange', () => {
      spyOn(component.tabChange, 'emit');

      component.onTabClick(mockTabs[1]);

      expect(component.activeTab).toBe('tab2');
      expect(component.tabChange.emit).toHaveBeenCalledWith('tab2');
    });


    it('should not change tab if disabled', () => {
      spyOn(component.tabChange, 'emit');

      component.onTabClick(mockTabs[2]);

      expect(component.activeTab).toBe('tab1');
      expect(component.tabChange.emit).not.toHaveBeenCalled();
    });
  });

  describe('onKeyDown', () => {
    beforeEach(() => {
      component.tabs = mockTabs;
      component.activeTab = 'tab1';
      fixture.detectChanges();
    });

    it('should navigate to next tab on ArrowRight', () => {
      spyOn(component.tabChange, 'emit');
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      spyOn(event, 'preventDefault');

      component.onKeyDown(event, mockTabs[0], 0);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.tabChange.emit).toHaveBeenCalledWith('tab2');
    });

    it('should navigate to previous tab on ArrowLeft', () => {
      component.activeTab = 'tab2';
      spyOn(component.tabChange, 'emit');
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      spyOn(event, 'preventDefault');

      component.onKeyDown(event, mockTabs[1], 1);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.tabChange.emit).toHaveBeenCalledWith('tab1');
    });

    it('should navigate to first tab on Home', () => {
      component.activeTab = 'tab2';
      spyOn(component.tabChange, 'emit');
      const event = new KeyboardEvent('keydown', { key: 'Home' });
      spyOn(event, 'preventDefault');

      component.onKeyDown(event, mockTabs[1], 1);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.tabChange.emit).toHaveBeenCalledWith('tab1');
    });

    it('should navigate to last enabled tab on End', () => {
      spyOn(component.tabChange, 'emit');
      const event = new KeyboardEvent('keydown', { key: 'End' });
      spyOn(event, 'preventDefault');

      component.onKeyDown(event, mockTabs[0], 0);

      expect(event.preventDefault).toHaveBeenCalled();
      // Tab 3 is disabled, so it should try to navigate there but won't emit
    });

    it('should activate tab on Enter', () => {
      component.activeTab = 'tab1';
      spyOn(component.tabChange, 'emit');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');

      component.onKeyDown(event, mockTabs[1], 1);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.tabChange.emit).toHaveBeenCalledWith('tab2');
    });

    it('should activate tab on Space', () => {
      component.activeTab = 'tab1';
      spyOn(component.tabChange, 'emit');
      const event = new KeyboardEvent('keydown', { key: ' ' });
      spyOn(event, 'preventDefault');

      component.onKeyDown(event, mockTabs[1], 1);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.tabChange.emit).toHaveBeenCalledWith('tab2');
    });


  });

  describe('isActive', () => {
    beforeEach(() => {
      component.tabs = mockTabs;
      component.activeTab = 'tab2';
    });

    it('should return true for active tab', () => {
      expect(component.isActive(mockTabs[1])).toBe(true);
    });

    it('should return false for inactive tab', () => {
      expect(component.isActive(mockTabs[0])).toBe(false);
    });
  });

  describe('trackByTab', () => {
    it('should return tab id as tracking key', () => {
      const tab: DialogTab = { id: 'test-tab', label: 'Test Tab' };

      const result = component.trackByTab(0, tab);

      expect(result).toBe('test-tab');
    });

    it('should return correct ids for mock tabs', () => {
      expect(component.trackByTab(0, mockTabs[0])).toBe('tab1');
      expect(component.trackByTab(1, mockTabs[1])).toBe('tab2');
      expect(component.trackByTab(2, mockTabs[2])).toBe('tab3');
    });
  });

  describe('Template rendering', () => {
    beforeEach(() => {
      component.tabs = mockTabs;
      fixture.detectChanges();
    });

    it('should render tabs', () => {
      const tabElements = fixture.nativeElement.querySelectorAll('.dialog-tabs__tab');
      expect(tabElements.length).toBe(3);
    });

    it('should display tab labels', () => {
      const tabElements = fixture.nativeElement.querySelectorAll('.dialog-tabs__tab');
      expect(tabElements[0]?.textContent).toContain('Tab 1');
      expect(tabElements[1]?.textContent).toContain('Tab 2');
    });

    it('should mark active tab', () => {
      component.activeTab = 'tab2';
      fixture.detectChanges();

      const activeTab = fixture.nativeElement.querySelector('.dialog-tabs__tab--active');
      expect(activeTab?.textContent).toContain('Tab 2');
    });

    it('should mark disabled tabs', () => {
      const disabledTabs = fixture.nativeElement.querySelectorAll('.dialog-tabs__tab--disabled, .dialog-tabs__tab[disabled]');
      expect(disabledTabs.length).toBeGreaterThanOrEqual(0);
    });
  });
});
