import React from "react";
import { Box, Text } from "ink";
import type { ChatMessage } from "../../core/sessions.js";

export function MessageList({
  messages,
  max = 12,
}: {
  messages: ChatMessage[];
  max?: number;
}): React.ReactElement {
  const slice = messages.slice(-max);
  return (
    <Box flexDirection="column" width="100%" marginY={1}>
      {slice.map((m) => (
        <Box key={m.id} flexDirection="column" marginBottom={1}>
          <Text bold color={m.role === "user" ? "yellow" : m.role === "assistant" ? "cyan" : "gray"}>
            {m.role === "user" ? "You" : m.role === "assistant" ? "Candle AI" : "System"}
          </Text>
          <Text wrap="wrap">{m.content}</Text>
        </Box>
      ))}
    </Box>
  );
}
