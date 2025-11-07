import { extendTheme } from "@chakra-ui/react";
import { colors, typography, borderRadius, shadows } from "./theme/tokens";

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  fonts: {
    body: typography.fontFamily.primary,
    heading: typography.fontFamily.primary,
  },
  radii: {
    card: borderRadius.md,
    xl: borderRadius.xl,
  },
  shadows: {
    elevated: shadows.elevated,
    subtle: shadows.subtle,
    glow: shadows.glow,
    glowSubtle: shadows.glowSubtle,
  },
  styles: {
    global: () => ({
      body: {
        bg: colors.background.darkPrimary,
        color: colors.text.primary,
      },
    }),
  },
  //варианты для различных компонентов
  components: {
    Tooltip: {
      baseStyle: {
        background: "rgba(0, 0, 0, 0.5);",
        padding: "5px",
        fontSize: "14px !important",
      },
    },
    Button: {
      variants: {
        menu_yellow: {
          border: "2px solid",
          borderColor: "main_yellow",
          borderRadius: "0",
          background: "transparent",
          // width: '100%',
          _hover: {
            backgroundColor: "main_yellow",
          },
        },
        menu_red: {
          border: "2px solid",
          borderColor: "main_red",
          borderRadius: "0",
          background: "transparent",
          _hover: {
            backgroundColor: "main_red",
          },
        },
        subtle: (props) => ({
          bg: props.colorMode === "light" ? "gray.100" : "gray.700",
          _hover: { bg: props.colorMode === "light" ? "gray.200" : "gray.600" },
        }),
      },
    },
    Link: {
      variants: {
        light_gray: {
          fontColor: "light_dark",
          fontSize: ["12px", "13px", "14px"],
        },
      },
    },
    NavLink: {
      variants: {
        light_gray: {
          fontColor: "light_dark",
          fontSize: ["12px", "13px", "14px"],
        },
      },
    },
    Text: {
      variants: {
        light_gray: {
          fontColor: "light_dark",
          fontSize: ["12px", "13px", "14px"],
        },
      },
    },
    HStack: {
      variants: {
        menu_yellow_hover: {
          height: "100%",
          _hover: {
            borderBottom: "2px solid #FFBF00",
          },
        },
      },
    },
  },
  colors: {
    // Legacy colors (kept for backward compatibility)
    menu_gray: "#CCC3C2",
    main_dark: "#333",
    light_dark: "#666",
    main_yellow: "#FFBF00",
    main_red: "#FF0F00",
    menu_white: "#F8F8F8",
    date_gray: "#A9A9A9",

    // Design system brand colors
    brand: {
      50: "#eef6ff",
      100: "#d9eaff",
      200: "#b6d4ff",
      300: "#8fbcff",
      400: "#5f99ff",
      500: colors.brand.primary,
      600: "#1f5de6",
      700: "#184ab8",
      800: "#153e96",
      900: "#122f70",
    },
  },
  semanticTokens: {
    colors: {
      // Updated with design system tokens
      canvas: { default: "#f7f7f7", _dark: colors.background.darkPrimary },
      surface: { default: "white", _dark: colors.blur.dark },
      surfaceElevated: { default: "white", _dark: colors.blur.mid },
      borderSubtle: { default: "rgba(0,0,0,0.08)", _dark: colors.border.default },
      text: {
        primary: { default: "gray.800", _dark: colors.text.primary },
        muted: { default: "gray.600", _dark: colors.text.secondary },
        tertiary: { default: "gray.500", _dark: colors.text.tertiary },
      },
      accent: { default: "blue.600", _dark: colors.brand.primary },
    },
  },
});

export default theme;
