# Make the Google Analytics tag reliably detectable

## Confirmed cause

The Google tag is not present in the server-delivered HTML on either the published site or the preview. It is currently created in the browser only after a visitor accepts tracking. Google’s tag test checks the initial page and therefore reports “tag not found” before that acceptance happens.

## Plan

1. **Place the Google tag in the global page head**
   - Add the Google loader for `G-R3MYKWYPR1` once at the root so every page and language version exposes the same tag on first load.
   - Initialize Google consent to denied before the tag starts, preserving the site’s consent-first behavior until the visitor chooses.

2. **Remove duplicate loading while preserving event tracking**
   - Update the existing tracking helper to reuse the globally initialized `gtag` queue instead of injecting a second Google script.
   - Keep consent acceptance/refusal updates, initial page measurement, client-side route page views, and existing lead/event reporting working through the same tag.

3. **Verify the complete flow**
   - Confirm the measurement ID appears in initial HTML and only one Google tag script is loaded.
   - Test a fresh visitor before consent, acceptance, homepage measurement, navigation to another page, and a custom event.
   - Check browser requests and errors, then verify the published site after deployment because Google’s checker tests the public URL, not the editor preview.

## Technical details

- Files expected to change: the root document and the existing tracking helper; privacy wording only if the current disclosure does not cover consent-denied Google tag loading.
- No second analytics library or duplicate measurement property will be introduced.
- The existing measurement ID remains `G-R3MYKWYPR1`.
