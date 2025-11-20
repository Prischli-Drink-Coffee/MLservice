import "@testing-library/jest-dom";

const createMatchMedia = () =>
	jest.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(),
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
