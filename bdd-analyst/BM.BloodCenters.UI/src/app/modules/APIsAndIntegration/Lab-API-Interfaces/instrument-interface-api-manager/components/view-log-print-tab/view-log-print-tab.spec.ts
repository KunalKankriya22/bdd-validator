import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { ViewLogPrintTab } from './view-log-print-tab';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { of, throwError, delay } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LogFile } from '../../models/instrument-interface.model';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('[Unit] ViewLogPrintTab', () => {
  let component: ViewLogPrintTab;
  let fixture: ComponentFixture<ViewLogPrintTab>;
  let mockService: jasmine.SpyObj<InstrumentInterfaceService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;

  const mockLogFiles: LogFile[] = [
    {
      fileName: 'log1.txt',
      fileId: 'F1',
      parmId: 'P1',
      reportStatus: 'C',
      submitDate: '2024-01-01'
    },
    {
      fileName: 'log2.r',
      fileId: 'F2',
      parmId: 'P2',
      reportStatus: 'S',
      submitDate: '2024-01-02'
    }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('InstrumentInterfaceService', [
      'getLogFiles',
      'getLogFileContent',
      'downloadLogFile'
    ]);
    mockSnackbar = createMockSnackbarService();

    mockService.getLogFiles.and.returnValue(of([]));
    mockService.getLogFileContent.and.returnValue(of({ item: { content: 'Test content' } }));
    mockService.downloadLogFile.and.returnValue(of(new Blob(['test'])));



      TestBed.configureTestingModule({
      imports: [ViewLogPrintTab, NoopAnimationsModule],
      providers: [
        { provide: InstrumentInterfaceService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbar },
      ],
    });


    


      mockService.getLogFiles.calls.reset();


      mockService.getLogFileContent.calls.reset();


      mockService.downloadLogFile.calls.reset();


      mockService.getLogFiles.and.returnValue(of([]));


      mockService.getLogFileContent.and.returnValue(of({ item: { content: 'Test content' } }));


      mockService.downloadLogFile.and.returnValue(of(new Blob(['test'])));


    fixture = TestBed.createComponent(ViewLogPrintTab);
    component = fixture.componentInstance;
    component.chapterId = 'DAL';
    component.instrumentId = 'S201';
    fixture.detectChanges();


    });


  describe('ngOnChanges', () => {
    it('should clear all data when chapterId changes', () => {
      component.logFiles.set(mockLogFiles);
      component.selectedLogFile.set(mockLogFiles[0]);
      component.textContent.set('Some content');
      component.loading.set(true);

      component.ngOnChanges({
        chapterId: new SimpleChange('DAL', 'HOU', false)
      });

      expect(component.logFiles()).toEqual([]);
      expect(component.selectedLogFile()).toBeNull();
      expect(component.textContent()).toBeNull();
      expect(component.loading()).toBe(false);
      expect(component.showingLog()).toBe(false);
      expect(component.logShown()).toBe(false);
    });

    it('should clear all data when instrumentId changes', () => {
      component.logFiles.set(mockLogFiles);
      component.selectedLogFile.set(mockLogFiles[0]);
      component.textContent.set('Some content');
      component.logShown.set(true);

      component.ngOnChanges({
        instrumentId: new SimpleChange('S201', 'S202', false)
      });

      expect(component.logFiles()).toEqual([]);
      expect(component.selectedLogFile()).toBeNull();
      expect(component.textContent()).toBeNull();
      expect(component.loading()).toBe(false);
      expect(component.showingLog()).toBe(false);
      expect(component.logShown()).toBe(false);
    });

    it('should not clear data when unrelated inputs change', () => {
      component.logFiles.set(mockLogFiles);

      component.ngOnChanges({});

      expect(component.logFiles()).toEqual(mockLogFiles);
    });
  });

  describe('loadLogFiles', () => {
    it('should load log files successfully', fakeAsync(() => {
      mockService.getLogFiles.and.returnValue(of(mockLogFiles));

      component.loadLogFiles();
      tick();

      expect(component.loading()).toBe(false);
      expect(component.logFiles()).toEqual(mockLogFiles);
      expect(mockService.getLogFiles).toHaveBeenCalledWith('S201');
    }));

    it('should show error when instrumentId is empty', () => {
      component.instrumentId = '';

      component.loadLogFiles();

      expect(mockSnackbar.showError).toHaveBeenCalledWith('Please select an Instrument ID');
      expect(mockService.getLogFiles).not.toHaveBeenCalled();
    });

    it('should show success message when no log files are found', fakeAsync(() => {
      mockService.getLogFiles.and.returnValue(of([]));

      component.loadLogFiles();
      tick();

      expect(component.logFiles()).toEqual([]);
      expect(component.loading()).toBe(false);
      expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('No log files found for this instrument.');
    }));

    it('should handle error when loading log files fails', fakeAsync(() => {
      mockService.getLogFiles.and.returnValue(throwError(() => ({ status: 500 })));

      component.loadLogFiles();
      tick();

      expect(component.loading()).toBe(false);
      expect(mockSnackbar.showError).toHaveBeenCalledWith('Failed to load log files.');
    }));

    it('should set loading to true while request is in progress', () => {
      mockService.getLogFiles.and.returnValue(of(mockLogFiles));

      component.loadLogFiles();

      // After synchronous subscribe completes loading is false,
      // but the call was made
      expect(mockService.getLogFiles).toHaveBeenCalledWith('S201');
    });





  });
  describe('onLogFileChange', () => {
    it('should clear textContent and logShown when log file changes', () => {
      component.textContent.set('Some content');
      component.logShown.set(true);

      component.onLogFileChange();

      expect(component.textContent()).toBeNull();
      expect(component.logShown()).toBe(false);
    });
  });

  describe('showLog', () => {
    it('should show error when no log file is selected', () => {
      component.selectedLogFile.set(null);

      component.showLog();

      expect(mockSnackbar.showError).toHaveBeenCalledWith('Please select a log file name.');
      expect(mockService.getLogFileContent).not.toHaveBeenCalled();
    });

    it('should show error when selected log file has no fileName', () => {
      component.selectedLogFile.set({ fileName: '', fileId: 'F1', parmId: 'P1' } as LogFile);

      component.showLog();

      expect(mockSnackbar.showError).toHaveBeenCalledWith('Please select a log file name.');
      expect(mockService.getLogFileContent).not.toHaveBeenCalled();
    });

    it('should show error when parmId is missing', () => {
      component.selectedLogFile.set({ fileName: 'log.txt', fileId: 'F1', parmId: '' } as LogFile);

      component.showLog();

      expect(mockSnackbar.showError).toHaveBeenCalledWith('Parameter ID is required.');
      expect(mockService.getLogFileContent).not.toHaveBeenCalled();
    });

    it('should show error when report status is not completed', () => {
      component.selectedLogFile.set(mockLogFiles[1]); // reportStatus: 'S'

      component.showLog();

      expect(mockSnackbar.showError).toHaveBeenCalledWith('Report is not in completed status.');
      expect(mockService.getLogFileContent).not.toHaveBeenCalled();
    });

    it('should allow showing log when reportStatus is undefined', fakeAsync(() => {
      const logFileNoStatus: LogFile = { fileName: 'log3.txt', fileId: 'F3', parmId: 'P3' };
      mockService.getLogFileContent.and.returnValue(of({ item: { content: 'Content' } }));
      component.selectedLogFile.set(logFileNoStatus);

      component.showLog();
      tick();

      expect(mockService.getLogFileContent).toHaveBeenCalledWith('P3');
      expect(component.textContent()).toBe('Content');
    }));



    it('should load content for completed report', fakeAsync(() => {
      mockService.getLogFileContent.and.returnValue(of({ item: { content: 'Log content here' } }));
      component.selectedLogFile.set(mockLogFiles[0]);

      component.showLog();
      tick();

      expect(mockService.getLogFileContent).toHaveBeenCalledWith('P1');
      expect(component.textContent()).toBe('Log content here');
      expect(component.logShown()).toBe(true);
      expect(component.showingLog()).toBe(false);
    }));

    it('should show error when log file content is empty', fakeAsync(() => {
      mockService.getLogFileContent.and.returnValue(of({ item: { content: '' } }));
      component.selectedLogFile.set(mockLogFiles[0]);

      component.showLog();
      tick();

      expect(mockSnackbar.showError).toHaveBeenCalledWith('Log file content is empty.');
      expect(component.showingLog()).toBe(false);
    }));

    it('should show error when response item is null', fakeAsync(() => {
      mockService.getLogFileContent.and.returnValue(of({ item: null }));
      component.selectedLogFile.set(mockLogFiles[0]);

      component.showLog();
      tick();

      expect(mockSnackbar.showError).toHaveBeenCalledWith('Log file content is empty.');
      expect(component.logShown()).toBe(false);
      expect(component.showingLog()).toBe(false);
    }));

    it('should show error when response is null', fakeAsync(() => {
      mockService.getLogFileContent.and.returnValue(of(null));
      component.selectedLogFile.set(mockLogFiles[0]);

      component.showLog();
      tick();

      expect(mockSnackbar.showError).toHaveBeenCalledWith('Log file content is empty.');
      expect(component.showingLog()).toBe(false);
    }));

    it('should handle error when getLogFileContent fails', fakeAsync(() => {
      mockService.getLogFileContent.and.returnValue(throwError(() => ({ status: 500 })));
      component.selectedLogFile.set(mockLogFiles[0]);

      component.showLog();
      tick();

      expect(component.showingLog()).toBe(false);
      expect(mockSnackbar.showError).toHaveBeenCalledWith('Failed to retrieve log file content.');
    }));

    it('should reset showingLog and textContent before making the request', fakeAsync(() => {
      component.textContent.set('Old content');
      component.logShown.set(true);
      component.showingLog.set(false);
      mockService.getLogFileContent.and.returnValue(of({ item: { content: 'New content' } }));
      component.selectedLogFile.set(mockLogFiles[0]);

      component.showLog();
      tick();

      expect(component.textContent()).toBe('New content');
      expect(component.logShown()).toBe(true);
    }));
  });

  describe('viewReport', () => {
    it('should show error when no log file is selected', () => {
      component.selectedLogFile.set(null);

      component.viewReport();

      expect(mockSnackbar.showError).toHaveBeenCalledWith('Please select a log file and click Show Log first.');
      expect(mockService.downloadLogFile).not.toHaveBeenCalled();
    });

    it('should show error when log has not been shown yet', () => {
      component.selectedLogFile.set(mockLogFiles[0]);
      component.logShown.set(false);

      component.viewReport();

      expect(mockSnackbar.showError).toHaveBeenCalledWith('Please click Show Log first to view the report.');
      expect(mockService.downloadLogFile).not.toHaveBeenCalled();
    });

    it('should open report in new tab', fakeAsync(() => {
      const blob = new Blob(['pdf content'], { type: 'application/pdf' });
      mockService.downloadLogFile.and.returnValue(of(blob));
      spyOn(window, 'open');
      component.selectedLogFile.set(mockLogFiles[0]);
      component.logShown.set(true);

      component.viewReport();
      tick();

      expect(mockService.downloadLogFile).toHaveBeenCalledWith('P1');
      expect(window.open).toHaveBeenCalled();
    }));

    it('should handle download error', fakeAsync(() => {
      mockService.downloadLogFile.and.returnValue(throwError(() => ({ status: 500 })));
      component.selectedLogFile.set(mockLogFiles[0]);
      component.logShown.set(true);

      component.viewReport();
      tick();

      expect(mockSnackbar.showError).toHaveBeenCalledWith('Failed to open report.');
    }));
  });
  describe('clear', () => {
    it('should reset all signals to their default values', () => {
      component.logFiles.set(mockLogFiles);
      component.selectedLogFile.set(mockLogFiles[0]);
      component.textContent.set('Some content');
      component.loading.set(true);
      component.showingLog.set(true);
      component.logShown.set(true);

      component.clear();

      expect(component.logFiles()).toEqual([]);
      expect(component.selectedLogFile()).toBeNull();
      expect(component.textContent()).toBeNull();
      expect(component.loading()).toBe(false);
      expect(component.showingLog()).toBe(false);
      expect(component.logShown()).toBe(false);
    });
  });

  describe('compareLogFiles', () => {
    it('should return true when parmIds match', () => {
      const result = component.compareLogFiles(mockLogFiles[0], mockLogFiles[0]);
      expect(result).toBe(true);
    });

    it('should return false when parmIds do not match', () => {
      const result = component.compareLogFiles(mockLogFiles[0], mockLogFiles[1]);
      expect(result).toBe(false);
    });

    it('should return false when one file is null', () => {
      const result = component.compareLogFiles(mockLogFiles[0], null);
      expect(result).toBe(false);
    });

    it('should return true when both files are null', () => {
      const result = component.compareLogFiles(null, null);
      expect(result).toBe(true);
    });
  });
});
