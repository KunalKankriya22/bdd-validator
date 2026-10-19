import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { FindDonorDialogComponent, FindDonorDialogData } from './find-donor-dialog';
import { FindDonorService } from '@shared/components/find-donor/find-donor.service';
import { AttachDonorService } from '../../services/attach-donor.service';

describe('FindDonorDialogComponent', () => {
  let component: FindDonorDialogComponent;
  let fixture: ComponentFixture<FindDonorDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<FindDonorDialogComponent>>;
  let findDonorServiceSpy: jasmine.SpyObj<FindDonorService>;
  let attachDonorServiceSpy: jasmine.SpyObj<AttachDonorService>;

  const mockDialogData: FindDonorDialogData = {
    transactionId: 'TXN001',
  };

  const mockSearchResults = {
    data: [
      { donorId: 'D001', lastName: 'Smith', firstName: 'John', dob: '1990-01-15', sex: 'M', alternateId: null },
      { donorId: 'D002', lastName: 'Doe', firstName: 'Jane', dob: '1985-05-20', sex: 'F', alternateId: 'ALT01' },
    ],
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    findDonorServiceSpy = jasmine.createSpyObj('FindDonorService', ['searchDonors']);
    findDonorServiceSpy.searchDonors.and.returnValue(of(mockSearchResults as any));
    attachDonorServiceSpy = jasmine.createSpyObj('AttachDonorService', ['putDonorOnHold']);
    attachDonorServiceSpy.putDonorOnHold.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [FindDonorDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: FindDonorService, useValue: findDonorServiceSpy },
        { provide: AttachDonorService, useValue: attachDonorServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FindDonorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize search form', () => {
    expect(component.searchForm).toBeTruthy();
    expect(component.searchForm.get('donorId')).toBeTruthy();
    expect(component.searchForm.get('lastName')).toBeTruthy();
    expect(component.searchForm.get('firstName')).toBeTruthy();
  });

  it('should start with empty search results', () => {
    expect(component['searchResults']().length).toBe(0);
  });

  it('should search donors and populate results', fakeAsync(() => {
    component.searchForm.patchValue({ lastName: 'Smith' });
    component.onSearch();
    tick();
    expect(findDonorServiceSpy.searchDonors).toHaveBeenCalled();
    expect(component['searchResults']().length).toBe(2);
  }));

  it('should set error when no results found', fakeAsync(() => {
    findDonorServiceSpy.searchDonors.and.returnValue(of({ data: [] } as any));
    component.onSearch();
    tick();
    expect(component['error']()).toBe('No donors found matching search criteria');
  }));

  it('should handle search error', fakeAsync(() => {
    findDonorServiceSpy.searchDonors.and.returnValue(throwError(() => new Error('API error')));
    component.onSearch();
    tick();
    expect(component['error']()).toBeTruthy();
    expect(component['searchResults']().length).toBe(0);
  }));

  it('should clear form and results on onClear', () => {
    component['searchResults'].set([{ donorId: 'D001' } as any]);
    component.onClear();
    expect(component['searchResults']().length).toBe(0);
    expect(component['selectedDonor']()).toBeNull();
  });

  it('should select a donor', () => {
    const donor = { donorId: 'D001', lastName: 'Smith', firstName: 'John' } as any;
    component.onSelectDonor(donor);
    expect(component['selectedDonor']()?.donorId).toBe('D001');
  });

  it('should close dialog with selected donor on onSelect', () => {
    const donor = { donorId: 'D001', lastName: 'Smith', firstName: 'John' } as any;
    component['selectedDonor'].set(donor);
    component.onSelect();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.objectContaining({
      type: 'select',
      donor: jasmine.objectContaining({ donorId: 'D001' }),
    }));
  });

  it('should set error when selecting without a donor', () => {
    component.onSelect();
    expect(component['error']()).toBe('Please select a donor first');
  });

  it('should close dialog with new type on onNew', () => {
    component.onNew();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.objectContaining({ type: 'new' }));
  });

  it('should close dialog with null on cancel', () => {
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
  });

  it('should put donor on hold and close dialog', fakeAsync(() => {
    const donor = { donorId: 'D001', lastName: 'Smith', firstName: 'John' } as any;
    component['selectedDonor'].set(donor);
    component.onHold();
    tick();
    expect(attachDonorServiceSpy.putDonorOnHold).toHaveBeenCalledWith('D001', 'TXN001');
    expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.objectContaining({ type: 'hold' }));
  }));

  it('should check if donor is selected', () => {
    const donor = { donorId: 'D001' } as any;
    component['selectedDonor'].set(donor);
    expect(component.isSelected(donor)).toBeTrue();
    expect(component.isSelected({ donorId: 'D999' } as any)).toBeFalse();
  });
});
