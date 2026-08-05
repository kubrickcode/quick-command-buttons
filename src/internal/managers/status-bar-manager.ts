import * as vscode from "vscode";
import { ButtonConfig } from "../../pkg/types";
import { COMMANDS } from "../../shared/constants";
import { parseIconLabel } from "../../shared/parse-icon-label";
import { ConfigReader, StatusBarCreator } from "../adapters";
import { getAppStore } from "../stores/app-store";
import type { AppStoreInstance } from "../stores/app-store";

const SET_INDICATOR_PRIORITY = 1002;

type StoreSlice = { activeSet: string | null; buttons: ButtonConfig[] };

const shallowEqual = (a: StoreSlice, b: StoreSlice): boolean =>
  a.activeSet === b.activeSet && a.buttons === b.buttons;

export const calculateButtonPriority = (index: number): number => {
  return 1000 - index;
};

// Falls back to the full name when iconOnly is set without icon syntax, so a button never becomes invisible
export const createStatusBarText = (button: ButtonConfig): string => {
  if (!button.iconOnly) return button.name;

  const { iconToken } = parseIconLabel(button.name);
  return iconToken ?? button.name;
};

export const createTooltipText = (button: ButtonConfig): string => {
  if (button.group) return `${button.name} (Click to see options)`;
  if (!button.command) return button.name;
  if (!button.iconOnly) return button.command;

  const { displayText } = parseIconLabel(button.name);
  return displayText ? `${displayText}: ${button.command}` : button.command;
};

export const createButtonCommand = (button: ButtonConfig) => ({
  arguments: [button],
  command: "quickCommandButtons.execute",
  title: "Execute Command",
});

type RefreshConfig = {
  color: string;
  enabled: boolean;
  icon: string;
};

export const configureRefreshButton = (
  button: vscode.StatusBarItem,
  refreshConfig: RefreshConfig
) => {
  button.text = refreshConfig.icon;
  button.tooltip = "Refresh Quick Command Buttons";
  button.command = "quickCommandButtons.refresh";
  button.color = refreshConfig.color;
};

export const configureSetIndicator = (
  button: vscode.StatusBarItem,
  activeSetName: string | null
) => {
  const displayName = activeSetName ?? vscode.l10n.t("Default");
  button.text = `$(layers) [${displayName}]`;
  button.tooltip = vscode.l10n.t("Current Set: {0} (Click to switch)", displayName);
  button.command = COMMANDS.SWITCH_BUTTON_SET;
};

export class StatusBarManager implements vscode.Disposable {
  private readonly configReader: ConfigReader;
  private readonly statusBarCreator: StatusBarCreator;
  private statusBarItems: vscode.StatusBarItem[] = [];
  private readonly store: AppStoreInstance;
  private storeUnsubscribe?: () => void;

  private constructor(deps: {
    configReader: ConfigReader;
    statusBarCreator: StatusBarCreator;
    store?: AppStoreInstance;
  }) {
    this.configReader = deps.configReader;
    this.statusBarCreator = deps.statusBarCreator;
    this.store = deps.store ?? getAppStore();
    this.setupStoreSubscription();
  }

  static create = (deps: {
    configReader: ConfigReader;
    statusBarCreator: StatusBarCreator;
    store?: AppStoreInstance;
  }): StatusBarManager => new StatusBarManager(deps);

  dispose = () => {
    this.disposeStatusBarItems();
    this.storeUnsubscribe?.();
  };

  refreshButtons = () => {
    this.disposeStatusBarItems();
    this.createSetIndicator();
    this.createRefreshButton();
    this.createCommandButtons();
  };

  private createCommandButtons = () => {
    const buttons = this.store.getState().buttons;

    buttons.forEach((button, index) => {
      const statusBarItem = this.statusBarCreator(
        vscode.StatusBarAlignment.Left,
        calculateButtonPriority(index)
      );

      statusBarItem.text = createStatusBarText(button);
      statusBarItem.tooltip = createTooltipText(button);

      if (button.color) {
        statusBarItem.color = button.color;
      }

      statusBarItem.command = createButtonCommand(button);

      statusBarItem.show();
      this.statusBarItems.push(statusBarItem);
    });
  };

  private createRefreshButton = () => {
    const refreshConfig = this.configReader.getRefreshConfig();

    if (!refreshConfig.enabled) return;

    const refreshButton = this.statusBarCreator(vscode.StatusBarAlignment.Left, 1001);

    configureRefreshButton(refreshButton, refreshConfig);

    refreshButton.show();
    this.statusBarItems.push(refreshButton);
  };

  private createSetIndicator = () => {
    const setIndicatorConfig = this.configReader.getSetIndicatorConfig();

    if (!setIndicatorConfig.enabled) return;

    const setIndicator = this.statusBarCreator(
      vscode.StatusBarAlignment.Left,
      SET_INDICATOR_PRIORITY
    );

    const activeSet = this.store.getState().activeSet;
    configureSetIndicator(setIndicator, activeSet);

    setIndicator.show();
    this.statusBarItems.push(setIndicator);
  };

  private disposeStatusBarItems = () => {
    this.statusBarItems.forEach((item) => item.dispose());
    this.statusBarItems = [];
  };

  private setupStoreSubscription = () => {
    this.storeUnsubscribe = this.store.subscribe(
      (state) => ({ activeSet: state.activeSet, buttons: state.buttons }),
      () => {
        try {
          this.refreshButtons();
        } catch (error) {
          console.error("[StatusBarManager] Failed to refresh buttons:", error);
        }
      },
      { equalityFn: shallowEqual }
    );
  };
}
