// @khiye/ui — design system (E1). See docs/blueprint/14-design-system.md.
// Import the global tokens once in your app: `@khiye/ui/styles/tokens.css`.

// lib
export { cn, type ClassValue } from "./lib/cn";
export { contrastRatio, relativeLuminance, parseHex, type Rgb } from "./lib/contrast";

// theme
export { ThemeProvider, useTheme, type ThemeProviderProps } from "./theme/ThemeProvider";
export { ThemeScript } from "./theme/ThemeScript";
export {
  themeInitScript,
  applyTheme,
  resolveTheme,
  systemPrefersDark,
  THEME_STORAGE_KEY,
  type Theme,
  type ResolvedTheme,
} from "./theme/theme-core";

// components
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from "./components/Button";
export { IconButton, type IconButtonProps } from "./components/IconButton";
export { Badge, type BadgeProps, type BadgeTone } from "./components/Badge";
export { Input, type InputProps } from "./components/Input";
export { Alert, type AlertProps, type AlertTone } from "./components/Alert";
export { Card, type CardProps } from "./components/Card";
export { Separator, type SeparatorProps } from "./components/Separator";
export { Skeleton, type SkeletonProps } from "./components/Skeleton";
export { Spinner, type SpinnerProps } from "./components/Spinner";
export { ProgressBar, type ProgressBarProps } from "./components/ProgressBar";
export { ProgressRing, type ProgressRingProps } from "./components/ProgressRing";
export { Kbd } from "./components/Kbd";
export { Switch, type SwitchProps } from "./components/Switch";
export { ThemeToggle } from "./components/ThemeToggle";

// layouts
export { AppShell, type AppShellProps } from "./layouts/AppShell";
export { AuthShell, type AuthShellProps } from "./layouts/AuthShell";
export { WorkspaceShell, type WorkspaceShellProps } from "./layouts/WorkspaceShell";
export {
  clampInstructions,
  clampPreview,
  fitToContainer,
  DEFAULT_PANE_SIZES,
  type PaneSizes,
} from "./layouts/pane-sizing";
