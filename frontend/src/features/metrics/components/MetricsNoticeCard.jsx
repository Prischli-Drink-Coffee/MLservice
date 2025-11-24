import React from "react";
import { SkeletonText, Text } from "@chakra-ui/react";
import Card from "@ui/molecules/Card";

function MetricsNoticeCard({ children = null, isSkeleton = false }) {
  return (
    <Card p={4}>
      {isSkeleton ? <SkeletonText noOfLines={3} spacing={3} /> : <Text color="text.muted">{children}</Text>}
    </Card>
  );
}

export default MetricsNoticeCard;
