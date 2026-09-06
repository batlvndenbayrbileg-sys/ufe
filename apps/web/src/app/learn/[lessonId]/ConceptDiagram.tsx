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
  | "table";

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
          <Box x={6} y={6} width={268} height={118} fill="none" stroke={BOR} strokeDasharray="4 3" />
          <text x={12} y={18} fill={MUT} style={t}>margin</text>
          <Box x={40} y={26} width={200} height={80} fill={SUB} stroke={ACC} />
          <text x={46} y={38} fill="var(--accent-text)" style={t}>border</text>
          <Box x={70} y={46} width={140} height={44} fill={SURF} stroke={BOR} />
          <text x={76} y={58} fill={MUT} style={t}>padding</text>
          <Box x={108} y={62} width={64} height={20} fill={ACC} rx={3} />
          <text x={140} y={76} fill="var(--on-accent)" textAnchor="middle" style={t}>content</text>
        </>
      );
    case "flex-row":
      return (
        <>
          <Box x={6} y={30} width={268} height={70} fill="none" stroke={BOR} />
          <Box x={20} y={48} width={54} height={34} fill={SUB} stroke={ACC} />
          <Box x={92} y={48} width={54} height={34} fill={SUB} stroke={ACC} />
          <Box x={164} y={48} width={54} height={34} fill={SUB} stroke={ACC} />
          <line x1={20} y1={116} x2={240} y2={116} stroke={ACC} strokeWidth={1.5} markerEnd="url(#ar)" />
          <defs>
            <marker id="ar" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
          </defs>
          <text x={20} y={22} fill={MUT} style={t}>display: flex</text>
          <text x={130} y={112} fill={MUT} style={t}>гол тэнхлэг →</text>
        </>
      );
    case "grid":
      return (
        <>
          <text x={8} y={16} fill={MUT} style={t}>grid · 3 багана</text>
          {[0, 1, 2].map((c) =>
            [0, 1].map((r) => (
              <Box
                key={`${c}-${r}`}
                x={16 + c * 88}
                y={26 + r * 46}
                width={76}
                height={36}
                fill={SUB}
                stroke={ACC}
              />
            )),
          )}
        </>
      );
    case "dom-tree":
      return (
        <>
          <line x1={140} y1={26} x2={80} y2={58} stroke={BOR} />
          <line x1={140} y1={26} x2={200} y2={58} stroke={BOR} />
          <line x1={200} y1={72} x2={200} y2={94} stroke={BOR} />
          <Box x={112} y={10} width={56} height={20} fill={ACC} rx={3} />
          <text x={140} y={24} fill="var(--on-accent)" textAnchor="middle" style={t}>html</text>
          <Box x={52} y={58} width={56} height={20} fill={SUB} stroke={ACC} />
          <text x={80} y={72} fill="var(--accent-text)" textAnchor="middle" style={t}>head</text>
          <Box x={172} y={58} width={56} height={20} fill={SUB} stroke={ACC} />
          <text x={200} y={72} fill="var(--accent-text)" textAnchor="middle" style={t}>body</text>
          <Box x={172} y={94} width={56} height={20} fill={SURF} stroke={BOR} />
          <text x={200} y={108} fill={TXT} textAnchor="middle" style={t}>main</text>
        </>
      );
    case "breakpoints":
      return (
        <>
          <line x1={12} y1={70} x2={268} y2={70} stroke={BOR} strokeWidth={1.5} />
          <line x1={150} y1={40} x2={150} y2={100} stroke={ACC} strokeDasharray="4 3" />
          <text x={150} y={34} fill="var(--accent-text)" textAnchor="middle" style={t}>768px</text>
          <Box x={20} y={54} width={30} height={44} fill={SUB} stroke={ACC} rx={3} />
          <text x={35} y={116} fill={MUT} textAnchor="middle" style={t}>утас</text>
          <Box x={175} y={48} width={80} height={40} fill={SUB} stroke={ACC} rx={3} />
          <text x={215} y={116} fill={MUT} textAnchor="middle" style={t}>компьютер</text>
        </>
      );
    case "selector":
      return (
        <>
          <Box x={8} y={40} width={110} height={46} fill="var(--code-bg)" stroke="var(--code-border)" />
          <text x={20} y={60} fill={ACC} style={t}>h1 {"{"}</text>
          <text x={30} y={76} fill={TXT} style={t}>color: red</text>
          <line x1={122} y1={62} x2={168} y2={62} stroke={ACC} strokeWidth={1.5} markerEnd="url(#ar2)" />
          <defs>
            <marker id="ar2" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
          </defs>
          <Box x={172} y={44} width={100} height={38} fill={SUB} stroke={ACC} />
          <text x={222} y={67} fill="var(--accent-text)" textAnchor="middle" style={t}>&lt;h1&gt;</text>
        </>
      );
    case "client-server":
      return (
        <>
          <Box x={10} y={40} width={90} height={50} fill={SUB} stroke={ACC} />
          <text x={55} y={68} fill="var(--accent-text)" textAnchor="middle" style={t}>Хөтөч</text>
          <Box x={180} y={40} width={90} height={50} fill={SURF} stroke={BOR} />
          <text x={225} y={68} fill={TXT} textAnchor="middle" style={t}>Сервер</text>
          <line x1={102} y1={54} x2={178} y2={54} stroke={ACC} strokeWidth={1.5} markerEnd="url(#ar3)" />
          <text x={140} y={48} fill={MUT} textAnchor="middle" style={t}>хүсэлт</text>
          <line x1={178} y1={78} x2={102} y2={78} stroke="var(--success)" strokeWidth={1.5} markerEnd="url(#ar3b)" />
          <text x={140} y={94} fill={MUT} textAnchor="middle" style={t}>хариу</text>
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
    case "http-status":
      return (
        <>
          <Box x={16} y={50} width={72} height={30} fill="color-mix(in srgb, var(--success) 18%, var(--surface))" stroke="var(--success)" rx={15} />
          <text x={52} y={69} fill="var(--success)" textAnchor="middle" style={t}>2xx OK</text>
          <Box x={104} y={50} width={72} height={30} fill="color-mix(in srgb, var(--warning) 20%, var(--surface))" stroke="var(--warning)" rx={15} />
          <text x={140} y={69} fill="var(--warning)" textAnchor="middle" style={t}>4xx</text>
          <Box x={192} y={50} width={72} height={30} fill="color-mix(in srgb, var(--danger) 18%, var(--surface))" stroke="var(--danger)" rx={15} />
          <text x={228} y={69} fill="var(--danger)" textAnchor="middle" style={t}>5xx</text>
          <text x={140} y={30} fill={MUT} textAnchor="middle" style={t}>статус код</text>
        </>
      );
    case "array":
      return (
        <>
          <text x={8} y={40} fill={MUT} style={t}>индекс</text>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <Box x={16 + i * 62} y={48} width={54} height={38} fill={SUB} stroke={ACC} />
              <text x={43 + i * 62} y={72} fill="var(--accent-text)" textAnchor="middle" style={t}>
                {["🍎", "🍌", "🍇", "🍊"][i]}
              </text>
              <text x={43 + i * 62} y={104} fill={MUT} textAnchor="middle" style={t}>{i}</text>
            </g>
          ))}
        </>
      );
    case "object":
      return (
        <>
          <Box x={40} y={16} width={200} height={100} fill={SURF} stroke={BOR} />
          {[
            ["name", "\"Гутал\""],
            ["price", "90000"],
            ["stock", "5"],
          ].map(([k, v], i) => (
            <g key={k}>
              <text x={56} y={42 + i * 28} fill={ACC} style={t}>{k}:</text>
              <text x={140} y={42 + i * 28} fill={TXT} style={t}>{v}</text>
            </g>
          ))}
        </>
      );
    case "function":
      return (
        <>
          <text x={30} y={68} fill={MUT} textAnchor="middle" style={t}>оролт</text>
          <line x1={54} y1={62} x2={96} y2={62} stroke={ACC} strokeWidth={1.5} markerEnd="url(#arf)" />
          <Box x={100} y={40} width={80} height={44} fill={ACC} />
          <text x={140} y={66} fill="var(--on-accent)" textAnchor="middle" style={t}>функц</text>
          <line x1={184} y1={62} x2={226} y2={62} stroke={ACC} strokeWidth={1.5} markerEnd="url(#arf)" />
          <text x={252} y={68} fill={MUT} textAnchor="middle" style={t}>үр дүн</text>
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
          <Box x={8} y={44} width={92} height={38} fill={SURF} stroke={BOR} />
          <text x={54} y={67} fill={TXT} textAnchor="middle" style={t}>нууц үг</text>
          <Box x={116} y={40} width={48} height={46} fill={ACC} />
          <text x={140} y={67} fill="var(--on-accent)" textAnchor="middle" style={t}>hash</text>
          <Box x={180} y={44} width={92} height={38} fill={SUB} stroke={ACC} />
          <text x={226} y={67} fill="var(--accent-text)" textAnchor="middle" style={t}>a3f9…</text>
          <line x1={100} y1={63} x2={114} y2={63} stroke={ACC} strokeWidth={1.5} markerEnd="url(#arh)" />
          <line x1={164} y1={63} x2={178} y2={63} stroke={ACC} strokeWidth={1.5} markerEnd="url(#arh)" />
          <path d="M178,96 Q140,110 102,96" fill="none" stroke="var(--danger)" strokeDasharray="4 3" />
          <text x={140} y={122} fill="var(--danger)" textAnchor="middle" style={t}>буцаах боломжгүй</text>
          <defs>
            <marker id="arh" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
          </defs>
        </>
      );
    case "token-flow":
      return (
        <>
          <Box x={10} y={50} width={80} height={40} fill={SUB} stroke={ACC} />
          <text x={50} y={74} fill="var(--accent-text)" textAnchor="middle" style={t}>Хөтөч</text>
          <Box x={190} y={50} width={80} height={40} fill={SURF} stroke={BOR} />
          <text x={230} y={74} fill={TXT} textAnchor="middle" style={t}>Сервер</text>
          <line x1={92} y1={60} x2={188} y2={60} stroke={ACC} strokeWidth={1.5} markerEnd="url(#art)" />
          <text x={140} y={54} fill={MUT} textAnchor="middle" style={t}>нэвтрэх</text>
          <line x1={188} y1={82} x2={92} y2={82} stroke="var(--success)" strokeWidth={1.5} markerEnd="url(#artb)" />
          <text x={140} y={100} fill={MUT} textAnchor="middle" style={t}>token</text>
          <text x={140} y={22} fill={MUT} textAnchor="middle" style={t}>дараа: Authorization: Bearer …</text>
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
          <Box x={16} y={44} width={96} height={42} fill={ACC} />
          <text x={64} y={69} fill="var(--on-accent)" textAnchor="middle" style={t}>Parent</text>
          <Box x={168} y={44} width={96} height={42} fill={SUB} stroke={ACC} />
          <text x={216} y={69} fill="var(--accent-text)" textAnchor="middle" style={t}>Child</text>
          <line x1={114} y1={64} x2={166} y2={64} stroke={ACC} strokeWidth={1.5} markerEnd="url(#arp)" />
          <text x={140} y={40} fill={MUT} textAnchor="middle" style={t}>props ↓</text>
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
          <Box x={14} y={52} width={70} height={34} fill={SUB} stroke={ACC} />
          <text x={49} y={73} fill="var(--accent-text)" textAnchor="middle" style={t}>төлөв</text>
          <Box x={105} y={52} width={70} height={34} fill={SURF} stroke={BOR} />
          <text x={140} y={73} fill={TXT} textAnchor="middle" style={t}>UI зурна</text>
          <Box x={196} y={52} width={70} height={34} fill={SURF} stroke={BOR} />
          <text x={231} y={73} fill={TXT} textAnchor="middle" style={t}>үйлдэл</text>
          <line x1={84} y1={69} x2={103} y2={69} stroke={ACC} strokeWidth={1.5} markerEnd="url(#ars)" />
          <line x1={175} y1={69} x2={194} y2={69} stroke={ACC} strokeWidth={1.5} markerEnd="url(#ars)" />
          <path d="M231,88 Q231,112 49,112 Q49,100 49,90" fill="none" stroke={ACC} strokeWidth={1.5} markerEnd="url(#ars)" />
          <text x={140} y={108} fill={MUT} textAnchor="middle" style={t}>setState → дахин зурна</text>
          <defs>
            <marker id="ars" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={ACC} />
            </marker>
          </defs>
        </>
      );
    case "join":
      return (
        <>
          <text x={8} y={16} fill={MUT} style={t}>orders</text>
          <Box x={8} y={22} width={104} height={26} fill={SUB} stroke={ACC} />
          <text x={16} y={39} fill="var(--accent-text)" style={t}>user_id = 7</text>
          <text x={168} y={16} fill={MUT} style={t}>users</text>
          <Box x={168} y={22} width={104} height={26} fill={SURF} stroke={BOR} />
          <text x={176} y={39} fill={TXT} style={t}>id = 7</text>
          <line x1={112} y1={35} x2={168} y2={35} stroke={ACC} strokeWidth={1.5} />
          <text x={140} y={72} fill="var(--accent-text)" textAnchor="middle" style={t}>ON orders.user_id = users.id</text>
          <text x={140} y={92} fill={MUT} textAnchor="middle" style={t}>→ хоёр хүснэгт нэг мөр болно</text>
        </>
      );
    case "table":
      return (
        <>
          <Box x={16} y={20} width={248} height={24} fill={ACC} />
          <text x={30} y={36} fill="var(--on-accent)" style={t}>name</text>
          <text x={150} y={36} fill="var(--on-accent)" style={t}>price</text>
          {[0, 1, 2].map((r) => (
            <g key={r}>
              <Box x={16} y={44 + r * 26} width={248} height={26} fill={r === 1 ? SUB : SURF} stroke={BOR} />
              <text x={30} y={61 + r * 26} fill={TXT} style={t}>{["Гутал", "Цамц", "Малгай"][r]}</text>
              <text x={150} y={61 + r * 26} fill={TXT} style={t}>{["90000", "45000", "20000"][r]}</text>
            </g>
          ))}
          <text x={190} y={61 + 26} fill="var(--accent-text)" style={t}>← WHERE</text>
        </>
      );
    default:
      return null;
  }
}
