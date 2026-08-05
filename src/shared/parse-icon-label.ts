/**
 * Parses VS Code codicon syntax from a button label.
 *
 * VS Code renders `$(icon-name)` as an icon in status bar text, with an
 * optional `~spin` modifier for animation.
 *
 * @example
 * parseIconLabel("$(terminal) Test")   // { displayText: "Test", iconName: "terminal", iconToken: "$(terminal)", spin: false }
 * parseIconLabel("$(gear~spin) Build") // { displayText: "Build", iconName: "gear", iconToken: "$(gear~spin)", spin: true }
 */

const ICON_PATTERN = /^\$\(([^)]+)\)\s*/;
const SPIN_MODIFIER = "~spin";

export type ParsedIconLabel = {
  displayText: string;
  iconName?: string;
  iconToken?: string;
  spin: boolean;
};

export const parseIconLabel = (label: string): ParsedIconLabel => {
  const match = label.match(ICON_PATTERN);

  if (!match) {
    return { displayText: label, spin: false };
  }

  const rawIconName = match[1];

  return {
    displayText: label.slice(match[0].length).trim(),
    iconName: rawIconName.replace(SPIN_MODIFIER, ""),
    iconToken: `$(${rawIconName})`,
    spin: rawIconName.includes(SPIN_MODIFIER),
  };
};
