import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange, SimpleChanges } from '@angular/core';
import { of, throwError } from 'rxjs';
import { StageConfigurationComponent } from './stage-configuration.component';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { SpProcessesStagesApiService } from '../../services/sp-processes-stages-api.service';
import { Stage } from '../../models/sp-processes-stages.model';
import moment from 'moment';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('StageConfigurationComponent', () => {
  let component: StageConfigurationComponent;
  let fixture: ComponentFixture<StageConfigurationComponent>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;
  let mockApiService: jasmine.SpyObj<SpProcessesStagesApiService>;

  const mockStages: Stage[] = [
    {
      sequence: 1,
      stageCode: '01',
      description: '1st stage',
      effectiveDate: new Date('2025-01-11'),
      terminationDate: null,
      auditKey: 1,
      isEditable: true,
      errors: {}
    }
  ];

  function makeNewStage(overrides: Partial<Stage> = {}): Stage {
    return {
      sequence: 1,
      stageCode: '',
      description: '',
      effectiveDate: new Date(),
      terminationDate: null,
      lastModifiedDate: null,
      auditKey: 0,
      isEditable: true,
      errors: {},
      ...overrides
    };
  }

  function makeExistingStage(overrides: Partial<Stage> = {}): Stage {
    return {
      sequence: 1,
      stageCode: '01',
      description: '1st stage',
      effectiveDate: new Date('2025-01-11'),
      terminationDate: null,
      lastModifiedDate: null,
      auditKey: 1,
      isEditable: true,
      errors: {},
      ...overrides
    };
  }

  function triggerNgOnChanges(stages: Stage[], firstChange = false): void {
    const changes: SimpleChanges = {
      stages: new SimpleChange(
        firstChange ? undefined : [],
        stages,
        firstChange
      )
    };
    component.stages = stages;
    component.ngOnChanges(changes);
  }

  beforeEach(() => {

    mockHeaderService = createMockHeaderService();
    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment());

    mockApiService = jasmine.createSpyObj('SpProcessesStagesApiService', ['getStageCodes']);
    mockApiService.getStageCodes.and.returnValue(of([
      { code: '01', description: '1st stage' },
      { code: '02', description: '2nd stage' },
      { code: '03', description: '3rd stage' },
    ]));

    TestBed.configureTestingModule({
      imports: [StageConfigurationComponent, NoopAnimationsModule],
      providers: [
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        { provide: SpProcessesStagesApiService, useValue: mockApiService },
      ]
    });

    mockChapterTimezoneService.getChapterLocalDate.calls.reset();
    mockApiService.getStageCodes.calls.reset();
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment());

    fixture = TestBed.createComponent(StageConfigurationComponent);
    component = fixture.componentInstance;
    component.processName = 'Deglycerolization';
  });

  it('should load stage codes on init', () => {
    fixture.detectChanges();
    expect(mockApiService.getStageCodes).toHaveBeenCalled();
    expect(component.stageCodeOptions.length).toBe(3);
  });

  describe('loadStageCodes', () => {
    it('should set isLoadingStageCodes to false after successful load', () => {
      fixture.detectChanges();
      expect(component.isLoadingStageCodes).toBe(false);
      expect(component.stageCodeOptions).toEqual([
        { code: '01', description: '1st stage' },
        { code: '02', description: '2nd stage' },
        { code: '03', description: '3rd stage' },
      ]);
    });

    it('should set isLoadingStageCodes to false on error', () => {
      mockApiService.getStageCodes.and.returnValue(throwError(() => new Error('API error')));
      fixture.detectChanges();
      expect(component.isLoadingStageCodes).toBe(false);
      expect(component.stageCodeOptions).toEqual([]);
    });
  });

  describe('ngOnChanges', () => {
    it('should not clear dirtyRows on first change', () => {
      component.dirtyRows.add(0);
      triggerNgOnChanges([...mockStages], true);
      expect(component.dirtyRows.has(0)).toBe(true);
    });

    it('should clear dirtyRows on subsequent changes', () => {
      component.dirtyRows.add(0);
      triggerNgOnChanges([...mockStages], false);
      expect(component.dirtyRows.size).toBe(0);
    });

    it('should store original dates for existing stages', () => {
      const stages = [makeExistingStage({ auditKey: 5 })];
      triggerNgOnChanges(stages, true);
      expect((component as any).originalDates.has(0)).toBe(true);
      const orig = (component as any).originalDates.get(0);
      expect(orig.effectiveDate).toEqual(stages[0].effectiveDate);
      expect(orig.terminationDate).toEqual(stages[0].terminationDate);
    });

    it('should not store original dates for new stages (auditKey 0)', () => {
      const stages = [makeNewStage({ auditKey: 0 })];
      triggerNgOnChanges(stages, true);
      expect((component as any).originalDates.has(0)).toBe(false);
    });

    it('should not store original dates for stages with null auditKey', () => {
      const stages = [makeNewStage({ auditKey: null as any })];
      triggerNgOnChanges(stages, true);
      expect((component as any).originalDates.has(0)).toBe(false);
    });

    it('should build date error matchers after changes', () => {
      const stages = [makeExistingStage(), makeNewStage()];
      triggerNgOnChanges(stages, true);
      expect(component.effDateMatchers.length).toBe(2);
      expect(component.termDateMatchers.length).toBe(2);
      expect(component.terminationDateFilters.length).toBe(2);
    });

    it('should handle null stages gracefully', () => {
      component.stages = null as any;
      const changes: SimpleChanges = {
        stages: new SimpleChange(undefined, null, true)
      };
      expect(() => component.ngOnChanges(changes)).not.toThrow();
    });

    it('should not act when stages input is not in changes', () => {
      component.dirtyRows.add(0);
      const changes: SimpleChanges = {
        processName: new SimpleChange('', 'Test', false)
      };
      component.ngOnChanges(changes);
      expect(component.dirtyRows.has(0)).toBe(true);
    });
  });

  describe('minDate', () => {
    it('should return a moment value based on chapter offset', () => {
      const result = component.minDate;
      expect(moment.isMoment(result)).toBe(true);
    });
  });

  describe('addNextStage', () => {
    it('should add a new empty stage', () => {
      component.stages = [...mockStages];
      spyOn(component.stagesChange, 'emit');

      component.addNextStage();

      expect(component.stages.length).toBe(2);
      const newStage = component.stages[1];
      expect(newStage.sequence).toBe(2);
      expect(newStage.stageCode).toBe('');
      expect(newStage.description).toBe('');
      expect(newStage.effectiveDate).toBeInstanceOf(Date);
      expect(newStage.terminationDate).toBeNull();
      expect(newStage.auditKey).toBe(0);
      expect(newStage.isEditable).toBe(true);
      expect(component.stagesChange.emit).toHaveBeenCalled();
    });

    it('should set sequence to 1 when stages array is empty', () => {
      component.stages = [];
      spyOn(component.stagesChange, 'emit');

      component.addNextStage();

      expect(component.stages.length).toBe(1);
      expect(component.stages[0].sequence).toBe(1);
      expect(component.stagesChange.emit).toHaveBeenCalled();
    });

    it('should use max sequence + 1 with non-contiguous sequences', () => {
      component.stages = [
        makeExistingStage({ sequence: 1 }),
        makeExistingStage({ sequence: 5 }),
      ];
      spyOn(component.stagesChange, 'emit');

      component.addNextStage();

      expect(component.stages[2].sequence).toBe(6);
    });

    it('should rebuild date error matchers after adding', () => {
      component.stages = [];
      component.addNextStage();
      expect(component.effDateMatchers.length).toBe(1);
      expect(component.termDateMatchers.length).toBe(1);
      expect(component.terminationDateFilters.length).toBe(1);
    });

    it('should set lastModifiedDate to null for new stage', () => {
      component.stages = [];
      component.addNextStage();
      expect(component.stages[0].lastModifiedDate).toBeNull();
    });
  });

  describe('onStageCodeSelected', () => {
    it('should populate description when stage code is selected', () => {
      fixture.detectChanges();
      component.stages = [{
        sequence: 1,
        stageCode: '02',
        description: '',
        effectiveDate: null,
        terminationDate: null,
        auditKey: 0,
        isEditable: true,
        errors: {}
      }];
      spyOn(component.stagesChange, 'emit');

      component.onStageCodeSelected(0);

      expect(component.stages[0].description).toBe('2nd stage');
      expect(component.stagesChange.emit).toHaveBeenCalled();
    });

    it('should set empty description when code is not found in options', () => {
      fixture.detectChanges();
      component.stages = [makeNewStage({ stageCode: 'UNKNOWN' })];
      spyOn(component.stagesChange, 'emit');

      component.onStageCodeSelected(0);

      expect(component.stages[0].description).toBe('');
    });

    it('should mark the row as dirty', () => {
      fixture.detectChanges();
      component.stages = [makeNewStage({ stageCode: '01' })];
      spyOn(component.stagesChange, 'emit');

      component.onStageCodeSelected(0);

      expect(component.dirtyRows.has(0)).toBe(true);
    });
  });

  describe('deleteStage', () => {
    it('should delete a new stage', () => {
      component.stages = [
        ...mockStages,
        {
          sequence: 2, stageCode: '02', description: '2nd stage',
          effectiveDate: new Date(), terminationDate: null,
          auditKey: 0, isEditable: true, errors: {}
        }
      ];
      spyOn(component.stagesChange, 'emit');

      component.deleteStage(1);

      expect(component.stages.length).toBe(1);
      expect(component.stagesChange.emit).toHaveBeenCalled();
    });

    it('should not delete an existing stage', () => {
      component.stages = [...mockStages];
      const initialLength = component.stages.length;

      component.deleteStage(0);

      expect(component.stages.length).toBe(initialLength);
    });

    it('should update sequences after deletion', () => {
      component.stages = [
        { sequence: 1, stageCode: '01', description: '1st', effectiveDate: new Date(), terminationDate: null, auditKey: 0, isEditable: true, errors: {} },
        { sequence: 2, stageCode: '02', description: '2nd', effectiveDate: new Date(), terminationDate: null, auditKey: 0, isEditable: true, errors: {} },
        { sequence: 3, stageCode: '03', description: '3rd', effectiveDate: new Date(), terminationDate: null, auditKey: 0, isEditable: true, errors: {} },
      ];

      component.deleteStage(1);

      expect(component.stages.length).toBe(2);
      expect(component.stages[0].sequence).toBe(1);
      expect(component.stages[1].sequence).toBe(2);
    });

    it('should remove the index from dirtyRows', () => {
      component.stages = [makeNewStage()];
      component.dirtyRows.add(0);

      component.deleteStage(0);

      expect(component.dirtyRows.has(0)).toBe(false);
    });

    it('should rebuild date error matchers after deletion', () => {
      component.stages = [makeNewStage(), makeNewStage({ sequence: 2 })];
      component.deleteStage(0);
      expect(component.effDateMatchers.length).toBe(1);
    });

    it('should delete a stage with null auditKey', () => {
      component.stages = [makeExistingStage({ auditKey: null as any })];
      const spy = spyOn(component.stagesChange, 'emit');
      component.deleteStage(0);
      expect(component.stages.length).toBe(0);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('removeNewStages', () => {
    it('should remove stages with auditKey 0', () => {
      component.stages = [
        makeExistingStage({ auditKey: 1 }),
        makeNewStage({ auditKey: 0 }),
      ];
      spyOn(component.stagesChange, 'emit');

      component.removeNewStages();

      expect(component.stages.length).toBe(1);
      expect(component.stages[0].auditKey).toBe(1);
      expect(component.stagesChange.emit).toHaveBeenCalled();
    });

    it('should remove stages with null auditKey', () => {
      component.stages = [
        makeExistingStage({ auditKey: 1 }),
        makeNewStage({ auditKey: null as any }),
      ];

      component.removeNewStages();

      expect(component.stages.length).toBe(1);
    });

    it('should clear dirty rows', () => {
      component.stages = [makeNewStage()];
      component.dirtyRows.add(0);

      component.removeNewStages();

      expect(component.dirtyRows.size).toBe(0);
    });

    it('should rebuild date error matchers', () => {
      component.stages = [makeExistingStage(), makeNewStage()];
      component.removeNewStages();
      expect(component.effDateMatchers.length).toBe(1);
    });

    it('should result in empty array when all stages are new', () => {
      component.stages = [makeNewStage(), makeNewStage({ sequence: 2 })];
      component.removeNewStages();
      expect(component.stages.length).toBe(0);
    });
  });

  describe('cancelChanges', () => {
    it('should remove new stages and restore original dates', () => {
      const existingStage = makeExistingStage({
        auditKey: 1,
        effectiveDate: new Date('2025-01-11'),
        terminationDate: new Date('2025-12-31')
      });
      component.stages = [existingStage, makeNewStage()];
      triggerNgOnChanges([existingStage, makeNewStage()], true);

      // Modify the existing stage date
      component.stages[0].effectiveDate = new Date('2026-06-01');
      component.dirtyRows.add(0);
      spyOn(component.stagesChange, 'emit');

      component.cancelChanges();

      expect(component.stages.length).toBe(1);
      expect(component.stages[0].effectiveDate).toEqual(new Date('2025-01-11'));
      expect(component.stages[0].terminationDate).toEqual(new Date('2025-12-31'));
      expect(component.stages[0].errors).toEqual({});
      expect(component.dirtyRows.size).toBe(0);
      expect(component.stagesChange.emit).toHaveBeenCalled();
    });

    it('should clear errors on all stages', () => {
      const existingStage = makeExistingStage({ errors: { stageCode: 'Error' } });
      component.stages = [existingStage];
      triggerNgOnChanges([existingStage], true);

      component.cancelChanges();

      expect(component.stages[0].errors).toEqual({});
    });

    it('should handle stages without original dates', () => {
      const existingStage = makeExistingStage({ auditKey: 1 });
      component.stages = [existingStage];

      component.cancelChanges();

      expect(component.stages.length).toBe(1);
    });
  });

  describe('clearAllFields', () => {
    it('should restore original dates for existing stages', () => {
      const existingStage = makeExistingStage({
        auditKey: 1,
        effectiveDate: new Date('2025-01-11'),
        terminationDate: new Date('2025-12-31')
      });
      component.stages = [existingStage];
      triggerNgOnChanges([existingStage], true);

      component.stages[0].effectiveDate = new Date('2026-06-01');
      spyOn(component.stagesChange, 'emit');

      component.clearAllFields();

      expect(component.stages[0].effectiveDate).toEqual(new Date('2025-01-11'));
      expect(component.stages[0].terminationDate).toEqual(new Date('2025-12-31'));
      expect(component.stagesChange.emit).toHaveBeenCalled();
    });

    it('should clear fields for new stages', () => {
      const newStage = makeNewStage({
        stageCode: '02',
        description: '2nd stage',
        effectiveDate: new Date('2025-06-01'),
        terminationDate: new Date('2025-12-31'),
      });
      component.stages = [newStage];
      spyOn(component.stagesChange, 'emit');

      component.clearAllFields();

      expect(component.stages[0].stageCode).toBe('');
      expect(component.stages[0].description).toBe('');
      expect(component.stages[0].effectiveDate).toBeNull();
      expect(component.stages[0].terminationDate).toBeNull();
      expect(component.stages[0].errors).toEqual({});
      expect(component.stagesChange.emit).toHaveBeenCalled();
    });

    it('should clear dirty rows', () => {
      component.stages = [makeNewStage()];
      component.dirtyRows.add(0);

      component.clearAllFields();

      expect(component.dirtyRows.size).toBe(0);
    });

    it('should handle mixed existing and new stages', () => {
      const existingStage = makeExistingStage({
        auditKey: 2,
        effectiveDate: new Date('2025-03-01'),
      });
      const newStage = makeNewStage({
        sequence: 2,
        stageCode: '03',
        description: '3rd stage',
        effectiveDate: new Date('2025-07-01'),
      });
      component.stages = [existingStage, newStage];
      triggerNgOnChanges([existingStage, newStage], true);

      component.clearAllFields();

      expect(component.stages[0].effectiveDate).toEqual(new Date('2025-03-01'));
      expect(component.stages[1].stageCode).toBe('');
      expect(component.stages[1].effectiveDate).toBeNull();
    });
  });

  describe('onFieldBlur', () => {
    it('should validate stageCode field after timeout', fakeAsync(() => {
      component.stages = [makeNewStage({ stageCode: '' })];

      component.onFieldBlur(0, 'stageCode');
      tick(1);

      expect(component.stages[0].errors!['stageCode']).toBe('Stage Code is required.');
    }));

    it('should not set error when stageCode is valid', fakeAsync(() => {
      component.stages = [makeNewStage({ stageCode: '01' })];

      component.onFieldBlur(0, 'stageCode');
      tick(1);

      expect(component.stages[0].errors!['stageCode']).toBeUndefined();
    }));

    it('should validate date fields', fakeAsync(() => {
      component.stages = [makeNewStage({ effectiveDate: null })];

      component.onFieldBlur(0, 'effectiveDate');
      tick(1);

      expect(component.stages[0].errors).toBeDefined();
    }));

    it('should initialize errors object if undefined', fakeAsync(() => {
      const stage = makeNewStage({ stageCode: '' });
      delete (stage as any).errors;
      component.stages = [stage];

      component.onFieldBlur(0, 'stageCode');
      tick(1);

      expect(component.stages[0].errors).toBeDefined();
      expect(component.stages[0].errors!['stageCode']).toBe('Stage Code is required.');
    }));

    it('should detect duplicate stage code on blur', fakeAsync(() => {
      component.stages = [
        makeNewStage({ stageCode: '01', sequence: 1 }),
        makeNewStage({ stageCode: '01', sequence: 2 }),
      ];

      component.onFieldBlur(1, 'stageCode');
      tick(1);

      expect(component.stages[1].errors!['stageCode']).toBe('This stage code is already assigned to this process.');
    }));

    it('should not flag duplicate when stage code is unique on blur', fakeAsync(() => {
      component.stages = [
        makeNewStage({ stageCode: '01', sequence: 1 }),
        makeNewStage({ stageCode: '02', sequence: 2 }),
      ];

      component.onFieldBlur(1, 'stageCode');
      tick(1);

      expect(component.stages[1].errors!['stageCode']).toBeUndefined();
    }));
  });

  describe('isDateChanged', () => {
    it('should return true for new stages (auditKey 0)', () => {
      component.stages = [makeNewStage({ auditKey: 0 })];
      expect(component.isDateChanged(0, 'effectiveDate')).toBe(true);
    });

    it('should return true for stages with null auditKey', () => {
      component.stages = [makeNewStage({ auditKey: null as any })];
      expect(component.isDateChanged(0, 'effectiveDate')).toBe(true);
    });

    it('should return true when no original dates are stored', () => {
      component.stages = [makeExistingStage({ auditKey: 5 })];
      expect(component.isDateChanged(0, 'effectiveDate')).toBe(true);
    });

    it('should return false when date has not changed', () => {
      const stage = makeExistingStage({
        auditKey: 5,
        effectiveDate: new Date('2025-01-11'),
      });
      component.stages = [stage];
      triggerNgOnChanges([stage], true);

      expect(component.isDateChanged(0, 'effectiveDate')).toBe(false);
    });

    it('should return true when effectiveDate has changed', () => {
      const stage = makeExistingStage({
        auditKey: 5,
        effectiveDate: new Date('2025-01-11'),
      });
      component.stages = [stage];
      triggerNgOnChanges([stage], true);

      component.stages[0].effectiveDate = new Date('2026-06-01');

      expect(component.isDateChanged(0, 'effectiveDate')).toBe(true);
    });

    it('should return true when terminationDate changes from null to a date', () => {
      const stage = makeExistingStage({
        auditKey: 5,
        terminationDate: null,
      });
      component.stages = [stage];
      triggerNgOnChanges([stage], true);

      component.stages[0].terminationDate = new Date('2026-12-31');

      expect(component.isDateChanged(0, 'terminationDate')).toBe(true);
    });

    it('should return false when both dates are null', () => {
      const stage = makeExistingStage({
        auditKey: 5,
        terminationDate: null,
      });
      component.stages = [stage];
      triggerNgOnChanges([stage], true);

      expect(component.isDateChanged(0, 'terminationDate')).toBe(false);
    });

    it('should return false for an out-of-bounds index', () => {
      component.stages = [makeExistingStage()];
      expect(component.isDateChanged(5, 'effectiveDate')).toBe(false);
    });
  });

  describe('onFieldChange', () => {
    it('should mark the row as dirty', fakeAsync(() => {
      component.stages = [makeNewStage({ stageCode: '01' })];
      spyOn(component.stagesChange, 'emit');

      component.onFieldChange(0, 'stageCode');
      tick(1);

      expect(component.dirtyRows.has(0)).toBe(true);
    }));

    it('should emit stagesChange', fakeAsync(() => {
      component.stages = [makeNewStage({ stageCode: '01' })];
      spyOn(component.stagesChange, 'emit');

      component.onFieldChange(0, 'stageCode');
      tick(1);

      expect(component.stagesChange.emit).toHaveBeenCalledWith(component.stages);
    }));

    it('should validate the field after timeout', fakeAsync(() => {
      component.stages = [makeNewStage({ stageCode: '' })];
      spyOn(component.stagesChange, 'emit');

      component.onFieldChange(0, 'stageCode');
      tick(1);

      expect(component.stages[0].errors!['stageCode']).toBe('Stage Code is required.');
    }));
  });

  describe('isChangedRow', () => {
    it('should return true for new stages (auditKey 0)', () => {
      component.stages = [makeNewStage({ auditKey: 0 })];
      expect(component.isChangedRow(0)).toBe(true);
    });

    it('should return true for stages with null auditKey', () => {
      component.stages = [makeNewStage({ auditKey: null as any })];
      expect(component.isChangedRow(0)).toBe(true);
    });

    it('should return true for dirty rows', () => {
      component.stages = [makeExistingStage({ auditKey: 1 })];
      component.dirtyRows.add(0);
      expect(component.isChangedRow(0)).toBe(true);
    });

    it('should return false for unchanged existing rows', () => {
      component.stages = [makeExistingStage({ auditKey: 1 })];
      expect(component.isChangedRow(0)).toBe(false);
    });
  });

  describe('getChangedStages', () => {
    it('should return only changed stages', () => {
      component.stages = [
        makeExistingStage({ auditKey: 1 }),
        makeNewStage({ auditKey: 0, sequence: 2 }),
        makeExistingStage({ auditKey: 3, sequence: 3 }),
      ];
      component.dirtyRows.add(2);

      const result = component.getChangedStages();

      expect(result.length).toBe(2);
      expect(result[0].auditKey).toBe(0);
      expect(result[1].auditKey).toBe(3);
    });

    it('should return empty array when no stages have changed', () => {
      component.stages = [makeExistingStage({ auditKey: 1 })];
      expect(component.getChangedStages()).toEqual([]);
    });

    it('should return all stages when all are new', () => {
      component.stages = [makeNewStage(), makeNewStage({ sequence: 2 })];
      expect(component.getChangedStages().length).toBe(2);
    });
  });

  describe('validateAllStages', () => {
    it('should return false when stage code is empty', () => {
      component.stages = [{
        sequence: 1, stageCode: '', description: '',
        effectiveDate: new Date(), terminationDate: null,
        auditKey: 0, isEditable: true, errors: {}
      }];

      const result = component.validateAllStages();

      expect(result).toBe(false);
    });

    it('should return false when effective date is missing', () => {
      component.stages = [{
        sequence: 1, stageCode: '01', description: '1st stage',
        effectiveDate: null, terminationDate: null,
        auditKey: 0, isEditable: true, errors: {}
      }];

      const result = component.validateAllStages();

      expect(result).toBe(false);
    });

    it('should return true when all changed stages are valid', () => {
      const futureDate = moment().add(1, 'day').toDate();
      component.stages = [makeNewStage({
        stageCode: '01',
        effectiveDate: futureDate,
      })];

      const result = component.validateAllStages();

      expect(result).toBe(true);
    });

    it('should return false when effective date is in the past for a new stage', () => {
      component.stages = [makeNewStage({
        stageCode: '01',
        effectiveDate: new Date('2020-01-01'),
      })];

      const result = component.validateAllStages();

      expect(result).toBe(false);
      expect(component.stages[0].errors!['effectiveDate']).toBe('Effective Date cannot be past date');
    });

    it('should return false when termination date is before effective date', () => {
      const futureDate = moment().add(5, 'days').toDate();
      const earlierDate = moment().add(1, 'day').toDate();
      component.stages = [makeNewStage({
        stageCode: '01',
        effectiveDate: futureDate,
        terminationDate: earlierDate,
      })];

      const result = component.validateAllStages();

      expect(result).toBe(false);
      expect(component.stages[0].errors!['terminationDate']).toBe('Termination Date must be on or after Effective Date');
    });

    it('should clear errors for unchanged rows', () => {
      component.stages = [makeExistingStage({
        auditKey: 1,
        errors: { stageCode: 'Old error' },
      })];

      component.validateAllStages();

      expect(component.stages[0].errors).toEqual({});
    });

    it('should validate only changed rows', () => {
      component.stages = [
        makeExistingStage({ auditKey: 1 }),
        makeNewStage({ stageCode: '', sequence: 2 }),
      ];

      const result = component.validateAllStages();

      expect(result).toBe(false);
      expect(component.stages[0].errors).toEqual({});
      expect(component.stages[1].errors!['stageCode']).toBeDefined();
    });

    it('should validate effectiveDate for existing stage when date has changed', () => {
      const stage = makeExistingStage({
        auditKey: 5,
        stageCode: '01',
        effectiveDate: new Date('2020-01-01'),
      });
      component.stages = [stage];
      triggerNgOnChanges([stage], true);
      component.stages[0].effectiveDate = new Date('2020-06-01');
      component.dirtyRows.add(0);

      const result = component.validateAllStages();

      expect(result).toBe(false);
      expect(component.stages[0].errors!['effectiveDate']).toBe('Effective Date cannot be past date');
    });

    it('should not flag effectiveDate for existing stage when date has not changed', () => {
      const pastDate = new Date('2020-01-01');
      const stage = makeExistingStage({
        auditKey: 5,
        stageCode: '01',
        effectiveDate: pastDate,
      });
      component.stages = [stage];
      triggerNgOnChanges([stage], true);
      component.dirtyRows.add(0);

      const result = component.validateAllStages();

      expect(result).toBe(true);
      expect(component.stages[0].errors!['effectiveDate']).toBeUndefined();
    });

    it('should validate with moment effective dates', () => {
      const futureMoment = moment().add(2, 'days');
      component.stages = [makeNewStage({
        stageCode: '01',
        effectiveDate: futureMoment as any,
      })];

      const result = component.validateAllStages();

      expect(result).toBe(true);
    });

    it('should handle whitespace-only stageCode as empty', () => {
      component.stages = [makeNewStage({
        stageCode: '   ',
        effectiveDate: moment().add(1, 'day').toDate(),
      })];

      const result = component.validateAllStages();

      expect(result).toBe(false);
      expect(component.stages[0].errors!['stageCode']).toBe('Stage Code is required.');
    });

    it('should return false when duplicate stage codes exist', () => {
      const futureDate = moment().add(1, 'day').toDate();
      component.stages = [
        makeNewStage({ stageCode: '01', effectiveDate: futureDate, sequence: 1 }),
        makeNewStage({ stageCode: '01', effectiveDate: futureDate, sequence: 2 }),
      ];

      const result = component.validateAllStages();

      expect(result).toBe(false);
      expect(component.stages[0].errors!['stageCode']).toBe('This stage code is already assigned to this process.');
    });

    it('should not flag duplicate when stage codes are different', () => {
      const futureDate = moment().add(1, 'day').toDate();
      component.stages = [
        makeNewStage({ stageCode: '01', effectiveDate: futureDate, sequence: 1 }),
        makeNewStage({ stageCode: '02', effectiveDate: futureDate, sequence: 2 }),
      ];

      const result = component.validateAllStages();

      expect(result).toBe(true);
      expect(component.stages[0].errors!['stageCode']).toBeUndefined();
      expect(component.stages[1].errors!['stageCode']).toBeUndefined();
    });
  });

  describe('hasRowErrors', () => {
    it('should return true when stage has errors', () => {
      const stage: Stage = {
        sequence: 1, stageCode: '01', description: '1st stage',
        effectiveDate: new Date(), terminationDate: null,
        auditKey: 1, isEditable: true, errors: { stageCode: 'Invalid' }
      };

      expect(component.hasRowErrors(stage)).toBe(true);
    });

    it('should return false when stage has no errors', () => {
      const stage: Stage = {
        sequence: 1, stageCode: '01', description: '1st stage',
        effectiveDate: new Date(), terminationDate: null,
        auditKey: 1, isEditable: true, errors: {}
      };

      expect(component.hasRowErrors(stage)).toBe(false);
    });

    it('should return false when errors is undefined', () => {
      const stage: Stage = {
        sequence: 1, stageCode: '01', description: '1st stage',
        effectiveDate: new Date(), terminationDate: null,
        auditKey: 1, isEditable: true,
      };

      expect(component.hasRowErrors(stage)).toBe(false);
    });

    it('should return false when errors is null', () => {
      const stage = makeExistingStage({ errors: null as any });
      expect(component.hasRowErrors(stage)).toBe(false);
    });
  });

  describe('hasValidationErrors', () => {
    it('should return true when any stage has errors', () => {
      component.stages = [
        makeExistingStage({ errors: {} }),
        makeExistingStage({ errors: { stageCode: 'Error' } }),
      ];
      expect(component.hasValidationErrors).toBe(true);
    });

    it('should return false when no stages have errors', () => {
      component.stages = [
        makeExistingStage({ errors: {} }),
        makeExistingStage({ errors: {} }),
      ];
      expect(component.hasValidationErrors).toBe(false);
    });

    it('should return false when stages array is empty', () => {
      component.stages = [];
      expect(component.hasValidationErrors).toBe(false);
    });
  });

  describe('hasNewStages', () => {
    it('should return true when there are new stages', () => {
      component.stages = [{
        sequence: 1, stageCode: '01', description: '1st stage',
        effectiveDate: new Date(), terminationDate: null,
        auditKey: 0, isEditable: true, errors: {}
      }];

      expect(component.hasNewStages()).toBe(true);
    });

    it('should return false when there are no new stages', () => {
      component.stages = [...mockStages];

      expect(component.hasNewStages()).toBe(false);
    });

    it('should return true when a stage has null auditKey', () => {
      component.stages = [makeExistingStage({ auditKey: null as any })];
      expect(component.hasNewStages()).toBe(true);
    });

    it('should return false for empty stages array', () => {
      component.stages = [];
      expect(component.hasNewStages()).toBe(false);
    });
  });

  describe('onEffectiveDateInput', () => {
    it('should not throw when called with a valid event', () => {
      component.stages = [makeNewStage()];
      const event = { target: { value: '01-Jan-2026' } } as unknown as Event;
      expect(() => component.onEffectiveDateInput(event, 0)).not.toThrow();
    });

    it('should handle empty input value', () => {
      component.stages = [makeNewStage()];
      const event = { target: { value: '' } } as unknown as Event;
      expect(() => component.onEffectiveDateInput(event, 0)).not.toThrow();
    });

    it('should handle whitespace-only input value', () => {
      component.stages = [makeNewStage()];
      const event = { target: { value: '   ' } } as unknown as Event;
      expect(() => component.onEffectiveDateInput(event, 0)).not.toThrow();
    });
  });

  describe('onTerminationDateInput', () => {
    it('should not throw when called with a valid event', () => {
      component.stages = [makeNewStage()];
      const event = { target: { value: '31-Dec-2026' } } as unknown as Event;
      expect(() => component.onTerminationDateInput(event, 0)).not.toThrow();
    });

    it('should handle empty input value', () => {
      component.stages = [makeNewStage()];
      const event = { target: { value: '' } } as unknown as Event;
      expect(() => component.onTerminationDateInput(event, 0)).not.toThrow();
    });
  });

  describe('buildDateErrorMatchers (via ngOnChanges)', () => {
    it('should create effDateMatchers that return false when control is null', () => {
      triggerNgOnChanges([makeExistingStage()], true);
      const matcher = component.effDateMatchers[0];
      expect(matcher.isErrorState(null as any, null as any)).toBe(false);
    });

    it('should create termDateMatchers that return false when control is null', () => {
      triggerNgOnChanges([makeExistingStage()], true);
      const matcher = component.termDateMatchers[0];
      expect(matcher.isErrorState(null as any, null as any)).toBe(false);
    });

    it('effDateMatcher should return parse error state when date has not changed and has parse error', () => {
      const stage = makeExistingStage({ auditKey: 5 });
      triggerNgOnChanges([stage], true);

      const matcher = component.effDateMatchers[0];
      const control = { errors: { matDatepickerParse: true }, invalid: true, dirty: false, touched: false };
      expect(matcher.isErrorState(control, null as any)).toBe(true);
    });

    it('effDateMatcher should return false when date has not changed and no parse error', () => {
      const stage = makeExistingStage({ auditKey: 5 });
      triggerNgOnChanges([stage], true);

      const matcher = component.effDateMatchers[0];
      const control = { errors: null, invalid: false, dirty: false, touched: false };
      expect(matcher.isErrorState(control, null as any)).toBe(false);
    });

    it('effDateMatcher for new row should return invalid state directly', () => {
      const stage = makeNewStage({ auditKey: 0 });
      triggerNgOnChanges([stage], true);

      const matcher = component.effDateMatchers[0];
      const control = { errors: null, invalid: true, dirty: false, touched: false };
      expect(matcher.isErrorState(control, null as any)).toBe(true);
    });

    it('effDateMatcher for existing dirty row should check dirty/touched', () => {
      const stage = makeExistingStage({ auditKey: 5, effectiveDate: new Date('2025-01-01') });
      triggerNgOnChanges([stage], true);
      component.stages[0].effectiveDate = new Date('2026-06-01');

      const matcher = component.effDateMatchers[0];
      const controlNotTouched = { errors: { required: true }, invalid: true, dirty: false, touched: false };
      expect(matcher.isErrorState(controlNotTouched, null as any)).toBe(false);

      const controlDirty = { errors: { required: true }, invalid: true, dirty: true, touched: false };
      expect(matcher.isErrorState(controlDirty, null as any)).toBe(true);

      const controlTouched = { errors: { required: true }, invalid: true, dirty: false, touched: true };
      expect(matcher.isErrorState(controlTouched, null as any)).toBe(true);
    });

    it('termDateMatcher for new row should return invalid state directly', () => {
      const stage = makeNewStage({ auditKey: 0 });
      triggerNgOnChanges([stage], true);

      const matcher = component.termDateMatchers[0];
      const control = { errors: null, invalid: true, dirty: false, touched: false };
      expect(matcher.isErrorState(control, null as any)).toBe(true);
    });

    it('termDateMatcher for existing row with changed termination date should check dirty/touched', () => {
      const stage = makeExistingStage({ auditKey: 5, terminationDate: null });
      triggerNgOnChanges([stage], true);
      component.stages[0].terminationDate = new Date('2026-12-31');

      const matcher = component.termDateMatchers[0];
      const controlDirty = { errors: { required: true }, invalid: true, dirty: true, touched: false };
      expect(matcher.isErrorState(controlDirty, null as any)).toBe(true);
    });

    it('should handle empty stages array for matchers', () => {
      triggerNgOnChanges([], true);
      expect(component.effDateMatchers.length).toBe(0);
      expect(component.termDateMatchers.length).toBe(0);
      expect(component.terminationDateFilters.length).toBe(0);
    });

    it('should handle null stages for matchers', () => {
      component.stages = null as any;
      const changes: SimpleChanges = {
        stages: new SimpleChange(undefined, null, true)
      };
      component.ngOnChanges(changes);
      expect(component.effDateMatchers.length).toBe(0);
      expect(component.termDateMatchers.length).toBe(0);
    });
  });

  describe('terminationDateFilters (via ngOnChanges)', () => {
    it('should return true when date is null', () => {
      triggerNgOnChanges([makeExistingStage()], true);
      const filter = component.terminationDateFilters[0];
      expect(filter(null)).toBe(true);
    });

    it('should return false for new row when date is before today', () => {
      const stage = makeNewStage({ auditKey: 0 });
      triggerNgOnChanges([stage], true);
      const filter = component.terminationDateFilters[0];
      const pastDate = moment().subtract(10, 'days');
      expect(filter(pastDate)).toBe(false);
    });

    it('should return true for new row when date is today or later', () => {
      const stage = makeNewStage({ auditKey: 0 });
      triggerNgOnChanges([stage], true);
      const filter = component.terminationDateFilters[0];
      const futureDate = moment().add(10, 'days');
      expect(filter(futureDate)).toBe(true);
    });

    it('should return false when date is before effectiveDate', () => {
      const stage = makeExistingStage({
        auditKey: 1,
        effectiveDate: moment().add(5, 'days').toDate(),
      });
      triggerNgOnChanges([stage], true);
      const filter = component.terminationDateFilters[0];
      const beforeEff = moment().add(2, 'days');
      expect(filter(beforeEff)).toBe(false);
    });

    it('should return true when date is on or after effectiveDate', () => {
      const effDate = moment().subtract(10, 'days');
      const stage = makeExistingStage({
        auditKey: 1,
        effectiveDate: effDate.toDate(),
      });
      triggerNgOnChanges([stage], true);
      const filter = component.terminationDateFilters[0];
      const afterEff = moment().add(5, 'days');
      expect(filter(afterEff)).toBe(true);
    });

    it('should allow any date for existing row without effectiveDate', () => {
      const stage = makeExistingStage({
        auditKey: 1,
        effectiveDate: null,
      });
      triggerNgOnChanges([stage], true);
      const filter = component.terminationDateFilters[0];
      const anyDate = moment().add(5, 'days');
      expect(filter(anyDate)).toBe(true);
    });
  });
});
