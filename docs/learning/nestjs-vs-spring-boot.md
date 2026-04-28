# NestJS vs Spring Boot: Pattern Mapping

This guide maps every Spring Boot concept you already know to its NestJS equivalent, with
working code examples using HRIS domain objects (employees, leave, payroll, attendance,
approvals).

---

## Table of Contents

1. @Module vs @Configuration
2. @Injectable vs @Service
3. @Controller vs @RestController
4. @Get/@Post vs @GetMapping/@PostMapping
5. @Body/@Param vs @RequestBody/@PathVariable
6. class-validator vs javax.validation
7. ExceptionFilter vs @ControllerAdvice
8. Guards vs Spring Security
9. Interceptors vs AOP
10. ConfigModule vs @Value
11. Jest vs JUnit/Mockito
12. Drizzle Transactions vs @Transactional

---

## 1. @Module vs @Configuration

In Spring Boot, `@Configuration` classes declare beans and wire dependencies. NestJS uses
`@Module()` as the unit of encapsulation. A module declares which providers (services) it
contains, which controllers it exposes, which other modules it imports, and which providers
it exports to other modules.

**Spring Boot**
```java
@Configuration
public class EmployeeConfig {
    @Bean
    public EmployeeService employeeService(EmployeeRepository repo) {
        return new EmployeeService(repo);
    }
}
```

**NestJS**
```typescript
// apps/api/src/modules/employee/employee.module.ts
import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { EmployeeRepository } from './employee.repository';
import { DbModule } from '../../common/db/db.module';

@Module({
  imports: [DbModule],               // modules this module depends on
  controllers: [EmployeeController], // HTTP entry points
  providers: [EmployeeService, EmployeeRepository], // DI-managed classes
  exports: [EmployeeService],        // what other modules may inject
})
export class EmployeeModule {}
```

The root `AppModule` imports all feature modules:

```typescript
// apps/api/src/app.module.ts
@Module({
  imports: [
    EmployeeModule,
    LeaveModule,
    PayrollModule,
    AttendanceModule,
    ApprovalModule,
  ],
})
export class AppModule {}
```

**Module boundary rule:** modules only export what other modules legitimately need. Most
services are NOT exported — they are private to the module. If another module needs data from
the employee module, it injects `EmployeeService` (exported), not `EmployeeRepository`
(not exported).

---

## 2. @Injectable vs @Service

`@Service` in Spring is a specialisation of `@Component`. NestJS uses `@Injectable()` for
everything managed by the DI container (services, repositories, guards, interceptors).
The meaning is the same: tell the DI container "this class can be injected".

**Spring Boot**
```java
@Service
public class LeaveService {
    private final LeaveRepository leaveRepository;
    private final EmployeeService employeeService;
    
    @Autowired
    public LeaveService(LeaveRepository leaveRepository,
                        EmployeeService employeeService) {
        this.leaveRepository = leaveRepository;
        this.employeeService = employeeService;
    }
    
    public LeaveBalance getBalance(String employeeId, String leaveType) {
        Employee emp = employeeService.findById(employeeId);
        return leaveRepository.findBalance(employeeId, leaveType);
    }
}
```

**NestJS**
```typescript
// apps/api/src/modules/leave/leave.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { LeaveRepository } from './leave.repository';
import { EmployeeService } from '../employee/employee.service';

@Injectable()
export class LeaveService {
  constructor(
    private readonly leaveRepository: LeaveRepository,
    private readonly employeeService: EmployeeService,
  ) {}

  async getBalance(employeeId: string, leaveType: string): Promise<LeaveBalance> {
    // verifies employee exists — throws NotFoundException if not
    await this.employeeService.findById(employeeId);
    return this.leaveRepository.findBalance(employeeId, leaveType);
  }
}
```

Constructor injection is the only style used in this codebase. Property injection exists but
is harder to test and makes dependencies less visible.

---

## 3. @Controller vs @RestController

Spring's `@RestController` = `@Controller` + `@ResponseBody`. NestJS's `@Controller` always
behaves like `@RestController` — it serialises the return value to JSON by default.

**Spring Boot**
```java
@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    private final EmployeeService employeeService;
    
    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }
}
```

**NestJS**
```typescript
// apps/api/src/modules/employee/employee.controller.ts
import { Controller } from '@nestjs/common';
import { EmployeeService } from './employee.service';

@Controller('employees')   // path prefix: /employees
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}
}
```

The global prefix `/api` is set once in `main.ts`:

```typescript
// apps/api/src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(3000);
}
```

---

## 4. @Get/@Post vs @GetMapping/@PostMapping

