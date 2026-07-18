import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";

const FRAMES = ["🕯️", "🟡", "🔥", "✨", "🕯️", "🟠", "🔥", "💫"];

export function CandleLoader({ label = "thinking" }: { label?: string }): React.ReactElement {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % FRAMES.length), 120);
    return () => clearInterval(t);
  }, []);
  return (
    <Box>
      <Text>{FRAMES[i]} </Text>
      <Text color="yellow">{label}</Text>
      <Text color="cyan">…</Text>
    </Box>
  );
}
