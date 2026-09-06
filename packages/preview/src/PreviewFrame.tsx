"use client";

import { forwardRef, useState, type ReactNode, type RefObject } from "react";
import { PreviewHost, type PreviewHostHandle, type PreviewHostProps } from "./PreviewHost";
import s from "./PreviewFrame.module.css";

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
    <div className={s.frame}>
      <div className={s.toolbar}>
        <span className={s.selectWrap}>
          <select
            aria-label="Төхөөрөмж"
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            className={s.select}
          >
            <option value="fit">Тааруулах</option>
            {DEVICE_PRESETS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label} · {d.width}×{d.height}
              </option>
            ))}
          </select>
          <span aria-hidden className={s.selectChevron}>
            ▾
          </span>
        </span>

        {/* A quiet address bar — frames the pane as the student's live site. */}
        <span className={s.urlBar} title="Таны амьд сайт">
          <svg className={s.urlLock} width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="4" y="11" width="16" height="10" rx="2" fill="currentColor" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2.2" fill="none" />
          </svg>
          <span className={s.urlHost}>shop.mn</span>
        </span>

        {/* Zoom only scales a fixed-size device; in fit mode it does nothing,
            so it isn't shown. */}
        {fit ? null : (
          <>
            <span className={s.divider} aria-hidden />
            <label className={s.control}>
              <span className={s.controlIcon} aria-hidden>
                🔍
              </span>
              <input
                type="range"
                className={s.range}
                min={50}
                max={150}
                step={10}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label="Томруулах"
              />
              <span className={s.value}>{zoom}%</span>
            </label>
          </>
        )}

        {expectedImage ? (
          <>
            <span className={s.divider} aria-hidden />
            <label className={s.control}>
              <span className={s.controlIcon} aria-hidden>
                ⚖
              </span>
              <input
                type="range"
                className={s.range}
                min={0}
                max={100}
                value={compare * 100}
                onChange={(e) => setCompare(Number(e.target.value) / 100)}
                aria-label="Харьцуулах"
              />
            </label>
          </>
        ) : null}

        <span className={s.spacer} />
        <div className={s.right}>
          {toolbarExtra}
          <button
            type="button"
            className={s.iconBtn}
            aria-label="Дахин ачаалах"
            title="Дахин ачаалах"
            onClick={() => (ref as RefObject<PreviewHostHandle>)?.current?.reload()}
          >
            ⟳
          </button>
        </div>
      </div>

      <div className={`${s.stage} ${fit ? s.stageFit : s.stageDevice}`}>
        <div
          className={`${s.viewport} ${fit ? s.viewportFit : s.viewportDevice}`}
          style={
            fit
              ? undefined
              : { width: preset!.width, height: preset!.height, transform: `scale(${zoom / 100})` }
          }
        >
          <PreviewHost ref={ref} {...hostProps} width="100%" height="100%" />
          {expectedImage && compare > 0 ? (
            <img src={expectedImage} alt="Хүлээгдэж буй үр дүн" className={s.overlay} style={{ opacity: compare }} />
          ) : null}
        </div>
      </div>
    </div>
  );
});
