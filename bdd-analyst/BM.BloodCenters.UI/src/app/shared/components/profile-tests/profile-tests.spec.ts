import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { ProfileTestsComponent, ProfileTest, ProfileTestsData } from './profile-tests';

describe('ProfileTestsComponent', () => {
  let component: ProfileTestsComponent;
  let fixture: ComponentFixture<ProfileTestsComponent>;

  beforeEach(() => {



      TestBed.configureTestingModule({
      imports: [
        ProfileTestsComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
    });


    



    fixture = TestBed.createComponent(ProfileTestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Initialization', () => {
    it('should initialize with empty test arrays', () => {
      expect(component.tableData()).toEqual([]);
    });



    it('should configure table to show on empty', () => {
      const config = component.tableConfig;
      expect(config.showTableOnEmpty).toBe(true);
      expect(config.emptyMessage).toBe('No data available');
      expect(config.noDataIcon).toBe('science');
    });
  });

  describe('Input Setters', () => {
    it('should accept profile tests input', () => {
      const mockProfileTests: ProfileTest[] = [
        { testCode: 'T001', testName: 'Complete Blood Count' },
        { testCode: 'T002', testName: 'Blood Type' },
      ];

      component.profileTests = mockProfileTests;
      fixture.detectChanges();

      const tableData = component.tableData();
      expect(tableData.length).toBe(2);
      expect(tableData[0].profileTest).toBe('Complete Blood Count');
      expect(tableData[1].profileTest).toBe('Blood Type');
    });

    it('should accept additional tests input', () => {
      const mockAdditionalTests: ProfileTest[] = [
        { testCode: 'T101', testName: 'Glucose Level' },
        { testCode: 'T102', testName: 'Cholesterol' },
      ];

      component.additionalTests = mockAdditionalTests;
      fixture.detectChanges();

      const tableData = component.tableData();
      expect(tableData.length).toBe(2);
      expect(tableData[0].additionalTest).toBe('Glucose Level');
      expect(tableData[1].additionalTest).toBe('Cholesterol');
    });

    it('should handle null profile tests input', () => {
      component.profileTests = null as any;
      fixture.detectChanges();

      expect(component.tableData()).toEqual([]);
    });

    it('should handle null additional tests input', () => {
      component.additionalTests = null as any;
      fixture.detectChanges();

      expect(component.tableData()).toEqual([]);
    });

    it('should handle undefined profile tests input', () => {
      component.profileTests = undefined as any;
      fixture.detectChanges();

      expect(component.tableData()).toEqual([]);
    });
  });

  describe('Table Data Computation', () => {
    it('should create rows with profile and additional tests side by side', () => {
      const mockProfileTests: ProfileTest[] = [
        { testCode: 'T001', testName: 'Profile Test 1' },
        { testCode: 'T002', testName: 'Profile Test 2' },
      ];

      const mockAdditionalTests: ProfileTest[] = [
        { testCode: 'T101', testName: 'Additional Test 1' },
        { testCode: 'T102', testName: 'Additional Test 2' },
      ];

      component.profileTests = mockProfileTests;
      component.additionalTests = mockAdditionalTests;
      fixture.detectChanges();

      const tableData = component.tableData();
      expect(tableData.length).toBe(2);
      expect(tableData[0].profileTest).toBe('Profile Test 1');
      expect(tableData[0].additionalTest).toBe('Additional Test 1');
      expect(tableData[1].profileTest).toBe('Profile Test 2');
      expect(tableData[1].additionalTest).toBe('Additional Test 2');
    });

    it('should handle more profile tests than additional tests', () => {
      const mockProfileTests: ProfileTest[] = [
        { testCode: 'T001', testName: 'Profile Test 1' },
        { testCode: 'T002', testName: 'Profile Test 2' },
        { testCode: 'T003', testName: 'Profile Test 3' },
      ];

      const mockAdditionalTests: ProfileTest[] = [
        { testCode: 'T101', testName: 'Additional Test 1' },
      ];

      component.profileTests = mockProfileTests;
      component.additionalTests = mockAdditionalTests;
      fixture.detectChanges();

      const tableData = component.tableData();
      expect(tableData.length).toBe(3);
      expect(tableData[0].profileTest).toBe('Profile Test 1');
      expect(tableData[0].additionalTest).toBe('Additional Test 1');
      expect(tableData[1].profileTest).toBe('Profile Test 2');
      expect(tableData[1].additionalTest).toBe('');
      expect(tableData[2].profileTest).toBe('Profile Test 3');
      expect(tableData[2].additionalTest).toBe('');
    });

    it('should handle more additional tests than profile tests', () => {
      const mockProfileTests: ProfileTest[] = [
        { testCode: 'T001', testName: 'Profile Test 1' },
      ];

      const mockAdditionalTests: ProfileTest[] = [
        { testCode: 'T101', testName: 'Additional Test 1' },
        { testCode: 'T102', testName: 'Additional Test 2' },
        { testCode: 'T103', testName: 'Additional Test 3' },
      ];

      component.profileTests = mockProfileTests;
      component.additionalTests = mockAdditionalTests;
      fixture.detectChanges();

      const tableData = component.tableData();
      expect(tableData.length).toBe(3);
      expect(tableData[0].profileTest).toBe('Profile Test 1');
      expect(tableData[0].additionalTest).toBe('Additional Test 1');
      expect(tableData[1].profileTest).toBe('');
      expect(tableData[1].additionalTest).toBe('Additional Test 2');
      expect(tableData[2].profileTest).toBe('');
      expect(tableData[2].additionalTest).toBe('Additional Test 3');
    });

    it('should handle only profile tests without additional tests', () => {
      const mockProfileTests: ProfileTest[] = [
        { testCode: 'T001', testName: 'Profile Test 1' },
        { testCode: 'T002', testName: 'Profile Test 2' },
      ];

      component.profileTests = mockProfileTests;
      component.additionalTests = [];
      fixture.detectChanges();

      const tableData = component.tableData();
      expect(tableData.length).toBe(2);
      expect(tableData[0].profileTest).toBe('Profile Test 1');
      expect(tableData[0].additionalTest).toBe('');
      expect(tableData[1].profileTest).toBe('Profile Test 2');
      expect(tableData[1].additionalTest).toBe('');
    });

    it('should handle only additional tests without profile tests', () => {
      const mockAdditionalTests: ProfileTest[] = [
        { testCode: 'T101', testName: 'Additional Test 1' },
        { testCode: 'T102', testName: 'Additional Test 2' },
      ];

      component.profileTests = [];
      component.additionalTests = mockAdditionalTests;
      fixture.detectChanges();

      const tableData = component.tableData();
      expect(tableData.length).toBe(2);
      expect(tableData[0].profileTest).toBe('');
      expect(tableData[0].additionalTest).toBe('Additional Test 1');
      expect(tableData[1].profileTest).toBe('');
      expect(tableData[1].additionalTest).toBe('Additional Test 2');
    });

    it('should handle empty arrays for both test types', () => {
      component.profileTests = [];
      component.additionalTests = [];
      fixture.detectChanges();

      const tableData = component.tableData();
      expect(tableData).toEqual([]);
    });


  });

  describe('Table Configuration Updates', () => {
    it('should update table config when data changes', () => {
      const mockProfileTests: ProfileTest[] = [
        { testCode: 'T001', testName: 'Test 1' },
      ];

      component.profileTests = mockProfileTests;
      fixture.detectChanges();

      expect(component.tableData().length).toBe(1);
    });

    it('should maintain column configuration regardless of data', () => {
      component.profileTests = [];
      fixture.detectChanges();

      let config = component.tableConfig;
      expect(config.columns[0].width).toBe('50%');
      expect(config.columns[1].width).toBe('50%');

      component.profileTests = [{ testCode: 'T001', testName: 'Test 1' }];
      fixture.detectChanges();

      config = component.tableConfig;
      expect(config.columns[0].width).toBe('50%');
      expect(config.columns[1].width).toBe('50%');
    });
  });

  describe('Event Emission', () => {


    it('should emit closePanel event exactly once', () => {
      let emitCount = 0;
      component.closePanel.subscribe(() => emitCount++);

      component.onClose();

      expect(emitCount).toBe(1);
    });
  });
  describe('Large Data Sets', () => {
    it('should handle large number of profile tests', () => {
      const largeProfileTests: ProfileTest[] = Array.from({ length: 100 }, (_, i) => ({
        testCode: `T${i.toString().padStart(3, '0')}`,
        testName: `Profile Test ${i + 1}`,
      }));

      component.profileTests = largeProfileTests;
      fixture.detectChanges();

      const tableData = component.tableData();
      expect(tableData.length).toBe(100);
      expect(tableData[0].profileTest).toBe('Profile Test 1');
      expect(tableData[99].profileTest).toBe('Profile Test 100');
    });

    it('should handle large number of additional tests', () => {
      const largeAdditionalTests: ProfileTest[] = Array.from({ length: 50 }, (_, i) => ({
        testCode: `A${i.toString().padStart(3, '0')}`,
        testName: `Additional Test ${i + 1}`,
      }));

      component.additionalTests = largeAdditionalTests;
      fixture.detectChanges();

      const tableData = component.tableData();
      expect(tableData.length).toBe(50);
      expect(tableData[0].additionalTest).toBe('Additional Test 1');
      expect(tableData[49].additionalTest).toBe('Additional Test 50');
    });
  });

  describe('Edge Cases', () => {
    it('should handle test with empty name', () => {
      const mockTests: ProfileTest[] = [
        { testCode: 'T001', testName: '' },
      ];

      component.profileTests = mockTests;
      fixture.detectChanges();

      const tableData = component.tableData();
      expect(tableData[0].profileTest).toBe('');
    });

    it('should handle test with very long name', () => {
      const longName = 'A'.repeat(500);
      const mockTests: ProfileTest[] = [
        { testCode: 'T001', testName: longName },
      ];

      component.profileTests = mockTests;
      fixture.detectChanges();

      const tableData = component.tableData();
      expect(tableData[0].profileTest).toBe(longName);
      expect(tableData[0].profileTest.length).toBe(500);
    });

    it('should handle test with special characters in name', () => {
      const mockTests: ProfileTest[] = [
        { testCode: 'T001', testName: 'Test & <Special> "Characters"' },
      ];

      component.profileTests = mockTests;
      fixture.detectChanges();

      const tableData = component.tableData();
      expect(tableData[0].profileTest).toBe('Test & <Special> "Characters"');
    });
  });
});
