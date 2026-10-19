import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DistributionMasterCodesDialogService } from './distribution-master-codes-dialog.service';
import { AddUpdateDistributionMasterCodes } from '../add-update-distribution-master-codes/add-update-distribution-master-codes';
import { MasterCodeListItem } from './distribution-master-codes.service';

describe('DistributionMasterCodesDialogService', () => {
  let service: DistributionMasterCodesDialogService;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddUpdateDistributionMasterCodes>>;

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue(mockDialogRef);
    TestBed.configureTestingModule({
      providers: [
        DistributionMasterCodesDialogService,
        { provide: MatDialog, useValue: dialogSpy },
      ],
    });
    service = TestBed.inject(DistributionMasterCodesDialogService);
  });

  it('openAddDialog opens dialog with mode "add" and right-side positioning', () => {
    service.openAddDialog();

    const [component, config] = dialogSpy.open.calls.mostRecent().args;
    expect(component).toBe(AddUpdateDistributionMasterCodes);
    expect(config.data.mode).toBe('add');
    expect(config.position).toEqual({ right: '0', top: '64px' });
    expect(config.panelClass).toBe('right-side-dialog');
  });

  it('openEditDialog passes row data with mode "edit" and maps nullable fields', () => {
    const row = {
      codeType: 'CT1', description: 'Desc', effDate: null,
      termDate: '2024-12-31', lastModifiedDate: '2024-01-01',
      numericalValue: null,
    };

    service.openEditDialog(row as any);

    const config = dialogSpy.open.calls.mostRecent().args[1];
    expect(config.data.mode).toBe('edit');
    expect(config.data.codeType).toBe('CT1');
    expect(config.data.effDate).toBeUndefined();
    expect(config.data.numericalValue).toBeUndefined();
    expect(config.data.termDate).toBe('2024-12-31');
  });

  describe('openAddDialog', () => {
    it('should return a MatDialogRef', () => {
      const result = service.openAddDialog();
      expect(result).toBe(mockDialogRef);
    });

    it('should open dialog with correct width', () => {
      service.openAddDialog();
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.width).toBe('600px');
    });

    it('should open dialog with correct height', () => {
      service.openAddDialog();
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.height).toBe('calc(100vh - 64px)');
    });

    it('should open dialog with correct maxWidth', () => {
      service.openAddDialog();
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.maxWidth).toBe('90vw');
    });

    it('should open dialog with disableClose set to false', () => {
      service.openAddDialog();
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.disableClose).toBe(false);
    });

    it('should open dialog with ariaLabel "Add New Code Type"', () => {
      service.openAddDialog();
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.ariaLabel).toBe('Add New Code Type');
    });

    it('should not include edit-specific data fields in add mode', () => {
      service.openAddDialog();
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.data.codeType).toBeUndefined();
      expect(config.data.description).toBeUndefined();
      expect(config.data.effDate).toBeUndefined();
    });

    it('should call dialog.open exactly once', () => {
      service.openAddDialog();
      expect(dialogSpy.open).toHaveBeenCalledTimes(1);
    });
  });

  describe('openEditDialog', () => {
    const fullRow: MasterCodeListItem = {
      codeType: 'BLDTYP',
      description: 'Blood Type',
      changeControlFlag: 'Y',
      numericalValue: 42,
      sequence1: 1,
      sequence2: 2,
      sequence3: 3,
      effDate: new Date('2025-01-15'),
      termDate: new Date('2025-12-31'),
      lastModifiedDate: new Date('2025-06-01'),
      auditKey: 999,
      status: 'Active',
      isActive: true
    };

    it('should return a MatDialogRef', () => {
      const result = service.openEditDialog(fullRow);
      expect(result).toBe(mockDialogRef);
    });

    it('should open dialog with correct width', () => {
      service.openEditDialog(fullRow);
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.width).toBe('600px');
    });

    it('should open dialog with correct height', () => {
      service.openEditDialog(fullRow);
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.height).toBe('calc(100vh - 64px)');
    });

    it('should open dialog with correct maxWidth', () => {
      service.openEditDialog(fullRow);
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.maxWidth).toBe('90vw');
    });

    it('should open dialog with disableClose set to false', () => {
      service.openEditDialog(fullRow);
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.disableClose).toBe(false);
    });

    it('should open dialog with ariaLabel "Edit Code Type"', () => {
      service.openEditDialog(fullRow);
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.ariaLabel).toBe('Edit Code Type');
    });

    it('should open dialog with right-side positioning', () => {
      service.openEditDialog(fullRow);
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.position).toEqual({ right: '0', top: '64px' });
      expect(config.panelClass).toBe('right-side-dialog');
    });

    it('should pass non-null effDate through as-is', () => {
      service.openEditDialog(fullRow);
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.data.effDate).toEqual(new Date('2025-01-15'));
    });

    it('should pass non-null numericalValue through as-is', () => {
      service.openEditDialog(fullRow);
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.data.numericalValue).toBe(42);
    });

    it('should convert null effDate to undefined via nullish coalescing', () => {
      const rowWithNullEffDate: MasterCodeListItem = {
        ...fullRow,
        effDate: null
      };

      service.openEditDialog(rowWithNullEffDate);
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.data.effDate).toBeUndefined();
    });

    it('should convert null numericalValue to undefined via nullish coalescing', () => {
      const rowWithNullNumerical: MasterCodeListItem = {
        ...fullRow,
        numericalValue: null
      };

      service.openEditDialog(rowWithNullNumerical);
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.data.numericalValue).toBeUndefined();
    });

    it('should pass description from row', () => {
      service.openEditDialog(fullRow);
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.data.description).toBe('Blood Type');
    });

    it('should pass termDate from row', () => {
      service.openEditDialog(fullRow);
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.data.termDate).toEqual(new Date('2025-12-31'));
    });

    it('should pass lastModifiedDate from row', () => {
      service.openEditDialog(fullRow);
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.data.lastModifiedDate).toEqual(new Date('2025-06-01'));
    });

    it('should pass null termDate when row has null termDate', () => {
      const rowWithNullTerm: MasterCodeListItem = {
        ...fullRow,
        termDate: null
      };

      service.openEditDialog(rowWithNullTerm);
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.data.termDate).toBeNull();
    });

    it('should use AddUpdateDistributionMasterCodes component', () => {
      service.openEditDialog(fullRow);
      const component = dialogSpy.open.calls.mostRecent().args[0];
      expect(component).toBe(AddUpdateDistributionMasterCodes);
    });

    it('should call dialog.open exactly once', () => {
      service.openEditDialog(fullRow);
      expect(dialogSpy.open).toHaveBeenCalledTimes(1);
    });
  });
});
