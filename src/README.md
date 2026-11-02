# Josh Hughes Personal Website

This is a static HTML, CSS, and JavaScript site. The original Claude Design export is kept separately and is not required to run the site.

## Preview locally

From the workspace root, run:

```sh
python3 -m http.server 4173 --directory src
```

Then open `http://localhost:4173/`.

## Add an essay

In `essays.html`, duplicate one `.essay-link` entry and give it a unique `data-essay-id`, date, title, and summary. In `site.js`, add the essay's paragraphs to `essayBodies` under the same ID. Keep entries newest first.

## Add a project PDF later

Put the PDF in `assets/projects/` and add a link or viewer for it inside the matching project entry in `projects.html`. Keep the project accordion and description in place when no PDF is available.

## Publish with GitHub Pages

Create a dedicated public repository and copy this entire `src/` folder plus the workspace `.github/workflows/pages.yml` into it, keeping `src/` as a folder at the repository root. Do not copy the `Design Handoff/` directory. In the new repository, choose **Settings > Pages > Build and deployment > Source > GitHub Actions**. Push to `main` to deploy.

The sitemap and robots file currently use `https://joshhhughes24.github.io/My-Website/`. Update them if the repository is renamed or moved. Replace the example email and LinkedIn links in `contact.html` with your real destinations when ready.