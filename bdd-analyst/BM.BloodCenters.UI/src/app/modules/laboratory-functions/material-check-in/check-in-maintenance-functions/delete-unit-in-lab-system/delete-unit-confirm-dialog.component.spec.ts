import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DeleteUnitConfirmDialogComponent, DeleteConfirmDialogData } from './delete-unit-confirm-dialog.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('DeleteUnitConfirmDialogComponent', () => {
  let component: DeleteUnitConfirmDialogComponent;
  let fixture: ComponentFixture<DeleteUnitConfirmDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<DeleteUnitConfirmDialogComponent>>;
  const mockData: DeleteConfirmDialogData = {
    unitId: 'TEST123'
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [DeleteUnitConfirmDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteUnitConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should have dialog data', () => {
    expect(component.data).toEqual(mockData);
    expect(component.data.unitId).toBe('TEST123');
  });
  describe('close', () => {

    it('should close dialog with true when close is called with true', () => {
      component.close(true);
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });
  });
});
