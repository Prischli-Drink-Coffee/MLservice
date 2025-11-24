import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import ProtectedLayout from "@ui/layout/ProtectedLayout";
import { useAuth } from "@context/AuthContext";

jest.mock("@context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const renderWithRouter = () =>
  render(
    <ChakraProvider>
      <MemoryRouter initialEntries={["/datasets"]}>
        <Routes>
          <Route element={<ProtectedLayout />}>
            <Route path="/datasets" element={<div>datasets-page</div>} />
          </Route>
          <Route path="/login" element={<div>login-page</div>} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

describe("ProtectedLayout", () => {
  beforeEach(() => {
    useAuth.mockReset();
  });

  test("показывает индикатор загрузки, пока восстанавливается сессия", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isSessionLoading: true,
      logout: jest.fn(),
    });

    renderWithRouter();

    expect(screen.getByText(/Проверяем вашу сессию/i)).toBeInTheDocument();
  });

  test("редиректит на /login, если пользователь не авторизован", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isSessionLoading: false,
      logout: jest.fn(),
    });

    renderWithRouter();

    expect(screen.getByText(/login-page/i)).toBeInTheDocument();
  });

  test("рендерит дочерние маршруты для авторизованных пользователей", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isSessionLoading: false,
      logout: jest.fn(),
    });

    renderWithRouter();

    expect(screen.getByText(/datasets-page/i)).toBeInTheDocument();
  });
});
