// The site has two pages, served by the same index.html (see the rewrite in vercel.json):
//   /      landing page
//   /app   the editor
export const EDITOR_PATH = '/app';

export function isEditorPath(pathname: string): boolean {
  return pathname === EDITOR_PATH || pathname.startsWith(`${EDITOR_PATH}/`);
}
