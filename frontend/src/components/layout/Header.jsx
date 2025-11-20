import { Box, Button, Flex, HStack, IconButton, Link, Text, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Logo from "../common/assets/Logo";


const nameProject = "MLservice";


const navItems = [
  { label: "Главная", to: "/" },
  { label: "Датасеты", to: "/datasets" },
  { label: "Обучение", to: "/training" },
  { label: "Артефакты", to: "/artifacts" },
  { label: "Метрики", to: "/metrics" },
  { label: "О нас", to: "/info" },
  { label: "Профиль", to: "/profile" },
];

function Header() {
  const { isAuthenticated, logout } = useAuth();
  const linkColor = "text.secondary";
  const linkActiveColor = "brand.400";
  const headerBg = "background.darkPrimary75";
  const headerBorder = "border.subtle";

  return (
    <Box
      as="header"
      borderBottomWidth="1px"
      borderColor={headerBorder}
      bg={headerBg}
      px={6}
      py={3}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex align="center" justify="space-between">
        <HStack spacing={3} as={NavLink} to="/" _hover={{ textDecoration: "none" }}>
          <Logo boxSize={6} variant="transparent" />
          <Text
            fontWeight="bold"
            fontSize="xl"
            color={linkActiveColor}
            display={{ base: "none", sm: "block" }}
          >
            {nameProject} Console
          </Text>
        </HStack>

        <>
          {/* Desktop nav */}
          <HStack spacing={6} align="center" display={{ base: "none", md: "flex" }}>
            {isAuthenticated ? (
              navItems.map((item) => (
                <Link
                  as={NavLink}
                  key={item.to}
                  to={item.to}
                  fontWeight="semibold"
                  fontSize="sm"
                  color={linkColor}
                  _activeLink={{ color: linkActiveColor }}
                  _hover={{ color: linkActiveColor }}
                >
                  {item.label}
                </Link>
              ))
            ) : (
              <>
                <Link
                  as={NavLink}
                  to="/login"
                  fontWeight="semibold"
                  fontSize="sm"
                  color={linkColor}
                  _activeLink={{ color: linkActiveColor }}
                  _hover={{ color: linkActiveColor }}
                >
                  Войти
                </Link>
                <Button as={NavLink} to="/register" size="sm" colorScheme="brand" variant="outline">
                  Регистрация
                </Button>
              </>
            )}
            {isAuthenticated && (
              <Button size="sm" colorScheme="red" variant="solid" onClick={logout}>
                Выход
              </Button>
            )}
          </HStack>
          {/* Mobile menu */}
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Menu"
              icon={<HamburgerIcon />}
              variant="ghost"
              display={{ base: "inline-flex", md: "none" }}
            />
            <MenuList>
              {isAuthenticated ? (
                navItems.map((item) => (
                  <MenuItem as={NavLink} to={item.to} key={item.to}>
                    {item.label}
                  </MenuItem>
                ))
              ) : (
                <>
                  <MenuItem as={NavLink} to="/login">
                    Войти
                  </MenuItem>
                  <MenuItem as={NavLink} to="/register">
                    Регистрация
                  </MenuItem>
                </>
              )}
              {isAuthenticated && (
                <MenuItem onClick={logout} color="red.500">
                  Выход
                </MenuItem>
              )}
            </MenuList>
          </Menu>
        </>
      </Flex>
    </Box>
  );
}

export default Header;
