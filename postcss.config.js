import prefixCustomProperties from "postcss-prefix-custom-properties";

// Match Bootstrap's own build, which prefixes every custom property with --bs- after Sass
// compiles. Its JavaScript reads some of them, such as --bs-breakpoint-md.
export default {
  plugins: [
    prefixCustomProperties({
      prefix: "bs-",
      ignore: [/^--bs-/, /^--flexoki-/],
    }),
  ],
};
