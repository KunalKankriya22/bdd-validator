import { TestBed } from '@angular/core/testing';
import { ScrollHandlerService } from './scroll-handler.service';

describe('ScrollHandlerService', () => {
  let service: ScrollHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ScrollHandlerService],
    });

    service = TestBed.inject(ScrollHandlerService);
  });

  afterEach(() => {
    service.cleanup();
  });

  it('should return personal-info as the default active section', () => {
    expect(service.getCurrentSection()).toBe('personal-info');
  });

  it('should emit active section via observable', (done) => {
    service.getActiveSection().subscribe({
      next: (section) => {
        expect(section).toBe('personal-info');
        done();
      },
    });
  });
});
