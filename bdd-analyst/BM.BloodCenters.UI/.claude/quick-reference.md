# Quick Reference - Essential Checklists

**One-page reference for common development tasks. For dynamic discovery, see CLAUDE.md.**

---

## 🚨 Before Every Task

```bash
# 1. Search for existing implementations
glob "src/app/shared/components/*/*.component.ts"
grep -r "similar-pattern" src/app/ --include="*.ts"

# 2. Find similar code to copy
glob "src/app/**/*[feature-name]*.ts"

# 3. Read ONE example as template
read [path-to-similar-file]
```

**Never create what already exists. Always search first.**

---

## ✅ Component Creation Checklist

- [ ] Searched `src/app/shared/components/` for reusable components
- [ ] Found similar component to use as template
- [ ] Component is `standalone: true`
- [ ] Uses `inject()` for dependency injection
- [ ] Implements `OnDestroy` with `destroy$` subject
- [ ] All observables use `takeUntil(this.destroy$)` or `async` pipe
- [ ] No `any` types - all inputs/outputs properly typed
- [ ] Component has corresponding `.spec.ts` file
- [ ] Tests achieve 80%+ coverage (90% for new code)
- [ ] Error handling implemented
- [ ] Follows file naming: `feature-name.component.ts`

---

## ✅ API Integration Checklist

- [ ] Found existing API service to use as pattern
- [ ] TypeScript interface defined for request/response (no `any`)
- [ ] Interface added to `src/app/[module]/models/`
- [ ] Endpoint constant added to `src/app/core/constants/api.constants.ts`
- [ ] Service uses base `ApiService` for HTTP calls
- [ ] Error handling at service level (catchError)
- [ ] Error handling at component level (subscribe error callback)
- [ ] Dates formatted as YYYY-MM-DD using `DateFieldValidationUtility`
- [ ] Service has `.spec.ts` with `HttpClientTestingModule`
- [ ] Tests achieve 90%+ coverage
- [ ] All HTTP calls mocked in tests

---

## ✅ Unit Testing Checklist

- [ ] Every `.ts` file has corresponding `.spec.ts`
- [ ] Tests follow AAA pattern (Arrange-Act-Assert)
- [ ] Component tests verify:
  - [ ] Component creation
  - [ ] Input bindings
  - [ ] Output events
  - [ ] User interactions
  - [ ] Validation logic
- [ ] Service tests verify:
  - [ ] All public methods
  - [ ] HTTP calls (mocked with `HttpTestingController`)
  - [ ] Error handling
  - [ ] Data transformation
- [ ] Coverage meets minimum:
  - [ ] 80% overall
  - [ ] 90% for new code
- [ ] All tests pass: `npm test`
- [ ] No console errors or warnings

---

## ✅ Code Quality Checklist

- [ ] No `any` types anywhere
- [ ] No `console.log()` statements
- [ ] No commented-out code
- [ ] Business logic in services (not components)
- [ ] No hardcoded URLs (use `api.constants.ts`)
- [ ] No hardcoded routes (use `route.constants.ts`)
- [ ] Forms use reactive forms with validation
- [ ] Submit buttons disabled when form invalid
- [ ] All user-facing errors use `NotificationService`
- [ ] No memory leaks (observables unsubscribed)
- [ ] Accessibility: ARIA labels, keyboard navigation
- [ ] Lint passes: `npm run lint`

---

## ✅ Pre-Commit Checklist

### First: Check for Abandoned Changes
```bash
# 1. What's modified?
git status --short

# 2. For EACH file, ask yourself:
#    "Why did I change this?"
#    "Is this related to my commit?"
#    "Did I abandon this earlier?"

# 3. Review changes
git diff <file>

# 4. Clean up abandoned changes
git checkout -- <abandoned-file>    # Revert unwanted
# OR
git stash save "experiment - review later"
```

**Common abandoned changes:**
- Tried something that didn't work
- Debugging console.logs
- Test npm packages (package.json)
- Local config changes
- Incomplete refactoring

