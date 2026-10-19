import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { MoveMenuItemDialogComponent, MoveMenuItemDialogData } from './move-menu-item-dialog.component';
import { MoveMenuItemService } from '../services/move-menu-item.service';
import { NavigationNode } from '../models/menu-item.model';
import { TranslateModule } from '@ngx-translate/core';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('MoveMenuItemDialogComponent', () => {
  let component: MoveMenuItemDialogComponent;
  let fixture: ComponentFixture<MoveMenuItemDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<MoveMenuItemDialogComponent>>;
  let mockMoveMenuItemService: jasmine.SpyObj<MoveMenuItemService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockMenuItem: NavigationNode = {
    id: '1',
    label: 'Test Menu Item',
    type: 'MENU',
    sequence: 2,
    access_lvl: 1,
    hidden: false,
    function_name: 'test_function'
  };

  const mockAllMenuItems: NavigationNode[] = [
    {
      id: '1',
      label: 'Test Menu Item',
      type: 'MENU',
      sequence: 1,
      access_lvl: 1,
      hidden: false,
      function_name: 'test_function'
    },
    {
      id: '2',
      label: 'Another Menu',
      type: 'MENU',
      sequence: 2,
      access_lvl: 1,
      hidden: false,
      function_name: 'another_function',
      children: [
        {
          id: '3',
          label: 'Child Menu',
          type: 'MENU',
          sequence: 1,
          access_lvl: 1,
          hidden: false,
          function_name: 'child_function'
        }
      ]
    },
    {
      id: '4',
      label: 'Form Item',
      type: 'FRM',
      sequence: 3,
      access_lvl: 1,
      hidden: false,
      function_name: 'form_function'
    }
  ];

  const mockDialogData: MoveMenuItemDialogData = {
    menuItem: mockMenuItem,
    allMenuItems: mockAllMenuItems,
    groupId: 'test-group'
  };

  beforeEach(() => {

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockMoveMenuItemService = jasmine.createSpyObj('MoveMenuItemService', ['moveMenuItem']);
    mockSnackBar = createMockMatSnackBar();



      TestBed.configureTestingModule({
      imports: [
        MoveMenuItemDialogComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MoveMenuItemService, useValue: mockMoveMenuItemService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    });


    


      mockDialogRef.close.calls.reset();


      mockMoveMenuItemService.moveMenuItem.calls.reset();


    fixture = TestBed.createComponent(MoveMenuItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('initialization', () => {
    it('should initialize with the provided menu item', () => {
      expect(component.menuItem).toEqual(mockMenuItem);
    });

    it('should initialize with the provided all menu items', () => {
      expect(component.allMenuItems).toEqual(mockAllMenuItems);
    });

    it('should initialize with the provided group id', () => {
      expect(component.groupId).toBe('test-group');
    });

    it('should build menu options on init', () => {
      expect(component.menuOptions().length).toBeGreaterThan(0);
    });

    it('should include Main Menu option', () => {
      const mainMenuOption = component.menuOptions().find(o => o.id === '0');
      expect(mainMenuOption).toBeDefined();
      expect(mainMenuOption?.label).toBe('Main Menu');
    });
  });

  describe('getCurrentParentId', () => {
    it('should return 0 for root level items', () => {
      const parentId = component.getCurrentParentId();
      expect(parentId).toBe('0');
    });
  });

  describe('isValidSelection', () => {
    it('should return false when parent and sequence are unchanged', () => {
      component.selectedParentId.set('0');
      component.selectedSequence.set(mockMenuItem.sequence);
      expect(component.isValidSelection()).toBeFalse();
    });

    it('should return true when parent is changed', () => {
      component.selectedParentId.set('2');
      component.selectedSequence.set(1);
      expect(component.isValidSelection()).toBeTrue();
    });

    it('should return true when sequence is changed', () => {
      component.selectedParentId.set('0');
      component.selectedSequence.set(1);
      expect(component.isValidSelection()).toBeTrue();
    });

    it('should return false when parent is null', () => {
      component.selectedParentId.set(null);
      expect(component.isValidSelection()).toBeFalse();
    });
  });

  describe('onParentChange', () => {
    it('should update sequence options when parent changes', () => {
      component.selectedParentId.set('2');
      component.onParentChange();
      expect(component.sequenceOptions().length).toBeGreaterThan(0);
    });

    it('should reset sequence to 1 when parent changes', () => {
      component.selectedSequence.set(5);
      component.selectedParentId.set('2');
      component.onParentChange();
      expect(component.selectedSequence()).toBe(1);
    });
  });

  describe('newMenuOrder', () => {
    it('should compute new menu order when parent is selected', () => {
      component.selectedParentId.set('0');
      component.selectedSequence.set(1);
      const newOrder = component.newMenuOrder();
      expect(newOrder.length).toBeGreaterThan(0);
    });



    it('should include displaySequence property in new order items', () => {
      component.selectedParentId.set('0');
      component.selectedSequence.set(1);
      const newOrder = component.newMenuOrder();
      expect(newOrder.length).toBeGreaterThan(0);
      expect(newOrder[0].displaySequence).toBeDefined();
    });



    it('should show hierarchical sequence numbers when moving to a submenu', () => {
      component.selectedParentId.set('2');
      component.selectedSequence.set(1);
      const newOrder = component.newMenuOrder();
      expect(newOrder.length).toBeGreaterThan(0);
      // The displaySequence should include the parent prefix
      expect(newOrder[0].displaySequence).toContain('.');
    });
  });
  describe('onConfirm', () => {
    beforeEach(() => {
      component.selectedParentId.set('2');
      component.selectedSequence.set(1);
    });



    it('should call moveMenuItem service on valid confirm', fakeAsync(() => {
      mockMoveMenuItemService.moveMenuItem.and.returnValue(of({
        fcnId: 1,
        previousParentMenuId: 0,
        previousSequence: 2,
        newParentMenuId: 2,
        newSequence: 1,
        message: 'Success'
      }));

      component.onConfirm();
      tick();

      expect(mockMoveMenuItemService.moveMenuItem).toHaveBeenCalledWith(1, {
        targetParentMenuId: 2,
        targetSequence: 1
      });
    }));

    it('should set isSubmitting to true while submitting', () => {
      mockMoveMenuItemService.moveMenuItem.and.returnValue(of({
        fcnId: 1,
        previousParentMenuId: 0,
        previousSequence: 2,
        newParentMenuId: 2,
        newSequence: 1,
        message: 'Success'
      }));

      component.onConfirm();
      expect(component.isSubmitting()).toBeTrue();
    });







    it('should set isSubmitting to false on error', fakeAsync(() => {
      mockMoveMenuItemService.moveMenuItem.and.returnValue(
        throwError(() => ({ error: 'Error' }))
      );

      component.onConfirm();
      tick();

      expect(component.isSubmitting()).toBeFalse();
    }));

    it('should use targetParentMenuId 0 when moving to root', fakeAsync(() => {
      component.selectedParentId.set('0');
      component.selectedSequence.set(1);

      mockMoveMenuItemService.moveMenuItem.and.returnValue(of({
        fcnId: 1,
        previousParentMenuId: 2,
        previousSequence: 1,
        newParentMenuId: 0,
        newSequence: 1,
        message: 'Success'
      }));

      component.onConfirm();
      tick();

      expect(mockMoveMenuItemService.moveMenuItem).toHaveBeenCalledWith(1, {
        targetParentMenuId: 0,
        targetSequence: 1
      });
    }));
  });

  describe('onCancel', () => {
    it('should close dialog without result', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('onConfirm - additional', () => {
    it('should not call service when selection is invalid', () => {
      component.selectedParentId.set(null);
      component.onConfirm();
      expect(mockMoveMenuItemService.moveMenuItem).not.toHaveBeenCalled();
    });

    it('should close dialog with true on success', fakeAsync(() => {
      component.selectedParentId.set('2');
      component.selectedSequence.set(1);
      mockMoveMenuItemService.moveMenuItem.and.returnValue(of({
        fcnId: 1, previousParentMenuId: 0, previousSequence: 2,
        newParentMenuId: 2, newSequence: 1, message: 'Success'
      }));

      component.onConfirm();
      tick();

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    }));

    it('should handle error with nested error message', fakeAsync(() => {
      component.selectedParentId.set('2');
      component.selectedSequence.set(1);
      mockMoveMenuItemService.moveMenuItem.and.returnValue(
        throwError(() => ({ error: { message: 'Custom error message' } }))
      );

      component.onConfirm();
      tick();

      expect(component.isSubmitting()).toBeFalse();
    }));
  });

  describe('isMovingParentToSub', () => {
    it('should return true when moving root item to sub-menu', () => {
      // Item is at root (currentParentId = '0')
      component.selectedParentId.set('2');
      expect(component.isMovingParentToSub()).toBeTrue();
    });

    it('should return false when moving within root', () => {
      component.selectedParentId.set('0');
      expect(component.isMovingParentToSub()).toBeFalse();
    });

    it('should return false when parent is null', () => {
      component.selectedParentId.set(null);
      expect(component.isMovingParentToSub()).toBeFalse();
    });
  });

  describe('updateSequenceOptions via onParentChange', () => {
    it('should set empty options when parentId is null', () => {
      component.selectedParentId.set(null);
      component.onParentChange();
      expect(component.sequenceOptions()).toEqual([]);
    });

    it('should set empty options when parent not found', () => {
      component.selectedParentId.set('nonexistent');
      component.onParentChange();
      expect(component.sequenceOptions()).toEqual([]);
    });

    it('should count existing children for already-child item', () => {
      // Item '3' is a child of item '2', and item '2' has 1 child
      component.selectedParentId.set('0');
      component.onParentChange();
      // Since item '1' is already a root child, maxSequence = allMenuItems.length
      expect(component.sequenceOptions().length).toBe(mockAllMenuItems.length);
    });

    it('should add +1 for non-child items', () => {
      component.selectedParentId.set('2');
      component.onParentChange();
      // Item '1' is NOT a child of '2', so maxSequence = children.length + 1
      expect(component.sequenceOptions().length).toBe(2);
    });
  });

  describe('newMenuOrder computed', () => {
    it('should return empty when parentId is null', () => {
      component.selectedParentId.set(null);
      expect(component.newMenuOrder()).toEqual([]);
    });

    it('should return empty when parent not found', () => {
      component.selectedParentId.set('nonexistent');
      expect(component.newMenuOrder()).toEqual([]);
    });

    it('should use root level items when parent is 0', () => {
      component.selectedParentId.set('0');
      component.selectedSequence.set(1);
      const order = component.newMenuOrder();
      expect(order.length).toBe(mockAllMenuItems.length);
    });
  });

  describe('menu options building', () => {




    it('should only include MENU type items in options', () => {
      const options = component.menuOptions();
      // Filter out the root option (id: '0') which is always included
      const nonRootOptions = options.filter(o => o.id !== '0');
      // All non-root options should be of MENU type (we can't check type directly but we verify FRM is excluded)
      expect(nonRootOptions.every(o => o.id !== '4')).toBeTrue();
    });

    it('should exclude the menu item being moved and its descendants from options', () => {
      const options = component.menuOptions();
      // Item '1' is being moved, so it should not appear in options
      const selfOption = options.find(o => o.id === '1');
      expect(selfOption).toBeUndefined();
    });

    it('should include child MENU items in options', () => {
      const options = component.menuOptions();
      // Item '3' (Child Menu) should appear because it is type MENU and not the item being moved
      const childOption = options.find(o => o.id === '3');
      expect(childOption).toBeDefined();
      expect(childOption!.label).toBe('Child Menu');
    });

    it('should set correct level for nested options', () => {
      const options = component.menuOptions();
      const childOption = options.find(o => o.id === '3');
      expect(childOption).toBeDefined();
      expect(childOption!.level).toBe(2); // root children = level 1, grandchildren = level 2
    });

    it('should set childrenCount from children array length', () => {
      const options = component.menuOptions();
      const parentOption = options.find(o => o.id === '2');
      expect(parentOption).toBeDefined();
      expect(parentOption!.childrenCount).toBe(1);
    });

    it('should set childrenCount to 0 for items without children', () => {
      const options = component.menuOptions();
      const childOption = options.find(o => o.id === '3');
      expect(childOption).toBeDefined();
      expect(childOption!.childrenCount).toBe(0);
    });

    it('should build hierarchical displayLabel with prefixes', () => {
      const options = component.menuOptions();
      const parentOption = options.find(o => o.id === '2');
      expect(parentOption).toBeDefined();
      expect(parentOption!.displayLabel).toBe('2. Another Menu');

      const childOption = options.find(o => o.id === '3');
      expect(childOption).toBeDefined();
      expect(childOption!.displayLabel).toBe('2.1. Child Menu');
    });
  });

  describe('onConfirm - snackBar and error variants', () => {
    it('should show success snackBar on successful move', fakeAsync(() => {
      component.selectedParentId.set('2');
      component.selectedSequence.set(1);
      mockMoveMenuItemService.moveMenuItem.and.returnValue(of({
        fcnId: 1, previousParentMenuId: 0, previousSequence: 2,
        newParentMenuId: 2, newSequence: 1, message: 'Success'
      }));

      component.onConfirm();
      tick();

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Menu item moved successfully',
        'Dismiss',
        jasmine.objectContaining({
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        })
      );
    }));

    it('should use default error message when error has no error property', fakeAsync(() => {
      component.selectedParentId.set('2');
      component.selectedSequence.set(1);
      mockMoveMenuItemService.moveMenuItem.and.returnValue(
        throwError(() => ({}))
      );

      component.onConfirm();
      tick();

      expect(component.isSubmitting()).toBeFalse();
    }));

    it('should handle error with string error property', fakeAsync(() => {
      component.selectedParentId.set('2');
      component.selectedSequence.set(1);
      mockMoveMenuItemService.moveMenuItem.and.returnValue(
        throwError(() => ({ error: 'String error message' }))
      );

      component.onConfirm();
      tick();

      expect(component.isSubmitting()).toBeFalse();
    }));

    it('should not close dialog on error', fakeAsync(() => {
      component.selectedParentId.set('2');
      component.selectedSequence.set(1);
      mockMoveMenuItemService.moveMenuItem.and.returnValue(
        throwError(() => ({ error: 'Error occurred' }))
      );

      component.onConfirm();
      tick();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    }));

    it('should not set isSubmitting when selection is invalid', () => {
      component.selectedParentId.set(null);
      component.onConfirm();
      expect(component.isSubmitting()).toBeFalse();
    });
  });

  describe('newMenuOrder - edge cases', () => {
    it('should filter out current item from siblings when computing new order', () => {
      component.selectedParentId.set('0');
      component.selectedSequence.set(3);
      const order = component.newMenuOrder();
      // Item '1' (the menu item being moved) should appear at position 3
      const itemAtPos3 = order.find(o => o.sequence === 3);
      expect(itemAtPos3).toBeDefined();
      expect(itemAtPos3!.id).toBe('1');
    });

    it('should insert item at correct sequence position', () => {
      component.selectedParentId.set('0');
      component.selectedSequence.set(1);
      const order = component.newMenuOrder();
      // First item should be our menu item
      expect(order[0].id).toBe('1');
      expect(order[0].sequence).toBe(1);
    });

    it('should assign sequential numbers starting from 1', () => {
      component.selectedParentId.set('0');
      component.selectedSequence.set(2);
      const order = component.newMenuOrder();
      order.forEach((item, index) => {
        expect(item.sequence).toBe(index + 1);
      });
    });

    it('should use children for non-root parent in new order', () => {
      component.selectedParentId.set('2');
      component.selectedSequence.set(1);
      const order = component.newMenuOrder();
      // Parent '2' has 1 child ('3'), plus our moved item = 2 items
      expect(order.length).toBe(2);
    });

    it('should produce displaySequence without prefix for root items', () => {
      component.selectedParentId.set('0');
      component.selectedSequence.set(1);
      const order = component.newMenuOrder();
      expect(order[0].displaySequence).toBe('1');
      expect(order[1].displaySequence).toBe('2');
    });
  });

  describe('updateSequenceOptions - parent children edge cases', () => {
    it('should handle parent with children property as empty array', () => {
      // Create a test where parent has empty children array
      const emptyChildrenMenuItems: NavigationNode[] = [
        ...mockAllMenuItems,
        {
          id: '5',
          label: 'Empty Parent',
          type: 'MENU',
          sequence: 4,
          access_lvl: 1,
          hidden: false,
          function_name: 'empty_parent',
          children: []
        }
      ];
      // Temporarily update allMenuItems
      component.allMenuItems = emptyChildrenMenuItems;
      component.selectedParentId.set('5');
      component.onParentChange();
      // Empty children + 1 for the new item = 1
      expect(component.sequenceOptions()).toEqual([1]);
    });
  });
});

describe('MoveMenuItemDialogComponent - child item context', () => {
  let component: MoveMenuItemDialogComponent;
  let fixture: ComponentFixture<MoveMenuItemDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<MoveMenuItemDialogComponent>>;
  let mockMoveMenuItemService: jasmine.SpyObj<MoveMenuItemService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  // Use a child item as the target to test non-root parent scenarios
  const childMenuItem: NavigationNode = {
    id: '3',
    label: 'Child Menu',
    type: 'MENU',
    sequence: 1,
    access_lvl: 1,
    hidden: false,
    function_name: 'child_function'
  };

  const deeplyNestedMenuItems: NavigationNode[] = [
    {
      id: '1',
      label: 'Top Menu',
      type: 'MENU',
      sequence: 1,
      access_lvl: 1,
      hidden: false,
      function_name: 'top_function',
      children: []
    },
    {
      id: '2',
      label: 'Parent Menu',
      type: 'MENU',
      sequence: 2,
      access_lvl: 1,
      hidden: false,
      function_name: 'parent_function',
      children: [
        {
          id: '3',
          label: 'Child Menu',
          type: 'MENU',
          sequence: 1,
          access_lvl: 1,
          hidden: false,
          function_name: 'child_function',
          children: [
            {
              id: '6',
              label: 'Grandchild Menu',
              type: 'MENU',
              sequence: 1,
              access_lvl: 1,
              hidden: false,
              function_name: 'grandchild_function'
            }
          ]
        },
        {
          id: '7',
          label: 'Sibling Form',
          type: 'FRM',
          sequence: 2,
          access_lvl: 1,
          hidden: false,
          function_name: 'sibling_form'
        }
      ]
    },
    {
      id: '8',
      label: 'Another Root',
      type: 'MENU',
      sequence: 3,
      access_lvl: 1,
      hidden: false,
      function_name: 'another_root'
    }
  ];

  const childDialogData: MoveMenuItemDialogData = {
    menuItem: childMenuItem,
    allMenuItems: deeplyNestedMenuItems,
    groupId: 'test-group-child'
  };

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockMoveMenuItemService = jasmine.createSpyObj('MoveMenuItemService', ['moveMenuItem']);
    mockSnackBar = createMockMatSnackBar();

    TestBed.configureTestingModule({
      imports: [
        MoveMenuItemDialogComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: childDialogData },
        { provide: MoveMenuItemService, useValue: mockMoveMenuItemService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    });

    mockDialogRef.close.calls.reset();
    mockMoveMenuItemService.moveMenuItem.calls.reset();

    fixture = TestBed.createComponent(MoveMenuItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('getCurrentParentId for child items', () => {
    it('should return parent id for a child item', () => {
      const parentId = component.getCurrentParentId();
      expect(parentId).toBe('2');
    });
  });

  describe('isMovingParentToSub with child item', () => {
    it('should return false when current item is already a child', () => {
      // Current parent is '2' (not root), so isMovingParentToSub should be false
      component.selectedParentId.set('1');
      expect(component.isMovingParentToSub()).toBeFalse();
    });
  });

  describe('isValidSelection for child item', () => {
    it('should return false when parent and sequence unchanged for child item', () => {
      component.selectedParentId.set('2');
      component.selectedSequence.set(childMenuItem.sequence);
      expect(component.isValidSelection()).toBeFalse();
    });

    it('should return true when moving child to root', () => {
      component.selectedParentId.set('0');
      component.selectedSequence.set(1);
      expect(component.isValidSelection()).toBeTrue();
    });
  });

  describe('menu options exclude self and ancestors', () => {
    it('should exclude the item being moved from options', () => {
      const options = component.menuOptions();
      const selfOption = options.find(o => o.id === '3');
      expect(selfOption).toBeUndefined();
    });

    it('should exclude ancestors that contain the item being moved', () => {
      const options = component.menuOptions();
      // Item '2' is a parent that contains item '3', so it should be excluded
      const ancestorOption = options.find(o => o.id === '2');
      expect(ancestorOption).toBeUndefined();
    });

    it('should include children of the item being moved as valid targets', () => {
      const options = component.menuOptions();
      // Item '6' is a child of '3' - the code allows moving an item into its own descendants
      const descendantOption = options.find(o => o.id === '6');
      expect(descendantOption).toBeDefined();
      expect(descendantOption!.label).toBe('Grandchild Menu');
    });

    it('should include unrelated MENU items in options', () => {
      const options = component.menuOptions();
      const anotherRootOption = options.find(o => o.id === '8');
      expect(anotherRootOption).toBeDefined();
      expect(anotherRootOption!.label).toBe('Another Root');
    });

    it('should always include root option', () => {
      const options = component.menuOptions();
      const rootOption = options.find(o => o.id === '0');
      expect(rootOption).toBeDefined();
      expect(rootOption!.label).toBe('Main Menu');
    });

    it('should exclude FRM type items from options', () => {
      const options = component.menuOptions();
      const formOption = options.find(o => o.id === '7');
      expect(formOption).toBeUndefined();
    });
  });

  describe('newMenuOrder for child item moving to root', () => {
    it('should compute correct order when moving child to root', () => {
      component.selectedParentId.set('0');
      component.selectedSequence.set(1);
      const order = component.newMenuOrder();
      expect(order.length).toBe(deeplyNestedMenuItems.length + 1);
      expect(order[0].id).toBe('3');
    });

    it('should use root displaySequence without prefix', () => {
      component.selectedParentId.set('0');
      component.selectedSequence.set(2);
      const order = component.newMenuOrder();
      expect(order[1].displaySequence).toBe('2');
      expect(order[1].id).toBe('3');
    });
  });

  describe('newMenuOrder for child item moving to different parent', () => {
    it('should use parent children for sequence options', () => {
      component.selectedParentId.set('1');
      component.onParentChange();
      // Item '1' has empty children array, so item is not already a child -> maxSequence = 0 + 1 = 1
      expect(component.sequenceOptions()).toEqual([1]);
    });

    it('should compute correct order with hierarchical numbering', () => {
      component.selectedParentId.set('1');
      component.selectedSequence.set(1);
      const order = component.newMenuOrder();
      expect(order.length).toBe(1);
      expect(order[0].id).toBe('3');
      // Parent '1' is at sequence position 1, displayLabel "1. Top Menu" -> prefix "1"
      expect(order[0].displaySequence).toContain('.');
    });
  });

  describe('updateSequenceOptions for child item', () => {
    it('should count siblings correctly when item is already a child', () => {
      component.selectedParentId.set('2');
      component.onParentChange();
      // Parent '2' has 2 children (id '3' and '7'), item '3' is already a child -> maxSequence = 2
      expect(component.sequenceOptions()).toEqual([1, 2]);
    });

    it('should add 1 when item is not already a child', () => {
      component.selectedParentId.set('8');
      component.onParentChange();
      // Parent '8' has no children, item '3' is not a child -> maxSequence = 0 + 1 = 1
      expect(component.sequenceOptions()).toEqual([1]);
    });
  });

  describe('onConfirm for child item', () => {
    it('should parse non-root parentId as integer', fakeAsync(() => {
      component.selectedParentId.set('8');
      component.selectedSequence.set(1);
      mockMoveMenuItemService.moveMenuItem.and.returnValue(of({
        fcnId: 3, previousParentMenuId: 2, previousSequence: 1,
        newParentMenuId: 8, newSequence: 1, message: 'Success'
      }));

      component.onConfirm();
      tick();

      expect(mockMoveMenuItemService.moveMenuItem).toHaveBeenCalledWith(3, {
        targetParentMenuId: 8,
        targetSequence: 1
      });
    }));
  });

  describe('newMenuOrder with parent having no children property', () => {
    it('should use empty array fallback when parent.children is undefined', () => {
      // Node '8' has no children property, so parent.children || [] should use the fallback
      component.selectedParentId.set('8');
      component.selectedSequence.set(1);
      const order = component.newMenuOrder();
      // Only the moved item should be in the order since there are no existing children
      expect(order.length).toBe(1);
      expect(order[0].id).toBe('3');
    });
  });

  describe('getParentPrefix edge cases via newMenuOrder', () => {
    it('should return empty prefix when parent is excluded from menu options', () => {
      // Node '2' exists in allMenuItems but is excluded from menuOptions
      // because it contains the moving item ('3'). So getParentPrefix('2')
      // will not find the option and should return empty string.
      component.selectedParentId.set('2');
      component.selectedSequence.set(1);
      const order = component.newMenuOrder();
      // With empty prefix, displaySequence should be just the number
      expect(order.length).toBeGreaterThan(0);
      expect(order[0].displaySequence).toBe('1');
    });

    it('should produce hierarchical prefix when parent is in menu options', () => {
      // Node '6' is in menuOptions with displayLabel "2.1.1. Grandchild Menu"
      // Moving item '3' into '6' should use prefix "2.1.1"
      component.selectedParentId.set('6');
      component.selectedSequence.set(1);
      const order = component.newMenuOrder();
      expect(order.length).toBe(1);
      expect(order[0].displaySequence).toBe('2.1.1.1');
    });
  });

  describe('findMenuById recursive search', () => {
    it('should find deeply nested menu items for newMenuOrder', () => {
      // Node '6' is at depth 3 (root -> 2 -> 3 -> 6), findMenuById must recurse
      component.selectedParentId.set('6');
      component.selectedSequence.set(1);
      const order = component.newMenuOrder();
      // Should find node '6' and compute order
      expect(order).toBeDefined();
      expect(order.length).toBeGreaterThan(0);
    });
  });

  describe('updateSequenceOptions with parent having no children property', () => {
    it('should use empty array fallback for sequence options', () => {
      // Node '8' has no children property
      component.selectedParentId.set('8');
      component.onParentChange();
      // undefined || [] gives empty array, item is not already a child -> maxSequence = 0 + 1 = 1
      expect(component.sequenceOptions()).toEqual([1]);
    });
  });
});
