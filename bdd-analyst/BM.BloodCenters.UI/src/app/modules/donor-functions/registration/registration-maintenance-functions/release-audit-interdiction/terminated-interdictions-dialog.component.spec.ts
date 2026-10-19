import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { Component, Input, Output, EventEmitter } from '@angular/core';

import {
  TerminatedInterdictionsDialogComponent,
  TerminatedInterdictionsDialogData
} from './terminated-interdictions-dialog.component';
import { Interdiction } from './release-audit-interdiction.models';
import { ReleaseAuditInterdictionService } from './release-audit-interdiction.service';
import { DataTableConfig, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { DataTable } from '@shared/components/data-table/data-table';

// Stub the DataTable component to avoid importing the real shared component
@Component({
  selector: 'app-data-table',
  standalone: true,
  template: '<div class="mock-data-table"></div>'
})
class MockDataTableComponent {
  @Input() config: any;
  @Input() data: any;
  @Input() loading: any;
  @Output() rowAction = new EventEmitter<any>();
}

describe('TerminatedInterdictionsDialogComponent', () => {
  let component: TerminatedInterdictionsDialogComponent;
  let fixture: ComponentFixture<TerminatedInterdictionsDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<TerminatedInterdictionsDialogComponent>>;
  let serviceSpy: jasmine.SpyObj<ReleaseAuditInterdictionService>;

  const mockInterdiction: Interdiction = {
    interCode: 'BPHLD',
    interType: 'HOLD S',
    effectiveDate: '2020-01-21',
    terminationDate: '2026-02-25',
    releaseDate: '2026-03-01',
    releasedUser: 'USR001',
    insertedUser: 'ET1234',
    originated: 'INQR',
    reason: 'TATTO',
    groupMode: 'A',
    groupId: 'HQ0250',
    interDescription: 'Blood Pressure Hold',
    reasonRequired: false,
    isPermanentDeferral: false,
    canRelease: true,
    canRemove: false
  };

  const mockInterdictions: Interdiction[] = [
    mockInterdiction,
    {
      interCode: 'DEFER',
      interType: 'DEF T',
      effectiveDate: '2021-06-15',
      terminationDate: '2026-06-15',
      releaseDate: null,
      releasedUser: '',
      insertedUser: 'ET5678',
      originated: 'PHYS',
      reason: 'MEDIC',
      groupMode: 'B',
      groupId: 'HQ0300',
      interDescription: 'Deferral',
      reasonRequired: false,
      isPermanentDeferral: false,
      canRelease: false,
      canRemove: false
    }
  ];

  const mockDialogData: TerminatedInterdictionsDialogData = {
    transactionId: 'TXN123456'
  };

  function configureModule(
    svc: jasmine.SpyObj<ReleaseAuditInterdictionService>,
    data: TerminatedInterdictionsDialogData = mockDialogData
  ): void {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [
        TerminatedInterdictionsDialogComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatDialogModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatIconModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: ReleaseAuditInterdictionService, useValue: svc }
      ]
    })
    .overrideComponent(TerminatedInterdictionsDialogComponent, {
      remove: { imports: [DataTable] },
      add: { imports: [MockDataTableComponent] }
    })
    .compileComponents();
  }

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('ReleaseAuditInterdictionService', ['getTerminatedInterdictions']);
    serviceSpy.getTerminatedInterdictions.and.returnValue(of(mockInterdictions));

    configureModule(serviceSpy);

    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<TerminatedInterdictionsDialogComponent>>;
    fixture = TestBed.createComponent(TerminatedInterdictionsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── Initialization ─────────────────────────────────────────────

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should inject dialog data with transactionId', () => {
      expect(component.data.transactionId).toBe('TXN123456');
    });

    it('should call getTerminatedInterdictions on init', () => {
      expect(serviceSpy.getTerminatedInterdictions).toHaveBeenCalledWith('TXN123456');
    });

    it('should populate interdictions signal after loading', () => {
      expect(component.interdictions()).toEqual(mockInterdictions);
    });

    it('should set loading to false after data loads', () => {
      expect(component.loading()).toBeFalse();
    });

    it('should have a tableConfig defined', () => {
      expect(component.tableConfig).toBeTruthy();
      expect(component.tableConfig.columns.length).toBeGreaterThan(0);
    });

    it('should have correct column keys in tableConfig', () => {
      const keys = component.tableConfig.columns.map(c => c.key);
      expect(keys).toContain('interCode');
      expect(keys).toContain('interType');
      expect(keys).toContain('insertedUser');
      expect(keys).toContain('effectiveDate');
      expect(keys).toContain('releaseDate');
      expect(keys).toContain('releasedUser');
      expect(keys).toContain('terminationDate');
      expect(keys).toContain('originated');
      expect(keys).toContain('reason');
      expect(keys).toContain('groupMode');
      expect(keys).toContain('groupId');
    });

    it('should have a release row action', () => {
      expect(component.tableConfig.rowActions).toBeTruthy();
      expect(component.tableConfig.rowActions!.length).toBe(1);
      expect(component.tableConfig.rowActions![0].action).toBe('release');
    });

    it('should configure showPagination as false', () => {
      expect(component.tableConfig.showPagination).toBeFalse();
    });

    it('should configure stickyHeader as true', () => {
      expect(component.tableConfig.stickyHeader).toBeTrue();
    });

    it('should configure enableRowHighlight as false', () => {
      expect(component.tableConfig.enableRowHighlight).toBeFalse();
    });
  });

  // ─── Data Loading ───────────────────────────────────────────────

  describe('Data Loading', () => {
    it('should set loading to true during data fetch', fakeAsync(() => {
      const dataSubject = new Subject<Interdiction[]>();
      serviceSpy.getTerminatedInterdictions.and.returnValue(dataSubject.asObservable());

      TestBed.resetTestingModule();
      configureModule(serviceSpy);

      const loadFixture = TestBed.createComponent(TerminatedInterdictionsDialogComponent);
      const loadComponent = loadFixture.componentInstance;
      loadFixture.detectChanges();

      expect(loadComponent.loading()).toBeTrue();

      dataSubject.next(mockInterdictions);
      dataSubject.complete();
      tick();

      expect(loadComponent.loading()).toBeFalse();
      expect(loadComponent.interdictions()).toEqual(mockInterdictions);
    }));

    it('should set loading to false on error', fakeAsync(() => {
      TestBed.resetTestingModule();
      const errorServiceSpy = jasmine.createSpyObj('ReleaseAuditInterdictionService', ['getTerminatedInterdictions']);
      errorServiceSpy.getTerminatedInterdictions.and.returnValue(throwError(() => new Error('Network error')));

      configureModule(errorServiceSpy);

      const errFixture = TestBed.createComponent(TerminatedInterdictionsDialogComponent);
      const errComponent = errFixture.componentInstance;
      errFixture.detectChanges();
      tick();

      expect(errComponent.loading()).toBeFalse();
      expect(errComponent.interdictions()).toEqual([]);
    }));

    it('should handle empty results', fakeAsync(() => {
      TestBed.resetTestingModule();
      const emptySvcSpy = jasmine.createSpyObj('ReleaseAuditInterdictionService', ['getTerminatedInterdictions']);
      emptySvcSpy.getTerminatedInterdictions.and.returnValue(of([]));

      configureModule(emptySvcSpy);

      const emptyFixture = TestBed.createComponent(TerminatedInterdictionsDialogComponent);
      const emptyComponent = emptyFixture.componentInstance;
      emptyFixture.detectChanges();
      tick();

      expect(emptyComponent.interdictions()).toEqual([]);
      expect(emptyComponent.loading()).toBeFalse();
    }));
  });

  // ─── onRowAction ────────────────────────────────────────────────

  describe('onRowAction', () => {
    it('should close dialog with release action and interdiction row', () => {
      const event: TableRowActionEvent<Interdiction> = {
        action: 'release',
        row: mockInterdiction
      };

      component.onRowAction(event);

      expect(dialogRef.close).toHaveBeenCalledWith({
        action: 'release',
        interdiction: mockInterdiction
      });
    });

    it('should not close dialog for non-release actions', () => {
      const event: TableRowActionEvent<Interdiction> = {
        action: 'other',
        row: mockInterdiction
      };

      component.onRowAction(event);

      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should pass the correct interdiction object on release', () => {
      const specificInterdiction = mockInterdictions[1];
      const event: TableRowActionEvent<Interdiction> = {
        action: 'release',
        row: specificInterdiction
      };

      component.onRowAction(event);

      expect(dialogRef.close).toHaveBeenCalledWith({
        action: 'release',
        interdiction: specificInterdiction
      });
    });
  });

  // ─── onClose ────────────────────────────────────────────────────

  describe('onClose', () => {
    it('should close the dialog with null', () => {
      component.onClose();
      expect(dialogRef.close).toHaveBeenCalledWith(null);
    });

    it('should only call close once', () => {
      component.onClose();
      expect(dialogRef.close).toHaveBeenCalledTimes(1);
    });
  });

  // ─── formatDate ─────────────────────────────────────────────────

  describe('formatDate', () => {
    it('should format a valid YYYY-MM-DD date to DD-MMM-YYYY uppercase', () => {
      expect(component.formatDate('2026-05-06')).toBe('06-MAY-2026');
    });

    it('should format January date correctly', () => {
      expect(component.formatDate('2025-01-15')).toBe('15-JAN-2025');
    });

    it('should format December date correctly', () => {
      expect(component.formatDate('2024-12-25')).toBe('25-DEC-2024');
    });

    it('should return raw string for invalid date', () => {
      expect(component.formatDate('invalid')).toBe('invalid');
    });

    it('should return raw string for empty string', () => {
      expect(component.formatDate('')).toBe('');
    });

    it('should format leap year date', () => {
      expect(component.formatDate('2024-02-29')).toBe('29-FEB-2024');
    });

    it('should return uppercase month abbreviation', () => {
      const result = component.formatDate('2025-03-11');
      expect(result).toBe('11-MAR-2025');
      expect(result).toEqual(result.toUpperCase());
    });
  });

  // ─── Table Config - valueFormatter ──────────────────────────────

  describe('Table Config valueFormatters', () => {
    it('should format effectiveDate column via valueFormatter', () => {
      const effDateCol = component.tableConfig.columns.find(c => c.key === 'effectiveDate');
      expect(effDateCol).toBeTruthy();
      expect(effDateCol!.valueFormatter).toBeTruthy();
      expect(effDateCol!.valueFormatter!('2020-01-21', mockInterdiction)).toBe('21-JAN-2020');
    });

    it('should format releaseDate column via valueFormatter', () => {
      const relDateCol = component.tableConfig.columns.find(c => c.key === 'releaseDate');
      expect(relDateCol).toBeTruthy();
      expect(relDateCol!.valueFormatter).toBeTruthy();
      expect(relDateCol!.valueFormatter!('2026-03-01', mockInterdiction)).toBe('01-MAR-2026');
    });

    it('should return empty string for null releaseDate', () => {
      const relDateCol = component.tableConfig.columns.find(c => c.key === 'releaseDate');
      expect(relDateCol!.valueFormatter!('', mockInterdiction)).toBe('');
    });

    it('should format terminationDate column via valueFormatter', () => {
      const termDateCol = component.tableConfig.columns.find(c => c.key === 'terminationDate');
      expect(termDateCol).toBeTruthy();
      expect(termDateCol!.valueFormatter).toBeTruthy();
      expect(termDateCol!.valueFormatter!('2026-02-25', mockInterdiction)).toBe('25-FEB-2026');
    });

    it('should return empty string for null terminationDate', () => {
      const termDateCol = component.tableConfig.columns.find(c => c.key === 'terminationDate');
      expect(termDateCol!.valueFormatter!('', mockInterdiction)).toBe('');
    });
  });

  // ─── Table Config - rowAction visibility ────────────────────────

  describe('Table Config rowAction visibility', () => {
    it('should show release action when canRelease is true', () => {
      const releaseAction = component.tableConfig.rowActions![0];
      expect(releaseAction.visible).toBeTruthy();
      expect(releaseAction.visible!(mockInterdiction)).toBeTrue();
    });

    it('should hide release action when canRelease is false', () => {
      const releaseAction = component.tableConfig.rowActions![0];
      const nonReleasable = { ...mockInterdiction, canRelease: false };
      expect(releaseAction.visible!(nonReleasable)).toBeFalse();
    });
  });

  // ─── Template Rendering ─────────────────────────────────────────

  describe('Template Rendering', () => {
    it('should display the dialog title', () => {
      const title = fixture.nativeElement.querySelector('h2[mat-dialog-title]');
      expect(title).toBeTruthy();
      expect(title.textContent).toContain('Terminated Interdictions');
    });

    it('should have a CLOSE button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const closeButton = Array.from(buttons).find(
        (btn: any) => btn.textContent.trim().includes('CLOSE')
      );
      expect(closeButton).toBeTruthy();
    });

    it('should call onClose when CLOSE button is clicked', () => {
      spyOn(component, 'onClose');
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const closeButton = Array.from(buttons).find(
        (btn: any) => btn.textContent.trim().includes('CLOSE')
      ) as HTMLButtonElement;
      closeButton.click();
      expect(component.onClose).toHaveBeenCalled();
    });
  });
});
