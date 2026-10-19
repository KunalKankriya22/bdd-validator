# Test Examples - Copy-Paste Templates

**Production-ready test templates following AAA pattern (Arrange-Act-Assert).**

---

## Angular Component Tests

### Basic Component Test

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserListComponent } from './user-list.component';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListComponent] // Standalone component
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty user list', () => {
    // Arrange
    // (setup done in beforeEach)

    // Act
    fixture.detectChanges();

    // Assert
    expect(component.users).toEqual([]);
  });
});
```

---

### Component with Service Dependency

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UserListComponent } from './user-list.component';
import { UserApiService } from '../services/user-api.service';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userService: jasmine.SpyObj<UserApiService>;

  beforeEach(async () => {
    // Create spy object with methods we'll call
    const userServiceSpy = jasmine.createSpyObj('UserApiService', [
      'getUsers',
      'deleteUser'
    ]);

    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        { provide: UserApiService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserApiService) as jasmine.SpyObj<UserApiService>;
  });

  it('should load users on init', () => {
    // Arrange
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
    ];
    userService.getUsers.and.returnValue(of(mockUsers));

    // Act
    component.ngOnInit();
    fixture.detectChanges();

    // Assert
    expect(userService.getUsers).toHaveBeenCalled();
    expect(component.users).toEqual(mockUsers);
    expect(component.loading).toBe(false);
  });

  it('should handle error when loading users fails', () => {
    // Arrange
    const error = new Error('API Error');
    userService.getUsers.and.returnValue(throwError(() => error));
    spyOn(component, 'handleError');

    // Act
    component.ngOnInit();
    fixture.detectChanges();

    // Assert
    expect(component.handleError).toHaveBeenCalledWith(error);
    expect(component.loading).toBe(false);
  });
});
```

---

### Component with Form Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { UserFormComponent } from './user-form.component';

describe('UserFormComponent', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFormComponent, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create form with required validators', () => {
    // Arrange & Act
    const form = component.form;

    // Assert
    expect(form.controls['name'].hasError('required')).toBe(true);
    expect(form.controls['email'].hasError('required')).toBe(true);
  });

  it('should validate email format', () => {
    // Arrange
    const emailControl = component.form.controls['email'];

    // Act
    emailControl.setValue('invalid-email');

    // Assert
    expect(emailControl.hasError('email')).toBe(true);

    // Act
    emailControl.setValue('valid@example.com');

    // Assert
    expect(emailControl.hasError('email')).toBe(false);
  });

  it('should not submit when form is invalid', () => {
    // Arrange
    spyOn(component, 'submitForm');
    component.form.controls['name'].setValue('');
    component.form.controls['email'].setValue('');

    // Act
    component.onSubmit();

    // Assert
    expect(component.submitForm).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
  });

  it('should submit valid form data', () => {
    // Arrange
    spyOn(component, 'submitForm');
    component.form.controls['name'].setValue('John Doe');
    component.form.controls['email'].setValue('john@example.com');

    // Act
    component.onSubmit();

    // Assert
    expect(component.submitForm).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com'
    });
  });
});
```

---

### Component with Input/Output Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserCardComponent } from './user-card.component';
import { User } from '../models/user.interface';

describe('UserCardComponent', () => {
  let component: UserCardComponent;
  let fixture: ComponentFixture<UserCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UserCardComponent);
    component = fixture.componentInstance;
  });

  it('should display user information', () => {
    // Arrange
    const mockUser: User = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com'
    };
    component.user = mockUser;

    // Act
    fixture.detectChanges();

    // Assert
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.user-name').textContent).toContain('John Doe');
    expect(compiled.querySelector('.user-email').textContent).toContain('john@example.com');
  });

  it('should emit delete event when delete button clicked', () => {
    // Arrange
    const mockUser: User = { id: '1', name: 'John', email: 'john@example.com' };
    component.user = mockUser;
    let emittedUser: User | undefined;
    component.deleteUser.subscribe((user: User) => emittedUser = user);

    // Act
    component.onDelete();

    // Assert
    expect(emittedUser).toEqual(mockUser);
  });
});
```

---

## Angular Service Tests

### Basic Service with HTTP

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserApiService } from './user-api.service';
import { API } from '@core/constants/api.constants';

