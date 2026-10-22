# bootstrap-flexoki

[Flexoki](https://stephango.com/flexoki) theme for [Bootstrap 6](https://getbootstrap.com/)
(`6.0.0-alpha.1`), with light and dark mode.

## Install

```sh
npm install bootstrap@6.0.0-alpha.1 bootstrap-flexoki
```

## Usage

### CSS

Load the theme after Bootstrap's stylesheet, and Bootstrap's JavaScript as usual:

```html
<link rel="stylesheet" href="node_modules/bootstrap/dist/css/bootstrap.min.css" />
<link rel="stylesheet" href="node_modules/bootstrap-flexoki/dist/bootstrap-flexoki.css" />
<script src="node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
```

The theme only overrides Bootstrap's custom properties, so it works with `bootstrap.css` or
`bootstrap.min.css`, from npm or a CDN.

### Sass

Add `node_modules` to your Sass load paths. The module forwards Bootstrap, so configure it as
you would Bootstrap:

```scss
@use "bootstrap-flexoki/src/bootstrap-flexoki" with (
  $spacer: 1.25rem
);
```

Bootstrap only merges theme maps one level deep, so to change part of one, start from this
theme's map. For example, to make cyan the primary color:

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

Bootstrap 6's Sass writes custom properties without the `--bs-` prefix, and Bootstrap adds it
in its own build. Its JavaScript reads the prefixed names, so add the prefix the same way, with
[postcss-prefix-custom-properties](https://www.npmjs.com/package/postcss-prefix-custom-properties):

```json
{ "plugins": { "postcss-prefix-custom-properties": { "prefix": "bs-" } } }
```

### Palette only

`dist/flexoki.css` has the Flexoki palette as `--flexoki-*` custom properties, and
`src/_tokens.scss` has it as Sass variables.

## Colors

Light mode uses Flexoki's paper background and 600 accents; dark mode uses black and 400 accents.

| Bootstrap                                       | Flexoki                                |
| ----------------------------------------------- | -------------------------------------- |
| primary, accent, success, danger, warning, info | blue, purple, green, red, orange, cyan |
| secondary, inverse                              | base                                   |
| `--white`, `--black`                            | paper, black                           |
| `--gray-050` to `--gray-950`                    | base 50 to 950                         |
| `--{hue}-050` to `--{hue}-950`                  | the same Flexoki hue                   |
| `--bg-body`, `--bg-1` to `--bg-4`               | bg, bg-2, ui, ui-2, ui-3               |
| `--fg-body`, `--fg-3`, `--fg-4`                 | tx, tx-2, tx-3                         |

Hues are red, orange, yellow, green, cyan, blue, purple and magenta, plus Flexoki's 150 and 850
stops. Bootstrap's indigo, violet, pink, amber, lime, teal, brown and pewter are removed.

Text on green and cyan in light mode, and on red in dark mode, falls just short of WCAG AA
(4.4:1).

## Development

Use Node.js 26, then `npm ci`.

- `npm run build`: compile the theme and stock Bootstrap from Sass, and write the declarations
  that differ to `dist/bootstrap-flexoki.css`. The build fails if anything besides a custom
  property differs.
- `npm test`: build, then run format, lint, type and unit checks.
- `npm run fix`: fix lint and formatting.
- `npm run demo`: serve Bootstrap's [cheatsheet](https://getbootstrap.com/docs/6.0/examples/cheatsheet/)
  with this theme at <http://localhost:9001/>.
- `npm run tokens:sync`: regenerate `src/_tokens.scss` from the Flexoki commit pinned in
  `scripts/sync-tokens.ts`, or from a local `flexoki.css` path.

The cheatsheet is copyright the Bootstrap Authors, licensed under
[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
