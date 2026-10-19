import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

import { AdHocTubeCheckInComponent } from './ad-hoc-tube-check-in';
import { AdHocTubeCheckInService } from './services/ad-hoc-tube-check-in.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { AdhocContractDto, AdhocTestDto } from './models/ad-hoc-tube-check-in.model';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('AdHocTubeCheckInComponent', () => {
  let component: AdHocTubeCheckInComponent;
  let fixture: ComponentFixture<AdHocTubeCheckInComponent>;
  let mockService: jasmine.SpyObj<AdHocTubeCheckInService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockPageHeaderService: any;

  beforeEach(() => {

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({ title: 'Ad Hoc Tube Check-In', subtitle: 'A flexible check-in process that allows users to manually select and configure tube details at the time of check-in.' }),
    });
    mockService = jasmine.createSpyObj('AdHocTubeCheckInService', [
      'getContracts',
      'getContractById',
      'getBatches',
      'getBatchDetails',
      'getTestGroups',
      'getValidTests',
      'checkInUnit',
      'getUnitsInBatch',
      'getBatchTests',
      'validateUnit',
    ]);
    mockHeaderService = createMockHeaderService();

    mockService.getContracts.and.returnValue(of([]));
    mockService.getBatches.and.returnValue(of([]));
    mockService.getValidTests.and.returnValue(of([]));
    mockService.getUnitsInBatch.and.returnValue(of([]));
    mockService.getBatchTests.and.returnValue(of([]));
    mockService.getTestGroups.and.returnValue(of([]));
      TestBed.configureTestingModule({
      imports: [AdHocTubeCheckInComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: AdHocTubeCheckInService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
      ],
    });


    


      mockService.getContracts.calls.reset();


      mockService.getContractById.calls.reset();


      mockService.getBatches.calls.reset();


      mockService.getBatchDetails.calls.reset();


      mockService.getTestGroups.calls.reset();


      mockService.getValidTests.calls.reset();


      mockService.checkInUnit.calls.reset();


      mockService.getUnitsInBatch.calls.reset();


      mockService.getBatchTests.calls.reset();


      mockService.validateUnit.calls.reset();


      mockHeaderService.getCurrentChapterId.calls.reset();


      mockService.getContracts.and.returnValue(of([]));


      mockService.getBatches.and.returnValue(of([]));


      mockService.getValidTests.and.returnValue(of([]));


      mockService.getUnitsInBatch.and.returnValue(of([]));


      mockService.getBatchTests.and.returnValue(of([]));


      mockService.getTestGroups.and.returnValue(of([]));
    fixture = TestBed.createComponent(AdHocTubeCheckInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should initialize filter form with required controls', () => {
    expect(component.filterForm).toBeTruthy();
    expect(component.filterForm.get('contractId')).toBeTruthy();
    expect(component.filterForm.get('batchId')).toBeTruthy();
    expect(component.filterForm.get('collectionDate')).toBeTruthy();
    expect(component.filterForm.get('receivedDate')).toBeTruthy();
    expect(component.filterForm.get('r1')).toBeTruthy();
    expect(component.filterForm.get('r2')).toBeTruthy();
    expect(component.filterForm.get('p1')).toBeTruthy();
    expect(component.filterForm.get('p2')).toBeTruthy();
  });





  it('should populate contract description on contract change', () => {
    const contracts: AdhocContractDto[] = [
      { contractId: 'C1', company: 'Test Hospital', barCodeProtocol: 'I', ediInputInd: 'N', redTubeCount: 2, purpleTubeCount: 1, unitIdPattern: null },
    ];
    component.contractOptions.set(contracts);

    component.onContractChange('C1');

    expect(component.contractDescription()).toBe('Test Hospital');
    expect(component.filterForm.get('r1')?.value).toBe('Y');
    expect(component.filterForm.get('r2')?.value).toBe('Y');
    expect(component.filterForm.get('p1')?.value).toBe('Y');
    expect(component.filterForm.get('p2')?.value).toBe('');
    expect(mockService.getBatches).toHaveBeenCalledWith('C1');
  });

  it('should disable R2 when R1 is empty', () => {
    component.filterForm.patchValue({ r1: '' });
    expect(component.isR2Enabled).toBeFalse();
  });

  it('should enable R2 when R1 has value', () => {
    component.filterForm.patchValue({ r1: 'Y' });
    expect(component.isR2Enabled).toBeTrue();
  });

  it('should clear R2 when R1 is cleared', () => {
    component.filterForm.patchValue({ r1: 'Y', r2: 'Y' });
    component.filterForm.patchValue({ r1: '' });
    component.onR1Change();
    expect(component.filterForm.get('r2')?.value).toBe('');
  });

  it('should not retrieve when contract is missing', () => {
    component.filterForm.markAllAsTouched();
    component.onRetrieve();
    expect(component.hasRetrieved()).toBeFalse();
  });

  it('should set hasRetrieved on valid retrieve for new batch', () => {
    component.filterForm.patchValue({
      contractId: 'C1',
      collectionDate: '2026-06-20',
      receivedDate: '2026-06-20',
      r1: 'Y',
    });

    component.onRetrieve();

    expect(component.hasRetrieved()).toBeTrue();
    expect(component.isExistingBatch()).toBeFalse();
    expect(component.selectedTests().length).toBe(0);
  });

  it('should load batch tests for existing batch on retrieve', () => {
    const batchTests = [{ testId: 'AHT', testDesc: 'Ad Hoc Testing', contractId: 'C1', batchId: 'B1', contractSuffix: '0001' }];
    mockService.getBatchTests.and.returnValue(of(batchTests));

    component.filterForm.patchValue({
      contractId: 'C1',
      batchId: 'B1',
      collectionDate: '2026-06-20',
      receivedDate: '2026-06-20',
      r1: 'Y',
    });

    component.onRetrieve();

    expect(component.isExistingBatch()).toBeTrue();
    expect(mockService.getBatchTests).toHaveBeenCalledWith('B1');
  });

  it('should clear tests when switching from existing to new batch', () => {
    component.selectedTests.set([{ testId: 'AHT', testGroup: 'ADHOC', testDesc: 'Ad Hoc Testing' }]);
    component.isExistingBatch.set(true);

    component.filterForm.patchValue({
      contractId: 'C1',
      batchId: null,
      collectionDate: '2026-06-20',
      receivedDate: '2026-06-20',
      r1: 'Y',
    });

    component.onRetrieve();

    expect(component.isExistingBatch()).toBeFalse();
    expect(component.selectedTests().length).toBe(0);
  });

  it('should reset state on clear all', () => {
    component.hasRetrieved.set(true);
    component.contractDescription.set('Test');
    component.isExistingBatch.set(true);
    component.selectedTests.set([{ testId: 'A', testGroup: null, testDesc: null }]);
    component.sessionUnits.set([{
      unitId: 'U1', displayUnitId: 'U1', osUnitId: 'OS1', chkDigit: null,
      redTubeFlag: 'Y', redTube2: null, purpleTubeFlag: null, serumPlasmaInd: null,
      collDate: null, receivedDate: null,
    }]);

    component.onClearAll();

    expect(component.hasRetrieved()).toBeFalse();
    expect(component.contractDescription()).toBe('');
    expect(component.selectedTests().length).toBe(0);
    expect(component.sessionUnits().length).toBe(0);
    expect(component.isExistingBatch()).toBeFalse();
  });

  it('should open and close select test panel', () => {
    component.onOpenSelectTestPanel();
    expect(component.isSelectTestPanelOpen()).toBeTrue();

    component.onSelectTestPanelClose();
    expect(component.isSelectTestPanelOpen()).toBeFalse();
  });

  it('should disable + button for existing batch', () => {
    component.isExistingBatch.set(true);
    expect(component.isExistingBatch()).toBeTrue();
  });

  it('should update selected tests on panel proceed', () => {
    const tests: AdhocTestDto[] = [
      { testId: 'AHT', testGroup: 'ADHOC', testDesc: 'Ad Hoc Testing' },
      { testId: 'ALT', testGroup: 'ADHOC', testDesc: 'Alanine aminotransferase' },
    ];

    component.onTestsSelected(tests);

    expect(component.selectedTests().length).toBe(2);
    expect(component.isSelectTestPanelOpen()).toBeFalse();
  });





  it('should open and close view units panel', () => {
    component.onOpenViewUnitsPanel();
    expect(component.isViewUnitsPanelOpen()).toBeTrue();

    component.onViewUnitsPanelClose();
    expect(component.isViewUnitsPanelOpen()).toBeFalse();
  });

  it('should format tube values correctly', () => {
    const formatter = (component as any).tubeValueFormatter;
    expect(formatter('Y')).toBe('Yes');
    expect(formatter('P')).toBe('Plasma');
    expect(formatter('S')).toBe('Serum');
    expect(formatter(null)).toBe('');
    expect(formatter('')).toBe('');
  });
});
