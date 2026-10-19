import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ReagentsDialogComponent, ReagentsDialogData } from './reagents-dialog';
import { TestKitReagentsQueryApiService } from '../../services/test-kit-reagents-query-api.service';
import { ReagentDetailDto } from '../../models/test-kit-reagents-query.model';

describe('ReagentsDialogComponent', () => {
  let component: ReagentsDialogComponent;
  let fixture: ComponentFixture<ReagentsDialogComponent>;
  let apiSpy: jasmine.SpyObj<TestKitReagentsQueryApiService>;

  const mockDialogData: ReagentsDialogData = {
    testKitId: 'TK001',
    testId: 'TEST01',
  };

  const mockReagents: ReagentDetailDto[] = [
    {
      reagentType: 'C',
      reagentTypeDescription: 'Control',
      reagentCode: 'RC001',
      reagentDescription: 'RC001 - Control Reagent',
      lotNumber: 'LOT123',
      expiryDate: '2027-01-15',
    },
    {
      reagentType: 'R',
      reagentTypeDescription: 'Reagent',
      reagentCode: 'RR002',
      reagentDescription: 'RR002 - Standard Reagent',
      lotNumber: null,
      expiryDate: null,
    },
    {
      reagentType: 'S',
      reagentTypeDescription: 'Substrate',
      reagentCode: 'RS003',
      reagentDescription: 'RS003 - Substrate',
      lotNumber: 'LOT456',
      expiryDate: '2027-06-30',
    },
  ];

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('TestKitReagentsQueryApiService', ['getReagentDetails']);
    apiSpy.getReagentDetails.and.returnValue(of(mockReagents));

    TestBed.configureTestingModule({
      imports: [ReagentsDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TestKitReagentsQueryApiService, useValue: apiSpy },
      ],
    });

    fixture = TestBed.createComponent(ReagentsDialogComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  // -----------------------------------------------------------------------
  // Component creation
  // -----------------------------------------------------------------------

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // ngOnChanges
  // -----------------------------------------------------------------------

  describe('ngOnChanges', () => {
    it('should load data when isOpen is true and row is set', () => {
      component.row = mockDialogData;
      component.isOpen = true;
      component.ngOnChanges({} as any);

      expect(apiSpy.getReagentDetails).toHaveBeenCalledWith('TK001', 'TEST01');
      expect(component['dataSource']()).toEqual(mockReagents);
      expect(component['loading']()).toBe(false);
    });

    it('should not load data when panel is closed', () => {
      component.row = mockDialogData;
      component.isOpen = false;
      component.ngOnChanges({} as any);

      expect(apiSpy.getReagentDetails).not.toHaveBeenCalled();
    });

    it('should not load data when row is null', () => {
      component.row = null;
      component.isOpen = true;
      component.ngOnChanges({} as any);

      expect(apiSpy.getReagentDetails).not.toHaveBeenCalled();
    });

    it('should initialize table config when opened', () => {
      component.row = mockDialogData;
      component.isOpen = true;
      component.ngOnChanges({} as any);

      expect(component['tableConfig'].columns.length).toBe(4);
      expect(component['tableConfig'].stickyHeader).toBe(true);
      expect(component['tableConfig'].showPagination).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // loadReagents - success
  // -----------------------------------------------------------------------

  describe('loadReagents - success', () => {
    beforeEach(() => {
      component.row = mockDialogData;
      component.isOpen = true;
    });

    it('should populate dataSource on success', () => {
      component.ngOnChanges({} as any);
      expect(component['dataSource']()).toEqual(mockReagents);
      expect(component['loading']()).toBe(false);
    });

    it('should clear previous error on success', () => {
      component['error'].set('old error');
      component.ngOnChanges({} as any);
      expect(component['error']()).toBeNull();
    });

    it('should handle empty reagent list', () => {
      apiSpy.getReagentDetails.and.returnValue(of([]));
      component.ngOnChanges({} as any);
      expect(component['dataSource']()).toEqual([]);
      expect(component['loading']()).toBe(false);
      expect(component['error']()).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // loadReagents - error
  // -----------------------------------------------------------------------

  describe('loadReagents - error', () => {
    beforeEach(() => {
      component.row = mockDialogData;
      component.isOpen = true;
    });

    it('should set error from nested errorResponse', () => {
      apiSpy.getReagentDetails.and.returnValue(
        throwError(() => ({
          error: { errorResponse: { error: 'Test kit not found' } },
        }))
      );
      component.ngOnChanges({} as any);

      expect(component['error']()).toBe('Test kit not found');
      expect(component['loading']()).toBe(false);
    });

    it('should use fallback error message when no nested error', () => {
      apiSpy.getReagentDetails.and.returnValue(
        throwError(() => new Error('Network failure'))
      );
      component.ngOnChanges({} as any);

      expect(component['error']()).toBe('Failed to load reagent details');
      expect(component['loading']()).toBe(false);
    });

    it('should use fallback when error is null', () => {
      apiSpy.getReagentDetails.and.returnValue(throwError(() => null));
      component.ngOnChanges({} as any);

      expect(component['error']()).toBe('Failed to load reagent details');
    });

    it('should not populate dataSource on error', () => {
      apiSpy.getReagentDetails.and.returnValue(
        throwError(() => new Error('fail'))
      );
      component.ngOnChanges({} as any);

      expect(component['dataSource']()).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // close
  // -----------------------------------------------------------------------

  describe('close', () => {
    it('should emit closePanel event', () => {
      spyOn(component.closePanel, 'emit');
      (component as any).close();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // getReagentTypeDisplay
  // -----------------------------------------------------------------------

  describe('getReagentTypeDisplay', () => {
    it('should return "C - Control" for type C', () => {
      expect((component as any).getReagentTypeDisplay('C')).toBe('C - Control');
    });

    it('should return "R - Reagent" for type R', () => {
      expect((component as any).getReagentTypeDisplay('R')).toBe('R - Reagent');
    });

    it('should return "S - Substrate" for type S', () => {
      expect((component as any).getReagentTypeDisplay('S')).toBe('S - Substrate');
    });

    it('should return original type for unknown types', () => {
      expect((component as any).getReagentTypeDisplay('X')).toBe('X');
    });
  });

  // -----------------------------------------------------------------------
  // Table config columns
  // -----------------------------------------------------------------------

  describe('table config', () => {
    beforeEach(() => {
      component.row = mockDialogData;
      component.isOpen = true;
      component.ngOnChanges({} as any);
    });

    it('should have 4 columns', () => {
      expect(component['tableConfig'].columns.length).toBe(4);
    });

    it('should configure reagentType column', () => {
      const col = component['tableConfig'].columns[0];
      expect(col.key).toBe('reagentType');
      expect(col.header).toBe('Type');
      expect(col.sortable).toBe(false);
    });

    it('should configure reagentDescription column', () => {
      const col = component['tableConfig'].columns[1];
      expect(col.key).toBe('reagentDescription');
      expect(col.header).toBe('Reagent Description');
    });

    it('should configure reagentCode column', () => {
      const col = component['tableConfig'].columns[2];
      expect(col.key).toBe('reagentCode');
      expect(col.header).toBe('Kit Lot Number');
    });

    it('should configure lotNumber column', () => {
      const col = component['tableConfig'].columns[3];
      expect(col.key).toBe('lotNumber');
      expect(col.header).toBe('Lot#');
    });

    it('should have valueFormatter on reagentType column', () => {
      const col = component['tableConfig'].columns[0];
      expect(col.valueFormatter).toBeDefined();
      expect(col.valueFormatter!('C')).toBe('C - Control');
      expect(col.valueFormatter!('R')).toBe('R - Reagent');
      expect(col.valueFormatter!('S')).toBe('S - Substrate');
    });

    it('should have valueFormatter on lotNumber column returning -- for null', () => {
      const col = component['tableConfig'].columns[3];
      expect(col.valueFormatter).toBeDefined();
      expect(col.valueFormatter!(null as any)).toBe('--');
      expect(col.valueFormatter!('LOT123')).toBe('LOT123');
    });

    it('should set emptyMessage', () => {
      expect(component['tableConfig'].emptyMessage).toBe('No reagents found for this test kit.');
    });

    it('should set loadingMessage', () => {
      expect(component['tableConfig'].loadingMessage).toBe('Loading reagent details...');
    });

    it('should have empty rowActions', () => {
      expect(component['tableConfig'].rowActions).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // Initial state
  // -----------------------------------------------------------------------

  describe('initial state', () => {
    it('should have empty dataSource before opening', () => {
      expect(component['dataSource']()).toEqual([]);
    });

    it('should not be loading initially', () => {
      expect(component['loading']()).toBe(false);
    });

    it('should have no error initially', () => {
      expect(component['error']()).toBeNull();
    });

    it('should have isOpen default to false', () => {
      expect(component.isOpen).toBe(false);
    });

    it('should have row default to null', () => {
      expect(component.row).toBeNull();
    });
  });
});
