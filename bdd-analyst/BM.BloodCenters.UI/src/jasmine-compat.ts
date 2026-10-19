expect.extend({
  toBeTrue(received: any) {
    return {
      pass: received === true,
      message: () => `expected ${received} to be true`,
    };
  },
  toBeFalse(received: any) {
    return {
      pass: received === false,
      message: () => `expected ${received} to be false`,
    };
  },
  toBeTruthy(received: any, _msg?: string) {
    return {
      pass: !!received,
      message: () => _msg || `expected ${received} to be truthy`,
    };
  },
  toBeFalsy(received: any, _msg?: string) {
    return {
      pass: !received,
      message: () => _msg || `expected ${received} to be falsy`,
    };
  },
  toHaveBeenCalledOnceWith(received: any, ...expectedArgs: any[]) {
    const mock = received as jest.Mock;
    const pass =
      mock.mock.calls.length === 1 &&
      JSON.stringify(mock.mock.calls[0]) === JSON.stringify(expectedArgs);
    return {
      pass,
      message: () =>
        pass
          ? `expected not to have been called once with ${JSON.stringify(expectedArgs)}`
          : `expected to have been called once with ${JSON.stringify(expectedArgs)}, but was called ${mock.mock.calls.length} time(s)${mock.mock.calls.length > 0 ? ` with ${JSON.stringify(mock.mock.calls)}` : ''}`,
    };
  },
  toThrowError(received: any, expected?: string | RegExp | typeof Error) {
    let threw = false;
    let thrownError: any;
    try {
      received();
    } catch (e) {
      threw = true;
      thrownError = e;
    }
    let pass = threw;
    if (pass && expected) {
      if (typeof expected === 'string') {
        pass = thrownError?.message?.includes(expected) || String(thrownError).includes(expected);
      } else if (expected instanceof RegExp) {
        pass = expected.test(thrownError?.message || String(thrownError));
      } else {
        pass = thrownError instanceof expected;
      }
    }
    return {
      pass,
      message: () =>
        pass
          ? `expected function not to throw${expected ? ` ${expected}` : ''}`
          : `expected function to throw${expected ? ` ${expected}` : ''}, but ${threw ? `threw ${thrownError}` : 'it did not throw'}`,
    };
  },
});

const originalExpect = globalThis.expect as any;
const patchedExpect: any = function (received: any) {
  const result = originalExpect(received);
  if (!result.withContext) {
    result.withContext = function (_ctx: string) {
      return result;
    };
  }
  return result;
};
Object.assign(patchedExpect, originalExpect);
for (const key of Object.keys(originalExpect)) {
  if (!(key in patchedExpect)) {
    patchedExpect[key] = (originalExpect as any)[key];
  }
}
patchedExpect.extend = originalExpect.extend;
patchedExpect.any = originalExpect.any;
patchedExpect.anything = originalExpect.anything;
patchedExpect.arrayContaining = originalExpect.arrayContaining;
patchedExpect.objectContaining = originalExpect.objectContaining;
patchedExpect.stringContaining = originalExpect.stringContaining;
patchedExpect.stringMatching = originalExpect.stringMatching;
patchedExpect.not = originalExpect.not;
patchedExpect.assertions = originalExpect.assertions?.bind(originalExpect);
patchedExpect.hasAssertions = originalExpect.hasAssertions?.bind(originalExpect);
patchedExpect.getState = originalExpect.getState?.bind(originalExpect);
patchedExpect.setState = originalExpect.setState?.bind(originalExpect);
globalThis.expect = patchedExpect;

