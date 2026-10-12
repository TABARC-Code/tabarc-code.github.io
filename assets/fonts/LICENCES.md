# Font licences

The pages on this site used to ask Google for their fonts on every visit. They no longer do: the files below are self-hosted copies, downloaded from Google Fonts on 12 October 2026, so a visitor's browser talks to this site and nobody else.

All four families are licensed under the **SIL Open Font License, Version 1.1**. That licence lets you use, copy and redistribute the fonts, including in commercial work, provided the copyright notice and licence text travel with them. They do, in `licences/`. The fonts can't be sold on their own.

| Family | Used for | Copyright | Licence text |
| --- | --- | --- | --- |
| IBM Plex Mono | Body and code text | Copyright © 2017 IBM Corp., Reserved Font Name "Plex" | [licences/IBM-Plex-Mono-OFL.txt](licences/IBM-Plex-Mono-OFL.txt) |
| Orbitron | Headings on the landing page | Copyright 2018 The Orbitron Project Authors, Reserved Font Name "Orbitron" | [licences/Orbitron-OFL.txt](licences/Orbitron-OFL.txt) |
| Space Grotesk | Headings on the Projects and Docs pages | Copyright 2020 The Space Grotesk Project Authors | [licences/Space-Grotesk-OFL.txt](licences/Space-Grotesk-OFL.txt) |
| Atkinson Hyperlegible | Globified control panel | Copyright 2020 Braille Institute of America, Inc. | [licences/Atkinson-Hyperlegible-OFL.txt](licences/Atkinson-Hyperlegible-OFL.txt) |

The licence texts come from Google's own repository (`github.com/google/fonts`, under `ofl/`), so the copyright lines are theirs, not mine.

## What's in the folder

- `site-fonts.css` declares IBM Plex Mono (400, 500, 600), Orbitron and Space Grotesk (both variable, so one file covers every weight).
- `atkinson.css` declares Atkinson Hyperlegible, regular and bold with italics. Globified uses it.
- The `.woff2` files are the ones Google serves, unmodified by me. Latin and Latin Extended subsets only, which is plenty for English and most Western European text. Cyrillic, Greek and Vietnamese were left out to save weight (about 250KB for everything). If the site ever needs them, request the same CSS from Google Fonts and keep the extra subsets.

## A note on the "Reserved Font Name" clauses

IBM Plex and Orbitron reserve their names. The OFL says a modified version mustn't use the reserved name. These files are the unmodified builds Google distributes, so the names stay. If you ever edit the glyphs yourself, rename the family.

Author: TABARC-Code