**Spring Boot**
```java
@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    @GetMapping
    public List<Employee> list(@RequestParam(defaultValue = "1") int page,
                               @RequestParam(defaultValue = "20") int size) {
        return employeeService.list(page, size);
    }

    @GetMapping("/{id}")
    public Employee getById(@PathVariable String id) {
        return employeeService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Employee create(@RequestBody @Valid CreateEmployeeDto dto) {
        return employeeService.create(dto);
    }

    @PatchMapping("/{id}/transfer")
    public Employee transfer(@PathVariable String id,
                             @RequestBody @Valid TransferDto dto) {
        return employeeService.transfer(id, dto);
    }
}
```

**NestJS**
```typescript
import { Controller, Get, Post, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  list(
    @Query('page') page = 1,
    @Query('size') size = 20,
  ): Promise<PageResult<Employee>> {
    return this.employeeService.list(Number(page), Number(size));
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<Employee> {
    return this.employeeService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEmployeeDto): Promise<Employee> {
    return this.employeeService.create(dto);
  }

  @Patch(':id/transfer')
  transfer(
    @Param('id') id: string,
    @Body() dto: TransferEmployeeDto,
  ): Promise<Employee> {
    return this.employeeService.transfer(id, dto);
  }
}
```

HTTP method decorators: `@Get()`, `@Post()`, `@Put()`, `@Patch()`, `@Delete()`.
They accept an optional path string: `@Get(':id')` is equivalent to `@GetMapping("/{id}")`.

---

## 5. @Body/@Param vs @RequestBody/@PathVariable

| Spring Boot          | NestJS           | Purpose                          |
|----------------------|------------------|----------------------------------|
| `@RequestBody`       | `@Body()`        | Parse JSON request body          |
| `@PathVariable`      | `@Param('name')` | Extract URL path segment         |
| `@RequestParam`      | `@Query('name')` | Extract query string parameter   |
| `@RequestHeader`     | `@Headers('name')` | Read a specific request header |

```typescript
// All parameter decorators in one example
@Get(':employeeId/leave')
getLeaveBalance(
  @Param('employeeId') employeeId: string,
  @Query('type') leaveType: string,
  @Headers('x-tenant-id') tenantId: string,
): Promise<LeaveBalance> {
  return this.leaveService.getBalance(employeeId, leaveType, tenantId);
}
```

---

## 6. class-validator vs javax.validation

Spring Boot uses `javax.validation` (now `jakarta.validation`) annotations. NestJS uses the
`class-validator` library. The annotation names are nearly identical.

**Spring Boot**
```java
public class CreateLeaveRequestDto {
    @NotBlank
    private String employeeId;
    
    @NotBlank
    private String leaveType;
    
    @NotNull
    @Future
    private LocalDate startDate;
    
    @NotNull
    @Future
    private LocalDate endDate;
    
    @Min(0)
    @Max(365)
    private int days;
}
```

**NestJS (class-validator)**
```typescript
import { IsString, IsNotEmpty, IsDateString, IsIn, Min, Max, IsInt } from 'class-validator';

export class CreateLeaveRequestDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsIn(['annual', 'sick', 'maternity', 'paternity', 'unpaid'])
  leaveType: string;

  @IsDateString()   // expects YYYY-MM-DD format
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsInt()
  @Min(1)
  @Max(365)
  days: number;
}
```

Validation must be wired up globally in `main.ts`:

```typescript
// apps/api/src/main.ts
import { ValidationPipe } from '@nestjs/common';

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,         // strip unknown properties (like @JsonIgnoreProperties)
    forbidNonWhitelisted: true,
    transform: true,         // coerce query params to declared types
  }),
);
```

With `whitelist: true`, any property not declared on the DTO is silently stripped before the
handler runs — equivalent to `@JsonIgnoreProperties(ignoreUnknown = true)` in Jackson.

---

## 7. ExceptionFilter vs @ControllerAdvice

Spring uses `@ControllerAdvice` + `@ExceptionHandler` to map exceptions to HTTP responses.
NestJS uses `ExceptionFilter`.

**Spring Boot**
```java
@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(EntityNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(EntityNotFoundException ex) {
        return new ErrorResponse("NOT_FOUND", ex.getMessage());
    }
    
    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidation(ConstraintViolationException ex) {
        return new ErrorResponse("VALIDATION_ERROR", ex.getMessage());
    }
}
```

**NestJS**
```typescript
// apps/api/src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();
    const status   = exception.getStatus();
    const body     = exception.getResponse();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(typeof body === 'string' ? { message: body } : body),
    });
  }
}
```

NestJS has built-in exceptions you throw directly from services — no need to define custom
exception classes for most cases:

