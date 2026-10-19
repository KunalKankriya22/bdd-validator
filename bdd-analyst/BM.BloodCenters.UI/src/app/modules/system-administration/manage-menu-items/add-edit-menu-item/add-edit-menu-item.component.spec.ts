import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { AddEditMenuItemDialogComponent, MenuItemDialogData, MenuItemDialogResult, ParentMenuOption } from './add-edit-menu-item.component';
import { NavigationNode } from '../models/menu-item.model';
import { HeaderService } from '@shared/services/header.service';
import { AddFunctionsService } from '../../menu-admin/add-functions/services/add-functions.service';

describe('AddEditMenuItemDialogComponent', () => {
  let component: AddEditMenuItemDialogComponent;
  let fixture: ComponentFixture<AddEditMenuItemDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddEditMenuItemDialogComponent>>;
  let mockHeaderService: Partial<HeaderService>;
  let mockAddFunctionsService: jasmine.SpyObj<AddFunctionsService>;
  let chapterChanged$: Subject<void>;

  const mockParentMenuOptions: ParentMenuOption[] = [
    { id: '1', label: 'Main Menu', level: 0, displayLabel: '1. Main Menu' },
    { id: '2', label: 'Donor', level: 1, displayLabel: '1.1. Donor' },
    { id: '3', label: 'Reports', level: 1, displayLabel: '1.2. Reports' }
  ];

  const mockMenuItems: NavigationNode[] = [
    {
      id: '1',
      label: 'Main Menu',
      type: 'MENU',
      sequence: 1,
      access_lvl: 0,
      hidden: false,
      function_name: 'main_menu',
      children: [
        {
          id: '2',
          label: 'Donor',
          type: 'MENU',
          sequence: 1,
          access_lvl: 0,
          hidden: false,
          function_name: 'donor_menu',
          children: []
        },
        {
          id: '3',
          label: 'Reports',
          type: 'MENU',
          sequence: 2,
          access_lvl: 0,
          hidden: false,
          function_name: 'reports_menu',
          children: []
        }
      ]
    }
  ];

  beforeEach(() => {

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    chapterChanged$ = new Subject<void>();
    mockHeaderService = { chapterChanged$: chapterChanged$.asObservable() };
    mockAddFunctionsService = jasmine.createSpyObj('AddFunctionsService', ['getAddFunctions']);
    mockAddFunctionsService.getAddFunctions.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [], total: 0 }));



      TestBed.configureTestingModule({
      imports: [
        AddEditMenuItemDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: AddFunctionsService, useValue: mockAddFunctionsService }
      ]
    });


    


      mockDialogRef.close.calls.reset();


      mockAddFunctionsService.getAddFunctions.calls.reset();


      mockAddFunctionsService.getAddFunctions.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [], total: 0 }));



    });

  describe('Add Mode', () => {
    beforeEach(() => {
      const addModeData: MenuItemDialogData = {
        mode: 'add',
        menuType: 'web',
        parentMenuOptions: mockParentMenuOptions,
        allMenuItems: mockMenuItems
      };

      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: addModeData });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });




    it('should initialize with empty form fields', () => {
      expect(component.selectFunction).toBe('');
      expect(component.displayName).toBe('');
      expect(component.parameter1Key).toBe('');
      expect(component.parameter1Value).toBe('');
      expect(component.parameter2Key).toBe('');
      expect(component.parameter2Value).toBe('');
      expect(component.parameter3Key).toBe('');
      expect(component.parameter3Value).toBe('');
      expect(component.remarks).toBe('');
      expect(component.hideMenuItem).toBe(false);
    });

    it('should set default parent to root (id: "0")', () => {
      expect(component.addToParentId).toBe('0');
    });

    it('should set default sequence to 1', () => {
      expect(component.sequence).toBe(1);
    });

    it('should include root menu option in parent menu options', () => {
      expect(component.parentMenuOptions.length).toBe(4); // 1 root + 3 mock options
      expect(component.parentMenuOptions[0]).toEqual({
        id: '0',
        label: 'Main Menu',
        level: 0,
        displayLabel: '0. Main Menu'
      });
    });

    it('should generate sequence options based on selected parent', () => {
      component.addToParentId = '1'; // Main Menu has 2 children
      component['updateSequenceOptions']();
      expect(component.sequenceOptions).toEqual([1, 2, 3]); // 2 children + 1 for new item
    });

    it('should update sequence options when parent changes', () => {
      component.addToParentId = '2'; // Donor has 0 children
      component.onAddToChange();
      expect(component.sequenceOptions).toEqual([1]); // 0 children + 1 for new item
      expect(component.sequence).toBe(1);
    });
  });

  describe('Edit Mode', () => {
    const mockMenuItem: NavigationNode = {
      id: '2',
      label: 'Donor Management',
      type: 'MENU',
      sequence: 1,
      access_lvl: 0,
      hidden: false,
      function_name: 'donor_mgmt',
      parameter_1: { key: 'param1', value: 'value1' },
      parameter_2: { key: 'param2', value: 'value2' },
      parameter_3: { key: 'param3', value: 'value3' },
      remarks: 'Test remarks',
      children: []
    };

    beforeEach(() => {
      const editModeData: MenuItemDialogData = {
        mode: 'edit',
        menuType: 'onsite',
        menuItem: { ...mockMenuItem, parentId: '1' } as any,
        parentMenuOptions: mockParentMenuOptions,
        allMenuItems: mockMenuItems
      };

      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: editModeData });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });



    it('should populate form fields with menu item data', () => {
      expect(component.selectFunction).toBe('donor_mgmt');
      expect(component.displayName).toBe('Donor Management');
      expect(component.parameter1Key).toBe('param1');
      expect(component.parameter1Value).toBe('value1');
      expect(component.parameter2Key).toBe('param2');
      expect(component.parameter2Value).toBe('value2');
      expect(component.parameter3Key).toBe('param3');
      expect(component.parameter3Value).toBe('value3');
      expect(component.remarks).toBe('Test remarks');
    });

    it('should set menuType from data', () => {
      expect(component.menuType).toBe('onsite');
    });

    it('should set parentId from menu item', () => {
      expect(component.addToParentId).toBe('1');
    });

    it('should set sequence from menu item', () => {
      expect(component.sequence).toBe(1);
    });

    it('should handle menu item without parameters', () => {
      const itemWithoutParams: NavigationNode = {
        ...mockMenuItem,
        parameter_1: undefined,
        parameter_2: undefined,
        parameter_3: undefined
      };

      const data: MenuItemDialogData = {
        mode: 'edit',
        menuType: 'web',
        menuItem: itemWithoutParams,
        parentMenuOptions: mockParentMenuOptions,
        allMenuItems: mockMenuItems
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditMenuItemDialogComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: data },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: AddFunctionsService, useValue: mockAddFunctionsService }
        ]
      });

      const newFixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.parameter1Key).toBe('');
      expect(newComponent.parameter1Value).toBe('');
      expect(newComponent.parameter2Key).toBe('');
      expect(newComponent.parameter2Value).toBe('');
      expect(newComponent.parameter3Key).toBe('');
      expect(newComponent.parameter3Value).toBe('');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      const addModeData: MenuItemDialogData = {
        mode: 'add',
        menuType: 'web',
        parentMenuOptions: mockParentMenuOptions,
        allMenuItems: mockMenuItems
      };

      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: addModeData });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    describe('Select Function Field', () => {
      it('should validate select function as invalid when empty', () => {
        component.selectFunction = '';
        expect(component.isSelectFunctionValid()).toBe(false);
      });

      it('should validate select function as valid when filled', () => {
        component.selectedFcnId = '1';
        expect(component.isSelectFunctionValid()).toBe(true);
      });

      it('should show error message when touched and invalid', () => {
        component.selectFunction = '';
        component.selectFunctionTouched = true;
        expect(component.getSelectFunctionError()).toBe('Select Function is required');
      });

      it('should not show error when not touched', () => {
        component.selectFunction = '';
        component.selectFunctionTouched = false;
        expect(component.getSelectFunctionError()).toBe('');
      });


    });

    describe('Display Name Field', () => {
      it('should validate display name as invalid when empty', () => {
        component.displayName = '';
        expect(component.isDisplayNameValid()).toBe(false);
      });

      it('should validate display name as valid when filled', () => {
        component.displayName = 'Donor Management';
        expect(component.isDisplayNameValid()).toBe(true);
      });

      it('should show error message when touched and invalid', () => {
        component.displayName = '';
        component.displayNameTouched = true;
        expect(component.getDisplayNameError()).toBe('Display Name is required');
      });


    });

    describe('Add To Field', () => {
      it('should validate add to as invalid when empty', () => {
        component.addToParentId = '';
        expect(component.isAddToValid()).toBe(false);
      });

      it('should validate add to as valid when selected', () => {
        component.addToParentId = '1';
        expect(component.isAddToValid()).toBe(true);
      });

      it('should show error message when touched and invalid', () => {
        component.addToParentId = '';
        component.addToTouched = true;
        expect(component.getAddToError()).toBe('Add to parent menu is required');
      });
    });

    describe('Sequence Field', () => {
      it('should validate sequence as invalid when null', () => {
        component.sequence = null;
        expect(component.isSequenceValid()).toBe(false);
      });

      it('should validate sequence as invalid when zero or negative', () => {
        component.sequence = 0;
        expect(component.isSequenceValid()).toBe(false);
      });

      it('should validate sequence as valid when positive', () => {
        component.sequence = 1;
        expect(component.isSequenceValid()).toBe(true);
      });

      it('should show error message when touched and invalid', () => {
        component.sequence = null;
        component.sequenceTouched = true;
        expect(component.getSequenceError()).toBe('Sequence is required');
      });


    });
  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      const addModeData: MenuItemDialogData = {
        mode: 'add',
        menuType: 'web',
        parentMenuOptions: mockParentMenuOptions,
        allMenuItems: mockMenuItems
      };

      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: addModeData });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });



    it('should mark all fields as touched when save is clicked on invalid form', () => {
      component.selectFunction = '';
      component.displayName = '';
      component.onSave();
      expect(component.selectFunctionTouched).toBe(true);
      expect(component.displayNameTouched).toBe(true);
      expect(component.addToTouched).toBe(true);
      expect(component.sequenceTouched).toBe(true);
    });

    it('should emit save result when form is valid', () => {
      component.selectedFcnId = '1';
      component.selectFunction = 'test_function';
      component.displayName = 'Test Name';
      component.addToParentId = '1';
      component.sequence = 2;
      component.hideMenuItem = true;
      component.remarks = 'Test remarks';

      let emittedResult: MenuItemDialogResult | undefined;
      component.saveRequest.subscribe(r => emittedResult = r);
      component.onSave();

      expect(emittedResult).toEqual({
        menuType: 'web',
        fcnId: 1,
        function_name: 'test_function',
        label: 'Test Name',
        mnemonic: null,
        accessLevel: null,
        parameter_1: null,
        parameter_2: null,
        parameter_3: null,
        remarks: 'Test remarks',
        parentId: '1',
        sequence: 2,
        hidden: true
      });
    });

    it('should include parameters in result when both key and value are provided', () => {
      component.selectedFcnId = '1';
      component.selectFunction = 'test_function';
      component.displayName = 'Test Name';
      component.addToParentId = '1';
      component.sequence = 1;
      component.parameter1Key = 'key1';
      component.parameter1Value = 'value1';
      component.parameter2Key = 'key2';
      component.parameter2Value = 'value2';

      let emittedResult: MenuItemDialogResult | undefined;
      component.saveRequest.subscribe(r => emittedResult = r);
      component.onSave();

      expect(emittedResult?.parameter_1).toEqual({ key: 'key1', value: 'value1' });
      expect(emittedResult?.parameter_2).toEqual({ key: 'key2', value: 'value2' });
    });





    it('should trim whitespace from form fields', () => {
      component.selectedFcnId = '1';
      component.selectFunction = '  test_function  ';
      component.displayName = '  Test Name  ';
      component.addToParentId = '1';
      component.sequence = 1;
      component.remarks = '  Test remarks  ';
      component.parameter1Key = '  key1  ';
      component.parameter1Value = '  value1  ';

      let emittedResult: MenuItemDialogResult | undefined;
      component.saveRequest.subscribe(r => emittedResult = r);
      component.onSave();

      expect(emittedResult?.function_name).toBe('test_function');
      expect(emittedResult?.label).toBe('Test Name');
      expect(emittedResult?.remarks).toBe('Test remarks');
      expect(emittedResult?.parameter_1).toEqual({ key: 'key1', value: 'value1' });
    });


  });



  describe('Sequence Options Calculation', () => {
    beforeEach(() => {
      const addModeData: MenuItemDialogData = {
        mode: 'add',
        menuType: 'web',
        parentMenuOptions: mockParentMenuOptions,
        allMenuItems: mockMenuItems
      };

      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: addModeData });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should calculate sequence options for root level in add mode', () => {
      component.addToParentId = '0';
      component['updateSequenceOptions']();
      // Root has 1 child (Main Menu), so options should be [1, 2]
      expect(component.sequenceOptions).toEqual([1, 2]);
    });

    it('should calculate sequence options for parent with children in add mode', () => {
      component.addToParentId = '1'; // Main Menu has 2 children
      component['updateSequenceOptions']();
      expect(component.sequenceOptions).toEqual([1, 2, 3]); // 2 children + 1
    });

    it('should calculate sequence options for parent without children in add mode', () => {
      component.addToParentId = '2'; // Donor has 0 children
      component['updateSequenceOptions']();
      expect(component.sequenceOptions).toEqual([1]); // 0 children + 1
    });

    it('should return default [1] when parent is not found', () => {
      component.addToParentId = 'non-existent';
      component['updateSequenceOptions']();
      expect(component.sequenceOptions).toEqual([1]);
    });
  });

  describe('findMenuById', () => {
    beforeEach(() => {
      const addModeData: MenuItemDialogData = {
        mode: 'add',
        menuType: 'web',
        parentMenuOptions: mockParentMenuOptions,
        allMenuItems: mockMenuItems
      };

      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: addModeData });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should return virtual root node for id "0"', () => {
      const result = component['findMenuById'](mockMenuItems, '0');
      expect(result).toBeDefined();
      expect(result?.id).toBe('0');
      expect(result?.label).toBe('Main Menu');
      expect(result?.children).toBe(mockMenuItems);
    });

    it('should find menu item at root level', () => {
      const result = component['findMenuById'](mockMenuItems, '1');
      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
      expect(result?.label).toBe('Main Menu');
    });

    it('should find menu item in nested children', () => {
      const result = component['findMenuById'](mockMenuItems, '2');
      expect(result).toBeDefined();
      expect(result?.id).toBe('2');
      expect(result?.label).toBe('Donor');
    });


  });

  describe('getIndentedLabel', () => {
    beforeEach(() => {
      const addModeData: MenuItemDialogData = {
        mode: 'add',
        menuType: 'web',
        parentMenuOptions: mockParentMenuOptions,
        allMenuItems: mockMenuItems
      };

      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: addModeData });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should return label with no indent for level 0', () => {
      const option: ParentMenuOption = { id: '1', label: 'Main Menu', level: 0, displayLabel: '1. Main Menu' };
      const result = component.getIndentedLabel(option);
      expect(result).toBe('1. Main Menu');
    });

    it('should return label with 2 spaces indent for level 1', () => {
      const option: ParentMenuOption = { id: '2', label: 'Donor', level: 1, displayLabel: '1.1. Donor' };
      const result = component.getIndentedLabel(option);
      expect(result).toBe('  1.1. Donor');
    });

    it('should return label with 4 spaces indent for level 2', () => {
      const option: ParentMenuOption = { id: '3', label: 'Submenu', level: 2, displayLabel: '1.1.1. Submenu' };
      const result = component.getIndentedLabel(option);
      expect(result).toBe('    1.1.1. Submenu');
    });

    it('should use plain label if displayLabel is not provided', () => {
      const option: ParentMenuOption = { id: '1', label: 'Main Menu', level: 0 };
      const result = component.getIndentedLabel(option);
      expect(result).toBe('Main Menu');
    });
  });

  describe('Error State Properties', () => {
    beforeEach(() => {
      const addModeData: MenuItemDialogData = {
        mode: 'add',
        menuType: 'web',
        parentMenuOptions: mockParentMenuOptions,
        allMenuItems: mockMenuItems
      };

      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: addModeData });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should return true for hasSelectFunctionError when touched and invalid', () => {
      component.selectFunction = '';
      component.selectFunctionTouched = true;
      expect(component.hasSelectFunctionError).toBe(true);
    });

    it('should return false for hasSelectFunctionError when not touched', () => {
      component.selectFunction = '';
      component.selectFunctionTouched = false;
      expect(component.hasSelectFunctionError).toBe(false);
    });

    it('should return true for hasDisplayNameError when touched and invalid', () => {
      component.displayName = '';
      component.displayNameTouched = true;
      expect(component.hasDisplayNameError).toBe(true);
    });

    it('should return true for hasAddToError when touched and invalid', () => {
      component.addToParentId = '';
      component.addToTouched = true;
      expect(component.hasAddToError).toBe(true);
    });

    it('should return true for hasSequenceError when touched and invalid', () => {
      component.sequence = null;
      component.sequenceTouched = true;
      expect(component.hasSequenceError).toBe(true);
    });
  });

  describe('Menu Type Toggle', () => {
    beforeEach(() => {
      const addModeData: MenuItemDialogData = {
        mode: 'add',
        menuType: 'web',
        parentMenuOptions: mockParentMenuOptions,
        allMenuItems: mockMenuItems
      };

      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: addModeData });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should allow changing menu type in add mode', () => {
      component.menuType = 'onsite';
      expect(component.menuType).toBe('onsite');
    });
  });

  describe('Hide Menu Item Toggle', () => {
    beforeEach(() => {
      const addModeData: MenuItemDialogData = {
        mode: 'add',
        menuType: 'web',
        parentMenuOptions: mockParentMenuOptions,
        allMenuItems: mockMenuItems
      };

      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: addModeData });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });



    it('should include hidden flag in save result', () => {
      component.selectedFcnId = '1';
      component.selectFunction = 'test';
      component.displayName = 'Test';
      component.addToParentId = '1';
      component.sequence = 1;
      component.hideMenuItem = true;

      let emittedResult: MenuItemDialogResult | undefined;
      component.saveRequest.subscribe(r => emittedResult = r);
      component.onSave();

      expect(emittedResult?.hidden).toBe(true);
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: { mode: 'add', menuType: 'web', parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems } });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should complete the destroy$ subject', () => {
      const destroy$ = component['destroy$'];
      let completed = false;
      destroy$.subscribe({ complete: () => (completed = true) });
      component.ngOnDestroy();
      expect(completed).toBe(true);
    });
  });

  describe('onCancel', () => {
    beforeEach(() => {
      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: { mode: 'add', menuType: 'web', parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems } });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should close the dialog', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('subscribeToChapterChanges', () => {
    beforeEach(() => {
      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: { mode: 'add', menuType: 'web', parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems } });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should handle chapter change events without error', () => {
      expect(() => chapterChanged$.next()).not.toThrow();
    });
  });

  describe('setupParentMenuSearch', () => {
    beforeEach(() => {
      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: { mode: 'add', menuType: 'web', parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems } });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should filter parent menu options by label', () => {
      component.parentMenuSearchControl.setValue('Donor');
      expect(component.filteredParentMenuOptions.some(o => o.label === 'Donor')).toBe(true);
    });

    it('should filter parent menu options by id', () => {
      component.parentMenuSearchControl.setValue('2');
      expect(component.filteredParentMenuOptions.some(o => o.id === '2')).toBe(true);
    });

    it('should filter parent menu options by displayLabel', () => {
      component.parentMenuSearchControl.setValue('1.1.');
      expect(component.filteredParentMenuOptions.some(o => o.displayLabel?.includes('1.1.'))).toBe(true);
    });

    it('should show all options when search term is empty', () => {
      component.parentMenuSearchControl.setValue('');
      expect(component.filteredParentMenuOptions.length).toBe(component.parentMenuOptions.length);
    });

    it('should return empty list when no match', () => {
      component.parentMenuSearchControl.setValue('zzz_no_match');
      expect(component.filteredParentMenuOptions.length).toBe(0);
    });
  });

  describe('setupFunctionSearch', () => {
    it('should load initial functions on init in add mode', () => {
      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: { mode: 'add', menuType: 'web', parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems } });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(mockAddFunctionsService.getAddFunctions).toHaveBeenCalled();
    });

    it('should not setup function search in edit mode', () => {
      mockAddFunctionsService.getAddFunctions.calls.reset();
      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: {
        mode: 'edit', menuType: 'web',
        menuItem: { id: '1', label: 'Test', type: 'MENU', sequence: 1, access_lvl: 0, hidden: false, function_name: 'fn', children: [] } as any,
        parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems
      } });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(mockAddFunctionsService.getAddFunctions).not.toHaveBeenCalled();
    });

    it('should debounce and search server-side functions', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditMenuItemDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'add', menuType: 'web', parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems } },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: AddFunctionsService, useValue: mockAddFunctionsService }
        ]
      });
      mockAddFunctionsService.getAddFunctions.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [], total: 0 }));
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      mockAddFunctionsService.getAddFunctions.calls.reset();
      const mockData = [{ fcnId: '10', execName: 'search_fn', p1Name: '', p2Name: '', p3Name: '' }];
      mockAddFunctionsService.getAddFunctions.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockData, total: 1 }));

      component.functionSearchControl.setValue('search');
      tick(300);

      expect(mockAddFunctionsService.getAddFunctions).toHaveBeenCalledWith(0, 50, { searchKeyword: 'search' });
      expect(component.filteredFunctions).toEqual(mockData as any);
      expect(component.functionsLoading).toBe(false);
      flush();
    }));

    it('should return EMPTY when selectedFcnId is set and search term is empty', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditMenuItemDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'add', menuType: 'web', parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems } },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: AddFunctionsService, useValue: mockAddFunctionsService }
        ]
      });
      mockAddFunctionsService.getAddFunctions.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [], total: 0 }));
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      mockAddFunctionsService.getAddFunctions.calls.reset();
      component.selectedFcnId = '1';
      component.functionSearchControl.setValue('');
      tick(300);

      expect(mockAddFunctionsService.getAddFunctions).not.toHaveBeenCalled();
      flush();
    }));

    it('should handle error in debounced search', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditMenuItemDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'add', menuType: 'web', parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems } },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: AddFunctionsService, useValue: mockAddFunctionsService }
        ]
      });
      mockAddFunctionsService.getAddFunctions.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [], total: 0 }));
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      mockAddFunctionsService.getAddFunctions.and.returnValue(throwError(() => new Error('fail')));
      component.functionSearchControl.setValue('err');
      tick(300);

      expect(component.filteredFunctions).toEqual([]);
      expect(component.functionsLoading).toBe(false);
      flush();
    }));
  });

  describe('searchFunctions', () => {
    beforeEach(() => {
      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: { mode: 'add', menuType: 'web', parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems } });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should set filteredFunctions from response data', () => {
      const mockFns = [{ fcnId: '10', execName: 'fn1', p1Name: '', p2Name: '', p3Name: '' }];
      mockAddFunctionsService.getAddFunctions.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockFns, total: 1 }));
      component['searchFunctions']('fn1');
      expect(component.filteredFunctions).toEqual(mockFns as any);
      expect(component.functionsLoading).toBe(false);
    });

    it('should handle error by clearing functions', () => {
      mockAddFunctionsService.getAddFunctions.and.returnValue(throwError(() => new Error('fail')));
      component['searchFunctions']('bad');
      expect(component.filteredFunctions).toEqual([]);
      expect(component.functionsLoading).toBe(false);
    });

    it('should pass undefined as searchKeyword when keyword is empty', () => {
      mockAddFunctionsService.getAddFunctions.calls.reset();
      mockAddFunctionsService.getAddFunctions.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [], total: 0 }));
      component['searchFunctions']('');
      expect(mockAddFunctionsService.getAddFunctions).toHaveBeenCalledWith(0, 50, { searchKeyword: undefined });
    });
  });

  describe('onFunctionSelected', () => {
    beforeEach(() => {
      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: { mode: 'add', menuType: 'web', parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems } });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should set selectFunction and parameter keys from selected function', () => {
      component.filteredFunctions = [
        { fcnId: '5', execName: 'my_func', p1Name: 'paramA', p2Name: 'paramB', p3Name: 'paramC' } as any
      ];
      component.selectedFcnId = '5';
      component.onFunctionSelected();
      expect(component.selectFunction).toBe('my_func');
      expect(component.parameter1Key).toBe('paramA');
      expect(component.parameter2Key).toBe('paramB');
      expect(component.parameter3Key).toBe('paramC');
    });

    it('should not update when no matching function found', () => {
      component.filteredFunctions = [];
      component.selectedFcnId = '999';
      component.selectFunction = 'original';
      component.onFunctionSelected();
      expect(component.selectFunction).toBe('original');
    });

    it('should handle function with empty parameter names', () => {
      component.filteredFunctions = [
        { fcnId: '6', execName: 'simple_func', p1Name: '', p2Name: '', p3Name: '' } as any
      ];
      component.selectedFcnId = '6';
      component.onFunctionSelected();
      expect(component.selectFunction).toBe('simple_func');
      expect(component.parameter1Key).toBe('');
      expect(component.parameter2Key).toBe('');
      expect(component.parameter3Key).toBe('');
    });
  });

  describe('hasChanges', () => {
    it('should return true in add mode when no initialValues set', () => {
      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: { mode: 'add', menuType: 'web', parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems } });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(component.hasChanges()).toBe(true);
    });

    describe('edit mode dirty tracking', () => {
      beforeEach(() => {
        const editData: MenuItemDialogData = {
          mode: 'edit',
          menuType: 'web',
          menuItem: {
            id: '2', label: 'Original', type: 'MENU', sequence: 2, access_lvl: 0,
            hidden: false, function_name: 'orig_fn',
            parameter_1: { key: 'k1', value: 'v1' },
            parameter_2: { key: 'k2', value: 'v2' },
            parameter_3: { key: 'k3', value: 'v3' },
            remarks: 'orig remarks',
            children: [],
            parentId: '1'
          } as any,
          parentMenuOptions: mockParentMenuOptions,
          allMenuItems: mockMenuItems
        };
        TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: editData });
        fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });

      it('should return false when no changes made', () => {
        expect(component.hasChanges()).toBe(false);
      });

      it('should detect displayName change', () => {
        component.displayName = 'Changed';
        expect(component.hasChanges()).toBe(true);
      });

      it('should detect parameter1Key change', () => {
        component.parameter1Key = 'newK1';
        expect(component.hasChanges()).toBe(true);
      });

      it('should detect parameter1Value change', () => {
        component.parameter1Value = 'newV1';
        expect(component.hasChanges()).toBe(true);
      });

      it('should detect parameter2Key change', () => {
        component.parameter2Key = 'newK2';
        expect(component.hasChanges()).toBe(true);
      });

      it('should detect parameter2Value change', () => {
        component.parameter2Value = 'newV2';
        expect(component.hasChanges()).toBe(true);
      });

      it('should detect parameter3Key change', () => {
        component.parameter3Key = 'newK3';
        expect(component.hasChanges()).toBe(true);
      });

      it('should detect parameter3Value change', () => {
        component.parameter3Value = 'newV3';
        expect(component.hasChanges()).toBe(true);
      });

      it('should detect remarks change', () => {
        component.remarks = 'new remarks';
        expect(component.hasChanges()).toBe(true);
      });

      it('should detect addToParentId change', () => {
        component.addToParentId = '3';
        expect(component.hasChanges()).toBe(true);
      });

      it('should detect sequence change', () => {
        component.sequence = 99;
        expect(component.hasChanges()).toBe(true);
      });

      it('should detect hideMenuItem change', () => {
        component.hideMenuItem = true;
        expect(component.hasChanges()).toBe(true);
      });
    });
  });

  describe('Touch Handlers', () => {
    beforeEach(() => {
      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: { mode: 'add', menuType: 'web', parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems } });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('onSelectFunctionBlur should mark selectFunction as touched', () => {
      component.selectFunctionTouched = false;
      component.onSelectFunctionBlur();
      expect(component.selectFunctionTouched).toBe(true);
    });

    it('onDisplayNameBlur should mark displayName as touched', () => {
      component.displayNameTouched = false;
      component.onDisplayNameBlur();
      expect(component.displayNameTouched).toBe(true);
    });

    it('onSequenceChange should mark sequence as touched', () => {
      component.sequenceTouched = false;
      component.onSequenceChange();
      expect(component.sequenceTouched).toBe(true);
    });
  });

  describe('onAddToChange additional', () => {
    beforeEach(() => {
      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: { mode: 'add', menuType: 'web', parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems } });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should mark addTo as touched', () => {
      component.addToTouched = false;
      component.addToParentId = '1';
      component.onAddToChange();
      expect(component.addToTouched).toBe(true);
    });

    it('should reset sequence to 1 when parent changes', () => {
      component.sequence = 5;
      component.addToParentId = '1';
      component.onAddToChange();
      expect(component.sequence).toBe(1);
    });

    it('should update sequence options for the new parent', () => {
      component.addToParentId = '1';
      component.onAddToChange();
      expect(component.sequenceOptions).toEqual([1, 2, 3]);
    });
  });

  describe('Input Sanitization', () => {
    beforeEach(() => {
      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: { mode: 'add', menuType: 'web', parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems } });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('onDisplayNameInput should truncate to 40 characters', () => {
      const mockEvent = { target: { value: 'a'.repeat(50) } } as unknown as Event;
      component.onDisplayNameInput(mockEvent);
      expect(component.displayName).toBe('a'.repeat(40));
      expect((mockEvent.target as HTMLInputElement).value).toBe('a'.repeat(40));
    });

    it('onDisplayNameInput should not truncate when within limit', () => {
      const mockEvent = { target: { value: 'short' } } as unknown as Event;
      component.displayName = 'short';
      component.onDisplayNameInput(mockEvent);
      expect(component.displayName).toBe('short');
    });

    it('onRemarksInput should truncate to 120 characters', () => {
      const mockEvent = { target: { value: 'b'.repeat(130) } } as unknown as Event;
      component.onRemarksInput(mockEvent);
      expect(component.remarks).toBe('b'.repeat(120));
      expect((mockEvent.target as HTMLInputElement).value).toBe('b'.repeat(120));
    });

    it('onRemarksInput should not truncate when within limit', () => {
      const mockEvent = { target: { value: 'short remark' } } as unknown as Event;
      component.remarks = 'short remark';
      component.onRemarksInput(mockEvent);
      expect(component.remarks).toBe('short remark');
    });

    it('onParameterInput should truncate parameter 1 key to 20 chars', () => {
      const mockEvent = { target: { value: 'x'.repeat(25) } } as unknown as Event;
      component.onParameterInput(mockEvent, 'key', 1);
      expect(component.parameter1Key).toBe('x'.repeat(20));
    });

    it('onParameterInput should truncate parameter 1 value to 20 chars', () => {
      const mockEvent = { target: { value: 'x'.repeat(25) } } as unknown as Event;
      component.onParameterInput(mockEvent, 'value', 1);
      expect(component.parameter1Value).toBe('x'.repeat(20));
    });

    it('onParameterInput should truncate parameter 2 key to 20 chars', () => {
      const mockEvent = { target: { value: 'x'.repeat(25) } } as unknown as Event;
      component.onParameterInput(mockEvent, 'key', 2);
      expect(component.parameter2Key).toBe('x'.repeat(20));
    });

    it('onParameterInput should truncate parameter 2 value to 20 chars', () => {
      const mockEvent = { target: { value: 'x'.repeat(25) } } as unknown as Event;
      component.onParameterInput(mockEvent, 'value', 2);
      expect(component.parameter2Value).toBe('x'.repeat(20));
    });

    it('onParameterInput should truncate parameter 3 key to 20 chars', () => {
      const mockEvent = { target: { value: 'x'.repeat(25) } } as unknown as Event;
      component.onParameterInput(mockEvent, 'key', 3);
      expect(component.parameter3Key).toBe('x'.repeat(20));
    });

    it('onParameterInput should truncate parameter 3 value to 20 chars', () => {
      const mockEvent = { target: { value: 'x'.repeat(25) } } as unknown as Event;
      component.onParameterInput(mockEvent, 'value', 3);
      expect(component.parameter3Value).toBe('x'.repeat(20));
    });

    it('onParameterInput should not truncate when within 20 char limit', () => {
      const mockEvent = { target: { value: 'short' } } as unknown as Event;
      component.parameter1Key = 'short';
      component.onParameterInput(mockEvent, 'key', 1);
      expect(component.parameter1Key).toBe('short');
    });
  });

  describe('isFormValid', () => {
    beforeEach(() => {
      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: { mode: 'add', menuType: 'web', parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems } });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should return false when selectFunction is invalid in add mode', () => {
      component.selectedFcnId = '';
      component.displayName = 'Valid';
      expect(component.isFormValid()).toBe(false);
    });

    it('should return false when displayName is whitespace only', () => {
      component.selectedFcnId = '1';
      component.displayName = '   ';
      expect(component.isFormValid()).toBe(false);
    });

    it('should return true when both fields are valid', () => {
      component.selectedFcnId = '1';
      component.displayName = 'Valid Name';
      expect(component.isFormValid()).toBe(true);
    });

    it('should return true in edit mode without selectedFcnId', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditMenuItemDialogComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: {
            mode: 'edit', menuType: 'web',
            menuItem: { id: '1', label: 'Test', type: 'MENU', sequence: 1, access_lvl: 0, hidden: false, function_name: 'fn', children: [] } as any,
            parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems
          }},
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: AddFunctionsService, useValue: mockAddFunctionsService }
        ]
      });
      const editFixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();
      editComponent.displayName = 'Valid';
      expect(editComponent.isFormValid()).toBe(true);
    });
  });

  describe('findMenuById - not found', () => {
    beforeEach(() => {
      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: { mode: 'add', menuType: 'web', parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems } });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should return null when menu item not found', () => {
      expect(component['findMenuById'](mockMenuItems, 'non-existent')).toBeNull();
    });

    it('should return null for empty node list', () => {
      expect(component['findMenuById']([], 'any-id')).toBeNull();
    });
  });

  describe('updateSequenceOptions edge cases', () => {
    beforeEach(() => {
      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: { mode: 'add', menuType: 'web', parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems } });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should set empty options when parentId is empty string', () => {
      component.addToParentId = '';
      component['updateSequenceOptions']();
      expect(component.sequenceOptions).toEqual([]);
    });
  });

  describe('Sequence in Edit Mode', () => {
    it('should use siblings.length (not +1) for edit mode sequence options', () => {
      const editData: MenuItemDialogData = {
        mode: 'edit',
        menuType: 'web',
        menuItem: {
          id: '2', label: 'Donor', type: 'MENU', sequence: 1, access_lvl: 0,
          hidden: false, function_name: 'donor_menu', children: [],
          parentId: '1'
        } as any,
        parentMenuOptions: mockParentMenuOptions,
        allMenuItems: mockMenuItems
      };
      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: editData });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.addToParentId = '1';
      component['updateSequenceOptions']();
      expect(component.sequenceOptions).toEqual([1, 2]);
    });
  });

  describe('Save edge cases', () => {
    beforeEach(() => {
      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: { mode: 'add', menuType: 'web', parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems } });
      fixture = TestBed.createComponent(AddEditMenuItemDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should return null for empty remarks', () => {
      component.selectedFcnId = '1';
      component.selectFunction = 'test';
      component.displayName = 'Test';
      component.addToParentId = '1';
      component.sequence = 1;
      component.remarks = '';

      let result: MenuItemDialogResult | undefined;
      component.saveRequest.subscribe(r => (result = r));
      component.onSave();

      expect(result?.remarks).toBeNull();
    });

    it('should return null for whitespace-only remarks', () => {
      component.selectedFcnId = '1';
      component.selectFunction = 'test';
      component.displayName = 'Test';
      component.addToParentId = '1';
      component.sequence = 1;
      component.remarks = '   ';

      let result: MenuItemDialogResult | undefined;
      component.saveRequest.subscribe(r => (result = r));
      component.onSave();

      expect(result?.remarks).toBeNull();
    });

    it('should return fcnId 0 when selectedFcnId is empty', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditMenuItemDialogComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: {
            mode: 'edit', menuType: 'web',
            menuItem: { id: '1', label: 'Test', type: 'MENU', sequence: 1, access_lvl: 0, hidden: false, function_name: 'fn', children: [] } as any,
            parentMenuOptions: mockParentMenuOptions, allMenuItems: mockMenuItems
          }},
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: AddFunctionsService, useValue: mockAddFunctionsService }
        ]
      });
      const f = TestBed.createComponent(AddEditMenuItemDialogComponent);
      const c = f.componentInstance;
      f.detectChanges();

      c.displayName = 'Test';
      c.addToParentId = '1';
      c.sequence = 1;

      let result: MenuItemDialogResult | undefined;
      c.saveRequest.subscribe(r => (result = r));
      c.onSave();

      expect(result?.fcnId).toBe(0);
    });

    it('should not emit when form is invalid', () => {
      component.selectedFcnId = '';
      component.displayName = '';

      let emitted = false;
      component.saveRequest.subscribe(() => (emitted = true));
      component.onSave();

      expect(emitted).toBe(false);
    });

    it('should default parentId to "0" when addToParentId is empty', () => {
      component.selectedFcnId = '1';
      component.selectFunction = 'test';
      component.displayName = 'Test';
      component.addToParentId = '';
      component.sequence = 1;

      let result: MenuItemDialogResult | undefined;
      component.saveRequest.subscribe(r => (result = r));
      component.onSave();

      expect(result?.parentId).toBe('0');
    });

    it('should default sequence to 1 when sequence is null', () => {
      component.selectedFcnId = '1';
      component.selectFunction = 'test';
      component.displayName = 'Test';
      component.addToParentId = '1';
      component.sequence = null;

      let result: MenuItemDialogResult | undefined;
      component.saveRequest.subscribe(r => (result = r));
      component.onSave();

      expect(result?.sequence).toBe(1);
    });
  });

});
