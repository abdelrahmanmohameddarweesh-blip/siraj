# Athkar Dataset — Source & License Status

**Status: ⚠️ UNVERIFIED — PENDING SOURCE REPLACEMENT AND SCHOLARLY REVIEW**

## Correction (2026-10-13)
An earlier version of this file cited `github.com/guellil/hisn-almuslim-json` under an MIT
license. That repository **does not exist** (HTTP 404). The citation was wrong and has been removed.

The texts currently in `data/hisnAlMuslim.ts` were **entered by the AI assistant from memory**, not
imported from a verified digital source. That violates the project rule "do not generate
religious text yourself". Treat every text, count, reference, and grade in that file as
**unverified placeholder data**. Do not ship it to users.

## What is needed before release
1. Choose a real source and confirm its license in writing, for example:
   - a published Hisn al-Muslim edition whose publisher grants digital-use permission, or
   - an open dataset with a LICENSE file you can check.
2. Import the texts programmatically from that source. No hand-typing.
3. A qualified reviewer checks each item: text, repetition count, hadith reference, and grade.
4. Record the reviewer's name and date here, then remove the "pending" flags in code.

## How references and grades will be checked
- Compare each reference against the primary collection (Bukhari, Muslim, Abu Dawud,
  at-Tirmidhi, an-Nasa'i, Ibn Majah, Ahmad), using the numbering of a named edition.
- Grades are copied from the source edition with its grader named (for example al-Albani).
  We do not assign grades ourselves.
