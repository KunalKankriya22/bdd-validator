import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { TstparmComponent } from './tstparm.component';
import { TstparmService } from './services/tstparm.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import {
  DropdownItem,
  ParmCodeDetail,
  AssignedParameter,
} from './models/tstparm.model';
import moment from 'moment';
import { createMockSnackbarService, createMockMatDialog } from '@shared/testing/common-mocks';

describe('TstparmComponent', () => {
  let component: TstparmComponent;
  let fixture: ComponentFixture<TstparmComponent>;
  let serviceSpy: jasmine.SpyObj<TstparmService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterTimezoneSpy: jasmine.SpyObj<ChapterTimezoneService>;

  const mockTests: DropdownItem[] = [
    { value: 'IAT', label: 'Indirect Antiglobulin Test' },
    { value: 'DAT', label: 'Direct Antiglobulin Test' },
  ];

  const mockParmTypes: DropdownItem[] = [
    { value: 'MAN', label: 'Manual' },
    { value: 'AUTO', label: 'Automated' },
  ];

  const mockAvailableParameters: ParmCodeDetail[] = [
    { parmCode: 'ABORH', description: 'Review Date', datatype: 'NUMERIC' },
    { parmCode: 'CEL', description: 'Celeste', datatype: 'NUMERIC' },
    { parmCode: 'BAT', description: 'BACT', datatype: 'NUMERIC', relatedCode: 'BACT' },
  ];

  const mockAssignedParameters: AssignedParameter[] = [
    {
      parmCode: 'ABORH',
      parmDesc: 'Review Date',
      datatype: 'NUMERIC',
      sequence: 1,
      acceptMin: 0,
      acceptMax: 10,
      effDate: '2025-01-11',
      effTime: null,
      termDate: null,
      termTime: null,
      isNew: false,
    },
    {
      parmCode: 'CEL',
      parmDesc: 'Celeste',
      datatype: 'NUMERIC',
      sequence: 2,
      acceptMin: 0,
      acceptMax: 5,
      effDate: '2025-01-11',
      effTime: null,
      termDate: null,
      termTime: null,
      isNew: false,
    },
  ];

  const fakeMoment = moment('2025-06-15T10:30:00');

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('TstparmService', [
      'getTestIdsDropdown',
      'getParmTypesDropdown',
      'getAllParmCodes',
      'getAssignedParameters',
      'saveTestConfiguration',
      'deleteParameter',
    ]);

    snackbarSpy = createMockSnackbarService();
    dialogSpy = createMockMatDialog();
    chapterTimezoneSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate',
      'getChapterLocalDateTime',
    ]);

    serviceSpy.getTestIdsDropdown.and.returnValue(of(mockTests));
    serviceSpy.getAllParmCodes.and.returnValue(of(mockAvailableParameters));
    serviceSpy.getParmTypesDropdown.and.returnValue(of(mockParmTypes));
    serviceSpy.getAssignedParameters.and.returnValue(of(mockAssignedParameters));
    serviceSpy.saveTestConfiguration.and.returnValue(of({ success: true, message: 'Saved' }));

    chapterTimezoneSpy.getChapterLocalDate.and.returnValue(fakeMoment.clone());
    chapterTimezoneSpy.getChapterLocalDateTime.and.returnValue(fakeMoment.clone());



      TestBed.configureTestingModule({
      imports: [TstparmComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TstparmService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneSpy },
      ],
    });


    


      serviceSpy.getTestIdsDropdown.calls.reset();


      serviceSpy.getParmTypesDropdown.calls.reset();


      serviceSpy.getAllParmCodes.calls.reset();


      serviceSpy.getAssignedParameters.calls.reset();


      serviceSpy.saveTestConfiguration.calls.reset();


      serviceSpy.deleteParameter.calls.reset();


      dialogSpy.open.calls.reset();


      chapterTimezoneSpy.getChapterLocalDate.calls.reset();


      chapterTimezoneSpy.getChapterLocalDateTime.calls.reset();


      serviceSpy.getTestIdsDropdown.and.returnValue(of(mockTests));


      serviceSpy.getAllParmCodes.and.returnValue(of(mockAvailableParameters));


      serviceSpy.getParmTypesDropdown.and.returnValue(of(mockParmTypes));


      serviceSpy.getAssignedParameters.and.returnValue(of(mockAssignedParameters));


      serviceSpy.saveTestConfiguration.and.returnValue(of({ success: true, message: 'Saved' }));


      chapterTimezoneSpy.getChapterLocalDate.and.returnValue(fakeMoment.clone());


      chapterTimezoneSpy.getChapterLocalDateTime.and.returnValue(fakeMoment.clone());


    fixture = TestBed.createComponent(TstparmComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {




    it('should load lookup data on init', fakeAsync(() => {
      fixture.detectChanges();
      tick(600);

      expect((component as any).tests().length).toBe(2);
    }));


  });
  describe('Form Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(600);
    }));

    it('should require test ID', () => {
      expect(component.form.get('testId')?.hasError('required')).toBeTrue();
    });

    it('should require parmType', () => {
      expect(component.form.get('parmType')?.hasError('required')).toBeTrue();
    });

    it('should require at least one tech checkbox', () => {
      component.form.patchValue({
        testId: 'IAT',
        parmType: 'MAN',
        tech1: false,
        tech2: false,
      });
      component.form.get('tech1')?.markAsTouched();

      expect(component.form.hasError('atLeastOneTech')).toBeTrue();
    });


  });

  describe('Test ID Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(600);
    }));

    it('should populate description when test ID is selected', fakeAsync(() => {
      component.form.patchValue({ testId: 'IAT' });
      tick(100);

      expect((component as any).selectedTestDescription()).toBe('Indirect Antiglobulin Test');
    }));

    it('should clear description when test ID is cleared', fakeAsync(() => {
      component.form.patchValue({ testId: 'IAT' });
      tick(100);
      component.form.patchValue({ testId: null });
      tick(100);

      expect((component as any).selectedTestDescription()).toBe('');
    }));

    it('should load parm types when test ID is selected', fakeAsync(() => {
      component.form.patchValue({ testId: 'IAT' });
      tick(100);

      expect(serviceSpy.getParmTypesDropdown).toHaveBeenCalledWith('IAT');
    }));
  });

  describe('Assigned Parameters', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(600);
    }));



    it('should display assigned parameters in table', () => {
      (component as any).assignedParameters.set(mockAssignedParameters);
      (component as any).loadingParameters.set(false);
      fixture.detectChanges();

      const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
      expect(rows.length).toBe(2);
    });

    it('should show parameter count in heading', () => {
      (component as any).assignedParameters.set(mockAssignedParameters);
      (component as any).loadingParameters.set(false);
      fixture.detectChanges();

      const heading = fixture.debugElement.query(By.css('h3'));
      expect(heading.nativeElement.textContent).toContain('Assigned Parameters (2)');
    });
  });

  describe('Add Parameter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(600);
    }));



    it('should assign correct sequence number', () => {
      (component as any).assignedParameters.set([
        { ...mockAssignedParameters[0], sequence: 1 },
      ]);

      component.onAddParameter(mockAvailableParameters[1]);

      const added = (component as any).assignedParameters()[1];
      expect(added.sequence).toBe(2);
    });

    it('should mark form as dirty after adding parameter', () => {
      (component as any).formDirty.set(false);
      component.onAddParameter(mockAvailableParameters[0]);

      expect((component as any).formDirty()).toBeTrue();
    });



    it('should mark new parameter with isNew flag', () => {
      component.onAddParameter(mockAvailableParameters[0]);

      const added = (component as any).assignedParameters()[0];
      expect(added.isNew).toBeTrue();
    });
  });

  describe('Remove Parameter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(600);
    }));



    it('should recalculate sequence numbers after removing unsaved parameter', () => {
      const params: AssignedParameter[] = [
        { parmCode: 'NEW1', parmDesc: 'First', sequence: 1, isNew: true, effDate: '2025-06-15' },
        { parmCode: 'NEW2', parmDesc: 'Second', sequence: 2, isNew: true, effDate: '2025-06-15' },
      ];
      (component as any).assignedParameters.set(params);

      component.onRemoveParameter(params[0]);

      const remaining = (component as any).assignedParameters();
      expect(remaining.length).toBe(1);
      expect(remaining[0].sequence).toBe(1);
    });

    it('should set termination date instead of deleting saved parameter', () => {
      (component as any).assignedParameters.set([...mockAssignedParameters]);

      component.onRemoveParameter(mockAssignedParameters[0]);

      const updated = (component as any).assignedParameters().find(
        (p: AssignedParameter) => p.parmCode === 'ABORH'
      );
      expect(updated).toBeTruthy();
      expect(updated.termDate).toBe('2025-06-15');
      expect(updated.termTime).toBe('10:30');
    });







    it('should mark form as dirty after terminating saved parameter', () => {
      (component as any).formDirty.set(false);
      (component as any).assignedParameters.set([...mockAssignedParameters]);

      component.onRemoveParameter(mockAssignedParameters[0]);

      expect((component as any).formDirty()).toBeTrue();
    });

    it('should mark form as dirty after removing unsaved parameter', () => {
      const newParam: AssignedParameter = {
        parmCode: 'NEW1',
        parmDesc: 'New',
        sequence: 1,
        isNew: true,
        effDate: '2025-06-15',
      };
      (component as any).formDirty.set(false);
      (component as any).assignedParameters.set([newParam]);

      component.onRemoveParameter(newParam);

      expect((component as any).formDirty()).toBeTrue();
    });

    it('should not affect other parameters when terminating one', () => {
      (component as any).assignedParameters.set([...mockAssignedParameters]);

      component.onRemoveParameter(mockAssignedParameters[0]);

      const other = (component as any).assignedParameters().find(
        (p: AssignedParameter) => p.parmCode === 'CEL'
      );
      expect(other.termDate).toBeNull();
      expect(other.termTime).toBeNull();
    });
  });

  describe('Drag and Drop Reordering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(600);
      (component as any).assignedParameters.set([...mockAssignedParameters]);
    }));

    it('should reorder parameters on drop', () => {
      const event: CdkDragDrop<AssignedParameter[]> = {
        previousIndex: 0,
        currentIndex: 1,
        item: undefined as any,
        container: undefined as any,
        previousContainer: undefined as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: undefined as any,
      };

      const firstParmCode = (component as any).assignedParameters()[0].parmCode;
      component.onDrop(event);

      expect((component as any).assignedParameters()[1].parmCode).toBe(firstParmCode);
    });



    it('should not change order if dropped in same position', () => {
      const event: CdkDragDrop<AssignedParameter[]> = {
        previousIndex: 0,
        currentIndex: 0,
        item: undefined as any,
        container: undefined as any,
        previousContainer: undefined as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: undefined as any,
      };

      const originalFirst = (component as any).assignedParameters()[0].parmCode;
      component.onDrop(event);

      expect((component as any).assignedParameters()[0].parmCode).toBe(originalFirst);
    });

    it('should mark form as dirty after reorder', () => {
      (component as any).formDirty.set(false);
      const event: CdkDragDrop<AssignedParameter[]> = {
        previousIndex: 0,
        currentIndex: 1,
        item: undefined as any,
        container: undefined as any,
        previousContainer: undefined as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: undefined as any,
      };

      component.onDrop(event);

      expect((component as any).formDirty()).toBeTrue();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(600);
      (component as any).availableParameters.set(mockAvailableParameters);
    }));





    it('should filter parameters by related code', () => {
      (component as any).searchTerm.set('bact');

      const filtered = (component as any).filteredAvailableParameters();
      expect(filtered.some((p: ParmCodeDetail) => p.relatedCode === 'BACT')).toBeTrue();
    });

    it('should show all parameters when search is empty', () => {
      (component as any).searchTerm.set('');

      const filtered = (component as any).filteredAvailableParameters();
      expect(filtered.length).toBe(mockAvailableParameters.length);
    });
  });

  describe('Parameter Field Changes', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(600);
      (component as any).assignedParameters.set([...mockAssignedParameters]);
    }));

    it('should update acceptMin value', () => {
      const param = (component as any).assignedParameters()[0];
      component.onParameterFieldChange(param, 'acceptMin', 5);

      const updated = (component as any).assignedParameters()[0];
      expect(updated.acceptMin).toBe(5);
    });

    it('should update acceptMax value', () => {
      const param = (component as any).assignedParameters()[0];
      component.onParameterFieldChange(param, 'acceptMax', 100);

      const updated = (component as any).assignedParameters()[0];
      expect(updated.acceptMax).toBe(100);
    });

    it('should mark form as dirty after field change', () => {
      (component as any).formDirty.set(false);
      const param = (component as any).assignedParameters()[0];
      component.onParameterFieldChange(param, 'acceptMin', 5);

      expect((component as any).formDirty()).toBeTrue();
    });
  });

  describe('Form Submission', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(600);
    }));



    it('should not submit when no parameters assigned', fakeAsync(() => {
      component.form.patchValue({
        testId: 'IAT',
        parmType: 'MAN',
        tech1: true,
      });
      (component as any).assignedParameters.set([]);

      component.onSubmit();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('At least one parameter must be assigned');
    }));

    it('should submit when form is valid and has parameters', fakeAsync(() => {
      component.form.patchValue({
        testId: 'IAT',
        parmType: 'MAN',
        tech1: true,
      });
      (component as any).assignedParameters.set([mockAssignedParameters[0]]);

      component.onSubmit();
      tick(100);

      expect(serviceSpy.saveTestConfiguration).toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalled();
    }));



    it('should mark all parameters as not new after successful save', fakeAsync(() => {
      component.form.patchValue({
        testId: 'IAT',
        parmType: 'MAN',
        tech1: true,
      });
      const newParam: AssignedParameter = {
        parmCode: 'NEW1',
        sequence: 1,
        isNew: true,
        effDate: '2025-06-15',
      };
      (component as any).assignedParameters.set([newParam]);

      component.onSubmit();
      tick(100);

      expect((component as any).assignedParameters()[0].isNew).toBeFalse();
    }));

    it('should not submit when time format is invalid', fakeAsync(() => {
      component.form.patchValue({
        testId: 'IAT',
        parmType: 'MAN',
        tech1: true,
      });
      (component as any).assignedParameters.set([
        { ...mockAssignedParameters[0], effTime: '99:99' },
      ]);

      component.onSubmit();
      tick(100);

      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Invalid time format')
      );
      expect(serviceSpy.saveTestConfiguration).not.toHaveBeenCalled();
    }));
  });

  describe('Cancel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(600);
    }));



    it('should not reset when form is not dirty', () => {
      (component as any).formDirty.set(false);
      (component as any).assignedParameters.set([...mockAssignedParameters]);

      component.onCancel();

      expect((component as any).assignedParameters().length).toBe(2);
    });
  });

  describe('Accessibility', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(600);
    }));

    it('should have unique IDs for all form fields', () => {
      const testIdField = fixture.debugElement.query(By.css('[id$="-testId"]'));
      expect(testIdField).toBeTruthy();
      expect(testIdField.nativeElement.id).toContain((component as any).componentId);
    });






  });
  describe('Numeric Input Validation', () => {
    it('should block non-numeric keys', () => {
      const event = new KeyboardEvent('keypress', { key: 'A' });
      spyOn(event, 'preventDefault');

      const result = component.onlyNumbers(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result).toBeFalse();
    });

    it('should allow numeric keys', () => {
      const event = new KeyboardEvent('keypress', { key: '5' });
      spyOn(event, 'preventDefault');

      const result = component.onlyNumbers(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(result).toBeTrue();
    });

    it('should allow Backspace key', () => {
      const event = new KeyboardEvent('keypress', { key: 'Backspace' });
      spyOn(event, 'preventDefault');

      const result = component.onlyNumbers(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(result).toBeTrue();
    });
  });

  describe('Time Input Validation', () => {
    it('should detect valid time', () => {
      expect(component.hasTimeError('14:30')).toBeFalse();
    });

    it('should detect invalid time', () => {
      expect(component.hasTimeError('99:99')).toBeTrue();
    });

    it('should not flag null as error', () => {
      expect(component.hasTimeError(null)).toBeFalse();
    });

    it('should not flag empty string as error', () => {
      expect(component.hasTimeError('')).toBeFalse();
    });
  });

  describe('Date Formatting', () => {
    it('should format valid date to DD-MMM-YYYY', () => {
      const formatted = component.formatDate('2025-01-11');
      expect(formatted).toBe('11-JAN-2025');
    });




  });

  describe('Moment Parsing', () => {
    it('should parse valid date string', () => {
      const result = component.parseMoment('2025-01-11');
      expect(result).toBeTruthy();
      expect(result!.format('YYYY-MM-DD')).toBe('2025-01-11');
    });



    it('should return null for undefined', () => {
      expect(component.parseMoment(undefined)).toBeNull();
    });
  });

  describe('Computed Signals', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(600);
    }));

    it('isEmpty should be true when no assigned parameters', () => {
      (component as any).assignedParameters.set([]);
      expect((component as any).isEmpty()).toBeTrue();
    });

    it('isEmpty should be false when parameters exist', () => {
      (component as any).assignedParameters.set([mockAssignedParameters[0]]);
      expect((component as any).isEmpty()).toBeFalse();
    });

    it('hasTimeErrors should detect invalid effTime', () => {
      (component as any).assignedParameters.set([
        { ...mockAssignedParameters[0], effTime: 'bad' },
      ]);
      expect((component as any).hasTimeErrors()).toBeTrue();
    });

    it('hasTimeErrors should detect invalid termTime', () => {
      (component as any).assignedParameters.set([
        { ...mockAssignedParameters[0], termTime: '99:99' },
      ]);
      expect((component as any).hasTimeErrors()).toBeTrue();
    });

    it('hasTimeErrors should be false with valid times', () => {
      (component as any).assignedParameters.set([
        { ...mockAssignedParameters[0], effTime: '10:30', termTime: null },
      ]);
      expect((component as any).hasTimeErrors()).toBeFalse();
    });



    it('canSave should be false when form is not dirty', () => {
      component.form.patchValue({
        testId: 'IAT',
        parmType: 'MAN',
        tech1: true,
      });
      (component as any).formDirty.set(false);

      expect((component as any).canSave()).toBeFalse();
    });
  });

  describe('Date Field Change', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick(600);
      (component as any).assignedParameters.set([...mockAssignedParameters]);
    }));

    it('should update effDate on date change', () => {
      const param = (component as any).assignedParameters()[0];
      component.onDateFieldChange(param, 'effDate', moment('2025-03-15'));

      const updated = (component as any).assignedParameters()[0];
      expect(updated.effDate).toBe('2025-03-15');
    });

    it('should update termDate on date change', () => {
      const param = (component as any).assignedParameters()[0];
      component.onDateFieldChange(param, 'termDate', moment('2025-12-31'));

      const updated = (component as any).assignedParameters()[0];
      expect(updated.termDate).toBe('2025-12-31');
    });

    it('should auto-set termTime when termDate is set and no existing termTime', () => {
      const param = (component as any).assignedParameters()[0];
      expect(param.termTime).toBeNull();

      component.onDateFieldChange(param, 'termDate', moment('2025-12-31'));

      const updated = (component as any).assignedParameters()[0];
      expect(updated.termTime).toBe('10:30');
    });



    it('should mark form as dirty after date change', () => {
      (component as any).formDirty.set(false);
      const param = (component as any).assignedParameters()[0];
      component.onDateFieldChange(param, 'effDate', moment('2025-03-15'));

      expect((component as any).formDirty()).toBeTrue();
    });
  });
});