describe('UserApiService', () => {
  let service: UserApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserApiService]
    });

    service = TestBed.inject(UserApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verify no outstanding requests
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get users successfully', () => {
    // Arrange
    const mockUsers = [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' }
    ];

    // Act
    service.getUsers().subscribe(users => {
      // Assert
      expect(users).toEqual(mockUsers);
    });

    // Assert HTTP request
    const req = httpMock.expectOne(API.USERS.GET);
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should handle error when get users fails', () => {
    // Arrange
    const errorMessage = 'Failed to load users';

    // Act
    service.getUsers().subscribe(
      () => fail('should have failed'),
      (error) => {
        // Assert
        expect(error.status).toBe(500);
      }
    );

    // Assert HTTP request
    const req = httpMock.expectOne(API.USERS.GET);
    req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
  });

  it('should post user data', () => {
    // Arrange
    const newUser = { name: 'John Doe', email: 'john@example.com' };
    const mockResponse = { success: true, data: { id: '123', ...newUser } };

    // Act
    service.createUser(newUser).subscribe(response => {
      // Assert
      expect(response).toEqual(mockResponse);
      expect(response.data.id).toBeTruthy();
    });

    // Assert HTTP request
    const req = httpMock.expectOne(API.USERS.CREATE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newUser);
    req.flush(mockResponse);
  });
});
```

---

### Service with Dependencies

```typescript
import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';
import { UserApiService } from './user-api.service';
import { NotificationService } from '@shared/services/notification.service';
import { of, throwError } from 'rxjs';

describe('UserService', () => {
  let service: UserService;
  let apiService: jasmine.SpyObj<UserApiService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('UserApiService', ['getUsers', 'deleteUser']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: UserApiService, useValue: apiServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    });

    service = TestBed.inject(UserService);
    apiService = TestBed.inject(UserApiService) as jasmine.SpyObj<UserApiService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });

  it('should load users and update state', () => {
    // Arrange
    const mockUsers = [{ id: '1', name: 'John' }];
    apiService.getUsers.and.returnValue(of(mockUsers));

    // Act
    service.loadUsers();

    // Assert
    expect(apiService.getUsers).toHaveBeenCalled();
    service.users$.subscribe(users => {
      expect(users).toEqual(mockUsers);
    });
  });

  it('should show error notification when load fails', () => {
    // Arrange
    apiService.getUsers.and.returnValue(throwError(() => new Error('API Error')));

    // Act
    service.loadUsers();

    // Assert
    expect(notificationService.showError).toHaveBeenCalledWith('Failed to load users');
  });
});
```

---

## Angular Pipe Tests

```typescript
import { PhoneNumberPipe } from './phone-number.pipe';

describe('PhoneNumberPipe', () => {
  let pipe: PhoneNumberPipe;

  beforeEach(() => {
    pipe = new PhoneNumberPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format 10-digit phone number', () => {
    // Arrange
    const input = '1234567890';

    // Act
    const result = pipe.transform(input);

    // Assert
    expect(result).toBe('(123) 456-7890');
  });

  it('should return empty string for null', () => {
    // Arrange & Act
    const result = pipe.transform(null);

    // Assert
    expect(result).toBe('');
  });

  it('should handle invalid input', () => {
    // Arrange
    const input = '123';

    // Act
    const result = pipe.transform(input);

    // Assert
    expect(result).toBe('123'); // Returns as-is
  });
});
```

---

## .NET (C#) Test Examples

### Basic Service Test (xUnit)

```csharp
using Xunit;
using Moq;
using System.Threading.Tasks;
using System.Collections.Generic;
using YourNamespace.Services;
using YourNamespace.Models;
using YourNamespace.Repositories;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _mockRepository;
    private readonly UserService _service;

    public UserServiceTests()
    {
        _mockRepository = new Mock<IUserRepository>();
        _service = new UserService(_mockRepository.Object);
    }

    [Fact]
    public async Task GetUsers_ReturnsAllUsers()
    {
        // Arrange
        var mockUsers = new List<User>
        {
            new User { Id = "1", Name = "John Doe" },
            new User { Id = "2", Name = "Jane Smith" }
        };
        _mockRepository.Setup(repo => repo.GetAllAsync()).ReturnsAsync(mockUsers);

        // Act
        var result = await _service.GetUsersAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal("John Doe", result[0].Name);
    }

    [Fact]
    public async Task GetUserById_ValidId_ReturnsUser()
    {
        // Arrange
        var userId = "1";
        var mockUser = new User { Id = userId, Name = "John Doe" };
        _mockRepository.Setup(repo => repo.GetByIdAsync(userId)).ReturnsAsync(mockUser);

        // Act
        var result = await _service.GetUserByIdAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.Id);
        Assert.Equal("John Doe", result.Name);
    }

    [Fact]
    public async Task CreateUser_ValidUser_ReturnsCreatedUser()
    {
        // Arrange
        var newUser = new User { Name = "John Doe", Email = "john@example.com" };
        _mockRepository.Setup(repo => repo.AddAsync(It.IsAny<User>())).ReturnsAsync(newUser);

        // Act
        var result = await _service.CreateUserAsync(newUser);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("John Doe", result.Name);
        _mockRepository.Verify(repo => repo.AddAsync(It.IsAny<User>()), Times.Once);
    }

    [Fact]
    public async Task DeleteUser_ValidId_CallsRepositoryDelete()
    {
        // Arrange
        var userId = "1";

        // Act
        await _service.DeleteUserAsync(userId);

        // Assert
        _mockRepository.Verify(repo => repo.DeleteAsync(userId), Times.Once);
    }
}
```

---

### API Controller Test (xUnit)

```csharp
using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using YourNamespace.Controllers;
using YourNamespace.Services;
using YourNamespace.Models;

