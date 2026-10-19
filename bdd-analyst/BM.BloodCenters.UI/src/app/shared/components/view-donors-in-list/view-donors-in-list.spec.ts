import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ViewDonorsInListDialog } from './view-donors-in-list';
import { ViewDonorsInListService } from './view-donors-in-list.service';

describe('ViewDonorsInListDialog', () => {
  let component: ViewDonorsInListDialog;
  let fixture: ComponentFixture<ViewDonorsInListDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ViewDonorsInListDialog>>;
  let mockService: jasmine.SpyObj<ViewDonorsInListService>;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('ViewDonorsInListService', [
      'getDonorsByListId',
      'getAvailableListIds'
    ]);

    mockService.getAvailableListIds.and.returnValue(of(['LIST00406', 'LIST00407']));
    mockService.getDonorsByListId.and.returnValue(
      of({
        success: true,
        message: 'Success',
        statusCode: 200,
        data: {
          listInfo: {
            listId: 'LIST00406',
            name: 'Test',
            type: '25',
            size: '25',
            priority: '25',
            fullEligibility: false,
            donorOverride: false
          },
          donors: []
        },
        total: 0,
        errorResponse: {
          errorCode: null,
          error: null
        }
      })
    );

    await TestBed.configureTestingModule({
      imports: [ViewDonorsInListDialog],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: ViewDonorsInListService, useValue: mockService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewDonorsInListDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load available list IDs on init', () => {
    expect(mockService.getAvailableListIds).toHaveBeenCalled();
    expect(component.availableListIds.length).toBeGreaterThan(0);
  });

  it('should retrieve donor list when onRetrieve is called', () => {
    component.listForm.patchValue({ listId: 'LIST00406' });
    component.onRetrieve();
    expect(mockService.getDonorsByListId).toHaveBeenCalledWith('LIST00406');
  });



});
