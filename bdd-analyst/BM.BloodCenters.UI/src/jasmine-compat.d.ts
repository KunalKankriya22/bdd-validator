declare namespace jest {
  interface Matchers<R> {
    toBeTrue(): R;
    toBeFalse(): R;
    toBeTruthy(msg?: string): R;
    toBeFalsy(msg?: string): R;
    toHaveBeenCalledOnceWith(...args: any[]): R;
    toThrowError(expected?: string | RegExp | typeof Error): R;
    withContext(context: string): jest.Matchers<R>;
  }
}

declare namespace jasmine {
  interface SpyAnd {
    returnValue(val: any): void;
    callThrough(): void;
    callFake(fn: (...args: any[]) => any): void;
    throwError(msg: string | Error): void;
    resolveTo(val?: any): void;
    rejectWith(val?: any): void;
  }

  interface CallInfo {
    args: any[];
    returnValue?: any;
  }

  interface Calls {
    count(): number;
    mostRecent(): CallInfo;
    reset(): void;
    argsFor(index: number): any[];
    first(): CallInfo;
    all(): CallInfo[];
  }

  interface Spy extends jest.Mock {
    and: SpyAnd;
    calls: Calls;
  }

  type SpyObj<T> = T & {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? Spy : T[K];
  };

  function createSpyObj<T = any>(baseName: string, methods: string[]): SpyObj<T>;
  function createSpyObj<T = any>(
    baseName: string,
    methods: string[],
    properties?: string[],
  ): SpyObj<T>;
  function createSpy(name?: string): Spy;
  function isSpy(value: any): boolean;
  function objectContaining<T>(sample: Partial<T>): any;
  function arrayContaining<T>(sample: T[]): any;
  function any(classType: any): any;
  function anything(): any;
  function stringMatching(pattern: string | RegExp): any;
  function stringContaining(expected: string): any;

  function clock(): {
    install(): void;
    uninstall(): void;
    tick(milliseconds: number): void;
    mockDate(date: Date): void;
  };
}
