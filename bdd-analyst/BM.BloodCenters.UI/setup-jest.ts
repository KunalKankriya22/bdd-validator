import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

import './src/jasmine-compat';

if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = jest.fn(() => 'blob:http://localhost/mock-blob-url');
}
if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = jest.fn();
}

if (typeof (globalThis as any).DataTransfer === 'undefined') {
  (globalThis as any).DataTransfer = class DataTransfer {
    private _items: any[] = [];
    private _files: File[] = [];
    dropEffect = 'none';
    effectAllowed = 'all';
    get items() {
      const items = this._items as any;
      items.add = (file: File) => { this._items.push(file); this._files.push(file); };
      items.remove = (index: number) => { this._items.splice(index, 1); };
      items.clear = () => { this._items.length = 0; this._files.length = 0; };
      items.length = this._items.length;
      return items;
    }
    get files() { return this._files; }
    get types() { return this._items.map((i: any) => i.type); }
    setData(format: string, data: string) { this._items.push({ type: format, kind: 'string', getAsString: (cb: Function) => cb(data) }); }
    getData(format: string) { const item = this._items.find((i: any) => i.type === format); return item ? item.data : ''; }
    clearData() { this._items = []; }
    setDragImage() {}
  };
}

if (typeof (globalThis as any).ClipboardEvent === 'undefined') {
  (globalThis as any).ClipboardEvent = class ClipboardEvent extends Event {
    clipboardData: DataTransfer | null;
    constructor(type: string, eventInitDict?: ClipboardEventInit) {
      super(type, eventInitDict);
      this.clipboardData = eventInitDict?.clipboardData ?? null;
    }
  };
}

if (typeof (globalThis as any).DragEvent === 'undefined') {
  (globalThis as any).DragEvent = class DragEvent extends Event {
    dataTransfer: DataTransfer | null;
    constructor(type: string, eventInitDict?: any) {
      super(type, eventInitDict);
      this.dataTransfer = eventInitDict?.dataTransfer ?? null;
    }
  };
}

if (typeof (globalThis as any).IntersectionObserver === 'undefined') {
  (globalThis as any).IntersectionObserver = class IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = '0px';
    readonly thresholds: ReadonlyArray<number> = [0];
    constructor(private callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] { return []; }
  };
}

if (typeof (globalThis as any).ResizeObserver === 'undefined') {
  (globalThis as any).ResizeObserver = class ResizeObserver {
    constructor(private callback: any) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof (globalThis as any).spyOnProperty === 'undefined') {
  (globalThis as any).spyOnProperty = function spyOnProperty(obj: any, prop: string, accessType: 'get' | 'set' = 'get') {
    const descriptor = Object.getOwnPropertyDescriptor(obj, prop)
      || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(obj), prop);
    if (!descriptor) {
      Object.defineProperty(obj, prop, {
        get: jest.fn(),
        set: jest.fn(),
        configurable: true,
      });
      const newDesc = Object.getOwnPropertyDescriptor(obj, prop)!;
      const spy = accessType === 'get' ? newDesc.get as jest.Mock : newDesc.set as jest.Mock;
      (spy as any).and = {
        returnValue(val: any) { (spy as jest.Mock).mockReturnValue(val); return spy; },
        callFake(fn: Function) { (spy as jest.Mock).mockImplementation(fn as any); return spy; },
        callThrough() { return spy; },
      };
      return spy;
    }
    const spy = jest.spyOn(obj, prop, accessType);
    (spy as any).and = {
      returnValue(val: any) { spy.mockReturnValue(val); return spy; },
      callFake(fn: Function) { spy.mockImplementation(fn as any); return spy; },
      callThrough() { spy.mockRestore(); return spy; },
    };
    return spy;
  };
}
