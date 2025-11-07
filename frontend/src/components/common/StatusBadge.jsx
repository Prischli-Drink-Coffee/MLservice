import React from "react";
import { Badge } from "@chakra-ui/react";

export default function StatusBadge({ ok, ...rest }) {
  if (ok == null)
    return (
      <Badge colorScheme="gray" {...rest}>
        unknown
      </Badge>
    );
  return ok ? (
    <Badge colorScheme="green" {...rest}>
      healthy
    </Badge>
  ) : (
    <Badge colorScheme="red" {...rest}>
      unhealthy
    </Badge>
  );
}
