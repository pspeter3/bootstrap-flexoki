# bootstrap-flexoki

[Flexoki](https://stephango.com/flexoki) theme for [Bootstrap 6](https://getbootstrap.com/) (`6.0.0-alpha.1`).

Every Bootstrap color token uses an exact Flexoki shade, and light and dark mode follow the
shades Flexoki recommends: `paper`/`black` backgrounds, the base scale for UI and text, and
accents at 600 in light mode and 400 in dark mode.

## Usage

Use the compiled stylesheet in place of Bootstrap's:

```html
<link rel="stylesheet" href="node_modules/bootstrap-flexoki/dist/bootstrap-flexoki.css" />
```

Like Bootstrap's own stylesheet, its custom properties use the `--bs-` prefix (`--bs-blue-600`),
which Bootstrap's JavaScript relies on.

Or compile it with Sass, adding `node_modules` to your load paths. The module forwards
Bootstrap, so you can configure it the same way. As with Bootstrap, Sass output has no
`--bs-` prefix: run the same PostCSS step as `postcss.config.js` to add it.

```scss
@use "bootstrap-flexoki/src/bootstrap-flexoki" with (
  $spacer: 1.25rem
);
```

Bootstrap merges theme maps one level deep, so start from this theme's maps to change part of
one. For example, to make cyan the primary color:

```scss
@use "sass:map";
@use "bootstrap-flexoki/src/theme";
@use "bootstrap-flexoki/src/bootstrap-flexoki" with (
  $theme-colors: map.merge(
    theme.$theme-colors,
    (
      "primary": theme.theme-color("cyan"),
    )
  )
);
```

`dist/flexoki.css` (or `src/flexoki.scss`) has just the palette as `--flexoki-*` custom
properties, and `src/_tokens.scss` has it as Sass variables and maps.

## Color mapping

| Bootstrap                                       | Flexoki                                                    |
| ----------------------------------------------- | ---------------------------------------------------------- |
| `--white`, `--black`                            | paper, black                                               |
| `--gray-050` to `--gray-950`                    | base 50 to 950                                             |
| `--{hue}-050` to `--{hue}-950`                  | red, orange, yellow, green, cyan, blue, purple and magenta |
| `--{hue}-150`, `--{hue}-850`                    | Flexoki shades without a Bootstrap stop                    |
| `--bg-body`, `--bg-1` to `--bg-4`               | bg, bg-2, ui, ui-2, ui-3                                   |
| `--fg-body`, `--fg-3`, `--fg-4`                 | tx, tx-2, tx-3 (`--fg-1` and `--fg-2` step between)        |
| primary, accent, success, danger, warning, info | blue, purple, green, red, orange, cyan                     |
| secondary, inverse                              | base                                                       |

Bootstrap's indigo, violet, pink, amber, lime, teal, brown and pewter have no Flexoki
counterpart and are removed. Flexoki doesn't define Bootstrap's 025 and 975 stops, so Bootstrap
mixes them toward paper and black.

Flexoki's recommended accents fall just short of WCAG AA (4.5:1) for text on green and cyan in
light mode (4.39:1 and 4.43:1) and for red in dark mode (4.42:1). The tests list these exceptions.

## Development

Use Node.js 26 and install dependencies with `npm ci`.

- `npm run build`: compile `dist/bootstrap-flexoki.css` and `dist/flexoki.css`, then prefix
  custom properties with `--bs-` as Bootstrap's build does.
- `npm run demo:build`: build the demo site in `_site/`.
- `npm run demo`: build the demo, then serve it at <http://localhost:9001/>.
- `npm run tokens:sync`: regenerate `src/_tokens.scss` from the Flexoki commit pinned in
  `scripts/sync-tokens.js`. Pass a path to a local `flexoki.css` to use that instead.
- `npm run format:fix`: format files with Oxfmt.
- `npm run format:test`: check formatting without writing files.
- `npm run lint:fix`: fix SCSS lint problems where Stylelint supports it.
- `npm run lint:test`: check SCSS with the standard SCSS configuration.
- `npm run unit:test`: check the tokens, the color mapping and contrast.
- `npm run fix`: fix SCSS lint problems, then format files.
- `npm test`: run the build, formatting, lint and unit checks through Wireit.

The demo is Bootstrap's [cheatsheet](https://getbootstrap.com/docs/6.0/examples/cheatsheet/),
which shows every component, with a light and dark mode toggle. `npm run demo:build` downloads
it, checks that getbootstrap.com publishes the installed Bootstrap version, and points it at this
theme. The cheatsheet is copyright the Bootstrap Authors and licensed under
[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).

Pushes to `main` that pass the tests deploy the demo to GitHub Pages. In the repository's
Settings → Pages, set the source to GitHub Actions.
