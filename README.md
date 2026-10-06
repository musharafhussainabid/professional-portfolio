# Musharaf Hussain Abid — Portfolio

Personal portfolio for Musharaf Hussain Abid, AI Engineer (LLM systems, RAG, computer vision, workflow automation).

**Live:** https://portfolio.musharaf-h-abid.workers.dev/

Single-file static site — no build step, no dependencies. Deployed on Cloudflare Pages.

## Structure

```
index.html                      ← the entire site (portrait embedded as data URI)
Musharaf_Hussain_Abid_CV.pdf    ← one-page CV, linked from Contact
assets/og-card.png              ← social share card (1200×630)
assets/portrait.jpg             ← standalone portrait copy
.nojekyll                       ← disables GitHub Pages processing (harmless for Cloudflare)
```

## Editing

All content lives in `index.html`. Testimonials are in the `words-grid` block;
case studies in the `cases` section. Every deploy to `main` auto-publishes via Cloudflare Pages.

— Built by hand. No frameworks, no trackers.
