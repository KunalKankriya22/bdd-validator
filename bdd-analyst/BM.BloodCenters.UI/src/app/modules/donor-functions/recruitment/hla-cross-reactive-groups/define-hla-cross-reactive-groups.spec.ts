import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { DefineHLACrossReactiveGroups } from './define-hla-cross-reactive-groups';
import { HlaCrossReactiveGroupsService } from './services/hla-cross-reactive-groups.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { HlaCrossReactiveGroupModel, HlaCrossReactiveGroupFilterValue } from './models/hla-cross-reactive-groups.model';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('DefineHLACrossReactiveGroups', () => {
  let component: DefineHLACrossReactiveGroups;
  let fixture: ComponentFixture<DefineHLACrossReactiveGroups>;
  let serviceSpy: jasmine.SpyObj<HlaCrossReactiveGroupsService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockGroups: HlaCrossReactiveGroupModel[] = [
    {
      publicEpitopeId: 'A1',
      description: 'A1 Pel-Freeze',
      publicEpitopeDescription: 'A1 Pel-Freeze',
      associatedEpitopeId: '187',
      hlaStandard: 'AABB',
      effectiveDate: '2024-01-01',
      terminationDate: undefined
    },
    {
      publicEpitopeId: 'A1',
      description: 'A1 Pel-Freeze',
      publicEpitopeDescription: 'A1 Pel-Freeze',
      associatedEpitopeId: '366',
      hlaStandard: 'AABB',
      effectiveDate: '2024-02-01',
      terminationDate: '2025-12-31'
    }
  ];

  const chapterChanged$ = new Subject<void>();

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('HlaCrossReactiveGroupsService', [
      'getHlaCrossReactiveGroups',
      'getPublicEpitopes',
      'getHlaStandardsFromMasterCode',
      'getHlaStandardsFromEpitopes',
      'getAssociatedEpitopes'
    ]);
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({
        title: 'Define HLA Cross-Reactive Groups',
        subtitle: 'Manage HLA epitope cross-reactive groups'
      })
    });
    headerServiceSpy = createMockHeaderService();

    serviceSpy.getHlaCrossReactiveGroups.and.returnValue(
      of({ data: mockGroups, total: 2 })
    );
    serviceSpy.getPublicEpitopes.and.returnValue(
      of([
        { code: 'A1', description: 'A1 Pel-Freeze' },
        { code: 'A2', description: 'A2 Pel-Freeze' }
      ])
    );
    serviceSpy.getHlaStandardsFromMasterCode.and.returnValue(
      of([
        { code: 'AABB', description: 'AABB - Standard' },
        { code: 'CREG', description: 'CREG - Standard' }
      ])
    );
    serviceSpy.getHlaStandardsFromEpitopes.and.returnValue(
      of([
        { code: 'AABB', description: 'AABB - Standard' },
        { code: 'CREG', description: 'CREG - Standard' }
      ])
    );
    serviceSpy.getAssociatedEpitopes.and.returnValue(
      of([
        { locus: 'A', epitopeId: '1' },
        { locus: 'A', epitopeId: '2' },
        { locus: 'B', epitopeId: '5' }
      ])
    );



      TestBed.configureTestingModule({
      imports: [
        DefineHLACrossReactiveGroups,
        TranslateModule.forRoot()
      ],
      providers: [
        provideNoopAnimations(),
        { provide: HlaCrossReactiveGroupsService, useValue: serviceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ActivatedRoute, useValue: {} }
      ]
    });


    


      serviceSpy.getHlaCrossReactiveGroups.calls.reset();


      serviceSpy.getPublicEpitopes.calls.reset();


      serviceSpy.getHlaStandardsFromMasterCode.calls.reset();


      serviceSpy.getHlaStandardsFromEpitopes.calls.reset();


      serviceSpy.getAssociatedEpitopes.calls.reset();


    fixture = TestBed.createComponent(DefineHLACrossReactiveGroups);
    component = fixture.componentInstance;


    });
  describe('Search Functionality', () => {
    it('should load data with search keyword', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSearch('A1');
      tick();

      expect(serviceSpy.getHlaCrossReactiveGroups).toHaveBeenCalledWith(
        25,
        0,
        jasmine.objectContaining({ searchKeyword: 'A1' })
      );
    }));


  });
  describe('Filter Functionality', () => {


    it('should apply filters and load data', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const filters: HlaCrossReactiveGroupFilterValue = {
        hlaStandard: 'AABB',
        effectivePeriod: 'AFTER'
      };

      component.applyFilters(filters);
      tick();

      expect(component.appliedFilters).toEqual(filters);
      expect(serviceSpy.getHlaCrossReactiveGroups).toHaveBeenCalled();
    }));






  });

  describe('Side Panel - Create Record', () => {


    it('should reload data after successful create', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const initialCalls = serviceSpy.getHlaCrossReactiveGroups.calls.count();
      component.sidePanelOpen = true;
      component.onSaveSuccess();
      tick();

      expect(serviceSpy.getHlaCrossReactiveGroups.calls.count()).toBe(initialCalls + 1);
    }));

    it('should override panel state when creating new record', () => {
      component.sidePanelOpen = true;
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockGroups[0];

      component.createRecord();

      // Should switch to add mode
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBe(true);
    });
  });

  describe('Side Panel - Edit Record', () => {
    it('should open side panel in edit mode', () => {
      const rowAction = { action: 'edit', row: mockGroups[0] };

      component.onRowAction(rowAction);

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockGroups[0]);
    });

    it('should reload data after successful edit', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const initialCalls = serviceSpy.getHlaCrossReactiveGroups.calls.count();
      component.sidePanelOpen = true;
      component.onSaveSuccess();
      tick();

      expect(serviceSpy.getHlaCrossReactiveGroups.calls.count()).toBe(initialCalls + 1);
    }));
  });
  describe('Date Formatting', () => {
    it('should format date as DD-MON-YYYY', () => {
      const formatted = component['formatDate']('2024-01-15');
      expect(formatted).toBe('15-JAN-2024');
    });




  });

  describe('Table Configuration', () => {
    it('should have correct column definitions', () => {
      expect(component.tableConfig.columns.length).toBe(6);
      expect(component.tableConfig.columns[0].key).toBe('publicEpitopeId');
      expect(component.tableConfig.columns[1].key).toBe('description');
      expect(component.tableConfig.columns[2].key).toBe('associatedEpitopeId');
      expect(component.tableConfig.columns[3].key).toBe('hlaStandard');
      expect(component.tableConfig.columns[4].key).toBe('effectiveDate');
      expect(component.tableConfig.columns[5].key).toBe('terminationDate');
    });






  });
});
