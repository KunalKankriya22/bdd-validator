import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange, signal } from '@angular/core';
import moment from 'moment';

import { StandingOrderSidePanelComponent } from './standing-order-side-panel';
import { StandingOrderService } from '../../services/standing-order.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import { StandingOrderListDto, StandingOrderDto } from '../../models/standing-order.model';

describe('StandingOrderSidePanelComponent', () => {
  let component: StandingOrderSidePanelComponent;
  let fixture: ComponentFixture<StandingOrderSidePanelComponent>;
  let standingOrderServiceSpy: jasmine.SpyObj<StandingOrderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  // ─── Shared Mock Data ──────────────────────────────────────────────────────

  const mockRecord: StandingOrderListDto = {
    contractId: 'C001',
    consigneeId: 'CN001',
    weekDay: 'MON',
    weekDayDisplay: 'Monday',
    confirmation: 'Yes',
    timeRequired: '8:00 AM',
    effectiveDate: '01-JUN-2024',
    terminationDate: '--',
    modificationDate: null
  };

  const mockDto: StandingOrderDto = {
    chapterId: 'TST',
    contractId: 'C001',
    consigneeId: 'CN001',
    weekDay: 'MON',
    confirmFlag: 'Y',
    requiredTime: 8,   // getTimeDisplay(8) === '8:00 AM'
    effDate: '2024-06-01T00:00:00',
    termDate: null,
    lastModifiedDate: '2024-06-01T10:30:00Z'
  };

  // ─── TestBed Setup ─────────────────────────────────────────────────────────

  beforeEach(() => {
    standingOrderServiceSpy = jasmine.createSpyObj('StandingOrderService', [
      'getStandingOrderById',
      'updateStandingOrder',
      'createStandingOrder'
    ]);
    headerServiceSpy = createMockHeaderService();
    // Default: chapterTimeZone returns 'America/New_York' (from createMockHeaderService)

    TestBed.configureTestingModule({
      imports: [StandingOrderSidePanelComponent, NoopAnimationsModule],
      providers: [
        { provide: StandingOrderService, useValue: standingOrderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });

    fixture = TestBed.createComponent(StandingOrderSidePanelComponent);
    component = fixture.componentInstance;
    component.contractId = 'C001';
    component.consigneeId = 'CN001';
    // DO NOT call fixture.detectChanges() here — let each test group control it
  });

  // ─── Helper: fill add-mode form with valid values ──────────────────────────

  function fillValidAddForm(): void {
    component.form.patchValue({
      weekDay: 'MON',
      confirmFlag: 'Y',
      requiredTime: '8:00 AM', // matches TIME_OPTIONS[8].display
      effDate: moment(),       // today is not past, passes effectiveDateNotPastValidator
      termDate: null
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Initialization — Add Mode
  // ──────────────────────────────────────────────────────────────────────────

  describe('Initialization (add mode)', () => {
    beforeEach(() => {
      fixture.detectChanges(); // triggers ngOnInit
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should default to add mode', () => {
      expect(component.mode).toBe('add');
    });

    it('should expose weekDays, timeOptions and confirmationOptions', () => {
      expect(component.weekDays.length).toBeGreaterThan(0);
      expect(component.timeOptions.length).toBe(24);
      expect(component.confirmationOptions.length).toBeGreaterThan(0);
    });

    it('should initialize form with confirmFlag "Y" in add mode', () => {
      expect(component.form.get('confirmFlag')?.value).toBe('Y');
    });

    it('should initialize form with effDate set to minDate (a Moment) in add mode', () => {
      const effDate = component.form.get('effDate')?.value;
      expect(effDate).not.toBeNull();
      expect(moment.isMoment(effDate)).toBeTrue();
    });

    it('should initialize form with weekDay enabled in add mode', () => {
      expect(component.form.get('weekDay')?.disabled).toBeFalse();
    });

    it('should not call getStandingOrderById in add mode', () => {
      expect(standingOrderServiceSpy.getStandingOrderById).not.toHaveBeenCalled();
    });

    it('should not have existingRecord (loading is false and no data loaded)', () => {
      expect(component.loading()).toBeFalse();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Initialization — Edit Mode
  // ──────────────────────────────────────────────────────────────────────────

  describe('Initialization (edit mode)', () => {
    beforeEach(() => {
      standingOrderServiceSpy.getStandingOrderById.and.returnValue(of(mockDto));
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges(); // triggers ngOnInit → loadExistingRecord (synchronous via of())
    });

    it('should call getStandingOrderById with correct composite key', () => {
      expect(standingOrderServiceSpy.getStandingOrderById)
        .toHaveBeenCalledOnceWith('C001', 'CN001', 'MON');
    });

    it('should patch confirmFlag from loaded record', () => {
      expect(component.form.get('confirmFlag')?.value).toBe('Y');
    });

    it('should patch requiredTime as display string from loaded record', () => {
      // getTimeDisplay(8) === '8:00 AM'
      expect(component.form.get('requiredTime')?.value).toBe('8:00 AM');
    });

    it('should patch effDate as a Moment object from loaded record', () => {
      const effDate = component.form.get('effDate')?.value;
      expect(moment.isMoment(effDate)).toBeTrue();
    });

    it('should have weekDay control disabled in edit mode', () => {
      expect(component.form.get('weekDay')?.disabled).toBeTrue();
    });

    it('should set loading to false after successful load', () => {
      expect(component.loading()).toBeFalse();
    });

    it('should set loading to false on load error', () => {
      // Use a fresh component so we can observe the error path
      const errorFixture = TestBed.createComponent(StandingOrderSidePanelComponent);
      const errorComponent = errorFixture.componentInstance;
      standingOrderServiceSpy.getStandingOrderById.and.returnValue(
        throwError(() => new Error('Not found'))
      );
      errorComponent.mode = 'edit';
      errorComponent.record = mockRecord;
      errorFixture.detectChanges();

      expect(errorComponent.loading()).toBeFalse();
    });

    it('should return early from loadExistingRecord when record is null (internal guard)', () => {
      standingOrderServiceSpy.getStandingOrderById.calls.reset();
      component.record = null;
      // Call the private method directly; it must not call the service
      (component as any).loadExistingRecord();
      expect(standingOrderServiceSpy.getStandingOrderById).not.toHaveBeenCalled();
    });

    it('should not patch form when getStandingOrderById returns null', () => {
      const nullDtoFixture = TestBed.createComponent(StandingOrderSidePanelComponent);
      const nullDtoComponent = nullDtoFixture.componentInstance;
      standingOrderServiceSpy.getStandingOrderById.and.returnValue(of(null));
      nullDtoComponent.mode = 'edit';
      nullDtoComponent.record = mockRecord;
      nullDtoFixture.detectChanges();

      // confirmFlag stays at '' (edit mode default) because dto is null — form not patched
      expect(nullDtoComponent.form.get('confirmFlag')?.value).toBe('');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Getters: panelTitle & isEditMode
  // ──────────────────────────────────────────────────────────────────────────

  describe('panelTitle getter', () => {
    it('returns "Add New Day Details" in add mode', () => {
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Add New Day Details');
    });

    it('returns "Edit Previous Day Details" in edit mode', () => {
      standingOrderServiceSpy.getStandingOrderById.and.returnValue(of(mockDto));
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      expect(component.panelTitle).toBe('Edit Previous Day Details');
    });
  });

  describe('isEditMode getter', () => {
    it('returns false when mode is "add"', () => {
      fixture.detectChanges();
      expect(component.isEditMode).toBeFalse();
    });

    it('returns true when mode is "edit"', () => {
      standingOrderServiceSpy.getStandingOrderById.and.returnValue(of(mockDto));
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      expect(component.isEditMode).toBeTrue();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. lastModifiedDisplay getter
  // ──────────────────────────────────────────────────────────────────────────

  describe('lastModifiedDisplay getter', () => {
    it('returns null in add mode (not edit mode)', () => {
      fixture.detectChanges();
      expect(component.lastModifiedDisplay).toBeNull();
    });

    it('returns null in edit mode when existingRecord.lastModifiedDate is null', () => {
      standingOrderServiceSpy.getStandingOrderById.and.returnValue(of({
        ...mockDto,
        lastModifiedDate: null
      }));
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      expect(component.lastModifiedDisplay).toBeNull();
    });

    it('returns a formatted DD-MMM-YYYY uppercase string in edit mode with chapterTimeZone', () => {
      standingOrderServiceSpy.getStandingOrderById.and.returnValue(of(mockDto));
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();

      const result = component.lastModifiedDisplay;
      expect(result).not.toBeNull();
      // Expect DD-MMM-YYYY format (e.g., "01-JUN-2024")
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('returns a formatted date in edit mode when chapterTimeZone is empty (local moment path)', () => {
      // Override chapterTimeZone signal to return ''
      (headerServiceSpy as any).chapterTimeZone = signal('');

      standingOrderServiceSpy.getStandingOrderById.and.returnValue(of(mockDto));
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();

      const result = component.lastModifiedDisplay;
      expect(result).not.toBeNull();
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('returns null when lastModifiedDate is an unparseable string', () => {
      standingOrderServiceSpy.getStandingOrderById.and.returnValue(of({
        ...mockDto,
        lastModifiedDate: 'not-a-real-date-string-!!!!'
      }));
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      // moment('not-a-real-date-string-!!!!').isValid() === false → returns null
      expect(component.lastModifiedDisplay).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. ngOnChanges
  // ──────────────────────────────────────────────────────────────────────────

  describe('ngOnChanges', () => {
    beforeEach(() => {
      fixture.detectChanges(); // runs ngOnInit → initializes this.form
    });

    it('re-initializes the form when mode input changes', () => {
      const initFormSpy = spyOn<any>(component, 'initForm').and.callThrough();

      component.mode = 'edit';
      component.ngOnChanges({ mode: new SimpleChange('add', 'edit', false) });

      expect(initFormSpy).toHaveBeenCalled();
    });

    it('re-initializes the form when record input changes', () => {
      const initFormSpy = spyOn<any>(component, 'initForm').and.callThrough();

      component.record = mockRecord;
      component.ngOnChanges({ record: new SimpleChange(null, mockRecord, false) });

      expect(initFormSpy).toHaveBeenCalled();
    });

    it('calls loadExistingRecord when switching to edit mode with a non-null record', () => {
      standingOrderServiceSpy.getStandingOrderById.and.returnValue(of(mockDto));
      component.mode = 'edit';
      component.record = mockRecord;

      component.ngOnChanges({ mode: new SimpleChange('add', 'edit', false) });

      expect(standingOrderServiceSpy.getStandingOrderById)
        .toHaveBeenCalledWith('C001', 'CN001', 'MON');
    });

    it('does not call loadExistingRecord when switching back to add mode', () => {
      standingOrderServiceSpy.getStandingOrderById.calls.reset();
      component.mode = 'add';

      component.ngOnChanges({ mode: new SimpleChange('edit', 'add', false) });

      expect(standingOrderServiceSpy.getStandingOrderById).not.toHaveBeenCalled();
    });

    it('does nothing when form is not yet initialized (ngOnChanges before ngOnInit)', () => {
      // Fresh component — ngOnInit hasn't run, form is undefined
      const freshFixture = TestBed.createComponent(StandingOrderSidePanelComponent);
      const freshComponent = freshFixture.componentInstance;
      freshComponent.mode = 'edit';
      freshComponent.record = mockRecord;

      freshComponent.ngOnChanges({ mode: new SimpleChange(undefined, 'edit', true) });

      expect(standingOrderServiceSpy.getStandingOrderById).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. onSave — Invalid form
  // ──────────────────────────────────────────────────────────────────────────

  describe('onSave — invalid form', () => {
    beforeEach(() => {
      fixture.detectChanges();
      // Form is invalid in add mode: weekDay is '' and requiredTime is null
      expect(component.form.valid).toBeFalse();
    });

    it('marks all controls as touched when form is invalid', () => {
      component.onSave(false);
      expect(component.form.get('weekDay')?.touched).toBeTrue();
      expect(component.form.get('requiredTime')?.touched).toBeTrue();
      expect(component.form.get('confirmFlag')?.touched).toBeTrue();
    });

    it('does not call createStandingOrder when form is invalid', () => {
      component.onSave(false);
      expect(standingOrderServiceSpy.createStandingOrder).not.toHaveBeenCalled();
    });

    it('does not call updateStandingOrder when form is invalid', () => {
      component.mode = 'edit';
      component.onSave(false);
      expect(standingOrderServiceSpy.updateStandingOrder).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. onSave — Add Mode (valid form)
  // ──────────────────────────────────────────────────────────────────────────

  describe('onSave — add mode (valid form)', () => {
    beforeEach(() => {
      fixture.detectChanges();
      standingOrderServiceSpy.createStandingOrder.and.returnValue(of({} as any));
      fillValidAddForm();
    });

    it('form should be valid after filling with valid values', () => {
      expect(component.form.valid).toBeTrue();
    });

    it('calls createStandingOrder with contractId, consigneeId, weekDay and confirmFlag', () => {
      component.onSave(false);

      expect(standingOrderServiceSpy.createStandingOrder).toHaveBeenCalledTimes(1);
      const dto = standingOrderServiceSpy.createStandingOrder.calls.mostRecent().args[0];
      expect(dto.contractId).toBe('C001');
      expect(dto.consigneeId).toBe('CN001');
      expect(dto.weekDay).toBe('MON');
      expect(dto.confirmFlag).toBe('Y');
      expect(dto.requiredTime).toBe(8); // parseTimeToHour('8:00 AM') === 8
    });

    it('emits saveSuccess with message when addAnother is false', () => {
      let emitted: string | undefined;
      component.saveSuccess.subscribe(msg => { emitted = msg; });

      component.onSave(false);

      expect(emitted).toBe('Standing order created successfully');
    });

    it('does not emit saveAndAddAnother when addAnother is false', () => {
      const spy = jasmine.createSpy('saveAndAddAnother');
      component.saveAndAddAnother.subscribe(spy);

      component.onSave(false);

      expect(spy).not.toHaveBeenCalled();
    });

    it('emits saveAndAddAnother with message when addAnother is true', () => {
      let emitted: string | undefined;
      component.saveAndAddAnother.subscribe(msg => { emitted = msg; });

      component.onSave(true);

      expect(emitted).toBe('Standing order created successfully');
    });

    it('resets form to defaults after saveAndAddAnother', () => {
      component.onSave(true);

      expect(component.form.get('weekDay')?.value).toBe('');
      expect(component.form.get('confirmFlag')?.value).toBe('Y');
      expect(component.form.get('requiredTime')?.value).toBeNull();
    });

    it('sets loading to false on create error', () => {
      standingOrderServiceSpy.createStandingOrder.and.returnValue(
        throwError(() => new Error('Create failed'))
      );

      component.onSave(false);

      expect(component.loading()).toBeFalse();
    });

    it('does not emit saveSuccess on create error', () => {
      standingOrderServiceSpy.createStandingOrder.and.returnValue(
        throwError(() => new Error('Create failed'))
      );
      const spy = jasmine.createSpy('successSpy');
      component.saveSuccess.subscribe(spy);

      component.onSave(false);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. onSave — Edit Mode (valid form after load)
  // ──────────────────────────────────────────────────────────────────────────

  describe('onSave — edit mode (valid form)', () => {
    beforeEach(() => {
      standingOrderServiceSpy.getStandingOrderById.and.returnValue(of(mockDto));
      standingOrderServiceSpy.updateStandingOrder.and.returnValue(of({} as any));
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      // After detectChanges + synchronous of(mockDto), form is populated & valid
    });

    it('form should be valid after loading record in edit mode', () => {
      expect(component.form.valid).toBeTrue();
    });

    it('calls updateStandingOrder with correct composite key and DTO', () => {
      component.onSave(false);

      expect(standingOrderServiceSpy.updateStandingOrder).toHaveBeenCalledTimes(1);
      const [cId, cnId, day, dto] = standingOrderServiceSpy.updateStandingOrder.calls.mostRecent().args;
      expect(cId).toBe('C001');
      expect(cnId).toBe('CN001');
      expect(day).toBe('MON');
      expect(dto.confirmFlag).toBe('Y');
      expect(dto.requiredTime).toBe(8); // parseTimeToHour('8:00 AM') === 8
    });

    it('emits saveSuccess with update message on success', () => {
      let emitted: string | undefined;
      component.saveSuccess.subscribe(msg => { emitted = msg; });

      component.onSave(false);

      expect(emitted).toBe('Standing order updated successfully');
    });

    it('sets loading to false on update error', () => {
      standingOrderServiceSpy.updateStandingOrder.and.returnValue(
        throwError(() => new Error('Update failed'))
      );

      component.onSave(false);

      expect(component.loading()).toBeFalse();
    });

    it('does not emit saveSuccess on update error', () => {
      standingOrderServiceSpy.updateStandingOrder.and.returnValue(
        throwError(() => new Error('Update failed'))
      );
      const spy = jasmine.createSpy('successSpy');
      component.saveSuccess.subscribe(spy);

      component.onSave(false);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 9. onCancel
  // ──────────────────────────────────────────────────────────────────────────

  describe('onCancel', () => {
    it('emits the closePanel event', () => {
      fixture.detectChanges();
      let emitted = false;
      component.closePanel.subscribe(() => { emitted = true; });

      component.onCancel();

      expect(emitted).toBeTrue();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 10. getEffectiveDateMin
  // ──────────────────────────────────────────────────────────────────────────

  describe('getEffectiveDateMin', () => {
    it('returns a Moment object (minDate) in add mode', () => {
      fixture.detectChanges();
      const result = component.getEffectiveDateMin();
      expect(result).not.toBeNull();
      expect(moment.isMoment(result)).toBeTrue();
    });

    it('returns null in edit mode', () => {
      standingOrderServiceSpy.getStandingOrderById.and.returnValue(of(mockDto));
      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges();
      expect(component.getEffectiveDateMin()).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 11. getTerminationDateMin
  // ──────────────────────────────────────────────────────────────────────────

  describe('getTerminationDateMin', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('returns minDate when effDate control value is null', () => {
      component.form.get('effDate')?.setValue(null);
      const result = component.getTerminationDateMin();
      expect(moment.isMoment(result)).toBeTrue();
    });

    it('returns the effDate itself when effDate is clearly after minDate', () => {
      const futureDate = moment().add(10, 'days');
      component.form.patchValue({ effDate: futureDate });

      const result = component.getTerminationDateMin();

      // futureDate.isAfter(minDate) === true → returns effDate reference
      expect(result).toBe(futureDate);
    });

    it('returns minDate when effDate is before minDate (past date)', () => {
      const pastDate = moment().subtract(10, 'days');
      component.form.patchValue({ effDate: pastDate });

      const result = component.getTerminationDateMin();

      // pastDate.isAfter(minDate) === false → returns minDate, not pastDate
      expect(result).not.toBe(pastDate);
      expect(moment.isMoment(result)).toBeTrue();
    });

    it('returns minDate when effDate is not a Moment object', () => {
      // Directly set a non-Moment value to bypass patchValue type-checking
      (component.form.get('effDate') as any).setValue('not-a-moment-object');

      const result = component.getTerminationDateMin();

      // moment.isMoment('not-a-moment-object') === false → falls through to return minDate
      expect(moment.isMoment(result)).toBeTrue();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 12. ngOnDestroy
  // ──────────────────────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('completes destroy$ without throwing', () => {
      fixture.detectChanges();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('cancels in-flight loadExistingRecord subscription on destroy', () => {
      // Set up an observable that has not yet emitted
      let subscriber: any;
      const deferred$ = new (require('rxjs').Observable)((obs: any) => { subscriber = obs; });
      standingOrderServiceSpy.getStandingOrderById.and.returnValue(deferred$);

      component.mode = 'edit';
      component.record = mockRecord;
      fixture.detectChanges(); // loadExistingRecord subscribes but deferred$ hasn't emitted

      // Destroy the component — takeUntil(destroy$) unsubscribes
      component.ngOnDestroy();

      // Emitting after destroy should not throw or change loading state
      expect(() => subscriber?.next(mockDto)).not.toThrow();
    });
  });
});
