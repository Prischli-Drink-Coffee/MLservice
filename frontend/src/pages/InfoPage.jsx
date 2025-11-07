import React from "react";
import {
  Box,
  Container,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Icon,
  Avatar,
  Badge,
  Flex,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FiGithub, FiLinkedin, FiMail, FiMapPin } from "react-icons/fi";
import { Title, Body, Footnote } from "../components/common/Typography";
import { colors, spacing, borderRadius, shadows } from "../theme/tokens";
import SectionDivider from "../components/common/SectionDivider";

const MotionBox = motion(Box);
const MotionVStack = motion(VStack);
const MotionHStack = motion(HStack);

/**
 * GradientParticles - Animated gradient particles background
 */
function GradientParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 200 + 100,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
    colors: [
      [colors.brand.primary, colors.brand.secondary],
      [colors.brand.secondary, colors.brand.tertiary],
      [colors.brand.tertiary, colors.brand.primary],
      ["#ff6b6b", "#4ecdc4"],
      ["#ffd93d", "#6bcf7f"],
    ][Math.floor(Math.random() * 5)],
  }));

  return (
    <Box
      position="absolute"
      top="0"
      left="0"
      right="0"
      bottom="0"
      overflow="hidden"
      zIndex={0}
      pointerEvents="none"
    >
      {particles.map((particle) => (
        <MotionBox
          key={particle.id}
          position="absolute"
          left={`${particle.x}%`}
          top={`${particle.y}%`}
          w={`${particle.size}px`}
          h={`${particle.size}px`}
          borderRadius="full"
          bg={`radial-gradient(circle, ${particle.colors[0]}40 0%, ${particle.colors[1]}20 40%, transparent 70%)`}
          initial={{
            scale: 0,
            opacity: 0,
            filter: "blur(40px)",
          }}
          animate={{
            scale: [0, 1.5, 1, 1.5, 0],
            opacity: [0, 0.6, 0.4, 0.6, 0],
            x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, Math.random() * 100 - 50, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </Box>
  );
}

/**
 * TeamMemberCard - Individual team member card with hover effects
 */
function TeamMemberCard({ member, index }) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      h="full"
    >
      <Box
        bg={colors.blur.medium}
        border="1px solid"
        borderColor={colors.border.default}
        borderRadius={borderRadius["2xl"]}
        p={{ base: spacing[5], md: spacing[6], lg: spacing[7] }}
        position="relative"
        overflow="hidden"
        h="full"
        minH={{ base: "400px", md: "420px" }}
        backdropFilter="blur(20px)"
        transition="all 0.3s ease"
        _hover={{
          borderColor: colors.brand.primary,
          boxShadow: `0 0 40px ${colors.brand.primary}30, 0 0 80px ${colors.brand.secondary}20`,
        }}
      >
        {/* Gradient overlay on hover */}
        <MotionBox
          position="absolute"
          top="0"
          left="0"
          right="0"
          h="4px"
          bg={`linear-gradient(90deg, ${colors.brand.primary}, ${colors.brand.secondary}, ${colors.brand.tertiary})`}
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.4 }}
        />

        <VStack
          spacing={spacing[4]}
          align="center"
          w="full"
          paddingLeft={12}
          paddingRight={12}
          mt={12}
        >
          {/* Avatar */}
          <MotionBox whileHover={{ scale: 1.1, rotate: 5 }} transition={{ duration: 0.3 }}>
            <Avatar
              name={member.name}
              size="xl"
              bg={`linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`}
              color={colors.text.primary}
              border="3px solid"
              borderColor={colors.border.default}
              boxShadow={`0 0 30px ${colors.brand.primary}40`}
            />
          </MotionBox>

          {/* Name and Role */}
          <VStack spacing={spacing[2]} align="center">
            <Title variant="small" fontSize="20px" textAlign="center">
              {member.name}
            </Title>
            <Badge
              bg={colors.blur.accent}
              color={colors.brand.primary}
              px={3}
              py={1}
              borderRadius={borderRadius.lg}
              fontSize="12px"
              fontWeight={500}
              border="1px solid"
              borderColor={colors.border.default}
            >
              {member.role}
            </Badge>
          </VStack>

          {/* Description */}
          <Body
            variant="medium"
            color={colors.text.secondary}
            textAlign="center"
            fontSize={{ base: "13px", md: "14px" }}
            lineHeight="1.7"
            noOfLines={4}
          >
            {member.description}
          </Body>

          {/* Location */}
          {member.location && (
            <HStack spacing={2} color={colors.text.tertiary}>
              <Icon as={FiMapPin} boxSize={4} />
              <Footnote variant="small" fontSize="12px">
                {member.location}
              </Footnote>
            </HStack>
          )}

          {/* Work */}
          {member.work && (
            <Box
              bg={colors.blur.light}
              px={3}
              py={2}
              borderRadius={borderRadius.md}
              border="1px solid"
              borderColor={colors.border.default}
              w="full"
            >
              <Footnote
                variant="small"
                color={colors.text.tertiary}
                textAlign="center"
                fontSize="12px"
              >
                {member.work}
              </Footnote>
            </Box>
          )}

          {/* Social Links */}
          <HStack spacing={3} pt={2}>
            {member.github && (
              <MotionBox
                as="a"
                href={member.github}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon
                  as={FiGithub}
                  boxSize={5}
                  color={colors.text.secondary}
                  _hover={{ color: colors.brand.primary }}
                  transition="color 0.2s"
                  cursor="pointer"
                />
              </MotionBox>
            )}
            {member.linkedin && (
              <MotionBox
                as="a"
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.2, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon
                  as={FiLinkedin}
                  boxSize={5}
                  color={colors.text.secondary}
                  _hover={{ color: colors.brand.primary }}
                  transition="color 0.2s"
                  cursor="pointer"
                />
              </MotionBox>
            )}
            {member.email && (
              <MotionBox
                as="a"
                href={`mailto:${member.email}`}
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon
                  as={FiMail}
                  boxSize={5}
                  color={colors.text.secondary}
                  _hover={{ color: colors.brand.primary }}
                  transition="color 0.2s"
                  cursor="pointer"
                />
              </MotionBox>
            )}
          </HStack>
        </VStack>
      </Box>
    </MotionBox>
  );
}

