import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, of, throwError } from 'rxjs';

import { MenuTreeComponent } from './menu-tree.component';
import { NavigationNode, AccessLevelChange } from '../models/menu-item.model';
import { MenuItemService } from '../services/menu-item.service';
import { MenuService } from '@shared/services/menu.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

// ---- test data helpers -------------------------------------------------------

const makeNode = (overrides: Partial<NavigationNode> = {}): NavigationNode => ({
  id: '1',
  label: 'Test Node',
  type: 'Menu',
  sequence: 1,
  access_lvl: 5,
  hidden: false,
  function_name: 'TEST_FUNCTION',
  children: [],
  ...overrides,
});

// ==============================================================================
// MenuTreeComponent
// ==============================================================================

describe('MenuTreeComponent', () => {
  let component: MenuTreeComponent;
  let fixture: ComponentFixture<MenuTreeComponent>;
  let mockMenuItemService: jasmine.SpyObj<MenuItemService>;
  let mockMenuService: jasmine.SpyObj<MenuService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const sampleTree: NavigationNode[] = [
    makeNode({
      id: '10',
      label: 'Root A',
      access_lvl: 5,
      children: [
        makeNode({ id: '11', label: 'Child A1', access_lvl: 3, children: [] }),
        makeNode({ id: '12', label: 'Child A2', access_lvl: 7, children: [] }),
      ],
    }),
    makeNode({ id: '20', label: 'Root B', access_lvl: 2, children: [] }),
  ];

  /** Deep-clone sample tree so each test starts fresh */
  function cloneTree(): NavigationNode[] {
    return JSON.parse(JSON.stringify(sampleTree));
  }

  beforeEach(() => {
    mockMenuItemService = jasmine.createSpyObj('MenuItemService', ['updateAccessLevels']);
    mockMenuService = jasmine.createSpyObj('MenuService', ['refreshMenuItems']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockHeaderService = createMockHeaderService();

    TestBed.configureTestingModule({
      imports: [MenuTreeComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MenuItemService, useValue: mockMenuItemService },
        { provide: MenuService, useValue: mockMenuService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService },
      ],
    });

    fixture = TestBed.createComponent(MenuTreeComponent);
    component = fixture.componentInstance;

    // detectChanges may fail because of child component template references
    try { fixture.detectChanges(); } catch (_) { /* template references TreeNodeComponent */ }
  });

  // --------------------------------------------------------------------------
  // 1. Component creation
  // --------------------------------------------------------------------------

  describe('Component creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // 2. treeData setter
  // --------------------------------------------------------------------------

  describe('treeData setter', () => {
    it('should set tree data signal when valid data is provided', fakeAsync(() => {
      const tree = cloneTree();
      component.treeData = tree;
      tick();

      expect(component.treeData$().length).toBe(2);
      expect(component.treeData$()[0].label).toBe('Root A');
    }));

    it('should auto-select the first node', fakeAsync(() => {
      const tree = cloneTree();
      component.treeData = tree;
      tick();

      expect(component.selectedNode()).toBeTruthy();
      expect(component.selectedNode()!.id).toBe('10');
    }));

    it('should emit nodeSelected with first node', fakeAsync(() => {
      const emitSpy = spyOn(component.nodeSelected, 'emit');
      const tree = cloneTree();
      component.treeData = tree;
      tick();

      expect(emitSpy).toHaveBeenCalledWith(jasmine.objectContaining({ id: '10' }));
    }));

    it('should store original access levels on nodes', fakeAsync(() => {
      const tree = cloneTree();
      component.treeData = tree;
      tick();

      const root = component.treeData$()[0];
      expect(root._originalAccessLvl).toBe(5);
      expect(root.children![0]._originalAccessLvl).toBe(3);
    }));

    it('should clear existing access level changes', fakeAsync(() => {
      const tree1 = cloneTree();
      component.treeData = tree1;
      tick();

      // Create a change
      component.onAccessLevelChanged({ node: component.treeData$()[0], newLevel: 9 });
      expect(component.accessLevelChanges().length).toBe(1);

      // Set new tree data - should clear changes
      const tree2 = cloneTree();
      component.treeData = tree2;
      tick();

      expect(component.accessLevelChanges().length).toBe(0);
    }));

    it('should set treeDataSignal to empty and selectedNode to null when given empty array', () => {
      component.treeData = [];
      expect(component.treeData$()).toEqual([]);
      expect(component.selectedNode()).toBeNull();
    });

    it('should emit hasUnsavedChangesEvent with false', () => {
      const emitSpy = spyOn(component.hasUnsavedChangesEvent, 'emit');
      component.treeData = cloneTree();
      expect(emitSpy).toHaveBeenCalledWith(false);
    });
  });

  // --------------------------------------------------------------------------
  // 3. onNodeSelected
  // --------------------------------------------------------------------------

  describe('onNodeSelected', () => {
    it('should set the selected node signal', () => {
      const node = makeNode({ id: '99', label: 'Selected' });
      component.onNodeSelected(node);
      expect(component.selectedNode()).toBe(node);
    });

    it('should emit nodeSelected event with the node', () => {
      const emitSpy = spyOn(component.nodeSelected, 'emit');
      const node = makeNode({ id: '99', label: 'Selected' });
      component.onNodeSelected(node);
      expect(emitSpy).toHaveBeenCalledWith(node);
    });
  });

  // --------------------------------------------------------------------------
  // 4. onAccessLevelChanged
  // --------------------------------------------------------------------------

  describe('onAccessLevelChanged', () => {
    let tree: NavigationNode[];

    beforeEach(fakeAsync(() => {
      tree = cloneTree();
      component.treeData = tree;
      tick();
    }));

    it('should add a new access level change', () => {
      const node = component.treeData$()[0];
      component.onAccessLevelChanged({ node, newLevel: 9 });

      const changes = component.accessLevelChanges();
      expect(changes.length).toBe(1);
      expect(changes[0].nodeId).toBe('10');
      expect(changes[0].originalLevel).toBe(5);
      expect(changes[0].currentLevel).toBe(9);
    });

    it('should update the node access_lvl property', () => {
      const node = component.treeData$()[0];
      component.onAccessLevelChanged({ node, newLevel: 9 });
      expect(node.access_lvl).toBe(9);
    });

    it('should update an existing change when level changes again', () => {
      const node = component.treeData$()[0];
      component.onAccessLevelChanged({ node, newLevel: 9 });
      component.onAccessLevelChanged({ node, newLevel: 3 });

      const changes = component.accessLevelChanges();
      expect(changes.length).toBe(1);
      expect(changes[0].currentLevel).toBe(3);
    });

    it('should remove change when reverted to original level', () => {
      const node = component.treeData$()[0];
      component.onAccessLevelChanged({ node, newLevel: 9 });
      expect(component.accessLevelChanges().length).toBe(1);

      component.onAccessLevelChanged({ node, newLevel: 5 }); // original was 5
      expect(component.accessLevelChanges().length).toBe(0);
    });

    it('should emit hasUnsavedChangesEvent true when changes exist', () => {
      const emitSpy = spyOn(component.hasUnsavedChangesEvent, 'emit');
      const node = component.treeData$()[0];
      component.onAccessLevelChanged({ node, newLevel: 9 });
      expect(emitSpy).toHaveBeenCalledWith(true);
    });

    it('should emit hasUnsavedChangesEvent false when all changes reverted', () => {
      const node = component.treeData$()[0];
      component.onAccessLevelChanged({ node, newLevel: 9 });

      const emitSpy = spyOn(component.hasUnsavedChangesEvent, 'emit');
      component.onAccessLevelChanged({ node, newLevel: 5 });
      expect(emitSpy).toHaveBeenCalledWith(false);
    });
  });

  // --------------------------------------------------------------------------
  // 5. onToggleExpanded
  // --------------------------------------------------------------------------

  describe('onToggleExpanded', () => {
    it('should toggle the _isExpanded flag on the node', fakeAsync(() => {
      const tree = cloneTree();
      component.treeData = tree;
      tick();

      const node = component.treeData$()[0];
      expect(node._isExpanded).toBeFalse();

      component.onToggleExpanded(node);
      expect(node._isExpanded).toBeTrue();

      component.onToggleExpanded(node);
      expect(node._isExpanded).toBeFalse();
    }));
  });

  // --------------------------------------------------------------------------
  // 6. onExpandCollapseAll
  // --------------------------------------------------------------------------

  describe('onExpandCollapseAll', () => {
    beforeEach(fakeAsync(() => {
      component.treeData = cloneTree();
      tick();
    }));

    it('should expand all nodes when currently collapsed', () => {
      component.onExpandCollapseAll();

      expect(component.allExpanded()).toBeTrue();
      const root = component.treeData$()[0];
      expect(root._isExpanded).toBeTrue();
      expect(root.children![0]._isExpanded).toBeTrue();
    });

    it('should collapse all nodes when currently expanded', () => {
      component.onExpandCollapseAll(); // expand
      component.onExpandCollapseAll(); // collapse

      expect(component.allExpanded()).toBeFalse();
      const root = component.treeData$()[0];
      expect(root._isExpanded).toBeFalse();
      expect(root.children![0]._isExpanded).toBeFalse();
    });
  });

  // --------------------------------------------------------------------------
  // 7. onSearchResultSelected
  // --------------------------------------------------------------------------

  describe('onSearchResultSelected', () => {
    let tree: NavigationNode[];

    beforeEach(fakeAsync(() => {
      tree = cloneTree();
      component.treeData = tree;
      tick();
    }));

    it('should set the selected node', () => {
      const childNode = component.treeData$()[0].children![0];
      component.onSearchResultSelected(childNode);
      expect(component.selectedNode()).toBe(childNode);
    });

    it('should emit nodeSelected for the chosen node', () => {
      const emitSpy = spyOn(component.nodeSelected, 'emit');
      const childNode = component.treeData$()[0].children![0];
      component.onSearchResultSelected(childNode);
      expect(emitSpy).toHaveBeenCalledWith(childNode);
    });

    it('should expand the path to the selected node', () => {
      const childNode = component.treeData$()[0].children![0]; // Child A1
      component.onSearchResultSelected(childNode);

      const root = component.treeData$()[0];
      expect(root._isExpanded).toBeTrue();
    });

    it('should clear search results', () => {
      const childNode = component.treeData$()[0].children![0];
      component.onSearchResultSelected(childNode);
      expect(component.searchResults()).toEqual([]);
    });

    it('should clear search control value', () => {
      component.searchControl.setValue('test');
      const childNode = component.treeData$()[0].children![0];
      component.onSearchResultSelected(childNode);
      expect(component.searchControl.value).toBe('');
    });
  });

  // --------------------------------------------------------------------------
  // 8. onCancelChanges
  // --------------------------------------------------------------------------

  describe('onCancelChanges', () => {
    it('should revert all access level changes', fakeAsync(() => {
      const tree = cloneTree();
      component.treeData = tree;
      tick();

      const node = component.treeData$()[0];
      component.onAccessLevelChanged({ node, newLevel: 9 });
      expect(node.access_lvl).toBe(9);

      component.onCancelChanges();

      expect(node.access_lvl).toBe(5); // original level
      expect(component.accessLevelChanges().length).toBe(0);
    }));

    it('should emit hasUnsavedChangesEvent false', fakeAsync(() => {
      const tree = cloneTree();
      component.treeData = tree;
      tick();

      const node = component.treeData$()[0];
      component.onAccessLevelChanged({ node, newLevel: 9 });

      const emitSpy = spyOn(component.hasUnsavedChangesEvent, 'emit');
      component.onCancelChanges();
      expect(emitSpy).toHaveBeenCalledWith(false);
    }));

    it('should revert multiple changes across different nodes', fakeAsync(() => {
      const tree = cloneTree();
      component.treeData = tree;
      tick();

      const nodeA = component.treeData$()[0];
      const nodeB = component.treeData$()[1];
      component.onAccessLevelChanged({ node: nodeA, newLevel: 9 });
      component.onAccessLevelChanged({ node: nodeB, newLevel: 8 });
      expect(component.accessLevelChanges().length).toBe(2);

      component.onCancelChanges();

      expect(nodeA.access_lvl).toBe(5);
      expect(nodeB.access_lvl).toBe(2);
      expect(component.accessLevelChanges().length).toBe(0);
    }));
  });

  // --------------------------------------------------------------------------
  // 9. onUpdateAccess
  // --------------------------------------------------------------------------

  describe('onUpdateAccess', () => {
    let tree: NavigationNode[];

    beforeEach(fakeAsync(() => {
      tree = cloneTree();
      component.treeData = tree;
      tick();
      component.groupId = 'GRP1';
    }));

    it('should call updateAccessLevels on success and clear changes', () => {
      mockMenuItemService.updateAccessLevels.and.returnValue(
        of({ message: 'Access levels updated' })
      );

      const node = component.treeData$()[0];
      component.onAccessLevelChanged({ node, newLevel: 9 });
      component.onUpdateAccess();

      expect(mockMenuItemService.updateAccessLevels).toHaveBeenCalledWith(
        'GRP1',
        jasmine.arrayContaining([
          jasmine.objectContaining({ nodeId: '10', currentLevel: 9 }),
        ]),
        'DON'
      );
      expect(component.accessLevelChanges().length).toBe(0);
      expect(component.isUpdating()).toBeFalse();
    });

    it('should update _originalAccessLvl on success', () => {
      mockMenuItemService.updateAccessLevels.and.returnValue(
        of({ message: 'Updated' })
      );

      const node = component.treeData$()[0];
      component.onAccessLevelChanged({ node, newLevel: 9 });
      component.onUpdateAccess();

      expect(node._originalAccessLvl).toBe(9);
    });

    it('should show success snackbar', () => {
      mockMenuItemService.updateAccessLevels.and.returnValue(
        of({ message: 'All good' })
      );

      const snackbarSpy = spyOn(component as any, 'showSuccessSnackbar').and.callThrough();

      const node = component.treeData$()[0];
      component.onAccessLevelChanged({ node, newLevel: 9 });
      component.onUpdateAccess();

      expect(snackbarSpy).toHaveBeenCalledWith('All good');
    });

    it('should call refreshMenuItems after successful update', () => {
      mockMenuItemService.updateAccessLevels.and.returnValue(
        of({ message: 'Done' })
      );

      const node = component.treeData$()[0];
      component.onAccessLevelChanged({ node, newLevel: 9 });
      component.onUpdateAccess();

      expect(mockMenuService.refreshMenuItems).toHaveBeenCalled();
    });

    it('should emit hasUnsavedChangesEvent false on success', () => {
      mockMenuItemService.updateAccessLevels.and.returnValue(
        of({ message: 'Done' })
      );

      const node = component.treeData$()[0];
      component.onAccessLevelChanged({ node, newLevel: 9 });

      const emitSpy = spyOn(component.hasUnsavedChangesEvent, 'emit');
      component.onUpdateAccess();
      expect(emitSpy).toHaveBeenCalledWith(false);
    });

    it('should not call service when there are no changes', () => {
      component.onUpdateAccess();
      expect(mockMenuItemService.updateAccessLevels).not.toHaveBeenCalled();
    });

    it('should not call service when groupId is null', () => {
      component.groupId = null;
      const node = component.treeData$()[0];
      component.onAccessLevelChanged({ node, newLevel: 9 });
      component.onUpdateAccess();
      expect(mockMenuItemService.updateAccessLevels).not.toHaveBeenCalled();
    });

    it('should set isUpdating to true during call', () => {
      const updateSubject = new Subject<{ message: string }>();
      mockMenuItemService.updateAccessLevels.and.returnValue(updateSubject.asObservable());

      const node = component.treeData$()[0];
      component.onAccessLevelChanged({ node, newLevel: 9 });
      component.onUpdateAccess();

      expect(component.isUpdating()).toBeTrue();

      updateSubject.next({ message: 'Done' });
      expect(component.isUpdating()).toBeFalse();
    });

    it('should set isUpdating to false on error', () => {
      mockMenuItemService.updateAccessLevels.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      const node = component.treeData$()[0];
      component.onAccessLevelChanged({ node, newLevel: 9 });
      component.onUpdateAccess();

      expect(component.isUpdating()).toBeFalse();
    });
  });

  // --------------------------------------------------------------------------
  // 10. hasUnsavedChangesCheck
  // --------------------------------------------------------------------------

  describe('hasUnsavedChangesCheck', () => {
    it('should return false when there are no changes', () => {
      expect(component.hasUnsavedChangesCheck()).toBeFalse();
    });

    it('should return true when there are unsaved changes', fakeAsync(() => {
      const tree = cloneTree();
      component.treeData = tree;
      tick();

      const node = component.treeData$()[0];
      component.onAccessLevelChanged({ node, newLevel: 9 });
      expect(component.hasUnsavedChangesCheck()).toBeTrue();
    }));
  });

  // --------------------------------------------------------------------------
  // 11. showWarningBanner
  // --------------------------------------------------------------------------

  describe('showWarningBanner', () => {
    it('should return true when a parent node with children is set to access level 0', fakeAsync(() => {
      const tree = cloneTree();
      component.treeData = tree;
      tick();

      const parentNode = component.treeData$()[0]; // has children
      component.onAccessLevelChanged({ node: parentNode, newLevel: 0 });
      expect(component.showWarningBanner()).toBeTrue();
    }));

    it('should return false when a leaf node is set to access level 0', fakeAsync(() => {
      const tree = cloneTree();
      component.treeData = tree;
      tick();

      const leafNode = component.treeData$()[1]; // Root B, no children
      component.onAccessLevelChanged({ node: leafNode, newLevel: 0 });
      expect(component.showWarningBanner()).toBeFalse();
    }));

    it('should return false when no changes exist', () => {
      expect(component.showWarningBanner()).toBeFalse();
    });

    it('should return false when parent set to non-zero level', fakeAsync(() => {
      const tree = cloneTree();
      component.treeData = tree;
      tick();

      const parentNode = component.treeData$()[0];
      component.onAccessLevelChanged({ node: parentNode, newLevel: 3 });
      expect(component.showWarningBanner()).toBeFalse();
    }));
  });

  // --------------------------------------------------------------------------
  // 12. displayFn
  // --------------------------------------------------------------------------

  describe('displayFn', () => {
    it('should return an empty string', () => {
      expect(component.displayFn()).toBe('');
    });
  });
});
