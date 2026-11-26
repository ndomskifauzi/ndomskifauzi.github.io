# Ndomski fauzi

Bilingual professional portfolio, rendered as static HTML for GitHub Pages. Content lives in `content.mjs`. The Node build writes the deployable output to `dist/` without npm packages.

```sh
node build.mjs
node verify.mjs
node serve.mjs
```

Open http://127.0.0.1:4178 locally. To add an article, add its slug, date, Indonesian and English title, description, and sections to `articles` in `content.mjs`. To add a project, use `projects`. Case studies become individual pages when both language versions are supplied.

GitHub Pages uses GitHub Actions. Updates to `main` rebuild the site, run verification, and publish only `dist/`.
