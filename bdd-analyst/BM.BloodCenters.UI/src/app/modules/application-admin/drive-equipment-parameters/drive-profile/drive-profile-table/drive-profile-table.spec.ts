import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DriveProfileTable } from './drive-profile-table';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';
import { HeaderService } from '@shared/services/header.service';
import { DriveProfileModel } from '../../models/drive-equipment-parameters.model';
import { createMockTranslateService } from '@shared/testing/common-mocks';

describe('DriveProfileTable', () => {
  let component: DriveProfileTable;
  let fixture: ComponentFixture<DriveProfileTable>;
  let mockService: jasmine.SpyObj<DriveEquipmentParametersService>;
  let mockHeaderService: any;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DriveEquipmentParametersService', [
      'getDriveProfiles',
      'createDriveProfile',
      'updateDriveProfile',
      'deleteDriveProfile',
      'getDriveProfileTypes',
      'getCodes',
      'getDeviceTypes'
    ]);

    mockHeaderService = {
      chapterTimeZone: signal('America/Los_Angeles'),
      chapterChanged$: new Subject()
    };
    mockTranslateService = createMockTranslateService();

    // Setup default return values
    mockService.getDriveProfiles.and.returnValue(of({ data: [], totalRecords: 0 }));
    mockService.getDriveProfileTypes.and.returnValue(of([]));
    mockService.getCodes.and.returnValue(of([]));
    mockService.getDeviceTypes.and.returnValue(of(['EQUIP', 'SUPLY']));



      TestBed.configureTestingModule({
      imports: [
        DriveProfileTable,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        { provide: DriveEquipmentParametersService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    });


    


      mockService.getDriveProfiles.calls.reset();


      mockService.createDriveProfile.calls.reset();


      mockService.updateDriveProfile.calls.reset();


      mockService.deleteDriveProfile.calls.reset();


      mockService.getDriveProfileTypes.calls.reset();


      mockService.getCodes.calls.reset();


      mockService.getDeviceTypes.calls.reset();


      mockService.getDriveProfiles.and.returnValue(of({ data: [], totalRecords: 0 }));


      mockService.getDriveProfileTypes.and.returnValue(of([]));


      mockService.getCodes.and.returnValue(of([]));


      mockService.getDeviceTypes.and.returnValue(of(['EQUIP', 'SUPLY']));


    fixture = TestBed.createComponent(DriveProfileTable);
    component = fixture.componentInstance;


    });
  describe('Table Column Formatting', () => {
    it('should apply date formatter to effectiveDate column', () => {
      fixture.detectChanges();

      const effectiveDateColumn = component.tableConfig.columns.find(col => col.key === 'effectiveDate');

      expect(effectiveDateColumn?.valueFormatter).toBeDefined();
      if (effectiveDateColumn?.valueFormatter) {
        const formatted = effectiveDateColumn.valueFormatter('2026-04-18', {} as DriveProfileModel);
        expect(formatted).toBe('18-APR-2026');
      }
    });

    it('should apply date formatter to terminationDate column', () => {
      fixture.detectChanges();

      const terminationDateColumn = component.tableConfig.columns.find(col => col.key === 'terminationDate');

      expect(terminationDateColumn?.valueFormatter).toBeDefined();
      if (terminationDateColumn?.valueFormatter) {
        const formatted = terminationDateColumn.valueFormatter('2026-12-31', {} as DriveProfileModel);
        expect(formatted).toBe('31-DEC-2026');
      }
    });
  });

  describe('Row Highlighting', () => {
    it('should pass sidePanelData to DataTable highlightedRow input', () => {
      const mockRecord: DriveProfileModel = {
        deviceType: 'EQUIP',
        driveProfileType: 'A',
        driveProfileTypeDescription: 'Type A',
        code: '001',
        codeDescription: 'Code 001',
        effectiveDate: '2026-01-01',
        terminationDate: '2026-12-31',
      };

      mockService.getDriveProfiles.and.returnValue(of({
        data: [mockRecord],
        totalRecords: 1
      }));

      fixture.detectChanges();

      // Initially no row highlighted (sidePanelData is null)
      expect(component.sidePanelData()).toBeNull();

      // Simulate edit action - this sets sidePanelData
      component['panelMode'].set('edit');
      component['panelData'].set(mockRecord);
      component['panelOpen'].set(true);
      fixture.detectChanges();

      // Verify sidePanelData is now set to the record
      expect(component.sidePanelData()).toBe(mockRecord);
    });

    it('should clear sidePanelData when panel is closed', () => {
      const mockRecord: DriveProfileModel = {
        deviceType: 'EQUIP',
        driveProfileType: 'A',
        driveProfileTypeDescription: 'Type A',
        code: '001',
        codeDescription: 'Code 001',
        effectiveDate: '2026-01-01',
        terminationDate: '2026-12-31',
      };

      // Set panel data
      component['panelMode'].set('edit');
      component['panelData'].set(mockRecord);
      component['panelOpen'].set(true);
      fixture.detectChanges();

      expect(component.sidePanelData()).toBe(mockRecord);

      // Close panel
      component.closeSidePanel();
      fixture.detectChanges();

      // Verify sidePanelData is cleared
      expect(component.sidePanelData()).toBeNull();
      expect(component.sidePanelOpen()).toBeFalse();
    });

    it('should clear sidePanelData when save succeeds', () => {
      const mockRecord: DriveProfileModel = {
        deviceType: 'EQUIP',
        driveProfileType: 'A',
        driveProfileTypeDescription: 'Type A',
        code: '001',
        codeDescription: 'Code 001',
        effectiveDate: '2026-01-01',
        terminationDate: '2026-12-31',
      };

      mockService.getDriveProfiles.and.returnValue(of({
        data: [mockRecord],
        totalRecords: 1
      }));

      // Set panel data
      component['panelMode'].set('edit');
      component['panelData'].set(mockRecord);
      component['panelOpen'].set(true);
      fixture.detectChanges();

      expect(component.sidePanelData()).toBe(mockRecord);

      // Simulate save success (closes panel and clears data)
      component.onSaveSuccess();
      fixture.detectChanges();

      // sidePanelData should be cleared
      expect(component.sidePanelData()).toBeNull();
      expect(component.sidePanelOpen()).toBeFalse();
    });
  });

});
