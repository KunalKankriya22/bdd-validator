import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, EventEmitter, Input, Output, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';

import { AddEditTemplatePage } from './add-edit-template-page';
import { MenuService } from '@shared/services/menu.service';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';

// Mock child components to avoid pulling in their full dependency trees
@Component({ selector: 'app-add-edit-template', template: '', standalone: true })
class MockAddEditTemplate {
  @Output() save = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();
}

@Component({ selector: 'app-page-header-with-breadcrumb', template: '', standalone: true })
class MockPageHeaderWithBreadcrumb {
  @Input() config: any;
}

describe('AddEditTemplatePage', () => {
  let component: AddEditTemplatePage;
  let fixture: ComponentFixture<AddEditTemplatePage>;
  let routerSpy: jasmine.SpyObj<Router>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let menuServiceMock: any;
  let menuItemsSignal: WritableSignal<any[]>;

  const hhManagementPath = ROUTE_REGISTRY[RouteKey.HealthHistoryManagement].path;

  /**
   * Creates the component with optional history state.
   * Must be called after TestBed.configureTestingModule + compileComponents.
   */
  function createComponent(historyState: Record<string, any> = {}): void {
    // Set history.state before component creation so loadRouteState() picks it up
    window.history.pushState(historyState, '', '');

    fixture = TestBed.createComponent(AddEditTemplatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  /**
   * Configures TestBed with all providers and compiles.
   * Call this once per test or in beforeEach.
   */
  async function setupTestBed(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MenuService, useValue: menuServiceMock }
      ]
    })
      .overrideComponent(AddEditTemplatePage, {
        set: {
          imports: [CommonModule, MockAddEditTemplate, MockPageHeaderWithBreadcrumb],
        }
      })
      .compileComponents();
  }

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'getCurrentNavigation']);
    routerSpy.getCurrentNavigation.and.returnValue(null);
    routerSpy.navigate.and.returnValue(Promise.resolve(true));

    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    menuItemsSignal = signal<any[]>([]);
    menuServiceMock = {
      getMenuItemsSignal: () => menuItemsSignal,
      findMenuItemByPath: jasmine.createSpy('findMenuItemByPath').and.returnValue(null)
    };

    await setupTestBed();
  });

  afterEach(() => {
    // Clean up history state
    window.history.pushState({}, '', '');
  });

  // ---------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------

  describe('initialization with mode', () => {
    it('should set mode to "add" from history state', () => {
      createComponent({ mode: 'add' });
      expect(component.mode).toBe('add');
    });

    it('should set mode to "edit" from history state', () => {
      createComponent({ mode: 'edit' });
      expect(component.mode).toBe('edit');
    });

    it('should not redirect when mode is set', () => {
      createComponent({ mode: 'add' });
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('initialization without mode', () => {
    it('should leave mode as null when no state is provided', () => {
      createComponent({});
      expect(component.mode).toBeNull();
    });

    it('should redirect to health history management page when mode is null', () => {
      createComponent({});
      // ngOnInit is called by detectChanges in createComponent
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        [hhManagementPath],
        { queryParams: { tab: 2 } }
      );
    });
  });

  // ---------------------------------------------------------------
  // loadRouteState
  // ---------------------------------------------------------------

  describe('loadRouteState', () => {
    it('should read mode from router getCurrentNavigation extras state', () => {
      routerSpy.getCurrentNavigation.and.returnValue({
        extras: { state: { mode: 'edit' } }
      } as any);

      createComponent({});
      expect(component.mode).toBe('edit');
    });

    it('should fall back to history.state when getCurrentNavigation returns null', () => {
      routerSpy.getCurrentNavigation.and.returnValue(null);
      createComponent({ mode: 'add' });
      expect(component.mode).toBe('add');
    });

    it('should not set mode when state has no mode property', () => {
      createComponent({ someOtherProp: 'value' });
      expect(component.mode).toBeNull();
    });
  });

  // ---------------------------------------------------------------
  // headerConfig
  // ---------------------------------------------------------------

  describe('headerConfig', () => {
    it('should have three breadcrumbs', () => {
      createComponent({ mode: 'add' });
      expect(component.headerConfig.breadcrumbs.length).toBe(3);
    });

    it('should have Home as first breadcrumb with link /home', () => {
      createComponent({ mode: 'add' });
      expect(component.headerConfig.breadcrumbs[0]).toEqual({ label: 'Home', link: '/home' });
    });

    it('should have Health History Management as second breadcrumb', () => {
      createComponent({ mode: 'add' });
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Health History Management');
      expect(component.headerConfig.breadcrumbs[1].link).toBe(hhManagementPath);
    });

    it('should have "Add New Template" as third breadcrumb by default', () => {
      createComponent({ mode: 'add' });
      expect(component.headerConfig.breadcrumbs[2]).toEqual({ label: 'Add New Template', link: null });
    });

    it('should have showBackButton set to true', () => {
      createComponent({ mode: 'add' });
      expect(component.headerConfig.showBackButton).toBe(true);
    });

    it('should have empty title and subtitle', () => {
      createComponent({ mode: 'add' });
      expect(component.headerConfig.title).toBe('');
      expect(component.headerConfig.subtitle).toBe('');
    });

    it('should have empty actions array', () => {
      createComponent({ mode: 'add' });
      expect(component.headerConfig.actions).toEqual([]);
    });

    it('should have onBackClick that navigates back', () => {
      createComponent({ mode: 'add' });
      component.headerConfig.onBackClick!();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        [hhManagementPath],
        { queryParams: { tab: 2 } }
      );
    });
  });

  // ---------------------------------------------------------------
  // Menu effect - breadcrumb updates
  // ---------------------------------------------------------------

  describe('menu effect breadcrumb updates', () => {
    it('should update breadcrumbs when menu items signal emits with matching menu item', () => {
      const mockMenuItem = {
        label: 'HH Questions Bank',
        routeKey: RouteKey.HealthHistoryManagement,
        routePath: hhManagementPath
      };
      menuServiceMock.findMenuItemByPath = jasmine.createSpy('findMenuItemByPath').and.returnValue(mockMenuItem);

      createComponent({ mode: 'add' });

      // Trigger the effect by updating the signal
      menuItemsSignal.set([mockMenuItem]);
      TestBed.flushEffects();
      fixture.detectChanges();

      expect(component.headerConfig.breadcrumbs[1].label).toBe('HH Questions Bank');
      expect(component.headerConfig.breadcrumbs[2].label).toBe('Add New Template');
    });

    it('should show "Edit Template" breadcrumb label when mode is edit', () => {
      const mockMenuItem = {
        label: 'HH Questions Bank',
        routeKey: RouteKey.HealthHistoryManagement,
        routePath: hhManagementPath
      };
      menuServiceMock.findMenuItemByPath = jasmine.createSpy('findMenuItemByPath').and.returnValue(mockMenuItem);

      createComponent({ mode: 'edit' });

      menuItemsSignal.set([mockMenuItem]);
      TestBed.flushEffects();
      fixture.detectChanges();

      expect(component.headerConfig.breadcrumbs[2].label).toBe('Edit Template');
    });

    it('should not update breadcrumbs when menu items signal is empty', () => {
      createComponent({ mode: 'add' });

      // Signal starts empty, set it to empty again to trigger effect
      menuItemsSignal.set([]);
      TestBed.flushEffects();
      fixture.detectChanges();

      // Breadcrumbs remain at default
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Health History Management');
    });

    it('should not update breadcrumbs when findMenuItemByPath returns null', () => {
      menuServiceMock.findMenuItemByPath = jasmine.createSpy('findMenuItemByPath').and.returnValue(null);

      createComponent({ mode: 'add' });

      menuItemsSignal.set([{ label: 'Something' }]);
      TestBed.flushEffects();
      fixture.detectChanges();

      // Breadcrumbs should still be default since findMenuItemByPath returned null
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Health History Management');
    });

    it('should call findMenuItemByPath with the correct path when items available', () => {
      const mockMenuItem = {
        label: 'Custom Label',
        routeKey: RouteKey.HealthHistoryManagement,
        routePath: hhManagementPath
      };
      menuServiceMock.findMenuItemByPath = jasmine.createSpy('findMenuItemByPath').and.returnValue(mockMenuItem);

      createComponent({ mode: 'add' });

      menuItemsSignal.set([mockMenuItem]);
      TestBed.flushEffects();
      fixture.detectChanges();

      expect(menuServiceMock.findMenuItemByPath).toHaveBeenCalledWith(hhManagementPath);
    });
  });

  // ---------------------------------------------------------------
  // onSaved
  // ---------------------------------------------------------------

  describe('onSaved', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
    });

    it('should show snackbar with template ID when templateId is provided', () => {
      component.onSaved('TPL-001');
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Template TPL-001 saved successfully',
        'DISMISS',
        jasmine.objectContaining({
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        })
      );
    });

    it('should show snackbar with generic message when templateId is undefined', () => {
      component.onSaved(undefined);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Template saved successfully',
        'DISMISS',
        jasmine.objectContaining({
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        })
      );
    });

    it('should show generic message when onSaved is called without arguments', () => {
      component.onSaved();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Template saved successfully',
        'DISMISS',
        jasmine.objectContaining({
          duration: 3000
        })
      );
    });

    it('should show snackbar with empty string templateId', () => {
      component.onSaved('');
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Template saved successfully',
        'DISMISS',
        jasmine.objectContaining({ duration: 3000 })
      );
    });

    it('should navigate back after showing snackbar', () => {
      component.onSaved('TPL-002');
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        [hhManagementPath],
        { queryParams: { tab: 2 } }
      );
    });

    it('should navigate back even when templateId is not provided', () => {
      component.onSaved();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        [hhManagementPath],
        { queryParams: { tab: 2 } }
      );
    });
  });

  // ---------------------------------------------------------------
  // onCancel
  // ---------------------------------------------------------------

  describe('onCancel', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
    });

    it('should navigate back to health history management page', () => {
      component.onCancel();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        [hhManagementPath],
        { queryParams: { tab: 2 } }
      );
    });

    it('should not show any snackbar message', () => {
      component.onCancel();
      expect(snackBarSpy.open).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // navigateBack (private, tested through public API)
  // ---------------------------------------------------------------

  describe('navigateBack', () => {
    beforeEach(() => {
      createComponent({ mode: 'edit' });
    });

    it('should navigate to hhManagementPath with tab=2 via onCancel', () => {
      component.onCancel();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        [hhManagementPath],
        { queryParams: { tab: 2 } }
      );
    });

    it('should navigate to hhManagementPath with tab=2 via onSaved', () => {
      component.onSaved('TPL-100');
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        [hhManagementPath],
        { queryParams: { tab: 2 } }
      );
    });

    it('should navigate to hhManagementPath with tab=2 via headerConfig.onBackClick', () => {
      component.headerConfig.onBackClick!();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        [hhManagementPath],
        { queryParams: { tab: 2 } }
      );
    });
  });

  // ---------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle mode set via getCurrentNavigation with extras but no state', () => {
      routerSpy.getCurrentNavigation.and.returnValue({
        extras: {}
      } as any);
      createComponent({});
      expect(component.mode).toBeNull();
    });

    it('should handle getCurrentNavigation returning navigation without extras', () => {
      routerSpy.getCurrentNavigation.and.returnValue({} as any);
      createComponent({});
      expect(component.mode).toBeNull();
    });

    it('should prefer getCurrentNavigation state over history.state', () => {
      routerSpy.getCurrentNavigation.and.returnValue({
        extras: { state: { mode: 'edit' } }
      } as any);

      // Push 'add' to history, but getCurrentNavigation returns 'edit'
      createComponent({ mode: 'add' });
      expect(component.mode).toBe('edit');
    });

    it('should preserve hhManagementPath link in second breadcrumb after menu update', () => {
      const mockMenuItem = {
        label: 'Dynamic Label',
        routeKey: RouteKey.HealthHistoryManagement,
        routePath: hhManagementPath
      };
      menuServiceMock.findMenuItemByPath = jasmine.createSpy('findMenuItemByPath').and.returnValue(mockMenuItem);

      createComponent({ mode: 'add' });

      menuItemsSignal.set([mockMenuItem]);
      TestBed.flushEffects();
      fixture.detectChanges();

      expect(component.headerConfig.breadcrumbs[1].link).toBe(hhManagementPath);
    });

    it('should keep Home breadcrumb unchanged after menu update', () => {
      const mockMenuItem = {
        label: 'Changed Label',
        routeKey: RouteKey.HealthHistoryManagement,
        routePath: hhManagementPath
      };
      menuServiceMock.findMenuItemByPath = jasmine.createSpy('findMenuItemByPath').and.returnValue(mockMenuItem);

      createComponent({ mode: 'edit' });

      menuItemsSignal.set([mockMenuItem]);
      TestBed.flushEffects();
      fixture.detectChanges();

      expect(component.headerConfig.breadcrumbs[0]).toEqual({ label: 'Home', link: '/home' });
    });

    it('should set last breadcrumb link to null', () => {
      createComponent({ mode: 'add' });
      expect(component.headerConfig.breadcrumbs[2].link).toBeNull();
    });
  });

  // ---------------------------------------------------------------
  // Component creation
  // ---------------------------------------------------------------

  describe('component creation', () => {
    it('should create the component', () => {
      createComponent({ mode: 'add' });
      expect(component).toBeTruthy();
    });

    it('should be an instance of AddEditTemplatePage', () => {
      createComponent({ mode: 'add' });
      expect(component).toBeInstanceOf(AddEditTemplatePage);
    });
  });
});
