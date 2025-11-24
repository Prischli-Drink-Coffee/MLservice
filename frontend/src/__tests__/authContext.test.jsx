import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@context/AuthContext";
import { fetchProfile } from "@api";

jest.mock("@api", () => ({
  fetchProfile: jest.fn(),
  logoutLocal: jest.fn(),
}));

jest.mock("@api/client", () => ({
  registerUnauthorizedHandler: jest.fn(),
}));

jest.mock("js-cookie", () => ({
  remove: jest.fn(),
}));

function AuthConsumerProbe() {
  const { isAuthenticated, isSessionLoading, user } = useAuth();
  return (
    <div>
      <span data-testid="loading">{isSessionLoading ? "true" : "false"}</span>
      <span data-testid="auth">{isAuthenticated ? "true" : "false"}</span>
      <span data-testid="user">{user?.email || ""}</span>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  test("восстанавливает сессию при успешном запросе профиля", async () => {
    fetchProfile.mockResolvedValueOnce({ email: "demo@example.com" });

    render(
      <AuthProvider>
        <AuthConsumerProbe />
      </AuthProvider>,
    );

    expect(screen.getByTestId("loading").textContent).toBe("true");

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    expect(screen.getByTestId("auth").textContent).toBe("true");
    expect(screen.getByTestId("user").textContent).toBe("demo@example.com");
  });

  test("сбрасывает состояние при 401", async () => {
    fetchProfile.mockRejectedValueOnce({ response: { status: 401 } });

    render(
      <AuthProvider>
        <AuthConsumerProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    expect(screen.getByTestId("auth").textContent).toBe("false");
    expect(screen.getByTestId("user").textContent).toBe("");
  });
});
