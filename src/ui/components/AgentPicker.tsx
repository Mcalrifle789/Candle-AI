import React from "react";
import { Box, Text } from "ink";
import type { AgentDefinition } from "../../core/agents.js";

export function AgentPicker({
  agents,
  selected,
  activeId,
}: {
  agents: AgentDefinition[];
  selected: number;
  activeId: string;
}): React.ReactElement {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="magenta"
      paddingX={1}
      width="100%"
      marginBottom={1}
    >
      <Text color="magenta" bold>
        Switch Agent
      </Text>
      <Text dimColor>↑↓ · Enter select · Esc close</Text>
      {agents.map((a, i) => {
        const active = i === selected;
        const current = a.id === activeId;
        return (
          <Box key={a.id}>
            <Text
              color={active ? "black" : "white"}
              backgroundColor={active ? "magenta" : undefined}
            >
              {active ? "▸ " : "  "}
              {current ? "● " : "○ "}
              {a.title.padEnd(16)} {a.description.slice(0, 50)}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
