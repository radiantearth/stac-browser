# Release process

1. `npm upgrade`
2. `npm run i18n:fields`
   1. Check for differences in `src/locales/en/fields.json`
   2. Ask for missing translations via GitHub issues
3. `npm run docs:hooks`
4. Update the version number (in `package.json` and `README.md`)
5. `npm run lint` and `npm run docs:lint` - Fix any open lint issues
6. `npm run test` - Run all tests, fix any reported issues
7. Commit the changes
8. `npm run build:report`
   1. Check whether the `dist/report.html` has significantly changed (if yes, check why)
   2. Delete the `dist/report.html`
9. `npm publish`
10. Create GitHub release (v3.x.x)
