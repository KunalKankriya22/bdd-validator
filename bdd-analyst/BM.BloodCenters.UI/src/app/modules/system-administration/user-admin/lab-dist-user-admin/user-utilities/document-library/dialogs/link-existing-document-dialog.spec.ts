import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import {
  LinkExistingDocumentDialogComponent,
  LinkExistingDocumentDialogData,
} from './link-existing-document-dialog';
import { DocumentLibraryApiService } from '../services/document-library-api.service';

describe('LinkExistingDocumentDialogComponent', () => {
  let component: LinkExistingDocumentDialogComponent;
  let fixture: ComponentFixture<LinkExistingDocumentDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<LinkExistingDocumentDialogComponent>>;
  let apiServiceSpy: jasmine.SpyObj<DocumentLibraryApiService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const mockDocuments = [
    {
      sessionId: 'S001',
      docName: 'Document A',
      docLinkedTable: 'PRODUCT',
      docLinkedColumn: 'PRODUCT_CODE',
      linkedValue: 'VAL1',
    },
    {
      sessionId: 'S001',
      docName: 'Document A',
      docLinkedTable: 'PRODUCT',
      docLinkedColumn: 'PRODUCT_CODE',
      linkedValue: 'VAL2',
    },
    {
      sessionId: 'S002',
      docName: 'Document B',
      docLinkedTable: 'DONOR',
      docLinkedColumn: 'DONOR_ID',
      linkedValue: 'D001',
    },
  ];

  const mockLinks = [
    { linkWith: 'Product Code', linkTable: 'PRODUCT', linkColumn: 'PRODUCT_CODE' },
    { linkWith: 'Donor ID', linkTable: 'DONOR', linkColumn: 'DONOR_ID' },
  ];

  const defaultDialogData: LinkExistingDocumentDialogData = {
    documents: mockDocuments as any,
  };

  function createComponent(data: LinkExistingDocumentDialogData = defaultDialogData) {
    TestBed.resetTestingModule();
    apiServiceSpy = jasmine.createSpyObj('DocumentLibraryApiService', [
      'getLinkCategories',
      'validateValue',
      'linkValues',
    ]);
    apiServiceSpy.getLinkCategories.and.returnValue(of(mockLinks));
    apiServiceSpy.validateValue.and.returnValue(of(true));
    apiServiceSpy.linkValues.and.returnValue(of(undefined));

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      imports: [LinkExistingDocumentDialogComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: DocumentLibraryApiService, useValue: apiServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });

    // Override component-level providers so that the spy takes precedence
    // over the real MatSnackBar provided by the standalone component's MatSnackBarModule import
    TestBed.overrideComponent(LinkExistingDocumentDialogComponent, {
      add: { providers: [{ provide: MatSnackBar, useValue: snackBarSpy }] },
    });

    fixture = TestBed.createComponent(LinkExistingDocumentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    createComponent();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should deduplicate documents by sessionId', () => {
    expect(component.availableDocuments.length).toBe(2);
  });

  it('should load link categories on init', () => {
    expect(apiServiceSpy.getLinkCategories).toHaveBeenCalled();
    expect(component.availableLinks.length).toBe(2);
  });

  it('should close dialog with null on close', () => {
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
  });

  it('should filter links by search term', () => {
    component.onSearch('donor');
    expect(component.filteredLinks.length).toBe(1);
    expect(component.filteredLinks[0].linkWith).toBe('Donor ID');
  });

  it('should show all links when search is empty', () => {
    component.onSearch('product');
    component.onSearch('');
    expect(component.filteredLinks.length).toBe(2);
  });

  it('should not allow upload when no document is selected', () => {
    expect(component.canUploadAndLink()).toBeFalse();
  });

  it('should set valuesRequiredError when attempting link with no values', () => {
    component.selectedValues = [];
    component.onUploadAndLink();
    expect(component.valuesRequiredError).toBeTrue();
  });

  it('should clear valuesRequiredError on value added', () => {
    component.valuesRequiredError = true;
    component.onValueAdded();
    expect(component.valuesRequiredError).toBeFalse();
  });

  it('should set valuesRequiredError on value removed when no values remain', () => {
    component.selectedLink = mockLinks[0] as any;
    component.selectedValues = [];
    component.onValueRemoved();
    expect(component.valuesRequiredError).toBeTrue();
  });

  it('should pre-select document when selectedDocument is provided', () => {
    createComponent({
      documents: mockDocuments as any,
      selectedDocument: mockDocuments[0] as any,
    });
    expect(component.selectedDocument).toBeTruthy();
    expect(component.selectedDocument!.sessionId).toBe('S001');
  });

  it('should handle upload and link successfully', fakeAsync(() => {
    component.selectedDocument = mockDocuments[0] as any;
    component.selectedLink = mockLinks[0] as any;
    component.selectedValues = ['VAL1', 'VAL3'];

    component.onUploadAndLink();
    tick();

    expect(apiServiceSpy.linkValues).toHaveBeenCalledWith('S001', ['VAL1', 'VAL3']);
    expect(dialogRefSpy.close).toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalled();
  }));

  it('should handle upload and link error', fakeAsync(() => {
    apiServiceSpy.linkValues.and.returnValue(throwError(() => ({ error: { message: 'Link failed' } })));

    component.selectedDocument = mockDocuments[0] as any;
    component.selectedLink = mockLinks[0] as any;
    component.selectedValues = ['VAL1'];

    component.onUploadAndLink();
    tick();

    expect(component.isUploading).toBeFalse();
    expect(snackBarSpy.open).toHaveBeenCalled();
  }));
});
