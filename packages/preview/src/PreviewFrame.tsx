"use client";

import { forwardRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { PreviewHost, type PreviewHostHandle, type PreviewHostProps } from "./PreviewHost";

export interface DevicePreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const DEVICE_PRESETS: DevicePreset[] = [
  { id: "mobile", label: "📱 Mobile", width: 375, height: 812 },
  { id: "mobile-l", label: "📱 Mobile L", width: 414, height: 896 },
  { id: "tablet", label: "📲 Tablet", width: 768, height: 1024 },
  { id: "desktop", label: "🖥 Desktop", width: 1280, height: 800 },
];

export interface PreviewFrameProps extends Omit<PreviewHostProps, "width" | "height"> {
  /** Reference image for compare mode. */
  expectedImage?: string;
  toolbarExtra?: ReactNode;
}

const btn: CSSProperties = {
  padding: "4px 8px",
  borderRadius: 6,
  border: "1px solid var(--border, #e4e4e7)",
  background: "var(--surface, #fff)",
  color: "var(--text, #18181b)",
  cursor: "pointer",
  fontSize: 12,
};

export const PreviewFrame = forwardRef<PreviewHostHandle, PreviewFrameProps>(function PreviewFrame(
  { expectedImage, toolbarExtra, ...hostProps },
  ref,
) {
  const [device, setDevice] = useState<string>("fit");
  const [zoom, setZoom] = useState(100);
  const [compare, setCompare] = useState(0); // 0 = off, else opacity 0..1

  const preset = DEVICE_PRESETS.find((d) => d.id === device);
  const fit = device === "fit";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 8px",
          borderBottom: "1px solid var(--border, #e4e4e7)",
          background: "var(--bg-subtle, #fafafa)",
          flexWrap: "wrap",
        }}
      >
        <select
          aria-label="Төхөөрөмж"
          value={device}
          onChange={(e) => setDevice(e.target.value)}
          style={{ ...btn, padding: "4px 6px" }}
        >
          <option value="fit">Тааруулах</option>
          {DEVICE_PRESETS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label} · {d.width}×{d.height}
            </option>
          ))}
        </select>

        <label style={{ fontSize: 12, color: "var(--text-muted, #71717a)", display: "flex", gap: 4, alignItems: "center" }}>
          🔍
          <input
            type="range"
            min={50}
            max={150}
            step={10}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Томруулах"
          />
          {zoom}%
        </label>

        {expectedImage ? (
          <label style={{ fontSize: 12, color: "var(--text-muted, #71717a)", display: "flex", gap: 4, alignItems: "center" }}>
            ⚖
            <input
              type="range"
              min={0}
              max={100}
              value={compare * 100}
              onChange={(e) => setCompare(Number(e.target.value) / 100)}
              aria-label="Харьцуулах"
            />
          </label>
        ) : null}

        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {toolbarExtra}
          <button type="button" style={btn} onClick={() => (ref as RefObject<PreviewHostHandle>)?.current?.reload()}>
            ⟳
          </button>
        </div>
      </div>

      {/* stage */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          display: "flex",
          alignItems: fit ? "stretch" : "flex-start",
          justifyContent: "center",
          padding: fit ? 0 : 16,
          background: "var(--bg-muted, #f4f4f5)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: fit ? "100%" : preset!.width,
            height: fit ? "100%" : preset!.height,
            transform: fit ? undefined : `scale(${zoom / 100})`,
            transformOrigin: "top center",
            border: fit ? "none" : "1px solid var(--border-strong, #d4d4d8)",
            borderRadius: fit ? 0 : 12,
            overflow: "hidden",
            boxShadow: fit ? "none" : "var(--shadow-md, 0 4px 12px rgb(0 0 0 / .08))",
            flexShrink: 0,
          }}
        >
          <PreviewHost ref={ref} {...hostProps} width="100%" height="100%" />
          {expectedImage && compare > 0 ? (
            <img
              src={expectedImage}
              alt="Хүлээгдэж буй үр дүн"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: compare, pointerEvents: "none" }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
});
