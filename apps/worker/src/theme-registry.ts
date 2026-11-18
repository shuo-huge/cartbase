import type { ThemeDefinition } from "@cartbase/theme-sdk";
import defaultTheme from "@cartbase/theme-default";
import fashionTheme from "@cartbase/theme-fashion";
import beautyTheme from "@cartbase/theme-beauty";
import electronicsTheme from "@cartbase/theme-electronics";
import jewelryTheme from "@cartbase/theme-jewelry";
import homeTheme from "@cartbase/theme-home";
import sportsTheme from "@cartbase/theme-sports";
import singleProductTheme from "@cartbase/theme-single-product";

/**
 * Themes are bundled at build time. Adding a theme requires a rebuild; the
 * admin can only activate or configure themes present in this registry.
 */
const themes = new Map<string, ThemeDefinition>();

function register(theme: ThemeDefinition): void {
  themes.set(theme.manifest.id, theme);
}

register(defaultTheme);
register(fashionTheme);
register(beautyTheme);
register(electronicsTheme);
register(jewelryTheme);
register(homeTheme);
register(sportsTheme);
register(singleProductTheme);

export function getThemeDefinition(id: string): ThemeDefinition {
  return themes.get(id) ?? defaultTheme;
}

export function listThemeDefinitions(): ThemeDefinition[] {
  return [...themes.values()];
}

export function hasTheme(id: string): boolean {
  return themes.has(id);
}
