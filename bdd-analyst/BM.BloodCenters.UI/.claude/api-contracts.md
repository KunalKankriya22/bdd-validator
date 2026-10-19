# API Contracts

## API Standards

### Base URL
All API endpoints are accessed through the proxy configuration defined in `proxy.conf.json`.

**Pattern**: `/api/v1/{resource}`

### Authentication
All authenticated requests require an Okta bearer token in the Authorization header:
```
Authorization: Bearer {token}
```

This is handled automatically by the `AuthInterceptor`.

## Response Format Standards

### Success Response
```typescript
interface ApiResponse<T> {
  success: boolean;        // or isSuccess
  message: string;
  data?: T;
}
```

**Example**:
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "userId": "12345",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Error Response
```typescript
interface ApiErrorResponse {
  success: boolean;
  message: string;
  errors?: string[];
  errorCode?: string;
}
```

**Example**:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Email is required",
    "Password must be at least 8 characters"
  ],
  "errorCode": "VALIDATION_ERROR"
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors, malformed request |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource, state conflict |
| 500 | Internal Server Error | Server-side error |

## API Endpoint Patterns

### RESTful Conventions

#### List Resources
```
GET /api/v1/{resource}
Query params: page, pageSize, sortBy, sortOrder, filters
```

**Example**:
```typescript
getUsers(page: number = 1, pageSize: number = 50): Observable<User[]> {
  const params = new HttpParams()
    .set('page', page.toString())
    .set('pageSize', pageSize.toString());
  
  return this.apiService.get<User[]>('/api/v1/users', { params });
}
```

#### Get Single Resource
```
GET /api/v1/{resource}/{id}
```

**Example**:
```typescript
getUser(userId: string): Observable<UserDetailsResponse> {
  return this.apiService.get<UserDetailsResponse>(`/api/v1/system-users/${userId}`);
}
```

#### Create Resource
```
POST /api/v1/{resource}
Body: Resource creation payload
```

**Example**:
```typescript
createUser(request: CreateUserRequest): Observable<ApiResponse<User>> {
  return this.apiService.post<ApiResponse<User>>('/api/v1/system-users/create-system-user', request);
}
```

#### Update Resource
```
PUT /api/v1/{resource}/{id}
Body: Full resource update payload
```

**Example**:
```typescript
updateUser(userId: string, request: UpdateUserRequest): Observable<ApiResponse<User>> {
  return this.apiService.put<ApiResponse<User>>(`/api/v1/system-users/${userId}`, request);
}
```

#### Delete Resource
```
DELETE /api/v1/{resource}/{id}
```

**Example**:
```typescript
deleteUser(userId: string): Observable<void> {
  return this.apiService.delete<void>(`/api/v1/system-users/${userId}`);
}
```

### Lookup Endpoints
For dropdown/select options:
```
GET /api/v1/{resource}/lookup
```

**Example**:
```typescript
getChapters(chapterId?: string): Observable<ChapterLookup[]> {
  const endpoint = chapterId 
    ? `/api/v1/chapters/lookup?chapterId=${encodeURIComponent(chapterId)}`
    : '/api/v1/chapters/lookup';
  return this.apiService.get<ChapterLookup[]>(endpoint);
}
```

## Request/Response Models

### Naming Conventions
- **Request models**: `{Action}{Resource}Request` (e.g., `CreateUserRequest`, `UpdateDonorRequest`)
- **Response models**: `{Resource}Response` or `{Resource}DetailsResponse` (e.g., `UserResponse`, `UserDetailsResponse`)
- **Lookup models**: `{Resource}Lookup` (e.g., `ChapterLookup`, `WarehouseLookup`)

### Model Location
Store in feature's `models/` or `interfaces/` folder:
```
modules/
  system-administration/
    manage-users/
      models/
        ├── create-user-request.model.ts
        ├── update-user-request.model.ts
        ├── user-details-response.model.ts
        └── service.model.ts  // All service-related models
```

### TypeScript Interface Examples

#### Request Model
```typescript
export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  chapterId: string;
  accessLevel: number;
  effectiveDate: string;      // ISO date format YYYY-MM-DD
  terminationDate?: string;   // Optional
  groups?: string[];
}
```

