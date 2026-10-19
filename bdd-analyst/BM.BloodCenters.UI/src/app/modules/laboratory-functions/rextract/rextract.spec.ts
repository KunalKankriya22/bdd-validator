import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { RextractComponent } from './rextract';
import { RextractApiService } from './rextract-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService, createMockMatDialog, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  RextractContract,
  RextractBatchSummary,
  RextractBatchTest,
  RextractUnitDetail,
} from './rextract.model';

const mockContracts: RextractContract[] = [
  { contractId: 'MDWRG0097', company: 'Full Donor Profile', centerId: 'DAL' },
  { contractId: 'BOSR0042', company: 'Boston Regional Screen', centerId: 'BOS' },
];

const mockParameters = [
  { resultParmId: 'R8216336' },
];

const mockBatches: RextractBatchSummary[] = [
  { batchId: '0806-18-RG1001', unitCount: 5, insertDats: '2025-06-20T10:30:00', profileSetId: 'PS001', batchChapterId: 'CH01', profileSeqNo: 1 },
  { batchId: '0806-18-RG9032', unitCount: 16, insertDats: '2025-06-19T14:00:00', profileSetId: 'PS001', batchChapterId: 'CH01', profileSeqNo: 1 },
];

const mockBatchTests: RextractBatchTest[] = [
  { testId: 'NAT' },
  { testId: 'WNV' },
];

const mockRawUnits: RextractUnitDetail[] = [
  { batchTestId: '', unitId: 'W633311080613-Z', osUnitId: 'W633311080613-Z', testId: 'WNV', testSeqNo: 1, resultStatus1: 'No' },
  { batchTestId: '', unitId: 'W633311080613-Z', osUnitId: 'W633311080613-Z', testId: 'NAT', testSeqNo: 2, resultStatus1: 'No' },
];

