"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type PanInfo, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, X, Check } from "lucide-react";
import { getIntroDeck, markIntroSeen, type IntroSlide } from "@/lib/courseIntro";
import s from "./intro.module.css";

const slideVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.42, ease: [0.2, 0.8, 0.2, 1] } },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60, transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } }),
};

const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.12 + i * 0.07, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] } }),
};

export function CourseIntro({ courseId }: { courseId: string }) {
  const router = useRouter();
  const deck = useMemo(() => getIntroDeck(courseId), [courseId]);
  const [[index, dir], setState] = useState<[number, number]>([0, 0]);

  const total = deck?.slides.length ?? 0;
  const finish = useCallback(() => {
    if (!deck) return;
    markIntroSeen(deck.courseId);
    markIntroSeen(deck.slug);
    router.push(`/learn/${deck.firstLessonId}`);
  }, [deck, router]);

  const skip = useCallback(() => {
    if (!deck) return;
    markIntroSeen(deck.courseId);
    markIntroSeen(deck.slug);
    router.push(`/app/course/${deck.slug}`);
  }, [deck, router]);

  const go = useCallback(
    (next: number) => {
      if (!deck) return;
      if (next < 0) return;
      if (next >= total) return finish();
      setState(([cur]) => [next, next > cur ? 1 : -1]);
    },
    [deck, total, finish],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") { e.preventDefault(); go(index + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
      else if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, skip]);

  if (!deck) {
    return (
      <div className={s.wrap}>
        <div className={s.stage}>
          <p className={s.lead}>Танилцуулга олдсонгүй.</p>
          <button className={s.cta} onClick={() => router.push("/app")}>Буцах</button>
        </div>
      </div>
    );
  }

  const slide = deck.slides[index]!;
  const last = index === total - 1;
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -80) go(index + 1);
    else if (info.offset.x > 80) go(index - 1);
  };

  return (
    <div
      className={s.wrap}
      style={{ ["--a" as string]: deck.accent, ["--a2" as string]: deck.accent2 }}
    >
      <div className={s.aura} aria-hidden />
      <header className={s.top}>
        <span className={s.brandChip}><Sparkles size={15} strokeWidth={2.4} /> Танилцуулга</span>
        <button className={s.skip} onClick={skip} aria-label="Алгасах">
          Алгасах <X size={15} strokeWidth={2.4} />
        </button>
      </header>

      <div className={s.progress} role="progressbar" aria-valuenow={index + 1} aria-valuemax={total}>
        <div className={s.progressFill} style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      <AnimatePresence initial={false} custom={dir} mode="wait">
        <motion.div
          key={index}
          className={s.stage}
          custom={dir}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={onDragEnd}
        >
          <Slide slide={slide} />
        </motion.div>
      </AnimatePresence>

      <footer className={s.bottom}>
        <button className={s.navBtn} onClick={() => go(index - 1)} disabled={index === 0} aria-label="Өмнөх">
          <ArrowLeft size={18} strokeWidth={2.4} />
        </button>
        <div className={s.dots} role="tablist" aria-label="Дэлгэц">
          {deck.slides.map((_, i) => (
            <button
              key={i}
              className={`${s.dot} ${i === index ? s.dotOn : ""}`}
              onClick={() => setState(([cur]) => [i, i > cur ? 1 : -1])}
              aria-label={`Дэлгэц ${i + 1}`}
              aria-selected={i === index}
            />
          ))}
        </div>
        {last ? (
          <button className={`${s.navBtn} ${s.navNext}`} onClick={finish} aria-label="Эхлэх">
            <Check size={18} strokeWidth={2.6} />
          </button>
        ) : (
          <button className={`${s.navBtn} ${s.navNext}`} onClick={() => go(index + 1)} aria-label="Дараах">
            <ArrowRight size={18} strokeWidth={2.4} />
          </button>
        )}
      </footer>
    </div>
  );
}

