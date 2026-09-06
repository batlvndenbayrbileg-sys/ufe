"use client";

/**
 * Small, reusable schematic diagrams for concept cards. Each `kind` is a
 * hand-drawn inline SVG that uses theme tokens (so it works in light & dark),
 * shared across every concept that maps to it — a diagram is worth more than
 * 300 bespoke drawings. Concepts without a kind simply render no diagram.
 */

const VB = "0 0 280 130";
const t = { fontSize: 11, fontFamily: "var(--font-mono)" } as const;

function Box(props: React.SVGProps<SVGRectElement>) {
  return <rect rx={4} {...props} />;
}

export type DiagramKind =
  | "box-model"
  | "flex-row"
  | "grid"
  | "dom-tree"
  | "breakpoints"
  | "selector"
  | "client-server"
  | "http-status"
  | "array"
  | "object"
  | "function"
  | "hash"
  | "token-flow"
  | "props-flow"
  | "state-cycle"
  | "join"
  | "table"
  | "aaa"
  | "heading-order";

export function ConceptDiagram({ kind }: { kind: string }) {
  const body = render(kind as DiagramKind);
  if (!body) return null;
  return (
    <svg
      viewBox={VB}
      role="img"
      width="100%"
      style={{ display: "block", maxHeight: 150, color: "var(--text)" }}
      preserveAspectRatio="xMidYMid meet"
    >
      {body}
    </svg>
  );
}

const ACC = "var(--accent)";
const SUB = "var(--accent-subtle)";
const BOR = "var(--border-strong, var(--border))";
const SURF = "var(--surface)";
const MUT = "var(--text-muted)";
const TXT = "var(--text)";

