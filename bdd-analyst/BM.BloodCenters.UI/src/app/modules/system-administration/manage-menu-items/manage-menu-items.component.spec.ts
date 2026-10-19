import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { ManageMenuItemsComponent } from './manage-menu-items.component';
import { MenuDetailsComponent } from './menu-details/menu-details.component';
import { MenuTreeComponent } from './menu-tree/menu-tree.component';
import { UnsavedChangesDialogComponent } from './unsaved-changes-dialog/unsaved-changes-dialog.component';
import { HeaderService } from '@shared/services/header.service';
import { MenuItemService } from './services/menu-item.service';
import { MenuService } from '@shared/services/menu.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { NavigationNode, Group } from './models/menu-item.model';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { MenuItemDialogResult } from './add-edit-menu-item/add-edit-menu-item.component';
import { createMockSnackbarService, createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';

// ---- test data helpers -------------------------------------------------------

const makeNode = (overrides: Partial<NavigationNode> = {}): NavigationNode => ({
  id: '1', label: 'Test Node', type: 'MENU', sequence: 1,
  access_lvl: 0, hidden: false, function_name: 'TSTFCN', children: [],
  ...overrides
});

const makeGroup = (overrides: Partial<Group> = {}): Group => ({
  applId: 'APP1', groupId: 'GRP1', description: 'Test Group',
  userCount: 5, lastModifiedDate: '2026-01-01',
  ...overrides
});

// ==============================================================================
// ManageMenuItemsComponent
// ==============================================================================

describe('ManageMenuItemsComponent', () => {
  let callArg: any;
  let component: ManageMenuItemsComponent;
  let fixture: ComponentFixture<ManageMenuItemsComponent>;
  let mockMenuItemService: jasmine.SpyObj<MenuItemService>;
  let mockMenuService: jasmine.SpyObj<MenuService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockPageHeaderService: { pageHeaderData: ReturnType<typeof signal<any>> };
  let chapterChanged$: Subject<void>;

  // flat tree: single root node, no children
  const flatTree: NavigationNode[] = [
    makeNode({ id: '10', label: 'Root A', sequence: 1, children: [] })
  ];

  // nested tree: root with one child (first leaf should be the child)
  const nestedTree: NavigationNode[] = [
    makeNode({ id: '1', label: 'Parent', sequence: 1, children: [
      makeNode({ id: '2', label: 'Child', sequence: 1, children: [] })
    ]})
  ];

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();
    const mockHeaderService: Partial<HeaderService> = {
      chapterChanged$: chapterChanged$.asObservable()
    };

    mockMenuItemService = jasmine.createSpyObj('MenuItemService', [
      'getGroups', 'getMenuTreeForGroup', 'addMenuItem', 'updateMenuItem'
    ]);
    mockMenuService    = jasmine.createSpyObj('MenuService', ['refreshMenuItems']);
    mockDialog         = createMockMatDialog();
    mockSnackBar       = createMockMatSnackBar();
    mockSnackbarService = createMockSnackbarService();
    mockPageHeaderService = { pageHeaderData: signal<any>(undefined) };

    mockMenuItemService.getGroups.and.returnValue(of([]));
    mockMenuItemService.getMenuTreeForGroup.and.returnValue(of(flatTree));



      TestBed.configureTestingModule({
      imports: [
        ManageMenuItemsComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: HeaderService,      useValue: mockHeaderService },
        { provide: MenuItemService,    useValue: mockMenuItemService },
        { provide: MenuService,        useValue: mockMenuService },
        { provide: MatDialog,          useValue: mockDialog },
        { provide: MatSnackBar,        useValue: mockSnackBar },
        { provide: SnackbarService,    useValue: mockSnackbarService },
        { provide: PageHeaderService,  useValue: mockPageHeaderService },
      ]
    });
      mockMenuItemService.getGroups.and.returnValue(of([]));


      mockMenuItemService.getMenuTreeForGroup.and.returnValue(of(flatTree));


    fixture   = TestBed.createComponent(ManageMenuItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // --------------------------------------------------------------------------
  // Creation
  // --------------------------------------------------------------------------


  // --------------------------------------------------------------------------
  // ngOnDestroy
  // --------------------------------------------------------------------------

  describe('ngOnDestroy', () => {
    it('should call next and complete on the internal destroy$ subject', () => {
      const nextSpy     = spyOn((component as any).destroy$, 'next').and.callThrough();
      const completeSpy = spyOn((component as any).destroy$, 'complete').and.callThrough();
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Initial signal state
  // --------------------------------------------------------------------------

  describe('initial signal state', () => {
    it('selectedGroup should be null', () => {
      expect(component.selectedGroup()).toBeNull();
    });

    it('menuTreeData should be empty', () => {
      expect(component.menuTreeData()).toEqual([]);
    });

    it('selectedMenuNode should be null', () => {
      expect(component.selectedMenuNode()).toBeNull();
    });

    it('isLoadingGroups should be true', () => {
      // create fresh component WITHOUT triggering lifecycle
      const freshFixture = TestBed.createComponent(ManageMenuItemsComponent);
      const freshComponent = freshFixture.componentInstance;
    
      // ✅ assert initial signal state BEFORE detectChanges
      expect(freshComponent.isLoadingGroups()).toBeTrue();
    
      // now run change detection (optional)
      freshFixture.detectChanges();
    });

    it('isLoadingTree should be false', () => {
      expect(component.isLoadingTree()).toBeFalse();
    });

    it('hasUnsavedChanges should be false', () => {
      expect(component.hasUnsavedChanges()).toBeFalse();
    });

    it('isLoadingContent should be true when isLoadingGroups is true', () => {
      component.isLoadingGroups.set(true);
      component.isLoadingTree.set(false);
      expect(component.isLoadingContent()).toBeTrue();
    });

    it('isLoadingContent should be true when isLoadingTree is true', () => {
      component.isLoadingGroups.set(false);
      component.isLoadingTree.set(true);
      expect(component.isLoadingContent()).toBeTrue();
    });

    it('isLoadingContent should be false when both flags are false', () => {
      component.isLoadingGroups.set(false);
      component.isLoadingTree.set(false);
      expect(component.isLoadingContent()).toBeFalse();
    });

    it('hasTreeData should be false initially', () => {
      expect(component.hasTreeData()).toBeFalse();
    });
  });

  // --------------------------------------------------------------------------
  // onGroupsLoadingChange
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // onGroupSelected / loadMenuTree
  // --------------------------------------------------------------------------

  describe('onGroupSelected', () => {
    it('should store the selected group', () => {
      const group = makeGroup();
      component.onGroupSelected({ group, index: 0 });
      expect(component.selectedGroup()).toBe(group);
    });

    it('should call getMenuTreeForGroup with the correct group id', () => {
      component.onGroupSelected({ group: makeGroup(), index: 0 });
      expect(mockMenuItemService.getMenuTreeForGroup).toHaveBeenCalledWith('GRP1', 'DON');
    });

    it('should populate menuTreeData on success', () => {
      component.onGroupSelected({ group: makeGroup(), index: 0 });
      expect(component.menuTreeData()).toEqual(flatTree);
    });

    it('hasTreeData should be true after tree loads', () => {
      component.onGroupSelected({ group: makeGroup(), index: 0 });
      expect(component.hasTreeData()).toBeTrue();
    });

    it('should auto-select first leaf node in flat tree', () => {
      component.onGroupSelected({ group: makeGroup(), index: 0 });
      expect(component.selectedMenuNode()?.id).toBe('10');
    });

    it('should auto-select deepest first-child leaf node in nested tree', () => {
      mockMenuItemService.getMenuTreeForGroup.and.returnValue(of(nestedTree));
      component.onGroupSelected({ group: makeGroup(), index: 0 });
      expect(component.selectedMenuNode()?.id).toBe('2');
    });

    it('should set selectedMenuNode to null when tree is empty', () => {
      mockMenuItemService.getMenuTreeForGroup.and.returnValue(of([]));
      component.onGroupSelected({ group: makeGroup(), index: 0 });
      expect(component.selectedMenuNode()).toBeNull();
    });


  });

  // --------------------------------------------------------------------------
  // onMenuNodeSelected
  // --------------------------------------------------------------------------

  describe('onMenuNodeSelected', () => {
    it('should update selectedMenuNode signal', () => {
      const node = makeNode({ id: '99', label: 'Chosen' });
      component.onMenuNodeSelected(node);
      expect(component.selectedMenuNode()).toBe(node);
    });
  });

  // --------------------------------------------------------------------------
  // onTreeHasUnsavedChanges
  // --------------------------------------------------------------------------

  describe('onTreeHasUnsavedChanges', () => {
    it('should set hasUnsavedChanges to true', () => {
      component.onTreeHasUnsavedChanges(true);
      expect(component.hasUnsavedChanges()).toBeTrue();
    });

    it('should set hasUnsavedChanges to false', () => {
      component.onTreeHasUnsavedChanges(true);
      component.onTreeHasUnsavedChanges(false);
      expect(component.hasUnsavedChanges()).toBeFalse();
    });
  });

  // --------------------------------------------------------------------------
  // hasUnsavedChangesCheck
  // --------------------------------------------------------------------------

  describe('hasUnsavedChangesCheck', () => {
    it('should return false when no unsaved changes', () => {
      expect(component.hasUnsavedChangesCheck()).toBeFalse();
    });

    it('should return true when hasUnsavedChanges signal is true', () => {
      component.onTreeHasUnsavedChanges(true);
      expect(component.hasUnsavedChangesCheck()).toBeTrue();
    });
  });

  // --------------------------------------------------------------------------
  // onMenuMoved
  // --------------------------------------------------------------------------

  describe('onMenuMoved', () => {


    it('should reload tree when a group is currently selected', () => {
      component.onGroupSelected({ group: makeGroup(), index: 0 });
      component.onMenuMoved();
      expect(mockMenuItemService.getMenuTreeForGroup).toHaveBeenCalledWith('GRP1', 'DON');
    });


  });

  // --------------------------------------------------------------------------
  // getTabIcon
  // --------------------------------------------------------------------------

  describe('getTabIcon', () => {
    it('should return active web svg when web tab is active (index 0)', () => {
      component.selectedTabIndex = 0;
      expect(component.getTabIcon('web')).toBe('assets/images/menu-items/web.svg');
    });

    it('should return inactive web svg when onsite tab is active (index 1)', () => {
      component.selectedTabIndex = 1;
      expect(component.getTabIcon('web')).toBe('assets/images/menu-items/language.svg');
    });

    it('should return active onsite svg when onsite tab is active (index 1)', () => {
      component.selectedTabIndex = 1;
      expect(component.getTabIcon('onsite')).toBe('assets/images/menu-items/onsite.svg');
    });

    it('should return inactive onsite svg when web tab is active (index 0)', () => {
      component.selectedTabIndex = 0;
      expect(component.getTabIcon('onsite')).toBe('assets/images/menu-items/location_on.svg');
    });
  });

  // --------------------------------------------------------------------------
  // onTabChange
  // --------------------------------------------------------------------------

  describe('onTabChange', () => {
    it('should update selectedTabIndex to the new index', () => {
      component.onTabChange({ index: 1 } as MatTabChangeEvent);
      expect(component.selectedTabIndex).toBe(1);
    });

    it('should reset selectedGroup, tree, node and unsaved state on switch', () => {
      component.onGroupSelected({ group: makeGroup(), index: 0 });
      component.onMenuNodeSelected(makeNode());
      component.onTreeHasUnsavedChanges(true);

      component.onTabChange({ index: 1 } as MatTabChangeEvent);

      expect(component.selectedGroup()).toBeNull();
      expect(component.menuTreeData()).toEqual([]);
      expect(component.selectedMenuNode()).toBeNull();
      expect(component.hasUnsavedChanges()).toBeFalse();
    });

    it('should NOT reset state when same index is fired a second time', () => {
      component.onTabChange({ index: 1 } as MatTabChangeEvent);
      // now load some state
      component.onGroupSelected({ group: makeGroup(), index: 0 });
      // fire same index again — previousTabIndex === 1 so handler returns early
      component.onTabChange({ index: 1 } as MatTabChangeEvent);
      expect(component.selectedGroup()).not.toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // onTabClick
  // --------------------------------------------------------------------------

  describe('onTabClick', () => {
    function makeMouseEvent() {
      return jasmine.createSpyObj<MouseEvent>('MouseEvent', ['stopPropagation', 'preventDefault']);
    }



    it('should do nothing when there are no unsaved changes', () => {
      const event = makeMouseEvent();
      component.onTabClick(event, 1);
      expect(event.stopPropagation).not.toHaveBeenCalled();
      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should intercept event and open unsaved-changes dialog when changes exist', () => {
      const afterClosed$ = new Subject<boolean>();
      mockDialog.open.and.returnValue({ afterClosed: () => afterClosed$.asObservable() } as any);

      component.onTreeHasUnsavedChanges(true);
      const event = makeMouseEvent();
      component.onTabClick(event, 1);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should switch tab when dialog is confirmed', () => {
      const afterClosed$ = new Subject<boolean>();
      mockDialog.open.and.returnValue({ afterClosed: () => afterClosed$.asObservable() } as any);

      component.onTreeHasUnsavedChanges(true);
      component.onTabClick(makeMouseEvent(), 1);
      afterClosed$.next(true);

      expect(component.selectedTabIndex).toBe(1);
    });

    it('should NOT switch tab when dialog is cancelled', () => {
      const afterClosed$ = new Subject<boolean>();
      mockDialog.open.and.returnValue({ afterClosed: () => afterClosed$.asObservable() } as any);

      component.selectedTabIndex = 0;
      component.onTreeHasUnsavedChanges(true);
      component.onTabClick(makeMouseEvent(), 1);
      afterClosed$.next(false);

      expect(component.selectedTabIndex).toBe(0);
    });



    it('should set isTabSwitchPending to true while dialog is open', () => {
      const afterClosed$ = new Subject<boolean>();
      mockDialog.open.and.returnValue({ afterClosed: () => afterClosed$.asObservable() } as any);

      component.onTreeHasUnsavedChanges(true);
      component.onTabClick(makeMouseEvent(), 1);

      expect(component.isTabSwitchPending).toBeTrue();
    });

    it('should reset isTabSwitchPending to false after dialog closes', () => {
      const afterClosed$ = new Subject<boolean>();
      mockDialog.open.and.returnValue({ afterClosed: () => afterClosed$.asObservable() } as any);

      component.onTreeHasUnsavedChanges(true);
      component.onTabClick(makeMouseEvent(), 1);
      afterClosed$.next(false);

      expect(component.isTabSwitchPending).toBeFalse();
    });
  });

  // --------------------------------------------------------------------------
  // onRequestGroupChange
  // --------------------------------------------------------------------------

  describe('onRequestGroupChange', () => {
    it('should immediately invoke callback with true when no unsaved changes', () => {
      const callback = jasmine.createSpy('callback');
      component.onRequestGroupChange({ group: makeGroup(), index: 0, callback });
      expect(callback).toHaveBeenCalledWith(true);
    });



    it('should invoke callback with true when dialog is confirmed', () => {
      const afterClosed$ = new Subject<boolean>();
      mockDialog.open.and.returnValue({ afterClosed: () => afterClosed$.asObservable() } as any);

      component.onTreeHasUnsavedChanges(true);
      const callback = jasmine.createSpy('callback');
      component.onRequestGroupChange({ group: makeGroup(), index: 0, callback });
      afterClosed$.next(true);

      expect(callback).toHaveBeenCalledWith(true);
    });

    it('should invoke callback with false when dialog is cancelled', () => {
      const afterClosed$ = new Subject<boolean>();
      mockDialog.open.and.returnValue({ afterClosed: () => afterClosed$.asObservable() } as any);

      component.onTreeHasUnsavedChanges(true);
      const callback = jasmine.createSpy('callback');
      component.onRequestGroupChange({ group: makeGroup(), index: 0, callback });
      afterClosed$.next(false);

      expect(callback).toHaveBeenCalledWith(false);
    });
  });

  // --------------------------------------------------------------------------
  // onAddMenuItem
  // --------------------------------------------------------------------------

  describe('onAddMenuItem', () => {
    let saveRequest$: Subject<MenuItemDialogResult>;
    let mockDialogRef: {
      componentInstance: { saveRequest: Subject<MenuItemDialogResult> };
      close: jasmine.Spy;
      afterClosed: () => any;
    };

    const baseResult: MenuItemDialogResult = {
      menuType: 'web',
      fcnId: 1,
      function_name: 'ADDFCN',
      label: 'New Item',
      parentId: '0',
      sequence: 1,
      hidden: false,
      remarks: null
    };

    beforeEach(() => {
      saveRequest$ = new Subject<MenuItemDialogResult>();
      mockDialogRef = {
        componentInstance: { saveRequest: saveRequest$ },
        close: jasmine.createSpy('close'),
        afterClosed: () => of(undefined)
      };
      mockDialog.open.and.returnValue(mockDialogRef as any);
      mockMenuItemService.addMenuItem.and.returnValue(of({
        fcnId: 1, label: 'New Item', functionType: 'MENU',
        functionName: 'ADDFCN', parentMenuId: 0, sequence: 1, message: 'Created'
      }));
    });



    it('should pass mode "add" in dialog data', () => {
      component.onAddMenuItem();
      callArg = mockDialog.open.calls.mostRecent()!.args[1] as any;
      expect(callArg.data.mode).toBe('add');
    });

    it('should pass menuType "web" for tab index 0', () => {
      component.selectedTabIndex = 0;
      component.onAddMenuItem();
      callArg = mockDialog.open.calls.mostRecent()!.args[1] as any;
      expect(callArg.data.menuType).toBe('web');
    });

    it('should pass menuType "onsite" for tab index 1', () => {
      component.selectedTabIndex = 1;
      component.onAddMenuItem();
      callArg = mockDialog.open.calls.mostRecent()!.args[1] as any;
      expect(callArg.data.menuType).toBe('onsite');
    });



    it('should set parentMenuId to 0 when parentId is "0"', () => {
      component.onAddMenuItem();
      saveRequest$.next(baseResult);
      expect(mockMenuItemService.addMenuItem).toHaveBeenCalledWith(
        jasmine.objectContaining({ parentMenuId: 0 })
      );
    });

    it('should parse parentMenuId as integer for non-zero parentId', () => {
      component.onAddMenuItem();
      saveRequest$.next({ ...baseResult, parentId: '7' });
      expect(mockMenuItemService.addMenuItem).toHaveBeenCalledWith(
        jasmine.objectContaining({ parentMenuId: 7 })
      );
    });

    it('should set hidden to "" when result.hidden is false', () => {
      component.onAddMenuItem();
      saveRequest$.next(baseResult);
      expect(mockMenuItemService.addMenuItem).toHaveBeenCalledWith(
        jasmine.objectContaining({ hidden: '' })
      );
    });

    it('should set hidden to "Y" when result.hidden is true', () => {
      component.onAddMenuItem();
      saveRequest$.next({ ...baseResult, hidden: true });
      expect(mockMenuItemService.addMenuItem).toHaveBeenCalledWith(
        jasmine.objectContaining({ hidden: 'Y' })
      );
    });

    it('should include remarks in payload when provided', () => {
      component.onAddMenuItem();
      saveRequest$.next({ ...baseResult, remarks: 'Important note' });
      expect(mockMenuItemService.addMenuItem).toHaveBeenCalledWith(
        jasmine.objectContaining({ remarks: 'Important note' })
      );
    });





    it('should reload tree for the current group after successful add', () => {
      component.onGroupSelected({ group: makeGroup(), index: 0 });
      component.onAddMenuItem();
      saveRequest$.next(baseResult);

      expect(mockMenuItemService.getMenuTreeForGroup).toHaveBeenCalledWith('GRP1', 'DON');
    });






  });

  // --------------------------------------------------------------------------
  // onEditMenuItem
  // --------------------------------------------------------------------------

  describe('onEditMenuItem', () => {
    let saveRequest$: Subject<MenuItemDialogResult>;
    let mockDialogRef: {
      componentInstance: { saveRequest: Subject<MenuItemDialogResult> };
      close: jasmine.Spy;
      afterClosed: () => any;
    };

    const existingNode = makeNode({ id: '42', label: 'Existing Item', sequence: 3 });

    const baseResult: MenuItemDialogResult = {
      menuType: 'web',
      fcnId: 1,
      function_name: 'EDITFCN',
      label: 'Updated Item',
      parentId: '0',
      sequence: 3,
      hidden: false,
      remarks: null
    };

    beforeEach(() => {
      saveRequest$ = new Subject<MenuItemDialogResult>();
      mockDialogRef = {
        componentInstance: { saveRequest: saveRequest$ },
        close: jasmine.createSpy('close'),
        afterClosed: () => of(undefined)
      };
      mockDialog.open.and.returnValue(mockDialogRef as any);
      mockMenuItemService.updateMenuItem.and.returnValue(of({
        fcnId: 42, label: 'Updated Item', sequence: 3, message: 'Updated successfully'
      }));
    });



    it('should pass mode "edit" in dialog data', () => {
      component.onEditMenuItem(existingNode);
      callArg = mockDialog.open.calls.mostRecent()!.args[1] as any;
      expect(callArg.data.mode).toBe('edit');
    });



    it('should call updateMenuItem with the node id when saveRequest emits', () => {
      component.onEditMenuItem(existingNode);
      saveRequest$.next(baseResult);
      expect(mockMenuItemService.updateMenuItem).toHaveBeenCalledWith('42', jasmine.any(Object));
    });

    it('should include label and sequence in the update payload', () => {
      component.onEditMenuItem(existingNode);
      saveRequest$.next(baseResult);
      expect(mockMenuItemService.updateMenuItem).toHaveBeenCalledWith('42',
        jasmine.objectContaining({ label: 'Updated Item', sequence: 3 })
      );
    });

    it('should set parentMenuId to 0 when parentId is "0"', () => {
      component.onEditMenuItem(existingNode);
      saveRequest$.next(baseResult);
      expect(mockMenuItemService.updateMenuItem).toHaveBeenCalledWith('42',
        jasmine.objectContaining({ parentMenuId: 0 })
      );
    });

    it('should set hidden to "Y" when result.hidden is true', () => {
      component.onEditMenuItem(existingNode);
      saveRequest$.next({ ...baseResult, hidden: true });
      expect(mockMenuItemService.updateMenuItem).toHaveBeenCalledWith('42',
        jasmine.objectContaining({ hidden: 'Y' })
      );
    });





    it('should reload tree for the current group after successful update', () => {
      component.onGroupSelected({ group: makeGroup(), index: 0 });
      component.onEditMenuItem(existingNode);
      saveRequest$.next(baseResult);

      expect(mockMenuItemService.getMenuTreeForGroup).toHaveBeenCalledWith('GRP1', 'DON');
    });






  });

  // --------------------------------------------------------------------------
  // buildParentMenuOptions (tested indirectly via dialog data)
  // --------------------------------------------------------------------------

  describe('buildParentMenuOptions', () => {
    it('should pass flat list of parent options ordered by sequence to dialog', () => {
      const twoLevelTree: NavigationNode[] = [
        makeNode({ id: '1', label: 'Root', sequence: 1, children: [
          makeNode({ id: '2', label: 'Child', sequence: 1, children: [] })
        ]})
      ];
      mockMenuItemService.getMenuTreeForGroup.and.returnValue(of(twoLevelTree));
      component.onGroupSelected({ group: makeGroup(), index: 0 });

      const saveRequest$ = new Subject<MenuItemDialogResult>();
      mockDialog.open.and.returnValue({
        componentInstance: { saveRequest: saveRequest$ },
        close: jasmine.createSpy(),
        afterClosed: () => of(undefined)
      } as any);

      component.onAddMenuItem();

      const callArgs = mockDialog.open.calls.mostRecent()?.args as any[];
      const options = callArgs[1].data.parentMenuOptions;
      expect(options.length).toBe(2);
      expect(options[0]).toEqual(jasmine.objectContaining({ id: '1', level: 0 }));
      expect(options[1]).toEqual(jasmine.objectContaining({ id: '2', level: 1 }));
    });


  });
});

// ==============================================================================
// MenuDetailsComponent
// ==============================================================================



// ==============================================================================
// MenuTreeComponent
// ==============================================================================



// ==============================================================================
// UnsavedChangesDialogComponent
// ==============================================================================