describe('RextractComponent', () => {
  let component: RextractComponent;
  let fixture: ComponentFixture<RextractComponent>;
  let apiSpy: jasmine.SpyObj<RextractApiService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {

    apiSpy = jasmine.createSpyObj('RextractApiService', [
      'getContracts', 'getParameters', 'getBatches', 'getBatchTests', 'getBatchUnits', 'executeExtract'
    ]);
    snackbarSpy = createMockSnackbarService();
    dialogSpy = createMockMatDialog();

    const headerServiceMock = createMockHeaderService();

    apiSpy.getContracts.and.returnValue(of(mockContracts));
    apiSpy.getParameters.and.returnValue(of(mockParameters));
    apiSpy.getBatches.and.returnValue(of(mockBatches));
    apiSpy.getBatchTests.and.returnValue(of(mockBatchTests));
    apiSpy.getBatchUnits.and.returnValue(of(mockRawUnits));



      TestBed.configureTestingModule({
      imports: [RextractComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RextractApiService, useValue: apiSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerServiceMock },
      ]
    }).overrideComponent(RextractComponent, {
      add: { providers: [{ provide: MatDialog, useValue: dialogSpy }] }
    });


      apiSpy.getContracts.and.returnValue(of(mockContracts));


      apiSpy.getParameters.and.returnValue(of(mockParameters));


      apiSpy.getBatches.and.returnValue(of(mockBatches));


      apiSpy.getBatchTests.and.returnValue(of(mockBatchTests));


      apiSpy.getBatchUnits.and.returnValue(of(mockRawUnits));


    fixture = TestBed.createComponent(RextractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });




  it('should set error when contracts fail to load', () => {
    apiSpy.getContracts.and.returnValue(throwError(() => new Error('network')));
    const f = TestBed.createComponent(RextractComponent);
    f.detectChanges();
    expect(f.componentInstance['error']()).toContain('Failed to load contracts');
  });



  it('contractDescription should return company for the selected contract', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    expect(component['contractDescription']()).toBe('Full Donor Profile');
  });

  it('canRetrieve should be false when no contract and param are selected', () => {
    expect(component['canRetrieve']()).toBeFalse();
  });

  it('canRetrieve should be true when both contract and param are set', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    expect(component['canRetrieve']()).toBeTrue();
  });

  it('should load parameters when a contract is selected', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    expect(apiSpy.getParameters).toHaveBeenCalledWith('MDWRG0097');
    expect(component['parameters']()).toEqual(mockParameters);
    expect(component['parametersLoading']()).toBeFalse();
  });

  it('should set error when parameters fail to load', () => {
    apiSpy.getParameters.and.returnValue(throwError(() => new Error('network')));
    component['contractIdControl'].setValue('MDWRG0097');
    expect(component['error']()).toContain('Failed to load parameters');
  });

  it('should reset cascading state when contract selection is cleared', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    component['contractIdControl'].setValue('');
    expect(component['parameters']()).toEqual([]);
    expect(component['batches']()).toEqual([]);
    expect(component['units']()).toEqual([]);
  });

  it('onRetrieve should load batches for the selected contract and param', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    component['onRetrieve']();
    expect(apiSpy.getBatches).toHaveBeenCalledWith('MDWRG0097', 'R8216336');
    expect(component['batches']()).toEqual(mockBatches);
    expect(component['batchesLoading']()).toBeFalse();
  });

  it('onRetrieve should auto-select the first batch', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    component['onRetrieve']();
    expect(component['selectedBatch']()).toEqual(mockBatches[0]);
  });

  it('onRetrieve should set error when batches fail to load', () => {
    apiSpy.getBatches.and.returnValue(throwError(() => new Error('network')));
    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    component['onRetrieve']();
    expect(component['error']()).toContain('Failed to load batches');
  });

  it('onSelectBatch should update selectedBatch and call tests + units APIs', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    component['onSelectBatch'](mockBatches[1]);
    expect(component['selectedBatch']()).toEqual(mockBatches[1]);
    expect(apiSpy.getBatchTests).toHaveBeenCalledWith('0806-18-RG9032', 'MDWRG0097', 'PS001', 1);
    expect(apiSpy.getBatchUnits).toHaveBeenCalledWith('0806-18-RG9032', 'MDWRG0097', 'CH01', '2025-06-19T14:00:00');
    expect(component['units']().length).toBe(mockRawUnits.length);
  });





  it('batchTestCount should equal the number of batch tests returned', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    component['onSelectBatch'](mockBatches[0]);
    expect(component['batchTestCount']()).toBe(mockBatchTests.length);
  });

  // --- ngOnInit / lifecycle ---

  it('should load contracts on init', () => {
    expect(apiSpy.getContracts).toHaveBeenCalled();
    expect(component['contracts']()).toEqual(mockContracts);
    expect(component['contractsLoading']()).toBeFalse();
  });

  it('should set filteredContracts to all contracts after load', () => {
    expect(component['filteredContracts']()).toEqual(mockContracts);
  });

  it('ngOnDestroy should complete the destroy$ subject', () => {
    const destroySpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  // --- pageHeaderConfig / unitColumns ---

  it('should have correct pageHeaderConfig title', () => {
    expect(component['pageHeaderConfig'].title).toBe('Re-Extract Test Results');
  });

  it('should have expected unitColumns', () => {
    expect(component['unitColumns']).toContain('unitId');
    expect(component['unitColumns']).toContain('testId');
    expect(component['unitColumns']).toContain('resultStatus1');
  });

  // --- Contract search / filter ---

  it('should filter contracts by contractId when search text is entered', () => {
    component['contractSearchCtrl'].setValue('MDWRG');
    expect(component['filteredContracts']().length).toBe(1);
    expect(component['filteredContracts']()[0].contractId).toBe('MDWRG0097');
  });

  it('should filter contracts by company name (case-insensitive)', () => {
    component['contractSearchCtrl'].setValue('boston');
    expect(component['filteredContracts']().length).toBe(1);
    expect(component['filteredContracts']()[0].company).toBe('Boston Regional Screen');
  });

  it('should return empty array when search text matches nothing', () => {
    component['contractSearchCtrl'].setValue('ZZZZZ');
    expect(component['filteredContracts']().length).toBe(0);
  });

  it('should return all contracts when search text is cleared', () => {
    component['contractSearchCtrl'].setValue('MDWRG');
    component['contractSearchCtrl'].setValue('');
    expect(component['filteredContracts']()).toEqual(mockContracts);
  });

  // --- paramIdControl enable/disable ---

  it('should enable paramIdControl when a contract is selected', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    expect(component['paramIdControl'].enabled).toBeTrue();
  });

  it('should disable paramIdControl when contract is cleared', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    component['contractIdControl'].setValue('');
    expect(component['paramIdControl'].disabled).toBeTrue();
  });

  // --- paramIdControl.valueChanges ---

  it('should update _paramId signal when paramIdControl changes', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    expect(component['_paramId']()).toBe('R8216336');
  });

  it('should set _paramId to empty string when paramIdControl value is null', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue(null as any);
    expect(component['_paramId']()).toBe('');
  });

  // --- contractDescription edge case ---

  it('contractDescription should return empty string when no contract matches', () => {
    component['_contractId'].set('NONEXISTENT');
    expect(component['contractDescription']()).toBe('');
  });

  // --- onRetrieve additional branches ---

  it('onRetrieve should not call getBatches when canRetrieve is false', () => {
    apiSpy.getBatches.calls.reset();
    component['onRetrieve']();
    expect(apiSpy.getBatches).not.toHaveBeenCalled();
  });

  it('onRetrieve should set hasResults to true', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    component['onRetrieve']();
    expect(component['hasResults']()).toBeTrue();
  });

  it('onRetrieve should clear previous batches and units before loading', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    component['onRetrieve']();
    // After resolve, batches should be the new ones
    expect(component['batches']()).toEqual(mockBatches);
    // units should be populated from auto-select of first batch
    expect(component['units']().length).toBeGreaterThan(0);
  });

  it('onRetrieve should not auto-select when batches are empty', () => {
    apiSpy.getBatches.and.returnValue(of([]));
    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    component['onRetrieve']();
    expect(component['batches']()).toEqual([]);
    expect(component['selectedBatch']()).toBeNull();
  });

  it('onRetrieve should clear error on start', () => {
    component['error'].set('previous error');
    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    component['onRetrieve']();
    expect(component['error']()).toBeNull();
  });

  // --- onSelectBatch additional ---

  it('onSelectBatch should merge batchTestId from tests into units', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    component['onSelectBatch'](mockBatches[0]);
    const units = component['units']();
    expect(units[0].batchTestId).toBe('NAT');
    expect(units[1].batchTestId).toBe('WNV');
  });

  it('onSelectBatch should set batchTestId to empty when tests array is shorter than units', () => {
    apiSpy.getBatchTests.and.returnValue(of([{ testId: 'NAT' }]));
    apiSpy.getBatchUnits.and.returnValue(of(mockRawUnits));
    component['contractIdControl'].setValue('MDWRG0097');
    component['onSelectBatch'](mockBatches[0]);
    const units = component['units']();
    expect(units[0].batchTestId).toBe('NAT');
    expect(units[1].batchTestId).toBe('');
  });

  it('onSelectBatch should show error snackbar on failure', () => {
    apiSpy.getBatchTests.and.returnValue(throwError(() => new Error('fail')));
    component['contractIdControl'].setValue('MDWRG0097');
    component['onSelectBatch'](mockBatches[0]);
    expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load batch details. Please try again.');
    expect(component['unitsLoading']()).toBeFalse();
  });

  it('onSelectBatch should reset units and batchTests before loading', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    component['onSelectBatch'](mockBatches[0]);
    // After successful load, units and batchTests should be populated
    expect(component['batchTests']().length).toBe(2);
    expect(component['units']().length).toBe(2);
  });

  // --- onClearAll ---

  it('onClearAll should reset contractSearchCtrl and contractIdControl', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    component['contractSearchCtrl'].setValue('MDWRG');
    component['onClearAll']();
    expect(component['contractSearchCtrl'].value).toBe('');
    expect(component['contractIdControl'].value).toBe('');
  });

  it('onClearAll should cascade-clear parameters, batches, and units', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    component['onRetrieve']();
    component['onClearAll']();
    expect(component['parameters']()).toEqual([]);
    expect(component['batches']()).toEqual([]);
    expect(component['units']()).toEqual([]);
    expect(component['selectedBatch']()).toBeNull();
    expect(component['hasResults']()).toBeFalse();
  });

  // --- onExtract edge cases ---

  it('onExtract should return early when no batch is selected', () => {
    component['selectedBatch'].set(null);
    component['onExtract']();
    expect(dialogSpy.open).not.toHaveBeenCalled();
  });

  it('onExtract should return early when already extracting', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    component['onSelectBatch'](mockBatches[0]);
    component['extracting'].set(true);
    component['onExtract']();
    expect(dialogSpy.open).not.toHaveBeenCalled();
  });

  it('onExtract should open dialog with correct data', () => {
    dialogSpy.open.and.returnValue({
      afterClosed: () => of(undefined)
    } as any);
    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    component['onSelectBatch'](mockBatches[0]);
    component['onExtract']();
    expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining({
      width: '560px',
      disableClose: true,
      data: jasmine.objectContaining({
        contractId: 'MDWRG0097',
        resultParmId: 'R8216336',
      }),
    }));
  });

  it('onExtract should not call executeExtract when dialog is cancelled (undefined result)', () => {
    dialogSpy.open.and.returnValue({
      afterClosed: () => of(undefined)
    } as any);
    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    component['onSelectBatch'](mockBatches[0]);
    apiSpy.executeExtract.calls.reset();
    component['onExtract']();
    expect(apiSpy.executeExtract).not.toHaveBeenCalled();
  });

  it('onExtract should not call executeExtract when dialog result has success false', () => {
    dialogSpy.open.and.returnValue({
      afterClosed: () => of({ success: false })
    } as any);
    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    component['onSelectBatch'](mockBatches[0]);
    apiSpy.executeExtract.calls.reset();
    component['onExtract']();
    expect(apiSpy.executeExtract).not.toHaveBeenCalled();
  });

  // --- executeExtract additional paths ---

  it('should call executeExtract and show success snackbar on successful extraction', () => {
    dialogSpy.open.and.returnValue({
      afterClosed: () => of({ success: true, extractDate: '2026-06-15T14:30:00.000Z', generateRsmReport: true })
    } as any);
    apiSpy.executeExtract.and.returnValue(of({
      success: true, item: true, message: 'Re-extraction executed successfully.', statusCode: 200
    }));
    apiSpy.getBatches.and.returnValue(of(mockBatches));

    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    component['onSelectBatch'](mockBatches[0]);
    component['onExtract']();

    expect(apiSpy.executeExtract).toHaveBeenCalledWith(jasmine.objectContaining({
      contractId: 'MDWRG0097',
      resultParmId: 'R8216336',
      rsmAutoReport: 'Y',
    }));
    expect(snackbarSpy.showSuccess).toHaveBeenCalled();
  });

  it('should send rsmAutoReport as N when generateRsmReport is false', () => {
    dialogSpy.open.and.returnValue({
      afterClosed: () => of({ success: true, extractDate: '2026-06-15T14:30:00.000Z', generateRsmReport: false })
    } as any);
    apiSpy.executeExtract.and.returnValue(of({
      success: true, item: true, message: 'OK', statusCode: 200
    }));

    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    component['onSelectBatch'](mockBatches[0]);
    component['onExtract']();

    expect(apiSpy.executeExtract).toHaveBeenCalledWith(jasmine.objectContaining({
      rsmAutoReport: 'N',
    }));
  });

  it('should show error snackbar when executeExtract response has success false', () => {
    dialogSpy.open.and.returnValue({
      afterClosed: () => of({ success: true, extractDate: '2026-06-15T14:30:00.000Z', generateRsmReport: true })
    } as any);
    apiSpy.executeExtract.and.returnValue(of({
      success: false, statusCode: 400, errors: [{ code: 'ERR', message: 'Extraction blocked.' }]
    }));

    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    component['onSelectBatch'](mockBatches[0]);
    component['onExtract']();

    expect(snackbarSpy.showError).toHaveBeenCalledWith('Extraction blocked.');
    expect(component['extracting']()).toBeFalse();
  });

  it('should show default error message when executeExtract response has no errors array', () => {
    dialogSpy.open.and.returnValue({
      afterClosed: () => of({ success: true, extractDate: '2026-06-15T14:30:00.000Z', generateRsmReport: true })
    } as any);
    apiSpy.executeExtract.and.returnValue(of({
      success: false, statusCode: 500
    }));

    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    component['onSelectBatch'](mockBatches[0]);
    component['onExtract']();

    expect(snackbarSpy.showError).toHaveBeenCalledWith('Re-extraction failed.');
  });

  it('should show error snackbar when executeExtract call fails with network error', () => {
    dialogSpy.open.and.returnValue({
      afterClosed: () => of({ success: true, extractDate: '2026-06-15T14:30:00.000Z', generateRsmReport: true })
    } as any);
    apiSpy.executeExtract.and.returnValue(throwError(() => ({ error: { message: 'Server unavailable' } })));

    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    component['onSelectBatch'](mockBatches[0]);
    component['onExtract']();

    expect(snackbarSpy.showError).toHaveBeenCalledWith('Server unavailable');
    expect(component['extracting']()).toBeFalse();
  });

  it('should show default error message when executeExtract network error has no message', () => {
    dialogSpy.open.and.returnValue({
      afterClosed: () => of({ success: true, extractDate: '2026-06-15T14:30:00.000Z', generateRsmReport: true })
    } as any);
    apiSpy.executeExtract.and.returnValue(throwError(() => ({})));

    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    component['onSelectBatch'](mockBatches[0]);
    component['onExtract']();

    expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to submit for re-extraction.');
    expect(component['extracting']()).toBeFalse();
  });

  it('should refresh batches after successful extraction', () => {
    dialogSpy.open.and.returnValue({
      afterClosed: () => of({ success: true, extractDate: '2026-06-15T14:30:00.000Z', generateRsmReport: true })
    } as any);
    apiSpy.executeExtract.and.returnValue(of({
      success: true, item: true, message: 'OK', statusCode: 200
    }));

    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    component['onSelectBatch'](mockBatches[0]);
    apiSpy.getBatches.calls.reset();
    component['onExtract']();

    // onRetrieve is called after success, which calls getBatches
    expect(apiSpy.getBatches).toHaveBeenCalledWith('MDWRG0097', 'R8216336');
  });

  // --- contractIdControl.valueChanges clears error ---

  it('should clear error when contract changes', () => {
    component['error'].set('some error');
    component['contractIdControl'].setValue('MDWRG0097');
    expect(component['error']()).toBeNull();
  });

  it('should set _contractId and reset _paramId when contract changes', () => {
    component['contractIdControl'].setValue('MDWRG0097');
    component['paramIdControl'].setValue('R8216336');
    component['contractIdControl'].setValue('BOSR0042');
    expect(component['_contractId']()).toBe('BOSR0042');
    expect(component['_paramId']()).toBe('');
  });

  it('should set _contractId to empty when contractIdControl value is null', () => {
    component['contractIdControl'].setValue(null as any);
    expect(component['_contractId']()).toBe('');
  });

});
