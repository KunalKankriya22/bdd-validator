import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { SerMolConfirmatoryRulesComponent } from './ser-mol-confirmatory-rules';
import { AntigenConfigRulesService } from './services/antigen-config-rules.service';
import { AntigenConfigRule } from './models/antigen-config-rules.model';

const MOCK_RULE: AntigenConfigRule = {
  primaryRuleId: 4006,
  antigenCode: 'Fya',
  antigenGroup: 'Duffy',
  labelingAntigenCode: 'Fya',
  noOfUnits: 2,
  effDate: '2023-10-30T00:00:00',
  termDate: null,
  details: [
    { ruleId: 4006.1, testType: 'SER', testId: 'Fya', licApproveFlag: 'U', noOfTests: 1, effDate: '2023-10-30T00:00:00', termDate: null },
    { ruleId: 4006.2, testType: 'MOL', testId: 'FY1(Fya)', licApproveFlag: 'U', noOfTests: 1, effDate: '2023-10-30T00:00:00', termDate: null },
  ],
};

const MOCK_FILTER_OPTIONS = [
  { antigenGroup: 'Duffy', antigenCode: 'Fya' },
  { antigenGroup: 'Duffy', antigenCode: 'Fyb' },
  { antigenGroup: 'Kell', antigenCode: 'K' },
];

