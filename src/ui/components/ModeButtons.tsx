import React from "react";
import { Box, Text } from "ink";

export function ModeButtons({
  mode,
  focused,
}: {
  mode: "build" | "plan";
  focused: "build" | "plan" | null;
}): React.ReactElement {
  const buildActive = mode === "build";
  const planActive = mode === "plan";

  return (
    <Box gap={2}>
      <Box
        borderStyle="round"
        borderColor={focused === "build" ? "white" : buildActive ? "yellow" : "gray"}
        paddingX={2}
      >
        <Text
          bold={buildActive || focused === "build"}
          color={buildActive ? "yellow" : focused === "build" ? "white" : "gray"}
        >
          ✦ BUILD
        </Text>
      </Box>
      <Box
        borderStyle="round"
        borderColor={focused === "plan" ? "white" : planActive ? "cyan" : "gray"}
        paddingX={2}
      >
        <Text
          bold={planActive || focused === "plan"}
          color={planActive ? "cyan" : focused === "plan" ? "white" : "gray"}
        >
         ◈ PLAN
        </Text>
      </Box>
      <Text dimColor>  (Tab cycle · Enter select)</Text>
    </Box>
  );
}
