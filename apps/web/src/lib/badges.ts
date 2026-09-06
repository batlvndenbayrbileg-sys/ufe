/**
 * Display labels for the course's achievement badges — one per stage, keyed by
 * the stage's `badgeId` in course.json and awarded on each stage's final lesson.
 * Kept in one place so the completion card and the dashboard agree.
 */
export const BADGE_LABEL: Record<string, string> = {
  "first-website": "🏆 Анхны вэб",
  "js-starter": "⚡ JavaScript эхлэл",
  "react-dev": "⚛️ React хөгжүүлэгч",
  "router-builder": "🧭 Router эзэн",
  "api-caller": "🔌 API холбогч",
  "sql-reader": "🗄️ SQL уншигч",
  "backend-builder": "🖥️ Backend бүтээгч",
  "auth-builder": "🔐 Нэвтрэлтийн эзэн",
  shipper: "🚀 Deploy хийгч",
  "test-writer": "🧪 Тест бичигч",
  "a11y-advocate": "♿ Хүртээмжийн төлөө",
  "type-safe": "🛡️ Type-safe",
  "shop-mn-builder": "👑 Shop.mn бүтээгч",
};

/** Human label for a badge id, falling back to the id itself if unknown. */
export function badgeLabel(id: string): string {
  return BADGE_LABEL[id] ?? id;
}
