import React from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Stack,
  Text,
  useDisclosure,
  useToast,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { AddIcon, RepeatIcon, ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { FiEdit, FiTrash2, FiZap } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmDialog, ErrorAlert, EmptyState, LoadingState } from "../components";
import PageHeader from "../components/common/PageHeader";
import BotStatusBadge from "../components/telegram/BotStatusBadge";
import BotControlButtons from "../components/telegram/BotControlButtons";
import BotJobStatusPanel from "../components/telegram/BotJobStatusPanel";
import BotFormModal from "../components/telegram/BotFormModal";
import TriggerFormModal from "../components/telegram/TriggerFormModal";
import {
  getBotStatus,
  listBots,
  listBotTriggers,
  createBot,
  updateBot,
  deleteBot,
  createTrigger,
  updateTrigger,
  deleteTrigger,
  listGraphs,
} from "../API";
import Card from "../components/common/Card";
import { tokens } from "../theme/tokens";

const MotionBox = motion(Box);
const MotionStack = motion(Stack);

function TelegramPage() {
  const toast = useToast();
  const [bots, setBots] = React.useState([]);
  const [botTriggers, setBotTriggers] = React.useState({});
  const [expandedBots, setExpandedBots] = React.useState([]);
  const [graphs, setGraphs] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [confirmState, setConfirmState] = React.useState(null);

  const botModal = useDisclosure();
  const triggerModal = useDisclosure();

  const [editingBot, setEditingBot] = React.useState(null);
  const [editingTrigger, setEditingTrigger] = React.useState(null);
  const [currentBotId, setCurrentBotId] = React.useState(null);
  const botStatusesRef = React.useRef({});

  const deferredBots = React.useDeferredValue(bots);
  const deferredGraphs = React.useDeferredValue(graphs);
  const deferredTriggers = React.useDeferredValue(botTriggers);
  const expandedSet = React.useMemo(() => new Set(expandedBots), [expandedBots]);
  const botsToRender = React.useMemo(
    () => (Array.isArray(deferredBots) ? deferredBots : bots),
    [deferredBots, bots],
  );

  const fetchBots = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listBots({ activeOnly: false });
      setBots(response ?? []);
    } catch (err) {
      const message = err.response?.data?.detail || err.message;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBotStatus = React.useCallback(async (botId) => {
    try {
      const status = await getBotStatus(botId);
      botStatusesRef.current = { ...botStatusesRef.current, [botId]: status };
    } catch (err) {
      // статус не критичен для общего UI
    }
  }, []);

  const fetchGraphs = React.useCallback(async () => {
    try {
      const response = await listGraphs({ page: 1, size: 50, activeOnly: true });
      setGraphs(response.graphs ?? []);
    } catch (err) {
      console.error("Failed to fetch graphs", err);
    }
  }, []);

  React.useEffect(() => {
    fetchBots();
    fetchGraphs();
  }, [fetchBots, fetchGraphs]);

  // Периодический опрос статусов раскрытых ботов
  React.useEffect(() => {
    const interval = setInterval(() => {
      expandedBots.forEach((botId) => fetchBotStatus(botId));
    }, 5000);
    return () => clearInterval(interval);
  }, [expandedBots, fetchBotStatus]);

  const refreshBots = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchBots();
      toast({ title: "Список обновлён", status: "success" });
    } catch (err) {
      const message = err.response?.data?.detail || err.message;
      toast({ title: "Ошибка", description: message, status: "error" });
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchBots, toast]);

  const loadTriggers = React.useCallback(
    async (botId) => {
      try {
        const triggers = await listBotTriggers(botId, { activeOnly: false });
        setBotTriggers((prev) => ({ ...prev, [botId]: triggers ?? [] }));
      } catch (err) {
        const message = err.response?.data?.detail || err.message;
        toast({ title: "Не удалось загрузить триггеры", description: message, status: "error" });
      }
    },
    [toast],
  );

  const toggleBotSection = React.useCallback(
    (botId) => {
      setExpandedBots((prev) => {
        if (prev.includes(botId)) {
          return prev.filter((id) => id !== botId);
        }
        if (!deferredTriggers[botId]) {
          loadTriggers(botId);
        }
        fetchBotStatus(botId);
        return [...prev, botId];
      });
    },
    [deferredTriggers, fetchBotStatus, loadTriggers],
  );

  const openCreateBot = () => {
    setEditingBot(null);
    botModal.onOpen();
  };

  const openEditBot = (bot) => {
    setEditingBot(bot);
    botModal.onOpen();
  };

  const submitBot = async (payload) => {
    if (editingBot) {
      await updateBot(editingBot.id, payload);
    } else {
      await createBot(payload);
    }
    await fetchBots();
  };

  const requestDeleteBot = (botId) => {
    setConfirmState({ type: "bot", id: botId, message: "Удалить бота вместе с триггерами?" });
  };

  const requestDeleteTrigger = (triggerId, botId) => {
    setConfirmState({
      type: "trigger",
      id: triggerId,
      botId,
      message: "Удалить триггер безвозвратно?",
    });
  };

  const confirmDelete = async () => {
    if (!confirmState) return;
    try {
      if (confirmState.type === "bot") {
        await deleteBot(confirmState.id);
        await fetchBots();
      } else if (confirmState.type === "trigger") {
        await deleteTrigger(confirmState.id);
        await loadTriggers(confirmState.botId);
      }
      toast({ title: "Удалено", status: "success" });
    } catch (err) {
      const message = err.response?.data?.detail || err.message;
      toast({ title: "Ошибка", description: message, status: "error" });
    } finally {
      setConfirmState(null);
    }
  };

  const openCreateTrigger = (botId) => {
    setCurrentBotId(botId);
    setEditingTrigger(null);
    triggerModal.onOpen();
  };

  const openEditTrigger = (botId, trigger) => {
    setCurrentBotId(botId);
    setEditingTrigger(trigger);
    triggerModal.onOpen();
  };

  const submitTrigger = async (payload) => {
    if (editingTrigger) {
      await updateTrigger(editingTrigger.id, payload);
    } else {
      await createTrigger({ ...payload, bot_id: currentBotId });
    }
    await loadTriggers(currentBotId);
  };

  if (isLoading && bots.length === 0) {
    return <LoadingState label="Загружаем Telegram-ботов" />;
  }

  return (
    <Stack spacing={6}>
      <PageHeader
        title="Интеграция с Telegram"
        subtitle="Управляйте ботами и триггерами, запускающими графы в ответ на сообщения"
        actions={
          <Wrap spacing={2} justify="flex-end">
            <WrapItem>
              <Button
                leftIcon={<RepeatIcon />}
                variant="ghost"
                onClick={refreshBots}
                isLoading={isRefreshing}
              >
                Обновить
              </Button>
            </WrapItem>
            <WrapItem>
              <Button colorScheme="brand" leftIcon={<AddIcon />} onClick={openCreateBot}>
                Новый бот
              </Button>
            </WrapItem>
          </Wrap>
        }
      />

      {error && <ErrorAlert description={error} onClose={() => setError(null)} />}

      {!bots.length ? (
        <EmptyState
          title="Боты не найдены"
          description="Создайте бота, чтобы подключить телеграм"
        />
      ) : (
        <Stack spacing={4}>
          <AnimatePresence>
            {botsToRender.map((bot, index) => {
              const isExpanded = expandedSet.has(bot.id);
              const triggers = deferredTriggers[bot.id] ?? [];
              return (
                <MotionBox
                  key={bot.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                >
                  <Card
                    p={5}
                    borderWidth="1px"
                    borderColor={tokens.colors.border.default}
                    bg={"gray.800"}
                    borderRadius="xl"
                    _hover={{
                      borderColor: "blue.300",
                      boxShadow: `0 4px 12px ${"blue.100"}`,
                    }}
                    transition="all 0.2s"
                  >
                    <Stack spacing={4}>
                      {/* Заголовок и статус */}
                      <Flex
                        align={{ base: "flex-start", md: "center" }}
                        direction={{ base: "column", md: "row" }}
                        gap={3}
                      >
                        <Stack spacing={2} flex="1">
                          <HStack spacing={3}>
                            <Icon as={FiZap} boxSize={5} color={tokens.colors.brand.primary} />
                            <Heading size="md" color={tokens.colors.text.primary}>
                              {bot.name}
                            </Heading>
                            {/* Если бот помечен как активный, но job_status == STOPPED, показываем STARTING */}
                            <BotStatusBadge
                              status={
                                bot.is_active && (bot.job_status === "STOPPED" || !bot.job_status)
                                  ? "STARTING"
                                  : bot.job_status || "STOPPED"
                              }
                            />
                          </HStack>

                          <Text fontSize="sm" color={tokens.colors.text.tertiary} lineHeight="1.6">
                            {bot.description || "Без описания"}
                          </Text>

                          <Wrap spacing={2}>
                            <WrapItem>
                              <Badge
                                colorScheme={bot.is_active ? "green" : "gray"}
                                px={2}
                                py={1}
                                borderRadius="md"
                              >
                                {bot.is_active ? "Активен" : "Выключен"}
                              </Badge>
                            </WrapItem>
                            {bot.username && (
                              <WrapItem>
                                <Badge colorScheme="blue" px={2} py={1} borderRadius="md">
                                  @{bot.username}
                                </Badge>
                              </WrapItem>
                            )}
                            <WrapItem>
                              <Badge colorScheme="purple" px={2} py={1} borderRadius="md">
                                {new Date(bot.created_at).toLocaleDateString("ru-RU")}
                              </Badge>
                            </WrapItem>
                          </Wrap>
                        </Stack>

                        {/* Кнопки управления */}
                        <Flex
                          direction={{ base: "column", md: "row" }}
                          gap={2}
                          wrap="wrap"
                          justify="flex-end"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleBotSection(bot.id)}
                            rightIcon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                          >
                            {isExpanded ? "Скрыть детали" : "Показать детали"}
                          </Button>

                          <BotControlButtons
                            bot={bot}
                            onStatusChange={async () => {
                              await fetchBots();
                              // немедленно обновим статус этого бота
                              await fetchBotStatus(bot.id);
                            }}
                            size="sm"
                          />

                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<AddIcon />}
                            onClick={() => openCreateTrigger(bot.id)}
                          >
                            Триггер
                          </Button>

                          <IconButton
                            size="sm"
                            icon={<FiEdit />}
                            aria-label="Изменить"
                            variant="ghost"
                            onClick={() => openEditBot(bot)}
                          />

                          <IconButton
                            size="sm"
                            icon={<FiTrash2 />}
                            aria-label="Удалить"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => requestDeleteBot(bot.id)}
                          />
                        </Flex>
                      </Flex>

                      {/* Раскрывающаяся секция с деталями */}
                      <AnimatePresence>
                        {isExpanded && (
                          <MotionStack
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            spacing={4}
                            overflow="hidden"
                          >
                            {/* Панель статуса работы */}
                            <MotionBox
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3, delay: 0.15 }}
                            >
                              <BotJobStatusPanel
                                botId={bot.id}
                                graphs={deferredGraphs}
                                isVisible={isExpanded}
                              />
                            </MotionBox>

                            {/* Триггеры */}
                            <MotionBox
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3, delay: 0.25 }}
                            >
                              <Box>
                                <Heading size="sm" mb={3} color={tokens.colors.text.primary}>
                                  Триггеры ({triggers.length})
                                </Heading>

                                {!botTriggers[bot.id] ? (
                                  <Text fontSize="sm" color={tokens.colors.text.tertiary}>
                                    Загрузка триггеров...
                                  </Text>
                                ) : triggers.length === 0 ? (
                                  <Box
                                    p={4}
                                    borderRadius="lg"
                                    bg={"gray.900"}
                                    borderWidth="1px"
                                    borderColor={tokens.colors.border.subtle}
                                    textAlign="center"
                                  >
                                    <Text fontSize="sm" color={tokens.colors.text.tertiary}>
                                      Триггеры не настроены. Создайте триггер для автоматического
                                      запуска графов.
                                    </Text>
                                  </Box>
                                ) : (
                                  <MotionStack spacing={3}>
                                    {triggers.map((trigger, tIdx) => (
                                      <MotionBox
                                        key={trigger.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: tIdx * 0.05, duration: 0.2 }}
                                        whileHover={{ x: 4 }}
                                        p={4}
                                        borderRadius="lg"
                                        bg={"gray.900"}
                                        borderWidth="1px"
                                        borderColor={tokens.colors.border.subtle}
                                        _hover={{
                                          borderColor: "blue.300",
                                          boxShadow: "sm",
                                        }}
                                      >
                                        <Flex
                                          align={{ base: "flex-start", md: "center" }}
                                          direction={{ base: "column", md: "row" }}
                                          gap={3}
                                        >
                                          <Stack spacing={2} flex="1">
                                            <Text
                                              fontWeight="semibold"
                                              color={tokens.colors.text.primary}
                                            >
                                              {trigger.name}
                                            </Text>
                                            <Text fontSize="sm" color={tokens.colors.text.tertiary}>
                                              Тип: {trigger.trigger_type} | Паттерн:{" "}
                                              {trigger.trigger_pattern}
                                            </Text>
                                            <Wrap spacing={2}>
                                              <WrapItem>
                                                <Badge
                                                  colorScheme={trigger.is_active ? "green" : "gray"}
                                                  px={2}
                                                  py={1}
                                                  borderRadius="md"
                                                >
                                                  {trigger.is_active ? "Активен" : "Выключен"}
                                                </Badge>
                                              </WrapItem>
                                              <WrapItem>
                                                <Badge
                                                  colorScheme="cyan"
                                                  px={2}
                                                  py={1}
                                                  borderRadius="md"
                                                >
                                                  Приоритет {trigger.priority}
                                                </Badge>
                                              </WrapItem>
                                            </Wrap>
                                            {trigger.description && (
                                              <Text
                                                fontSize="sm"
                                                color={tokens.colors.text.tertiary}
                                              >
                                                {trigger.description}
                                              </Text>
                                            )}
                                          </Stack>

                                          <HStack spacing={2}>
                                            <IconButton
                                              size="sm"
                                              icon={<FiEdit />}
                                              aria-label="Изменить триггер"
                                              variant="ghost"
                                              onClick={() => openEditTrigger(bot.id, trigger)}
                                            />
                                            <IconButton
                                              size="sm"
                                              icon={<FiTrash2 />}
                                              aria-label="Удалить триггер"
                                              colorScheme="red"
                                              variant="ghost"
                                              onClick={() =>
                                                requestDeleteTrigger(trigger.id, bot.id)
                                              }
                                            />
                                          </HStack>
                                        </Flex>
                                      </MotionBox>
                                    ))}
                                  </MotionStack>
                                )}
                              </Box>
                            </MotionBox>
                          </MotionStack>
                        )}
                      </AnimatePresence>
                    </Stack>
                  </Card>
                </MotionBox>
              );
            })}
          </AnimatePresence>
        </Stack>
      )}

      <BotFormModal
        isOpen={botModal.isOpen}
        onClose={botModal.onClose}
        onSubmit={submitBot}
        bot={editingBot}
      />

      <TriggerFormModal
        isOpen={triggerModal.isOpen}
        onClose={triggerModal.onClose}
        onSubmit={submitTrigger}
        trigger={editingTrigger}
        graphs={deferredGraphs}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmState)}
        onClose={() => setConfirmState(null)}
        onConfirm={confirmDelete}
        title="Подтвердите действие"
        message={confirmState?.message || ""}
        confirmText="Удалить"
      />
    </Stack>
  );
}

export default TelegramPage;
