/**
 * Per-course intro decks — a code-free, slide-based "what is this & why" tour
 * shown before a learner's first lesson. Pure data; rendered by CourseIntro.tsx.
 * Presentation-style: history, real-world uses, companies, the stack, roadmap.
 */

export type IntroSlide =
  | { kind: "hero"; emoji: string; kicker: string; title: string; subtitle: string; note: string }
  | { kind: "what"; title: string; lead: string; points: Array<{ emoji: string; label: string; text: string }> }
  | { kind: "history"; title: string; lead: string; events: Array<{ year: string; title: string; text: string }> }
  | { kind: "uses"; title: string; lead: string; cards: Array<{ emoji: string; title: string; text: string }> }
  | { kind: "companies"; title: string; lead: string; names: Array<{ name: string; hint: string }> }
  | { kind: "tech"; title: string; lead: string; items: Array<{ name: string; tag: string; desc: string }> }
  | { kind: "roadmap"; title: string; lead: string; steps: Array<{ label: string; text: string }> }
  | { kind: "cta"; emoji: string; title: string; lead: string; button: string };

export interface CourseIntroDeck {
  slug: string;
  courseId: string;
  firstLessonId: string;
  accent: string;
  accent2: string;
  slides: IntroSlide[];
}

// ── Mobile (React Native) ─────────────────────────────────────────────────────
const MOBILE: CourseIntroDeck = {
  slug: "mobile-programming",
  courseId: "mp-101",
  firstLessonId: "rn1-l1",
  accent: "#2563eb",
  accent2: "#7c3aed",
  slides: [
    {
      kind: "hero",
      emoji: "📱",
      kicker: "Мобайл программчлал",
      title: "React Native",
      subtitle: "Нэг код бичээд iPhone, Android хоёуланд ажилладаг жинхэнэ гар утасны апп бүтээ.",
      note: "Shop.mn дэлгүүрийг энэ удаа гар утсанд амьдруулна.",
    },
    {
      kind: "what",
      title: "React Native гэж юу вэ?",
      lead: "React Native бол Facebook (Meta)-ийн бүтээсэн framework. Чи JavaScript / React мэдлэгээ ашиглан ЖИНХЭНЭ төрөлх (native) гар утасны апп бичдэг — вэб хуудас биш, App Store-д тавьдаг апп.",
      points: [
        { emoji: "1️⃣", label: "Нэг код", text: "Нэг удаа бичсэн код iOS ба Android дээр зэрэг ажиллана." },
        { emoji: "⚛️", label: "React хэлээр", text: "Component, useState, props — React-ийн ойлголтууд яг тэр хэвээр." },
        { emoji: "📲", label: "Төрөлх мэдрэмж", text: "<View>, <Text> нь утасны жинхэнэ элемент болж хувирдаг — HTML биш." },
      ],
    },
    {
      kind: "history",
      title: "Богино түүх",
      lead: "React Native хэрхэн бий болов?",
      events: [
        { year: "2013", title: "Дотоод hackathon", text: "Facebook инженерүүд «вэб биш, төрөлх апп-ыг React-ээр бичиж болох уу?» гэж туршив." },
        { year: "2015", title: "Нээлттэй эх болов", text: "Facebook React Native-ийг олон нийтэд нээлттэй (open-source) болгож гаргалаа." },
        { year: "2017", title: "Expo", text: "Expo хэрэгсэл гарч, апп бичих, туршихыг олон дахин хялбар болгов." },
        { year: "Өнөөдөр", title: "Дэлхий даяар", text: "Хэдэн мянган апп, шинэ архитектур (Fabric, Hermes)-тайгаар өдөр бүр хөгжсөөр." },
      ],
    },
    {
      kind: "uses",
      title: "Юунд ашигладаг вэ?",
      lead: "Өдөр бүр ашигладаг олон апп чинь React Native дээр бичигдсэн байдаг.",
      cards: [
        { emoji: "🛒", title: "Онлайн дэлгүүр", text: "Бараа үзэх, сагслах, захиалах — e-commerce апп." },
        { emoji: "💬", title: "Нийгмийн сүлжээ", text: "Мессеж, пост, мэдэгдэл — чат ба сошиал апп." },
        { emoji: "🏦", title: "Банк / төлбөр", text: "Данс, шилжүүлэг, криптовалют түрийвч." },
        { emoji: "🚕", title: "Хүргэлт / такси", text: "Захиалга, газрын зураг, бодит цагийн хяналт." },
      ],
    },
    {
      kind: "companies",
      title: "Ямар компаниуд ашигладаг вэ?",
      lead: "Дэлхийн хамгийн том брэндүүд React Native-ээр апп-аа бүтээдэг.",
      names: [
        { name: "Instagram", hint: "Meta" },
        { name: "Facebook", hint: "Meta" },
        { name: "Discord", hint: "Чат" },
        { name: "Shopify", hint: "E-commerce" },
        { name: "Coinbase", hint: "Крипто" },
        { name: "Tesla", hint: "Машин" },
        { name: "Microsoft", hint: "Office/Xbox" },
        { name: "Walmart", hint: "Ритейл" },
        { name: "Bloomberg", hint: "Санхүү" },
        { name: "Pinterest", hint: "Сошиал" },
      ],
    },
    {
      kind: "tech",
      title: "Энэ курст ашиглах технологи",
      lead: "Курсын туршид ашиглах framework, хэл, API-уудтай урьдчилан танилцъя.",
      items: [
        { name: "React", tag: "Framework", desc: "Component-д суурилсан UI бүтээх сан." },
        { name: "JSX", tag: "Синтакс", desc: "JavaScript дотор UI-г бичих хэлбэр." },
        { name: "Expo", tag: "Хэрэгсэл", desc: "Апп ажиллуулж, туршиж, гаргах платформ." },
        { name: "Flexbox", tag: "Layout", desc: "Элементүүдийг байрлуулах уян систем." },
        { name: "Hooks", tag: "React API", desc: "useState, useEffect, useContext, useReducer…" },
        { name: "FlatList", tag: "Component", desc: "Олон мянган мөрийг хурдан харуулах жагсаалт." },
        { name: "Animated", tag: "API", desc: "Гөлгөр анимаци, шилжилт хийх." },
        { name: "AsyncStorage", tag: "API", desc: "Өгөгдлийг утсанд байнга хадгалах." },
        { name: "Fetch", tag: "API", desc: "Сервертэй холбогдож өгөгдөл татах." },
      ],
    },
    {
      kind: "roadmap",
      title: "Юу үзэх вэ?",
      lead: "13 шат · 22 модуль · 117 хичээл — эхнээс нь мэргэжлийн апп хүртэл.",
      steps: [
        { label: "Үндэс", text: "View, Text, StyleSheet, Flexbox — эхний дэлгэц." },
        { label: "Дүрс ба жагсаалт", text: "Image, ScrollView, FlatList, SectionList." },
        { label: "Харилцан үйлдэл", text: "Pressable, useState, TextInput, форм." },
        { label: "Навигаци", text: "Дэлгэц хооронд, таб бар, дэлгэрэнгүй." },
        { label: "Өгөгдөл", text: "Сүлжээ (fetch), Context, useReducer, хадгалалт." },
        { label: "Полиш", text: "Анимаци, Modal, dark mode, гаргах — бүрэн апп." },
      ],
    },
    {
      kind: "cta",
      emoji: "🚀",
      title: "Бэлэн үү?",
      lead: "Эхний хичээлд эхний дэлгэцээ бичиж, аяллаа эхлүүлье.",
      button: "1-р хичээлийг эхлүүлэх",
    },
  ],
};

