import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttachedUsersDialogComponent } from './attached-users-dialog';
import {
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { AccessClassService } from '../services/access-class.service';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('AttachedUsersDialogComponent', () => {
  let component: AttachedUsersDialogComponent;
  let fixture: ComponentFixture<AttachedUsersDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AttachedUsersDialogComponent>>;
  let mockAccessClassService: jasmine.SpyObj<AccessClassService>;

  const dialogDataMock = {
    accessClass: '00ISU',
    scope: 'ALL - All Interdictions'
  };

  beforeEach(() => {

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockAccessClassService = jasmine.createSpyObj(
      'AccessClassService',
      ['getAttachedUsers']
    );



      TestBed.configureTestingModule({
      imports: [
        AttachedUsersDialogComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogDataMock },
        { provide: AccessClassService, useValue: mockAccessClassService }
      ]
    });


    


      mockDialogRef.close.calls.reset();


      mockAccessClassService.getAttachedUsers.calls.reset();


    fixture = TestBed.createComponent(AttachedUsersDialogComponent);
    component = fixture.componentInstance;


    });

  /* ============================
     BASIC CREATION
  ============================ */


  /* ============================
     ngOnInit behavior
  ============================ */



  /* ============================
     API RESPONSE HANDLING
  ============================ */









  /* ============================
     ERROR HANDLING
  ============================ */

  it('should set empty array on API error', () => {
    mockAccessClassService.getAttachedUsers.and.returnValue(
      throwError(() => new Error('API error'))
    );

    fixture.detectChanges();

    expect(component.dataSource.data).toEqual([]);
  });

  /* ============================
     CLOSE DIALOG
  ============================ */



  /* ============================
     SORT
  ============================ */

  describe('toggleSort', () => {
    beforeEach(() => {
      mockAccessClassService.getAttachedUsers.and.returnValue(of([
        { userId: 'BBB', name: 'User B', level: 1, effectiveDate: '01-JAN-2020', terminationDate: '-' },
        { userId: 'AAA', name: 'User A', level: 2, effectiveDate: '01-JAN-2021', terminationDate: '-' }
      ]));
      fixture.detectChanges();
    });



    it('should cycle from asc to desc', () => {
      component.sortDirection = 'asc';
      component.toggleSort();
      expect(component.sortDirection).toBe('desc');
    });

    it('should cycle from desc to default', () => {
      component.sortDirection = 'desc';
      component.toggleSort();
      expect(component.sortDirection).toBe('default');
    });

    it('should sort ascending by userId', () => {
      component.toggleSort(); // default -> asc
      expect(component.dataSource.data[0].userId).toBe('AAA');
      expect(component.dataSource.data[1].userId).toBe('BBB');
    });

    it('should sort descending by userId', () => {
      component.sortDirection = 'asc';
      component.toggleSort(); // asc -> desc
      expect(component.dataSource.data[0].userId).toBe('BBB');
      expect(component.dataSource.data[1].userId).toBe('AAA');
    });
  });
});
