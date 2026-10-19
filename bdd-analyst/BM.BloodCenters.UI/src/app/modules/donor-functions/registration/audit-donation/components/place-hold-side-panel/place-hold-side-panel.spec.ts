import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { PlaceHoldSidePanelComponent, LocalHoldRow } from './place-hold-side-panel';
import { HeaderService } from '@shared/services/header.service';
import { HoldInterCodeDto, DonationInterdictionDto } from '../../models/audit-donation.model';

describe('PlaceHoldSidePanelComponent', () => {
  let component: PlaceHoldSidePanelComponent;
  let fixture: ComponentFixture<PlaceHoldSidePanelComponent>;
  let chapterChanged$: Subject<void>;

  const mockHoldCodes: HoldInterCodeDto[] = [
    { interCode: 'H001', interDescription: 'Hold 1' },
    { interCode: 'H002', interDescription: 'Hold 2' },
    { interCode: 'H003', interDescription: 'Hold 3' },
  ];

  const mockInterdictions: DonationInterdictionDto[] = [
    {
      transactionId: 'TXN001',
      unitId: 'UNIT001',
      interCode: 'H001',
      interDescription: 'Hold 1',
      interType: 'M',
      comments: '',
      releaseDate: '',
      releaseUser: '',
      auditKey: '1',
    },
  ];

  beforeEach(() => {
    chapterChanged$ = new Subject<void>();

    TestBed.configureTestingModule({
      imports: [
        PlaceHoldSidePanelComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
      ],
      providers: [
        {
          provide: HeaderService,
          useValue: { chapterChanged$: chapterChanged$.asObservable() },
        },
      ],
    });

    fixture = TestBed.createComponent(PlaceHoldSidePanelComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('ngOnInit', () => {
    it('should populate rows from existingInterdictions on init', () => {
      component.holdCodes = mockHoldCodes;
      component.existingInterdictions = mockInterdictions;
      fixture.detectChanges();

      expect(component.rows().length).toBe(1);
      expect(component.rows()[0].interCode).toBe('H001');
      expect(component.rows()[0].interDescription).toBe('Hold 1');
    });

    it('should resolve interDescription from holdCodes when interdiction description is empty', () => {
      component.holdCodes = mockHoldCodes;
      component.existingInterdictions = [
        { ...mockInterdictions[0], interDescription: '' },
      ];
      fixture.detectChanges();

      expect(component.rows()[0].interDescription).toBe('Hold 1');
    });

    it('should initialize with empty rows when no existingInterdictions', () => {
      component.holdCodes = mockHoldCodes;
      component.existingInterdictions = [];
      fixture.detectChanges();

      expect(component.rows()).toEqual([]);
    });

    it('should initialize showNewRow as false', () => {
      fixture.detectChanges();
      expect(component.showNewRow()).toBe(false);
    });
  });

  describe('onAddNew', () => {
    it('should set showNewRow to true', () => {
      fixture.detectChanges();
      component.onAddNew();
      expect(component.showNewRow()).toBe(true);
    });
  });

  describe('onNewCodeSelect', () => {
    beforeEach(() => {
      component.holdCodes = mockHoldCodes;
      component.existingInterdictions = [];
      fixture.detectChanges();
      component.showNewRow.set(true);
    });

    it('should add new row with selected code and hide new row input', () => {
      component.onNewCodeSelect('H002');

      expect(component.rows().length).toBe(1);
      expect(component.rows()[0].interCode).toBe('H002');
      expect(component.rows()[0].interDescription).toBe('Hold 2');
      expect(component.showNewRow()).toBe(false);
    });
  });

  describe('availableForNew', () => {
    beforeEach(() => {
      component.holdCodes = mockHoldCodes;
      component.existingInterdictions = mockInterdictions;
      fixture.detectChanges();
    });

    it('should return codes not already in rows', () => {
      const available = component.availableForNew();
      const codes = available.map(c => c.interCode);

      expect(codes).not.toContain('H001');
      expect(codes).toContain('H002');
      expect(codes).toContain('H003');
    });
  });

  describe('isManual', () => {
    beforeEach(() => {
      component.holdCodes = mockHoldCodes;
      fixture.detectChanges();
    });

    it('should return true when interCode is found in holdCodes', () => {
      expect(component.isManual('H001')).toBe(true);
    });

    it('should return false when interCode is not in holdCodes', () => {
      expect(component.isManual('UNKNOWN')).toBe(false);
    });
  });

  describe('ngOnInit — initialRows path', () => {
    it('should initialize rows from initialRows when provided', () => {
      const initialRows = [{ interCode: 'H003', interDescription: 'Hold 3' }];
      component.holdCodes = mockHoldCodes;
      component.existingInterdictions = [];
      component.initialRows = initialRows;
      fixture.detectChanges();
      expect(component.rows().length).toBe(1);
      expect(component.rows()[0].interCode).toBe('H003');
    });

    it('should use existingInterdictions when initialRows is null', () => {
      component.holdCodes = mockHoldCodes;
      component.existingInterdictions = mockInterdictions;
      component.initialRows = null;
      fixture.detectChanges();
      expect(component.rows()[0].interCode).toBe('H001');
    });
  });

  describe('onDelete', () => {
    beforeEach(() => {
      component.holdCodes = mockHoldCodes;
      component.existingInterdictions = mockInterdictions;
      fixture.detectChanges();
    });

    it('should remove row with matching interCode', () => {
      expect(component.rows().length).toBe(1);
      component.onDelete('H001');
      expect(component.rows().length).toBe(0);
    });

    it('should not remove rows with non-matching interCode', () => {
      component.onDelete('UNKNOWN');
      expect(component.rows().length).toBe(1);
    });
  });

  describe('onEditCode', () => {
    beforeEach(() => {
      component.holdCodes = mockHoldCodes;
      component.existingInterdictions = mockInterdictions;
      fixture.detectChanges();
    });

    it('should update interCode and description for a row', () => {
      const row = component.rows()[0];
      component.onEditCode(row, 'H002');
      expect(component.rows()[0].interCode).toBe('H002');
      expect(component.rows()[0].interDescription).toBe('Hold 2');
    });

    it('should set empty description when code not found in holdCodes', () => {
      const row = component.rows()[0];
      component.onEditCode(row, 'UNKNOWN');
      expect(component.rows()[0].interDescription).toBe('');
    });
  });

  describe('onButtonClick', () => {
    let saveSpy: jasmine.Spy;
    let cancelSpy: jasmine.Spy;

    beforeEach(() => {
      component.holdCodes = mockHoldCodes;
      component.existingInterdictions = mockInterdictions;
      fixture.detectChanges();
      saveSpy = spyOn(component.save, 'emit');
      cancelSpy = spyOn(component.cancel, 'emit');
    });

    it('should emit save with current rows on save action', () => {
      component.onButtonClick('save');
      expect(saveSpy).toHaveBeenCalledWith(component.rows());
    });

    it('should emit cancel on cancel action', () => {
      component.onButtonClick('cancel');
      expect(cancelSpy).toHaveBeenCalled();
    });

    it('should emit cancel for unknown action', () => {
      component.onButtonClick('something');
      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  describe('onClose', () => {
    it('should emit cancel', () => {
      fixture.detectChanges();
      const cancelSpy = spyOn(component.cancel, 'emit');
      component.onClose();
      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  describe('onNewCodeSelect — empty code guard', () => {
    it('should not add row when code is empty string', () => {
      component.holdCodes = mockHoldCodes;
      component.existingInterdictions = [];
      fixture.detectChanges();
      component.onNewCodeSelect('');
      expect(component.rows().length).toBe(0);
    });
  });

  describe('filteredHoldCodesForEdit', () => {
    beforeEach(() => {
      component.holdCodes = mockHoldCodes;
      component.existingInterdictions = [];
      fixture.detectChanges();
    });

    it('should return all codes when no search term', () => {
      expect(component.filteredHoldCodesForEdit().length).toBe(3);
    });

    it('should filter by interCode', () => {
      component.editSearchCtrl.setValue('H001');
      const filtered = component.filteredHoldCodesForEdit();
      expect(filtered.length).toBe(1);
      expect(filtered[0].interCode).toBe('H001');
    });

    it('should filter by description', () => {
      component.editSearchCtrl.setValue('Hold 2');
      const filtered = component.filteredHoldCodesForEdit();
      expect(filtered.length).toBe(1);
      expect(filtered[0].interCode).toBe('H002');
    });
  });

  describe('filteredAvailableForNew', () => {
    beforeEach(() => {
      component.holdCodes = mockHoldCodes;
      component.existingInterdictions = mockInterdictions;
      fixture.detectChanges();
    });

    it('should exclude already-added codes', () => {
      const available = component.filteredAvailableForNew();
      expect(available.map(c => c.interCode)).not.toContain('H001');
    });

    it('should filter available codes by search term', () => {
      component.newSearchCtrl.setValue('H002');
      const filtered = component.filteredAvailableForNew();
      expect(filtered.length).toBe(1);
      expect(filtered[0].interCode).toBe('H002');
    });

    it('should return all available when no search term', () => {
      component.newSearchCtrl.setValue('');
      const available = component.filteredAvailableForNew();
      expect(available.length).toBe(2);
    });
  });

  describe('chapter change — cancel emission', () => {
    it('should emit cancel when chapter changes', () => {
      component.holdCodes = mockHoldCodes;
      component.existingInterdictions = [];
      fixture.detectChanges();
      const cancelSpy = spyOn(component.cancel, 'emit');
      chapterChanged$.next();
      expect(cancelSpy).toHaveBeenCalled();
    });
  });
});
