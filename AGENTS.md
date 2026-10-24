# Working preferences

## Verification and completion

- Verify user-visible browser changes before declaring them complete. Prefer the
  connected Chrome DevTools session when existing browser state matters; use
  Playwright when isolated, repeatable flows or multiple viewports are more suitable.
- Code inspection, builds, and unit tests alone do not verify browser behavior.
  Briefly report the verification method and observed result.
- Continue safe, in-scope investigation until the requested outcome is achieved
  or there is a concrete blocker. Use relevant local inspection, logs, tests, and
  external research where it could resolve the issue.
- If blocked, start the final response with `Blocked:` and state the evidence,
  attempts made, viable next options, and smallest action needed from the user.
- Lead with the outcome. Keep responses short and precise. For substantial
  uncertainty, present at most three practical options with trade-offs and sources.

## Sources of truth

- Read [dev-howto.md](dev-howto.md) for the map-definition workflow and
  [tests/README.md](tests/README.md) for regression setup, coverage, and measured
  baselines. Maintain those details there rather than copying them into this file.
- Consult [package.json](package.json), [inc_patch.sh](inc_patch.sh), and
  [deploy.js](deploy.js) before building. Distinguish rebuilding the extension from
  deploying its external copy. In this session, the managed sandbox permitted the
  repository build but denied the external copy; inspect output rather than
  treating a successful process exit as proof of deployment.
- Keep dependency versions, extension versions, map counts, ports, extension IDs,
  paths, and bundle measurements in their owning source/configuration or test docs.

## Browser verification for this project

- Use the user's dedicated Chrome Beta debugging profile. Confirm that the loaded
  extension points to this checkout's build and that verification exercises the
  rebuilt assets. Follow the build/reload procedure in [tests/README.md](tests/README.md).
- The connected DevTools tool rejected extension URLs during this session. If that
  restriction remains, use the existing direct-CDP test runner rather than relying
  solely on a web-page preview with mocked extension APIs.
- Opening a popup programmatically is not sufficient evidence that map navigation
  has the same tab access as a toolbar click. Use the toolbar-action procedure in
  the browser test runner. See [tests/README.md](tests/README.md) for its rationale
  and protocol reference.
- Wait for the popup to render and for destination pages to normalize their URLs.
  Preserve existing user tabs, close temporary test tabs, and restore any settings
  changed during verification.
- Before performance refactors, establish passing round-trip tests and rerun them
  afterward. Keep the user's agreed coverage and exclusions in the test docs.
  When settings or metadata loading changes, also verify Options rendering,
  persistence, and the resulting popup contents.

## Layout and build lessons

- Chrome toolbar popups have a browser-imposed size limit. Increasing content width
  beyond it adds scrolling rather than enlarging the popup. Measure the actual
  viewport and scrollbar space; see the [Chrome popup constraints](https://github.com/GoogleChrome/modern-web-guidance/blob/main/skills/chrome-extensions/references/extensions/popup-ui.md).
- Check both horizontal overflow and the bottom of the list, including hovered
  tooltips. A blank tail can come from invisible, absolutely positioned tooltip
  content: hiding visibility does not remove its scrollable geometry. Inspect that
  geometry before reducing content or suppressing overflow.
- Syntax accepted by Node tests may still fail the production minifier. This
  session exposed that mismatch with optional chaining. Verify compatibility with
  the actual production build before considering a syntax change complete.
- Measure generated bundles and inspect source maps when evaluating dependency
  changes. Broad named imports retained a whole utility library in this build;
  import style alone is not proof that unused code was removed. Report bundle-size
  reductions separately from startup-speed claims, which require timing evidence.
