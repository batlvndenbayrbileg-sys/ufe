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
  | "heading-order"
  | "map-filter"
  | "reduce"
  | "try-catch"
  | "localstorage"
  | "conditional"
  | "useeffect"
  | "router"
  | "controlled-input"
  | "event-delegation"
  | "async-await"
  | "route-params"
  | "form-submit"
  | "immutable"
  | "lifting-state";

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
    case "map-filter": {
      const cell = (x: number, y: number, v: number | string, fill: string, fg: string) => (
        <>
          <Box x={x} y={y} width={17} height={20} fill={fill} stroke={ACC} rx={2} />
          <text x={x + 8.5} y={y + 14} fill={fg} textAnchor="middle" style={{ ...t, fontSize: 10 }}>{v}</text>
        </>
      );
      const arr = (x: number, y: number, vals: Array<number | string>, fill: string, fg: string) =>
        vals.map((v, i) => <g key={i}>{cell(x + i * 19, y, v, fill, fg)}</g>);
      return (
        <>
          {/* map: transforms every item → same length */}
          <text x={121} y={16} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontSize: 10 }}>.map(x ⇒ x*2)</text>
          {arr(8, 20, [1, 2, 3, 4], SURF, TXT)}
          <line x1={90} y1={30} x2={150} y2={30} stroke={ACC} strokeWidth={1.5} markerEnd="url(#armf)" />
          {arr(156, 20, [2, 4, 6, 8], SUB, "var(--accent-text)")}
          <text x={121} y={54} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 9 }}>4 → 4 · адил урт</text>

          {/* filter: keeps matches → shorter */}
          <text x={121} y={74} fill="var(--success)" textAnchor="middle" style={{ ...t, fontSize: 10 }}>.filter(x ⇒ x&gt;2)</text>
          {arr(8, 78, [1, 2, 3, 4], SURF, TXT)}
          <line x1={90} y1={88} x2={150} y2={88} stroke="var(--success)" strokeWidth={1.5} markerEnd="url(#armfs)" />
          {arr(156, 78, [3, 4], "color-mix(in srgb, var(--success) 16%, var(--surface))", "var(--success)")}
          <text x={121} y={112} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 9 }}>4 → 2 · цөөрнө</text>

          <defs>
            <marker id="armf" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
            <marker id="armfs" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--success)" />
            </marker>
          </defs>
        </>
      );
    }
    case "reduce": {
      // the accumulator rolls the array up into one value
      const steps: Array<[number, string, string, string, string]> = [
        // x, value, fill, fg, addLabel (above the incoming arrow)
        [8, "0", SURF, TXT, "эхлэл"],
        [82, "10", SUB, "var(--accent-text)", "+10"],
        [156, "30", SUB, "var(--accent-text)", "+20"],
        [230, "60", ACC, "var(--on-accent)", "+30"],
      ];
      return (
        <>
          <text x={140} y={14} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontSize: 10 }}>
            .reduce((acc, x) ⇒ acc + x, 0)
          </text>
          {steps.map(([x, v, fill, fg, add], i) => (
            <g key={i}>
              {i > 0 ? (
                <>
                  <line x1={(x as number) - 32} y1={61} x2={x as number} y2={61} stroke={ACC} strokeWidth={1.5} markerEnd="url(#arr)" />
                  <text x={(x as number) - 16} y={44} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 10 }}>{add}</text>
                </>
              ) : null}
              <Box x={x as number} y={48} width={40} height={26} fill={fill as string} stroke={i === 3 ? ACC : i === 0 ? BOR : ACC} />
              <text x={(x as number) + 20} y={65} fill={fg as string} textAnchor="middle" style={{ ...t, fontWeight: i === 3 ? 700 : 400 }}>{v}</text>
            </g>
          ))}
          <text x={28} y={86} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 9 }}>эхлэл</text>
          <text x={250} y={86} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontSize: 9 }}>нийлбэр</text>
          <text x={140} y={108} fill={MUT} textAnchor="middle" style={t}>[10, 20, 30] → нэг утга (60)</text>
          <defs>
            <marker id="arr" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
          </defs>
        </>
      );
    }
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
        // number, phase — gloss, code, colour
        ["1", "Бэлдэх — өгөгдлөө бэлд", "const a = 2, b = 3", "var(--text-subtle)"],
        ["2", "Хийх — функцээ дууд", "sum(a, b)", ACC],
        ["3", "Батлах — үр дүнг шалга", "expect(res).toBe(5)", "var(--success)"],
      ];
      return (
        <>
          {rows.map(([n, label, code, c], i) => {
            const y = 6 + i * 40;
            return (
              <g key={n}>
                {i > 0 ? (
                  <line x1={22} y1={y - 6} x2={22} y2={y} stroke={BOR} strokeWidth={1.5} markerEnd="url(#araaa)" />
                ) : null}
                <Box x={8} y={y} width={264} height={34} fill={`color-mix(in srgb, ${c} 12%, var(--surface))`} stroke={c} />
                <circle cx={23} cy={y + 17} r={9} fill={c} />
                <text x={23} y={y + 21} fill="var(--on-accent)" textAnchor="middle" style={t}>{n}</text>
                <text x={40} y={y + 15} fill={TXT} style={{ ...t, fontFamily: "inherit", fontWeight: 600, fontSize: 11 }}>{label}</text>
                <text x={40} y={y + 28} fill={MUT} style={{ ...t, fontSize: 10 }}>{code}</text>
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
      const chip = (x: number, y: number, tag: string, fill: string, stroke: string, fg: string) => (
        <>
          <Box x={x} y={y} width={34} height={20} fill={fill} stroke={stroke} rx={4} />
          <text x={x + 17} y={y + 14} fill={fg} textAnchor="middle" style={t}>{tag}</text>
        </>
      );
      return (
        <>
          {/* ✓ correct: never skip a level */}
          <text x={8} y={13} fill="var(--success)" style={{ ...t, fontWeight: 700 }}>✓ зөв</text>
          <path d="M31,46 V58 M31,58 H40 M31,72 V84 M31,84 H66" fill="none" stroke={BOR} />
          {chip(14, 26, "h1", ACC, ACC, "var(--on-accent)")}
          {chip(40, 58, "h2", SUB, ACC, "var(--accent-text)")}
          {chip(66, 86, "h3", SUB, ACC, "var(--accent-text)")}

          {/* divider */}
          <line x1={140} y1={18} x2={140} y2={112} stroke={BOR} strokeDasharray="3 3" />

          {/* ✗ wrong: h1 → h3 skips h2 */}
          <text x={156} y={13} fill="var(--danger)" style={{ ...t, fontWeight: 700 }}>✗ алгассан</text>
          {chip(160, 26, "h1", ACC, ACC, "var(--on-accent)")}
          {chip(212, 74, "h3", "color-mix(in srgb, var(--danger) 14%, var(--surface))", "var(--danger)", "var(--danger)")}
          <path d="M177,46 Q196,60 212,74" fill="none" stroke="var(--danger)" strokeWidth={1.5} strokeDasharray="4 3" />
          <g transform="translate(196,58)">
            <circle r={8} fill="var(--surface)" stroke="var(--danger)" strokeWidth={1.5} />
            <path d="M-3,-3 L3,3 M3,-3 L-3,3" stroke="var(--danger)" strokeWidth={1.5} />
          </g>
          <text x={214} y={106} fill="var(--danger)" style={{ ...t, fontSize: 9 }}>h2 алгассан</text>
        </>
      );
    }
    case "try-catch":
      return (
        <>
          {/* risky code lives in try */}
          <Box x={92} y={8} width={96} height={24} fill={SUB} stroke={ACC} />
          <text x={140} y={24} fill="var(--accent-text)" textAnchor="middle" style={t}>try {"{ … }"}</text>

          {/* success path → keep going */}
          <line x1={168} y1={32} x2={205} y2={50} stroke="var(--success)" strokeWidth={1.5} markerEnd="url(#artco)" />
          <text x={206} y={44} fill="var(--success)" textAnchor="middle" style={{ ...t, fontSize: 9 }}>✓ OK</text>
          {/* error path → caught */}
          <line x1={112} y1={32} x2={72} y2={50} stroke="var(--danger)" strokeWidth={1.5} markerEnd="url(#artce)" />
          <text x={72} y={44} fill="var(--danger)" textAnchor="middle" style={{ ...t, fontSize: 9 }}>✗ алдаа</text>

          <Box x={14} y={52} width={104} height={26} fill="color-mix(in srgb, var(--danger) 14%, var(--surface))" stroke="var(--danger)" />
          <text x={66} y={69} fill="var(--danger)" textAnchor="middle" style={t}>catch (e)</text>
          <Box x={150} y={52} width={116} height={26} fill="color-mix(in srgb, var(--success) 14%, var(--surface))" stroke="var(--success)" />
          <text x={208} y={69} fill="var(--success)" textAnchor="middle" style={t}>үргэлжилнэ</text>
          {/* caught → recover, app keeps running */}
          <line x1={118} y1={65} x2={148} y2={65} stroke={BOR} strokeWidth={1.5} markerEnd="url(#artcn)" />

          {/* finally always runs */}
          <line x1={66} y1={78} x2={66} y2={96} stroke={BOR} markerEnd="url(#artcn)" />
          <line x1={208} y1={78} x2={208} y2={96} stroke={BOR} markerEnd="url(#artcn)" />
          <Box x={40} y={98} width={200} height={22} fill={SURF} stroke={BOR} />
          <text x={140} y={113} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 10 }}>finally — заавал ажиллана</text>

          <defs>
            <marker id="artco" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--success)" />
            </marker>
            <marker id="artce" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--danger)" />
            </marker>
            <marker id="artcn" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={BOR} />
            </marker>
          </defs>
        </>
      );
    case "localstorage":
      return (
        <>
          {/* the app's data */}
          <Box x={8} y={28} width={92} height={58} fill={SURF} stroke={BOR} rx={6} />
          <text x={54} y={46} fill={TXT} textAnchor="middle" style={{ ...t, fontWeight: 700 }}>App</text>
          <text x={54} y={68} fill={ACC} textAnchor="middle" style={t}>{"{ cart }"}</text>

          {/* browser storage drum */}
          <Box x={180} y={28} width={92} height={58} fill={SUB} stroke={ACC} rx={6} />
          {[40, 44, 48].map((cy) => (
            <ellipse key={cy} cx={196} cy={cy} rx={7} ry={2.4} fill="none" stroke={ACC} />
          ))}
          <text x={240} y={44} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontSize: 9 }}>localStorage</text>
          <rect x={188} y={56} width={76} height={22} rx={3} fill={SURF} stroke={BOR} />
          <text x={226} y={70} fill={TXT} textAnchor="middle" style={{ ...t, fontSize: 9 }}>cart: […]</text>

          {/* save → */}
          <line x1={102} y1={44} x2={178} y2={44} stroke={ACC} strokeWidth={1.5} markerEnd="url(#arls)" />
          <text x={140} y={38} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontSize: 9 }}>setItem · stringify</text>
          {/* load ← */}
          <line x1={178} y1={72} x2={102} y2={72} stroke="var(--success)" strokeWidth={1.5} markerEnd="url(#arll)" />
          <text x={140} y={84} fill="var(--success)" textAnchor="middle" style={{ ...t, fontSize: 9 }}>getItem · parse</text>

          <text x={140} y={106} fill={MUT} textAnchor="middle" style={t}>↻ хуудас шинэчилсэн ч үлдэнэ</text>
          <defs>
            <marker id="arls" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
            <marker id="arll" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--success)" />
            </marker>
          </defs>
        </>
      );
    case "conditional":
      return (
        <>
          {/* the condition */}
          <Box x={74} y={8} width={132} height={26} fill={SUB} stroke={ACC} />
          <text x={140} y={25} fill="var(--accent-text)" textAnchor="middle" style={t}>items.length &gt; 0 ?</text>

          {/* true → the list */}
          <line x1={112} y1={34} x2={74} y2={58} stroke="var(--success)" strokeWidth={1.5} markerEnd="url(#arct)" />
          <text x={84} y={50} fill="var(--success)" textAnchor="middle" style={{ ...t, fontSize: 9 }}>✓ тийм</text>
          <Box x={14} y={60} width={116} height={46} fill={SURF} stroke={BOR} />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={24} y={68 + i * 12} width={9} height={9} rx={2} fill={SUB} stroke={ACC} />
              <rect x={38} y={71 + i * 12} width={80} height={4} rx={2} fill={BOR} />
            </g>
          ))}

          {/* false → empty state */}
          <line x1={168} y1={34} x2={206} y2={58} stroke={BOR} strokeWidth={1.5} markerEnd="url(#arcf)" />
          <text x={196} y={50} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 9 }}>✗ үгүй</text>
          <Box x={150} y={60} width={116} height={46} fill={SURF} stroke={BOR} strokeDasharray="4 3" />
          <text x={208} y={82} textAnchor="middle" style={{ ...t, fontSize: 16 }}>🛒</text>
          <text x={208} y={98} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 9 }}>Сагс хоосон</text>

          <text x={140} y={122} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontSize: 10 }}>cond ? &lt;List/&gt; : &lt;Empty/&gt;</text>
          <defs>
            <marker id="arct" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--success)" />
            </marker>
            <marker id="arcf" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={BOR} />
            </marker>
          </defs>
        </>
      );
    case "useeffect":
      return (
        <>
          {/* render */}
          <Box x={88} y={8} width={104} height={24} fill={SURF} stroke={BOR} rx={4} />
          <text x={140} y={24} fill={TXT} textAnchor="middle" style={{ ...t, fontWeight: 700 }}>render</text>
          <line x1={140} y1={32} x2={140} y2={44} stroke={BOR} strokeWidth={1.5} markerEnd="url(#arue)" />
          <text x={196} y={42} fill={MUT} style={{ ...t, fontSize: 8 }}>зурсны дараа</text>

          {/* effect — the side effect */}
          <Box x={76} y={46} width={128} height={30} fill={SUB} stroke={ACC} rx={4} />
          <text x={140} y={60} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontWeight: 700 }}>effect()</text>
          <text x={140} y={72} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 8 }}>гаж нөлөө: fetch, subscribe</text>
          <line x1={140} y1={76} x2={140} y2={88} stroke={BOR} strokeWidth={1.5} markerEnd="url(#arue)" />
          <text x={206} y={86} fill={MUT} style={{ ...t, fontSize: 8 }}>[deps] өөрчлөгдвөл</text>

          {/* cleanup, then the effect can run again */}
          <Box x={76} y={90} width={128} height={24} fill="color-mix(in srgb, var(--warning) 14%, var(--surface))" stroke="var(--warning)" rx={4} />
          <text x={140} y={106} fill="var(--warning)" textAnchor="middle" style={{ ...t, fontWeight: 700 }}>cleanup()</text>

          {/* loop back to effect */}
          <path d="M74,102 C34,100 34,60 74,60" fill="none" stroke={ACC} strokeWidth={1.5} markerEnd="url(#aruel)" />
          <text x={30} y={84} fill="var(--accent-text)" style={{ ...t, fontSize: 8 }}>↺ дахин</text>

          <text x={140} y={126} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 9 }}>[] → зөвхөн нэг удаа</text>
          <defs>
            <marker id="arue" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={BOR} />
            </marker>
            <marker id="aruel" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
          </defs>
        </>
      );
    case "router":
      return (
        <>
          {/* a link click changes the URL hash */}
          <Box x={14} y={10} width={62} height={20} fill={SURF} stroke={BOR} rx={4} />
          <text x={45} y={24} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 10 }}>#/home</text>
          <line x1={78} y1={20} x2={130} y2={20} stroke={ACC} strokeWidth={1.5} markerEnd="url(#arrt)" />
          <text x={104} y={14} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 8 }}>холбоос дарах</text>
          <Box x={132} y={10} width={62} height={20} fill={SUB} stroke={ACC} rx={4} />
          <text x={163} y={24} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontSize: 10 }}>#/cart</text>
          <text x={236} y={22} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 8 }}>hashchange</text>

          {/* the app shell: header stays, only the view swaps */}
          <Box x={54} y={40} width={172} height={72} fill={SURF} stroke={BOR} rx={6} />
          <path d="M54,46 a6,6 0 0 1 6,-6 h160 a6,6 0 0 1 6,6 v16 h-172 z" fill={SUB} />
          <text x={66} y={56} fill={TXT} style={{ ...t, fontWeight: 700, fontSize: 10 }}>Shop.mn</text>
          <text x={150} y={56} fill={MUT} style={{ ...t, fontSize: 10 }}>Нүүр</text>
          <text x={192} y={56} fill="var(--accent-text)" style={{ ...t, fontSize: 10, fontWeight: 700 }}>Сагс</text>
          <line x1={185} y1={59} x2={211} y2={59} stroke={ACC} strokeWidth={1.5} />
          <text x={140} y={90} textAnchor="middle" style={{ ...t, fontSize: 16 }}>🛒</text>
          <text x={140} y={104} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontSize: 10 }}>Сагс харагдац</text>

          <text x={140} y={126} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 9 }}>толгой тогтмол · reload-гүй солигдоно</text>
          <defs>
            <marker id="arrt" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
          </defs>
        </>
      );
    case "controlled-input":
      return (
        <>
          <text x={140} y={13} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 9 }}>хяналттай оролт</text>
          {/* the input shows the value from state */}
          <Box x={70} y={20} width={140} height={30} fill={SURF} stroke={ACC} rx={4} />
          <text x={84} y={40} fill={TXT} style={t}>Гут</text>
          <line x1={110} y1={28} x2={110} y2={42} stroke={ACC} strokeWidth={1} />
          {/* single source of truth */}
          <Box x={82} y={86} width={116} height={26} fill={SUB} stroke={ACC} rx={4} />
          <text x={140} y={103} fill="var(--accent-text)" textAnchor="middle" style={t}>state = &quot;Гут&quot;</text>
          {/* value: state → input */}
          <path d="M88,88 C46,82 46,38 68,34" fill="none" stroke={ACC} strokeWidth={1.5} markerEnd="url(#arci)" />
          <text x={38} y={64} fill="var(--accent-text)" style={{ ...t, fontSize: 9 }}>value</text>
          {/* onChange: input → state */}
          <path d="M212,42 C252,48 252,86 200,90" fill="none" stroke="var(--success)" strokeWidth={1.5} markerEnd="url(#arcio)" />
          <text x={250} y={66} fill="var(--success)" textAnchor="middle" style={{ ...t, fontSize: 9 }}>onChange</text>
          <text x={140} y={126} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 9 }}>нэг эх сурвалж — state</text>
          <defs>
            <marker id="arci" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
            <marker id="arcio" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--success)" />
            </marker>
          </defs>
        </>
      );
    case "event-delegation":
      return (
        <>
          <Box x={16} y={22} width={178} height={88} fill={SUB} stroke={ACC} rx={6} />
          <text x={28} y={38} fill="var(--accent-text)" style={{ ...t, fontWeight: 700 }}>ul</text>
          <text x={150} y={38} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontSize: 9 }}>👂 1 listener</text>
          {[0, 1, 2].map((i) => {
            const y = 46 + i * 20;
            const on = i === 1;
            return (
              <g key={i}>
                <rect x={30} y={y} width={150} height={16} rx={2} fill={on ? "color-mix(in srgb, var(--accent) 18%, var(--surface))" : SURF} stroke={BOR} />
                <text x={38} y={y + 12} fill={TXT} style={{ ...t, fontSize: 9 }}>li · Бараа {i + 1}</text>
              </g>
            );
          })}
          {/* a click on the middle li bubbles up to the one listener */}
          <circle cx={150} cy={74} r={3} fill={ACC} />
          <path d="M150,72 Q120,54 150,42" fill="none" stroke={ACC} strokeWidth={1.5} strokeDasharray="3 3" markerEnd="url(#ared)" />
          <text x={112} y={58} fill="var(--accent-text)" style={{ ...t, fontSize: 8 }}>bubble ↑</text>
          <text x={140} y={124} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 9 }}>1 сонсогч · e.target = дарсан li</text>
          <defs>
            <marker id="ared" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
          </defs>
        </>
      );
    case "async-await":
      return (
        <>
          <text x={140} y={14} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 9 }}>async / await</text>
          <Box x={8} y={46} width={96} height={30} fill={SUB} stroke={ACC} rx={4} />
          <text x={56} y={65} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontSize: 10 }}>await fetch()</text>
          {/* wait for the promise */}
          <text x={131} y={40} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 8 }}>хүлээнэ</text>
          <line x1={106} y1={61} x2={156} y2={61} stroke={BOR} strokeWidth={1.5} strokeDasharray="4 3" markerEnd="url(#araw)" />
          <text x={131} y={66} textAnchor="middle" style={{ ...t, fontSize: 14 }}>⏳</text>
          <Box x={158} y={46} width={114} height={30} fill="color-mix(in srgb, var(--success) 14%, var(--surface))" stroke="var(--success)" rx={4} />
          <text x={215} y={65} fill="var(--success)" textAnchor="middle" style={{ ...t, fontSize: 10 }}>хариу → үргэлжилнэ</text>
          <text x={140} y={104} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 9 }}>await — хариу иртэл кодыг түр зогсооно</text>
          <defs>
            <marker id="araw" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={BOR} />
            </marker>
          </defs>
        </>
      );
    case "route-params":
      return (
        <>
          {/* the pattern with a dynamic segment */}
          <Box x={56} y={12} width={168} height={26} fill="var(--code-bg)" stroke="var(--code-border)" rx={4} />
          <text x={140} y={29} textAnchor="middle" style={t}>
            <tspan fill={MUT}>/product/</tspan>
            <tspan fill="var(--accent-text)">:id</tspan>
          </text>
          <line x1={140} y1={40} x2={140} y2={52} stroke={BOR} strokeWidth={1.5} markerEnd="url(#arrp)" />
          <text x={188} y={50} fill={MUT} style={{ ...t, fontSize: 8 }}>тохирно</text>
          {/* a concrete URL */}
          <Box x={56} y={54} width={168} height={26} fill={SUB} stroke={ACC} rx={4} />
          <text x={140} y={71} textAnchor="middle" style={t}>
            <tspan fill={TXT}>/product/</tspan>
            <tspan fill="var(--accent-text)" style={{ fontWeight: 700 }}>42</tspan>
          </text>
          <line x1={140} y1={82} x2={140} y2={92} stroke={BOR} strokeWidth={1.5} markerEnd="url(#arrp)" />
          <text x={140} y={106} fill="var(--accent-text)" textAnchor="middle" style={t}>params.id = &quot;42&quot;</text>
          <text x={140} y={126} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 9 }}>нэг загвар → олон бараа</text>
          <defs>
            <marker id="arrp" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={BOR} />
            </marker>
          </defs>
        </>
      );
    case "form-submit":
      return (
        <>
          {/* the form */}
          <Box x={8} y={14} width={106} height={80} fill={SURF} stroke={BOR} rx={6} />
          <text x={18} y={30} fill={MUT} style={{ ...t, fontWeight: 700, fontSize: 10 }}>form</text>
          <rect x={18} y={38} width={86} height={16} rx={2} fill={SURF} stroke={BOR} />
          <Box x={18} y={62} width={56} height={20} fill={ACC} rx={3} />
          <text x={46} y={76} fill="var(--on-accent)" textAnchor="middle" style={{ ...t, fontSize: 9 }}>Илгээх</text>

          {/* submit fires onSubmit */}
          <line x1={114} y1={44} x2={146} y2={44} stroke={ACC} strokeWidth={1.5} markerEnd="url(#arfs)" />
          <text x={130} y={38} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontSize: 8 }}>onSubmit</text>

          {/* preventDefault blocks the reload */}
          <Box x={148} y={34} width={124} height={22} fill="color-mix(in srgb, var(--accent) 12%, var(--surface))" stroke={ACC} rx={4} />
          <text x={210} y={49} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontSize: 9 }}>e.preventDefault()</text>

          {/* the default (reload) — cancelled */}
          <text x={206} y={73} fill="var(--danger)" textAnchor="middle" style={{ ...t, fontSize: 9 }}>↻ хуудас reload</text>
          <line x1={152} y1={70} x2={260} y2={70} stroke="var(--danger)" strokeWidth={1.5} />

          {/* instead, JS handles it */}
          <Box x={150} y={82} width={122} height={22} fill="color-mix(in srgb, var(--success) 14%, var(--surface))" stroke="var(--success)" rx={4} />
          <text x={211} y={97} fill="var(--success)" textAnchor="middle" style={{ ...t, fontSize: 9 }}>✓ JS шалгаж илгээнэ</text>

          <text x={140} y={122} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 9 }}>reload-г болиулж, өөрөө зохицуулна</text>
          <defs>
            <marker id="arfs" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
          </defs>
        </>
      );
    case "immutable": {
      const cell = (x: number, y: number, v: number, fill: string, stroke: string, fg: string) => (
        <>
          <Box x={x} y={y} width={15} height={18} fill={fill} stroke={stroke} rx={2} />
          <text x={x + 7.5} y={y + 13} fill={fg} textAnchor="middle" style={{ ...t, fontSize: 9 }}>{v}</text>
        </>
      );
      const row = (xs: number, y: number, vals: number[], fill: string, stroke: string, fg: string) =>
        vals.map((v, i) => <g key={i}>{cell(xs + i * 17, y, v, fill, stroke, fg)}</g>);
      return (
        <>
          {/* ✓ immutable: a new array = a new reference React can see */}
          <text x={8} y={38} fill="var(--success)" style={{ ...t, fontWeight: 700, fontSize: 12 }}>✓</text>
          {row(20, 24, [1, 2], SURF, BOR, TXT)}
          <text x={28} y={53} fill={MUT} style={{ ...t, fontSize: 8 }}>@A</text>
          <line x1={58} y1={33} x2={100} y2={33} stroke={ACC} strokeWidth={1.5} markerEnd="url(#arim)" />
          <text x={79} y={25} fill="var(--accent-text)" textAnchor="middle" style={{ ...t, fontSize: 9 }}>[...a, 3]</text>
          {row(104, 24, [1, 2, 3], SUB, ACC, "var(--accent-text)")}
          <text x={130} y={53} fill="var(--success)" style={{ ...t, fontSize: 8 }}>@B шинэ</text>
          <text x={214} y={37} fill="var(--success)" textAnchor="middle" style={{ ...t, fontSize: 9 }}>✓ re-render</text>

          {/* ✗ mutation: same reference → React misses it */}
          <text x={8} y={94} fill="var(--danger)" style={{ ...t, fontWeight: 700, fontSize: 12 }}>✗</text>
          {row(20, 80, [1, 2], SURF, BOR, TXT)}
          <text x={28} y={109} fill={MUT} style={{ ...t, fontSize: 8 }}>@A</text>
          <line x1={58} y1={89} x2={100} y2={89} stroke={BOR} strokeWidth={1.5} markerEnd="url(#arimn)" />
          <text x={79} y={81} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 9 }}>a.push(3)</text>
          {row(104, 80, [1, 2, 3], SURF, "var(--danger)", MUT)}
          <text x={130} y={109} fill="var(--danger)" style={{ ...t, fontSize: 8 }}>@A ижил</text>
          <text x={214} y={93} fill="var(--danger)" textAnchor="middle" style={{ ...t, fontSize: 9 }}>✗ мартна</text>
          <defs>
            <marker id="arim" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
            <marker id="arimn" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={BOR} />
            </marker>
          </defs>
        </>
      );
    }
    case "lifting-state":
      return (
        <>
          {/* shared state lives in the common parent */}
          <Box x={88} y={10} width={104} height={32} fill={SURF} stroke={BOR} rx={6} />
          <text x={100} y={30} fill={TXT} style={{ ...t, fontWeight: 700, fontSize: 10 }}>Parent</text>
          <rect x={148} y={18} width={36} height={16} rx={8} fill={ACC} />
          <text x={166} y={29} fill="var(--on-accent)" textAnchor="middle" style={{ ...t, fontSize: 8 }}>state</text>

          {/* two children */}
          <Box x={18} y={78} width={84} height={30} fill={SUB} stroke={ACC} rx={4} />
          <text x={60} y={97} fill="var(--accent-text)" textAnchor="middle" style={t}>Child A</text>
          <Box x={178} y={78} width={84} height={30} fill={SUB} stroke={ACC} rx={4} />
          <text x={220} y={97} fill="var(--accent-text)" textAnchor="middle" style={t}>Child B</text>

          {/* props flow down to both */}
          <line x1={116} y1={42} x2={68} y2={76} stroke={ACC} strokeWidth={1.5} markerEnd="url(#arli)" />
          <text x={80} y={58} fill="var(--accent-text)" style={{ ...t, fontSize: 8 }}>props ↓</text>
          <line x1={164} y1={42} x2={212} y2={76} stroke={ACC} strokeWidth={1.5} markerEnd="url(#arli)" />
          <text x={182} y={58} fill="var(--accent-text)" style={{ ...t, fontSize: 8 }}>props ↓</text>

          {/* a child sends changes back up */}
          <path d="M240,78 C258,64 258,36 194,30" fill="none" stroke="var(--success)" strokeWidth={1.5} markerEnd="url(#arlo)" />
          <text x={250} y={58} fill="var(--success)" textAnchor="middle" style={{ ...t, fontSize: 8 }}>setState ↑</text>

          <text x={140} y={124} fill={MUT} textAnchor="middle" style={{ ...t, fontSize: 9 }}>хуваалцах төлөв → нийтлэг эцэгт</text>
          <defs>
            <marker id="arli" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
            <marker id="arlo" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--success)" />
            </marker>
          </defs>
        </>
      );
    default:
      return null;
  }
}
