import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { AssignUserInterdictionClass } from './assign-user-interdiction-class';
import { AssignUserInterdictionClassService } from '../services/assign-user-interdiction-class.service';
import { HeaderService } from '@shared/services/header.service';
import { of, Subject, throwError } from 'rxjs';
import { Overlay } from '@angular/cdk/overlay';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('AssignUserInterdictionClass', () => {
  let component: AssignUserInterdictionClass;
  let fixture: ComponentFixture<AssignUserInterdictionClass>;
  let service: jasmine.SpyObj<AssignUserInterdictionClassService>;
  let dialogOpenSpy: jasmine.Spy;
  let chapterChangedSubject: Subject<void>;
  let headerServiceSpy: any;

  const mockTableData = [
    {
      userId: 'USER001',
      userName: 'John Doe',
      interClass: 'SYS',
      interClassDesc: 'System Interdictions',
      effectiveDate: new Date('2024-01-01'),
      terminationDate: new Date('2024-12-31'),
      lastModifiedDate: new Date('2024-06-15'),
      isActive: true
    }
  ];

  const mockApiResponse = { data: mockTableData, totalRecords: 1 };

  beforeEach(() => {
    service = jasmine.createSpyObj('AssignUserInterdictionClassService', [
      'getAssignUserInterdictionClass'
    ]);

    chapterChangedSubject = new Subject<void>();
    headerServiceSpy = {
      chapterChanged$: chapterChangedSubject.asObservable()
    };

    TestBed.configureTestingModule({
      imports: [AssignUserInterdictionClass, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: AssignUserInterdictionClassService, useValue: service },
        { provide: HeaderService, useValue: headerServiceSpy },
        Overlay
      ]
    });
  
    chapterChangedSubject = new Subject<void>();
    headerServiceSpy.chapterChanged$ = chapterChangedSubject.asObservable();
    service.getAssignUserInterdictionClass.and.returnValue(of(mockApiResponse));

    fixture = TestBed.createComponent(AssignUserInterdictionClass);
    component = fixture.componentInstance;

    // Spy on the component's dialog instance to prevent real component instantiation
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
    mockDialogRef.afterClosed.and.returnValue(of(undefined));
    mockDialogRef.componentInstance = { saveSuccess: of() };
    dialogOpenSpy = spyOn(component['dialog'], 'open').and.returnValue(mockDialogRef);
  });






  it('should map column names correctly', () => {
    expect(component['mapColumnToAPIName']('userId')).toBe('UserId');
  });



  it('should format dates to UTC for API', () => {
    const date = new Date(Date.UTC(2024, 1, 15, 0, 0, 0, 0));
    expect(component['formatDateForAPI'](date)).toBe('2024-02-15');
  });

  it('should reset state and reload data on chapter change', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.requestState = { searchText: 'test', sort: 'A', sortColumn: 'UserId' };

    service.getAssignUserInterdictionClass.calls.reset();

    chapterChangedSubject.next();

    expect(component.requestState.sort).toBeUndefined();
    expect(component.requestState.sortColumn).toBeUndefined();
    expect(component.searchText).toBe('');
    expect(component.tableConfig.sortConfig?.direction).toBe('default');
    expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    expect(service.getAssignUserInterdictionClass).toHaveBeenCalled();
  }));
});
