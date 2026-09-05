// The editor type-imports from @khiye/preview, whose PreviewFrame imports a CSS
// module; this ambient declaration lets tsc resolve it when it follows into
// that source. Mirrors @khiye/ui and @khiye/preview.
declare module "*.module.css" {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

declare module "*.css";
