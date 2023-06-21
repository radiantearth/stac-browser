# Release process

1. `npm upgrade`
2. `npm run i18n:fields`
  1. Check for differences in `src/locales/en/fields.json`
  2. Ask for missing translations via GitHub issues
3. Update the version number (in `package.json` and `README.md`)
4. `npm run lint` - Fix any open lint issues
5. Commit the changes
6. `npm run build:report`
  1. Check whether the `dist/report.html` has significantly changed (if yes, check why)
  2. Delete the `dist/report.html`
7. `npm publish`
8. Create GitHub release (v3.x.x)