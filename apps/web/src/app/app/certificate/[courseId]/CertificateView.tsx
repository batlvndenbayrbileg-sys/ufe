"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Award, Printer, ArrowLeft } from "lucide-react";
import { Spinner } from "@khiye/ui";
import { loadProgress, type Progress } from "@/lib/progress";
import { courseCompletion, issueCertificate, type CertificateRecord } from "@/lib/certificate";
import { flattenLessons } from "../../course-types";
import { useCourseMap } from "../../useCourseMap";
import { BrandMark } from "../../../BrandMark";
import s from "./certificate.module.css";

export function CertificateView({ courseId }: { courseId: string }) {
  const { map } = useCourseMap();
  const { data: session } = useSession();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [name, setName] = useState("");
  const [cert, setCert] = useState<CertificateRecord | null>(null);

  useEffect(() => setProgress(loadProgress()), []);

  const lessons = useMemo(() => (map ? flattenLessons(map) : []), [map]);
  const completion = useMemo(
    () => (progress ? courseCompletion(lessons, progress) : { done: 0, total: 0, complete: false }),
    [lessons, progress],
  );

  // Once complete, mint (or load) the certificate; prefill the name from the
  // session, then keep whatever the student types.
  useEffect(() => {
    if (!completion.complete) return;
    const initialName = session?.user?.name || "";
    const record = issueCertificate(courseId, initialName);
    setCert(record);
    setName(record.name || initialName);
  }, [completion.complete, courseId, session?.user?.name]);

  const onNameBlur = () => {
    if (completion.complete) setCert(issueCertificate(courseId, name.trim()));
  };

  if (!map || !progress) {
    return (
      <div className={s.stateWrap}>
        <Spinner size={24} label="Ачааллаж байна" />
      </div>
    );
  }

  if (!completion.complete) {
    return (
      <div className={s.stateWrap}>
        <div className={s.stateCard}>
          <Award size={40} className={s.stateIcon} />
          <h1 className={s.stateTitle}>Гэрчилгээ хараахан бэлэн биш</h1>
          <p className={s.stateBody}>
            Курсын бүх хичээлийг дуусгасны дараа гэрчилгээгээ авах боломжтой болно.
          </p>
          <p className={s.stateProgress}>
            {completion.done}/{completion.total} хичээл дууссан
          </p>
          <a href={`/app/course/${courseId}`} className={s.stateLink}>
            Хичээлүүд рүү буцах →
          </a>
        </div>
      </div>
    );
  }

  const issued = cert ? new Date(cert.issuedAt) : new Date();
  const dateText = issued.toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" });
  const modules = map.stages.reduce((n, st) => n + st.modules.length, 0);

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <a href="/app" className={s.toolbarBack}>
          <ArrowLeft size={16} /> Буцах
        </a>
        <button type="button" className={s.printBtn} onClick={() => window.print()}>
          <Printer size={16} /> Хэвлэх / PDF
        </button>
      </div>

      <article className={s.certificate}>
        <div className={s.frame}>
          <div className={s.frameInner}>
            <p className={s.certBrand}>
              <BrandMark size={22} /> Botxon
            </p>

            <h1 className={s.certTitle}>ГЭРЧИЛГЭЭ</h1>
            <p className={s.certKind}>Курс дүүргэсний</p>
            <span className={s.rule} aria-hidden />

            <p className={s.certLead}>Энэхүү гэрчилгээг</p>

            <label className={s.certNameWrap}>
              <input
                className={s.certName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={onNameBlur}
                placeholder="Нэрээ бичнэ үү"
                aria-label="Нэр"
              />
            </label>

            <p className={s.certBody}>
              «<strong>{map.title.mn}</strong>» курсыг амжилттай дүүргэж,{" "}
              <b>{completion.total}</b> хичээл, <b>{modules}</b> модуль, <b>{map.stages.length}</b> шатыг
              бүрэн эзэмшсэн тул олгов.
            </p>

            <div className={s.certFoot}>
              <div className={s.sig}>
                <span className={s.sigValue}>{dateText}</span>
                <span className={s.sigLine} aria-hidden />
                <span className={s.sigLabel}>Огноо</span>
              </div>

              <span className={s.seal} aria-hidden>
                <Seal />
              </span>

              <div className={s.sig}>
                <span className={s.sigValue}>{cert?.serial ?? "—"}</span>
                <span className={s.sigLine} aria-hidden />
                <span className={s.sigLabel}>Дугаар</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

/** A gold medallion with a ribbon — the certificate's seal. */
function Seal() {
  return (
    <svg viewBox="0 0 100 132" width="88" height="116" role="img" aria-label="Тамга">
      <defs>
        <linearGradient id="certGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e7cd86" />
          <stop offset="0.5" stopColor="#c9a24b" />
          <stop offset="1" stopColor="#a67c2e" />
        </linearGradient>
        <linearGradient id="certGoldSoft" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3e6bf" />
          <stop offset="1" stopColor="#d8b866" />
        </linearGradient>
      </defs>
      {/* ribbon tails */}
      <path d="M38 84 L28 128 L44 118 L50 128 L50 90 Z" fill="url(#certGold)" />
      <path d="M62 84 L72 128 L56 118 L50 128 L50 90 Z" fill="url(#certGoldSoft)" />
      {/* medallion */}
      <circle cx="50" cy="46" r="42" fill="url(#certGoldSoft)" />
      <circle cx="50" cy="46" r="42" fill="none" stroke="#a67c2e" strokeWidth="1.5" />
      <circle cx="50" cy="46" r="33" fill="url(#certGold)" />
      <circle cx="50" cy="46" r="26" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.5" />
      {/* star */}
      <path
        d="M50 30 l4.6 9.6 10.6 1.4 -7.8 7.3 2 10.5 -9.4 -5.1 -9.4 5.1 2 -10.5 -7.8 -7.3 10.6 -1.4 Z"
        fill="#fff"
        fillOpacity="0.92"
      />
    </svg>
  );
}
