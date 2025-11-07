import React, { useState } from "react";
import { Box, Link, Text, VStack, HStack, Icon } from "@chakra-ui/react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { EmailIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { login } from "../API";
import { useAuth } from "../context/AuthContext";
import { AuthFormCard, AuthInput, PasswordInput } from "../components/auth";
import { Title, Body } from "../components/common/Typography";
import PrimaryButton from "../components/common/PrimaryButton";
import { tokens } from "../theme/tokens";

const MotionBox = motion(Box);

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname || "/graphs";
  const emailInvalid = email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (emailInvalid) return;

    setIsLoading(true);
    try {
      await login({ email, password });
      setAuthenticated(true);
      navigate(from, { replace: true });
    } catch (err) {
      const message = err.response?.data?.detail || err.message;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box py={16}>
      <AuthFormCard as="form" onSubmit={handleSubmit}>
        {/* Header */}
        <VStack spacing={2} mb={2}>
          <Title size="medium" textAlign="center">
            Вход в{" "}
            <Box as="span" color={tokens.colors.brand.primary}>
              TeleRAG
            </Box>
          </Title>
          <Body size="small" color={tokens.colors.text.tertiary} textAlign="center">
            Войдите в систему для управления графами
          </Body>
        </VStack>

        {/* Error message */}
        {error && (
          <MotionBox
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            p={4}
            bg="rgba(239, 68, 68, 0.1)"
            border="1px solid"
            borderColor={tokens.colors.error}
            borderRadius={tokens.borderRadius.md}
          >
            <HStack spacing={2}>
              <Icon viewBox="0 0 24 24" color={tokens.colors.error} w={5} h={5}>
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                />
              </Icon>
              <VStack align="start" spacing={0}>
                <Text
                  fontSize={tokens.typography.footnote.medium}
                  fontWeight="600"
                  color={tokens.colors.error}
                >
                  Ошибка авторизации
                </Text>
                <Text
                  fontSize={tokens.typography.footnote.small}
                  color={tokens.colors.text.secondary}
                >
                  {error}
                </Text>
              </VStack>
            </HStack>
          </MotionBox>
        )}

        {/* Form fields */}
        <VStack spacing={4} w="full">
          <AuthInput
            id="email"
            label="Email адрес"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            icon={EmailIcon}
            isRequired
            isInvalid={emailInvalid}
            errorMessage="Неверный формат e-mail"
            autoComplete="email"
          />

          <PasswordInput
            id="password"
            label="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
            isRequired
            autoComplete="current-password"
          />
        </VStack>

        {/* Submit button */}
        <MotionBox w="full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <PrimaryButton
            type="submit"
            w="full"
            isLoading={isLoading}
            isDisabled={emailInvalid || !email || !password}
          >
            {isLoading ? "Вход..." : "Войти в систему"}
          </PrimaryButton>
        </MotionBox>

        {/* Footer */}
        <VStack spacing={3} pt={2}>
          <Box w="full" h="1px" bg={tokens.colors.border.subtle} />

          <Text
            fontSize={tokens.typography.footnote.small}
            color={tokens.colors.text.tertiary}
            textAlign="center"
          >
            Данные авторизации выдаёт администратор платформы
          </Text>

          <HStack spacing={1} fontSize={tokens.typography.footnote.medium}>
            <Text color={tokens.colors.text.tertiary}>Нет аккаунта?</Text>
            <Link
              as={RouterLink}
              to="/register"
              color={tokens.colors.brand.primary}
              fontWeight="600"
              _hover={{
                color: tokens.colors.brand.secondary,
                textDecoration: "underline",
              }}
            >
              Зарегистрироваться
            </Link>
          </HStack>
        </VStack>
      </AuthFormCard>
    </Box>
  );
}

export default LoginPage;
