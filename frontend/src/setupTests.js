// Jest / jsdom setup: polyfills for window.matchMedia used by Chakra UI and framer-motion
// Provide a safe stub so tests that use responsive hooks or prefers-reduced-motion don't throw.
/* eslint-disable no-undef */
import "@testing-library/jest-dom";

// Always override matchMedia with a jest mock implementation so tests are deterministic.
const createMatchMedia = () =>
  jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // for older browsers / libs
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(() => false),
  }));

const mockMatchMedia = createMatchMedia();

Object.defineProperty(globalThis, "matchMedia", {
  writable: true,
  configurable: true,
  value: mockMatchMedia,
});

if (typeof window !== "undefined") {
  window.matchMedia = mockMatchMedia;
}

if (typeof document !== "undefined" && document.defaultView) {
  document.defaultView.matchMedia = mockMatchMedia;
}

// Provide a minimal global for ResizeObserver if some components rely on it in tests
if (typeof window !== "undefined" && typeof window.ResizeObserver === "undefined") {
  class ResizeObserver {
    constructor(cb) { this._cb = cb; }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;
}

// Mock axios globally to avoid Jest transform issues with ESM modules in node_modules
jest.mock("axios", () => {
  const mAxios = {
    create: () => mAxios,
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
    interceptors: {
      response: { use: jest.fn() },
      request: { use: jest.fn() },
    },
  };
  return mAxios;
});

// Defensive mocks for Chakra UI / framer-motion hooks that rely on matchMedia
// This prevents occasional timing issues where the library reads matchMedia
// before our global mock is effective.
try {
  jest.mock("@chakra-ui/media-query", () => ({
    useMediaQuery: jest.fn(() => [false]),
  }));
} catch (e) {
  // noop — if jest.mock can't be called here, ignore
}

try {
  // Provide a lightweight mock for framer-motion to avoid its runtime init
  // which calls window.matchMedia and can fail in jsdom. We only need a
  // minimal subset for tests: `motion` primitives and `useReducedMotion`.
  jest.mock("framer-motion", () => {
    const React = require("react");
    const mockMotionFactory = (tag) => {
      return React.forwardRef(({ children, ...props }, ref) => React.createElement(tag, { ref, ...props }, children));
    };

    // motion should be callable (motion(Component)) and also support
    // property access (motion.div). We implement a callable function and
    // wrap it with a Proxy to handle property access.
    const motionCallable = (Comp) => {
      if (typeof Comp === "string") return mockMotionFactory(Comp);
      return React.forwardRef(({ children, ...props }, ref) => React.createElement(Comp, { ref, ...props }, children));
    };

    const motionProxy = new Proxy(motionCallable, {
      get: (_, tag) => mockMotionFactory(tag),
    });

    return {
      motion: motionProxy,
      AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
      useReducedMotion: () => false,
    };
  });
} catch (e) {
  // noop
}

// Ensure Chakra's prefers-reduced-motion hook is stable for tests while keeping
// the real Chakra exports available. We also make ChakraProvider a passthrough
// to avoid injecting environment DOM nodes into test containers
// (such as #__chakra_env) which can break assertions that expect an
// empty container.
try {
  jest.mock("@chakra-ui/react", () => {
    const actual = jest.requireActual("@chakra-ui/react");
    const React = require("react");
    return {
      ...actual,
      ChakraProvider: ({ children }) => React.createElement(React.Fragment, null, children),
      usePrefersReducedMotion: () => false,
    };
  });
} catch (e) {
  // noop
}
