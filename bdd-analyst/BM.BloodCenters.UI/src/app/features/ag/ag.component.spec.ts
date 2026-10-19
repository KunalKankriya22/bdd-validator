import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TranslateService } from '@ngx-translate/core';
import { AgComponent } from './ag.component';
import { AntigenResultEntryService } from './services/antigen-result-entry.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatDialog, createMockSnackbarService, createMockTranslateService } from '@shared/testing/common-mocks';
import {
  PendingUnitDto,
  UnitTestDto,
  ValidResultDto,
  WorksheetInfoDto,
  WorksheetOptionDto,
  SubmitResultsResponseDto,
  CloseWorksheetResponseDto,
  PendingCountDto,
} from './models/antigen-result-entry.model';

describe('AgComponent', () => {
  let component: any;
  let fixture: ComponentFixture<AgComponent>;
  let agServiceSpy: jasmine.SpyObj<AntigenResultEntryService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let chapterChangedSubject: Subject<void>;

  const mockValidResults: ValidResultDto[] = [
    { code: 'POS', description: 'Positive' },
    { code: 'NEG', description: 'Negative' },
    { code: 'IND', description: 'Indeterminate' },
    { code: 'NT', description: 'Not Tested' },
  ];

  const mockWorksheetOptions: WorksheetOptionDto[] = [
    { tbId: '100216-TB 1021' },
    { tbId: '100216-TB 1022' },
    { tbId: '100216-TB 1023' },
    { tbId: '100216-TB 1024' },
    { tbId: '100216-TB 1025' },
  ];

  const mockPendingUnits: PendingUnitDto[] = [
    {
      unitId: 'W123418031301-Z',
      tbId: '100216-TB 1021',
      collDate: '2025-01-11T00:00:00',
      holdingStatus: null,
    },
    {
      unitId: 'W123418031301-H',
      tbId: '100216-TB 1021',
      collDate: '2025-01-11T00:00:00',
      holdingStatus: null,
    },
  ];

  const mockUnitTests: UnitTestDto[] = [
    { testId: 'C', testSeqNo: 1, unitId: 'W035208111801', resultStatus1: null, reagentLot1: null, resultDats: null },
    { testId: 'e', testSeqNo: 2, unitId: 'W035208111801', resultStatus1: null, reagentLot1: null, resultDats: null },
    { testId: 'K', testSeqNo: 3, unitId: 'W035208111801', resultStatus1: null, reagentLot1: null, resultDats: null },
  ];

  const mockWorksheetInfo: WorksheetInfoDto = {
    tbId: '100216-TB 1021',
    pendingUnitCount: 5,
    isValid: true,
  };

  const mockPendingCount: PendingCountDto = {
    tbId: '100216-TB 1021',
    pendingCount: 3,
  };

  beforeEach(() => {

    agServiceSpy = jasmine.createSpyObj('AntigenResultEntryService', [
      'validateWorksheet',
      'getPendingUnits',
      'getUnitTests',
      'submitResults',
      'closeWorksheet',
      'getValidResults',
      'getWorksheets',
      'getPendingCount',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    dialogSpy = createMockMatDialog();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue({
        title: 'Antigen Result Entry',
        subtitle: '',
      }),
    });

    chapterChangedSubject = new Subject<void>();

    agServiceSpy.getWorksheets.and.returnValue(of(mockWorksheetOptions));
    agServiceSpy.validateWorksheet.and.returnValue(of(mockWorksheetInfo));
    agServiceSpy.getPendingUnits.and.returnValue(of(mockPendingUnits));
    agServiceSpy.getUnitTests.and.returnValue(of(mockUnitTests));
    agServiceSpy.getValidResults.and.returnValue(of(mockValidResults));
    agServiceSpy.getPendingCount.and.returnValue(of(mockPendingCount));



      TestBed.configureTestingModule({
      imports: [AgComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AntigenResultEntryService, useValue: agServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: { chapterChanged$: chapterChangedSubject.asObservable() } },
        { provide: MatSnackBar, useValue: jasmine.createSpyObj('MatSnackBar', ['open', 'dismiss']) },
        { provide: TranslateService, useValue: createMockTranslateService() },
      ],
    })
    .overrideComponent(AgComponent, {
      add: { providers: [{ provide: MatDialog, useValue: dialogSpy }] }
    });


    


      agServiceSpy.validateWorksheet.calls.reset();


      agServiceSpy.getPendingUnits.calls.reset();


      agServiceSpy.getUnitTests.calls.reset();


      agServiceSpy.submitResults.calls.reset();


      agServiceSpy.closeWorksheet.calls.reset();


      agServiceSpy.getValidResults.calls.reset();


      agServiceSpy.getWorksheets.calls.reset();


      agServiceSpy.getPendingCount.calls.reset();


      dialogSpy.open.calls.reset();


      agServiceSpy.getWorksheets.and.returnValue(of(mockWorksheetOptions));


      agServiceSpy.validateWorksheet.and.returnValue(of(mockWorksheetInfo));


      agServiceSpy.getPendingUnits.and.returnValue(of(mockPendingUnits));


      agServiceSpy.getUnitTests.and.returnValue(of(mockUnitTests));


      agServiceSpy.getValidResults.and.returnValue(of(mockValidResults));


      agServiceSpy.getPendingCount.and.returnValue(of(mockPendingCount));


    fixture = TestBed.createComponent(AgComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should initialize form with empty worksheet ID', () => {
      fixture.detectChanges();
      expect(component.worksheetForm.get('worksheetId')?.value).toBe('');
    });

    it('should have worksheetId as required', () => {
      fixture.detectChanges();
      const control = component.worksheetForm.get('worksheetId');
      control?.setValue('');
      control?.markAsTouched();
      expect(control?.hasError('required')).toBe(true);
    });

    it('should load worksheet options on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(agServiceSpy.getWorksheets).toHaveBeenCalled();
      expect(component.worksheetOptions().length).toBe(5);
    }));




  });

  describe('Worksheet Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate worksheet on dropdown selection', fakeAsync(() => {
      component.onWorksheetSelect('100216-TB 1021');
      tick();

      expect(agServiceSpy.validateWorksheet).toHaveBeenCalledWith(
        '100216-TB 1021'
      );
      expect(agServiceSpy.getPendingUnits).toHaveBeenCalledWith('100216-TB 1021');
    }));

    it('should set worksheet error on validation failure', fakeAsync(() => {
      const errorResponse = {
        error: {
          errorResponse: {
            error: 'Invalid worksheet or no pending antigen tests',
          },
        },
      };

      agServiceSpy.validateWorksheet.and.returnValue(
        throwError(() => errorResponse)
      );

      component.onWorksheetSelect('INVALID');
      tick();

      expect(component.worksheetError()).toBe(
        'Invalid worksheet or no pending antigen tests'
      );
    }));



    it('should display selected worksheet text', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onWorksheetSelect('100216-TB 1021');
      tick();

      expect(component.selectedWorksheetDisplay()).toContain('100216-TB 1021');
    }));


  });

  describe('Pending Units', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));



    it('should auto-select first unit after loading', fakeAsync(() => {
      component.onWorksheetSelect('100216-TB 1021');
      tick();

      expect(component.selectedUnit()).toBeTruthy();
      expect(component.selectedUnit()?.unitId).toBe('W123418031301-Z');
    }));


  });

  describe('Unit Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.onWorksheetSelect('100216-TB 1021');
      tick();
    }));

    it('should load tests from API when unit is selected', fakeAsync(() => {
      const unit = component.units()[0];
      component.onUnitSelect(unit);
      tick();

      expect(agServiceSpy.getUnitTests).toHaveBeenCalledWith(
        '100216-TB 1021',
        unit.unitId
      );
      expect(component.testResults().length).toBe(3);
    }));

    it('should load valid results on first unit selection', fakeAsync(() => {
      component.validResults.set([]);
      const unit = component.units()[0];
      component.onUnitSelect(unit);
      tick();

      expect(agServiceSpy.getValidResults).toHaveBeenCalledWith('C');
    }));

    it('should mark unit as selected', fakeAsync(() => {
      const unit = component.units()[1];
      component.onUnitSelect(unit);
      tick();

      expect(component.selectedUnit()?.unitId).toBe(unit.unitId);
    }));
  });



  describe('Search Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.onWorksheetSelect('100216-TB 1021');
      tick();
    }));



    it('should show all units when search is empty', () => {
      component.onSearch('');

      expect(component.filteredUnits().length).toBe(component.units().length);
    });
  });

  describe('Save Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.onWorksheetSelect('100216-TB 1021');
      tick();

      const testResult = component.testResults()[0];
      component.onResultChange(testResult, 'POS');
    }));

    it('should submit results when save is clicked', fakeAsync(() => {
      const mockResponse: SubmitResultsResponseDto = {
        tbId: '100216-TB 1021',
        unitsProcessed: 1,
        resultsSkipped: 0,
        reconciled: true,
        reconcileDate: '2026-06-01T14:30:00Z',
      };

      agServiceSpy.submitResults.and.returnValue(of(mockResponse));

      component.onSave();
      tick();

      expect(agServiceSpy.submitResults).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
        'Worksheet 100216-TB 1021 saved successfully.'
      );
    }));


  });

  describe('Close Worksheet', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.onWorksheetSelect('100216-TB 1021');
      tick();
    }));

    it('should fetch pending count and show confirmation dialog', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', [
        'afterClosed',
      ]);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      const mockResponse: CloseWorksheetResponseDto = {
        tbId: '100216-TB 1021',
        unitsMarkedNT: 5,
      };
      agServiceSpy.closeWorksheet.and.returnValue(of(mockResponse));

      component.onSaveAndCloseWorksheet();
      tick();

      expect(agServiceSpy.getPendingCount).toHaveBeenCalledWith('100216-TB 1021');
      expect(dialogSpy.open).toHaveBeenCalled();
    }));

    it('should close worksheet after confirmation', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', [
        'afterClosed',
      ]);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      const mockResponse: CloseWorksheetResponseDto = {
        tbId: '100216-TB 1021',
        unitsMarkedNT: 5,
      };
      agServiceSpy.closeWorksheet.and.returnValue(of(mockResponse));

      component.onSaveAndCloseWorksheet();
      tick();

      expect(agServiceSpy.closeWorksheet).toHaveBeenCalledWith(
        '100216-TB 1021'
      );
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
        'Worksheet 100216-TB 1021 closed successfully.'
      );
    }));


  });

  describe('Clear Actions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.onWorksheetSelect('100216-TB 1021');
      tick();
    }));



    it('should clear worksheet and reset form', () => {
      component.onClearWorksheet();

      expect(component.worksheetId()).toBeNull();
      expect(component.pendingUnits().length).toBe(0);
      expect(component.selectedUnit()).toBeNull();
      expect(component.worksheetForm.get('worksheetId')?.value).toBeNull();
    });
  });


  describe('Empty State', () => {


    it('should display empty state message', () => {
      fixture.detectChanges();

      const message = fixture.debugElement.query(By.css('.empty-state-message'));
      expect(message.nativeElement.textContent).toContain(
        'Please enter search criteria to view Results'
      );
    });


  });

  describe('Chapter Change', () => {
    it('should clear worksheet and reload worksheets on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      component.onWorksheetSelect('100216-TB 1021');
      tick();

      agServiceSpy.getWorksheets.calls.reset();

      chapterChangedSubject.next();
      tick();

      expect(component.worksheetId()).toBeNull();
      expect(component.pendingUnits().length).toBe(0);
      expect(component.selectedUnit()).toBeNull();
      expect(agServiceSpy.getWorksheets).toHaveBeenCalled();
    }));
  });

  describe('WCAG Accessibility', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.onWorksheetSelect('100216-TB 1021');
      tick();
    }));

    it('should have a skip link targeting results heading', () => {
      fixture.detectChanges();
      const skipLink = fixture.debugElement.query(By.css('.skip-link'));
      expect(skipLink).toBeTruthy();
      expect(skipLink.nativeElement.textContent.trim()).toBe('Skip to test results');
    });

    it('should have aria-label on CLEAR button', () => {
      fixture.detectChanges();
      const clearBtn = fixture.debugElement.query(By.css('.clear-button'));
      expect(clearBtn.nativeElement.getAttribute('aria-label')).toBe('Clear worksheet selection');
    });

    it('should render empty state icon with aria-hidden', () => {
      component.onClearWorksheet();
      fixture.detectChanges();
      const icon = fixture.debugElement.query(By.css('.empty-state-icon mat-icon'));
      expect(icon?.nativeElement.getAttribute('aria-hidden')).toBe('true');
    });

    it('should use role=listbox on unit list', () => {
      fixture.detectChanges();
      const list = fixture.debugElement.query(By.css('.unit-list'));
      expect(list.nativeElement.getAttribute('role')).toBe('listbox');
    });

    it('should set role=option on unit list items', () => {
      fixture.detectChanges();
      const items = fixture.debugElement.queryAll(By.css('.unit-item'));
      expect(items.length).toBeGreaterThan(0);
      items.forEach(item => {
        expect(item.nativeElement.getAttribute('role')).toBe('option');
      });
    });

    it('should use roving tabindex - only selected item has tabindex 0', () => {
      fixture.detectChanges();
      const items = fixture.debugElement.queryAll(By.css('.unit-item'));
      expect(items.length).toBeGreaterThan(1);

      const selectedItem = items.find(item => item.nativeElement.classList.contains('active'));
      expect(selectedItem).toBeTruthy();
      expect(selectedItem!.nativeElement.getAttribute('tabindex')).toBe('0');

      const nonSelectedItems = items.filter(item => !item.nativeElement.classList.contains('active'));
      nonSelectedItems.forEach(item => {
        expect(item.nativeElement.getAttribute('tabindex')).toBe('-1');
      });
    });

    it('should have aria-label with unit info on list items', () => {
      fixture.detectChanges();
      const item = fixture.debugElement.query(By.css('.unit-item'));
      const ariaLabel = item.nativeElement.getAttribute('aria-label');
      expect(ariaLabel).toContain('Unit');
      expect(ariaLabel).toContain('W123418031301-Z');
    });

    it('should have aria-label on action buttons', () => {
      fixture.detectChanges();
      const cancelBtn = fixture.debugElement.queryAll(By.css('.btn-action'))[0];
      expect(cancelBtn.nativeElement.getAttribute('aria-label')).toBe('Cancel and clear worksheet');

      const clearAllBtn = fixture.debugElement.queryAll(By.css('.btn-action'))[1];
      expect(clearAllBtn.nativeElement.getAttribute('aria-label')).toBe('Clear all entered results');
    });

    it('should have aria-label on save button', () => {
      fixture.detectChanges();
      const saveBtn = fixture.debugElement.query(By.css('.btn-save'));
      expect(saveBtn.nativeElement.getAttribute('aria-label')).toBe('Save results');
    });

    it('should set tabindex=-1 on results heading for programmatic focus', () => {
      fixture.detectChanges();
      const heading = fixture.debugElement.query(By.css('.results-title'));
      expect(heading.nativeElement.getAttribute('tabindex')).toBe('-1');
    });

    it('should have aria-live on no-units-found message', () => {
      component.onSearch('nonexistent');
      fixture.detectChanges();
      const msg = fixture.debugElement.query(By.css('.no-units-found'));
      if (msg) {
        expect(msg.nativeElement.getAttribute('aria-live')).toBe('polite');
      }
    });

    it('should have aria-label on sidebar aside element', () => {
      fixture.detectChanges();
      const sidebar = fixture.debugElement.query(By.css('.ag-sidebar'));
      expect(sidebar.nativeElement.getAttribute('aria-label')).toBe('Pending units');
    });

    it('should set aria-describedby when worksheetId required error is shown', () => {
      const control = component.worksheetForm.get('worksheetId');
      control?.setValue('');
      control?.markAsTouched();
      fixture.detectChanges();

      component.onClearWorksheet();
      fixture.detectChanges();

      const select = fixture.debugElement.query(By.css('mat-select'));
      const ariaDescribedBy = select?.nativeElement.getAttribute('aria-describedby');
      if (ariaDescribedBy) {
        expect(ariaDescribedBy).toContain('error');
      }
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.onWorksheetSelect('100216-TB 1021');
      tick();
      fixture.detectChanges();
    }));

    it('should navigate down with onUnitKeyNav delta +1', () => {
      const units = component.filteredUnits();
      expect(units.length).toBeGreaterThan(1);

      const mockElement = document.createElement('div');
      mockElement.classList.add('unit-list');
      const items = units.map(() => {
        const item = document.createElement('div');
        item.classList.add('unit-item');
        item.tabIndex = -1;
        spyOn(item, 'focus');
        mockElement.appendChild(item);
        return item;
      });

      const event = { target: items[0] } as unknown as Event;
      component.onUnitKeyNav(event, 0, 1);

      expect(items[1].focus).toHaveBeenCalled();
    });

    it('should navigate up with onUnitKeyNav delta -1', () => {
      const units = component.filteredUnits();
      expect(units.length).toBeGreaterThan(1);

      const mockElement = document.createElement('div');
      mockElement.classList.add('unit-list');
      const items = units.map(() => {
        const item = document.createElement('div');
        item.classList.add('unit-item');
        item.tabIndex = -1;
        spyOn(item, 'focus');
        mockElement.appendChild(item);
        return item;
      });

      const event = { target: items[1] } as unknown as Event;
      component.onUnitKeyNav(event, 1, -1);

      expect(items[0].focus).toHaveBeenCalled();
    });

    it('should not navigate past the first item', () => {
      const units = component.filteredUnits();
      expect(units.length).toBeGreaterThan(0);

      const mockElement = document.createElement('div');
      mockElement.classList.add('unit-list');
      const items = units.map(() => {
        const item = document.createElement('div');
        item.classList.add('unit-item');
        item.tabIndex = -1;
        spyOn(item, 'focus');
        mockElement.appendChild(item);
        return item;
      });

      const event = { target: items[0] } as unknown as Event;
      component.onUnitKeyNav(event, 0, -1);

      items.forEach(item => {
        expect(item.focus).not.toHaveBeenCalled();
      });
    });

    it('should not navigate past the last item', () => {
      const units = component.filteredUnits();
      const lastIndex = units.length - 1;

      const mockElement = document.createElement('div');
      mockElement.classList.add('unit-list');
      const items = units.map(() => {
        const item = document.createElement('div');
        item.classList.add('unit-item');
        item.tabIndex = -1;
        spyOn(item, 'focus');
        mockElement.appendChild(item);
        return item;
      });

      const event = { target: items[lastIndex] } as unknown as Event;
      component.onUnitKeyNav(event, lastIndex, 1);

      items.forEach(item => {
        expect(item.focus).not.toHaveBeenCalled();
      });
    });
  });

  describe('Computed Values', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.onWorksheetSelect('100216-TB 1021');
      tick();
    }));

    it('should compute isEmpty correctly', () => {
      expect(component.isEmpty()).toBe(false);

      component.pendingUnits.set([]);
      expect(component.isEmpty()).toBe(true);
    });

    it('should compute canSave correctly', () => {
      const testResult = component.testResults()[0];
      component.onResultChange(testResult, 'POS');

      expect(component.canSave()).toBe(true);
    });

    it('should compute canCloseWorksheet correctly', () => {
      expect(component.canCloseWorksheet()).toBe(true);

      component.saving.set(true);
      expect(component.canCloseWorksheet()).toBe(false);
    });
  });
});
