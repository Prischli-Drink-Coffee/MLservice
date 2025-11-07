import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  Input,
  Textarea,
  Switch,
  Stack,
  HStack,
  VStack,
  Icon,
  IconButton,
  InputGroup,
  InputRightElement,
  Tooltip,
  Text,
  useToast,
  Code,
  Box,
} from "@chakra-ui/react";
import {
  FiEye,
  FiEyeOff,
  FiInfo,
  FiCheckCircle,
  FiAlertCircle,
  FiHelpCircle,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { tokens } from "../../theme/tokens";

const MotionBox = motion(Box);

function parseJsonOrNull(value) {
  if (!value || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function stringifyJson(value) {
  if (!value) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

export default function BotFormModal({ isOpen, onClose, onSubmit, bot }) {
  const toast = useToast();
  const isEdit = Boolean(bot);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showToken, setShowToken] = React.useState(false);
  const [showSettingsHelp, setShowSettingsHelp] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [jsonError, setJsonError] = React.useState("");

  const [form, setForm] = React.useState({
    name: "",
    token: "",
    description: "",
    is_active: true,
    settingsJson: "",
  });

  React.useEffect(() => {
    if (bot) {
      setForm({
        name: bot.name ?? "",
        token: "",
        description: bot.description ?? "",
        is_active: bot.is_active ?? true,
        settingsJson: stringifyJson(bot.settings),
      });
    } else {
      setForm({
        name: "",
        token: "",
        description: "",
        is_active: true,
        settingsJson: "",
      });
    }
    setErrors({});
    setJsonError("");
    setShowSettingsHelp(false);
  }, [bot, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Название обязательно";
    }

    if (!isEdit && !form.token.trim()) {
      newErrors.token = "Токен обязателен";
    }

    if (!isEdit && form.token.trim()) {
      // Basic token format validation
      const tokenPattern = /^\d+:[A-Za-z0-9_-]+$/;
      if (!tokenPattern.test(form.token.trim())) {
        newErrors.token = "Неверный формат токена (должен быть: 123456789:ABCdefGHIjklMNOpqr)";
      }
    }

    if (form.settingsJson.trim()) {
      const parsed = parseJsonOrNull(form.settingsJson);
      if (!parsed) {
        newErrors.settingsJson = "Неверный формат JSON";
        setJsonError("Ошибка парсинга JSON. Проверьте синтаксис.");
      } else {
        setJsonError("");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleJsonChange = (value) => {
    setForm((prev) => ({ ...prev, settingsJson: value }));
    if (value.trim()) {
      const parsed = parseJsonOrNull(value);
      if (!parsed) {
        setJsonError("Неверный формат JSON");
      } else {
        setJsonError("");
      }
    } else {
      setJsonError("");
    }
  };

  const prettifyJson = () => {
    if (form.settingsJson.trim()) {
      const parsed = parseJsonOrNull(form.settingsJson);
      if (parsed) {
        setForm((prev) => ({ ...prev, settingsJson: stringifyJson(parsed) }));
        setJsonError("");
        toast({
          title: "JSON отформатирован",
          status: "success",
          duration: 1500,
        });
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Проверьте форму",
        description: "Исправьте ошибки перед отправкой",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        settings: parseJsonOrNull(form.settingsJson) ?? undefined,
      };

      if (isEdit) {
        payload.is_active = form.is_active;
        await onSubmit(payload);
      } else {
        await onSubmit({ ...payload, token: form.token.trim() });
      }

      toast({
        title: isEdit ? "Бот обновлён" : "Бот создан",
        description: isEdit
          ? "Настройки бота успешно сохранены"
          : "Бот успешно создан и готов к настройке",
        status: "success",
        duration: 3000,
      });
      onClose();
    } catch (error) {
      const message = error.response?.data?.detail || error.message;
      toast({
        title: "Ошибка",
        description: message,
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.600" />
      <ModalContent
        as="form"
        onSubmit={handleSubmit}
        bg={"gray.800"}
        borderWidth="1px"
        borderColor={tokens.colors.border.default}
        borderRadius="xl"
        maxH="90vh"
      >
        <ModalHeader
          bg={"gray.900"}
          borderBottomWidth="1px"
          borderColor={tokens.colors.border.default}
          color={tokens.colors.text.primary}
        >
          {isEdit ? "Редактировать бота" : "Создать бота"}
        </ModalHeader>
        <ModalCloseButton color={tokens.colors.text.tertiary} />

        <ModalBody py={6}>
          <VStack spacing={5} align="stretch">
            {/* Название */}
            <FormControl isRequired isInvalid={!!errors.name}>
              <FormLabel color={tokens.colors.text.primary}>Название бота</FormLabel>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Мой Telegram бот"
                bg={"gray.900"}
                borderColor={tokens.colors.border.subtle}
                _hover={{ borderColor: tokens.colors.border.default }}
                _focus={{
                  borderColor: tokens.colors.brand.primary,
                  boxShadow: `0 0 0 1px ${tokens.colors.brand.primary}`,
                }}
              />
              {errors.name && (
                <FormErrorMessage>
                  <Icon as={FiAlertCircle} mr={1} />
                  {errors.name}
                </FormErrorMessage>
              )}
              <FormHelperText color={tokens.colors.text.tertiary}>
                Понятное название для идентификации бота
              </FormHelperText>
            </FormControl>

            {/* Токен (только при создании) */}
            {!isEdit && (
              <FormControl isRequired isInvalid={!!errors.token}>
                <HStack justify="space-between" mb={2}>
                  <FormLabel mb={0} color={tokens.colors.text.primary}>
                    Токен бота
                  </FormLabel>
                  <Tooltip
                    label="Получите токен от @BotFather в Telegram"
                    placement="top"
                    bg="gray.700"
                    color="white"
                    borderRadius="md"
                    px={3}
                    py={2}
                    fontSize="sm"
                  >
                    <Icon as={FiInfo} color={tokens.colors.brand.primary} cursor="help" />
                  </Tooltip>
                </HStack>
                <InputGroup>
                  <Input
                    type={showToken ? "text" : "password"}
                    value={form.token}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        token: e.target.value,
                      }))
                    }
                    placeholder="123456789:ABCdefGHIjklMNOpqr..."
                    fontFamily="mono"
                    bg="gray.900"
                    borderColor={tokens.colors.border.subtle}
                    _hover={{ borderColor: tokens.colors.border.default }}
                    _focus={{
                      borderColor: tokens.colors.brand.primary,
                      boxShadow: `0 0 0 1px ${tokens.colors.brand.primary}`,
                    }}
                  />
                  <InputRightElement>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      icon={<Icon as={showToken ? FiEyeOff : FiEye} />}
                      onClick={() => setShowToken(!showToken)}
                      aria-label={showToken ? "Скрыть токен" : "Показать токен"}
                    />
                  </InputRightElement>
                </InputGroup>
                {errors.token && (
                  <FormErrorMessage>
                    <Icon as={FiAlertCircle} mr={1} />
                    {errors.token}
                  </FormErrorMessage>
                )}
                <FormHelperText color={tokens.colors.text.tertiary}>
                  Токен API от BotFather (будет надежно сохранен)
                </FormHelperText>
              </FormControl>
            )}

            {/* Описание */}
            <FormControl>
              <FormLabel color={tokens.colors.text.primary}>Описание</FormLabel>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Краткое описание назначения бота..."
                rows={3}
                bg={"gray.900"}
                borderColor={tokens.colors.border.subtle}
                _hover={{ borderColor: tokens.colors.border.default }}
                _focus={{
                  borderColor: tokens.colors.brand.primary,
                  boxShadow: `0 0 0 1px ${tokens.colors.brand.primary}`,
                }}
              />
              <FormHelperText color={tokens.colors.text.tertiary}>
                Опционально: что делает этот бот
              </FormHelperText>
            </FormControl>

            {/* Активность (только при редактировании) */}
            {isEdit && (
              <FormControl>
                <HStack justify="space-between">
                  <VStack align="flex-start" spacing={0}>
                    <FormLabel mb={0} color={tokens.colors.text.primary}>
                      Статус активности
                    </FormLabel>
                    <Text fontSize="sm" color={tokens.colors.text.tertiary}>
                      {form.is_active ? "Бот активен и принимает сообщения" : "Бот неактивен"}
                    </Text>
                  </VStack>
                  <Switch
                    size="lg"
                    colorScheme="green"
                    isChecked={form.is_active}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                  />
                </HStack>
              </FormControl>
            )}

            {/* JSON настройки */}
            <FormControl isInvalid={!!errors.settingsJson || !!jsonError}>
              <HStack justify="space-between" mb={2}>
                <HStack spacing={2}>
                  <FormLabel mb={0} color={tokens.colors.text.primary}>
                    Настройки (JSON)
                  </FormLabel>
                  <Tooltip
                    label="Показать примеры доступных полей"
                    placement="top"
                    bg="gray.700"
                    color="white"
                    borderRadius="md"
                    px={3}
                    py={2}
                    fontSize="sm"
                  >
                    <Icon
                      as={FiHelpCircle}
                      color={tokens.colors.brand.primary}
                      cursor="pointer"
                      onClick={() => setShowSettingsHelp(!showSettingsHelp)}
                    />
                  </Tooltip>
                </HStack>
                <HStack spacing={2}>
                  {jsonError ? (
                    <Icon as={FiAlertCircle} color="red.500" />
                  ) : form.settingsJson.trim() ? (
                    <Icon as={FiCheckCircle} color="green.500" />
                  ) : null}
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={prettifyJson}
                    isDisabled={!form.settingsJson.trim()}
                  >
                    Форматировать
                  </Button>
                </HStack>
              </HStack>

              {/* Справочная информация о полях */}
              <AnimatePresence>
                {showSettingsHelp && (
                  <MotionBox
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    mb={3}
                  >
                    <Box
                      bg="blue.900"
                      borderColor="blue.500"
                      borderWidth="1px"
                      borderRadius="md"
                      p={3}
                    >
                      <HStack mb={2}>
                        <Icon as={FiInfo} color="blue.300" />
                        <Text fontSize="sm" fontWeight="bold" color="blue.200">
                          Доступные поля настроек
                        </Text>
                      </HStack>
                      <VStack align="stretch" spacing={2} fontSize="xs">
                        <Box>
                          <Code colorScheme="blue" fontSize="xs">
                            greeting
                          </Code>
                          <Text color="blue.100" mt={1}>
                            Приветственное сообщение при старте бота
                          </Text>
                          <Text color="blue.300" fontStyle="italic">
                            Пример: "Привет! 👋 Я бот-помощник"
                          </Text>
                        </Box>
                        <Box>
                          <Code colorScheme="blue" fontSize="xs">
                            timeout
                          </Code>
                          <Text color="blue.100" mt={1}>
                            Таймаут обработки сообщений (секунды)
                          </Text>
                          <Text color="blue.300" fontStyle="italic">
                            Пример: 30
                          </Text>
                        </Box>
                        <Box>
                          <Code colorScheme="blue" fontSize="xs">
                            max_retries
                          </Code>
                          <Text color="blue.100" mt={1}>
                            Максимальное количество повторных попыток
                          </Text>
                          <Text color="blue.300" fontStyle="italic">
                            Пример: 3
                          </Text>
                        </Box>
                        <Box>
                          <Code colorScheme="blue" fontSize="xs">
                            language
                          </Code>
                          <Text color="blue.100" mt={1}>
                            Язык ответов бота
                          </Text>
                          <Text color="blue.300" fontStyle="italic">
                            Пример: "ru", "en"
                          </Text>
                        </Box>
                        <Box>
                          <Code colorScheme="blue" fontSize="xs">
                            log_level
                          </Code>
                          <Text color="blue.100" mt={1}>
                            Уровень логирования
                          </Text>
                          <Text color="blue.300" fontStyle="italic">
                            Пример: "info", "debug", "error"
                          </Text>
                        </Box>
                        <Box>
                          <Code colorScheme="blue" fontSize="xs">
                            custom_fields
                          </Code>
                          <Text color="blue.100" mt={1}>
                            Произвольные дополнительные поля
                          </Text>
                          <Text color="blue.300" fontStyle="italic">
                            Пример: {`{"api_key": "...", "features": [...]}`}
                          </Text>
                        </Box>
                        <Box mt={2} pt={2} borderTopWidth="1px" borderColor="blue.700">
                          <Text color="blue.200" fontSize="xs">
                            💡 <strong>Примечание:</strong> Все поля опциональны. Настройки хранятся
                            в формате JSON и могут быть использованы в графах обработки через
                            специальные ноды.
                          </Text>
                        </Box>
                      </VStack>
                    </Box>
                  </MotionBox>
                )}
              </AnimatePresence>

              <Textarea
                value={form.settingsJson}
                onChange={(e) => handleJsonChange(e.target.value)}
                placeholder={
                  '{\n  "greeting": "Привет! 👋",\n  "timeout": 30,\n  "language": "ru"\n}'
                }
                fontFamily="mono"
                fontSize="sm"
                minH="150px"
                bg={"gray.900"}
                borderColor={jsonError ? "red.500" : tokens.colors.border.subtle}
                _hover={{
                  borderColor: jsonError ? "red.600" : tokens.colors.border.default,
                }}
                _focus={{
                  borderColor: jsonError ? "red.600" : tokens.colors.brand.primary,
                  boxShadow: jsonError
                    ? "0 0 0 1px red"
                    : `0 0 0 1px ${tokens.colors.brand.primary}`,
                }}
              />
              {jsonError && (
                <FormErrorMessage>
                  <Icon as={FiAlertCircle} mr={1} />
                  {jsonError}
                </FormErrorMessage>
              )}
              <FormHelperText color={tokens.colors.text.tertiary}>
                Опционально: дополнительные параметры в формате JSON. Нажмите{" "}
                <Icon as={FiHelpCircle} boxSize={3} mx={1} /> для просмотра доступных полей.
              </FormHelperText>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter
          bg={"gray.900"}
          borderTopWidth="1px"
          borderColor={tokens.colors.border.default}
        >
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Отмена
            </Button>
            <Button
              colorScheme="brand"
              type="submit"
              isLoading={isSubmitting}
              loadingText={isEdit ? "Сохранение..." : "Создание..."}
            >
              {isEdit ? "Сохранить" : "Создать бота"}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