function enhanceMock(mockFn: jest.Mock): any {
  const spy = mockFn as any;

  if (spy._jasmineCompat) return spy;
  spy._jasmineCompat = true;

  spy.withArgs = function (...expectedArgs: any[]) {
    if (!spy._argMappings) {
      spy._argMappings = [];
      const originalImpl = spy.getMockImplementation?.();
      spy.mockImplementation((...callArgs: any[]) => {
        for (const mapping of spy._argMappings) {
          if (JSON.stringify(mapping.args) === JSON.stringify(callArgs)) {
            return mapping.returnFn(...callArgs);
          }
        }
        return originalImpl?.(...callArgs);
      });
    }
    const mapping: any = { args: expectedArgs, returnFn: () => undefined };
    spy._argMappings.push(mapping);
    return {
      and: {
        returnValue(val: any) {
          mapping.returnFn = () => val;
          return spy;
        },
        callFake(fn: Function) {
          mapping.returnFn = fn;
          return spy;
        },
      },
    };
  };

  spy.and = {
    returnValue(val: any) {
      spy.mockReturnValue(val);
      return spy;
    },
    callThrough() {
      const orig = spy._originalImpl;
      if (orig) {
        spy.mockImplementation(function (this: any, ...args: any[]) {
          return orig.apply(this, args);
        });
      } else {
        spy.mockRestore?.();
      }
      return spy;
    },
    callFake(fn: (...args: any[]) => any) {
      spy.mockImplementation(fn);
      return spy;
    },
    throwError(msg: string | Error) {
      spy.mockImplementation(() => {
        throw typeof msg === 'string' ? new Error(msg) : msg;
      });
      return spy;
    },
    stub() {
      spy.mockImplementation(() => undefined);
      return spy;
    },
    returnValues(...values: any[]) {
      let callIndex = 0;
      spy.mockImplementation(() => {
        const val = values[callIndex];
        if (callIndex < values.length - 1) callIndex++;
        return val;
      });
      return spy;
    },
    resolveTo(val?: any) {
      spy.mockResolvedValue(val);
      return spy;
    },
    rejectWith(val?: any) {
      spy.mockRejectedValue(val);
      return spy;
    },
  };

  spy.calls = {
    count() {
      return spy.mock.calls.length;
    },
    mostRecent() {
      const calls = spy.mock.calls;
      const results = spy.mock.results;
      const idx = calls.length - 1;
      return {
        args: calls[idx] || [],
        returnValue: results[idx]?.value,
      };
    },
    reset() {
      spy.mockClear();
    },
    argsFor(index: number) {
      return spy.mock.calls[index] || [];
    },
    first() {
      return {
        args: spy.mock.calls[0] || [],
        returnValue: spy.mock.results[0]?.value,
      };
    },
    all() {
      return spy.mock.calls.map((args: any[], i: number) => ({
        args,
        returnValue: spy.mock.results[i]?.value,
      }));
    },
    allArgs() {
      return spy.mock.calls;
    },
  };

  return spy;
}

const jasmineCompat: any = {
  createSpyObj<T = any>(
    baseName: string,
    methods: string[] | Record<string, any>,
    properties?: Record<string, any> | string[],
  ): T {
    const obj: any = {};

    const methodList = Array.isArray(methods) ? methods : Object.keys(methods);
    for (const method of methodList) {
      const mock = enhanceMock(jest.fn());
      if (!Array.isArray(methods) && methods[method] !== undefined) {
        mock.mockReturnValue(methods[method]);
      }
      obj[method] = mock;
    }

    if (properties && !Array.isArray(properties)) {
      for (const [key, value] of Object.entries(properties)) {
        obj[key] = value;
      }
    } else if (Array.isArray(properties)) {
      for (const prop of properties) {
        obj[prop] = undefined;
      }
    }

    return obj as T;
  },

  createSpy(name?: string): any {
    return enhanceMock(jest.fn());
  },

  objectContaining(sample: any) {
    return expect.objectContaining(sample);
  },

  arrayContaining(sample: any[]) {
    return expect.arrayContaining(sample);
  },

  any(classType: any) {
    return expect.any(classType);
  },

  anything() {
    return expect.anything();
  },

  stringMatching(pattern: string | RegExp) {
    return expect.stringMatching(pattern);
  },

  stringContaining(expected: string) {
    return expect.stringContaining(expected);
  },

  isSpy(value: any): boolean {
    return typeof value === 'function' && value._isMockFunction === true;
  },

  clock() {
    return {
      install() {
        jest.useFakeTimers();
      },
      uninstall() {
        jest.useRealTimers();
      },
      tick(ms: number) {
        jest.advanceTimersByTime(ms);
      },
      mockDate(date: Date) {
        jest.setSystemTime(date);
      },
    };
  },
};

(globalThis as any).jasmine = {
  ...(globalThis as any).jasmine,
  ...jasmineCompat,
};

if (typeof (globalThis as any).fail === 'undefined') {
  (globalThis as any).fail = function fail(message?: string) {
    throw new Error(message || 'Test failed via fail()');
  };
}

(globalThis as any).spyOn = function spyOnCompat(
  object: any,
  method: string,
): any {
  const originalFn = object[method];

  const spy: any = jest.spyOn(object, method as any);

  if (typeof originalFn === 'function') {
    spy._originalImpl = originalFn;
  }

  return enhanceMock(spy);
};