public class UsersControllerTests
{
    private readonly Mock<IUserService> _mockService;
    private readonly UsersController _controller;

    public UsersControllerTests()
    {
        _mockService = new Mock<IUserService>();
        _controller = new UsersController(_mockService.Object);
    }

    [Fact]
    public async Task GetUsers_ReturnsOkResultWithUsers()
    {
        // Arrange
        var mockUsers = new List<User>
        {
            new User { Id = "1", Name = "John" }
        };
        _mockService.Setup(service => service.GetUsersAsync()).ReturnsAsync(mockUsers);

        // Act
        var result = await _controller.GetUsers();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var users = Assert.IsAssignableFrom<IEnumerable<User>>(okResult.Value);
        Assert.Single(users);
    }

    [Fact]
    public async Task GetUserById_ValidId_ReturnsOkResult()
    {
        // Arrange
        var userId = "1";
        var mockUser = new User { Id = userId, Name = "John" };
        _mockService.Setup(service => service.GetUserByIdAsync(userId)).ReturnsAsync(mockUser);

        // Act
        var result = await _controller.GetUser(userId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var user = Assert.IsType<User>(okResult.Value);
        Assert.Equal(userId, user.Id);
    }

    [Fact]
    public async Task GetUserById_InvalidId_ReturnsNotFound()
    {
        // Arrange
        var userId = "999";
        _mockService.Setup(service => service.GetUserByIdAsync(userId)).ReturnsAsync((User)null);

        // Act
        var result = await _controller.GetUser(userId);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task CreateUser_ValidUser_ReturnsCreatedAtAction()
    {
        // Arrange
        var newUser = new User { Name = "John", Email = "john@example.com" };
        var createdUser = new User { Id = "1", Name = "John", Email = "john@example.com" };
        _mockService.Setup(service => service.CreateUserAsync(newUser)).ReturnsAsync(createdUser);

        // Act
        var result = await _controller.CreateUser(newUser);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal("GetUser", createdResult.ActionName);
        Assert.Equal("1", createdResult.RouteValues["id"]);
    }
}
```

---

## Common Test Patterns

### Testing Async Methods

```typescript
it('should handle async operation', async () => {
  // Arrange
  const mockData = { id: '1', name: 'Test' };
  service.getData.and.returnValue(of(mockData));

  // Act
  await component.loadData();

  // Assert
  expect(component.data).toEqual(mockData);
});
```

### Testing Error Scenarios

```typescript
it('should handle error gracefully', () => {
  // Arrange
  const error = new Error('Network error');
  service.getData.and.returnValue(throwError(() => error));
  spyOn(component, 'handleError');

  // Act
  component.loadData();

  // Assert
  expect(component.handleError).toHaveBeenCalledWith(error);
  expect(component.loading).toBe(false);
});
```

### Testing Observable Streams

```typescript
it('should emit values correctly', (done) => {
  // Arrange
  const expectedValues = [1, 2, 3];
  let emittedValues: number[] = [];

  // Act
  component.valueStream$.subscribe(value => {
    emittedValues.push(value);
    
    // Assert
    if (emittedValues.length === expectedValues.length) {
      expect(emittedValues).toEqual(expectedValues);
      done();
    }
  });

  component.emitValues();
});
```

---

## Coverage Goals

- **Overall project:** 80% minimum
- **New code:** 90% minimum
- **Services:** 95% (most critical)
- **Components:** 85%
- **Pipes/Directives:** 90%

Run coverage:
```bash
npm test -- --code-coverage
open coverage/index.html
```

---

**For additional guidance:** See [quick-reference.md](quick-reference.md) and [coding-standards.md](coding-standards.md)