#### Response Model
```typescript
export interface UserDetailsResponse {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  chapterId: string;
  chapterName: string;
  accessLevel: number;
  accessLevelName: string;
  effectiveDate: string;
  terminationDate: string | null;
  isActive: boolean;
  createdDate: string;
  modifiedDate: string;
}
```

#### Lookup Model
```typescript
export interface ChapterLookup {
  chapterId: string;
  chapterName: string;
  chapterCode: string;
  isActive: boolean;
}
```

## Date Handling

### API Date Format
**Always use ISO 8601 format**: `YYYY-MM-DD`

### Date Serialization
```typescript
// ✅ CORRECT - Use DateFieldValidationUtility
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

const apiDate = DateFieldValidationUtility.serializeDateForApi(momentDate);
// Returns: "2026-04-21"

// ✅ CORRECT - Manual formatting
function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ❌ WRONG - Using toISOString (includes time)
const date = new Date().toISOString(); // "2026-04-21T12:34:56.789Z"
```

### Date Parsing
```typescript
// ✅ CORRECT - Parse from API
import moment from 'moment';

const momentDate = moment(apiDateString, 'YYYY-MM-DD');

// ✅ CORRECT - Handle DD-MMM-YYYY format
const momentDate = moment(dateStr, ['DD-MMM-YYYY', 'YYYY-MM-DD'], true);
```

## Error Handling Standards

### Service-Level Error Handling
```typescript
createUser(request: CreateUserRequest): Observable<ApiResponse<User>> {
  return this.apiService.post<ApiResponse<User>>(endpoint, request).pipe(
    map(response => {
      // Check success flag
      const isSuccessful = response.success || response.isSuccess;
      if (!isSuccessful) {
        throw new Error(response.message || 'Failed to create user');
      }
      return response;
    }),
    catchError(error => {
      // Log error
      console.error('Create user failed:', error);
      // Re-throw for component handling
      return throwError(() => error);
    })
  );
}
```

### Component-Level Error Handling
```typescript
onSubmit(): void {
  this.userService.createUser(this.form.getRawValue()).subscribe({
    next: (response) => {
      this.notificationService.showSuccess('User created successfully');
      this.router.navigate(['/users']);
    },
    error: (error) => {
      // Handle specific error cases
      if (error.status === 409) {
        this.notificationService.showError('User already exists');
      } else if (error.status === 400) {
        this.notificationService.showError(error.error?.message || 'Invalid data');
      } else {
        this.notificationService.showError('An unexpected error occurred');
      }
    }
  });
}
```

## Validation Rules

### Request Validation
All request payloads must be validated on both client and server.

#### Client-Side Validation
```typescript
form = new FormGroup({
  email: new FormControl('', [
    Validators.required,
    Validators.email,
    Validators.maxLength(100)
  ]),
  firstName: new FormControl('', [
    Validators.required,
    Validators.maxLength(50)
  ]),
  phone: new FormControl('', [
    Validators.pattern(/^\d{10}$/)
  ])
});
```

#### Server-Side Validation
Server must return validation errors in standardized format:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "FirstName is required",
    "Email must be a valid email address"
  ]
}
```

### Common Validation Rules
- **Email**: Must match email regex pattern
- **Phone**: 10 digits (US format)
- **Required fields**: Cannot be null, undefined, or empty string
- **String length**: Enforce maxLength based on database schema
- **Dates**: Must be valid dates in YYYY-MM-DD format
- **Enums**: Must match allowed values

## API Constant Management

### Centralized API Constants
**Location**: `src/app/core/constants/api.constants.ts`

```typescript
export const API = {
  SYSTEM_ADMIN: {
    MANAGE_USERS: {
      GET_ALL: '/api/v1/system-users',
      GET_USER: (userId: string) => `/api/v1/system-users/${userId}`,
      CREATE_USER: '/api/v1/system-users/create-system-user',
      UPDATE_USER: (userId: string) => `/api/v1/system-users/${userId}`,
      DELETE_USER: (userId: string) => `/api/v1/system-users/${userId}`,
      GET_USER_CHAPTERS: (userId: string) => `/api/v1/system-users/${userId}/chapters`,
      ADD_NEW_USER: {
        CHAPTER_LOOKUP: '/api/v1/chapters/lookup',
        WAREHOUSE_LOOKUP: '/api/v1/system-users/GetWarehouses',
        LABCODE_LOOKUP: '/api/v1/system-users/GetLabCodes',
        PRINTER_LOOKUP: '/api/v1/system-users/GetPrinterCodes',
        GROUP_LOOKUP: '/api/v1/groups',
        ACCESS_LEVEL_LOOKUP: '/api/v1/system-users/GetAccessLevels'
      }
    }
  },
  DONOR: {
    SEARCH: '/api/v1/donors/search',
    GET_DONOR: (donorId: string) => `/api/v1/donors/${donorId}`,
    CREATE_DONOR: '/api/v1/donors',
    UPDATE_DONOR: (donorId: string) => `/api/v1/donors/${donorId}`
  }
};
```

### Usage
```typescript
import { API } from '@core/constants/api.constants';

