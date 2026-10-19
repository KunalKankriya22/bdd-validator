import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { MatDialog } from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { of, throwError } from 'rxjs';

import { DeleteSddWorksheetUnitsComponent } from './delete-sdd-worksheet-units';
import { SddWorksheetUnitsApiService } from './services/sdd-worksheet-units-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { SddWorksheetLookupDto, SddWorksheetUnitDto } from './models/sdd-worksheet-units.model';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';
import { provideRouter } from '@angular/router';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('DeleteSddWorksheetUnitsComponent', () => {
  let component: DeleteSddWorksheetUnitsComponent;
  let fixture: ComponentFixture<DeleteSddWorksheetUnitsComponent>;
  let apiServiceSpy: jasmine.SpyObj<SddWorksheetUnitsApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockWorksheets: SddWorksheetLookupDto[] = [
    { sdcWsNumber: 'WS12345', unitCount: '5 Units' },
    { sdcWsNumber: 'WS67890', unitCount: '3 Units' }
  ];

  const mockUnits: SddWorksheetUnitDto[] = [
    { unitId: 'ABC1234567890', collDate: '15-Jan-2024', chkDigit: '12', sdcWsNumber: 'WS12345' },
    { unitId: 'DEF1234567890', collDate: '16-Jan-2024', chkDigit: '34', sdcWsNumber: 'WS12345' },
    { unitId: 'GHI1234567890', collDate: '17-Jan-2024', chkDigit: '56', sdcWsNumber: 'WS12345' }
  ];

  function selectWorksheet(worksheetId: string): void {
    component.onWorksheetSelected({ option: { value: worksheetId } } as MatAutocompleteSelectedEvent);
  }

  function openDialogWith(confirmed: boolean): jasmine.Spy {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(confirmed));
    const dialog = (component as any).dialog as MatDialog;
    return spyOn(dialog, 'open').and.returnValue(dialogRefSpy);
  }

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('SddWorksheetUnitsApiService', [
      'getWorksheets',
      'getUnits',
      'deleteUnits'
    ]);
    snackbarServiceSpy = createMockSnackbarService();

    apiServiceSpy.getWorksheets.and.returnValue(of(mockWorksheets));
    apiServiceSpy.getUnits.and.returnValue(of({ items: mockUnits, totalCount: 3 }));
    apiServiceSpy.deleteUnits.and.returnValue(
      of({ deletedCount: 2, worksheetId: 'WS12345' })
    );



      TestBed.configureTestingModule({
      imports: [DeleteSddWorksheetUnitsComponent,
        NoopAnimationsModule,
        HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: SddWorksheetUnitsApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy }
      ]
    });


    


      apiServiceSpy.getWorksheets.calls.reset();


      apiServiceSpy.getUnits.calls.reset();


      apiServiceSpy.deleteUnits.calls.reset();


      apiServiceSpy.getWorksheets.and.returnValue(of(mockWorksheets));


      apiServiceSpy.getUnits.and.returnValue(of({ items: mockUnits, totalCount: 3 }));


    fixture = TestBed.createComponent(DeleteSddWorksheetUnitsComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should initialize worksheetIdControl with empty value', () => {
      fixture.detectChanges();
      expect(component.worksheetIdControl).toBeTruthy();
      expect(component.worksheetIdControl.value).toBe('');
    });

    it('should load worksheets on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getWorksheets).toHaveBeenCalled();
      expect(component.allWorksheets).toEqual(mockWorksheets);
    }));

    it('should populate filteredWorksheets on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.filteredWorksheets).toEqual(mockWorksheets);
    }));
  });
  describe('Error Handling', () => {


    it('should display error container with error message', () => {
      fixture.detectChanges();
      (component as any).error.set('Test error message');
      fixture.detectChanges();

      const errorContainer = fixture.nativeElement.querySelector('div[role="alert"]');
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.textContent).toContain('Test error message');
    });

    it('should have retry button in error state', () => {
      fixture.detectChanges();
      (component as any).error.set('Test error');
      fixture.detectChanges();

      const retryButton = fixture.nativeElement.querySelector('div[role="alert"] button');
      expect(retryButton).toBeTruthy();
      expect(retryButton.textContent.trim()).toBe('Retry');
    });
  });

  describe('Worksheet Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call getUnits when worksheet is selected', fakeAsync(() => {
      selectWorksheet('WS12345');
      tick();

      expect(apiServiceSpy.getUnits).toHaveBeenCalledWith('WS12345', 25, 0, 'asc');
    }));

    it('should populate units after worksheet selected', fakeAsync(() => {
      selectWorksheet('WS12345');
      tick();

      expect((component as any).units()).toEqual(mockUnits);
    }));



    it('should reset page index when changing worksheet', fakeAsync(() => {
      (component as any).pageIndex.set(2);
      selectWorksheet('WS12345');
      tick();

      expect((component as any).pageIndex()).toBe(0);
    }));

    it('should set selectedWorksheet signal', () => {
      selectWorksheet('WS12345');
      expect((component as any).selectedWorksheet()).toBe('WS12345');
    });


  });

  describe('Selection Model', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectWorksheet('WS12345');
      tick();
    }));



    it('should deselect individual unit on second toggle', () => {
      component.toggleRow(mockUnits[0]);
      component.toggleRow(mockUnits[0]);

      expect(component.selection.isSelected(mockUnits[0])).toBe(false);
    });

    it('should toggle all rows', () => {
      component.toggleAllRows();
      expect(component.selection.selected.length).toBeGreaterThan(0);

      component.toggleAllRows();
      expect(component.selection.selected.length).toBe(0);
    });

    it('isAllSelected should return true when all rows are selected', () => {
      mockUnits.forEach((unit) => component.selection.select(unit));
      expect(component.isAllSelected()).toBe(true);
    });

    it('isIndeterminate should return true when some but not all rows are selected', () => {
      component.selection.select(mockUnits[0]);
      expect(component.isIndeterminate()).toBe(true);
    });

    it('isAllSelected should return false when selection is empty', () => {
      expect(component.isAllSelected()).toBe(false);
    });
  });

  describe('Pagination', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectWorksheet('WS12345');
      tick();
    }));



    it('should call getUnits with new pagination params on page change', () => {
      const event = { pageSize: 25, pageIndex: 1, length: 100 };
      apiServiceSpy.getUnits.calls.reset();
      component.onPageChange(event);

      expect(apiServiceSpy.getUnits).toHaveBeenCalledWith('WS12345', 25, 25, 'asc');
    });



    it('default page size should be 25', () => {
      expect((component as any).pageSize()).toBe(25);
    });


  });

  describe('Sort Toggle', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectWorksheet('WS12345');
      tick();
      // advance to page 2 so we can verify reset
      component.onPageChange({ pageSize: 25, pageIndex: 1, length: 100 });
      apiServiceSpy.getUnits.calls.reset();
    }));

    it('should reset pageIndex to 0 when sort is toggled', () => {
      component.toggleUnitIdSort();
      expect((component as any).pageIndex()).toBe(0);
    });

    it('should fetch page 1 (skip=0) when sort is toggled from any page', () => {
      component.toggleUnitIdSort();
      expect(apiServiceSpy.getUnits).toHaveBeenCalledWith('WS12345', 25, 0, 'desc');
    });




  });



  describe('Delete Units', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectWorksheet('WS12345');
      tick();
    }));

    it('should call API with correct request payload', fakeAsync(() => {
      component.toggleRow(mockUnits[0]);
      component.toggleRow(mockUnits[1]);

      openDialogWith(true);
      component.openDeleteConfirmation();
      tick();

      expect(apiServiceSpy.deleteUnits).toHaveBeenCalledWith({
        sdcWsNumber: 'WS12345',
        unitIds: ['ABC1234567890', 'DEF1234567890']
      });
    }));





    it('should reload units after successful deletion', fakeAsync(() => {
      component.toggleRow(mockUnits[0]);

      openDialogWith(true);
      apiServiceSpy.getUnits.calls.reset();
      component.openDeleteConfirmation();
      tick();

      expect(apiServiceSpy.getUnits).toHaveBeenCalledWith('WS12345', 25, 0, 'asc');
    }));





    it('should set deleting to false after deletion completes', fakeAsync(() => {
      component.toggleRow(mockUnits[0]);

      openDialogWith(true);
      component.openDeleteConfirmation();
      tick();

      expect((component as any).deleting()).toBe(false);
    }));
  });

  describe('Date Formatting', () => {
    it('should format date to uppercase', () => {
      const formatted = component.formatDate('15-Jan-2024');
      expect(formatted).toBe('15-JAN-2024');
    });


  });

  describe('Computed Properties', () => {
    it('hasUnits should return true when units exist', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectWorksheet('WS12345');
      tick();

      expect((component as any).hasUnits()).toBe(true);
    }));

    it('hasUnits should return false when no units', () => {
      (component as any).units.set([]);
      expect((component as any).hasUnits()).toBe(false);
    });
  });

  describe('Component Lifecycle', () => {
    it('should call destroy$ on component destroy', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
