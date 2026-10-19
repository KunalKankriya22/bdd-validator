# Coding Standards

## Angular Standards

### File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Component | `{name}.component.ts` | `user-form.component.ts` |
| Service | `{name}.service.ts` | `user-api.service.ts` |
| Directive | `{name}.directive.ts` | `click-outside.directive.ts` |
| Pipe | `{name}.pipe.ts` | `phone-number.pipe.ts` |
| Interface | `{name}.interface.ts` | `user.interface.ts` |
| Model | `{name}.model.ts` | `user.model.ts` |
| Enum | `{name}.enum.ts` | `notification-type.enum.ts` |
| Validator | `{name}.validator.ts` | `email.validator.ts` |
| Guard | `{name}.guard.ts` | `auth.guard.ts` |
| Interceptor | `{name}.interceptor.ts` | `auth.interceptor.ts` |
| Spec | `{name}.spec.ts` | `user-form.component.spec.ts` |

### Folder Structure

#### Feature Module Structure
```
feature-name/
├── components/              # Feature-specific components
│   └── sub-component/
│       ├── sub-component.html
│       ├── sub-component.ts
│       ├── sub-component.scss
│       └── sub-component.spec.ts
├── services/               # Feature-specific services
│   └── feature.service.ts
├── models/                 # TypeScript interfaces/models
│   ├── request.model.ts
│   └── response.model.ts
├── utils/                  # Feature utilities
├── feature-name.html       # Main component template
├── feature-name.ts         # Main component
├── feature-name.scss       # Main component styles
└── feature-name.spec.ts    # Main component test
```

#### Shared Structure
```
shared/
├── components/             # Reusable components
├── services/              # Shared services
├── pipes/                 # Custom pipes
├── directives/            # Custom directives
├── validators/            # Form validators
├── interfaces/            # Shared interfaces
├── models/                # Shared models
├── enums/                 # Shared enums
└── utils/                 # Utility functions
```

### TypeScript Standards

#### Naming Conventions
- **Classes**: `PascalCase` (e.g., `UserApiService`, `DonorFormComponent`)
- **Interfaces**: `PascalCase` (e.g., `UserDetails`, `ApiResponse`)
- **Enums**: `PascalCase` for enum, `UPPER_SNAKE_CASE` for values
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)
- **Variables/Functions**: `camelCase` (e.g., `getUserDetails`, `isActive`)
- **Observables**: Suffix with `$` (e.g., `user$`, `loading$`)
- **Private members**: Prefix with `private` (e.g., `private apiService`)

#### Type Safety
```typescript
// ✅ CORRECT - Use explicit types
getUserById(userId: string): Observable<UserDetailsResponse> {
  return this.apiService.get<UserDetailsResponse>(`/api/users/${userId}`);
}

// ❌ WRONG - Avoid 'any'
getUserById(userId: any): Observable<any> {
  return this.apiService.get(`/api/users/${userId}`);
}
```

#### Null Safety
```typescript
// ✅ CORRECT - Handle null/undefined
function getFullName(user: User | null): string {
  return user?.firstName ?? 'Unknown';
}

// ❌ WRONG - Assume values exist
function getFullName(user: User): string {
  return user.firstName; // Runtime error if user is null
}
```

### Component Standards

#### Component Class Structure Order
```typescript
@Component({...})
export class MyComponent implements OnInit, OnDestroy {
  // 1. Inputs
  @Input() data: string;
  
  // 2. Outputs
  @Output() save = new EventEmitter<void>();
  
  // 3. ViewChild/ContentChild
  @ViewChild('template') template: TemplateRef<any>;
  
  // 4. Public properties
  form: FormGroup;
  users: User[] = [];
  
  // 5. Private properties
  private destroy$ = new Subject<void>();
  
  // 6. Dependency injection
  private userService = inject(UserApiService);
  
  // 7. Lifecycle hooks
  ngOnInit(): void { }
  ngOnDestroy(): void { }
  
  // 8. Public methods
  onSubmit(): void { }
  
  // 9. Private methods
  private loadData(): void { }
}
```

#### Use Standalone Components
```typescript
// ✅ CORRECT - Standalone component (Angular 20)
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, MatTableModule],
  templateUrl: './user-list.component.html'
})
export class UserListComponent { }
```

#### Dependency Injection
```typescript
// ✅ CORRECT - Use inject() function (Angular 14+)
export class UserComponent {
  private userService = inject(UserApiService);
  private router = inject(Router);
}

// ⚠️ ACCEPTABLE - Constructor injection (legacy)
export class UserComponent {
  constructor(
    private userService: UserApiService,
    private router: Router
  ) { }
}
```

### Service Standards

#### Service Structure
```typescript
@Injectable({ providedIn: 'root' })
export class UserApiService {
  // Inject dependencies
  private apiService = inject(ApiService);
  
  // Public methods that return observables
  getUsers(): Observable<User[]> {
    return this.apiService.get<User[]>(API.USERS.GET_ALL).pipe(
      catchError(error => throwError(() => error))
    );
  }
  
  createUser(user: CreateUserRequest): Observable<ApiResponse<User>> {
    return this.apiService.post<ApiResponse<User>>(API.USERS.CREATE, user).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to create user');
        }
        return response;
      }),
      catchError(error => throwError(() => error))
    );
  }
}
```

