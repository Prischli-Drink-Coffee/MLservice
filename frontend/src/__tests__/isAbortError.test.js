import isAbortError from "@utils/isAbortError";

describe("isAbortError", () => {
  it("detects DOM AbortError", () => {
    expect(isAbortError({ name: "AbortError" })).toBe(true);
  });

  it("detects axios canceled error", () => {
    expect(isAbortError({ name: "CanceledError" })).toBe(true);
    expect(isAbortError({ code: "ERR_CANCELED" })).toBe(true);
    expect(isAbortError({ __CANCEL__: true })).toBe(true);
  });

  it("returns false for other errors", () => {
    expect(isAbortError({ name: "NetworkError" })).toBe(false);
    expect(isAbortError(null)).toBe(false);
  });
});
