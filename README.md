# Kinetic — CRE in Motion

Website and member portal for **Kinetic**, a network of up-and-coming retail commercial real estate brokers.

## What's here

- **Public site** — about, members (with LinkedIn), events, past-event gallery, testimonials, contact form.
- **Member portal** — Reddit-style forum, event RSVPs with an attendance tracker, member photo uploads, document library (uploads + SharePoint/Google links), member directory. Mobile-first.

See `Kinetic Member Portal Guide.docx` for how every portal feature works and the upload limits.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Page shell |
| `css/styles.css` | All styling (brand colors at the top) |
| `js/data.js` | Content: members, events, testimonials, forum channels, doc folders |
| `js/app.js` | Public site + portal logic |
| `assets/` | Logo, event photos, member headshots |

## Run locally

It's a static site — no build step.

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Status

The portal runs in **demo mode**: each member signs in with a personal passcode (last name + 4 digits; only salted hashes are in `js/data.js`, the plain list is kept out of the repo), and posts, RSVPs, photos and documents are saved only in the visitor's browser. Going live needs member accounts, a shared database and file storage (Supabase recommended). Events and testimonials in `js/data.js` are placeholders.
