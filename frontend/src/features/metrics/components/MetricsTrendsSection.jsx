import React from "react";
import { Stack, Text, useColorModeValue } from "@chakra-ui/react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import Card from "../../../components/common/Card";

function ChartSkeleton() {
  return (
    <Card p={4} h="280px">
      <Text color="text.muted">Загружаем график...</Text>
    </Card>
  );
}

function AccuracyChart({ data, gridColor }) {
  return (
    <Card p={4}>
      <Text fontWeight="semibold" mb={2}>
        Тренд точности (accuracy)
      </Text>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
          <XAxis dataKey="ts" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="accuracy"
            name="Accuracy"
            stroke="#805AD5"
            strokeWidth={2}
            dot={false}
            isAnimationActive
            yAxisId={0}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

function R2Chart({ data, gridColor }) {
  return (
    <Card p={4}>
      <Text fontWeight="semibold" mb={2}>
        Тренд R²
      </Text>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
          <XAxis dataKey="ts" tick={{ fontSize: 12 }} />
          <YAxis domain={[-1, 1]} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="r2" name="R²" stroke="#38A169" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

function MetricsTrendsSection({ clsPoints, regPoints, isLoading }) {
  const gridColor = useColorModeValue("gray.200", "whiteAlpha.200");

  if (isLoading && !clsPoints.length && !regPoints.length) {
    return (
      <Stack spacing={4}>
        <ChartSkeleton />
        <ChartSkeleton />
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <AccuracyChart data={clsPoints} gridColor={gridColor} />
      <R2Chart data={regPoints} gridColor={gridColor} />
    </Stack>
  );
}

export default MetricsTrendsSection;
