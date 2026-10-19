import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReLabelCodabarIsbtService } from './re-label-codabar-isbt.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('ReLabelCodabarIsbtService', () => {
  let service: ReLabelCodabarIsbtService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiSpy }],
    });

    service = TestBed.inject(ReLabelCodabarIsbtService);
  });

  describe('GET methods', () => {
    const mockResponse = { success: true };

    [
      // Static URL, no HttpParams
      { name: 'getProductCodes', invoke: () => service.getProductCodes(), url: API.RELABEL_CODABAR_ISBT.PRODUCT_CODES },
      { name: 'getAboValues', invoke: () => service.getAboValues(), url: API.RELABEL_CODABAR_ISBT.ABO_VALUES },
      { name: 'getCatalogNumbers', invoke: () => service.getCatalogNumbers(), url: API.RELABEL_CODABAR_ISBT.CATALOG_NUMBERS },
      { name: 'getSpecialTestingCodes', invoke: () => service.getSpecialTestingCodes(), url: API.RELABEL_CODABAR_ISBT.SPECIAL_TESTING_CODES },
      { name: 'getFacilityCodes', invoke: () => service.getFacilityCodes(), url: API.RELABEL_CODABAR_ISBT.FACILITY_CODES },
      // Dynamic URL (function call), no additional HttpParams
      { name: 'validateUnit', invoke: () => service.validateUnit('U1'), url: API.RELABEL_CODABAR_ISBT.VALIDATE_UNIT('U1') },
      { name: 'getIsbtProductCodeMapping', invoke: () => service.getIsbtProductCodeMapping('PC1', 'U1'), url: API.RELABEL_CODABAR_ISBT.ISBT_PRODUCT_CODE('PC1') },
      // Static URL with HttpParams
      { name: 'getComponents', invoke: () => service.getComponents('U1', '2024-01-01'), url: API.RELABEL_CODABAR_ISBT.COMPONENTS },
      { name: 'getUnitAttributes', invoke: () => service.getUnitAttributes('U1'), url: API.RELABEL_CODABAR_ISBT.UNIT_ATTRIBUTES },
      { name: 'getAboMapping', invoke: () => service.getAboMapping('SLD1', 'U1', '2024-01-01'), url: API.RELABEL_CODABAR_ISBT.ABO_MAPPING },
      { name: 'checkUserAccess', invoke: () => service.checkUserAccess('ACCESS1'), url: API.RELABEL_CODABAR_ISBT.CHECK_USER_ACCESS },
      { name: 'getLotNumbers', invoke: () => service.getLotNumbers('CAT1'), url: API.RELABEL_CODABAR_ISBT.LOT_NUMBERS },
      { name: 'getProductCodeDropdown', invoke: () => service.getProductCodeDropdown('U1'), url: API.RELABEL_CODABAR_ISBT.PRODUCT_CODE_DROPDOWN },
      { name: 'getUnitNotes', invoke: () => service.getUnitNotes('U1'), url: API.RELABEL_CODABAR_ISBT.UNIT_NOTES },
    ].forEach(({ name, invoke, url }) => {
      it(`${name} should delegate to apiService.get`, (done) => {
        apiSpy.get.and.returnValue(of(mockResponse));

        invoke().subscribe({
          next: (result: any) => {
            expect(result).toEqual(mockResponse);
            done();
          },
        });

        expect(apiSpy.get.calls.mostRecent().args[0]).toBe(url);
      });
    });
  });

  describe('POST methods', () => {
    const mockResponse = { success: true };
    const mockBody = { key: 'value' };

    [
      { name: 'validateComponent', invoke: () => service.validateComponent(mockBody as any), url: API.RELABEL_CODABAR_ISBT.VALIDATE_COMPONENT },
      { name: 'validateIsbtDetails', invoke: () => service.validateIsbtDetails(mockBody as any), url: API.RELABEL_CODABAR_ISBT.VALIDATE_ISBT_DETAILS },
      { name: 'verifyLabel', invoke: () => service.verifyLabel(mockBody as any), url: API.RELABEL_CODABAR_ISBT.VERIFY_LABEL },
      { name: 'relabelCommit', invoke: () => service.relabelCommit(mockBody as any), url: API.RELABEL_CODABAR_ISBT.RELABEL_COMMIT },
      { name: 'printLabel', invoke: () => service.printLabel(mockBody as any), url: API.RELABEL_CODABAR_ISBT.PRINT_LABEL },
      { name: 'relabel', invoke: () => service.relabel(mockBody as any), url: API.RELABEL_CODABAR_ISBT.RELABEL },
      { name: 'addUnitNote', invoke: () => service.addUnitNote('U1', mockBody as any), url: API.RELABEL_CODABAR_ISBT.UNIT_NOTES },
    ].forEach(({ name, invoke, url }) => {
      it(`${name} should delegate to apiService.post`, (done) => {
        apiSpy.post.and.returnValue(of(mockResponse));

        invoke().subscribe({
          next: (result: any) => {
            expect(result).toEqual(mockResponse);
            done();
          },
        });

        expect(apiSpy.post.calls.mostRecent().args[0]).toBe(url);
      });
    });
  });

  describe('DELETE methods', () => {
    it('deleteUnitNote should delegate to apiService.delete', (done) => {
      const mockResponse = { success: true };
      apiSpy.delete.and.returnValue(of(mockResponse));

      service.deleteUnitNote('U1', 123).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse as any);
          done();
        },
      });

      expect(apiSpy.delete.calls.mostRecent().args[0]).toBe(
        API.RELABEL_CODABAR_ISBT.UNIT_NOTES_DELETE(123),
      );
    });
  });
});
