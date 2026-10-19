import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { MultiSelectInterdictionsDialogComponent } from './multi-select-interdictions-dialog.component';
import { InterdictionQueryService } from '../../../../query-interdictions-holds/services/interdiction-query.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('MultiSelectInterdictionsDialogComponent', () => {
  let component: MultiSelectInterdictionsDialogComponent;
  let fixture: ComponentFixture<MultiSelectInterdictionsDialogComponent>;
  let mockServiceSpy: jasmine.SpyObj<InterdictionQueryService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<MultiSelectInterdictionsDialogComponent>>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const mockDialogData = {
    unitId: 'W12342402705-Q',
    mode: 'OR' as 'AND' | 'OR'
  };

  const mockInterdictionTypesResponse = {
    success: true,
    message: '',
    data: [
      { code: 'INTER', description: 'Interdiction', type: 'Interdiction' as const },
      { code: 'CPDF', description: 'Carrier Permanent Deferral', type: 'Interdiction' as const },
      { code: 'ELPX', description: 'Eligibility Testing 1.07 Valid Proc. Exclusions', type: 'Interdiction' as const }
    ]
  };

  beforeEach(() => {

    mockServiceSpy = jasmine.createSpyObj('InterdictionQueryService', [
      'getValidInterdictionTypes',
      'getInterdictionCodesByType',
      'getInterdictionCodes'
    ]);
    mockServiceSpy.getValidInterdictionTypes.and.returnValue(of(mockInterdictionTypesResponse));
    mockServiceSpy.getInterdictionCodesByType.and.returnValue(of([]));
    mockServiceSpy.getInterdictionCodes.and.returnValue(of([]));

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    snackBarSpy = createMockMatSnackBar();



      TestBed.configureTestingModule({
imports: [MultiSelectInterdictionsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: InterdictionQueryService, useValue: mockServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    });


    });



  beforeEach(() => {


      mockServiceSpy.getValidInterdictionTypes.calls.reset();


      mockServiceSpy.getInterdictionCodesByType.calls.reset();


      mockServiceSpy.getInterdictionCodes.calls.reset();


      dialogRefSpy.close.calls.reset();


      mockServiceSpy.getValidInterdictionTypes.and.returnValue(of(mockInterdictionTypesResponse));


      mockServiceSpy.getInterdictionCodesByType.and.returnValue(of([]));


      mockServiceSpy.getInterdictionCodes.and.returnValue(of([]));


    fixture = TestBed.createComponent(MultiSelectInterdictionsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  it('should initialize form with correct default values', () => {
    expect(component.filterForm).toBeDefined();
    expect(component.filterForm.get('logicalOperation')?.value).toBe('OR');
    expect(component.filterForm.get('interdictionType')?.value?.code).toBe('INTER');
  });

  it('should load interdiction types on init', () => {
    expect(mockServiceSpy.getValidInterdictionTypes).toHaveBeenCalled();
    expect(component.interdictionTypes.length).toBe(3);
  });

  // TODO: Uncomment when error handling is implemented
  // it('should display error message when interdiction types fail to load', () => {
  //   const errorObservable = {
  //     pipe: () => errorObservable,
  //     subscribe: (callbacks: any) => {
  //       if (callbacks.error) {
  //         callbacks.error(new Error('API Error'));
  //       }
  //       return { unsubscribe: () => {} };
  //     }
  //   };

  //   mockServiceSpy.getValidInterdictionTypes.and.returnValue(errorObservable as any);

  //   const newComponent = TestBed.createComponent(MultiSelectInterdictionsDialogComponent).componentInstance;
  //   newComponent.ngOnInit();

  //   expect(snackBarSpy.open).toHaveBeenCalledWith(
  //     'Failed to load interdiction types',
  //     'Close',
  //     jasmine.objectContaining({
  //       duration: 5000,
  //       horizontalPosition: 'end',
  //       verticalPosition: 'top'
  //     })
  //   );
  // });

  // TODO: Uncomment when retrieve functionality is fully implemented
  // it('should retrieve interdictions when RETRIEVE button is clicked', (done) => {
  //   component.filterForm.patchValue({
  //     interdictionType: 'INTER',
  //     description: ''
  //   });

  //   component.onRetrieve();

  //   expect(component.isLoading()).toBe(true);

  //   setTimeout(() => {
  //     expect(component.isLoading()).toBe(false);
  //     expect(component.queryResults().length).toBeGreaterThan(0);
  //     done();
  //   }, 600);
  // });

  it('should not retrieve if form is invalid', () => {
    component.filterForm.patchValue({ interdictionType: '' });
    component.onRetrieve();
    expect(component.queryResults().length).toBe(0);
  });

  it('should toggle individual row selection', () => {
    const mockRow = {
      selected: false,
      interdictionCode: 'CPDF',
      description: 'Carter Permanent Deferral',
      effectiveDate: '2025-01-11',
      terminationDate: '2025-01-11'
    };

    component.queryResults.set([mockRow]);
    mockRow.selected = true;
    component.toggleRow(mockRow);

    expect(component.queryResults()[0].selected).toBe(true);
  });







  // TODO: Uncomment when error handling is implemented
  // it('should show error when APPLY is clicked without selections', () => {
  //   component.queryResults.set([
  //     { selected: false, interdictionCode: 'CPDF', description: 'Test 1', effectiveDate: '2025-01-11', terminationDate: '2025-01-11' }
  //   ]);

  //   component.onApply();

  //   expect(snackBarSpy.open).toHaveBeenCalledWith(
  //     'Please select at least one interdiction',
  //     'Close',
  //     jasmine.objectContaining({
  //       duration: 5000,
  //       horizontalPosition: 'end',
  //       verticalPosition: 'top'
  //     })
  //   );
  //   expect(dialogRefSpy.close).not.toHaveBeenCalled();
  // });

  it('should correctly determine if there are selections', () => {
    component.queryResults.set([]);
    expect(component.hasSelections()).toBe(false);

    component.queryResults.set([
      { selected: false, interdictionCode: 'CPDF', description: 'Test 1', effectiveDate: '2025-01-11', terminationDate: '2025-01-11' }
    ]);
    expect(component.hasSelections()).toBe(false);

    component.queryResults.set([
      { selected: true, interdictionCode: 'CPDF', description: 'Test 1', effectiveDate: '2025-01-11', terminationDate: '2025-01-11' }
    ]);
    expect(component.hasSelections()).toBe(true);
  });

  it('should cleanup on destroy', () => {
    const destroySpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  describe('Change Detection', () => {
    it('should return false for hasChanges() when no changes made', () => {
      // Setup initial state
      component['initialSelectedCodes'] = ['CODE1', 'CODE2'];
      component['initialLogicalOperation'] = 'OR';
      component.filterForm.patchValue({ logicalOperation: 'OR' });

      // Set current state to match initial
      component.queryResults.set([
        { selected: true, interdictionCode: 'CODE1', description: 'Test 1', effectiveDate: '', terminationDate: '' },
        { selected: true, interdictionCode: 'CODE2', description: 'Test 2', effectiveDate: '', terminationDate: '' }
      ]);

      expect(component.hasChanges()).toBe(false);
    });

    it('should return true for hasChanges() when selected codes changed', () => {
      // Setup initial state
      component['initialSelectedCodes'] = ['CODE1', 'CODE2'];
      component['initialLogicalOperation'] = 'OR';
      component.filterForm.patchValue({ logicalOperation: 'OR' });

      // Change selected codes (only CODE1 selected now)
      component.queryResults.set([
        { selected: true, interdictionCode: 'CODE1', description: 'Test 1', effectiveDate: '', terminationDate: '' },
        { selected: false, interdictionCode: 'CODE2', description: 'Test 2', effectiveDate: '', terminationDate: '' }
      ]);

      expect(component.hasChanges()).toBe(true);
    });

    it('should return true for hasChanges() when logical operation changed', () => {
      // Setup initial state
      component['initialSelectedCodes'] = ['CODE1', 'CODE2'];
      component['initialLogicalOperation'] = 'OR';
      component.filterForm.patchValue({ logicalOperation: 'AND' }); // Changed to AND

      // Keep same selected codes
      component.queryResults.set([
        { selected: true, interdictionCode: 'CODE1', description: 'Test 1', effectiveDate: '', terminationDate: '' },
        { selected: true, interdictionCode: 'CODE2', description: 'Test 2', effectiveDate: '', terminationDate: '' }
      ]);

      expect(component.hasChanges()).toBe(true);
    });

    it('should return false for canApply() when no changes', () => {
      // Setup initial state with no selections
      component['initialSelectedCodes'] = [];
      component['initialLogicalOperation'] = 'OR';
      component.filterForm.patchValue({ logicalOperation: 'OR' });

      // Current state also has no selections (no change)
      component.queryResults.set([]);
      expect(component.canApply()).toBe(false);
    });

    it('should return false for canApply() when has selections but no changes', () => {
      // Setup initial state
      component['initialSelectedCodes'] = ['CODE1'];
      component['initialLogicalOperation'] = 'OR';
      component.filterForm.patchValue({ logicalOperation: 'OR' });

      // Set current state to match initial
      component.queryResults.set([
        { selected: true, interdictionCode: 'CODE1', description: 'Test 1', effectiveDate: '', terminationDate: '' }
      ]);

      expect(component.canApply()).toBe(false);
    });

    it('should return true for canApply() when has changes (regardless of selections)', () => {
      // Setup initial state
      component['initialSelectedCodes'] = ['CODE1', 'CODE2'];
      component['initialLogicalOperation'] = 'OR';
      component.filterForm.patchValue({ logicalOperation: 'OR' });

      // Change selected codes (only CODE1 selected now)
      component.queryResults.set([
        { selected: true, interdictionCode: 'CODE1', description: 'Test 1', effectiveDate: '', terminationDate: '' },
        { selected: false, interdictionCode: 'CODE2', description: 'Test 2', effectiveDate: '', terminationDate: '' }
      ]);

      expect(component.canApply()).toBe(true);
    });

    it('should return true for canApply() when deselecting all interdictions (clearing selections)', () => {
      // Setup initial state with 2 selections
      component['initialSelectedCodes'] = ['CODE1', 'CODE2'];
      component['initialLogicalOperation'] = 'OR';
      component.filterForm.patchValue({ logicalOperation: 'OR' });

      // User deselects all (this is a valid change - clearing selections)
      component.queryResults.set([
        { selected: false, interdictionCode: 'CODE1', description: 'Test 1', effectiveDate: '', terminationDate: '' },
        { selected: false, interdictionCode: 'CODE2', description: 'Test 2', effectiveDate: '', terminationDate: '' }
      ]);

      expect(component.hasChanges()).toBe(true);
      expect(component.hasSelections()).toBe(false);
      expect(component.canApply()).toBe(true); // Should allow clearing selections
    });

    it('should capture initial state on ngOnInit', () => {
      const testData = {
        mode: 'AND' as 'AND' | 'OR',
        selectedCodes: ['TEST1', 'TEST2', 'TEST3']
      };

      // Mock getInterdictionCodes to return the previously selected codes
      const mockCodes = [
        { code: 'TEST1', description: 'Test Code 1', effDate: '2024-01-01' },
        { code: 'TEST2', description: 'Test Code 2', effDate: '2024-01-01' },
        { code: 'TEST3', description: 'Test Code 3', effDate: '2024-01-01' }
      ];
      mockServiceSpy.getInterdictionCodes.and.returnValue(of(mockCodes));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [MultiSelectInterdictionsDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: InterdictionQueryService, useValue: mockServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: MAT_DIALOG_DATA, useValue: testData }
        ]
      });

      const newFixture = TestBed.createComponent(MultiSelectInterdictionsDialogComponent);
      const newComponent = newFixture.componentInstance;

      newComponent.ngOnInit();
      newFixture.detectChanges();

      expect(newComponent['initialSelectedCodes']).toEqual(['TEST1', 'TEST2', 'TEST3']);
      expect(newComponent['initialLogicalOperation']).toBe('AND');
    });

    it('should auto-load previously selected codes on ngOnInit', (done) => {
      const testData = {
        mode: 'OR' as 'AND' | 'OR',
        selectedCodes: ['CODE1', 'CODE2']
      };

      // Mock getInterdictionCodesByType to return codes including previously selected
      const mockCodes = [
        { code: 'CODE1', description: 'Test Code 1', effDate: '2024-01-01' },
        { code: 'CODE2', description: 'Test Code 2', effDate: '2024-01-01' }
      ];
      mockServiceSpy.getInterdictionCodesByType.and.returnValue(of(mockCodes));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [MultiSelectInterdictionsDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: InterdictionQueryService, useValue: mockServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: MAT_DIALOG_DATA, useValue: testData }
        ]
      });

      const newFixture = TestBed.createComponent(MultiSelectInterdictionsDialogComponent);
      const newComponent = newFixture.componentInstance;

      newComponent.ngOnInit();
      newFixture.detectChanges();

      // Wait for async auto-load to complete
      setTimeout(() => {
        expect(mockServiceSpy.getInterdictionCodesByType).toHaveBeenCalled();
        expect(newComponent.queryResults().length).toBe(2);
        expect(newComponent.queryResults()[0].selected).toBe(true);
        expect(newComponent.queryResults()[1].selected).toBe(true);
        expect(newComponent.queryResults()[0].interdictionCode).toBe('CODE1');
        expect(newComponent.queryResults()[1].interdictionCode).toBe('CODE2');
        done();
      }, 100);
    });
  });

  describe('Apply Validation', () => {
    it('should allow applying when clearing all selections (deselecting all)', () => {
      // Setup initial state with selections
      component['initialSelectedCodes'] = ['CODE1', 'CODE2'];
      component['initialLogicalOperation'] = 'OR';
      component.filterForm.patchValue({ logicalOperation: 'OR' });

      // User deselects all - this should be allowed (clearing selections)
      component.queryResults.set([
        { selected: false, interdictionCode: 'CODE1', description: 'Test 1', effectiveDate: '', terminationDate: '' },
        { selected: false, interdictionCode: 'CODE2', description: 'Test 2', effectiveDate: '', terminationDate: '' }
      ]);

      component.onApply();

      // Should close dialog with empty selections (clearing)
      expect(dialogRefSpy.close).toHaveBeenCalledWith(
        jasmine.objectContaining({
          success: true,
          selectedCodes: [],
          displayString: ''
        })
      );
      expect(snackBarSpy.open).not.toHaveBeenCalled();
    });
  });

  describe('onClose', () => {
    it('should close dialog with success false', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.objectContaining({ success: false }));
    });
  });

  describe('toggleAll', () => {
    it('should select all rows when not all selected', () => {
      component.queryResults.set([
        { selected: false, interdictionCode: 'A', description: '', effectiveDate: '', terminationDate: '' },
        { selected: true, interdictionCode: 'B', description: '', effectiveDate: '', terminationDate: '' },
      ]);
      component.toggleAll();
      expect(component.queryResults().every(r => r.selected)).toBe(true);
    });

    it('should deselect all rows when all selected', () => {
      component.queryResults.set([
        { selected: true, interdictionCode: 'A', description: '', effectiveDate: '', terminationDate: '' },
        { selected: true, interdictionCode: 'B', description: '', effectiveDate: '', terminationDate: '' },
      ]);
      component.toggleAll();
      expect(component.queryResults().every(r => !r.selected)).toBe(true);
    });
  });

  describe('isAllSelected', () => {
    it('should return false when no results', () => {
      component.queryResults.set([]);
      expect(component.isAllSelected()).toBe(false);
    });

    it('should return true when all selected', () => {
      component.queryResults.set([
        { selected: true, interdictionCode: 'A', description: '', effectiveDate: '', terminationDate: '' },
      ]);
      expect(component.isAllSelected()).toBe(true);
    });

    it('should return false when some not selected', () => {
      component.queryResults.set([
        { selected: true, interdictionCode: 'A', description: '', effectiveDate: '', terminationDate: '' },
        { selected: false, interdictionCode: 'B', description: '', effectiveDate: '', terminationDate: '' },
      ]);
      expect(component.isAllSelected()).toBe(false);
    });
  });

  describe('isSomeSelected', () => {
    it('should return true when some but not all selected', () => {
      component.queryResults.set([
        { selected: true, interdictionCode: 'A', description: '', effectiveDate: '', terminationDate: '' },
        { selected: false, interdictionCode: 'B', description: '', effectiveDate: '', terminationDate: '' },
      ]);
      expect(component.isSomeSelected()).toBe(true);
    });

    it('should return false when all selected', () => {
      component.queryResults.set([
        { selected: true, interdictionCode: 'A', description: '', effectiveDate: '', terminationDate: '' },
      ]);
      expect(component.isSomeSelected()).toBe(false);
    });

    it('should return false when none selected', () => {
      component.queryResults.set([
        { selected: false, interdictionCode: 'A', description: '', effectiveDate: '', terminationDate: '' },
      ]);
      expect(component.isSomeSelected()).toBe(false);
    });
  });

  describe('Sort', () => {
    it('should cycle sort: null -> desc -> asc -> desc', () => {
      expect(component.currentSortDirection).toBeNull();
      component.toggleSort();
      expect(component.currentSortDirection).toBe('desc');
      component.toggleSort();
      expect(component.currentSortDirection).toBe('asc');
      component.toggleSort();
      expect(component.currentSortDirection).toBe('desc');
    });

    it('should sort data descending', () => {
      component.queryResults.set([
        { selected: false, interdictionCode: 'A', description: '', effectiveDate: '', terminationDate: '' },
        { selected: false, interdictionCode: 'C', description: '', effectiveDate: '', terminationDate: '' },
        { selected: false, interdictionCode: 'B', description: '', effectiveDate: '', terminationDate: '' },
      ]);
      component.toggleSort(); // desc
      expect(component.queryResults()[0].interdictionCode).toBe('C');
    });

    it('should sort data ascending', () => {
      component.queryResults.set([
        { selected: false, interdictionCode: 'C', description: '', effectiveDate: '', terminationDate: '' },
        { selected: false, interdictionCode: 'A', description: '', effectiveDate: '', terminationDate: '' },
        { selected: false, interdictionCode: 'B', description: '', effectiveDate: '', terminationDate: '' },
      ]);
      component.toggleSort(); // desc
      component.toggleSort(); // asc
      expect(component.queryResults()[0].interdictionCode).toBe('A');
    });

    it('getSortIcon should return correct icons', () => {
      expect(component.getSortIcon()).toBe('unfold_more');
      component.currentSortDirection = 'asc';
      expect(component.getSortIcon()).toBe('arrow_upward');
      component.currentSortDirection = 'desc';
      expect(component.getSortIcon()).toBe('arrow_downward');
    });

    it('isSortActive should return correct state', () => {
      expect(component.isSortActive()).toBe(false);
      component.currentSortDirection = 'asc';
      expect(component.isSortActive()).toBe(true);
    });
  });

  describe('onRetrieve success', () => {
    it('should retrieve and map interdiction codes', () => {
      const mockCodes = [
        { code: 'INT1', description: 'Interdiction 1', effDate: '2024-01-01' },
        { code: 'INT2', description: 'Interdiction 2', effDate: '' },
      ];
      mockServiceSpy.getInterdictionCodesByType.and.returnValue(of(mockCodes));

      component.filterForm.patchValue({ interdictionType: { code: 'INTER', description: 'Interdiction' } });
      component.onRetrieve();

      expect(component.queryResults().length).toBe(2);
      expect(component.queryResults()[0].interdictionCode).toBe('INT1');
      expect(component.queryResults()[0].effectiveDate).toBe('2024-01-01');
      expect(component.isLoading()).toBe(false);
    });

    it('should mark previously selected codes', () => {
      component['data'] = { ...mockDialogData, selectedCodes: ['INT1'] };
      const mockCodes = [
        { code: 'INT1', description: 'D1', effDate: '' },
        { code: 'INT2', description: 'D2', effDate: '' },
      ];
      mockServiceSpy.getInterdictionCodesByType.and.returnValue(of(mockCodes));

      component.filterForm.patchValue({ interdictionType: { code: 'INTER', description: 'Interdiction' } });
      component.onRetrieve();

      expect(component.queryResults()[0].selected).toBe(true);
      expect(component.queryResults()[1].selected).toBe(false);
    });
  });

  describe('onRetrieve error', () => {
    it('should show error message on retrieve failure', () => {
      mockServiceSpy.getInterdictionCodesByType.and.returnValue(throwError(() => new Error('fail')));
      const openSpy = spyOn(component['snackBar'], 'open');
      component.filterForm.patchValue({ interdictionType: { code: 'INTER', description: 'Interdiction' } });
      component.onRetrieve();

      expect(openSpy).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('loadInterdictionTypes error', () => {
    it('should show error on types load failure', () => {
      mockServiceSpy.getValidInterdictionTypes.and.returnValue(throwError(() => new Error('fail')));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [MultiSelectInterdictionsDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: InterdictionQueryService, useValue: mockServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
        ]
      });
      const f = TestBed.createComponent(MultiSelectInterdictionsDialogComponent);
      const openSpy = spyOn(f.componentInstance['snackBar'], 'open');
      f.detectChanges();
      expect(openSpy).toHaveBeenCalled();
    });
  });

  describe('autoRetrieveCodes error', () => {
    it('should show error on auto-retrieve codes load failure', () => {
      mockServiceSpy.getInterdictionCodesByType.and.returnValue(throwError(() => new Error('fail')));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [MultiSelectInterdictionsDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: InterdictionQueryService, useValue: mockServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: MAT_DIALOG_DATA, useValue: { ...mockDialogData, selectedCodes: ['X'] } }
        ]
      });
      const f = TestBed.createComponent(MultiSelectInterdictionsDialogComponent);
      const openSpy = spyOn(f.componentInstance['snackBar'], 'open');
      f.detectChanges();
      expect(openSpy).toHaveBeenCalled();
    });
  });

  describe('onApply', () => {
    it('should close with selected codes and display string', () => {
      component['initialSelectedCodes'] = [];
      component.queryResults.set([
        { selected: true, interdictionCode: 'INT1', description: 'D1', effectiveDate: '', terminationDate: '' },
        { selected: true, interdictionCode: 'INT2', description: 'D2', effectiveDate: '', terminationDate: '' },
      ]);
      component.filterForm.patchValue({ logicalOperation: 'AND' });

      component.onApply();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.objectContaining({
        success: true,
        selectedCodes: ['INT1', 'INT2'],
        logicalOperation: 'AND',
        displayString: 'INT1, INT2'
      }));
    });

    it('should show error when no selections and no initial selections', () => {
      component['initialSelectedCodes'] = [];
      component.queryResults.set([]);
      const openSpy = spyOn(component['snackBar'], 'open');
      component.onApply();
      expect(openSpy).toHaveBeenCalled();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should show error when more than 130 selections', () => {
      component['initialSelectedCodes'] = [];
      const manyRows = Array.from({ length: 131 }, (_, i) => ({
        selected: true, interdictionCode: `C${i}`, description: '', effectiveDate: '', terminationDate: ''
      }));
      component.queryResults.set(manyRows);
      const openSpy = spyOn(component['snackBar'], 'open');
      component.onApply();
      expect(openSpy).toHaveBeenCalled();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should truncate display string > 50 chars', () => {
      component['initialSelectedCodes'] = [];
      const rows = Array.from({ length: 20 }, (_, i) => ({
        selected: true, interdictionCode: `CODE${i}`, description: '', effectiveDate: '', terminationDate: ''
      }));
      component.queryResults.set(rows);
      component.onApply();

      const result = dialogRefSpy.close.calls.mostRecent().args[0];
      expect(result.displayString.length).toBeLessThanOrEqual(50);
      expect(result.displayString).toContain('...');
    });
  });

  describe('interdiction type description auto-populate', () => {
    it('should update description when type changes', () => {
      component.filterForm.patchValue({ interdictionType: { code: 'CPDF', description: 'Carrier Permanent Deferral' } });
      expect(component.filterForm.get('description')?.value).toBe('Carrier Permanent Deferral');
    });

    it('should clear description for null type', () => {
      component.filterForm.patchValue({ interdictionType: null });
      expect(component.filterForm.get('description')?.value).toBe('');
    });
  });

  describe('availableInterdictionTypes from data', () => {
    it('should use passed types instead of API', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [MultiSelectInterdictionsDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: InterdictionQueryService, useValue: mockServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: MAT_DIALOG_DATA, useValue: {
            ...mockDialogData,
            availableInterdictionTypes: [
              { code: 'CUSTOM', description: 'Custom Type', type: 'Interdiction' as const }
            ]
          }}
        ]
      });
      mockServiceSpy.getValidInterdictionTypes.calls.reset();
      const f = TestBed.createComponent(MultiSelectInterdictionsDialogComponent);
      f.detectChanges();

      expect(f.componentInstance.interdictionTypes.length).toBe(1);
      expect(f.componentInstance.interdictionTypes[0].code).toBe('CUSTOM');
      expect(mockServiceSpy.getValidInterdictionTypes).not.toHaveBeenCalled();
    });
  });

  describe('loadInterdictionTypes', () => {
    it('should load and sort types from API', () => {
      const response = {
        success: true,
        message: '',
        data: [
          { code: 'INTER', description: 'Interdiction', type: 'Interdiction' as const },
          { code: 'CPDF', description: 'No date', type: 'Interdiction' as const },
        ]
      };
      mockServiceSpy.getValidInterdictionTypes.and.returnValue(of(response));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [MultiSelectInterdictionsDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: InterdictionQueryService, useValue: mockServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
        ]
      });
      const f = TestBed.createComponent(MultiSelectInterdictionsDialogComponent);
      f.detectChanges();

      expect(f.componentInstance.interdictionTypes.length).toBe(2);
    });

    it('should default to INTER type if available', () => {
      const response = {
        success: true, message: '',
        data: [
          { code: 'AAA', description: 'First', type: 'Interdiction' as const },
          { code: 'INTER', description: 'Interdiction', type: 'Interdiction' as const },
        ]
      };
      mockServiceSpy.getValidInterdictionTypes.and.returnValue(of(response));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [MultiSelectInterdictionsDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: InterdictionQueryService, useValue: mockServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
        ]
      });
      const f = TestBed.createComponent(MultiSelectInterdictionsDialogComponent);
      f.detectChanges();

      expect(f.componentInstance.filterForm.get('interdictionType')?.value?.code).toBe('INTER');
    });

    it('should default to first type if INTER not available', () => {
      const response = {
        success: true, message: '',
        data: [
          { code: 'CPDF', description: 'Carrier', type: 'Interdiction' as const },
        ]
      };
      mockServiceSpy.getValidInterdictionTypes.and.returnValue(of(response));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [MultiSelectInterdictionsDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: InterdictionQueryService, useValue: mockServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
        ]
      });
      const f = TestBed.createComponent(MultiSelectInterdictionsDialogComponent);
      f.detectChanges();

      expect(f.componentInstance.filterForm.get('interdictionType')?.value?.code).toBe('CPDF');
    });
  });
});