function Slide({ slide }: { slide: IntroSlide }) {
  switch (slide.kind) {
    case "hero":
      return (
        <div className={`${s.slide} ${s.hero}`}>
          <motion.div className={s.heroEmoji} variants={rise} custom={0} initial="hidden" animate="show">{slide.emoji}</motion.div>
          <motion.span className={s.kicker} variants={rise} custom={1} initial="hidden" animate="show">{slide.kicker}</motion.span>
          <motion.h1 className={s.heroTitle} variants={rise} custom={2} initial="hidden" animate="show">{slide.title}</motion.h1>
          <motion.p className={s.heroSub} variants={rise} custom={3} initial="hidden" animate="show">{slide.subtitle}</motion.p>
          <motion.p className={s.heroNote} variants={rise} custom={4} initial="hidden" animate="show">{slide.note}</motion.p>
        </div>
      );
    case "what":
      return (
        <div className={s.slide}>
          <SlideHead title={slide.title} />
          <motion.p className={s.lead} variants={rise} custom={1} initial="hidden" animate="show">{slide.lead}</motion.p>
          <div className={s.points}>
            {slide.points.map((p, i) => (
              <motion.div key={p.label} className={s.point} variants={rise} custom={i + 2} initial="hidden" animate="show">
                <span className={s.pointEmoji}>{p.emoji}</span>
                <span className={s.pointLabel}>{p.label}</span>
                <span className={s.pointText}>{p.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      );
    case "history":
      return (
        <div className={s.slide}>
          <SlideHead title={slide.title} sub={slide.lead} />
          <div className={s.timeline}>
            {slide.events.map((e, i) => (
              <motion.div key={e.year} className={s.tItem} variants={rise} custom={i + 1} initial="hidden" animate="show">
                <div className={s.tRail}><span className={s.tDot} /></div>
                <div className={s.tBody}>
                  <span className={s.tYear}>{e.year}</span>
                  <span className={s.tTitle}>{e.title}</span>
                  <span className={s.tText}>{e.text}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
    case "uses":
      return (
        <div className={s.slide}>
          <SlideHead title={slide.title} sub={slide.lead} />
          <div className={s.cardGrid}>
            {slide.cards.map((c, i) => (
              <motion.div key={c.title} className={s.useCard} variants={rise} custom={i + 1} initial="hidden" animate="show">
                <span className={s.useEmoji}>{c.emoji}</span>
                <span className={s.useTitle}>{c.title}</span>
                <span className={s.useText}>{c.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      );
    case "companies":
      return (
        <div className={s.slide}>
          <SlideHead title={slide.title} sub={slide.lead} />
          <div className={s.companyGrid}>
            {slide.names.map((n, i) => (
              <motion.div key={n.name} className={s.company} variants={rise} custom={Math.floor(i / 2) + 1} initial="hidden" animate="show">
                <span className={s.companyName}>{n.name}</span>
                <span className={s.companyHint}>{n.hint}</span>
              </motion.div>
            ))}
          </div>
        </div>
      );
    case "tech":
      return (
        <div className={s.slide}>
          <SlideHead title={slide.title} sub={slide.lead} />
          <div className={s.techGrid}>
            {slide.items.map((t, i) => (
              <motion.div key={t.name} className={s.tech} variants={rise} custom={Math.floor(i / 3) + 1} initial="hidden" animate="show">
                <div className={s.techTop}>
                  <span className={s.techName}>{t.name}</span>
                  <span className={s.techTag}>{t.tag}</span>
                </div>
                <span className={s.techDesc}>{t.desc}</span>
              </motion.div>
            ))}
          </div>
        </div>
      );
    case "roadmap":
      return (
        <div className={s.slide}>
          <SlideHead title={slide.title} sub={slide.lead} />
          <div className={s.roadmap}>
            {slide.steps.map((st, i) => (
              <motion.div key={st.label} className={s.step} variants={rise} custom={i + 1} initial="hidden" animate="show">
                <span className={s.stepNum}>{i + 1}</span>
                <div className={s.stepBody}>
                  <span className={s.stepLabel}>{st.label}</span>
                  <span className={s.stepText}>{st.text}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
    case "cta":
      return (
        <div className={`${s.slide} ${s.hero}`}>
          <motion.div className={s.heroEmoji} variants={rise} custom={0} initial="hidden" animate="show">{slide.emoji}</motion.div>
          <motion.h1 className={s.heroTitle} variants={rise} custom={1} initial="hidden" animate="show">{slide.title}</motion.h1>
          <motion.p className={s.heroSub} variants={rise} custom={2} initial="hidden" animate="show">{slide.lead}</motion.p>
        </div>
      );
  }
}

function SlideHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className={s.head}>
      <motion.h2 className={s.title} variants={rise} custom={0} initial="hidden" animate="show">{title}</motion.h2>
      {sub ? <motion.p className={s.sub} variants={rise} custom={0.5} initial="hidden" animate="show">{sub}</motion.p> : null}
    </div>
  );
}
