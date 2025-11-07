import React from "react";
import {
  Box,
  HStack,
  VStack,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Badge,
  Text,
} from "@chakra-ui/react";
import { SearchIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { tokens } from "../../theme/tokens";

const MotionBox = motion(Box);

/**
 * NodeSearchBar - компонент поиска с фильтрами и сортировкой
 */
const NodeSearchBar = ({
  searchValue,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  sortBy,
  onSortChange,
  resultsCount,
}) => {
  const sortOptions = [
    { value: "name", label: "По имени" },
    { value: "category", label: "По категории" },
    { value: "inputs", label: "По кол-ву входов" },
    { value: "outputs", label: "По кол-ву выходов" },
  ];

  return (
    <MotionBox
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <VStack align="stretch" spacing={3}>
        {/* Search input */}
        <InputGroup size="lg">
          <InputLeftElement pointerEvents="none" h="full">
            <SearchIcon color={tokens.colors.text.tertiary} w={5} h={5} />
          </InputLeftElement>
          <Input
            placeholder="Поиск по названию, типу или описанию..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            bg={tokens.colors.blur.dark}
            border="1px solid"
            borderColor={tokens.colors.border.subtle}
            borderRadius={tokens.borderRadius.md}
            color={tokens.colors.text.primary}
            fontSize={tokens.typography.body.medium}
            pl="44px"
            h="56px"
            _placeholder={{ color: tokens.colors.text.tertiary }}
            _hover={{
              borderColor: tokens.colors.border.medium,
            }}
            _focus={{
              borderColor: tokens.colors.brand.primary,
              boxShadow: `0 0 0 1px ${tokens.colors.brand.primary}, ${tokens.shadows.glowSubtle}`,
              outline: "none",
            }}
            transition="all 0.2s"
          />
        </InputGroup>

        {/* Filters and results */}
        <HStack justify="space-between" flexWrap="wrap">
          <HStack spacing={3} flexWrap="wrap">
            {/* Category filter */}
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                size="md"
                bg={tokens.colors.blur.dark}
                color={
                  selectedCategory ? tokens.colors.brand.primary : tokens.colors.text.secondary
                }
                border="1px solid"
                borderColor={
                  selectedCategory ? tokens.colors.brand.primary : tokens.colors.border.subtle
                }
                borderRadius={tokens.borderRadius.md}
                fontSize={tokens.typography.footnote.medium}
                _hover={{
                  bg: tokens.colors.blur.mid,
                  borderColor: tokens.colors.brand.primary,
                }}
                _active={{
                  bg: tokens.colors.blur.accent,
                }}
              >
                {selectedCategory || "Все категории"}
              </MenuButton>
              <MenuList
                bg={tokens.colors.blur.dark}
                backdropFilter="blur(20px)"
                border="1px solid"
                borderColor={tokens.colors.border.subtle}
                borderRadius={tokens.borderRadius.md}
              >
                <MenuItem
                  bg="transparent"
                  color={tokens.colors.text.primary}
                  _hover={{ bg: tokens.colors.blur.mid }}
                  onClick={() => onCategoryChange(null)}
                >
                  Все категории
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem
                    key={category}
                    bg="transparent"
                    color={tokens.colors.text.primary}
                    _hover={{ bg: tokens.colors.blur.mid }}
                    onClick={() => onCategoryChange(category)}
                  >
                    {category}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>

            {/* Sort */}
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                size="md"
                bg={tokens.colors.blur.dark}
                color={tokens.colors.text.secondary}
                border="1px solid"
                borderColor={tokens.colors.border.subtle}
                borderRadius={tokens.borderRadius.md}
                fontSize={tokens.typography.footnote.medium}
                _hover={{
                  bg: tokens.colors.blur.mid,
                  borderColor: tokens.colors.brand.primary,
                }}
                _active={{
                  bg: tokens.colors.blur.accent,
                }}
              >
                {sortOptions.find((opt) => opt.value === sortBy)?.label || "Сортировка"}
              </MenuButton>
              <MenuList
                bg={tokens.colors.blur.dark}
                backdropFilter="blur(20px)"
                border="1px solid"
                borderColor={tokens.colors.border.subtle}
                borderRadius={tokens.borderRadius.md}
              >
                {sortOptions.map((option) => (
                  <MenuItem
                    key={option.value}
                    bg="transparent"
                    color={tokens.colors.text.primary}
                    _hover={{ bg: tokens.colors.blur.mid }}
                    onClick={() => onSortChange(option.value)}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>

            {/* Clear filters button */}
            {(searchValue || selectedCategory) && (
              <MotionBox
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button
                  size="md"
                  variant="ghost"
                  color={tokens.colors.text.tertiary}
                  fontSize={tokens.typography.footnote.medium}
                  _hover={{
                    color: tokens.colors.brand.primary,
                    bg: tokens.colors.blur.light,
                  }}
                  onClick={() => {
                    onSearchChange("");
                    onCategoryChange(null);
                  }}
                >
                  Сбросить
                </Button>
              </MotionBox>
            )}
          </HStack>

          {/* Results count */}
          <HStack spacing={2}>
            <Text fontSize={tokens.typography.footnote.medium} color={tokens.colors.text.tertiary}>
              Найдено:
            </Text>
            <Badge
              colorScheme="purple"
              fontSize={tokens.typography.footnote.medium}
              px={2}
              py={1}
              borderRadius={tokens.borderRadius.sm}
            >
              {resultsCount}
            </Badge>
          </HStack>
        </HStack>
      </VStack>
    </MotionBox>
  );
};

export default NodeSearchBar;
