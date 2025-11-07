import React from "react";
import { Box, Text, Tooltip, useColorModeValue } from "@chakra-ui/react";
import { Handle, Position } from "@xyflow/react";

function PortHandle({ id, type, label, position, tooltip, dimmed, emphasized }) {
  const bg = useColorModeValue("gray.200", "gray.600");
  const activeBg = useColorModeValue("blue.500", "blue.300");
  const baseStyle = { width: 10, height: 10, background: bg, border: "1px solid #fff" };
  const style = {
    ...baseStyle,
    opacity: dimmed ? 0.3 : 1,
    boxShadow: emphasized ? "0 0 0 2px rgba(49,130,206,0.6)" : undefined,
    background: emphasized ? activeBg : bg,
  };
  return (
    <Tooltip label={tooltip} placement="top" hasArrow>
      <Handle id={id} type={type} position={position} style={style} />
    </Tooltip>
  );
}

function GraphNodeComponent({ data }) {
  const title = data?.label || data?.type || "node";
  const inputs = data?.__inputs || {};
  const outputs = data?.__outputs || {};
  const highlightMode = data?.__highlightMode; // 'targets' | 'sources' | undefined
  const allowedTargets = data?.__allowedTargets || [];
  const allowedSources = data?.__allowedSources || [];
  const connecting = Boolean(data?.__connecting);

  return (
    <Box borderWidth="1px" borderRadius="md" p={2} bg={useColorModeValue("white", "gray.700")}>
      <Text fontSize="sm" fontWeight="medium" mb={2}>
        {title}
      </Text>
      {/* Left inputs */}
      <Box position="relative">
        {Object.entries(inputs).map(([key, schema]) => {
          const emphasized =
            connecting && highlightMode === "targets" && allowedTargets.includes(key);
          const dimmed = connecting && highlightMode === "targets" && !allowedTargets.includes(key);
          return (
            <PortHandle
              key={key}
              id={key}
              type="target"
              position={Position.Left}
              label={key}
              tooltip={`in ${key}: ${schema.type || "any"}`}
              dimmed={dimmed}
              emphasized={emphasized}
            />
          );
        })}
        {Object.entries(outputs).map(([key, schema]) => {
          const emphasized =
            connecting && highlightMode === "sources" && allowedSources.includes(key);
          const dimmed = connecting && highlightMode === "sources" && !allowedSources.includes(key);
          return (
            <PortHandle
              key={key}
              id={key}
              type="source"
              position={Position.Right}
              label={key}
              tooltip={`out ${key}: ${schema.type || "any"}`}
              dimmed={dimmed}
              emphasized={emphasized}
            />
          );
        })}
      </Box>
    </Box>
  );
}

const GraphNode = React.memo(GraphNodeComponent);
export default GraphNode;
