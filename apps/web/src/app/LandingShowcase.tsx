"use client";

/**
 * The landing's "skills you build" band. It maps localized slide copy onto the
 * SqueezeCarousel and dresses each panel with an on-brand gradient (no external
 * images — the rest of the landing uses none either). The section heading and
 * slide text come from the server page via next-intl, so it stays bilingual.
 */

import { SqueezeCarousel, type SqueezeSlide } from "./SqueezeCarousel";
import s from "./squeeze.module.css";

export type ShowcaseSlide = { tag: string; title: string; desc: string };

/** One illustration per panel — self-hosted SVG scenes (gradient + a tech motif
    for that stage). The gradient below is a fallback if an image ever fails. */
const IMAGES = [
  "/img/showcase/1-html.svg",
  "/img/showcase/2-css.svg",
  "/img/showcase/3-js.svg",
  "/img/showcase/4-react.svg",
  "/img/showcase/5-backend.svg",
  "/img/showcase/6-deploy.svg",
];
const BACKGROUNDS = [
  "linear-gradient(135deg, #4f46e5, #7c3aed)",
  "linear-gradient(135deg, #0284c7, #2563eb)",
  "linear-gradient(135deg, #d97706, #ea580c)",
  "linear-gradient(135deg, #0d9488, #059669)",
  "linear-gradient(135deg, #e11d48, #db2777)",
  "linear-gradient(135deg, #475569, #6d28d9)",
];

export function LandingShowcase({
  slides,
  courseHref,
  actionLabel,
  label,
}: {
  slides: ShowcaseSlide[];
  courseHref: string;
  actionLabel: string;
  label: string;
}) {
  const panels: SqueezeSlide[] = slides.map((d, i) => ({
    id: i,
    title: d.title,
    description: d.desc,
    overlay: <span className={s.mark}>{d.tag}</span>,
    image: IMAGES[i % IMAGES.length],
    imageAlt: "",
    background: BACKGROUNDS[i % BACKGROUNDS.length],
    action: actionLabel,
    href: courseHref,
  }));

  return (
    <SqueezeCarousel
      slides={panels}
      label={label}
      autoplay
      interval={5000}
      height="clamp(200px, 34cqi, 360px)"
    />
  );
}

export default LandingShowcase;
