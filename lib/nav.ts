/**
 * Navigation is now derived from the module registry so that a
 * customer only ever sees the modules their business category
 * is entitled to. See lib/modules.ts for the category mapping.
 *
 * `navSections` is kept as the full, unfiltered list for backwards
 * compatibility with anything that still imports it.
 */
export {
  MODULES as navSections,
  MODULES,
  CATEGORY_MODULES,
  modulesForCategory,
  moduleKeysForCategory,
  canAccessModule,
  moduleKeyFromPath,
} from "@/lib/modules";

export type { AppModule, ModuleKey } from "@/lib/modules";
