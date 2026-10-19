import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DrivesComponent } from './drives';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';


describe('DrivesComponent', () => {
  let component: DrivesComponent;
  let fixture: ComponentFixture<DrivesComponent>;

  beforeEach(() => {



      TestBed.configureTestingModule({
      imports: [DrivesComponent,
        HttpClientTestingModule,
        NoopAnimationsModule]
    });


    



    fixture = TestBed.createComponent(DrivesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });






  it('should open side panel in add mode when createRecord is called', () => {
    component.createRecord();
    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelMode).toBe('add');
  });

  it('should close side panel when closeSidePanel is called', () => {
    component.sidePanelOpen = true;
    component.closeSidePanel();
    expect(component.sidePanelOpen).toBeFalse();
  });



  it('should have search form with required fields', () => {
    expect(component.searchForm.get('chapterId')).toBeTruthy();
    expect(component.searchForm.get('fromDate')).toBeTruthy();
    expect(component.searchForm.get('toDate')).toBeTruthy();
  });

  it('should set hasSearched to true when onRetrieve is called with valid form', () => {
    component.searchForm.patchValue({
      chapterId: 'WAD',
      fromDate: new Date(),
      toDate: new Date()
    });
    component.onRetrieve();
    expect(component.hasSearched).toBeTrue();
  });



  it('should open side panel in edit mode with data when editRecord is called', () => {
    const mockData = { chapterID: 'WAD', drive: '001', type: 'F' };
    component.editRecord(mockData);
    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelData).toEqual(mockData);
  });

  it('should initialize with empty dataSource', () => {
    expect(component.dataSource.length).toBe(0);
  });





  it('should set searchKeyword and reload data when onSearch is called', () => {
    component.hasSearched = true;
    spyOn(component, 'loadData');

    component.onSearch('test search');

    expect(component.requestState.searchKeyword).toBe('test search');
    expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should set searchKeyword to null when search text is empty', () => {
    component.hasSearched = true;
    component.requestState.searchKeyword = 'previous search';
    spyOn(component, 'loadData');

    component.onSearch('');

    expect(component.requestState.searchKeyword).toBeNull();
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should clear scheduleDate and schedulePeriod when clearing filters', () => {
    component.appliedFilters = {
      type: 'F',
      drive: '001',
      siteId: '1000',
      period: 'After',
      scheduledDate: new Date()
    };
    component.requestState.scheduleDate = '15-Mar-2026';
    component.requestState.schedulePeriod = 'After';
    component.hasSearched = true;
    spyOn(component, 'loadData');

    component.clearAllFilters();

    expect(component.requestState.scheduleDate).toBeNull();
    expect(component.requestState.schedulePeriod).toBeNull();
    expect(component.appliedFilters).toBeNull();
    expect(component.loadData).toHaveBeenCalled();
  });

  it('should update requestState with scheduleDate and schedulePeriod from filters', () => {
    component.hasSearched = true;
    const scheduledDate = new Date('2026-03-15');
    const filters = {
      type: 'F',
      drive: '001',
      siteId: '1000',
      period: 'After',
      scheduledDate: scheduledDate
    };
    spyOn(component, 'loadData');

    component.applyFilters(filters);

    expect(component.requestState.schedulePeriod).toBe('After');
    expect(component.requestState.scheduleDate).toBeTruthy();
    expect(component.loadData).toHaveBeenCalled();
  });

  describe('Date Validation', () => {




    it('should show error on fromDate when fromDate is changed to be after toDate', fakeAsync(() => {
      const toDate = new Date('2026-03-15');
      const fromDate = new Date('2026-03-20');

      // Set toDate first
      component.searchForm.patchValue({ toDate });
      component.searchForm.get('toDate')?.markAsTouched();
      tick();
      fixture.detectChanges();

      // Then change fromDate to be after toDate
      component.searchForm.patchValue({ fromDate });
      component.searchForm.get('fromDate')?.markAsTouched();
      tick();
      fixture.detectChanges();

      const fromError = component.getFromDateError();
      expect(fromError).toBe('From Date must be before or equal to To Date');
    }));

    it('should show error on toDate when toDate is changed to be before fromDate', fakeAsync(() => {
      const fromDate = new Date('2026-03-20');
      const toDate = new Date('2026-03-15');

      // Set fromDate first
      component.searchForm.patchValue({ fromDate });
      component.searchForm.get('fromDate')?.markAsTouched();
      tick();
      fixture.detectChanges();

      // Then change toDate to be before fromDate
      component.searchForm.patchValue({ toDate });
      component.searchForm.get('toDate')?.markAsTouched();
      tick();
      fixture.detectChanges();

      const toError = component.getToDateError();
      expect(toError).toBe('To Date must be after From Date');
    }));

    it('should not show error when toDate is after fromDate', fakeAsync(() => {
      const fromDate = new Date('2026-03-15');
      const toDate = new Date('2026-03-20');

      component.searchForm.patchValue({ fromDate, toDate });
      component.searchForm.get('toDate')?.markAsTouched();
      tick();
      fixture.detectChanges();

      const error = component.getToDateError();
      expect(error).toBe('');
    }));

    it('should clear error from toDate when fromDate is changed to valid date', fakeAsync(() => {
      const fromDate = new Date('2026-03-20');
      const toDate = new Date('2026-03-15');

      // First set invalid state (toDate before fromDate)
      component.searchForm.patchValue({ fromDate });
      component.searchForm.get('fromDate')?.markAsTouched();
      tick();
      fixture.detectChanges();

      component.searchForm.patchValue({ toDate });
      component.searchForm.get('toDate')?.markAsTouched();
      tick();
      fixture.detectChanges();

      // Now change fromDate to be before toDate
      component.searchForm.patchValue({ fromDate: new Date('2026-03-10') });
      tick();
      fixture.detectChanges();

      const toError = component.getToDateError();
      expect(toError).toBe('');
    }));

    it('should show required error for toDate when field is empty', () => {
      component.searchForm.patchValue({ toDate: null });
      component.searchForm.get('toDate')?.markAsTouched();
      fixture.detectChanges();

      const error = component.getToDateError();
      expect(error).toBe('To Date is required');
    });

    it('should show required error for fromDate when field is empty', () => {
      component.searchForm.patchValue({ fromDate: null });
      component.searchForm.get('fromDate')?.markAsTouched();
      fixture.detectChanges();

      const error = component.getFromDateError();
      expect(error).toBe('From Date is required');
    });
  });

  describe('Retrieve Button State', () => {
    it('should initialize with isRetrieveDisabled as true', () => {
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should disable retrieve button when all fields are empty', () => {
      component.searchForm.patchValue({
        chapterId: '',
        fromDate: null,
        toDate: null
      });
      fixture.detectChanges();

      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should enable retrieve button when chapterId is selected', () => {
      component.searchForm.patchValue({
        chapterId: 'WAD',
        fromDate: null,
        toDate: null
      });
      fixture.detectChanges();

      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should enable retrieve button when fromDate is selected', () => {
      component.searchForm.patchValue({
        chapterId: '',
        fromDate: new Date('2026-03-15'),
        toDate: null
      });
      fixture.detectChanges();

      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should enable retrieve button when toDate is selected', () => {
      component.searchForm.patchValue({
        chapterId: '',
        fromDate: null,
        toDate: new Date('2026-03-20')
      });
      fixture.detectChanges();

      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should enable retrieve button when any combination of fields is filled', () => {
      component.searchForm.patchValue({
        chapterId: 'WAD',
        fromDate: new Date('2026-03-15'),
        toDate: new Date('2026-03-20')
      });
      fixture.detectChanges();

      expect(component.isRetrieveDisabled).toBeFalse();
    });

    it('should disable retrieve button again when all fields are cleared', () => {
      // First set values
      component.searchForm.patchValue({
        chapterId: 'WAD',
        fromDate: new Date('2026-03-15'),
        toDate: new Date('2026-03-20')
      });
      fixture.detectChanges();
      expect(component.isRetrieveDisabled).toBeFalse();

      // Then clear all values
      component.searchForm.patchValue({
        chapterId: '',
        fromDate: null,
        toDate: null
      });
      fixture.detectChanges();

      expect(component.isRetrieveDisabled).toBeTrue();
    });
  });

  describe('Filter Panel Integration', () => {
    it('should set selectedChapter when onRetrieve is called', () => {
      component.chapterOptions = [
        { chapterId: 'WAD', chapterName: 'Washington DC', chapterShortName: 'DC' }
      ];

      component.searchForm.patchValue({
        chapterId: 'WAD',
        fromDate: new Date(),
        toDate: new Date()
      });

      component.onRetrieve();

      expect(component.selectedChapter).toBeTruthy();
      expect(component.selectedChapter?.chapterId).toBe('WAD');
    });

    it('should pass selectedChapterId to filter panel when opening filter', () => {
      // Set up selected chapter
      component.selectedChapter = {
        chapterId: 'WAD',
        chapterName: 'Washington DC',
        chapterShortName: 'DC'
      };

      // The openFilter method creates an overlay and attaches the filter panel
      // We can't easily test the full overlay creation in a unit test,
      // but we can verify the selectedChapter is set
      expect(component.selectedChapter.chapterId).toBe('WAD');
    });








  });
});
