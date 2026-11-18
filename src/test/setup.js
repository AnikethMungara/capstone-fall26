import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Node 26 ships its own `localStorage` global that shadows jsdom's (it is
// undefined without --localstorage-file). Install a minimal in-memory Storage.
class MemoryStorage {
  #d = new Map();
  get length() { return this.#d.size; }
  key(i) { return [...this.#d.keys()][i] ?? null; }
  getItem(k) { return this.#d.has(String(k)) ? this.#d.get(String(k)) : null; }
  setItem(k, v) { this.#d.set(String(k), String(v)); }
  removeItem(k) { this.#d.delete(String(k)); }
  clear() { this.#d.clear(); }
}
const storage = new MemoryStorage();
for (const target of [globalThis, window]) {
  Object.defineProperty(target, "localStorage", { value: storage, configurable: true, writable: true });
}

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());