function render(kind: DiagramKind): React.ReactNode {
  switch (kind) {
    case "box-model":
      return (
        <>
          {/* margin — transparent space around the box (dashed) */}
          <Box
            x={6}
            y={6}
            width={268}
            height={118}
            fill="color-mix(in srgb, var(--warning) 12%, var(--surface))"
            stroke="var(--warning)"
            strokeDasharray="4 3"
          />
          <text x={12} y={19} fill="var(--warning)" style={t}>margin</text>
          {/* border — the real edge line */}
          <Box x={44} y={24} width={192} height={82} fill="color-mix(in srgb, var(--text-subtle) 22%, var(--surface))" stroke={BOR} strokeWidth={2} />
          <text x={50} y={37} fill={TXT} style={t}>border</text>
          {/* padding — breathing room inside the border */}
          <Box x={72} y={40} width={136} height={50} fill="color-mix(in srgb, var(--success) 16%, var(--surface))" stroke="var(--success)" />
          <text x={78} y={53} fill="var(--success)" style={t}>padding</text>
          {/* content */}
          <Box x={100} y={54} width={80} height={22} fill={ACC} rx={3} />
          <text x={140} y={69} fill="var(--on-accent)" textAnchor="middle" style={t}>агуулга</text>
        </>
      );
    case "flex-row":
      return (
        <>
          <text x={20} y={18} fill={MUT} style={t}>display: flex</text>
          {/* a real flex header: logo left, nav right → space-between */}
          <Box x={8} y={26} width={264} height={40} fill="none" stroke={ACC} rx={4} />
          <Box x={16} y={36} width={46} height={20} fill={ACC} rx={3} />
          <text x={39} y={50} fill="var(--on-accent)" textAnchor="middle" style={t}>лого</text>
          {[0, 1, 2].map((i) => (
            <Box key={i} x={150 + i * 40} y={36} width={34} height={20} fill={SUB} stroke={ACC} rx={3} />
          ))}
          {/* the free space between them */}
          <line x1={64} y1={46} x2={148} y2={46} stroke={BOR} strokeDasharray="3 3" />
          <text x={106} y={42} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 9 }}>space-between</text>
          {/* main axis */}
          <line x1={16} y1={86} x2={256} y2={86} stroke={ACC} strokeWidth={1.5} markerEnd="url(#ar)" />
          <text x={132} y={80} fill={MUT} textAnchor="middle" style={t}>гол тэнхлэг (justify-content) →</text>
          <defs>
            <marker id="ar" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
          </defs>
        </>
      );
    case "grid":
      return (
        <>
          <text x={140} y={13} fill={MUT} textAnchor="middle" style={t}>grid · 3 × 1fr багана</text>
          <Box x={8} y={20} width={264} height={86} fill="none" stroke={BOR} rx={6} />
          {/* highlight one column-gap and one row-gap */}
          <rect x={92} y={28} width={10} height={70} fill="color-mix(in srgb, var(--accent) 16%, var(--surface))" />
          <rect x={16} y={62} width={248} height={8} fill="color-mix(in srgb, var(--accent) 16%, var(--surface))" />
          {[0, 1, 2].map((c) =>
            [0, 1].map((r) => {
              const x = 16 + c * 86;
              const y = 28 + r * 42;
              return (
                <g key={`${c}-${r}`}>
                  <Box x={x} y={y} width={76} height={34} fill={SUB} stroke={ACC} />
                  <rect x={x + 7} y={y + 6} width={24} height={22} rx={2} fill={BOR} />
                  <rect x={x + 37} y={y + 9} width={30} height={4} rx={2} fill={ACC} />
                  <rect x={x + 37} y={y + 18} width={20} height={4} rx={2} fill={BOR} />
                </g>
              );
            }),
          )}
          <text x={97} y={122} fill="var(--accent-text)" textAnchor="middle" style={t}>gap</text>
          <line x1={97} y1={106} x2={97} y2={114} stroke={ACC} strokeWidth={1.2} />
        </>
      );
    case "dom-tree": {
      const node = (x: number, y: number, w: number, label: string, level: 0 | 1 | 2) => {
        const fill = level === 0 ? ACC : level === 1 ? SUB : SURF;
        const fg = level === 0 ? "var(--on-accent)" : level === 1 ? "var(--accent-text)" : TXT;
        return (
          <>
            <Box x={x} y={y} width={w} height={20} fill={fill} stroke={level === 2 ? BOR : ACC} rx={4} />
            <text x={x + w / 2} y={y + 14} fill={fg} textAnchor="middle" style={t}>{label}</text>
          </>
        );
      };
      return (
        <>
          {/* connectors: html → head/body, body → header/main/footer */}
          <path d="M128,30 V34 M64,34 H192 M64,34 V46 M192,34 V46" fill="none" stroke={BOR} />
          <path d="M192,66 V74 M158,74 H254 M158,74 V88 M206,74 V88 M254,74 V88" fill="none" stroke={BOR} />
          {node(104, 10, 48, "html", 0)}
          {node(40, 46, 48, "head", 1)}
          {node(168, 46, 48, "body", 1)}
          {node(134, 88, 48, "header", 2)}
          {node(186, 88, 40, "main", 2)}
          {node(230, 88, 48, "footer", 2)}
        </>
      );
    }
    case "breakpoints":
      return (
        <>
          {/* the same page reflows across the 768px breakpoint */}
          <line x1={140} y1={16} x2={140} y2={110} stroke={ACC} strokeDasharray="4 3" />
          <text x={140} y={12} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontSize: 10 }}>768px</text>
          {/* phone → one column stacked */}
          <Box x={40} y={22} width={50} height={82} fill={SURF} stroke={BOR} rx={8} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={48} y={30 + i * 24} width={34} height={18} rx={2} fill={SUB} stroke={ACC} />
          ))}
          <text x={65} y={122} fill={MUT} textAnchor="middle" style={t}>утас · 1 багана</text>
          {/* desktop → three columns */}
          <Box x={168} y={34} width={100} height={58} fill={SURF} stroke={BOR} rx={4} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={176 + i * 30} y={42} width={26} height={42} rx={2} fill={SUB} stroke={ACC} />
          ))}
          <text x={218} y={122} fill={MUT} textAnchor="middle" style={t}>компьютер · 3 багана</text>
        </>
      );
    case "selector":
      return (
        <>
          {/* a class selector matches every element that carries it */}
          <Box x={8} y={42} width={94} height={46} fill="var(--code-bg)" stroke="var(--code-border)" />
          <text x={16} y={60} fill="var(--accent-text)" style={t}>.card {"{"}</text>
          <text x={20} y={78} fill={MUT} style={{ ...t, fontSize: 10 }}>radius…</text>
          <line x1={104} y1={64} x2={144} y2={53} stroke={ACC} strokeWidth={1.5} markerEnd="url(#ar2)" />
          <line x1={104} y1={64} x2={144} y2={81} stroke={ACC} strokeWidth={1.5} markerEnd="url(#ar2)" />
          <Box x={148} y={42} width={60} height={22} fill={SUB} stroke={ACC} />
          <text x={178} y={57} fill="var(--accent-text)" textAnchor="middle" style={t}>.card</text>
          <Box x={148} y={70} width={60} height={22} fill={SUB} stroke={ACC} />
          <text x={178} y={85} fill="var(--accent-text)" textAnchor="middle" style={t}>.card</text>
          <text x={216} y={68} fill={MUT} style={{ ...t, fontSize: 9 }}>тохирох</text>
          <text x={216} y={80} fill={MUT} style={{ ...t, fontSize: 9 }}>бүхэнд</text>
          <defs>
            <marker id="ar2" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
          </defs>
        </>
      );
    case "client-server":
      return (
        <>
          {/* Browser window (client) */}
          <Box x={6} y={24} width={86} height={78} fill={SURF} stroke={BOR} />
          <path d="M6,40 H92" stroke={BOR} />
          <circle cx={16} cy={32} r={2.6} fill="var(--danger)" />
          <circle cx={25} cy={32} r={2.6} fill="var(--warning)" />
          <circle cx={34} cy={32} r={2.6} fill="var(--success)" />
          <rect x={16} y={52} width={52} height={6} rx={3} fill={SUB} />
          <rect x={16} y={64} width={64} height={6} rx={3} fill={SUB} />
          <rect x={16} y={76} width={38} height={6} rx={3} fill={SUB} />
          <text x={49} y={118} fill={MUT} textAnchor="middle" style={t}>Хөтөч</text>

          {/* Server (rack) */}
          <Box x={188} y={24} width={86} height={78} fill={SURF} stroke={BOR} />
          {[38, 60, 82].map((y) => (
            <g key={y}>
              <rect x={196} y={y} width={70} height={16} rx={3} fill={SUB} stroke={BOR} />
              <circle cx={204} cy={y + 8} r={2.6} fill="var(--success)" />
              <rect x={214} y={y + 6} width={44} height={4} rx={2} fill={BOR} />
            </g>
          ))}
          <text x={231} y={118} fill={MUT} textAnchor="middle" style={t}>Сервер</text>

          {/* Request → labelled on the arrow */}
          <line x1={94} y1={42} x2={186} y2={42} stroke={ACC} strokeWidth={1.5} markerEnd="url(#ar3)" />
          <Box x={100} y={33} width={80} height={18} rx={9} fill={SUB} stroke={ACC} />
          <text x={140} y={45} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontSize: 10 }}>GET /бараа</text>

          {/* Response ← */}
          <line x1={186} y1={86} x2={94} y2={86} stroke="var(--success)" strokeWidth={1.5} markerEnd="url(#ar3b)" />
          <Box x={98} y={77} width={84} height={18} rx={9} fill="color-mix(in srgb, var(--success) 16%, var(--surface))" stroke="var(--success)" />
          <text x={140} y={89} fill="var(--success)" textAnchor="middle" style={{ ...t, fontSize: 10 }}>200 · JSON</text>

          <defs>
            <marker id="ar3" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
            <marker id="ar3b" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--success)" />
            </marker>
          </defs>
        </>
      );
    case "http-status": {
      const rows: Array<[string, string, string]> = [
        ["200", "амжилттай (OK)", "var(--success)"],
        ["404", "олдсонгүй", "var(--warning)"],
        ["500", "серверийн алдаа", "var(--danger)"],
      ];
      return (
        <>
          <text x={140} y={13} fill={MUT} textAnchor="middle" style={t}>статус код</text>
          {rows.map(([code, meaning, color], i) => {
            const y = 22 + i * 34;
            return (
              <g key={code}>
                <rect
                  x={16}
                  y={y}
                  width={58}
                  height={26}
                  rx={6}
                  fill={`color-mix(in srgb, ${color} 16%, var(--surface))`}
                  stroke={color}
                />
                <text x={45} y={y + 18} fill={color} textAnchor="middle" style={{ ...t, fontWeight: 700 }}>{code}</text>
                <text x={86} y={y + 18} fill={TXT} style={t}>{meaning}</text>
              </g>
            );
          })}
        </>
      );
    }
    case "array":
      return (
        <>
          <text x={8} y={16} fill={MUT} style={t}>items</text>
          <text x={12} y={74} fill={ACC} style={{ ...t, fontSize: 26 }}>[</text>
          {[0, 1, 2, 3].map((i) => {
            const x = 30 + i * 56;
            const on = i === 1;
            return (
              <g key={i}>
                <Box x={x} y={44} width={48} height={36} fill={on ? SUB : SURF} stroke={ACC} strokeWidth={on ? 2 : 1} />
                <text x={x + 24} y={69} textAnchor="middle" style={{ ...t, fontSize: 16 }}>
                  {["🍎", "🍌", "🍇", "🍊"][i]}
                </text>
                <text x={x + 24} y={94} fill={on ? "var(--accent-text)" : MUT} textAnchor="middle" style={t}>{i}</text>
              </g>
            );
          })}
          <text x={256} y={74} fill={ACC} style={{ ...t, fontSize: 26 }}>]</text>
          <text x={140} y={116} fill="var(--accent-text)" textAnchor="middle" style={t}>items[1] = 🍌</text>
        </>
      );
    case "object":
      return (
        <>
          <text x={34} y={13} fill={MUT} style={t}>product</text>
          <Box x={30} y={16} width={176} height={80} fill={SURF} stroke={BOR} />
          <text x={40} y={33} fill={MUT} style={t}>{"{"}</text>
          {[
            ["name", "\"Гутал\""],
            ["price", "90000"],
            ["stock", "5"],
          ].map(([k, v], i) => (
            <g key={k}>
              <text x={54} y={50 + i * 16} fill={ACC} style={t}>{k}:</text>
              <text x={112} y={50 + i * 16} fill={TXT} style={t}>{v}</text>
            </g>
          ))}
          <text x={40} y={90} fill={MUT} style={t}>{"}"}</text>
          <text x={140} y={116} fill="var(--accent-text)" textAnchor="middle" style={t}>product.price → 90000</text>
        </>
      );
    case "function":
      return (
        <>
          <text x={34} y={44} fill={MUT} textAnchor="middle" style={t}>оролт</text>
          <text x={34} y={65} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontWeight: 700 }}>(2, 3)</text>
          <line x1={64} y1={60} x2={96} y2={60} stroke={ACC} strokeWidth={1.5} markerEnd="url(#arf)" />
          <Box x={100} y={40} width={80} height={42} fill={ACC} rx={6} />
          <text x={140} y={58} fill="var(--on-accent)" textAnchor="middle" style={t}>sum()</text>
          <text x={140} y={72} fill="var(--on-accent)" textAnchor="middle" style={{ ...t, fontSize: 9 }}>return a+b</text>
          <line x1={184} y1={60} x2={216} y2={60} stroke={ACC} strokeWidth={1.5} markerEnd="url(#arf)" />
          <text x={248} y={44} fill={MUT} textAnchor="middle" style={t}>үр дүн</text>
          <text x={248} y={65} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontWeight: 700 }}>5</text>
          <defs>
            <marker id="arf" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
          </defs>
        </>
      );
    case "hash":
      return (
        <>
          {/* inputs: password + salt both feed the hash */}
          <Box x={6} y={18} width={74} height={24} fill={SURF} stroke={BOR} />
          <text x={43} y={34} fill={TXT} textAnchor="middle" style={t}>нууц үг</text>
          <Box x={6} y={50} width={74} height={24} fill="color-mix(in srgb, var(--warning) 16%, var(--surface))" stroke="var(--warning)" />
          <text x={43} y={66} fill="var(--warning)" textAnchor="middle" style={t}>+ salt</text>
          <line x1={80} y1={30} x2={112} y2={44} stroke={BOR} strokeWidth={1.5} markerEnd="url(#arh)" />
          <line x1={80} y1={62} x2={112} y2={50} stroke={BOR} strokeWidth={1.5} markerEnd="url(#arh)" />

          {/* one-way hash function */}
          <Box x={114} y={30} width={50} height={34} fill={ACC} rx={6} />
          <text x={139} y={51} fill="var(--on-accent)" textAnchor="middle" style={t}>hash()</text>

          {/* digest out */}
          <line x1={164} y1={47} x2={182} y2={47} stroke={ACC} strokeWidth={1.5} markerEnd="url(#arh)" />
          <Box x={184} y={30} width={90} height={34} fill={SUB} stroke={ACC} />
          <text x={229} y={51} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontSize: 10 }}>a3f9c8b1…</text>

          {/* one-way: reverse is impossible */}
          <path d="M226,66 Q140,104 44,80" fill="none" stroke="var(--danger)" strokeWidth={1.5} strokeDasharray="4 3" markerEnd="url(#arhx)" />
          <g transform="translate(140,96)">
            <circle r={9} fill="var(--surface)" stroke="var(--danger)" strokeWidth={1.5} />
            <path d="M-4,-4 L4,4 M4,-4 L-4,4" stroke="var(--danger)" strokeWidth={1.5} />
          </g>
          <text x={140} y={124} fill="var(--danger)" textAnchor="middle" style={t}>буцааж тайлах боломжгүй</text>
          <defs>
            <marker id="arh" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
            <marker id="arhx" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--danger)" />
            </marker>
          </defs>
        </>
      );
    case "token-flow":
      return (
        <>
          {/* Browser (client) */}
          <Box x={6} y={20} width={70} height={84} fill={SURF} stroke={BOR} />
          <path d="M6,34 H76" stroke={BOR} />
          <circle cx={15} cy={27} r={2.2} fill="var(--danger)" />
          <circle cx={23} cy={27} r={2.2} fill="var(--warning)" />
          <circle cx={31} cy={27} r={2.2} fill="var(--success)" />
          <text x={41} y={118} fill={MUT} textAnchor="middle" style={t}>Хөтөч</text>

          {/* Server (rack) */}
          <Box x={204} y={20} width={70} height={84} fill={SURF} stroke={BOR} />
          {[30, 52, 74].map((y) => (
            <g key={y}>
              <rect x={210} y={y} width={58} height={14} rx={3} fill={SUB} stroke={BOR} />
              <circle cx={217} cy={y + 7} r={2.2} fill="var(--success)" />
            </g>
          ))}
          <text x={239} y={118} fill={MUT} textAnchor="middle" style={t}>Сервер</text>

          {/* 1 · login → */}
          <line x1={78} y1={38} x2={202} y2={38} stroke={ACC} strokeWidth={1.5} markerEnd="url(#art)" />
          <Box x={96} y={29} width={88} height={18} rx={9} fill={SUB} stroke={ACC} />
          <text x={140} y={41} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontSize: 10 }}>1 · нэвтрэх</text>

          {/* 2 · token ← (key badge) */}
          <line x1={202} y1={64} x2={78} y2={64} stroke="var(--success)" strokeWidth={1.5} markerEnd="url(#artb)" />
          <Box x={96} y={55} width={88} height={18} rx={9} fill="color-mix(in srgb, var(--success) 16%, var(--surface))" stroke="var(--success)" />
          <circle cx={110} cy={64} r={3} fill="none" stroke="var(--success)" strokeWidth={1.4} />
          <path d="M112,64 H120 M118,64 V68" stroke="var(--success)" strokeWidth={1.4} />
          <text x={146} y={68} fill="var(--success)" textAnchor="middle" style={{ ...t, fontSize: 10 }}>2 · токен</text>

          {/* 3 · reuse token on later requests → */}
          <line x1={78} y1={90} x2={202} y2={90} stroke={ACC} strokeWidth={1.5} markerEnd="url(#art)" />
          <Box x={90} y={81} width={100} height={18} rx={9} fill={SUB} stroke={ACC} />
          <text x={140} y={93} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontSize: 9.5 }}>3 · Bearer токен</text>

          <defs>
            <marker id="art" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
            <marker id="artb" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--success)" />
            </marker>
          </defs>
        </>
      );
    case "props-flow":
      return (
        <>
          {/* Parent holds the data */}
          <Box x={8} y={26} width={104} height={74} fill={SURF} stroke={BOR} />
          <text x={60} y={42} fill={TXT} textAnchor="middle" style={{ ...t, fontWeight: 700 }}>Parent</text>
          <text x={18} y={64} fill={ACC} style={{ ...t, fontSize: 10 }}>name=&quot;Гутал&quot;</text>
          <text x={18} y={80} fill={ACC} style={{ ...t, fontSize: 10 }}>price=90000</text>
          {/* props flow to the child */}
          <line x1={114} y1={62} x2={160} y2={62} stroke={ACC} strokeWidth={1.5} markerEnd="url(#arp)" />
          <text x={137} y={56} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 9 }}>props</text>
          {/* Child renders a card from the props */}
          <Box x={166} y={26} width={104} height={74} fill={SUB} stroke={ACC} />
          <rect x={176} y={36} width={84} height={26} rx={3} fill={BOR} />
          <text x={176} y={80} fill={TXT} style={t}>Гутал</text>
          <text x={230} y={80} fill="var(--accent-text)" style={t}>₮90000</text>
          <defs>
            <marker id="arp" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
          </defs>
        </>
      );
    case "state-cycle":
      return (
        <>
          {/* three nodes in a triangle → a clear closed loop */}
          <Box x={16} y={16} width={82} height={30} fill={SUB} stroke={ACC} />
          <text x={57} y={35} fill="var(--accent-text)" textAnchor="middle" style={t}>төлөв</text>
          <Box x={182} y={16} width={82} height={30} fill={SURF} stroke={BOR} />
          <text x={223} y={35} fill={TXT} textAnchor="middle" style={t}>UI зурна</text>
          <Box x={99} y={90} width={82} height={30} fill={SURF} stroke={BOR} />
          <text x={140} y={109} fill={TXT} textAnchor="middle" style={t}>үйлдэл</text>

          {/* төлөв → UI (render) */}
          <line x1={100} y1={31} x2={180} y2={31} stroke={BOR} strokeWidth={1.5} markerEnd="url(#arsm)" />
          <text x={140} y={26} fill={MUT} textAnchor="middle" style={t}>зурна</text>

          {/* UI → үйлдэл (user acts) */}
          <path d="M222,48 Q212,78 178,92" fill="none" stroke={BOR} strokeWidth={1.5} markerEnd="url(#arsm)" />
          <text x={222} y={78} fill={MUT} textAnchor="middle" style={t}>хэрэглэгч</text>

          {/* үйлдэл → төлөв (setState, the key transition) */}
          <path d="M102,92 Q66,78 56,48" fill="none" stroke={ACC} strokeWidth={1.8} markerEnd="url(#ars)" />
          <text x={52} y={78} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontWeight: 700 }}>setState</text>

          <defs>
            <marker id="ars" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
            <marker id="arsm" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={BOR} />
            </marker>
          </defs>
        </>
      );
    case "join":
      return (
        <>
          {/* orders table */}
          <text x={8} y={12} fill={MUT} style={t}>orders</text>
          <rect x={6} y={16} width={116} height={17} fill={ACC} />
          <text x={12} y={28} fill="var(--on-accent)" style={t}>id</text>
          <text x={52} y={28} fill="var(--on-accent)" style={t}>user_id</text>
          <rect x={6} y={33} width={116} height={17} fill={SUB} stroke={ACC} />
          <text x={12} y={45} fill={TXT} style={t}>12</text>
          <text x={52} y={45} fill="var(--accent-text)" style={{ ...t, fontWeight: 700 }}>7</text>
          <rect x={6} y={50} width={116} height={17} fill={SURF} stroke={BOR} />
          <text x={12} y={62} fill={MUT} style={t}>13</text>
          <text x={52} y={62} fill={MUT} style={t}>4</text>
          <line x1={46} y1={16} x2={46} y2={67} stroke={BOR} />

          {/* users table */}
          <text x={160} y={12} fill={MUT} style={t}>users</text>
          <rect x={158} y={16} width={116} height={17} fill={ACC} />
          <text x={164} y={28} fill="var(--on-accent)" style={t}>id</text>
          <text x={198} y={28} fill="var(--on-accent)" style={t}>name</text>
          <rect x={158} y={33} width={116} height={17} fill={SUB} stroke={ACC} />
          <text x={164} y={45} fill="var(--accent-text)" style={{ ...t, fontWeight: 700 }}>7</text>
          <text x={198} y={45} fill={TXT} style={t}>Бат</text>
          <rect x={158} y={50} width={116} height={17} fill={SURF} stroke={BOR} />
          <text x={164} y={62} fill={MUT} style={t}>4</text>
          <text x={198} y={62} fill={MUT} style={t}>Сараа</text>
          <line x1={192} y1={16} x2={192} y2={67} stroke={BOR} />

          {/* the foreign-key link between the matching rows */}
          <circle cx={122} cy={41} r={2.4} fill={ACC} />
          <circle cx={158} cy={41} r={2.4} fill={ACC} />
          <line x1={122} y1={41} x2={158} y2={41} stroke={ACC} strokeWidth={2} />

          <text x={140} y={88} fill="var(--accent-text)" textAnchor="middle" style={t}>ON orders.user_id = users.id</text>
          <text x={140} y={106} fill={MUT} textAnchor="middle" style={t}>→ таарсан мөрүүд нийлнэ</text>
        </>
      );
    case "table":
      return (
        <>
          <text x={16} y={13} fill={MUT} style={t}>products</text>
          {/* SELECT picks a column · WHERE picks a row → their cell is the answer */}
          <rect x={146} y={18} width={118} height={98} fill="color-mix(in srgb, var(--accent) 12%, transparent)" />
          <text x={205} y={13} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontSize: 9 }}>SELECT</text>
          <Box x={16} y={18} width={248} height={24} fill={ACC} />
          <text x={30} y={34} fill="var(--on-accent)" style={t}>name</text>
          <text x={152} y={34} fill="var(--on-accent)" style={t}>price</text>
          {[0, 1, 2].map((r) => (
            <g key={r}>
              <Box x={16} y={42 + r * 24} width={248} height={24} fill={r === 1 ? SUB : SURF} stroke={BOR} />
              <text x={30} y={58 + r * 24} fill={TXT} style={t}>{["Гутал", "Цамц", "Малгай"][r]}</text>
              <text x={152} y={58 + r * 24} fill={TXT} style={t}>{["90000", "45000", "20000"][r]}</text>
            </g>
          ))}
          <text x={196} y={58 + 24} fill="var(--accent-text)" style={{ ...t, fontWeight: 700 }}>← WHERE</text>
        </>
      );
    case "aaa": {
      const rows: Array<[string, string, string, string]> = [
        ["1", "Бэлдэх", "const a = 2, b = 3", SUB],
        ["2", "Хийх", "sum(a, b)", SUB],
        ["3", "Батлах", "expect(…).toBe(5)", "success"],
      ];
      return (
        <>
          {rows.map(([n, label, code, tone], i) => {
            const y = 8 + i * 40;
            const fill = tone === "success" ? "color-mix(in srgb, var(--success) 16%, var(--surface))" : SUB;
            const line = tone === "success" ? "var(--success)" : ACC;
            return (
              <g key={n}>
                {i > 0 ? (
                  <line x1={26} y1={y - 8} x2={26} y2={y} stroke={BOR} strokeWidth={1.5} markerEnd="url(#araaa)" />
                ) : null}
                <Box x={8} y={y} width={264} height={32} fill={fill} stroke={line} />
                <circle cx={26} cy={y + 16} r={9} fill={line} />
                <text x={26} y={y + 20} fill="var(--on-accent)" textAnchor="middle" style={t}>{n}</text>
                <text x={44} y={y + 20} fill={TXT} style={{ ...t, fontFamily: "inherit", fontWeight: 600 }}>{label}</text>
                <text x={266} y={y + 20} fill={MUT} textAnchor="end" style={t}>{code}</text>
              </g>
            );
          })}
          <defs>
            <marker id="araaa" markerWidth="7" markerHeight="7" refX="3" refY="6" orient="auto">
              <path d="M0,0 L6,0 L3,6 Z" fill={BOR} />
            </marker>
          </defs>
        </>
      );
    }
    case "heading-order": {
      const rows: Array<[string, string, number, number]> = [
        // level tag, sample text, indent level, font size
        ["h1", "Shop.mn", 0, 13],
        ["h2", "Ангилал", 1, 12],
        ["h3", "Гутал", 2, 11],
        ["h2", "Бидний тухай", 1, 12],
      ];
      return (
        <>
          {rows.map(([tag, label, lvl, fs], i) => {
            const y = 8 + i * 30;
            const x = 8 + lvl * 26;
            const tone = lvl === 0 ? ACC : SUB;
            const fg = lvl === 0 ? "var(--on-accent)" : "var(--accent-text)";
            return (
              <g key={i}>
                {lvl > 0 ? (
                  <line x1={x - 13} y1={y - 4} x2={x - 13} y2={y + 12} stroke={BOR} />
                ) : null}
                {lvl > 0 ? <line x1={x - 13} y1={y + 12} x2={x} y2={y + 12} stroke={BOR} /> : null}
                <Box x={x} y={y} width={40} height={22} fill={tone} stroke={lvl === 0 ? ACC : "none"} />
                <text x={x + 20} y={y + 15} fill={fg} textAnchor="middle" style={t}>{tag}</text>
                <text x={x + 50} y={y + 15} fill={TXT} style={{ ...t, fontFamily: "inherit", fontSize: fs, fontWeight: lvl === 0 ? 700 : 500 }}>
                  {label}
                </text>
              </g>
            );
          })}
          <text x={8} y={126} fill="var(--success)" style={t}>✓ алгасахгүй: h1 → h2 → h3</text>
        </>
      );
    }
    default:
      return null;
  }
}
