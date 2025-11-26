import React, { useState } from "react";
import {
  Box,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Icon,
  IconButton,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon, LockIcon } from "@chakra-ui/icons";
import { MotionBox } from "@ui/motionPrimitives";
import { tokens } from "@theme/tokens";

/**
 * PasswordInput - поле ввода пароля с переключателем видимости
 * С иконкой замка, glow эффектом, анимациями
 */
const PasswordInput = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  isRequired = false,
  isInvalid = false,
  errorMessage,
  helperText,
  autoComplete,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <FormControl id={id} isRequired={isRequired} isInvalid={isInvalid}>
      <FormLabel
        fontSize={tokens.typography.footnote.medium}
        color={tokens.colors.text.secondary}
        mb={2}
      >
        {label}
      </FormLabel>

      <MotionBox
        position="relative"
        animate={{ scale: isFocused ? 1.01 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Lock icon */}
        <Box
          position="absolute"
          left="14px"
          top="50%"
          transform="translateY(-50%)"
          zIndex={2}
          pointerEvents="none"
        >
          <Icon
            as={LockIcon}
            color={isFocused ? tokens.colors.brand.primary : tokens.colors.text.tertiary}
            w={5}
            h={5}
            transition="color 0.2s"
          />
        </Box>

        {/* Toggle visibility button */}
        <Box position="absolute" right="8px" top="50%" transform="translateY(-50%)" zIndex={2}>
          <IconButton
            size="sm"
            variant="ghost"
            icon={<Icon as={showPassword ? ViewOffIcon : ViewIcon} w={5} h={5} />}
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            color={tokens.colors.text.tertiary}
            _hover={{
              bg: "transparent",
              color: tokens.colors.brand.primary,
            }}
            _active={{
              bg: "transparent",
              color: tokens.colors.brand.secondary,
            }}
          />
        </Box>

        <Input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          pl="44px"
          pr="44px"
          h="50px"
          fontSize={tokens.typography.body.small}
          bg={tokens.colors.blur.dark}
          border="1px solid"
          borderColor={
            isInvalid
              ? tokens.colors.error
              : isFocused
                ? tokens.colors.brand.primary
                : tokens.colors.border.light
          }
          borderRadius={tokens.borderRadius.md}
          color={tokens.colors.text.primary}
          _placeholder={{ color: tokens.colors.text.tertiary }}
          _hover={{
            borderColor: isInvalid ? tokens.colors.error : tokens.colors.border.medium,
          }}
          _focus={{
            borderColor: isInvalid ? tokens.colors.error : tokens.colors.brand.primary,
            boxShadow: isInvalid
              ? `0 0 0 1px ${tokens.colors.error}, 0 0 20px rgba(239, 68, 68, 0.2)`
              : `0 0 0 1px ${tokens.colors.brand.primary}, ${tokens.shadows.glow}`,
            outline: "none",
          }}
          transition="all 0.2s"
          {...rest}
        />
      </MotionBox>

      {isInvalid && errorMessage && (
        <FormErrorMessage fontSize={tokens.typography.footnote.small} mt={1}>
          {errorMessage}
        </FormErrorMessage>
      )}

      {!isInvalid && helperText && (
        <Box fontSize={tokens.typography.footnote.small} color={tokens.colors.text.tertiary} mt={1}>
          {helperText}
        </Box>
      )}
    </FormControl>
  );
};

export default PasswordInput;
