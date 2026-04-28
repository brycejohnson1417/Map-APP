import type { ScreenprintingConfig, ScreenprintingFeatureKey } from "@/lib/application/screenprinting/config";
import { screenprintingFeatureKeys } from "@/lib/application/screenprinting/config";

export type ScreenprintingFeatureFlags = Record<ScreenprintingFeatureKey, boolean>;

export function resolveScreenprintingFeatureFlags(config: ScreenprintingConfig): ScreenprintingFeatureFlags {
  return screenprintingFeatureKeys.reduce((flags, key) => {
    flags[key] = config.featureFlags[key] === true;
    return flags;
  }, {} as ScreenprintingFeatureFlags);
}

export function isScreenprintingFeatureEnabled(config: ScreenprintingConfig, key: ScreenprintingFeatureKey) {
  return resolveScreenprintingFeatureFlags(config)[key];
}

export function disabledScreenprintingCapabilities(config: ScreenprintingConfig) {
  const flags = resolveScreenprintingFeatureFlags(config);
  return screenprintingFeatureKeys.filter((key) => !flags[key]);
}
