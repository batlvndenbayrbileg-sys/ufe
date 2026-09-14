import { GraduationCap, Rocket, Award } from "lucide-react";
import s from "./authForm.module.css";

const FEATURES = [
  { Icon: GraduationCap, text: "2 курс · 234 хичээл" },
  { Icon: Rocket, text: "Бодит төсөл дээр дадлагажина" },
  { Icon: Award, text: "Дуусгавал гэрчилгээ" },
];

/** The branded marketing column beside the auth form (UFE ISMD). */
export function AuthAside() {
  return (
    <>
      <div className={s.asideBrand}>UFE ISMD</div>
      <div>
        <h2 className={s.asideHeadline}>Кодоор бүтээж сур.</h2>
        <p className={s.asideSub}>
          Интернэт ба мобайл программчлалыг эхнээс нь, бодит төсөл дээр өөрөө бичиж сур.
        </p>
      </div>
      <ul className={s.asideFeatures}>
        {FEATURES.map((f) => (
          <li key={f.text}>
            <span className={s.asideFeatureIcon} aria-hidden>
              <f.Icon size={18} strokeWidth={2.2} />
            </span>
            {f.text}
          </li>
        ))}
      </ul>
    </>
  );
}
