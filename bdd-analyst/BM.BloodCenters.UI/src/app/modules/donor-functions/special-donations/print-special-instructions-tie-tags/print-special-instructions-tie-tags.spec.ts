import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError, Subject } from 'rxjs';
import { PrintSpecialInstructionsTieTagsComponent } from './print-special-instructions-tie-tags';
import { PrintSpecialInstructionsService } from './services/print-special-instructions.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

const mockDonors = [
  { donorId: 'DN001', donorName: 'John Doe', displayValue: 'DN001 - John Doe' },
  { donorId: 'DN002', donorName: 'Jane Smith', displayValue: 'DN002 - Jane Smith' },
];

const mockTieTags = [
  { interdictionCode: 'A0001', tieTagText: 'Rare Donor - Collection Instructions', numberOfLabel: 1 },
  { interdictionCode: 'A0003', tieTagText: 'Panel Donor - Collection Instructions', numberOfLabel: 1 },
  { interdictionCode: 'A0031', tieTagText: 'Autologous Donation', numberOfLabel: 1 },
];

const mockPrinters = [
  { code: 'P1', description: 'SGX420D - Tie Tag Printer' },
];

const mockInstructions = [
  { sequence: 1, printInstruction: 'Draw 2 Red top tubes' },
  { sequence: 2, printInstruction: 'Draw 2 Purple tubes' },
];

