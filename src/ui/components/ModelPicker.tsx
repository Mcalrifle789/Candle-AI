import React from "react";
import { Box, Text } from "ink";
import type { ModelInfo } from "../../core/models.js";

export function ModelPicker({
  models,
  selected,
  filter,
}: {
  models: ModelInfo[];
  selected: number;
  filter: string;
}): React.ReactElement {
  const windowSize = 14;
  const start = Math.max(0, Math.min(selected - 6, Math.max(0, models.length - windowSize)));
  const visible = models.slice(start, start + windowSize);

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="yellow"
      paddingX={1}
      width="100%"
      marginBottom={1}
    >
      <Text color="yellow" bold>
        Models [{models.length}]  filter: {filter || "(all)"}
      </Text>
      <Text dimColor>↑↓ scroll · Enter select · a add custom · Esc close</Text>
      {visible.map((m, idx) => {
        const realIndex = start + idx;
        const active = realIndex === selected;
        return (
          <Box key={`${m.provider}:${m.id}`}>
            <Text color={active ? "black" : "white"} backgroundColor={active ? "yellow" : undefined}>
              {active ? "▸ " : "  "}
              {m.name.padEnd(28).slice(0, 28)}{" "}
              <Text color={active ? "black" : "cyan"}>{m.provider}</Text>{" "}
              <Text dimColor={!active}>{m.id}</Text>
              {m.isCustom ? " ★" : ""}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
