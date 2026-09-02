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
