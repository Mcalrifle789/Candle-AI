import React from "react";
import { Box, Text } from "ink";
import gradient from "gradient-string";

const logoGradient = gradient(["#FFD700", "#FFE66D", "#7FDBFF", "#00E5FF"]);
const tagGradient = gradient(["#FFD700", "#00E5FF"]);

const LOGO_LINES = [
  "   ██████╗ █████╗ ███╗   ██╗██████╗ ██╗     ███████╗     █████╗ ██╗",
  "  ██╔════╝██╔══██╗████╗  ██║██╔══██╗██║     ██╔════╝    ██╔══██╗██║",
  "  ██║     ███████║██╔██╗ ██║██║  ██║██║     █████╗      ███████║██║",
  "  ██║     ██╔══██║██║╚██╗██║██║  ██║██║     ██╔══╝      ██╔══██║██║",
  "  ╚██████╗██║  ██║██║ ╚████║██████╔╝███████╗███████╗    ██║  ██║██║",
  "   ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚══════╝    ╚═╝  ╚═╝╚═╝",
];

export function Logo(): React.ReactElement {
  return (
    <Box flexDirection="column" alignItems="center" marginY={1}>
      <Text>{logoGradient("        ✦  ~  spiral of light  ~  ✦")}</Text>
      {LOGO_LINES.map((line, i) => (
        <Text key={i}>{logoGradient(line)}</Text>
      ))}
      <Box marginTop={1}>
        <Text>{tagGradient("Light up the way for your ideas")}</Text>
      </Box>
    </Box>
  );
}

export function CompactLogo(): React.ReactElement {
  return (
    <Box flexDirection="column" alignItems="center" marginBottom={1}>
      <Text bold>{logoGradient("Candle AI")}</Text>
      <Text dimColor>{tagGradient("Light up the way for your ideas")}</Text>
    </Box>
  );
}