describe('SerMolConfirmatoryRulesComponent', () => {
  let component: SerMolConfirmatoryRulesComponent;
  let fixture: ComponentFixture<SerMolConfirmatoryRulesComponent>;
  let mockService: jasmine.SpyObj<AntigenConfigRulesService>;

  beforeEach(() => {

    mockService = jasmine.createSpyObj('AntigenConfigRulesService', [
      'search', 'getAntigenGroups', 'getFilterOptions',
      'getTestIds', 'getLabelingAntigens',
    ]);

    mockService.getAntigenGroups.and.returnValue(of(['Duffy', 'Kell']));
    mockService.getFilterOptions.and.returnValue(of(MOCK_FILTER_OPTIONS));
    mockService.getTestIds.withArgs('SER').and.returnValue(of(['Fya', 'Fyb']));
    mockService.getTestIds.withArgs('MOL').and.returnValue(of(['FY1(Fya)', 'FY2(Fyb)']));
    mockService.getLabelingAntigens.and.returnValue(of(['Fya', 'Fyb']));
    mockService.search.and.returnValue(of({ data: [MOCK_RULE], total: 1 }));



      TestBed.configureTestingModule({
      imports: [SerMolConfirmatoryRulesComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: AntigenConfigRulesService, useValue: mockService },
      ],
    });


    


      mockService.search.calls.reset();


      mockService.getAntigenGroups.calls.reset();


      mockService.getFilterOptions.calls.reset();


      mockService.getTestIds.calls.reset();


      mockService.getLabelingAntigens.calls.reset();


      mockService.getAntigenGroups.and.returnValue(of(['Duffy', 'Kell']));


      mockService.getFilterOptions.and.returnValue(of(MOCK_FILTER_OPTIONS));


      mockService.getLabelingAntigens.and.returnValue(of(['Fya', 'Fyb']));


      mockService.search.and.returnValue(of({ data: [MOCK_RULE], total: 1 }));


    fixture = TestBed.createComponent(SerMolConfirmatoryRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  // ── Init ──────────────────────────────────────────────────────────────────



  it('should initialise with sidePanelOpen false', () => {
    expect(component.sidePanelOpen).toBeFalse();
  });

  it('should not retrieve data until retrieve() is called', () => {
    expect(component.hasRetrieved).toBeFalse();
    expect(mockService.search).not.toHaveBeenCalled();
  });

  // ── Antigen filters ───────────────────────────────────────────────────────

  it('should compute filteredAntigenCodes for selected group', () => {
    component.selectedAntigenGroup = 'Duffy';
    expect(component.filteredAntigenCodes).toEqual(['Fya', 'Fyb']);
  });

  it('should return empty filteredAntigenCodes when no group selected', () => {
    component.selectedAntigenGroup = null;
    expect(component.filteredAntigenCodes).toEqual([]);
  });



  // ── Retrieve disabled ─────────────────────────────────────────────────────

  it('should disable retrieve when no group selected', () => {
    component.selectedAntigenGroup = null;
    component.selectedAntigenCode = null;
    expect(component.isRetrieveDisabled).toBeTrue();
  });

  it('should disable retrieve when group selected but no antigen code', () => {
    component.selectedAntigenGroup = 'Duffy';
    component.selectedAntigenCode = null;
    expect(component.isRetrieveDisabled).toBeTrue();
  });

  it('should enable retrieve when both group and antigen code are selected', () => {
    component.selectedAntigenGroup = 'Duffy';
    component.selectedAntigenCode = 'Fya';
    expect(component.isRetrieveDisabled).toBeFalse();
  });

  // ── Retrieve / loadData ───────────────────────────────────────────────────

  it('should call search service and populate dataSource on retrieve()', () => {
    component.selectedAntigenGroup = 'Duffy';
    component.selectedAntigenCode = 'Fya';
    component.retrieve();

    expect(mockService.search).toHaveBeenCalled();
    expect(component.dataSource).toEqual([MOCK_RULE]);
    expect(component.hasRetrieved).toBeTrue();
    expect(component.hasError).toBeFalse();
  });

  it('should set hasError on search failure', () => {
    mockService.search.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
    component.selectedAntigenGroup = 'Duffy';
    component.selectedAntigenCode = 'Fya';
    component.retrieve();

    expect(component.hasError).toBeTrue();
    expect(component.hasRetrieved).toBeTrue();
    expect(component.dataSource.length).toBe(0);
  });



  // ── Search filter ─────────────────────────────────────────────────────────

  it('should filter dataSource by primaryRuleId on search', () => {
    component.dataSource = [MOCK_RULE, { ...MOCK_RULE, primaryRuleId: 9999, details: [] }];
    component.onSearch('4006');
    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].primaryRuleId).toBe(4006);
  });

  it('should reload data when search text is cleared', () => {
    const callsBefore = mockService.search.calls.count();
    component.selectedAntigenGroup = 'Duffy';
    component.selectedAntigenCode = 'Fya';
    component.onSearch('');
    expect(mockService.search.calls.count()).toBeGreaterThan(callsBefore);
  });

  // ── Row expand toggle ─────────────────────────────────────────────────────

  it('should add row key to expandedRows on first toggle', () => {
    component.onRowExpandToggle(MOCK_RULE);
    expect(component.expandedRows.has(4006)).toBeTrue();
  });

  it('should remove row key from expandedRows on second toggle', () => {
    component.onRowExpandToggle(MOCK_RULE);
    component.onRowExpandToggle(MOCK_RULE);
    expect(component.expandedRows.has(4006)).toBeFalse();
  });

  // ── Row actions ───────────────────────────────────────────────────────────

  it('should open edit side panel on edit row action', () => {
    component.onRowAction({ action: 'edit', row: MOCK_RULE });
    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelData).toEqual(MOCK_RULE);
  });

  it('should not open panel for unknown row action', () => {
    component.onRowAction({ action: 'delete', row: MOCK_RULE });
    expect(component.sidePanelOpen).toBeFalse();
  });

  // ── Side panel ────────────────────────────────────────────────────────────

  it('should open add side panel and clear data', () => {
    component.sidePanelData = MOCK_RULE;
    component.openAddPanel();
    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelData).toBeNull();
  });

  it('should close side panel and clear data on closeSidePanel()', () => {
    component.sidePanelOpen = true;
    component.sidePanelData = MOCK_RULE;
    component.closeSidePanel();
    expect(component.sidePanelOpen).toBeFalse();
    expect(component.sidePanelData).toBeNull();
  });

  it('should reload data and show success message on onSaveSuccess() in add mode', () => {
    const showSuccessSpy = spyOn<any>(component, 'showSuccess');
    const callsBefore = mockService.search.calls.count();
    component.sidePanelMode = 'add';
    component.selectedAntigenGroup = 'Duffy';
    component.selectedAntigenCode = 'Fya';
    component.onSaveSuccess();
    expect(mockService.search.calls.count()).toBeGreaterThan(callsBefore);
    expect(showSuccessSpy).toHaveBeenCalledWith('New Primary Rule and Details Added successfully.');
  });

  it('should reload data and show success message on onSaveSuccess() in edit mode', () => {
    const showSuccessSpy = spyOn<any>(component, 'showSuccess');
    const callsBefore = mockService.search.calls.count();
    component.sidePanelMode = 'edit';
    component.selectedAntigenGroup = 'Duffy';
    component.selectedAntigenCode = 'Fya';
    component.onSaveSuccess();
    expect(mockService.search.calls.count()).toBeGreaterThan(callsBefore);
    expect(showSuccessSpy).toHaveBeenCalledWith('Primary Rule and Details Updated successfully.');
  });

  // ── Formatters ────────────────────────────────────────────────────────────

  it('should format a valid date string as DD-MON-YYYY', () => {
    expect(component.formatDate('2023-10-30T00:00:00')).toBe('30-OCT-2023');
  });





  it('should return correct test type display label', () => {
    expect(component.getTestTypeDisplay('SER')).toBe('Serological');
    expect(component.getTestTypeDisplay('MOL')).toBe('Molecular');
    expect(component.getTestTypeDisplay('XYZ')).toBe('XYZ');
  });

  it('should return correct lic approve display label', () => {
    expect(component.getLicDisplay('L')).toBe('Licensed');
    expect(component.getLicDisplay('U')).toBe('Unlicensed');
    expect(component.getLicDisplay('A')).toBe('Approved');
    expect(component.getLicDisplay('X')).toBe('X');
  });

  // ── Table config ──────────────────────────────────────────────────────────




});
