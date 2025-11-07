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
  Select,
  Switch,
  Stack,
  HStack,
  VStack,
  Icon,
  Tooltip,
  Text,
  useToast,
  Box,
  Badge,
  Code,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";
import { FiInfo, FiAlertCircle, FiCheckCircle, FiZap, FiHash, FiHelpCircle } from "react-icons/fi";
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

const TRIGGER_TYPES = [
  {
    value: "command",
    label: "Команда",
    description: "Реагирует на команды вида /start, /help",
    example: "/start",
    pattern: "^/",
  },
  {
    value: "keyword",
    label: "Ключевое слово",
    description: "Поиск ключевых слов в сообщении",
    example: "привет",
  },
  {
    value: "mention",
    label: "Упоминание",
    description: "Когда бота упоминают в сообщении",
    example: "@botname",
  },
  {
    value: "callback",
    label: "Callback",
    description: "Обработка callback-кнопок",
    example: "button_action",
  },
  {
    value: "regex",
    label: "Регулярное выражение",
    description: "Продвинутый поиск по регулярному выражению",
    example: ".*\\d{4}.*",
  },
];

export default function TriggerFormModal({ isOpen, onClose, onSubmit, trigger, graphs }) {
  const toast = useToast();
  const isEdit = Boolean(trigger);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSettingsHelp, setShowSettingsHelp] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [jsonError, setJsonError] = React.useState("");

  const [form, setForm] = React.useState({
    name: "",
    trigger_type: "command",
    trigger_pattern: "",
    description: "",
    priority: 100,
    graph_id: "",
    is_active: true,
    settingsJson: "",
  });

  React.useEffect(() => {
    if (trigger) {
      setForm({
        name: trigger.name ?? "",
        trigger_type: trigger.trigger_type ?? "command",
        trigger_pattern: trigger.trigger_pattern ?? "",
        description: trigger.description ?? "",
        priority: trigger.priority ?? 100,
        graph_id: trigger.graph_id,
        is_active: trigger.is_active ?? true,
        settingsJson: stringifyJson(trigger.settings),
      });
    } else {
      setForm({
        name: "",
        trigger_type: "command",
        trigger_pattern: "",
        description: "",
        priority: 100,
        graph_id: "",
        is_active: true,
        settingsJson: "",
      });
    }
    setErrors({});
    setJsonError("");
    setShowSettingsHelp(false);
  }, [trigger, isOpen]);

  const selectedTriggerType = React.useMemo(
    () => TRIGGER_TYPES.find((t) => t.value === form.trigger_type),
    [form.trigger_type],
  );

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Название обязательно";
    }

    if (!form.trigger_pattern.trim()) {
      newErrors.trigger_pattern = "Паттерн обязателен";
    }

    if (!form.graph_id) {
      newErrors.graph_id = "Выберите граф";
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
        trigger_type: form.trigger_type,
        trigger_pattern: form.trigger_pattern.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        graph_id: form.graph_id,
        settings: parseJsonOrNull(form.settingsJson) ?? undefined,
        is_active: form.is_active,
      };

      await onSubmit(payload);

      toast({
        title: isEdit ? "Триггер обновлён" : "Триггер создан",
        description: isEdit
          ? "Настройки триггера успешно сохранены"
          : "Триггер успешно создан и готов к работе",
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

  const selectedGraph = React.useMemo(
    () => graphs.find((g) => g.id === form.graph_id),
    [graphs, form.graph_id],
  );

  const getPriorityLabel = (priority) => {
    if (priority >= 200) return "Очень высокий";
    if (priority >= 150) return "Высокий";
    if (priority >= 100) return "Средний";
    if (priority >= 50) return "Низкий";
    return "Очень низкий";
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
          <HStack spacing={2}>
            <Icon as={FiZap} color={tokens.colors.brand.primary} />
            <Text>{isEdit ? "Редактировать триггер" : "Создать триггер"}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color={tokens.colors.text.tertiary} />

        <ModalBody py={6}>
          <VStack spacing={5} align="stretch">
            {/* Название */}
            <FormControl isRequired isInvalid={!!errors.name}>
              <FormLabel color={tokens.colors.text.primary}>Название триггера</FormLabel>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Команда /start"
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
                Понятное название для идентификации триггера
              </FormHelperText>
            </FormControl>

            {/* Тип триггера */}
            <FormControl isRequired>
              <FormLabel color={tokens.colors.text.primary}>Тип триггера</FormLabel>
              <Select
                value={form.trigger_type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    trigger_type: e.target.value,
                  }))
                }
                bg={"gray.900"}
                borderColor={tokens.colors.border.subtle}
                _hover={{ borderColor: tokens.colors.border.default }}
                _focus={{
                  borderColor: tokens.colors.brand.primary,
                  boxShadow: `0 0 0 1px ${tokens.colors.brand.primary}`,
                }}
              >
                {TRIGGER_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
              {selectedTriggerType && (
                <Box
                  mt={2}
                  p={3}
                  bg={"blue.50"}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={"blue.200"}
                >
                  <Text fontSize="sm" color={"blue.800"} mb={1}>
                    {selectedTriggerType.description}
                  </Text>
                  <Text fontSize="xs" color={"blue.600"} fontFamily="mono">
                    Пример: {selectedTriggerType.example}
                  </Text>
                </Box>
              )}
            </FormControl>

            {/* Паттерн */}
            <FormControl isRequired isInvalid={!!errors.trigger_pattern}>
              <FormLabel color={tokens.colors.text.primary}>Паттерн</FormLabel>
              <Input
                value={form.trigger_pattern}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    trigger_pattern: e.target.value,
                  }))
                }
                placeholder={selectedTriggerType?.example || "/start"}
                fontFamily="mono"
                bg={"gray.900"}
                borderColor={tokens.colors.border.subtle}
                _hover={{ borderColor: tokens.colors.border.default }}
                _focus={{
                  borderColor: tokens.colors.brand.primary,
                  boxShadow: `0 0 0 1px ${tokens.colors.brand.primary}`,
                }}
              />
              {errors.trigger_pattern && (
                <FormErrorMessage>
                  <Icon as={FiAlertCircle} mr={1} />
                  {errors.trigger_pattern}
                </FormErrorMessage>
              )}
              <FormHelperText color={tokens.colors.text.tertiary}>
                Паттерн для поиска в сообщениях
              </FormHelperText>
            </FormControl>

            {/* Граф */}
            <FormControl isRequired isInvalid={!!errors.graph_id}>
              <FormLabel color={tokens.colors.text.primary}>Связанный граф</FormLabel>
              <Select
                value={form.graph_id}
                onChange={(e) => setForm((prev) => ({ ...prev, graph_id: e.target.value }))}
                placeholder="Выберите граф для выполнения"
                bg={"gray.900"}
                borderColor={tokens.colors.border.subtle}
                _hover={{ borderColor: tokens.colors.border.default }}
                _focus={{
                  borderColor: tokens.colors.brand.primary,
                  boxShadow: `0 0 0 1px ${tokens.colors.brand.primary}`,
                }}
              >
                {graphs.map((graph) => (
                  <option key={graph.id} value={graph.id}>
                    {graph.name}
                  </option>
                ))}
              </Select>
              {errors.graph_id && (
                <FormErrorMessage>
                  <Icon as={FiAlertCircle} mr={1} />
                  {errors.graph_id}
                </FormErrorMessage>
              )}
              {selectedGraph && (
                <Box
                  mt={2}
                  p={3}
                  bg={"gray.900"}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={tokens.colors.border.subtle}
                >
                  <HStack spacing={2} mb={1}>
                    <Icon as={FiCheckCircle} color={tokens.colors.success.main} />
                    <Text fontSize="sm" fontWeight="medium" color={tokens.colors.text.primary}>
                      {selectedGraph.name}
                    </Text>
                  </HStack>
                  {selectedGraph.description && (
                    <Text fontSize="xs" color={tokens.colors.text.tertiary}>
                      {selectedGraph.description}
                    </Text>
                  )}
                </Box>
              )}
              {!graphs.length && (
                <FormHelperText color="orange.500">
                  <Icon as={FiAlertCircle} mr={1} />
                  Нет доступных графов. Создайте граф сначала.
                </FormHelperText>
              )}
            </FormControl>

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
                placeholder="Описание работы триггера..."
                rows={2}
                bg={"gray.900"}
                borderColor={tokens.colors.border.subtle}
                _hover={{ borderColor: tokens.colors.border.default }}
                _focus={{
                  borderColor: tokens.colors.brand.primary,
                  boxShadow: `0 0 0 1px ${tokens.colors.brand.primary}`,
                }}
              />
              <FormHelperText color={tokens.colors.text.tertiary}>
                Опционально: что делает этот триггер
              </FormHelperText>
            </FormControl>

            {/* Приоритет */}
            <FormControl>
              <HStack justify="space-between" mb={2}>
                <FormLabel mb={0} color={tokens.colors.text.primary}>
                  Приоритет
                </FormLabel>
                <Badge
                  colorScheme={
                    form.priority >= 150 ? "red" : form.priority >= 100 ? "orange" : "gray"
                  }
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {form.priority} - {getPriorityLabel(form.priority)}
                </Badge>
              </HStack>
              <HStack spacing={4}>
                <Slider
                  value={form.priority}
                  onChange={(val) => setForm((prev) => ({ ...prev, priority: val }))}
                  min={1}
                  max={300}
                  step={10}
                  colorScheme="brand"
                  flex="1"
                >
                  <SliderTrack bg={"gray.900"}>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb boxSize={6}>
                    <Icon as={FiHash} color={tokens.colors.brand.primary} />
                  </SliderThumb>
                </Slider>
                <NumberInput
                  value={form.priority}
                  onChange={(_, val) =>
                    setForm((prev) => ({
                      ...prev,
                      priority: val || 1,
                    }))
                  }
                  min={1}
                  max={1000}
                  w="100px"
                  bg={"gray.900"}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </HStack>
              <FormHelperText color={tokens.colors.text.tertiary}>
                Чем выше приоритет, тем раньше обработается триггер
              </FormHelperText>
            </FormControl>

            {/* Активность */}
            <FormControl>
              <HStack justify="space-between">
                <VStack align="flex-start" spacing={0}>
                  <FormLabel mb={0} color={tokens.colors.text.primary}>
                    Статус активности
                  </FormLabel>
                  <Text fontSize="sm" color={tokens.colors.text.tertiary}>
                    {form.is_active
                      ? "Триггер активен и обрабатывает сообщения"
                      : "Триггер неактивен"}
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

              {/* Справочная информация о полях для триггеров */}
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
                      bg="purple.900"
                      borderColor="purple.500"
                      borderWidth="1px"
                      borderRadius="md"
                      p={3}
                    >
                      <HStack mb={2}>
                        <Icon as={FiInfo} color="purple.300" />
                        <Text fontSize="sm" fontWeight="bold" color="purple.200">
                          Доступные поля настроек триггера
                        </Text>
                      </HStack>
                      <VStack align="stretch" spacing={2} fontSize="xs">
                        <Box>
                          <Code colorScheme="purple" fontSize="xs">
                            case_sensitive
                          </Code>
                          <Text color="purple.100" mt={1}>
                            Учитывать регистр при сравнении (true/false)
                          </Text>
                          <Text color="purple.300" fontStyle="italic">
                            Пример: true
                          </Text>
                        </Box>
                        <Box>
                          <Code colorScheme="purple" fontSize="xs">
                            exact_match
                          </Code>
                          <Text color="purple.100" mt={1}>
                            Точное совпадение (не подстрока)
                          </Text>
                          <Text color="purple.300" fontStyle="italic">
                            Пример: false
                          </Text>
                        </Box>
                        <Box>
                          <Code colorScheme="purple" fontSize="xs">
                            cooldown
                          </Code>
                          <Text color="purple.100" mt={1}>
                            Задержка между срабатываниями (секунды)
                          </Text>
                          <Text color="purple.300" fontStyle="italic">
                            Пример: 5
                          </Text>
                        </Box>
                        <Box>
                          <Code colorScheme="purple" fontSize="xs">
                            max_per_user
                          </Code>
                          <Text color="purple.100" mt={1}>
                            Максимум срабатываний на пользователя в день
                          </Text>
                          <Text color="purple.300" fontStyle="italic">
                            Пример: 10
                          </Text>
                        </Box>
                        <Box>
                          <Code colorScheme="purple" fontSize="xs">
                            allowed_chats
                          </Code>
                          <Text color="purple.100" mt={1}>
                            Список разрешенных chat_id
                          </Text>
                          <Text color="purple.300" fontStyle="italic">
                            Пример: [123456, 789012]
                          </Text>
                        </Box>
                        <Box>
                          <Code colorScheme="purple" fontSize="xs">
                            response_delay
                          </Code>
                          <Text color="purple.100" mt={1}>
                            Задержка перед ответом (миллисекунды)
                          </Text>
                          <Text color="purple.300" fontStyle="italic">
                            Пример: 500
                          </Text>
                        </Box>
                        <Box mt={2} pt={2} borderTopWidth="1px" borderColor="purple.700">
                          <Text color="purple.200" fontSize="xs">
                            💡 <strong>Примечание:</strong> Настройки триггера используются для
                            тонкой настройки поведения. Все поля опциональны и могут быть
                            переопределены в графах обработки.
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
                placeholder={'{\n  "case_sensitive": false,\n  "cooldown": 5\n}'}
                fontFamily="mono"
                fontSize="sm"
                minH="120px"
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
                Опционально: дополнительные параметры триггера. Нажмите{" "}
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
              leftIcon={<Icon as={FiZap} />}
            >
              {isEdit ? "Сохранить" : "Создать триггер"}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