```typescript
// These are equivalent to Spring's ResponseStatusException
throw new NotFoundException(`Employee ${id} not found`);
throw new BadRequestException('Leave start date must be before end date');
throw new ConflictException('Leave request overlaps with an approved request');
throw new ForbiddenException('You do not have permission to approve this request');
throw new UnauthorizedException('Token expired');
```

Register the filter globally in `main.ts`:
```typescript
app.useGlobalFilters(new HttpExceptionFilter());
```

---

## 8. Guards vs Spring Security

Spring Security uses filter chains and `@PreAuthorize` to protect endpoints. NestJS uses Guards.
A Guard returns `true` (allow) or `false` (deny). Guards can also throw exceptions.

**Spring Boot**
```java
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws IOException, ServletException {
        String token = extractToken(request);
        if (token != null && jwtService.isValid(token)) {
            SecurityContextHolder.getContext()
                .setAuthentication(jwtService.getAuthentication(token));
        }
        filterChain.doFilter(request, response);
    }
}

@RestController
public class LeaveController {
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('HR_ADMIN') or #id == authentication.principal.employeeId")
    public LeaveRequest getById(@PathVariable String id) { ... }
}
```

**NestJS**
```typescript
// apps/api/src/common/guards/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token   = this.extractToken(request);
    if (!token) throw new UnauthorizedException();

    try {
      request.user = this.jwtService.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException('Token invalid or expired');
    }
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = (request.headers['authorization'] ?? '').split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}

// Permissions guard
@Injectable()
export class PermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request    = context.switchToHttp().getRequest();
    const user       = request.user;
    const required   = this.reflector.get<string[]>('permissions', context.getHandler());
    if (!required) return true;
    return required.every(p => user.permissions.includes(p));
  }
}

// Usage in controller
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('leave')
export class LeaveController {
  @Get(':id')
  @SetMetadata('permissions', ['leave:read'])
  getById(@Param('id') id: string) { ... }
}
```

Apply guards globally (all routes protected by default):
```typescript
app.useGlobalGuards(new JwtAuthGuard(jwtService));
```

---

## 9. Interceptors vs AOP

Spring AOP uses `@Aspect`, `@Around`, `@Before`, and `@After` to intercept method calls.
NestJS Interceptors wrap the request/response pipeline using RxJS Observables — but you do
not need to understand RxJS deeply. The pattern for logging, timing, and response transformation
is straightforward.

**Spring Boot (AOP)**
```java
@Aspect
@Component
public class AuditAspect {
    @Around("@annotation(Audited)")
    public Object audit(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        try {
            Object result = pjp.proceed();
            log.info("Method {} completed in {}ms", pjp.getSignature(), System.currentTimeMillis() - start);
            return result;
        } catch (Throwable t) {
            log.error("Method {} failed", pjp.getSignature(), t);
            throw t;
        }
    }
}
```

**NestJS Interceptor**
```typescript
// apps/api/src/common/interceptors/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request   = context.switchToHttp().getRequest();
    const { method, url } = request;
    const start     = Date.now();

    return next.handle().pipe(
      tap({
        next: ()  => console.log(`${method} ${url} — ${Date.now() - start}ms`),
        error: (e) => console.error(`${method} ${url} failed — ${e.message}`),
      }),
    );
  }
}
```

Register globally:
```typescript
app.useGlobalInterceptors(new LoggingInterceptor());
```

---

## 10. ConfigModule vs @Value

Spring reads environment variables and `application.properties` via `@Value` and
`@ConfigurationProperties`. NestJS uses `ConfigModule` with optional schema validation.

**Spring Boot**
```java
@Value("${jwt.secret}")
private String jwtSecret;

@Value("${payroll.batch.size:100}")
private int batchSize;
```

**NestJS — basic**
```typescript
// apps/api/src/app.module.ts
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,       // no need to import ConfigModule in every module
      envFilePath: '.env',
    }),
  ],
})
export class AppModule {}

// Usage in a service
@Injectable()
export class JwtService {
  constructor(private readonly config: ConfigService) {}

  sign(payload: object): string {
    return jwt.sign(payload, this.config.get<string>('JWT_SECRET'));
  }
}
```

**NestJS — validated config with Zod (recommended)**

```typescript
// packages/config/src/env.schema.ts
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV:    z.enum(['development', 'test', 'production']),
  PORT:        z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET:  z.string().min(32),
  REDIS_URL:   z.string().url(),
});

export type Env = z.infer<typeof envSchema>;
```

```typescript
// apps/api/src/app.module.ts
ConfigModule.forRoot({
  isGlobal: true,
  validate: (config) => envSchema.parse(config),
})
```

If a required variable is missing or has the wrong format, the application fails immediately
at startup with a clear error — the same guarantee as `@ConfigurationProperties` with
`@Validated` in Spring Boot.

