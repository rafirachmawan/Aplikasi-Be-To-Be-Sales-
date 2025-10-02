import { MD3DarkTheme, MD3Theme } from "react-native-paper";

export const theme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#7C3AED", // purple elegan
    secondary: "#22C55E", // success
    background: "#0B1220", // dark base
    surface: "#121A2A", // card
    surfaceVariant: "#1A2336", // section
    outline: "#243048", // border
    onSurface: "#E5E7EB", // text
  },
  roundness: 14,
};
