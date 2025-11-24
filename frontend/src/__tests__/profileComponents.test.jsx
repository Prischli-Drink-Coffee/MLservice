import { render, screen, fireEvent } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import ProfileOverviewCard from "@features/profile/components/ProfileOverviewCard";
import QuotaUsageCard from "@features/profile/components/QuotaUsageCard";

const renderWithChakra = (ui) => render(<ChakraProvider>{ui}</ChakraProvider>);

const mockProfile = {
  id: "11111111-2222-3333-4444-555555555555",
  email: "user@example.com",
  first_name: "Ирина",
  company: "MLservice",
  timezone: "Europe/Moscow",
  phone: "+71234567890",
  avatar_url: null,
  created_at: new Date().toISOString(),
};

const mockQuota = {
  limit: 10,
  used: 9,
  available: 1,
  resets_at: null,
};

describe("profile components", () => {
  test("ProfileOverviewCard renders basic fields", () => {
    const handleEdit = jest.fn();
    renderWithChakra(<ProfileOverviewCard profile={mockProfile} onEdit={handleEdit} />);

    expect(screen.getByText(/Ирина/)).toBeInTheDocument();
    expect(screen.getByText(/user@example.com/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /редактировать/i }));
    expect(handleEdit).toHaveBeenCalled();
  });

  test("QuotaUsageCard shows warning when quota low", () => {
    const handlePurchase = jest.fn();
    renderWithChakra(
      <QuotaUsageCard quota={mockQuota} onPurchaseClick={handlePurchase} isPaymentsEnabled />,
    );

    expect(screen.getByText(/Квоты и использование/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Купить ещё/i }));
    expect(handlePurchase).toHaveBeenCalled();
    expect(screen.getByText(/Лимит почти исчерпан/)).toBeInTheDocument();
  });
});
