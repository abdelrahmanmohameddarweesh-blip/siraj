if (typeof globalThis.DOMException === 'undefined') {
  class DOMException extends Error {
    constructor(message?: string, name?: string) {
      super(message);
      this.name = name || 'DOMException';
      Object.setPrototypeOf(this, DOMException.prototype);
    }
  }

  (globalThis as any).DOMException = DOMException;
}