### Then: Run Quality Checks
```bash
npm run lint           # No lint errors
npm test               # All tests pass
npm test -- --code-coverage  # 80%+ coverage
ng build --configuration=production  # Builds successfully
```

### Finally: Verify Commit
- [ ] No abandoned/unwanted changes
- [ ] All lint errors fixed
- [ ] All tests passing
- [ ] Coverage meets threshold
- [ ] Build succeeds
- [ ] Reviewed `git diff --cached`
- [ ] Commit message follows format
- [ ] No sensitive data in commit

---

## 🔍 Common Patterns (Copy These)

### Component with Form
```typescript
@Component({
  selector: 'app-feature-name',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule]
})
export class FeatureComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private apiService = inject(FeatureApiService);
  
  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email])
  });
  
  ngOnInit(): void { }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    this.apiService.save(this.form.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleSuccess(),
        error: (err) => this.handleError(err)
      });
  }
}
```

### API Service
```typescript
@Injectable({ providedIn: 'root' })
export class FeatureApiService {
  private apiService = inject(ApiService);
  
  getData(id: string): Observable<FeatureResponse> {
    return this.apiService.get<FeatureResponse>(API.FEATURE.GET(id)).pipe(
      catchError(error => {
        console.error('getData failed:', error);
        return throwError(() => error);
      })
    );
  }
  
  save(data: FeatureRequest): Observable<ApiResponse<FeatureResponse>> {
    return this.apiService.post<ApiResponse<FeatureResponse>>(
      API.FEATURE.SAVE,
      data
    ).pipe(
      catchError(error => {
        console.error('save failed:', error);
        return throwError(() => error);
      })
    );
  }
}
```

### Unit Test (AAA Pattern)
```typescript
describe('FeatureComponent', () => {
  let component: FeatureComponent;
  let fixture: ComponentFixture<FeatureComponent>;
  let apiService: jasmine.SpyObj<FeatureApiService>;
  
  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('FeatureApiService', ['getData']);
    
    TestBed.configureTestingModule({
      imports: [FeatureComponent],
      providers: [
        { provide: FeatureApiService, useValue: apiServiceSpy }
      ]
    });
    
    fixture = TestBed.createComponent(FeatureComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(FeatureApiService) as jasmine.SpyObj<FeatureApiService>;
  });
  
  it('should load data on init', () => {
    // Arrange
    const mockData = { id: '1', name: 'Test' };
    apiService.getData.and.returnValue(of(mockData));
    
    // Act
    component.ngOnInit();
    
    // Assert
    expect(apiService.getData).toHaveBeenCalled();
    expect(component.data).toEqual(mockData);
  });
});
```

---

## 🚫 Anti-Patterns (Never Do)

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| `data: any` | `data: UserData` (typed interface) |
| `this.http.get(...)` | `this.apiService.get(...)` (use base service) |
| Direct subscription without unsubscribe | `takeUntil(this.destroy$)` or `async` pipe |
| Hardcoded URL: `'/api/users'` | `API.USERS.GET` (from constants) |
| `console.log('error')` | `this.notificationService.showError(...)` |
| Creating duplicate components | Search `shared/components/` first |
| Guessing API field names | Grep for existing usage or check Swagger |
| No tests | Every file needs `.spec.ts` |
| Business logic in component | Move to service |

---

## 📏 File Naming Conventions

```
Components:     feature-name.component.ts
Services:       feature-api.service.ts
Models:         feature-response.interface.ts
Pipes:          feature-name.pipe.ts
Directives:     feature-name.directive.ts
Guards:         feature.guard.ts
Interceptors:   feature.interceptor.ts
```

---

## 🎯 Success Criteria

**You're doing it right when:**
- ✅ PRs pass review on first try
- ✅ No duplicate components created
- ✅ Tests included automatically
- ✅ Coverage always meets threshold
- ✅ No API contracts guessed
- ✅ Code matches existing patterns

---

**For detailed workflow:** See [onboarding.md](onboarding.md)  
**For test templates:** See [test-examples.md](test-examples.md)  
**For dynamic discovery:** See [CLAUDE.md](../CLAUDE.md) (project root)