// ── Web (Internet Programming) ────────────────────────────────────────────────
const WEB: CourseIntroDeck = {
  slug: "internet-programming",
  courseId: "ip-101",
  firstLessonId: "m1-l1",
  accent: "#2563eb",
  accent2: "#0ea5e9",
  slides: [
    {
      kind: "hero",
      emoji: "🌐",
      kicker: "Интернэт программчлал",
      title: "Вэб хөгжүүлэлт",
      subtitle: "Дэлхийн хаанаас ч нээгддэг жинхэнэ вэбсайт, онлайн дэлгүүрийг эхнээс нь өөрөө бүтээ.",
      note: "Shop.mn дэлгүүрийг HTML-ээс эхлээд бүрэн систем хүртэл бүтээнэ.",
    },
    {
      kind: "what",
      title: "Вэб хөгжүүлэлт гэж юу вэ?",
      lead: "Интернэт дэх БҮХ сайт гурван суурь технологи дээр тогтдог: бүтэц (HTML), гоо үзэмж (CSS), логик (JavaScript). Эдгээрийг эзэмшвэл ямар ч вэбсайт бүтээх суурьтай болно.",
      points: [
        { emoji: "🧱", label: "HTML", text: "Хуудасны бүтэц — гарчиг, догол мөр, товч, зураг." },
        { emoji: "🎨", label: "CSS", text: "Өнгө, байрлал, загвар — сайтыг гоё харагдуулна." },
        { emoji: "⚙️", label: "JavaScript", text: "Логик ба амьд байдал — товч дархад юу болох." },
      ],
    },
    {
      kind: "history",
      title: "Богино түүх",
      lead: "Вэб хэрхэн үүсэв?",
      events: [
        { year: "1991", title: "Анхны вэбсайт", text: "Tim Berners-Lee дэлхийн анхны вэб хуудсыг нээв — интернэт эхэллээ." },
        { year: "1995", title: "JavaScript", text: "Brendan Eich JavaScript-ийг 10 хоногт бүтээж, вэб амьд болов." },
        { year: "2013", title: "React", text: "Facebook React-ийг гаргаж, орчин үеийн вэб апп бүтээх аргыг өөрчлөв." },
        { year: "Өнөөдөр", title: "Бүх зүйл вэбэд", text: "Дэлгүүр, банк, боловсрол, тоглоом — бараг бүгд вэб дээр." },
      ],
    },
    {
      kind: "uses",
      title: "Юунд ашигладаг вэ?",
      lead: "Өдөр бүр ашигладаг бараг бүх зүйл чинь вэб технологи дээр тогтдог.",
      cards: [
        { emoji: "🛒", title: "Онлайн дэлгүүр", text: "Shop.mn, Amazon — бараа зарах, худалдан авах." },
        { emoji: "📱", title: "Сошиал / контент", text: "Facebook, YouTube, мэдээний сайтууд." },
        { emoji: "🏦", title: "Үйлчилгээ", text: "Банк, төр, боловсролын онлайн систем." },
        { emoji: "📊", title: "Апп ба самбар", text: "Ажлын хэрэгсэл, dashboard, удирдлагын систем." },
      ],
    },
    {
      kind: "companies",
      title: "Ямар компаниуд ашигладаг вэ?",
      lead: "Интернэт дэх бүх томоохон бүтээгдэхүүн эдгээр технологи дээр ажилладаг.",
      names: [
        { name: "Google", hint: "Хайлт" },
        { name: "Amazon", hint: "Дэлгүүр" },
        { name: "Netflix", hint: "Стриминг" },
        { name: "Facebook", hint: "Сошиал" },
        { name: "Airbnb", hint: "Аялал" },
        { name: "GitHub", hint: "Код" },
        { name: "YouTube", hint: "Видео" },
        { name: "Wikipedia", hint: "Мэдлэг" },
        { name: "Spotify", hint: "Хөгжим" },
        { name: "Shopify", hint: "E-commerce" },
      ],
    },
    {
      kind: "tech",
      title: "Энэ курст ашиглах технологи",
      lead: "Курсын туршид ашиглах хэл, framework, API-уудтай урьдчилан танилцъя.",
      items: [
        { name: "HTML", tag: "Хэл", desc: "Хуудасны бүтцийг тодорхойлно." },
        { name: "CSS", tag: "Хэл", desc: "Загвар, өнгө, байрлал." },
        { name: "JavaScript", tag: "Хэл", desc: "Вэбийн логик, харилцан үйлдэл." },
        { name: "React", tag: "Framework", desc: "Component-д суурилсан орчин үеийн UI." },
        { name: "Node.js", tag: "Runtime", desc: "Сервер талын JavaScript." },
        { name: "SQL", tag: "Өгөгдөл", desc: "Мэдээллийн сан асуулга." },
        { name: "REST API", tag: "API", desc: "Клиент ба серверийн харилцаа." },
        { name: "Git", tag: "Хэрэгсэл", desc: "Кодын хувилбар удирдлага." },
        { name: "Docker", tag: "Хэрэгсэл", desc: "Апп-ыг сав (container)-д багцлах." },
      ],
    },
    {
      kind: "roadmap",
      title: "Юу үзэх вэ?",
      lead: "13 шат · 22 модуль · 117 хичээл — HTML-ээс бүрэн систем хүртэл.",
      steps: [
        { label: "HTML + CSS", text: "Бүтэц, загвар, responsive дизайн." },
        { label: "JavaScript", text: "Хувьсагч, логик, DOM, хадгалалт." },
        { label: "React", text: "Component, төлөв, форм, router." },
        { label: "Backend + API", text: "Сервер, REST, мэдээллийн сан, SQL." },
        { label: "Нэвтрэлт + Тест", text: "Auth, TypeScript, тестлэг, чанар." },
        { label: "Deploy + DevOps", text: "CI/CD, Docker, monitoring, гүйцэтгэл." },
      ],
    },
    {
      kind: "cta",
      emoji: "🚀",
      title: "Бэлэн үү?",
      lead: "Эхний хичээлд анхны вэб хуудсаа бичиж, аяллаа эхлүүлье.",
      button: "1-р хичээлийг эхлүүлэх",
    },
  ],
};

export const COURSE_INTROS: Record<string, CourseIntroDeck> = {
  "mobile-programming": MOBILE,
  "mp-101": MOBILE,
  "internet-programming": WEB,
  "ip-101": WEB,
};

export function getIntroDeck(courseId: string | undefined): CourseIntroDeck | null {
  if (!courseId) return null;
  return COURSE_INTROS[courseId] ?? null;
}

// ── "seen once" flag (client-only; guarded for SSR / private mode) ─────────────
const SEEN_KEY = (id: string) => `khiye:intro-seen:${id}`;

export function markIntroSeen(courseId: string): void {
  try {
    localStorage.setItem(SEEN_KEY(courseId), "1");
  } catch {
    /* private mode — ignore */
  }
}

export function hasSeenIntro(courseId: string): boolean {
  try {
    return localStorage.getItem(SEEN_KEY(courseId)) === "1";
  } catch {
    return false;
  }
}