#### Service Naming
- **API Services**: `{Feature}ApiService` or `{Feature}Service`
- **Business Services**: `{Feature}Service`
- **State Services**: `{Feature}StateService`

### Template Standards

#### Template Syntax
```html
<!-- ✅ CORRECT - Use structural directives properly -->
<div *ngIf="user$ | async as user">
  {{ user.name }}
</div>

<!-- ✅ CORRECT - Use trackBy with ngFor -->
<div *ngFor="let user of users; trackBy: trackByUserId">
  {{ user.name }}
</div>

<!-- ❌ WRONG - Missing trackBy -->
<div *ngFor="let user of users">
  {{ user.name }}
</div>
```

#### Event Binding
```html
<!-- ✅ CORRECT - Use explicit event handlers -->
<button (click)="onSave()">Save</button>

<!-- ❌ WRONG - Inline logic in template -->
<button (click)="user.active = !user.active; saveUser()">Toggle</button>
```

### Observable Standards

#### Subscription Management
```typescript
// ✅ CORRECT - Unsubscribe using takeUntil
export class UserComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  ngOnInit(): void {
    this.userService.getUsers().pipe(
      takeUntil(this.destroy$)
    ).subscribe(users => this.users = users);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// ✅ BETTER - Use async pipe (no manual subscription)
export class UserComponent {
  users$ = this.userService.getUsers();
}
```

#### Observable Naming
```typescript
// ✅ CORRECT - Suffix with $
user$: Observable<User>;
loading$: Observable<boolean>;

// ❌ WRONG - No suffix
user: Observable<User>;
```

### SCSS Standards

#### Component Styles
```scss
// ✅ CORRECT - Scope styles to component
:host {
  display: block;
  
  .user-form {
    padding: 16px;
    
    &__header {
      font-size: 18px;
      font-weight: 600;
    }
    
    &__actions {
      display: flex;
      gap: 8px;
    }
  }
}

// ❌ WRONG - Global selectors
.header {
  font-size: 18px; // Will affect entire app
}
```

#### BEM-like Naming
```scss
.component-name {
  &__element { }  // .component-name__element
  &--modifier { } // .component-name--modifier
}
```

### Error Handling

#### API Errors
```typescript
// ✅ CORRECT - Specific error handling
this.userService.getUser(userId).pipe(
  catchError(error => {
    if (error.status === 404) {
      this.notificationService.showError('User not found');
    } else {
      this.notificationService.showError('An error occurred');
    }
    return throwError(() => error);
  })
).subscribe(user => this.user = user);
```

#### Form Validation Errors
```typescript
// ✅ CORRECT - Validate before submission
onSubmit(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    this.notificationService.showError('Please fix form errors');
    return;
  }
  // Proceed with submission
}
```

## .NET API Standards

### Naming Conventions
- **Controllers**: `{Resource}Controller` (e.g., `UsersController`)
- **Services**: `I{Name}Service` (interface), `{Name}Service` (implementation)
- **Models**: `{Name}Request`, `{Name}Response`, `{Name}Dto`
- **Methods**: `PascalCase` (e.g., `GetUserById`)

### API Response Format
```csharp
// Standard response wrapper
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public T Data { get; set; }
    public List<string> Errors { get; set; }
}
```

### Endpoint Patterns
- **GET**: `/api/v1/{resource}` - List
- **GET**: `/api/v1/{resource}/{id}` - Single item
- **POST**: `/api/v1/{resource}` - Create
- **PUT**: `/api/v1/{resource}/{id}` - Update
- **DELETE**: `/api/v1/{resource}/{id}` - Delete

## Common Anti-Patterns to Avoid

### ❌ DON'T
1. **Business logic in components** - Keep in services
2. **Direct HTTP calls in components** - Use service layer
3. **Subscribe in subscribe** - Use RxJS operators (switchMap, mergeMap)
4. **Mutation of input properties** - Treat as immutable
5. **Any type usage** - Always use specific types
6. **Missing unsubscribe** - Use takeUntil or async pipe
7. **Heavy logic in templates** - Move to component/pipe
8. **Global CSS** - Scope to component
9. **Hardcoded values** - Use constants/environment files
10. **Missing error handling** - Always handle API errors

### ✅ DO
1. **Single Responsibility Principle** - One class, one purpose
2. **Dependency Injection** - Never use 'new' for services
3. **Immutability** - Avoid mutating data
4. **Type safety** - Use TypeScript features fully
5. **Reactive programming** - Embrace RxJS patterns
6. **Test coverage** - Write tests for all code
7. **Accessibility** - Use semantic HTML, ARIA labels
8. **Performance** - Lazy load, OnPush, trackBy
9. **Security** - Sanitize inputs, use HTTPS, CSP
10. **Code reviews** - Require PR approval
