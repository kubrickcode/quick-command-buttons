/**
 * Renders a VS Code codicon via @vscode/codicons.
 *
 * Label parsing lives in `shared/parse-icon-label` so the webview and the
 * extension host agree on icon syntax.
 */

type VSCodeIconProps = {
  className?: string;
  name: string;
  spin?: boolean;
};

export const VSCodeIcon = ({ className, name, spin }: VSCodeIconProps) => (
  <i
    aria-hidden="true"
    className={`codicon codicon-${name}${spin ? " codicon-spin" : ""}${className ? ` ${className}` : ""}`}
  />
);
