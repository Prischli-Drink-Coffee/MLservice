import React from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Link,
  Text,
  useColorMode,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon, HamburgerIcon } from "@chakra-ui/icons";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Logo from "../common/assets/Logo";

const navItems = [
  { label: "Главная", to: "/" },
  { label: "Сборка", to: "/graphs" },
  { label: "Библиотека", to: "/nodes" },
  { label: "Бот", to: "/telegram" },
  { label: "О нас", to: "/info" },
];

function Header() {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isAuthenticated, logout } = useAuth();

  const linkColor = useColorModeValue("gray.700", "text.muted");
  const linkActiveColor = useColorModeValue("brand.600", "accent");
  const headerBg = useColorModeValue("white", "surface");
  const headerBorder = useColorModeValue("rgba(0,0,0,0.08)", "borderSubtle");

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
          <Logo boxSize={6} />
          <Text
            fontWeight="bold"
            fontSize="xl"
            color={linkActiveColor}
            display={{ base: "none", sm: "block" }}
          >
            TeleRAG Console
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
            <IconButton
              size="sm"
              aria-label="Toggle color mode"
              onClick={toggleColorMode}
              icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
              variant="ghost"
              color={linkColor}
            />
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
              <MenuItem onClick={toggleColorMode}>
                {colorMode === "light" ? "Dark mode" : "Light mode"}
              </MenuItem>
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
