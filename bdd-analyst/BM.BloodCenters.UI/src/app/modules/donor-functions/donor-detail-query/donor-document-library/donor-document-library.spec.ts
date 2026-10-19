import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { of, Subject, throwError } from 'rxjs';

import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SnackbarService } from '@shared/services/snackbar.service';

import { DonorDocumentLibraryComponent } from './donor-document-library';
import { DonorDocumentLibraryService } from './services/donor-document-library.service';
import { DonorDocumentDisplay, LinkedValueRow } from './models/donor-document-library.model';

describe('DonorDocumentLibraryComponent', () => {
  let component: DonorDocumentLibraryComponent;
  let fixture: ComponentFixture<DonorDocumentLibraryComponent>;
  let mockApiService: jasmine.SpyObj<DonorDocumentLibraryService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockTranslate: jasmine.SpyObj<TranslateService>;
  let queryParamsSubject: Subject<any>;
  let chapterChangedSubject: Subject<any>;

  const mockDocumentDto = {
    sessionId: 'session-1',
    docName: 'test-doc.pdf',
    docType: 'PDF',
    docId: 'DOC-001',
    docLinkedTable: 'DONORS',
    docLinkedColumn: 'DONOR_ID',
    docLinkedDesc: 'Link with Donor',
    linkedValues: ['12345', '67890'],
  };

  const mockDocumentDisplay: DonorDocumentDisplay = {
    sessionId: 'session-1',
    docName: 'test-doc.pdf',
    docType: 'PDF',
    docId: 'DOC-001',
    docLinkedTable: 'DONORS',
    docLinkedColumn: 'DONOR_ID',
    docLinkedDesc: 'Link with Donor',
    linkedValues: ['12345', '67890'],
  };

  const mockDocumentDisplay2: DonorDocumentDisplay = {
    sessionId: 'session-2',
    docName: 'another-doc.docx',
    docType: 'DOCX',
    docId: 'DOC-002',
    docLinkedTable: 'DONORS',
    docLinkedColumn: 'DONOR_ID',
    docLinkedDesc: 'Link with Donor',
    linkedValues: ['11111'],
  };

  beforeEach(async () => {
    queryParamsSubject = new Subject<any>();
    chapterChangedSubject = new Subject<any>();

    mockApiService = jasmine.createSpyObj('DonorDocumentLibraryService', [
      'searchDocuments',
      'downloadDocument',
      'deleteDocument',
      'getLinkCategories',
      'getColumnCodes',
      'uploadDocument',
      'linkValues',
      'validateValue',
    ]);
    mockApiService.getLinkCategories.and.returnValue(of([]));
    mockApiService.getColumnCodes.and.returnValue(of([]));

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockHeaderService = jasmine.createSpyObj('HeaderService', ['getCurrentChapterId'], {
      chapterChanged$: chapterChangedSubject.asObservable(),
    });
    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate',
    ]);
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(null);
    mockSnackbarService = jasmine.createSpyObj('SnackbarService', [
      'showSuccess',
      'showError',
      'showInfo',
    ]);
    mockTranslate = jasmine.createSpyObj('TranslateService', ['instant', 'get']);
    mockTranslate.instant.and.returnValue('');
    mockTranslate.get.and.returnValue(of(''));

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: DonorDocumentLibraryService, useValue: mockApiService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: queryParamsSubject.asObservable() },
        },
        { provide: MatDialog, useValue: mockDialog },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: TranslateService, useValue: mockTranslate },
      ],
    })
      .overrideComponent(DonorDocumentLibraryComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(DonorDocumentLibraryComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default signal values', () => {
      expect(component.documents()).toEqual([]);
      expect(component.selectedDocument()).toBeNull();
      expect(component.linkedValues()).toEqual([]);
      expect(component.selectedLinkedValues()).toEqual([]);
      expect(component.loading()).toBeFalse();
      expect(component.downloading()).toBeFalse();
      expect(component.deleting()).toBeFalse();
      expect(component.hasRetrieved()).toBeFalse();
    });

    it('should have a filter form with default controls', () => {
      expect(component.filterForm).toBeTruthy();
      expect(component.filterForm.get('table')).toBeTruthy();
      expect(component.filterForm.get('column')).toBeTruthy();
      expect(component.filterForm.get('value')).toBeTruthy();
      expect(component.filterForm.get('docId')).toBeTruthy();
      expect(component.filterForm.get('fromDate')).toBeTruthy();
      expect(component.filterForm.get('toDate')).toBeTruthy();
    });

    it('should have a pageHeaderConfig with breadcrumbs and actions', () => {
      expect(component.pageHeaderConfig).toBeTruthy();
      expect(component.pageHeaderConfig.breadcrumbs?.length).toBeGreaterThanOrEqual(3);
      expect(component.pageHeaderConfig.title).toBe('Document Library');
      expect(component.pageHeaderConfig.actions?.length).toBe(1);
    });

    it('should have a linkedValuesTableConfig with columns and checkbox first', () => {
      expect(component.linkedValuesTableConfig).toBeTruthy();
      expect(component.linkedValuesTableConfig.columns.length).toBe(4);
      expect(component.linkedValuesTableConfig.enableSelection).toBeTrue();
      expect(component.linkedValuesTableConfig.selectionPosition).toBe('first');
    });
  });

  describe('ngOnInit', () => {
    it('should load filter options on init', () => {
      fixture.detectChanges();
      expect(mockApiService.getLinkCategories).toHaveBeenCalled();
      expect(mockApiService.getColumnCodes).toHaveBeenCalled();
    });

    it('should set donorId and donorName from query params and retrieve documents', () => {
      mockApiService.searchDocuments.and.returnValue(
        of({ documents: [], total: 0 }),
      );
      fixture.detectChanges();

      queryParamsSubject.next({ donorId: 'D-123', donorName: 'John Doe' });

      expect(component.donorId()).toBe('D-123');
      expect(component.donorName()).toBe('John Doe');
      expect(mockApiService.searchDocuments).toHaveBeenCalled();
    });

    it('should not retrieve documents when donorId is absent', () => {
      fixture.detectChanges();
      queryParamsSubject.next({});

      expect(mockApiService.searchDocuments).not.toHaveBeenCalled();
    });

    it('should reset state when chapter changes', () => {
      mockApiService.searchDocuments.and.returnValue(
        of({ documents: [mockDocumentDto], total: 1 }),
      );
      fixture.detectChanges();
      queryParamsSubject.next({ donorId: 'D-123' });

      expect(component.documents().length).toBe(1);

      chapterChangedSubject.next(null);

      expect(component.documents()).toEqual([]);
      expect(component.selectedDocument()).toBeNull();
      expect(component.hasRetrieved()).toBeFalse();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('loadFilterOptions', () => {
    it('should populate tableOptions and columnOptions on success', () => {
      const categories = [
        { linkTable: 'DONORS', linkWith: 'Donors' },
        { linkTable: 'PRODUCTS', linkWith: 'Products' },
      ];
      const columns = ['DONOR_ID', 'STATUS'];

      mockApiService.getLinkCategories.and.returnValue(of(categories));
      mockApiService.getColumnCodes.and.returnValue(of(columns));

      fixture.detectChanges();

      expect(component.tableOptions.length).toBe(2);
      expect(component.tableOptions).toContain('DONORS');
      expect(component.tableOptions).toContain('PRODUCTS');
      expect(component.columnOptions).toEqual(['DONOR_ID', 'STATUS']);
      expect(component.isLoadingFilters).toBeFalse();
    });

    it('should set isLoadingFilters to false on error', () => {
      mockApiService.getLinkCategories.and.returnValue(throwError(() => new Error('fail')));
      mockApiService.getColumnCodes.and.returnValue(of([]));

      fixture.detectChanges();

      expect(component.isLoadingFilters).toBeFalse();
    });
  });

  describe('retrieveDocuments', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not proceed when filter form is invalid', () => {
      component.filterForm.get('value')!.setValue('x'.repeat(31));
      component.filterForm.get('value')!.markAsTouched();
      component.filterForm.updateValueAndValidity();

      component.retrieveDocuments();

      expect(mockApiService.searchDocuments).not.toHaveBeenCalled();
    });

    it('should set loading to true and hasRetrieved to true during retrieval', () => {
      const docs$ = new Subject<any>();
      mockApiService.searchDocuments.and.returnValue(docs$.asObservable());

      component.filterForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-03-01'),
      });

      component.retrieveDocuments();

      expect(component.loading()).toBeTrue();
      expect(component.hasRetrieved()).toBeTrue();

      docs$.next({ documents: [], total: 0 });
      expect(component.loading()).toBeFalse();
    });

    it('should map documents and select the first one on success', () => {
      mockApiService.searchDocuments.and.returnValue(
        of({ documents: [mockDocumentDto], total: 1 }),
      );

      component.filterForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-03-01'),
      });

      component.retrieveDocuments();

      expect(component.documents().length).toBe(1);
      expect(component.documents()[0].sessionId).toBe('session-1');
      expect(component.selectedDocument()?.sessionId).toBe('session-1');
    });

    it('should clear selection when no documents are returned', () => {
      mockApiService.searchDocuments.and.returnValue(
        of({ documents: [], total: 0 }),
      );

      component.filterForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-03-01'),
      });

      component.retrieveDocuments();

      expect(component.documents()).toEqual([]);
      expect(component.selectedDocument()).toBeNull();
      expect(component.linkedValues()).toEqual([]);
    });

    it('should show error snackbar on retrieval failure', () => {
      mockApiService.searchDocuments.and.returnValue(
        throwError(() => new Error('Server error')),
      );

      component.filterForm.patchValue({
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-03-01'),
      });

      component.retrieveDocuments();

      expect(component.loading()).toBeFalse();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Failed to retrieve documents',
      );
    });

    it('should include all filter values in the API call with YYYY-MM-DD dates', () => {
      mockApiService.searchDocuments.and.returnValue(
        of({ documents: [], total: 0 }),
      );

      component.filterForm.patchValue({
        table: 'DONORS',
        column: 'DONOR_ID',
        value: 'val-1',
        docId: 'DOC-999',
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-03-01'),
      });

      component.retrieveDocuments();

      const calledFilters = mockApiService.searchDocuments.calls.mostRecent().args[0];
      expect(calledFilters.docLinkedTable).toBe('DONORS');
      expect(calledFilters.docLinkedColumn).toBe('DONOR_ID');
      expect(calledFilters.docLinkedValue).toBe('val-1');
      expect(calledFilters.docId).toBe('DOC-999');
      expect(calledFilters.fromDate).toBe('2024-01-01');
      expect(calledFilters.toDate).toBe('2024-03-01');
    });

    it('should not send empty table/column/value filters when fields are blank', () => {
      mockApiService.searchDocuments.and.returnValue(
        of({ documents: [], total: 0 }),
      );
      component.donorId.set('DN-555');

      component.filterForm.patchValue({
        table: '',
        column: '',
        value: '',
        docId: '',
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-03-01'),
      });

      component.retrieveDocuments();

      const calledFilters = mockApiService.searchDocuments.calls.mostRecent().args[0];
      expect(calledFilters.docLinkedTable).toBeUndefined();
      expect(calledFilters.docLinkedColumn).toBeUndefined();
      expect(calledFilters.docLinkedValue).toBeUndefined();
      expect(calledFilters.docId).toBeUndefined();
    });
  });

  describe('mapDocumentsToDisplay', () => {
    it('should deduplicate documents by sessionId', () => {
      const dtos = [
        { ...mockDocumentDto },
        { ...mockDocumentDto },
        { ...mockDocumentDto, sessionId: 'session-2', docName: 'other.docx' },
      ];
      const result = component['mapDocumentsToDisplay'](dtos);
      expect(result.length).toBe(2);
    });

    it('should derive docType from filename when not provided', () => {
      const dto = { ...mockDocumentDto, docType: undefined, docName: 'report.xlsx' };
      const result = component['mapDocumentsToDisplay']([dto]);
      expect(result[0].docType).toBe('XLSX');
    });

    it('should default docLinkedDesc and linkedValues when missing', () => {
      const dto = {
        sessionId: 's1',
        docName: 'file.pdf',
        docId: 'D1',
        docLinkedTable: 'T',
        docLinkedColumn: 'C',
      };
      const result = component['mapDocumentsToDisplay']([dto]);
      expect(result[0].docLinkedDesc).toBe('');
      expect(result[0].linkedValues).toEqual([]);
    });
  });

  describe('selectDocument', () => {
    it('should set selectedDocument and populate linkedValues', () => {
      component.selectDocument(mockDocumentDisplay);

      expect(component.selectedDocument()).toBe(mockDocumentDisplay);
      expect(component.linkedValues().length).toBe(2);
      expect(component.linkedValues()[0].linkedValue).toBe('12345');
      expect(component.linkedValues()[1].linkedValue).toBe('67890');
    });

    it('should clear selectedLinkedValues when selecting a new document', () => {
      const row: LinkedValueRow = {
        sessionId: 'session-1',
        docLinkedTable: 'DONORS',
        docLinkedColumn: 'DONOR_ID',
        linkedValue: '12345',
        docLinkedDesc: 'Link with Donor',
      };
      component.selectedLinkedValues.set([row]);

      component.selectDocument(mockDocumentDisplay);

      expect(component.selectedLinkedValues()).toEqual([]);
    });

    it('should handle document with no linkedValues', () => {
      const docNoLinks: DonorDocumentDisplay = {
        ...mockDocumentDisplay,
        linkedValues: [],
      };
      component.selectDocument(docNoLinks);
      expect(component.linkedValues()).toEqual([]);
    });

    it('should handle document with undefined linkedValues', () => {
      const docUndefinedLinks = {
        ...mockDocumentDisplay,
        linkedValues: undefined,
      } as any;
      component.selectDocument(docUndefinedLinks);
      expect(component.linkedValues()).toEqual([]);
    });
  });

  describe('onSelectionChange', () => {
    it('should update selectedLinkedValues', () => {
      const rows: LinkedValueRow[] = [
        {
          sessionId: 'session-1',
          docLinkedTable: 'DONORS',
          docLinkedColumn: 'DONOR_ID',
          linkedValue: '12345',
          docLinkedDesc: 'Link with Donor',
        },
      ];
      component.onSelectionChange(rows);
      expect(component.selectedLinkedValues()).toEqual(rows);
    });
  });

  describe('onRowAction', () => {
    it('should not call onDownloadFromRow for unknown actions', () => {
      spyOn(component, 'onDownloadFromRow');
      const row: LinkedValueRow = {
        sessionId: 'session-1',
        docLinkedTable: 'DONORS',
        docLinkedColumn: 'DONOR_ID',
        linkedValue: '12345',
        docLinkedDesc: 'Link with Donor',
      };
      component.onRowAction({ action: 'unknown', row });
      expect(component.onDownloadFromRow).not.toHaveBeenCalled();
    });
  });

  describe('download operations', () => {
    let mockBlob: Blob;

    beforeEach(() => {
      mockBlob = new Blob(['test content'], { type: 'application/pdf' });
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:http://localhost/fake');
      spyOn(window.URL, 'revokeObjectURL');
    });

    describe('onDownloadFromRow', () => {
      it('should download using sessionId from the row and docName from selectedDocument', () => {
        component.selectedDocument.set(mockDocumentDisplay);
        mockApiService.downloadDocument.and.returnValue(of(mockBlob));

        const row: LinkedValueRow = {
          sessionId: 'session-1',
          docLinkedTable: 'DONORS',
          docLinkedColumn: 'DONOR_ID',
          linkedValue: '12345',
          docLinkedDesc: 'Link with Donor',
        };

        component.onDownloadFromRow(row);

        expect(mockApiService.downloadDocument).toHaveBeenCalledWith('session-1');
        expect(component.downloading()).toBeFalse();
        expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith(
          'Downloaded: test-doc.pdf',
        );
      });

      it('should use "document" as fallback filename when no selected document', () => {
        component.selectedDocument.set(null);
        mockApiService.downloadDocument.and.returnValue(of(mockBlob));

        const row: LinkedValueRow = {
          sessionId: 'session-1',
          docLinkedTable: 'DONORS',
          docLinkedColumn: 'DONOR_ID',
          linkedValue: '12345',
          docLinkedDesc: 'Link with Donor',
        };

        component.onDownloadFromRow(row);

        expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith(
          'Downloaded: document',
        );
      });
    });

    describe('downloadDocument (private)', () => {
      it('should set downloading to true during download', () => {
        const download$ = new Subject<Blob>();
        mockApiService.downloadDocument.and.returnValue(download$.asObservable());

        component['downloadDocument']('session-1', 'test.pdf');

        expect(component.downloading()).toBeTrue();

        download$.next(mockBlob);
        expect(component.downloading()).toBeFalse();
      });

      it('should show error snackbar on download failure', () => {
        mockApiService.downloadDocument.and.returnValue(
          throwError(() => new Error('Download failed')),
        );

        component['downloadDocument']('session-1', 'test.pdf');

        expect(component.downloading()).toBeFalse();
        expect(mockSnackbarService.showError).toHaveBeenCalledWith(
          'Failed to download document',
        );
      });
    });
  });

  describe('performDelete (private)', () => {
    it('should remove the document from the list on success', () => {
      mockApiService.deleteDocument.and.returnValue(of(void 0));
      component.documents.set([mockDocumentDisplay, mockDocumentDisplay2]);
      component.selectedDocument.set(mockDocumentDisplay);

      component['performDelete'](mockDocumentDisplay);

      expect(component.documents().length).toBe(1);
      expect(component.documents()[0].sessionId).toBe('session-2');
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith(
        'Document deleted successfully',
      );
    });

    it('should select the first remaining document when the selected one is deleted', () => {
      mockApiService.deleteDocument.and.returnValue(of(void 0));
      component.documents.set([mockDocumentDisplay, mockDocumentDisplay2]);
      component.selectedDocument.set(mockDocumentDisplay);

      component['performDelete'](mockDocumentDisplay);

      expect(component.selectedDocument()?.sessionId).toBe('session-2');
    });

    it('should clear selection when the last document is deleted', () => {
      mockApiService.deleteDocument.and.returnValue(of(void 0));
      component.documents.set([mockDocumentDisplay]);
      component.selectedDocument.set(mockDocumentDisplay);

      component['performDelete'](mockDocumentDisplay);

      expect(component.selectedDocument()).toBeNull();
      expect(component.linkedValues()).toEqual([]);
    });

    it('should show error snackbar on delete failure', () => {
      mockApiService.deleteDocument.and.returnValue(
        throwError(() => new Error('Delete failed')),
      );
      component.documents.set([mockDocumentDisplay]);

      component['performDelete'](mockDocumentDisplay);

      expect(component.deleting()).toBeFalse();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Failed to delete document',
      );
    });

    it('should set deleting to true during delete', () => {
      const delete$ = new Subject<void>();
      mockApiService.deleteDocument.and.returnValue(delete$.asObservable());
      component.documents.set([mockDocumentDisplay]);
      component.selectedDocument.set(mockDocumentDisplay);

      component['performDelete'](mockDocumentDisplay);

      expect(component.deleting()).toBeTrue();

      delete$.next(void 0);
      expect(component.deleting()).toBeFalse();
    });
  });

  describe('onLinkDocumentClick', () => {
    let mockDialogRefInstance: jasmine.SpyObj<MatDialogRef<any>>;
    let afterClosedSubject: Subject<boolean>;

    beforeEach(() => {
      afterClosedSubject = new Subject<boolean>();
      mockDialogRefInstance = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockDialogRefInstance.afterClosed.and.returnValue(afterClosedSubject.asObservable());
      mockDialog.open.and.returnValue(mockDialogRefInstance);
    });

    it('should do nothing when no document is selected', () => {
      component.selectedDocument.set(null);
      component.onLinkDocumentClick();
      expect(mockDialog.open).not.toHaveBeenCalled();
    });
  });

  describe('computed signals', () => {
    it('should compute hasDocuments correctly', () => {
      expect(component.hasDocuments()).toBeFalse();
      component.documents.set([mockDocumentDisplay]);
      expect(component.hasDocuments()).toBeTrue();
    });

    it('should compute hasLinkedValues correctly', () => {
      expect(component.hasLinkedValues()).toBeFalse();
      component.linkedValues.set([
        {
          sessionId: 'session-1',
          docLinkedTable: 'DONORS',
          docLinkedColumn: 'DONOR_ID',
          linkedValue: '12345',
          docLinkedDesc: 'Link with Donor',
        },
      ]);
      expect(component.hasLinkedValues()).toBeTrue();
    });

    it('should compute hasSelectedLinkedValues correctly', () => {
      expect(component.hasSelectedLinkedValues()).toBeFalse();
      component.selectedLinkedValues.set([
        {
          sessionId: 'session-1',
          docLinkedTable: 'DONORS',
          docLinkedColumn: 'DONOR_ID',
          linkedValue: '12345',
          docLinkedDesc: 'Link with Donor',
        },
      ]);
      expect(component.hasSelectedLinkedValues()).toBeTrue();
    });

    it('should compute maxDate from ChapterTimezoneService', () => {
      const fakeDate = {
        toDate: () => new Date('2024-06-15'),
      };
      mockChapterTimezoneService.getChapterLocalDate.and.returnValue(fakeDate as any);
      const result = component.maxDate();
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(5);
    });

    it('should default maxDate to current date when chapterLocalDate is null', () => {
      mockChapterTimezoneService.getChapterLocalDate.and.returnValue(null);
      const result = component.maxDate();
      const now = new Date();
      expect(result.getFullYear()).toBe(now.getFullYear());
    });
  });

  describe('helper methods', () => {
    it('should return the uppercase extension', () => {
      expect(component.getFileExtension('file.pdf')).toBe('PDF');
      expect(component.getFileExtension('report.xlsx')).toBe('XLSX');
    });

    it('should handle null/undefined filename for getFileExtension', () => {
      expect(component.getFileExtension(null as any)).toBe('');
      expect(component.getFileExtension(undefined as any)).toBe('');
    });

    it('should return correct icons for file types', () => {
      expect(component.getFileIcon('test.pdf')).toBe('picture_as_pdf');
      expect(component.getFileIcon('test.doc')).toBe('description');
      expect(component.getFileIcon('test.xls')).toBe('table_chart');
      expect(component.getFileIcon('test.png')).toBe('image');
      expect(component.getFileIcon('test.txt')).toBe('insert_drive_file');
    });

    it('should return correct icon classes', () => {
      expect(component.getFileIconClass('pdf')).toBe('file-icon--pdf');
      expect(component.getFileIconClass('doc')).toBe('file-icon--doc');
      expect(component.getFileIconClass('xls')).toBe('file-icon--xls');
      expect(component.getFileIconClass('txt')).toBe('file-icon--default');
      expect(component.getFileIconClass(undefined)).toBe('file-icon--default');
    });

    it('should return sessionId from trackBySessionId', () => {
      expect(component.trackBySessionId(0, mockDocumentDisplay)).toBe('session-1');
    });
  });

  describe('resetState (private)', () => {
    it('should clear all state and reload filter options', () => {
      component.documents.set([mockDocumentDisplay]);
      component.selectedDocument.set(mockDocumentDisplay);
      component.hasRetrieved.set(true);

      component['resetState']();

      expect(component.documents()).toEqual([]);
      expect(component.selectedDocument()).toBeNull();
      expect(component.linkedValues()).toEqual([]);
      expect(component.selectedLinkedValues()).toEqual([]);
      expect(component.hasRetrieved()).toBeFalse();
      expect(mockApiService.getLinkCategories).toHaveBeenCalled();
      expect(mockApiService.getColumnCodes).toHaveBeenCalled();
    });
  });

  describe('setDefaultFilters (private)', () => {
    it('should set only value to donorId and leave other fields empty', () => {
      mockChapterTimezoneService.getChapterLocalDate.and.returnValue(null);
      component.donorId.set('D-999');

      component['setDefaultFilters']();

      const formValue = component.filterForm.value;
      expect(formValue.table).toBe('');
      expect(formValue.column).toBe('');
      expect(formValue.value).toBe('D-999');
      expect(formValue.fromDate).toBe('');
      expect(formValue.toDate).toBe('');
    });
  });
});
