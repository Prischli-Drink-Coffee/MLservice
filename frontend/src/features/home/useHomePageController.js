import { useMemo } from "react";
import { colors } from "@theme/tokens";
import useHealth from "../../hooks/useHealth";
import { useAuth } from "@context/AuthContext";

const HERO_GAP = { base: 6, md: 8, lg: 12 };
const SECTION_PADDING = { base: 4, md: 6, lg: 8 };

export default function useHomePageController() {
  const { isAuthenticated } = useAuth();
  const health = useHealth(12000, { enabled: isAuthenticated });

  const layout = useMemo(
    () => ({
      hero: {
        gridProps: {
          columns: { base: 1, lg: 2 },
          spacing: HERO_GAP,
          alignItems: "start",
        },
      },
      sections: {
        hero: {
          pt: { base: 10, md: 16 },
          pb: { base: 12, md: 18 },
          px: SECTION_PADDING,
        },
        metrics: {
          py: { base: 12, md: 14 },
          px: SECTION_PADDING,
        },
        benefits: {
          py: { base: 12, md: 16 },
          px: SECTION_PADDING,
          bg: `linear-gradient(180deg, ${colors.background.darkPrimary} 0%, ${colors.blur.light} 50%, ${colors.background.darkPrimary} 100%)`,
        },
        slider: {
          py: { base: 14, md: 18 },
          px: SECTION_PADDING,
          bg: colors.background.darkPrimary,
          overflow: "hidden",
        },
      },
      containers: {
        hero: { maxW: "1400px", px: 0 },
        metrics: { maxW: "1100px", px: 0 },
        divider: { maxW: "1400px", px: SECTION_PADDING },
      },
    }),
    [],
  );

  return {
    isAuthenticated,
    health,
    layout,
  };
}
