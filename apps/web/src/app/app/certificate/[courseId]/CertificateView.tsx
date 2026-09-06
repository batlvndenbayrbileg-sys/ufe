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
        <div className={s.certInner}>
          <div className={s.certHead}>
            <span className={s.certBrand}>
              <BrandMark size={26} /> Хийе
            </span>
            <span className={s.certKind}>Дүүргэсний гэрчилгээ</span>
          </div>

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
            «<strong>{map.title.mn}</strong>» курсыг амжилттай дүүргэсэн тул олгов.
          </p>

          <div className={s.certStats}>
            <span>
              <b>{completion.total}</b> хичээл
            </span>
            <span className={s.certDot} aria-hidden />
            <span>
              <b>{modules}</b> модуль
            </span>
            <span className={s.certDot} aria-hidden />
            <span>
              <b>{map.stages.length}</b> шат
            </span>
          </div>

          <div className={s.certFoot}>
            <div className={s.certMeta}>
              <span className={s.certMetaLabel}>Огноо</span>
              <span className={s.certMetaValue}>{dateText}</span>
            </div>
            <div className={s.certSeal} aria-hidden>
              <Award size={30} strokeWidth={1.8} />
            </div>
            <div className={`${s.certMeta} ${s.certMetaRight}`}>
              <span className={s.certMetaLabel}>Дугаар</span>
              <span className={s.certMetaValue}>{cert?.serial ?? "—"}</span>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
