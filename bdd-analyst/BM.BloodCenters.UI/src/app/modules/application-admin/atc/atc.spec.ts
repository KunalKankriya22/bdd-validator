import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { AdditionalConfirmatoryTestScheduledComponent } from './atc';
import { AtcApiService } from './services/atc-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { Subject } from 'rxjs';
import { createMockMatDialog, createMockPageHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  AdditionalConfirmatoryTestScheduledDto,
  TestGroupLookupDto,
  SampleTypeLookupDto,
} from './models/atc.models';

describe('AdditionalConfirmatoryTestScheduledComponent', () => {
  let component: AdditionalConfirmatoryTestScheduledComponent;
  let fixture: ComponentFixture<AdditionalConfirmatoryTestScheduledComponent>;
  let atcApiServiceSpy: jasmine.SpyObj<AtcApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceMock: { chapterChanged$: Subject<void> };

  const mockTestGroups: TestGroupLookupDto[] = [
    { testGroup: 'GROUP1', description: 'Test Group 1' },
    { testGroup: 'GROUP2', description: 'Test Group 2' },
  ];

  const mockSampleTypes: SampleTypeLookupDto[] = [
    { sampleType: 'SAMPLE1', description: 'Sample Type 1' },
  ];

  const mockTestDto: AdditionalConfirmatoryTestScheduledDto = {
    testId: 'TEST001',
    testGroup: 'GROUP1',
    testDesc: 'Confirmatory Test',
    sampleType: 'SAMPLE1',
    effDate: '2024-01-01T00:00:00Z',
    termDate: null,
    isActive: true,
  };

  beforeEach(() => {

    atcApiServiceSpy = jasmine.createSpyObj('AtcApiService', [
      'getAllTests', 'getTestById', 'getTestGroups', 'getSampleTypes',
      'validateUnit', 'getExistingTests', 'scheduleTests',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = createMockPageHeaderService();
    headerServiceMock = { chapterChanged$: new Subject<void>() };

    atcApiServiceSpy.getTestGroups.and.returnValue(of(mockTestGroups));
    atcApiServiceSpy.getSampleTypes.and.returnValue(of(mockSampleTypes));
    atcApiServiceSpy.getAllTests.and.returnValue(of({ data: [mockTestDto], totalCount: 1 }));
    (pageHeaderServiceSpy.pageHeaderData as any) = jasmine.createSpy().and.returnValue(undefined);



      TestBed.configureTestingModule({
      imports: [AdditionalConfirmatoryTestScheduledComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: AtcApiService, useValue: atcApiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceMock },
        { provide: MatDialog, useValue: createMockMatDialog() },
      ],
    });


    


      atcApiServiceSpy.getAllTests.calls.reset();


      atcApiServiceSpy.getTestById.calls.reset();


      atcApiServiceSpy.getTestGroups.calls.reset();


      atcApiServiceSpy.getSampleTypes.calls.reset();


      atcApiServiceSpy.validateUnit.calls.reset();


      atcApiServiceSpy.getExistingTests.calls.reset();


      atcApiServiceSpy.scheduleTests.calls.reset();


      atcApiServiceSpy.getTestGroups.and.returnValue(of(mockTestGroups));


      atcApiServiceSpy.getSampleTypes.and.returnValue(of(mockSampleTypes));


      atcApiServiceSpy.getAllTests.and.returnValue(of({ data: [mockTestDto], totalCount: 1 }));


    fixture = TestBed.createComponent(AdditionalConfirmatoryTestScheduledComponent);
    component = fixture.componentInstance;


    });


  it('should load test groups on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(atcApiServiceSpy.getTestGroups).toHaveBeenCalled();
    expect((component as any).testGroups()).toEqual(mockTestGroups);
  }));







  it('should remove a test chip', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    (component as any).selectedTests.set([mockTestDto]);
    (component as any).removeTest('TEST001');

    expect((component as any).selectedTests().length).toBe(0);
  }));

  it('should clear all tests', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    (component as any).selectedTests.set([mockTestDto]);
    (component as any).onClearTests();

    expect((component as any).selectedTests().length).toBe(0);
  }));





  it('should prevent duplicate unit scans', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    (component as any).unitSequences.set([
      { sequenceNumber: 1, unitId: 'W1234', collectionDate: '2024-01-01' },
    ]);
    atcApiServiceSpy.validateUnit.and.returnValue(of({
      unitId: 'W1234', collDate: '2024-01-01', chapterId: 'CH01',
    }));

    (component as any).unitIdValue.set('W1234');
    (component as any).onUnitIdScan();
    tick();

    expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Unit already scanned');
    expect((component as any).unitSequences().length).toBe(1);
  }));

  it('should schedule tests successfully', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    (component as any).selectedTests.set([mockTestDto]);
    (component as any).unitSequences.set([
      { sequenceNumber: 1, unitId: 'W1234', collectionDate: '2024-01-01' },
    ]);
    atcApiServiceSpy.scheduleTests.and.returnValue(of({ testsScheduled: 1, unitsProcessed: 1 }));
    atcApiServiceSpy.getExistingTests.and.returnValue(of([]));
    (component as any).selectedUnitIndex.set(0);

    (component as any).onSchedule();
    tick();

    expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Tests Scheduled Successfully');
  }));



  it('should remove a unit from the list', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    (component as any).unitSequences.set([
      { sequenceNumber: 1, unitId: 'W1234', collectionDate: '2024-01-01' },
      { sequenceNumber: 2, unitId: 'W5678', collectionDate: '2024-01-02' },
    ]);
    (component as any).onUnitRowAction({ action: 'delete', row: { unitId: 'W1234', sequenceNumber: 1, collectionDate: '2024-01-01' } });

    expect((component as any).unitSequences().length).toBe(1);
    expect((component as any).unitSequences()[0].unitId).toBe('W5678');
    expect((component as any).unitSequences()[0].sequenceNumber).toBe(1);
  }));

  it('should clear all state', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    (component as any).selectedTests.set([mockTestDto]);
    (component as any).unitSequences.set([{ sequenceNumber: 1, unitId: 'W1234', collectionDate: '2024-01-01' }]);
    (component as any).onClearAll();

    expect((component as any).selectedTests().length).toBe(0);
    expect((component as any).unitSequences().length).toBe(0);
    expect((component as any).existingTests().length).toBe(0);
  }));

  it('should compute scheduleCount correctly', () => {
    fixture.detectChanges();

    (component as any).selectedTests.set([mockTestDto, { ...mockTestDto, testId: 'TEST002' }]);
    (component as any).unitSequences.set([
      { sequenceNumber: 1, unitId: 'W1', collectionDate: '2024-01-01' },
      { sequenceNumber: 2, unitId: 'W2', collectionDate: '2024-01-01' },
    ]);

    expect((component as any).scheduleCount()).toBe(4);
  });
});