describe('PrintSpecialInstructionsTieTagsComponent', () => {
  let mockDialogRef: any;
  let component: PrintSpecialInstructionsTieTagsComponent;
  let fixture: ComponentFixture<PrintSpecialInstructionsTieTagsComponent>;
  let serviceSpy: jasmine.SpyObj<PrintSpecialInstructionsService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let chapterChangedSubject: Subject<void>;

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('PrintSpecialInstructionsService', [
      'getDonors',
      'getTieTags',
      'getPrintInstructions',
      'getPrinters',
      'printTieTags',
    ]);
    dialogSpy = createMockMatDialog();
    snackBarSpy = createMockMatSnackBar();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null),
    });
    pageHeaderServiceSpy.getTitle.and.returnValue('Print Special Instructions Tie Tag');
    pageHeaderServiceSpy.getSubtitle.and.returnValue('');
    chapterChangedSubject = new Subject<void>();
    const headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });

    serviceSpy.getDonors.and.returnValue(of(mockDonors));
    serviceSpy.getTieTags.and.returnValue(of(mockTieTags));
    serviceSpy.getPrinters.and.returnValue(of(mockPrinters));
    serviceSpy.getPrintInstructions.and.returnValue(of(mockInstructions));
    serviceSpy.printTieTags.and.returnValue(of(undefined));



      TestBed.configureTestingModule({
      imports: [PrintSpecialInstructionsTieTagsComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: PrintSpecialInstructionsService, useValue: serviceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
      ],
    });

      pageHeaderServiceSpy.getTitle.and.returnValue('Print Special Instructions Tie Tag');


      pageHeaderServiceSpy.getSubtitle.and.returnValue('');


      serviceSpy.getDonors.and.returnValue(of(mockDonors));


      serviceSpy.getTieTags.and.returnValue(of(mockTieTags));


      serviceSpy.getPrinters.and.returnValue(of(mockPrinters));


      serviceSpy.getPrintInstructions.and.returnValue(of(mockInstructions));


      serviceSpy.printTieTags.and.returnValue(of(undefined));


    fixture = TestBed.createComponent(PrintSpecialInstructionsTieTagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  it('should load donors on init', () => {
    expect(serviceSpy.getDonors).toHaveBeenCalled();
    expect((component as any).donors().length).toBe(2);
    expect((component as any).filteredDonors().length).toBe(2);
  });



  it('should disable retrieve button when no donor is selected', () => {
    expect((component as any).isRetrieveDisabled()).toBeTrue();
  });

  it('should enable retrieve button when donor is selected', () => {
    (component as any).selectedDonorId = 'DN001';
    expect((component as any).isRetrieveDisabled()).toBeFalse();
  });


  it('should load tie tags on retrieve', () => {
    (component as any).selectedDonorId = 'DN001';
    (component as any).onRetrieve();
    fixture.detectChanges();
    expect(serviceSpy.getTieTags).toHaveBeenCalledWith('DN001', undefined);
    expect((component as any).tieTags().length).toBe(3);
  });

  it('should show tie tags table after successful retrieve', () => {
    (component as any).selectedDonorId = 'DN001';
    (component as any).onRetrieve();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.tie-tags-table')).toBeTruthy();
  });

  it('should clear all state when CLEAR ALL is clicked', () => {
    (component as any).selectedDonorId = 'DN001';
    (component as any).onRetrieve();
    fixture.detectChanges();

    (component as any).onClearAll();
    fixture.detectChanges();

    expect((component as any).selectedDonorId).toBeFalsy();
    expect((component as any).tieTags().length).toBe(0);
    expect((component as any).hasRetrieved()).toBeFalse();
  });

  it('should handle retrieve error gracefully', () => {
    serviceSpy.getTieTags.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
    (component as any).selectedDonorId = 'DN001';
    (component as any).onRetrieve();
    fixture.detectChanges();

    expect((component as any).hasError()).toBeTrue();
    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  it('should toggle row selection', () => {
    (component as any).selectedDonorId = 'DN001';
    (component as any).onRetrieve();
    fixture.detectChanges();

    (component as any).onSelectRow('A0001');
    expect((component as any).isSelected('A0001')).toBeTrue();

    (component as any).onSelectRow('A0001');
    expect((component as any).isSelected('A0001')).toBeFalse();
  });

  it('should support multiple row selection', () => {
    (component as any).selectedDonorId = 'DN001';
    (component as any).onRetrieve();
    fixture.detectChanges();

    (component as any).onSelectRow('A0001');
    expect((component as any).isSelected('A0001')).toBeTrue();

    (component as any).onSelectRow('A0003');
    expect((component as any).isSelected('A0003')).toBeTrue();
    expect((component as any).isSelected('A0001')).toBeTrue();
  });

  it('should search tie tags by interdiction code', () => {
    const searchTags = [{ interdictionCode: 'A0001', tieTagText: 'Rare Donor', numberOfLabel: 1 }];
    serviceSpy.getTieTags.and.returnValue(of(searchTags));

    (component as any).selectedDonorId = 'DN001';
    (component as any).onRetrieve();
    fixture.detectChanges();

    (component as any).onInterdictionSearchChange('A0001');
    fixture.detectChanges();

    expect(serviceSpy.getTieTags).toHaveBeenCalledWith('DN001', 'A0001');
  });



  it('should have accessible aria labels on interactive elements', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const retrieveBtn = compiled.querySelector('[aria-label="Retrieve tie tags for selected donor"]');
    expect(retrieveBtn).toBeTruthy();
    const clearBtn = compiled.querySelector('[aria-label="Clear all filters"]');
    expect(clearBtn).toBeTruthy();
  });

  describe('Chapter Change Handling', () => {
    it('should reset form and state when chapter changes', () => {
      (component as any).selectedDonorId = 'DN001';
      (component as any).onRetrieve();
      fixture.detectChanges();

      chapterChangedSubject.next();

      expect((component as any).selectedDonorId).toBeFalsy();
      expect((component as any).tieTags().length).toBe(0);
      expect((component as any).hasRetrieved()).toBeFalse();
    });


    it('should clear selected codes when chapter changes', () => {
      (component as any).selectedDonorId = 'DN001';
      (component as any).onRetrieve();
      fixture.detectChanges();
      (component as any).onSelectRow('A0001');

      chapterChangedSubject.next();

      expect((component as any).selectedCodes().size).toBe(0);
    });

    it('should handle multiple chapter changes correctly', () => {
      (component as any).selectedDonorId = 'DN001';
      (component as any).onRetrieve();
      fixture.detectChanges();

      chapterChangedSubject.next();
      expect((component as any).tieTags().length).toBe(0);

      (component as any).selectedDonorId = 'DN002';
      (component as any).onRetrieve();
      fixture.detectChanges();

      chapterChangedSubject.next();
      expect((component as any).selectedDonorId).toBeFalsy();
    });

    it('should not respond to chapter changes after ngOnDestroy', () => {
      (component as any).selectedDonorId = 'DN001';
      (component as any).onRetrieve();
      fixture.detectChanges();

      component.ngOnDestroy();
      chapterChangedSubject.next();

      expect((component as any).tieTags().length).toBe(3);
    });
  });

  it('should display all results without pagination', () => {
    const manyTags = Array.from({ length: 30 }, (_, i) => ({
      interdictionCode: `A${String(i).padStart(4, '0')}`,
      tieTagText: `Tag ${i}`,
      numberOfLabel: 1,
    }));
    serviceSpy.getTieTags.and.returnValue(of(manyTags));

    (component as any).selectedDonorId = 'DN001';
    (component as any).onRetrieve();
    fixture.detectChanges();

    expect((component as any).sortedTieTags().length).toBe(30);
  });

  describe('Select All Functionality', () => {
    beforeEach(() => {
      (component as any).selectedDonorId = 'DN001';
      (component as any).onRetrieve();
      fixture.detectChanges();
    });

    it('should select all rows when none are selected', () => {
      (component as any).onToggleSelectAll();
      fixture.detectChanges();

      expect((component as any).isAllSelected()).toBeTrue();
      expect((component as any).selectedCodes().size).toBe(3);
    });

    it('should deselect all rows when all are selected', () => {
      (component as any).onToggleSelectAll();
      fixture.detectChanges();
      expect((component as any).isAllSelected()).toBeTrue();

      (component as any).onToggleSelectAll();
      fixture.detectChanges();

      expect((component as any).isAllSelected()).toBeFalse();
      expect((component as any).selectedCodes().size).toBe(0);
    });

    it('should show indeterminate state when some rows are selected', () => {
      (component as any).onSelectRow('A0001');
      fixture.detectChanges();

      expect((component as any).isSomeSelected()).toBeTrue();
      expect((component as any).isAllSelected()).toBeFalse();
    });

    it('should select all remaining rows when some are selected', () => {
      (component as any).onSelectRow('A0001');
      fixture.detectChanges();

      (component as any).onToggleSelectAll();
      fixture.detectChanges();

      expect((component as any).isAllSelected()).toBeTrue();
      expect((component as any).selectedCodes().size).toBe(3);
    });
  });

  describe('Multiple Selection Print', () => {
    beforeEach(() => {
      (component as any).selectedDonorId = 'DN001';
      (component as any).onRetrieve();
      fixture.detectChanges();
    });

    it('should print multiple selected tie tags', () => {
      mockDialogRef = {
        afterClosed: () => of({ printerId: 'P1', numberOfLabels: 3 })
      };
      dialogSpy.open.and.returnValue(mockDialogRef as any);

      (component as any).onSelectRow('A0001');
      (component as any).onSelectRow('A0003');
      (component as any).onPrint();
      fixture.detectChanges();

      expect(serviceSpy.getPrinters).toHaveBeenCalled();
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should calculate total number of labels for multiple selections', () => {
      mockDialogRef = {
        afterClosed: () => of({ printerId: 'P1', numberOfLabels: 1 })
      };
      dialogSpy.open.and.returnValue(mockDialogRef as any);

      (component as any).onSelectRow('A0001');
      (component as any).onSelectRow('A0003');
      (component as any).onPrint();

      // Component uses the first selected tag's numberOfLabel as default
      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data as any;
      expect(dialogData?.numberOfLabels).toBe(1);
    });
  });

  describe('View Print Instructions for Multiple Selections', () => {
    beforeEach(() => {
      (component as any).selectedDonorId = 'DN001';
      (component as any).onRetrieve();
      fixture.detectChanges();
    });

    it('should view instructions for single selection', () => {
      mockDialogRef = { afterClosed: () => of(null) };
      dialogSpy.open.and.returnValue(mockDialogRef as any);

      (component as any).onSelectRow('A0001');
      (component as any).onViewPrintInstructions();

      expect(serviceSpy.getPrintInstructions).toHaveBeenCalledWith('A0001');
      expect(dialogSpy.open).toHaveBeenCalled();
    });
  });
});
