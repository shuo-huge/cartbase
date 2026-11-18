import { PluginRegistry } from "@cartbase/core";
import type { PaymentPlugin } from "@cartbase/plugin-sdk";
import { manifest as manualPaymentManifest, manualPaymentPlugin } from "@cartbase/plugin-manual-payment";
import { manifest as adminI18nManifest } from "@cartbase/plugin-admin-i18n";
import { manifest as emailNotificationsManifest } from "@cartbase/plugin-email-notifications";
import stripePaymentPlugin from "@cartbase/plugin-stripe";
import paypalPaymentPlugin from "@cartbase/plugin-paypal";

/**
 * Build-time plugin registry. Only plugins listed here are bundled into the
 * Worker; the admin can enable/disable them but cannot upload new code.
 */
export const pluginRegistry = new PluginRegistry([
  manualPaymentManifest,
  stripePaymentPlugin.manifest,
  paypalPaymentPlugin.manifest,
  adminI18nManifest,
  emailNotificationsManifest,
]);

const paymentPlugins = new Map<string, PaymentPlugin>([
  [manualPaymentPlugin.manifest.id, manualPaymentPlugin as PaymentPlugin],
  [stripePaymentPlugin.manifest.id, stripePaymentPlugin as PaymentPlugin],
  [paypalPaymentPlugin.manifest.id, paypalPaymentPlugin as PaymentPlugin],
]);

export function getPaymentPlugin(id: string): PaymentPlugin | null {
  return paymentPlugins.get(id) ?? null;
}
