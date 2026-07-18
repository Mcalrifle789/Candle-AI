import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { CandleLoader } from "./CandleLoader.js";

export function ChatBox({
  value,
  onChange,
  onSubmit,
  loading,
  placeholder = "Ask anything...",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  loading: boolean;
  placeholder?: string;
}): React.ReactElement {
  return (
    <Box flexDirection="column" width="100%">
      {loading ? (
        <Box marginBottom={0} marginLeft={1}>
          <CandleLoader label="Candle AI is thinking" />
        </Box>
      ) : null}
      <Box
        borderStyle="round"
        borderColor="cyan"
        width="100%"
        paddingX={1}
        flexDirection="row"
      >
        <Text color="yellow" bold>
          {">> "}
        </Text>
        <Box flexGrow={1}>
          <TextInput
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
            placeholder={placeholder}
            showCursor
            focus={!loading}
          />
        </Box>
        <Text color="cyan"> {">"} </Text>
      </Box>
    </Box>
  );
}
