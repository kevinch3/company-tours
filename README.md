# Company Tours — Static Site Archive

Archived version of the **Company Tours** website, originally built in PHP + XML.
The site was active from **2013 to 2019**. This version is fully static and can be hosted on GitHub Pages with no backend required.

> **Note:** This is a historical archive. For the current, live site visit [companytours.tur.ar](https://companytours.tur.ar).

---

## Project Structure

```
nievemar-update/
├── index.html          # Single-page shell — all routing happens here
├── estilo.css          # Original stylesheet, unchanged
├── favicon.ico
├── thank-you.html      # Shown after contact form submission
├── 404.html            # GitHub Pages custom 404
├── .nojekyll           # Prevents GitHub Pages from running Jekyll
│
├── data/               # Content converted from the original XML files
│   ├── content.json    # All page content (6 languages × 12 sections + packages)
│   ├── inicio.json     # Nav labels, sidebar widgets, form labels
│   └── hoteles.json    # Hotel listings with OpenStreetMap embeds
│
├── js/
│   ├── app.js                  # Main routing + rendering logic
│   ├── jquery.min.js
│   ├── jquery.slides.min.js    # Header image slider
│   └── FontAwesome/            # Icon library (self-hosted)
│
├── imagenes/           # All original image assets
│
└── convert_xml.py      # One-time script used to convert XML → JSON
```

## How It Works

The original site used PHP to read XML files and render pages dynamically.
This version replaces that with a single `index.html` + `js/app.js` that:

1. Reads `?lang=` and `?data=` URL parameters (same format as the original).
2. Fetches the JSON data files on startup.
3. Renders the correct language and section into the page without a full reload.

URL format is preserved — e.g. `?lang=english&data=srv` works exactly as before.

**Languages supported:** Español, English, Français, Portuguese, Italiano, Deutsch

**Sections:** Home (`idx`), About (`nos`), Services (`srv`), Packages, Hotels, Excursions, Maps, Contact (`cnt`)

## Running Locally

The site uses `fetch()` to load JSON files, so it **must be served over HTTP** — opening `index.html` directly via `file://` will not work.

```bash
cd /path/to/nievemar-update
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

Any static file server works (VS Code Live Server, `npx serve`, nginx, etc.).

## Deploying to GitHub Pages

1. Create a new GitHub repository.
2. Push the contents of this folder (not the folder itself) to the `main` branch.
3. Go to **Settings → Pages** and set the source to the `main` branch, root `/`.
4. The site will be live at `https://<username>.github.io/<repo>/`.

No build step, no dependencies to install.

## Contact Form

The contact form UI is fully functional but the submission endpoint is a placeholder (`action="#"`).
To enable actual form delivery, replace the `action` attribute in `js/app.js` with a real endpoint:

- **[Formspree](https://formspree.io)** (free tier): create a form, copy the endpoint URL, set `action="https://formspree.io/f/<your-id>"`.
- Any other static form service (Netlify Forms, Web3Forms, etc.) works the same way.

The form supports a pre-filled package field when arriving from a package detail page via `?shop=...`.

## Regenerating the JSON Data

If you need to re-convert the original XML source files:

```bash
# Requires Python 3 — no extra packages needed
python3 convert_xml.py
```

Source XML files are expected at:
```
/home/kevinch3/Documentos/Dev/web/2017/www/nievemar/
  ├── pageUTF8.xml
  ├── inicio.xml
  ├── hotelesUTF8.xml
  └── menu.xml
```

Output is written to `data/`.

## Original Tech Stack (for reference)

| Original | Replaced with |
|---|---|
| PHP + SimpleXML | JavaScript (`fetch` + JSON) |
| PHPMailer + reCAPTCHA | Placeholder (Formspree-ready) |
| `?lang=X&data=Y` routing | Same URL format, JS router |
| Google Maps Engine (defunct) | OpenStreetMap iframes |
| jQuery Slides | Same library, re-initialized in JS |