getUser(userId: string): Observable<UserDetailsResponse> {
  return this.apiService.get<UserDetailsResponse>(API.SYSTEM_ADMIN.MANAGE_USERS.GET_USER(userId));
}
```

## Query Parameters

### Filtering
```typescript
interface FilterParams {
  chapterId?: string;
  status?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
}

getUsers(filters: FilterParams): Observable<User[]> {
  let params = new HttpParams();
  
  if (filters.chapterId) {
    params = params.set('chapterId', filters.chapterId);
  }
  if (filters.status) {
    params = params.set('status', filters.status);
  }
  if (filters.searchTerm) {
    params = params.set('search', filters.searchTerm);
  }
  
  return this.apiService.get<User[]>('/api/v1/users', { params });
}
```

### Pagination
```typescript
interface PaginationParams {
  page: number;      // 1-based index
  pageSize: number;  // Default: 50
}

interface PaginatedResponse<T> {
  data: T[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
}

getUsers(pagination: PaginationParams): Observable<PaginatedResponse<User>> {
  const params = new HttpParams()
    .set('page', pagination.page.toString())
    .set('pageSize', pagination.pageSize.toString());
  
  return this.apiService.get<PaginatedResponse<User>>('/api/v1/users', { params });
}
```

### Sorting
```typescript
interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

getUsers(sort: SortParams): Observable<User[]> {
  const params = new HttpParams()
    .set('sortBy', sort.sortBy)
    .set('sortOrder', sort.sortOrder);
  
  return this.apiService.get<User[]>('/api/v1/users', { params });
}
```

## API Testing Guidelines

### Mock API Responses
Create mock data in `{feature}/models/{resource}.mock.ts`:

```typescript
export const mockUser: UserDetailsResponse = {
  userId: '12345',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  chapterId: 'CH001',
  chapterName: 'Main Chapter',
  accessLevel: 5,
  accessLevelName: 'Administrator',
  effectiveDate: '2026-01-01',
  terminationDate: null,
  isActive: true,
  createdDate: '2026-01-01T00:00:00Z',
  modifiedDate: '2026-04-01T00:00:00Z'
};
```

### Service Unit Tests
```typescript
describe('UserApiService', () => {
  let service: UserApiService;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserApiService, ApiService]
    });
    service = TestBed.inject(UserApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  it('should get user by id', () => {
    const userId = '12345';
    const mockResponse = mockUser;
    
    service.getUser(userId).subscribe(user => {
      expect(user).toEqual(mockResponse);
    });
    
    const req = httpMock.expectOne(`/api/v1/system-users/${userId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
  
  afterEach(() => {
    httpMock.verify();
  });
});
```

## API Contract Enforcement Rules

### 🚫 NEVER
1. **Use `any` type for API responses** - Always define interfaces
2. **Guess field names** - Verify with backend/Swagger
3. **Skip error handling** - Always handle errors
4. **Mutate request objects** - Create new objects
5. **Hardcode URLs** - Use API constants
6. **Send dates without formatting** - Use ISO format
7. **Ignore API response structure** - Follow standards
8. **Skip null checks** - Handle optional fields

### ✅ ALWAYS
1. **Define TypeScript interfaces** for all requests/responses
2. **Use API constants** for endpoint URLs
3. **Handle errors** at service and component level
4. **Validate data** before sending to API
5. **Format dates** to YYYY-MM-DD
6. **Check success flags** in API responses
7. **Use proper HTTP methods** (GET, POST, PUT, DELETE)
8. **Document breaking changes** in API contracts
9. **Version APIs** when making breaking changes
10. **Test API integration** with unit tests
