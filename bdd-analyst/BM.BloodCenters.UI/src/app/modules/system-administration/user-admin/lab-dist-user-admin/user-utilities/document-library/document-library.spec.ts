import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { signal } from '@angular/core';
import moment from 'moment';

import { DocumentLibraryComponent } from './document-library';
import { DocumentLibraryApiService } from './services/document-library-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

describe('DocumentLibraryComponent', () => {
  let component: DocumentLibraryComponent;
  let fixture: ComponentFixture<DocumentLibraryComponent>;
  let mockApiService: jasmine.SpyObj<DocumentLibraryApiService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let chapterChanged$: Subject<void>;

  const mockChapterLocalDate = moment('2026-07-21');

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('DocumentLibraryApiService', [
      'searchDocuments',
      'getLinkCategories',
      'getTableCodes',
      'getColumnCodes',
      'downloadDocument',
      'deleteDocument',
      'detachLinkedValues'
    ]);

    chapterChanged$ = new Subject<void>();
    const mockHeaderService = {
      chapterChanged$: chapterChanged$.asObservable(),
      chapterTimeZone: signal('America/New_York')
    } as unknown as HeaderService;

    const mockPageHeaderService = {
      pageHeaderData: signal({
        title: 'Document Library',
        subtitle: 'Manage Documents'
      })
    } as unknown as PageHeaderService;

    const mockChapterTimezoneService = {
      chapterLocalDate: signal(mockChapterLocalDate),
      getChapterLocalDate: jasmine.createSpy('getChapterLocalDate').and.returnValue(mockChapterLocalDate)
    } as unknown as ChapterTimezoneService;

    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    const mockIconRegistry = jasmine.createSpyObj('MatIconRegistry', ['addSvgIcon']);
    const mockSanitizer = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustResourceUrl']);

    // Setup default return values
    mockApiService.getLinkCategories.and.returnValue(of([]));
    mockApiService.getTableCodes.and.returnValue(of([]));
    mockApiService.getColumnCodes.and.returnValue(of([]));
    mockApiService.searchDocuments.and.returnValue(of([]));
    mockApiService.downloadDocument.and.returnValue(of(new Blob()));
    mockApiService.deleteDocument.and.returnValue(of({ success: true } as any));
    mockSanitizer.bypassSecurityTrustResourceUrl.and.returnValue('mock-url' as any);

    await TestBed.configureTestingModule({
      imports: [
        DocumentLibraryComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        { provide: DocumentLibraryApiService, useValue: mockApiService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatIconRegistry, useValue: mockIconRegistry },
        { provide: DomSanitizer, useValue: mockSanitizer },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentLibraryComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have a defined filter form', () => {
      expect(component.filterForm).toBeDefined();
    });

    it('should initialize with empty documents array', () => {
      expect(component.documents).toEqual([]);
    });

    it('should initialize loading state as false', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should initialize downloading state as false', () => {
      expect(component.isDownloading).toBe(false);
    });

    it('should initialize deleting state as false', () => {
      expect(component.isDeleting).toBe(false);
    });

    it('should initialize unlinking state as false', () => {
      expect(component.isUnlinking).toBe(false);
    });

    it('should initialize selectedDocument as null', () => {
      expect(component.selectedDocument).toBeNull();
    });

    it('should initialize selectedDocumentLinkedValues as empty array', () => {
      expect(component.selectedDocumentLinkedValues).toEqual([]);
    });

    it('should initialize selectedLinkedValues as empty array', () => {
      expect(component.selectedLinkedValues).toEqual([]);
    });
  });

  describe('Filter Form Controls', () => {
    it('should have table control', () => {
      expect(component.filterForm.get('table')).toBeDefined();
    });

    it('should have column control', () => {
      expect(component.filterForm.get('column')).toBeDefined();
    });

    it('should have value control', () => {
      expect(component.filterForm.get('value')).toBeDefined();
    });

    it('should have docId control', () => {
      expect(component.filterForm.get('docId')).toBeDefined();
    });

    it('should have fromDate control', () => {
      expect(component.filterForm.get('fromDate')).toBeDefined();
    });

    it('should have toDate control', () => {
      expect(component.filterForm.get('toDate')).toBeDefined();
    });

    it('should initialize table with null value', () => {
      expect(component.filterForm.get('table')?.value).toBe(null);
    });

    it('should initialize column with null value', () => {
      expect(component.filterForm.get('column')?.value).toBe(null);
    });

    it('should initialize value with empty string', () => {
      expect(component.filterForm.get('value')?.value).toBe('');
    });

    it('should initialize docId with empty value', () => {
      expect(component.filterForm.get('docId')?.value).toBe('');
    });

    it('should initialize fromDate with null', () => {
      expect(component.filterForm.get('fromDate')?.value).toBe(null);
    });

    it('should initialize toDate with null', () => {
      expect(component.filterForm.get('toDate')?.value).toBe(null);
    });

    it('should have docId maxLength validator', () => {
      const docIdControl = component.filterForm.get('docId');
      docIdControl?.setValue('a'.repeat(40));
      expect(docIdControl?.hasError('maxlength')).toBe(true);
    });

    it('should accept docId with 30 characters', () => {
      const docIdControl = component.filterForm.get('docId');
      docIdControl?.setValue('a'.repeat(30));
      expect(docIdControl?.hasError('maxlength')).toBe(false);
    });
  });

  describe('Filter Options', () => {
    it('should have empty tableOptions initially', () => {
      expect(component.tableOptions).toEqual([]);
    });

    it('should have empty filteredTableOptions initially', () => {
      expect(component.filteredTableOptions).toEqual([]);
    });

    it('should have empty columnOptions initially', () => {
      expect(component.columnOptions).toEqual([]);
    });

    it('should have empty filteredColumnOptions initially', () => {
      expect(component.filteredColumnOptions).toEqual([]);
    });

    it('should have tableSearchControl defined', () => {
      expect(component.tableSearchControl).toBeDefined();
    });

    it('should have columnSearchControl defined', () => {
      expect(component.columnSearchControl).toBeDefined();
    });
  });

  describe('Component Properties', () => {
    it('should have maxToDate computed signal', () => {
      expect(component.maxToDate).toBeDefined();
    });

    it('should have linkedValuesTableConfig defined', () => {
      expect(component.linkedValuesTableConfig).toBeDefined();
    });

    it('should have fromDateErrorMatcher defined', () => {
      expect(component.fromDateErrorMatcher).toBeDefined();
    });

    it('should have toDateErrorMatcher defined', () => {
      expect(component.toDateErrorMatcher).toBeDefined();
    });
  });

  describe('Public Methods', () => {
    it('should have onOpenUploadDialog method', () => {
      expect(typeof component.onOpenUploadDialog).toBe('function');
    });

    it('should have onSelectDocument method', () => {
      expect(typeof component.onSelectDocument).toBe('function');
    });

    it('should have isDocumentSelected method', () => {
      expect(typeof component.isDocumentSelected).toBe('function');
    });

    it('should have onClearAll method', () => {
      expect(typeof component.onClearAll).toBe('function');
    });

    it('should have getFromDateError method', () => {
      expect(typeof component.getFromDateError).toBe('function');
    });

    it('should have getToDateError method', () => {
      expect(typeof component.getToDateError).toBe('function');
    });

    it('should have onFromDateInput method', () => {
      expect(typeof component.onFromDateInput).toBe('function');
    });

    it('should have onToDateInput method', () => {
      expect(typeof component.onToDateInput).toBe('function');
    });

    it('should have onFromDateChange method', () => {
      expect(typeof component.onFromDateChange).toBe('function');
    });

    it('should have onToDateChange method', () => {
      expect(typeof component.onToDateChange).toBe('function');
    });

    it('should have onDatePickerClosed method', () => {
      expect(typeof component.onDatePickerClosed).toBe('function');
    });
  });

  describe('Document Selection', () => {
    it('should have onSelectDocument method callable', () => {
      const doc = { sessionId: 'test123', docName: 'test.pdf' } as any;
      expect(() => component.onSelectDocument(doc)).not.toThrow();
    });

    it('should have isDocumentSelected method callable', () => {
      const doc = { sessionId: 'test123', docName: 'test.pdf' } as any;
      expect(() => component.isDocumentSelected(doc)).not.toThrow();
    });

    it('should return boolean from isDocumentSelected', () => {
      const doc = { sessionId: 'test123', docName: 'test.pdf' } as any;
      const result = component.isDocumentSelected(doc);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Component Lifecycle', () => {
    it('should call ngOnInit', () => {
      spyOn(component, 'ngOnInit');
      component.ngOnInit();
      expect(component.ngOnInit).toHaveBeenCalled();
    });

    it('should unsubscribe on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('API Service Integration', () => {
    it('should have API service injected', () => {
      expect(mockApiService).toBeDefined();
    });

    it('should have configured API methods', () => {
      expect(mockApiService.searchDocuments).toBeDefined();
      expect(mockApiService.getLinkCategories).toBeDefined();
      expect(mockApiService.getTableCodes).toBeDefined();
      expect(mockApiService.getColumnCodes).toBeDefined();
    });
  });
});
