# Portfolio typography

PP Editorial New is loaded locally from `static/fonts/` through @font-face in `src/app.css`. Regular (400) is used for headings. All six supplied styles are included: regular/italic 400, ultralight/italic 200, ultrabold/italic 800.

Futura PT is loaded through your Adobe Fonts project in `src/app.html`:

```html
<link rel="stylesheet" href="https://use.typekit.net/npl5wdz.css">
```

The exact CSS family is `futura-pt`. Body text uses 400; navigation and labels use 700. The stylesheet also contains condensed and separate bold families, which this design does not use. Adobe Fonts needs an internet connection; local sans fallbacks apply if unavailable.

Existing font sizes, grids, spacing and image ratios have been retained. Compare the site at the same viewport width as the Illustrator artboard; exact Illustrator sizes can be used for further tuning.

Before publishing, confirm your PP Editorial New licence permits self-hosted web use. Keep the Adobe Fonts web project active.

## Illustrator calibration
Main headings: 75px / 90px, tracking 0. Eyebrows: Futura PT Book 25px / 30px. Home introduction heading: 45px / 54px. Home body: Book 24px. Footer: Medium 15px, uppercase. These are numeric screen-design sizes, not CSS pt (which would enlarge them by 4/3). Smaller screens reduce sizes for fit.

Your current Adobe kit has weights 400 and 700, but not Medium 500. Footer requests 500; until you add Futura PT Medium to the same Adobe web project and republish, the browser uses the nearest available weight. No synthetic bold is used.

## Updated Adobe project
Verified the supplied stylesheet now includes Futura PT Medium (500). Copyright uses that weight. Header name, navigation, section labels, buttons and Back to top explicitly use the separate `futura-pt-bold` family at 700. Body and eyebrows remain `futura-pt` at 400; large name/title headings remain PP Editorial New. This supersedes the earlier missing-Medium note.

Desktop calibration now scales from the measured 1920px artboard. See DESIGN-REFERENCE.md for exact sizes and line heights. Earlier fixed/clamped desktop sizing is superseded by this measured scale.
