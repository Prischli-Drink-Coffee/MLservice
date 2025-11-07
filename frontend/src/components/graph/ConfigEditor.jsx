import React from "react";
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Select,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { tokens } from "../../theme/tokens";

/**
 * ConfigEditor - динамический редактор конфигурационных полей ноды
 * Отображает поля на основе config_schema из бэкенда
 */
const ConfigEditor = ({ configSchema, configValues, onChange }) => {
  if (!configSchema || Object.keys(configSchema).length === 0) {
    return null;
  }

  const handleFieldChange = (fieldName, value) => {
    onChange({
      ...configValues,
      [fieldName]: value,
    });
  };

  const renderField = (fieldName, field) => {
    const currentValue = configValues?.[fieldName] ?? field.default;

    // Boolean field (Switch)
    if (field.type === "boolean") {
      return (
        <FormControl
          key={fieldName}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box flex={1} mr={2}>
            <FormLabel fontSize="9px" fontWeight="600" color={tokens.colors.text.primary} mb={0.5}>
              {field.title || fieldName}
              {field.required && (
                <Text as="span" color={tokens.colors.error}>
                  {" "}
                  *
                </Text>
              )}
            </FormLabel>
            {field.description && (
              <Text fontSize="8px" color={tokens.colors.text.tertiary}>
                {field.description}
              </Text>
            )}
          </Box>
          <Switch
            size="sm"
            isChecked={currentValue === true}
            onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
            colorScheme="purple"
          />
        </FormControl>
      );
    }

    // Number field
    if (field.type === "number") {
      return (
        <FormControl key={fieldName}>
          <FormLabel fontSize="9px" fontWeight="600" color={tokens.colors.text.primary} mb={1}>
            {field.title || fieldName}
            {field.required && (
              <Text as="span" color={tokens.colors.error}>
                {" "}
                *
              </Text>
            )}
          </FormLabel>
          {field.description && (
            <Text fontSize="8px" color={tokens.colors.text.tertiary} mb={1}>
              {field.description}
            </Text>
          )}
          <NumberInput
            size="sm"
            value={currentValue ?? ""}
            onChange={(valueString, valueNumber) => handleFieldChange(fieldName, valueNumber)}
            min={field.minimum}
            max={field.maximum}
            step={field.type === "number" && field.maximum && field.maximum <= 1 ? 0.1 : 1}
          >
            <NumberInputField
              fontSize="10px"
              bg={tokens.colors.blur.light}
              border="1px solid"
              borderColor={tokens.colors.border.subtle}
              borderRadius={tokens.borderRadius.sm}
              color={tokens.colors.text.primary}
              _focus={{
                borderColor: tokens.colors.brand.primary,
                boxShadow: `0 0 0 1px ${tokens.colors.brand.primary}`,
              }}
            />
            <NumberInputStepper>
              <NumberIncrementStepper border="none" color={tokens.colors.text.tertiary} />
              <NumberDecrementStepper border="none" color={tokens.colors.text.tertiary} />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
      );
    }

    // Enum field (Select)
    if (field.enum && field.enum.length > 0) {
      return (
        <FormControl key={fieldName}>
          <FormLabel fontSize="9px" fontWeight="600" color={tokens.colors.text.primary} mb={1}>
            {field.title || fieldName}
            {field.required && (
              <Text as="span" color={tokens.colors.error}>
                {" "}
                *
              </Text>
            )}
          </FormLabel>
          {field.description && (
            <Text fontSize="8px" color={tokens.colors.text.tertiary} mb={1}>
              {field.description}
            </Text>
          )}
          <Select
            size="sm"
            value={currentValue ?? ""}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            fontSize="10px"
            bg={tokens.colors.blur.light}
            border="1px solid"
            borderColor={tokens.colors.border.subtle}
            borderRadius={tokens.borderRadius.sm}
            color={tokens.colors.text.primary}
            _focus={{
              borderColor: tokens.colors.brand.primary,
              boxShadow: `0 0 0 1px ${tokens.colors.brand.primary}`,
            }}
          >
            {field.enum.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </FormControl>
      );
    }

    // String field (Input)
    return (
      <FormControl key={fieldName}>
        <FormLabel fontSize="9px" fontWeight="600" color={tokens.colors.text.primary} mb={1}>
          {field.title || fieldName}
          {field.required && (
            <Text as="span" color={tokens.colors.error}>
              {" "}
              *
            </Text>
          )}
        </FormLabel>
        {field.description && (
          <Text fontSize="8px" color={tokens.colors.text.tertiary} mb={1}>
            {field.description}
          </Text>
        )}
        <Input
          size="sm"
          value={currentValue ?? ""}
          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
          placeholder={field.default || ""}
          minLength={field.minLength}
          maxLength={field.maxLength}
          fontSize="10px"
          bg={tokens.colors.blur.light}
          border="1px solid"
          borderColor={tokens.colors.border.subtle}
          borderRadius={tokens.borderRadius.sm}
          color={tokens.colors.text.primary}
          _focus={{
            borderColor: tokens.colors.brand.primary,
            boxShadow: `0 0 0 1px ${tokens.colors.brand.primary}`,
          }}
        />
      </FormControl>
    );
  };

  return (
    <VStack align="stretch" spacing={2} w="full">
      {Object.entries(configSchema).map(([fieldName, field]) => renderField(fieldName, field))}
    </VStack>
  );
};

export default React.memo(ConfigEditor);