/**
 * InfoPage - Beautiful "About Us" page with team cards, company info, and animations
 */
function InfoPage() {
  // Team members data
  const teamMembers = [
    {
      name: "Вольхин Данил",
      role: "Lead FullStack AI Developer",
      description: "Тимлид и архитектор проекта.",
      location: "Москва, Россия",
      work: "Sber|AtlasIT",
      github: "https://github.com/deneal123",
      email: "dfvolkhin@edu.hse.ru",
    },
    {
      name: "Ширшов Константин",
      role: "Backend Developer",
      description: "Он знает что такое Alembic.",
      location: "Москва, Россия",
      work: "Yandex",
      github: "https://github.com/sh1rsh0v",
      email: "keshirshov@edu.hse.ru",
    },
    {
      name: "Юрий Лю",
      role: "Frontend Developer",
      description: "Разрабатывал бегущие разноцветные полоски.",
      location: "Северный полюс, Россия",
      work: "В поисках работы",
      github: "https://github.com/Yurii-de",
      email: "yunlyu@edu.hse.ru",
    },
    {
      name: "Это ты",
      role: "New Team Member",
      description: "Присоединяйся к нам!",
      location: "Где угодно",
      work: "В поисках работы",
    },
  ];

  return (
    <Box
      as="main"
      bg={colors.background.darkPrimary}
      w="full"
      minH="100vh"
      position="relative"
      overflow="hidden"
    >
      {/* Gradient Particles Background */}
      <GradientParticles />

      {/* Hero Section */}
      <Box position="relative" zIndex={1} pt={{ base: 20, md: 28 }} pb={{ base: 16, md: 20 }}>
        <Container maxW="full" px={{ base: 4, md: 6, lg: 8 }} paddingTop={20}>
          <MotionVStack
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            spacing={spacing[6]}
            align="center"
            textAlign="center"
          >
            {/* Badge */}
            <MotionBox
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Badge
                bg={colors.blur.accent}
                color={colors.brand.primary}
                px={4}
                py={2}
                borderRadius={borderRadius.lg}
                fontSize="13px"
                fontWeight={500}
                border="1px solid"
                borderColor={colors.border.default}
              >
                О нашей команде
              </Badge>
            </MotionBox>

            {/* Main Title */}
            <Title
              variant="large"
              fontSize={{ base: "36px", md: "48px", lg: "56px" }}
              lineHeight="1.2"
              maxW="900px"
              paddingTop={4}
            >
              Мы студенты
              <br />
              <Box as="span" color={colors.brand.primary}>
                НИУ ВШЭ
              </Box>
            </Title>

            {/* Description */}
            <Body
              variant="large"
              fontSize={{ base: "16px", md: "18px" }}
              color={colors.text.secondary}
              maxW="800px"
              lineHeight="1.8"
            >
              Наша команда сформировалась в 2023 году и с тех пор успела принять участие в семи
              хакатонах, большинство из которых проходили в рамках проекта «Цифровой прорыв: Сезон
              искусственного интеллекта». TeleRAG — это концентрация хаоса, к которому мы так
              привыкли в процессе работы и обучения. Мы гордимся тем, что смогли объединить усилия и
              выкатить хоть какую-то работоспособную версию продукта.
            </Body>
          </MotionVStack>
        </Container>
      </Box>

      {/* Decorative Divider */}
      <Container maxW="full" px={{ base: 4, md: 6, lg: 8 }}>
        <SectionDivider variant="lightning" />
      </Container>

      {/* Team Section */}
      <Box position="relative" zIndex={1} py={{ base: 16, md: 20 }}>
        <Container maxW="full" px={{ base: 4, md: 6, lg: 8 }}>
          <MotionVStack
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            spacing={{ base: spacing[12], md: spacing[14] }}
          >
            {/* Section Title */}
            <VStack spacing={spacing[5]} textAlign="center" mb={{ base: 4, md: 6 }}>
              <Title variant="medium" fontSize={{ base: "28px", md: "36px" }}>
                Наша команда
              </Title>
              <Body
                variant="medium"
                color={colors.text.tertiary}
                maxW="700px"
                fontSize={{ base: "14px", md: "16px" }}
              >
                Вот они — бездари бигтеха слева направо:
              </Body>
            </VStack>

            {/* Team Grid */}
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 4 }}
              spacing={{ base: 8, md: 10, lg: 8 }}
              w="full"
              pt={{ base: 4, md: 6 }}
            >
              {teamMembers.map((member, index) => (
                <TeamMemberCard key={member.email} member={member} index={index} />
              ))}
            </SimpleGrid>
          </MotionVStack>
        </Container>
      </Box>

      {/* Decorative Divider */}
      <Container maxW="full" px={{ base: 4, md: 6, lg: 8 }}>
        <SectionDivider variant="electric" />
      </Container>

      {/* Company Info Section */}
      <Box position="relative" zIndex={1} py={{ base: 16, md: 20 }} pb={{ base: 20, md: 28 }}>
        <Container maxW="full" px={{ base: 4, md: 6, lg: 8 }}>
          <MotionVStack
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            spacing={{ base: spacing[12], md: spacing[14] }}
          >
            {/* About Project */}
            <VStack spacing={spacing[6]} textAlign="center" maxW="900px" mb={{ base: 6, md: 8 }}>
              <Title variant="medium" fontSize={{ base: "28px", md: "36px" }}>
                Преимущества TeleRAG
              </Title>
            </VStack>

            {/* Features Grid */}
            <SimpleGrid
              paddingRight={12}
              paddingLeft={12}
              columns={{ base: 1, md: 2, lg: 3 }}
              spacing={{ base: 8, md: 10, lg: 8 }}
              w="full"
              pt={{ base: 4, md: 6 }}
            >
              {[
                {
                  title: "🚀 Асинхронность",
                  description:
                    "Все ноды реализованы как асинхронные микросервисы для высокой производительности",
                },
                {
                  title: "🔧 Гибкость",
                  description:
                    "Визуальный билдер графов позволяет создавать сложные пайплайны без написания кода",
                },
                {
                  title: "📊 Масштабируемость",
                  description:
                    "Kafka и микросервисная архитектура позволяют обрабатывать много событий",
                },
                {
                  title: "🔒 Безопасность",
                  description:
                    "JWT-аутентификация, RBAC, TSL и шифрование данных для защиты информации",
                },
                {
                  title: "🎨 Приятный интерфейс",
                  description:
                    "Современный UI с анимациями, dark mode и адаптивный дизайн для всех устройств",
                },
                {
                  title: "🎯 Специализация",
                  description:
                    "Таргетный подход к RAG с возможностью кастомизации под задачи пользователя",
                },
              ].map((feature, i) => (
                <MotionBox
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Box
                    bg={colors.blur.medium}
                    border="1px solid"
                    borderColor={colors.border.default}
                    borderRadius={borderRadius.xl}
                    p={{ base: spacing[6], md: spacing[7], lg: spacing[8] }}
                    h="full"
                    minH={{ base: "220px", md: "240px" }}
                    backdropFilter="blur(20px)"
                    transition="all 0.3s ease"
                    _hover={{
                      borderColor: colors.brand.primary,
                      boxShadow: `0 0 30px ${colors.brand.primary}20`,
                    }}
                  >
                    <VStack spacing={spacing[4]} align="flex-start" h="full" padding={12}>
                      <Text fontSize="28px" lineHeight="1">
                        {feature.title.split(" ")[0]}
                      </Text>
                      <Footnote
                        variant="large"
                        color={colors.text.primary}
                        fontWeight={600}
                        fontSize="16px"
                      >
                        {feature.title.split(" ").slice(1).join(" ")}
                      </Footnote>
                      <Body
                        variant="small"
                        color={colors.text.tertiary}
                        fontSize={{ base: "13px", md: "14px" }}
                        lineHeight="1.75"
                      >
                        {feature.description}
                      </Body>
                    </VStack>
                  </Box>
                </MotionBox>
              ))}
            </SimpleGrid>

            {/* Tech Stack */}
            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              w="full"
              mt={{ base: spacing[10], md: spacing[12] }}
              paddingRight={12}
              paddingLeft={12}
              paddingBottom={12}
              paddingTop={12}
            >
              <Box
                bg={`linear-gradient(135deg, ${colors.blur.medium} 0%, ${colors.blur.light} 100%)`}
                border="1px solid"
                borderColor={colors.border.default}
                borderRadius={borderRadius["2xl"]}
                p={{ base: spacing[6], md: spacing[8] }}
                backdropFilter="blur(20px)"
                boxShadow={shadows.md}
              >
                <VStack spacing={spacing[6]}>
                  <Flex
                    flexWrap="wrap"
                    gap={3}
                    justify="center"
                    align="center"
                    maxW="800px"
                    pt={2}
                    pb={2}
                    margin="0 auto"
                    paddingBottom={12}
                    paddingTop={12}
                  >
                    {[
                      "FastAPI",
                      "Alembic",
                      "PostgreSQL",
                      "Kafka",
                      "React",
                      "Chakra UI",
                      "React Flow",
                      "Docker",
                      "Nginx",
                      "LangChain",
                      "Pydantic",
                      "Ollama",
                    ].map((tech, i) => (
                      <MotionBox
                        key={tech}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05, duration: 0.4 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Badge
                          bg={colors.blur.accent}
                          color={colors.text.primary}
                          px={4}
                          py={2}
                          borderRadius={borderRadius.lg}
                          fontSize="13px"
                          fontWeight={500}
                          border="1px solid"
                          borderColor={colors.border.default}
                          cursor="default"
                          transition="all 0.2s"
                          _hover={{
                            borderColor: colors.brand.primary,
                            boxShadow: `0 0 20px ${colors.brand.primary}30`,
                          }}
                        >
                          {tech}
                        </Badge>
                      </MotionBox>
                    ))}
                  </Flex>
                </VStack>
              </Box>
            </MotionBox>

            {/* Contact CTA */}
            <MotionVStack
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              spacing={spacing[4]}
              textAlign="center"
              pt={{ base: spacing[12], md: spacing[14], lg: spacing[16] }}
            >
              <Title variant="small" fontSize={{ base: "24px", md: "28px" }}>
                Появились вопросы?
              </Title>
              <Body
                variant="medium"
                color={colors.text.secondary}
                maxW="600px"
                fontSize={{ base: "14px", md: "16px" }}
              >
                Пишите в контакты организации github или напрямую разработчикам.
              </Body>
              <HStack spacing={4} pt={2}>
                <MotionBox whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Box
                    as="a"
                    href="https://github.com/Prischli-Drink-Coffee"
                    target="_blank"
                    rel="noopener noreferrer"
                    bg={colors.brand.primary}
                    color={colors.text.primary}
                    px={6}
                    py={3}
                    borderRadius={borderRadius.lg}
                    fontSize="15px"
                    fontWeight={600}
                    display="flex"
                    alignItems="center"
                    gap={2}
                    transition="all 0.2s"
                    _hover={{
                      bg: colors.brand.secondary,
                      boxShadow: `0 0 30px ${colors.brand.primary}40`,
                    }}
                  >
                    <Icon as={FiGithub} boxSize={5} />
                    GitHub
                  </Box>
                </MotionBox>
                <MotionBox whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Box
                    as="a"
                    href="https://vk.com/digtatordigtatorov"
                    bg={colors.blur.accent}
                    color={colors.text.primary}
                    px={6}
                    py={3}
                    borderRadius={borderRadius.lg}
                    fontSize="15px"
                    fontWeight={600}
                    display="flex"
                    alignItems="center"
                    gap={2}
                    border="1px solid"
                    borderColor={colors.border.default}
                    transition="all 0.2s"
                    _hover={{
                      borderColor: colors.brand.primary,
                      boxShadow: `0 0 20px ${colors.brand.primary}30`,
                    }}
                  >
                    <Icon as={FiMail} boxSize={5} />
                    Связаться
                  </Box>
                </MotionBox>
              </HStack>
            </MotionVStack>
          </MotionVStack>
        </Container>
      </Box>
    </Box>
  );
}

export default InfoPage;
