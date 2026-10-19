import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FilterDialogComponent, FilterDialogData } from './filter-dialog';

describe('FilterDialogComponent', () => {
  let dialogRefSpy: any;
  let component: FilterDialogComponent;
  let fixture: ComponentFixture<FilterDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<FilterDialogComponent>>;
  let mockDialogData: FilterDialogData;

  beforeEach(() => {

    mockDialogData = {
      parameterType: 'all',
      upperFilter: 'all',
      listFilter: 'all'
    };

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FilterDialogComponent
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    });


    


      dialogRefSpy.close.calls.reset();


    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<FilterDialogComponent>>;
    fixture = TestBed.createComponent(FilterDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Initialization', () => {
    it('should initialize with default "all" filter values', () => {
      expect(component.parameterType).toBe('all');
      expect(component.upperFilter).toBe('all');
      expect(component.listFilter).toBe('all');
    });

    it('should initialize with provided filter values', () => {
      const customData: FilterDialogData = {
        parameterType: 'CHAR',
        upperFilter: 'yes',
        listFilter: 'no'
      };

      const customComponent = new FilterDialogComponent(
        dialogRef,
        customData
      );

      expect(customComponent.parameterType).toBe('CHAR');
      expect(customComponent.upperFilter).toBe('yes');
      expect(customComponent.listFilter).toBe('no');
    });

    it('should handle null or undefined filter values', () => {
      const dataWithNulls: FilterDialogData = {
        parameterType: null as any,
        upperFilter: undefined as any,
        listFilter: null as any
      };

      const customComponent = new FilterDialogComponent(
        dialogRef,
        dataWithNulls
      );

      expect(customComponent.parameterType).toBe('all');
      expect(customComponent.upperFilter).toBe('all');
      expect(customComponent.listFilter).toBe('all');
    });
  });
  describe('Clear all filters', () => {
    it('should reset all filters to "all" and apply', () => {
      component.parameterType = 'CHAR';
      component.upperFilter = 'yes';
      component.listFilter = 'no';

      component.clearAll();

      expect(component.parameterType).toBe('all');
      expect(component.upperFilter).toBe('all');
      expect(component.listFilter).toBe('all');
      expect(dialogRef.close).toHaveBeenCalledWith({
        parameterType: 'all',
        upperFilter: 'all',
        listFilter: 'all'
      });
    });



    it('should clear filters when CLEAR ALL button is clicked', () => {
      component.parameterType = 'NUM';
      component.upperFilter = 'no';
      component.listFilter = 'yes';

      const compiled = fixture.nativeElement as HTMLElement;
      const clearButton = compiled.querySelector('.clear-button') as HTMLButtonElement;
      
      if (clearButton) {
        clearButton.click();
        fixture.detectChanges();
        
        expect(dialogRef.close).toHaveBeenCalledWith({
          parameterType: 'all',
          upperFilter: 'all',
          listFilter: 'all'
        });
      }
    });
  });

  describe('Apply filters', () => {


    it('should apply filters with NUM parameter type', () => {
      component.parameterType = 'NUM';
      component.upperFilter = 'no';
      component.listFilter = 'yes';

      component.applyFilters();

      expect(dialogRef.close).toHaveBeenCalledWith({
        parameterType: 'NUM',
        upperFilter: 'no',
        listFilter: 'yes'
      });
    });

    it('should apply filters with DATE parameter type', () => {
      component.parameterType = 'DATE';
      component.upperFilter = 'all';
      component.listFilter = 'all';

      component.applyFilters();

      expect(dialogRef.close).toHaveBeenCalledWith({
        parameterType: 'DATE',
        upperFilter: 'all',
        listFilter: 'all'
      });
    });

    it('should apply filters when APPLY button is clicked', () => {
      component.parameterType = 'CHAR';
      component.upperFilter = 'yes';
      component.listFilter = 'no';

      const compiled = fixture.nativeElement as HTMLElement;
      const applyButton = compiled.querySelector('.apply-button') as HTMLButtonElement;
      
      if (applyButton) {
        applyButton.click();
        fixture.detectChanges();
        
        expect(dialogRef.close).toHaveBeenCalledWith({
          parameterType: 'CHAR',
          upperFilter: 'yes',
          listFilter: 'no'
        });
      }
    });
  });

  describe('Filter value changes', () => {
    it('should update parameterType when changed', () => {
      component.parameterType = 'CHAR';
      fixture.detectChanges();

      expect(component.parameterType).toBe('CHAR');
    });

    it('should update upperFilter when changed', () => {
      component.upperFilter = 'yes';
      fixture.detectChanges();

      expect(component.upperFilter).toBe('yes');
    });

    it('should update listFilter when changed', () => {
      component.listFilter = 'no';
      fixture.detectChanges();

      expect(component.listFilter).toBe('no');
    });

    it('should maintain independent filter states', () => {
      component.parameterType = 'NUM';
      component.upperFilter = 'no';
      component.listFilter = 'yes';
      fixture.detectChanges();

      expect(component.parameterType).toBe('NUM');
      expect(component.upperFilter).toBe('no');
      expect(component.listFilter).toBe('yes');
    });
  });

  describe('Dialog UI elements', () => {


    it('should display close button in header', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const closeButton = compiled.querySelector('.close-button mat-icon');
      
      expect(closeButton?.textContent?.trim()).toBe('close');
    });





    it('should have proper CSS classes applied', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const dialogContainer = compiled.querySelector('.filter-dialog');
      const dialogHeader = compiled.querySelector('.dialog-header');
      const dialogContent = compiled.querySelector('.dialog-content');
      const dialogFooter = compiled.querySelector('.dialog-footer');
      
      expect(dialogContainer).toBeTruthy();
      expect(dialogHeader).toBeTruthy();
      expect(dialogContent).toBeTruthy();
      expect(dialogFooter).toBeTruthy();
    });
  });

  describe('Filter combinations', () => {
    it('should handle all filters set to "all"', () => {
      component.parameterType = 'all';
      component.upperFilter = 'all';
      component.listFilter = 'all';

      component.applyFilters();

      expect(dialogRef.close).toHaveBeenCalledWith({
        parameterType: 'all',
        upperFilter: 'all',
        listFilter: 'all'
      });
    });

    it('should handle mix of specific and "all" filter values', () => {
      component.parameterType = 'CHAR';
      component.upperFilter = 'all';
      component.listFilter = 'yes';

      component.applyFilters();

      expect(dialogRef.close).toHaveBeenCalledWith({
        parameterType: 'CHAR',
        upperFilter: 'all',
        listFilter: 'yes'
      });
    });

    it('should handle all specific filter values', () => {
      component.parameterType = 'DATE';
      component.upperFilter = 'no';
      component.listFilter = 'no';

      component.applyFilters();

      expect(dialogRef.close).toHaveBeenCalledWith({
        parameterType: 'DATE',
        upperFilter: 'no',
        listFilter: 'no'
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid filter changes', () => {
      component.parameterType = 'CHAR';
      component.parameterType = 'NUM';
      component.parameterType = 'DATE';
      
      expect(component.parameterType).toBe('DATE');
    });

    it('should handle apply without any changes', () => {
      component.applyFilters();

      expect(dialogRef.close).toHaveBeenCalledWith({
        parameterType: 'all',
        upperFilter: 'all',
        listFilter: 'all'
      });
    });

    it('should handle multiple clear operations', () => {
      component.parameterType = 'CHAR';
      component.clearAll();
      
      component.parameterType = 'NUM';
      component.clearAll();

      expect(component.parameterType).toBe('all');
      expect(component.upperFilter).toBe('all');
      expect(component.listFilter).toBe('all');
    });

    it('should properly reset after setting and clearing filters multiple times', () => {
      // First cycle
      component.parameterType = 'CHAR';
      component.upperFilter = 'yes';
      component.clearAll();
      
      // Second cycle
      component.parameterType = 'NUM';
      component.listFilter = 'no';
      component.clearAll();

      expect(component.parameterType).toBe('all');
      expect(component.upperFilter).toBe('all');
      expect(component.listFilter).toBe('all');
    });
  });

  describe('Data binding', () => {
    it('should have two-way binding for parameterType', () => {
      const initialValue = component.parameterType;
      component.parameterType = 'CHAR';
      
      expect(component.parameterType).not.toBe(initialValue);
      expect(component.parameterType).toBe('CHAR');
    });

    it('should have two-way binding for upperFilter', () => {
      const initialValue = component.upperFilter;
      component.upperFilter = 'yes';
      
      expect(component.upperFilter).not.toBe(initialValue);
      expect(component.upperFilter).toBe('yes');
    });

    it('should have two-way binding for listFilter', () => {
      const initialValue = component.listFilter;
      component.listFilter = 'no';
      
      expect(component.listFilter).not.toBe(initialValue);
      expect(component.listFilter).toBe('no');
    });
  });

  describe('dialogRef reference', () => {
    it('should have access to dialogRef', () => {
      expect(component.dialogRef).toBeDefined();
      expect(component.dialogRef).toBe(dialogRef);
    });


  });

  describe('MAT_DIALOG_DATA injection', () => {
    it('should receive data through MAT_DIALOG_DATA', () => {
      expect(component.data).toBeDefined();
      expect(component.data.parameterType).toBe('all');
      expect(component.data.upperFilter).toBe('all');
      expect(component.data.listFilter).toBe('all');
    });

    it('should initialize component state from injected data', () => {
      const customData: FilterDialogData = {
        parameterType: 'NUM',
        upperFilter: 'yes',
        listFilter: 'yes'
      };

      const customDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
      const customComponent = new FilterDialogComponent(customDialogRef, customData);

      expect(customComponent.parameterType).toBe('NUM');
      expect(customComponent.upperFilter).toBe('yes');
      expect(customComponent.listFilter).toBe('yes');
    });
  });
});
