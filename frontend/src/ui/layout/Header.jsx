import {
  Avatar,
  Box,
  Button,
  Container,
  Flex,
  HStack,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from "@chakra-ui/react";
import { HamburgerIcon, TriangleDownIcon } from "@chakra-ui/icons";
import { MotionBox } from "@ui/motionPrimitives";
import { NavLink } from "react-router-dom";
import { useAuth } from "@context/AuthContext";
import Logo from "../assets/common/Logo";
import { PROJECT_NAME } from "@constants";
import { colors, gradients, borderRadius, spacing } from "@theme/tokens";

// MotionBox provided by shared primitives

const navItems = [
  { label: "Главная", to: "/" },
  { label: "Датасеты", to: "/datasets" },
  { label: "Обучение", to: "/training" },
  { label: "Артефакты", to: "/artifacts" },
  { label: "Метрики", to: "/metrics" },
  { label: "О нас", to: "/info" },
  { label: "Профиль", to: "/profile" },
];

const linkBaseStyles = {
  fontWeight: 600,
  fontSize: "sm",
  letterSpacing: "0.02em",
  color: colors.text.secondary,
  transition: "color 0.2s ease",
};

function Header() {
  const { isAuthenticated, logout, user } = useAuth();
  const userLabel = user?.first_name || user?.email || "Профиль";

  const renderNavLink = (item) => (
    <Link
      as={NavLink}
      key={item.to}
      to={item.to}
      position="relative"
      px={2}
      py={1}
      borderRadius={borderRadius.sm}
      _hover={{ color: colors.text.primary }}
      _focusVisible={{ boxShadow: `0 0 0 4px ${colors.brand.primary}33`, outline: "none" }}
      _activeLink={{
        color: colors.brand.primary,
      }}
      {...linkBaseStyles}
    >
      {({ isActive }) => (
        <>
          {item.label}
          {isActive && (
            <MotionBox
              layoutId="header-active-pill"
              position="absolute"
              left="50%"
              bottom="-6px"
              transform="translateX(-50%)"
              w="12px"
              h="12px"
              borderRadius="full"
              bgGradient={gradients.prism}
              boxShadow="0 0 12px rgba(47,116,255,0.6)"
            />
          )}
        </>
      )}
    </Link>
  );

  const renderAuthActions = () => {
    if (!isAuthenticated) {
      return (
        <HStack spacing={3} display={{ base: "none", md: "flex" }}>
          <Button as={NavLink} to="/login" variant="ghost" size="sm">
            Войти
          </Button>
          <Button as={NavLink} to="/register" size="sm" variant="primary">
            Регистрация
          </Button>
        </HStack>
      );
    }

    return (
      <Menu>
        <MenuButton
          as={Button}
          variant="ghost"
          size="sm"
          px={{ base: 1.5, md: 3 }}
          py={2}
          borderRadius={borderRadius.full}
          rightIcon={
            <TriangleDownIcon fontSize="xs" display={{ base: "none", md: "inline-flex" }} />
          }
        >
          <HStack spacing={3}>
            <Avatar
              name={userLabel}
              size="sm"
              bgGradient={gradients.prism}
              color={colors.text.primary}
              border="1px solid rgba(255,255,255,0.2)"
            />
            <Stack spacing={0} align="flex-start" display={{ base: "none", md: "flex" }}>
              <Text fontSize="sm" fontWeight="semibold">
                {user?.first_name || "Пользователь"}
              </Text>
              <Text fontSize="xs" color={colors.text.tertiary}>
                {user?.email || "profile@mlservice"}
              </Text>
            </Stack>
          </HStack>
        </MenuButton>
        <MenuList bg="rgba(5,5,10,0.95)" borderColor="rgba(255,255,255,0.08)">
          <MenuItem as={NavLink} to="/profile">
            Профиль
          </MenuItem>
          <MenuDivider borderColor="rgba(255,255,255,0.08)" />
          <MenuItem onClick={logout} color="red.300">
            Выйти
          </MenuItem>
        </MenuList>
      </Menu>
    );
  };

  return (
    <Box as="header" position="sticky" top={0} zIndex={20} backdropFilter="blur(18px)">
      <Box
        position="absolute"
        inset="0"
        bg="rgba(5,5,5,0.75)"
        borderBottom="1px solid rgba(255,255,255,0.08)"
        backdropFilter="blur(12px)"
      />

      <Box position="relative">
        <Container maxW="6xl" px={{ base: spacing.md, md: spacing.lg, lg: spacing[13] }}>
          <Flex align="center" justify="space-between" minH="72px" gap={4}>
            <HStack spacing={3}>
              <Link
                as={NavLink}
                to="/"
                display="flex"
                alignItems="center"
                gap={3}
                _focusVisible={{
                  boxShadow: `0 0 0 4px ${colors.brand.primary}33`,
                  outline: "none",
                }}
              >
                <MotionBox
                  whileHover={{ rotate: -5, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Logo boxSize={8} variant="solid" />
                </MotionBox>
                <Box>
                  <Text fontWeight="bold" fontSize="lg" color={colors.text.primary}>
                    {PROJECT_NAME}
                  </Text>
                  <Text
                    fontSize="xs"
                    letterSpacing="0.35em"
                    textTransform="uppercase"
                    color={colors.text.tertiary}
                  >
                    ML Console
                  </Text>
                </Box>
              </Link>
            </HStack>

            <Flex align="center" gap={6}>
              <HStack spacing={4} display={{ base: "none", lg: "flex" }}>
                {isAuthenticated ? navItems.map(renderNavLink) : null}
              </HStack>

              {renderAuthActions()}

              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<HamburgerIcon />}
                  variant="ghost"
                  display={{ base: "inline-flex", md: "none" }}
                  aria-label="Главное меню"
                />
                <MenuList bg="rgba(5,5,10,0.95)" borderColor="rgba(255,255,255,0.08)">
                  {(isAuthenticated
                    ? navItems
                    : [
                        { label: "Войти", to: "/login" },
                        { label: "Регистрация", to: "/register" },
                      ]
                  ).map((item) => (
                    <MenuItem key={item.to} as={NavLink} to={item.to} color={colors.text.primary}>
                      {item.label}
                    </MenuItem>
                  ))}
                  {isAuthenticated && (
                    <MenuItem onClick={logout} color="red.300">
                      Выход
                    </MenuItem>
                  )}
                </MenuList>
              </Menu>
            </Flex>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}

export default Header;
