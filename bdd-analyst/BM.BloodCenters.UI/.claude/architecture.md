# System Architecture

**Consolidated architecture reference. For quick patterns, search the codebase directly.**

## Technology Stack

**Frontend:**
- Angular 20.3 (standalone components, signals)
- Material Design 20.2 + @wellsky/atlas-ui (custom component library)
- RxJS 7.8 (reactive state management, no NgRx)
- Jasmine 5.9 + Karma 6.4 (testing)
- TypeScript 5.7
- SCSS + Bootstrap 5.3
- Okta (authentication)

**Backend:**
- .NET Core Web API
- RESTful architecture
- SQL Server database

**Build & Deploy:**
- Angular CLI
- npm/yarn
- Azure DevOps Pipelines
- Azure hosting

## Module Overview

```
src/app/
├── core/                  # Application core (singleton services, constants)
│   ├── constants/
│   │   ├── api.constants.ts      # All API endpoints
│   │   └── route.constants.ts    # All route paths
│   ├── guards/                    # Route guards (auth, permissions)
│   ├── interceptors/              # HTTP interceptors
│   └── services/
│       ├── api.service.ts         # Base HTTP service
│       └── auth.service.ts        # Authentication
├── shared/                # Reusable components, services, pipes
│   ├── components/        # 30+ reusable UI components
│   ├── services/          # Shared business services
│   ├── pipes/             # Custom pipes
│   ├── directives/        # Custom directives
│   └── models/            # Shared interfaces
└── modules/               # Feature modules
    ├── donor-functions/
    ├── laboratory-functions/
    ├── distribution/
    ├── apis-and-integration/
    ├── application-administration/
    └── system-administration/
```

## Feature Modules

### Donor Functions
Blood donor management, eligibility, donation history, demographics

### Laboratory Functions
Test processing, result validation, quality control

### Distribution
Product inventory, warehouse management, order fulfillment, FEFO logic

### APIs & Integration
Integration with external systems, data exchange

### Application Administration
User management, permissions, access control

### System Administration
System configuration, validation tables, reference data

## Key Patterns

### Service-Based State Management
No NgRx. State managed through RxJS BehaviorSubjects in services:

```typescript
@Injectable({ providedIn: 'root' })
export class StateService {
  private dataSubject = new BehaviorSubject<Data[]>([]);
  data$ = this.dataSubject.asObservable();
  
  updateData(data: Data[]): void {
    this.dataSubject.next(data);
  }
}
```

### HTTP Communication
All HTTP calls go through base `ApiService`:

```typescript
@Injectable({ providedIn: 'root' })
export class FeatureApiService {
  private apiService = inject(ApiService);
  
  getData(): Observable<Response> {
    return this.apiService.get<Response>(API.FEATURE.GET);
  }
}
```

### Component Lifecycle
Standard pattern for all components:

```typescript
@Component({...})
export class FeatureComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  ngOnInit(): void { /* Initialize */ }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Form Handling
Reactive forms with validation:

```typescript
form = new FormGroup({
  name: new FormControl('', [Validators.required]),
  email: new FormControl('', [Validators.required, Validators.email])
});

onSubmit(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }
  // Submit logic
}
```

## Data Flow

1. **User Action** → Component event handler
2. **Component** → Calls service method
3. **Service** → Makes HTTP call via ApiService
4. **ApiService** → Adds auth token, calls backend
5. **Backend** → Processes request, returns response
6. **Service** → Transforms data if needed
7. **Component** → Updates UI (via observable subscription)

## Authentication & Authorization

- **Okta SSO** for authentication
- **JWT tokens** in Authorization header (via interceptor)
- **Permission-based** access control (guards check user permissions)
- **Cookie-based** session for chapter/warehouse context

## Error Handling

**Three levels:**
1. **Service level** - Log and propagate errors
2. **Component level** - Display user-friendly messages
3. **Global handler** - Catch unhandled errors

```typescript
// Service
return this.apiService.get<Data>(url).pipe(
  catchError(error => {
    console.error('Service error:', error);
    return throwError(() => error);
  })
);

// Component
this.service.getData().subscribe({
  next: data => this.data = data,
  error: error => this.notificationService.showError('Failed to load data')
});
```

## Date Handling (Critical!)

**All dates to/from API must be YYYY-MM-DD format:**

```typescript
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

// To API
const apiDate = DateFieldValidationUtility.serializeDateForApi(momentDate);

// From API
const displayDate = moment(response.date, 'YYYY-MM-DD');
```

## Testing Strategy

- **Unit tests** (Jasmine + Karma) for components, services, pipes
- **Component tests** verify rendering, inputs, outputs, interactions
- **Service tests** verify business logic, HTTP calls (mocked)
- **80% minimum coverage**, 90% for new code
- **AAA pattern** (Arrange-Act-Assert)

## Build & Deployment

**Development:**
```bash
npm start              # Dev server (localhost:4200)
npm test               # Run unit tests
npm run lint           # Run linter
```

**Production:**
```bash
ng build --configuration=production
# Deploys to Azure via Azure DevOps pipeline
```

## Performance Considerations

- **Lazy loading** for feature modules
- **OnPush change detection** for performance-critical components
- **trackBy functions** for large lists
- **Async pipe** to auto-unsubscribe observables
- **Virtualization** for very large datasets (use CDK Virtual Scroll)

## Accessibility

- **WCAG 2.1 Level AA** compliance target
- **Keyboard navigation** must work for all interactions
- **ARIA labels** on all form fields and interactive elements
- **Focus management** for modals and dynamic content
- **Screen reader** compatibility

---

**For specific implementation patterns:** Search the codebase. Every pattern you need already exists.

**For code standards:** See [coding-standards.md](coding-standards.md)