---

## 11. Jest vs JUnit/Mockito

| Java (JUnit + Mockito)         | TypeScript (Jest)                           |
|-------------------------------|---------------------------------------------|
| `@Test`                       | `it('description', () => { ... })`          |
| `@BeforeEach`                 | `beforeEach(() => { ... })`                 |
| `@AfterEach`                  | `afterEach(() => { ... })`                  |
| `assertThat(x).isEqualTo(y)`  | `expect(x).toBe(y)` or `.toEqual(y)`        |
| `Mockito.mock(Service.class)` | `jest.fn()` or `createMock<Service>()`      |
| `when(mock.method()).thenReturn(value)` | `jest.spyOn(mock, 'method').mockResolvedValue(value)` |
| `verify(mock).method(arg)`    | `expect(mock.method).toHaveBeenCalledWith(arg)` |

**Unit test — NestJS service with mocked dependencies**

```typescript
// apps/api/src/modules/leave/leave.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { LeaveService } from './leave.service';
import { LeaveRepository } from './leave.repository';
import { EmployeeService } from '../employee/employee.service';
import { BadRequestException } from '@nestjs/common';

describe('LeaveService', () => {
  let service: LeaveService;
  let leaveRepo: jest.Mocked<LeaveRepository>;
  let employeeService: jest.Mocked<EmployeeService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveService,
        {
          provide: LeaveRepository,
          useValue: {
            findBalance: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: EmployeeService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service       = module.get(LeaveService);
    leaveRepo     = module.get(LeaveRepository);
    employeeService = module.get(EmployeeService);
  });

  it('throws BadRequestException when end date is before start date', async () => {
    employeeService.findById.mockResolvedValue({ id: 'EMP-1', status: 'active' } as any);

    await expect(
      service.createRequest({
        employeeId: 'EMP-1',
        leaveType: 'annual',
        startDate: '2026-06-10',
        endDate:   '2026-06-05',  // end before start
        days: 5,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns leave balance for valid employee', async () => {
    employeeService.findById.mockResolvedValue({ id: 'EMP-1', status: 'active' } as any);
    leaveRepo.findBalance.mockResolvedValue({ available: 10, used: 2, pending: 1 });

    const balance = await service.getBalance('EMP-1', 'annual');
    expect(balance.available).toBe(10);
    expect(leaveRepo.findBalance).toHaveBeenCalledWith('EMP-1', 'annual');
  });
});
```

**Integration test — HTTP layer with Supertest**

```typescript
// apps/api/src/modules/employee/employee.controller.spec.ts
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { EmployeeModule } from './employee.module';

describe('EmployeeController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [EmployeeModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(() => app.close());

  it('GET /employees/:id returns 404 for unknown id', () => {
    return request(app.getHttpServer())
      .get('/employees/non-existent-id')
      .expect(404);
  });
});
```

---

## 12. Drizzle Transactions vs @Transactional

Spring's `@Transactional` wraps a method in a database transaction. Drizzle uses an explicit
transaction callback. There is no annotation equivalent — you must explicitly pass the
transaction handle to every query that must participate.

**Spring Boot**
```java
@Service
public class PayrollService {
    @Transactional
    public PayrollRun finalise(String runId) {
        PayrollRun run = runRepository.findById(runId).orElseThrow();
        run.setStatus("finalised");
        runRepository.save(run);
        // if this throws, both saves are rolled back
        payslipRepository.markAllFinalised(runId);
        return run;
    }
}
```

**NestJS with Drizzle**
```typescript
// apps/api/src/modules/payroll/payroll.service.ts
import { db } from '@hris/db';
import { payrollRuns, payslips } from '@hris/db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class PayrollService {
  async finalise(runId: string): Promise<PayrollRun> {
    return db.transaction(async (tx) => {
      // tx is a transaction-scoped connection — pass it to every query
      const [run] = await tx
        .update(payrollRuns)
        .set({ status: 'finalised', finalisedAt: new Date() })
        .where(eq(payrollRuns.id, runId))
        .returning();

      if (!run) throw new NotFoundException(`Payroll run ${runId} not found`);

      await tx
        .update(payslips)
        .set({ status: 'finalised' })
        .where(eq(payslips.runId, runId));

      return run;
      // transaction commits automatically when the callback returns
      // if any query throws, the transaction is rolled back
    });
  }
}
```

The critical difference: Drizzle cannot automatically propagate a transaction through method
calls the way Spring does with `@Transactional` and the AOP proxy. You must pass `tx` explicitly
to any repository method that needs to participate in the transaction. See `drizzle-orm-guide.md`
for more detail on this pattern.
