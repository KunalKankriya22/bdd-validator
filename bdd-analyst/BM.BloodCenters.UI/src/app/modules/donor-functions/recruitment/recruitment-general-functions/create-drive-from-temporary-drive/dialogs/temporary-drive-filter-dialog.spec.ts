import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import {
  TemporaryDriveFilterDialog,
  TemporaryDriveFilterDialogData,
} from './temporary-drive-filter-dialog';
import { LookupService } from '../services/lookup.service';

describe('TemporaryDriveFilterDialog', () => {
  let component: TemporaryDriveFilterDialog;
  let fixture: ComponentFixture<TemporaryDriveFilterDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<TemporaryDriveFilterDialog>>;
  let lookupServiceSpy: jasmine.SpyObj<LookupService>;

  const mockSponsors = [
    { id: 'SP1', name: 'Sponsor One' },
    { id: 'SP2', name: 'Sponsor Two' },
  ];

  const defaultDialogData: TemporaryDriveFilterDialogData = {
    currentFilters: null,
    chapterId: 'CH001',
  };

  function createComponent(data: TemporaryDriveFilterDialogData = defaultDialogData) {
    TestBed.resetTestingModule();
    lookupServiceSpy = jasmine.createSpyObj('LookupService', ['getSponsors']);
    lookupServiceSpy.getSponsors.and.returnValue(of(mockSponsors));

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [TemporaryDriveFilterDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: LookupService, useValue: lookupServiceSpy },
      ],
    });

    fixture = TestBed.createComponent(TemporaryDriveFilterDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    createComponent();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the filter form', () => {
    expect(component.filterForm).toBeTruthy();
    expect(component.filterForm.get('driveDate')).toBeTruthy();
    expect(component.filterForm.get('sponsorId')).toBeTruthy();
    expect(component.filterForm.get('driveType')).toBeTruthy();
    expect(component.filterForm.get('driveCategory')).toBeTruthy();
  });

  it('should load sponsors from lookup service', () => {
    expect(lookupServiceSpy.getSponsors).toHaveBeenCalledWith('CH001');
    expect(component.filterOptions.sponsors.length).toBe(2);
  });

  it('should set isLoading to false after sponsors load', () => {
    expect(component.isLoading).toBeFalse();
  });

  it('should populate form when currentFilters are provided', () => {
    createComponent({
      currentFilters: {
        driveDate: new Date('2024-06-15'),
        sponsorId: 'SP1',
        driveType: 'I',
        driveCategory: 'B',
      } as any,
      chapterId: 'CH001',
    });

    expect(component.filterForm.get('sponsorId')?.value).toBe('SP1');
    expect(component.filterForm.get('driveType')?.value).toBe('I');
    expect(component.filterForm.get('driveCategory')?.value).toBe('B');
  });

  it('should close dialog with filter values on applyFilters', () => {
    component.filterForm.patchValue({ sponsorId: 'SP1', driveType: 'I' });
    component.applyFilters();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.objectContaining({
      sponsorId: 'SP1',
      driveType: 'I',
    }));
  });

  it('should close dialog with empty filters on clearFilters', () => {
    component.filterForm.patchValue({ sponsorId: 'SP1' });
    component.clearFilters();

    expect(dialogRefSpy.close).toHaveBeenCalledWith({
      driveDate: null,
      sponsorId: null,
      driveType: null,
      driveCategory: null,
    });
  });

  it('should have default drive types and categories', () => {
    expect(component.filterOptions.driveTypes.length).toBe(3);
    expect(component.filterOptions.driveCategories.length).toBe(4);
  });

  it('should handle error when loading sponsors fails', () => {
    lookupServiceSpy.getSponsors.and.returnValue(throwError(() => new Error('fail')));
    createComponent();
    expect(component.isLoading).toBeFalse();
  });
});
