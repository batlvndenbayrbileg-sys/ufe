/**
 * Runtime-error translation table (seed).
 * Turns raw JS/DOM error messages into a hand-written Mongolian explanation
 * with the four-part structure: Юу болов / Хаана / Яагаад / Яаж олох вэ.
 * See docs/blueprint/05-validation-engine.md §5.5.
 *
 * This is a STUB with a handful of the most common beginner errors for
 * stages 1–2. Coverage of the top-20 errors per stage is a content deliverable
 * (E6/T6.6) tracked in /author/health.
 */

export interface TranslatedError {
  /** Юу болов? */
  what: string;
  /** Хаана? (filled by the caller from the source map when available) */
  where?: string;
  /** Яагаад? */
  why: string;
  /** Яаж өөрөө олох вэ? */
  howToFind: string;
}

interface Rule {
  match: RegExp;
  build: (m: RegExpMatchArray) => Omit<TranslatedError, "where">;
}

const RULES: Rule[] = [
  {
    // Cannot read properties of undefined (reading 'map')
    match: /Cannot read propert(?:y|ies) of undefined \(reading '([^']+)'\)/,
    build: (m) => ({
      what: `Аль нэг хувьсагч \`undefined\` байгаа тул \`.${m[1]}\` ажиллаж чадахгүй байна.`,
      why: "Өгөгдөл ирэхээс өмнө код нэг удаа ажилласан бол хувьсагч хоосон байж болно.",
      howToFind: `\`.${m[1]}\`-ийн өмнө \`console.log()\` тавьж, тэр хувьсагчид юу байгааг хараарай.`,
    }),
  },
  {
    // X is not a function
    match: /(\w+)(?:\.\w+)? is not a function/,
    build: (m) => ({
      what: `\`${m[1]}\` функц биш байна, тиймээс дуудаж болохгүй.`,
      why: "Нэрээ буруу бичсэн, эсвэл тэр зүйл функц биш (жишээ нь массив эсвэл undefined) байж магадгүй.",
      howToFind: "Нэрийн бичлэгээ шалгаад, тухайн зүйл үнэхээр функц мөн эсэхийг `console.log`-оор хараарай.",
    }),
  },
  {
    // X is not defined
    match: /(\w+) is not defined/,
    build: (m) => ({
      what: `\`${m[1]}\` гэсэн хувьсагч тодорхойлогдоогүй байна.`,
      why: "Хувьсагчийг зарлаагүй, эсвэл нэрийг нь буруу бичсэн байж магадгүй.",
      howToFind: `\`${m[1]}\`-ийг \`let\`/\`const\`-оор зарласан эсэх, том/жижиг үсгийн бичлэг таарч байгаа эсэхийг шалгаарай.`,
    }),
  },
  {
    // Unexpected token
    match: /Unexpected token/,
    build: () => ({
      what: "Кодын бичлэгт алдаа байна (syntax error).",
      why: "Ихэвчлэн дутуу хаалт `)`, `}`, `]` эсвэл дутуу таслал зэргээс болдог.",
      howToFind: "Алдаа заасан мөрийн ойролцоо хаалт бүрээ хассан эсэхээ шалгаарай.",
    }),
  },
  {
    // Maximum call stack size exceeded
    match: /Maximum call stack size exceeded/,
    build: () => ({
      what: "Функц өөрийгөө хязгааргүй дуудаж, стек дүүрлээ.",
      why: "Recursion-ийн зогсох нөхцөл байхгүй, эсвэл функц санамсаргүйгээр өөрийгөө дууддаг байж магадгүй.",
      howToFind: "Функц ямар нөхцөлд зогсох ёстойгоо шалгаарай.",
    }),
  },
  {
    // Cannot read properties of null (reading 'X')
    match: /Cannot read propert(?:y|ies) of null \(reading '([^']+)'\)/,
    build: (m) => ({
      what: `Элемент олдоогүй тул \`null\` буцаж, \`.${m[1]}\` ажиллахгүй байна.`,
      why: "`querySelector` тухайн сонголтод тохирох элемент олдохгүй бол `null` буцаадаг.",
      howToFind: "Selector-оо (id, class) HTML дээрхтэй яг таарч байгаа эсэхийг шалгаарай.",
    }),
  },
  {
    // Cannot set properties of null (setting 'X')
    match: /Cannot set propert(?:y|ies) of null \(setting '([^']+)'\)/,
    build: (m) => ({
      what: `Элемент \`null\` байгаа тул \`.${m[1]}\`-д утга онооход алдаа гарлаа.`,
      why: "Ихэвчлэн `querySelector`/`getElementById` элемент олдохгүй үед тохиолддог.",
      howToFind: "Скрипт ажиллахаас өмнө тухайн элемент HTML дээр байгаа эсэх, selector зөв эсэхийг шалга.",
    }),
  },
  {
    // Assignment to constant variable
    match: /Assignment to constant variable/,
    build: () => ({
      what: "`const`-оор зарласан хувьсагчид дахин утга онооё гэсэн байна.",
      why: "`const` хувьсагчийн утгыг дахин өөрчилж болдоггүй.",
      howToFind: "Утга нь өөрчлөгддөг хувьсагчийг `let`-ээр зарлаарай.",
    }),
  },
  {
    // X has already been declared
    match: /Identifier '([^']+)' has already been declared/,
    build: (m) => ({
      what: `\`${m[1]}\` хувьсагчийг хоёр удаа зарлажээ.`,
      why: "Нэг хувьсагчийг `let`/`const`-оор дахин зарлаж болохгүй.",
      howToFind: `\`${m[1]}\`-ийг хаана давхар зарласнаа хараад нэгийг нь ус.`,
    }),
  },
  {
    // Cannot access 'X' before initialization
    match: /Cannot access '([^']+)' before initialization/,
    build: (m) => ({
      what: `\`${m[1]}\`-ийг зарлахаас өмнө ашиглалаа.`,
      why: "`let`/`const` хувьсагчийг зарлахаас нь өмнө ашиглаж болохгүй.",
      howToFind: `\`${m[1]}\`-ийг ашиглахаасаа өмнө дээр талд нь зарлаарай.`,
    }),
  },
  {
    // X is not iterable
    match: /(\w+) is not iterable|is not iterable/,
    build: () => ({
      what: "Давтаж болохгүй зүйлийг давтахыг оролдлоо.",
      why: "`for...of` эсвэл `...` тархалт нь зөвхөн массив зэрэг давтагдах зүйлд ажилладаг.",
      howToFind: "Тухайн хувьсагч массив мөн эсэхийг `console.log`-оор шалгаарай.",
    }),
  },
  {
    // Cannot read properties of undefined (reading 'length')
    match: /Cannot read propert(?:y|ies) of undefined \(reading 'length'\)/,
    build: () => ({
      what: "`undefined` хувьсагчийн `.length`-ийг уншиж чадсангүй.",
      why: "Массив/текст хараахан утга аваагүй (`undefined`) байна.",
      howToFind: "`.length`-ийн өмнө тухайн хувьсагчид юу байгааг `console.log`-оор хараарай.",
    }),
  },
  {
    // Unexpected end of input
    match: /Unexpected end of input/,
    build: () => ({
      what: "Код дуусахад хаалт дутуу байна.",
      why: "Нээсэн `{`, `(`, `[` -ийн аль нэг нь хаагдаагүй үлдсэн байна.",
      howToFind: "Функц/блок бүрийн хаах хаалтаа гүйцээж бичсэн эсэхээ шалгаарай.",
    }),
  },
  {
    // Invalid or unexpected token
    match: /Invalid or unexpected token/,
    build: () => ({
      what: "Кодод буруу тэмдэгт орсон байна.",
      why: "Ихэвчлэн хаалтгүй хашилт `\"` эсвэл буруу тэмдэгтээс болдог.",
      howToFind: "Алдаа заасан мөрийн хашилт, тэмдэгтүүдийг сайтар шалгаарай.",
    }),
  },
  {
    // missing ) after argument list
    match: /missing \) after argument list/,
    build: () => ({
      what: "Функц дуудахад хаах хаалт `)` дутуу байна.",
      why: "Аргументуудын дараа `)` бичигдээгүй.",
      howToFind: "Тухайн мөрийн `(` бүрд тохирох `)` байгаа эсэхийг шалгаарай.",
    }),
  },
  {
    // await is only valid in async functions
    match: /await is only valid in async/,
    build: () => ({
      what: "`await`-ийг `async` биш функц дотор ашиглалаа.",
      why: "`await` зөвхөн `async` функц дотор ажилладаг.",
      howToFind: "Функцийнхээ өмнө `async` гэж нэмээрэй: `async function ...`.",
    }),
  },
  {
    // Failed to fetch
    match: /Failed to fetch|NetworkError|fetch failed/,
    build: () => ({
      what: "Сервер рүү илгээсэн хүсэлт амжилтгүй болов.",
      why: "URL буруу, эсвэл сервер хариу өгөхгүй байж магадгүй.",
      howToFind: "`fetch()`-д өгсөн URL зөв эсэх, Network хэсэгт хүсэлт харагдаж байгааг шалгаарай.",
    }),
  },
  {
    // Unexpected token in JSON
    match: /Unexpected token.*JSON|is not valid JSON/,
    build: () => ({
      what: "JSON өгөгдлийг уншиж чадсангүй.",
      why: "Серверээс ирсэн хариу JSON биш, эсвэл гэмтэлтэй байна.",
      howToFind: "Хариуг `.json()` хийхээсээ өмнө `console.log`-оор шалгаарай.",
    }),
  },
  {
    // return outside of function
    match: /(?:Illegal )?return statement.*outside|return.*outside of function/i,
    build: () => ({
      what: "`return`-ийг функцийн гадна бичсэн байна.",
      why: "`return` зөвхөн функц дотор ажилладаг.",
      howToFind: "`return` мөр функцийн `{ }` дотор байгаа эсэхийг шалгаарай.",
    }),
  },
  {
    // Adding null/undefined — heuristic for NaN-producing ops is hard; catch TypeError add
    match: /Cannot convert undefined or null to object/,
    build: () => ({
      what: "`null` эсвэл `undefined`-ийг объект мэт ашиглалаа.",
      why: "`Object.keys`, тархалт зэрэг үйлдэл `null`/`undefined`-д ажилладаггүй.",
      howToFind: "Тухайн хувьсагчид утга орсон эсэхийг эхлээд шалгаарай.",
    }),
  },
];

/**
 * Try to translate a raw runtime error message. Returns null when no rule
 * matches; the caller then shows the raw message plus an "AI-аас асуух" action.
 */
export function translateRuntimeError(rawMessage: string): TranslatedError | null {
  for (const rule of RULES) {
    const m = rawMessage.match(rule.match);
    if (m) return rule.build(m);
  }
  return null;
}

/** Number of seeded rules — surfaced so tests/health can assert coverage. */
export const RUNTIME_ERROR_RULE_COUNT = RULES.length;
