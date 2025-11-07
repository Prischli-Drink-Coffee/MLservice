import React, { useCallback } from "react";
import { HStack, IconButton, Textarea, Tooltip, useToast } from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";

function JsonEditor({
  value,
  onChange,
  placeholder = '{\n  "key": "value"\n}',
  isInvalid = false,
}) {
  const toast = useToast();

  const formatJson = useCallback(() => {
    try {
      if (!value) return;
      const parsed = JSON.parse(value);
      const pretty = JSON.stringify(parsed, null, 2);
      onChange(pretty);
      toast({
        title: "Formatted",
        description: "JSON was formatted successfully",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: error.message,
        status: "error",
        duration: 3000,
      });
    }
  }, [onChange, toast, value]);

  return (
    <>
      <HStack justify="flex-end" mb={2}>
        <Tooltip label="Format JSON">
          <IconButton
            icon={<RepeatIcon />}
            size="sm"
            onClick={formatJson}
            aria-label="Format JSON"
          />
        </Tooltip>
      </HStack>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        fontFamily="mono"
        minH="200px"
        isInvalid={isInvalid}
      />
    </>
  );
}

export default JsonEditor;
