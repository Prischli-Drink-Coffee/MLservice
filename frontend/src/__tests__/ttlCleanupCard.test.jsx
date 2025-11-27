import { render, screen } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import TTLCleanupCard from "@ui/organisms/TTLCleanupCard";

const renderWithChakra = (ui) => render(<ChakraProvider>{ui}</ChakraProvider>);

describe("TTLCleanupCard", () => {
  it("does not render without permission", () => {
    renderWithChakra(<TTLCleanupCard canCleanup={false} />);
    // Chakra may mount a hidden helper node (#__chakra_env) into document.body.
    // Assert there is no visible content for the card instead of requiring the
    // render container to be fully empty.
    expect(screen.queryByText(/TTL очистка датасетов/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Очистить просроченные/i })).not.toBeInTheDocument();
  });

  it("shows controls for admins", () => {
    renderWithChakra(<TTLCleanupCard canCleanup />);
    expect(screen.getByText(/TTL очистка датасетов/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Очистить просроченные/i })).toBeInTheDocument();
  });
});
