// localStorage keys of the workspace. Kept stable so existing users keep their work across releases.
export const STORAGE_KEYS = {
  tabs: 'liveschema_tabs',
  activeTab: 'liveschema_active_tab',
  positions: 'liveschema_positions',
  layout: 'liveschema_layout',
  theme: 'liveschema_theme',
} as const;

/** Remove the saved workspace (tabs, positions, layout); the theme is kept */
export function clearWorkspace() {
  try {
    for (const [name, key] of Object.entries(STORAGE_KEYS)) {
      if (name !== 'theme') localStorage.removeItem(key);
    }
  } catch { /* storage blocked */ }
}
