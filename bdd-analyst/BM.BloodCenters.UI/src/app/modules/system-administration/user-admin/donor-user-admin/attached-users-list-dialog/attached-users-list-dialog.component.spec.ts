import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttachedUsersListDialogComponent } from './attached-users-list-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AccessClassService } from './services/access-class.service';
import { of, throwError } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AttachedUser } from './models/access-class.model';

describe('AttachedUsersListDialogComponent', () => {
    let component: AttachedUsersListDialogComponent;
    let fixture: ComponentFixture<AttachedUsersListDialogComponent>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<AttachedUsersListDialogComponent>>;
    let mockAccessClassService: jasmine.SpyObj<AccessClassService>;

    const mockAttachedUsers: AttachedUser[] = [
        { userId: 'USER01', name: 'John Doe', level: 9 },
        { userId: 'USER02', name: 'Jane Smith', level: 5 },
        { userId: 'USER03', level: 7 }
    ];

    const mockDialogData = {
        accessClass: 'TVIEW',
        description: 'View test results'
    };

    beforeEach(() => {

        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
        mockAccessClassService = jasmine.createSpyObj('AccessClassService', ['getAttachedUsers']);
        mockAccessClassService.getAttachedUsers.and.returnValue(of(mockAttachedUsers));



        TestBed.configureTestingModule({
            imports: [AttachedUsersListDialogComponent],
            providers: [
                provideNoopAnimations(),
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: AccessClassService, useValue: mockAccessClassService },
                { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
            ]
        });


      


        mockDialogRef.close.calls.reset();


        mockAccessClassService.getAttachedUsers.calls.reset();


        mockAccessClassService.getAttachedUsers.and.returnValue(of(mockAttachedUsers));


        fixture = TestBed.createComponent(AttachedUsersListDialogComponent);
        component = fixture.componentInstance;


      });

    /* ===============================
       BASIC
    ================================ */


    /* ===============================
       INITIALIZATION
    ================================ */




    it('should load attached users on init', () => {
        fixture.detectChanges();
        expect(mockAccessClassService.getAttachedUsers).toHaveBeenCalledWith('TVIEW');
        expect(component.attachedUsers).toEqual(mockAttachedUsers);
        expect(component.originalUsers).toEqual(mockAttachedUsers);
    });



    it('should handle error when loading attached users fails', () => {
        mockAccessClassService.getAttachedUsers.and.returnValue(
            throwError(() => new Error('API Error'))
        );
        spyOn(console, 'error');

        fixture.detectChanges();

        expect(console.error).toHaveBeenCalledWith(
            'Failed to load attached users:',
            jasmine.any(Error)
        );
    });

    it('should not load users when accessClass is missing', () => {
        const emptyData = { accessClass: '' };
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [AttachedUsersListDialogComponent],
            providers: [
                provideNoopAnimations(),
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: AccessClassService, useValue: mockAccessClassService },
                { provide: MAT_DIALOG_DATA, useValue: emptyData }
            ]
        });
         spyOn(console, 'error');
        const newFixture = TestBed.createComponent(AttachedUsersListDialogComponent);
        newFixture.detectChanges();

        expect(console.error).toHaveBeenCalledWith('No access class provided');
    });

    /* ===============================
       SORTING
    ================================ */
    it('should sort users by userId ascending', () => {
        fixture.detectChanges();
        // After initialization, userId is already sorted ascending by default
        // So we need to clear it first by clicking twice (asc->desc->null)
        // then click again to set it to asc
        component.onSort('userId'); // asc -> desc
        component.onSort('userId'); // desc -> null
        component.onSort('userId'); // null -> asc

        expect(component.sortColumn).toBe('userId');
        expect(component.sortDirection).toBe('asc');
        expect(component.attachedUsers[0].userId).toBe('USER01');
    });





    it('should reset to original order when sort is cleared', () => {
        fixture.detectChanges();
        // Sort first
        component.onSort('userId');
        // Then clear by clicking 3 times (asc -> desc -> null)
        component.onSort('userId');
        component.onSort('userId');

        expect(component.attachedUsers).toEqual(mockAttachedUsers);
    });

    it('should sort by name in descending order', () => {
        fixture.detectChanges();

        // Click once to set to asc, click twice to set to desc
        component.onSort('name'); // userId asc -> name asc
        component.onSort('name'); // name asc -> name desc

        // Verify sort is set correctly
        expect(component.sortColumn).toBe('name');
        expect(component.sortDirection).toBe('desc');
        // Verify the first item has the highest name (John Doe > Jane Smith)
        expect(component.attachedUsers[0].name).toBe('John Doe');
        expect(component.attachedUsers[1].name).toBe('Jane Smith');
    });

    it('should sort by level in descending order', () => {
        fixture.detectChanges();

        component.sortColumn = 'level';
        component.sortDirection = 'asc';
        component.onSort('level');
        component.onSort('level'); // Toggle to desc

        expect(component.attachedUsers[0].level).toBe(9);
    });

    /* ===============================
       SORT ICON
    ================================ */
    it('should return arrow_downward for unsorted column', () => {
        component.sortColumn = null;
        component.sortDirection = null;

        const icon = component.getSortIcon('userId');

        expect(icon).toBe('arrow_downward');
    });

    it('should return arrow_upward for ascending sort', () => {
        component.sortColumn = 'userId';
        component.sortDirection = 'asc';

        const icon = component.getSortIcon('userId');

        expect(icon).toBe('arrow_upward');
    });

    it('should return arrow_downward for descending sort', () => {
        component.sortColumn = 'userId';
        component.sortDirection = 'desc';

        const icon = component.getSortIcon('userId');

        expect(icon).toBe('arrow_downward');
    });

    it('should return arrow_downward for different column', () => {
        component.sortColumn = 'userId';
        component.sortDirection = 'asc';

        const icon = component.getSortIcon('name');

        expect(icon).toBe('arrow_downward');
    });

    /* ===============================
       DIALOG ACTIONS
    ================================ */




    /* ===============================
       DATA DISPLAY
    ================================ */



});
