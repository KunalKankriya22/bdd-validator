import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { UnitNotesPanelComponent } from './unit-notes-panel';
import { UnitQueryService } from '../unit-query.service';
import { UnitQueryPanelRecord } from '../unit-query.model';
import { API } from '@core/constants/api.constants';

describe('UnitNotesPanelComponent', () => {
  let component: UnitNotesPanelComponent;
  let fixture: ComponentFixture<UnitNotesPanelComponent>;
  let httpMock: HttpTestingController;
  let mockService: jasmine.SpyObj<UnitQueryService>;

  const mockRecord: UnitQueryPanelRecord = {
    unitId: 'U001', collDate: '2025-01-01', chapterId: 'CH1', unitSchemeType: null, noteId: 123,
  };

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('UnitQueryService', ['getUnitNotes']);
    mockService.getUnitNotes.and.returnValue(of([
      { noteId: 123, noteSeq: 1, note: 'Test note', insertUser: 'admin', insertUserName: 'Admin User', insertDate: '2025-01-01', auditKey: 1, chapterId: 'CH1' },
    ]));

    await TestBed.configureTestingModule({
      imports: [UnitNotesPanelComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UnitQueryService, useValue: mockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UnitNotesPanelComponent);
    component = fixture.componentInstance;
    component.record = mockRecord;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should load and map notes on init', () => {
    fixture.detectChanges();
    expect(component.notes.length).toBe(1);
    expect(component.notes[0].text).toBe('Test note');
    expect(component.notes[0].metadata.noteId).toBe(123);
    expect(component.notes[0].metadata.noteSeq).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should add a note via PlaceUnitNotes API', () => {
    fixture.detectChanges();
    component.onNoteAction({ action: 'add', note: { id: 0, text: 'New note' } });

    const req = httpMock.expectOne(API.PLACE_UNIT_NOTES.CREATE_NOTES);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.unitIds).toEqual(['U001']);
    expect(req.request.body.notes).toEqual(['New note']);
    req.flush({ success: true });
  });

  it('should delete a note via PlaceUnitNotes API', () => {
    fixture.detectChanges();
    component.onNoteAction({
      action: 'delete',
      note: { id: 1, text: 'Test', metadata: { noteId: 123, noteSeq: 1 } },
    });

    const req = httpMock.expectOne(API.PLACE_UNIT_NOTES.DELETE_NOTE(123, 1));
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

});
