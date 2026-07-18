import React from "react";
import { Box, Text } from "ink";
import type { Skill } from "../../skills/index.js";

export function SkillsMenu({
  skills,
  selected,
  query,
}: {
  skills: Skill[];
  selected: number;
  query: string;
}): React.ReactElement {
  const windowSize = 12;
  const start = Math.max(0, Math.min(selected - 5, Math.max(0, skills.length - windowSize)));
  const visible = skills.slice(start, start + windowSize);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={1}
      width="100%"
      marginBottom={1}
    >
      <Text color="yellow" bold>
        Skills [{skills.length}]  filter: /{query}
      </Text>
      <Text dimColor>↑↓ scroll · Tab/Enter select · Esc close</Text>
      {visible.length === 0 ? (
        <Text color="red">No matching skills</Text>
      ) : (
        visible.map((s, idx) => {
          const realIndex = start + idx;
          const active = realIndex === selected;
          return (
            <Box key={s.command}>
              <Text color={active ? "black" : "white"} backgroundColor={active ? "cyan" : undefined}>
                {active ? "▸ " : "  "}
                {s.command.padEnd(16)} {s.description.slice(0, 60)}
              </Text>
            </Box>
          );
        })
      )}
    </Box>
  );
}
