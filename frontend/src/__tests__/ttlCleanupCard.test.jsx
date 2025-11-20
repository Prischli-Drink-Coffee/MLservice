import { render, screen } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import TTLCleanupCard from "../components/common/TTLCleanupCard";

const renderWithChakra = (ui) => render(<ChakraProvider>{ui}</ChakraProvider>);

describe("TTLCleanupCard", () => {
  it("does not render without permission", () => {
    const { container } = renderWithChakra(<TTLCleanupCard canCleanup={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows controls for admins", () => {
    renderWithChakra(<TTLCleanupCard canCleanup />);
    expect(screen.getByText(/TTL очистка датасетов/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Очистить просроченные/i })).toBeInTheDocument();
  });
});
