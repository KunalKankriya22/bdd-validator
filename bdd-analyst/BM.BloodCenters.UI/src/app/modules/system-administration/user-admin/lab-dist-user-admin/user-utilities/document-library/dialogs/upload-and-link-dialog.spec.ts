import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { UploadAndLinkDialogComponent } from './upload-and-link-dialog';
import { DocumentLibraryApiService } from '../services/document-library-api.service';

describe('UploadAndLinkDialogComponent', () => {
  let component: UploadAndLinkDialogComponent;
  let fixture: ComponentFixture<UploadAndLinkDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<UploadAndLinkDialogComponent>>;
  let apiServiceSpy: jasmine.SpyObj<DocumentLibraryApiService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const mockLinks = [
    { linkWith: 'Product Code', linkTable: 'PRODUCT', linkColumn: 'PRODUCT_CODE' },
    { linkWith: 'Donor ID', linkTable: 'DONOR', linkColumn: 'DONOR_ID' },
  ];

  function createComponent() {
    TestBed.resetTestingModule();
    apiServiceSpy = jasmine.createSpyObj('DocumentLibraryApiService', [
      'getLinkCategories',
      'validateValue',
      'uploadDocument',
    ]);
    apiServiceSpy.getLinkCategories.and.returnValue(of(mockLinks));
    apiServiceSpy.validateValue.and.returnValue(of(true));
    apiServiceSpy.uploadDocument.and.returnValue(of(undefined));

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      imports: [UploadAndLinkDialogComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: DocumentLibraryApiService, useValue: apiServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });

    // Override component-level providers so that the spy takes precedence
    // over the real MatSnackBar provided by the standalone component's MatSnackBarModule import
    TestBed.overrideComponent(UploadAndLinkDialogComponent, {
      add: { providers: [{ provide: MatSnackBar, useValue: snackBarSpy }] },
    });

    fixture = TestBed.createComponent(UploadAndLinkDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    createComponent();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize upload form with validators', () => {
    expect(component.uploadFormGroup).toBeTruthy();
    expect(component.uploadFormGroup.get('docName')?.hasError('required')).toBeTrue();
    expect(component.uploadFormGroup.get('docId')?.hasError('required')).toBeTrue();
  });

  it('should load link categories on init', () => {
    expect(apiServiceSpy.getLinkCategories).toHaveBeenCalled();
    expect(component.availableLinks.length).toBe(2);
    expect(component.filteredLinks.length).toBe(2);
  });

  it('should close dialog with false on close', () => {
    component.onClose();
    // removeFocus uses setTimeout, but close is called synchronously
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });

  it('should not proceed to link step when no file is selected', () => {
    expect(component.canProceedToLink()).toBeFalse();
  });

  it('should handle file selection event', () => {
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    component.onFileSelected({ file: mockFile, isValid: true } as any);

    expect(component.selectedFile).toBe(mockFile);
    expect(component.uploadFormGroup.get('docType')?.value).toBe('PDF');
  });

  it('should reject invalid file selection', () => {
    const mockFile = new File([''], 'bad.exe', { type: 'application/octet-stream' });
    component.onFileSelected({ file: mockFile, isValid: false, error: 'Invalid type' } as any);

    expect(component.selectedFile).toBeNull();
    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  it('should reset state on file removed', () => {
    component.selectedFile = new File(['x'], 'a.pdf');
    component.uploadProgress = 100;
    component.onFileRemoved();

    expect(component.selectedFile).toBeNull();
    expect(component.uploadProgress).toBe(0);
  });

  it('should filter links by search term', () => {
    component.onSearch('donor');
    expect(component.filteredLinks.length).toBe(1);
    expect(component.filteredLinks[0].linkWith).toBe('Donor ID');
  });

  it('should show all links when search is empty', () => {
    component.onSearch('donor');
    component.onSearch('');
    expect(component.filteredLinks.length).toBe(2);
  });

  it('should return correct file icon for PDF', () => {
    component.selectedFile = new File([''], 'test.pdf');
    expect(component.getFileIcon()).toBe('picture_as_pdf');
  });

  it('should format file size correctly', () => {
    expect(component.formatFileSize(0)).toBe('0 Bytes');
    expect(component.formatFileSize(1024)).toBe('1 KB');
  });

  it('should prevent space input in doc ID', () => {
    const event = { key: ' ', code: 'Space', preventDefault: jasmine.createSpy() } as any;
    component.preventSpaceInput(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should not allow upload when conditions are not met', () => {
    expect(component.canUploadAndLink()).toBeFalse();
  });

  it('should set valuesRequiredError when no values and attempting upload', () => {
    component.selectedValues = [];
    component.onUploadAndLink();
    expect(component.valuesRequiredError).toBeTrue();
  });

  it('should clear valuesRequiredError on value added', () => {
    component.valuesRequiredError = true;
    component.onValueAdded();
    expect(component.valuesRequiredError).toBeFalse();
  });
});
