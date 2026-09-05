# Legacy URL Remediation Map — asgardaerospace.com

**Prepared:** 5 September 2026
**Target:** establish `asgard-ind.com` (Asgard Industries) as the primary corporate website and search entity.
**Legacy property:** `asgardaerospace.com` — WordPress + WooCommerce + Yoast.

---

## Where these actions must be executed

**These redirects and 410s must be implemented on the legacy WordPress host, not in this repository.**

A redirect rule in `vercel.json` only fires for requests that reach the Vercel project. A request for
`asgardaerospace.com/services/stargazing-tours/` reaches WordPress and never touches Vercel, so a rule here
would do nothing. The `redirects` block in `vercel.json` covers only the case where `asgardaerospace.com` is
later pointed at this Vercel project as an additional domain — it is a safety net, not the implementation.

`vercel.json` also cannot return `410 Gone` for a static deployment. Every 410 below has to be issued by the
legacy host (a redirection plugin, `.htaccess`, or the WordPress `template_redirect` hook).

---

## Index status caveat

The `CURRENT INDEX STATUS` column below records what was directly observed on 5 September 2026: presence in the
live XML sitemaps and crawlability under the live `robots.txt`, which contains a Yoast block reading
`User-agent: *` / `Disallow:` — everything is open to crawlers. **Actual index status must be confirmed in Google
Search Console and Bing Webmaster Tools before removal requests are filed.** Nothing below is asserted as
"confirmed indexed".

---

## A. Demo and template contamination — 410 GONE

No legitimate successor exists. These must not be redirected: sending a telescope product or a Lorem Ipsum
stargazing page to the homepage passes an irrelevance signal and slows de-indexing. `410` tells search engines
the URL is intentionally gone and de-indexes faster than `404`.

| URL | Current index status | Action | Destination | Reason |
|---|---|---|---|---|
| `/services/stargazing-tours/` | In `cpt_services-sitemap.xml`, crawlable | **410 GONE** | — | Theme demo. Body is Lorem Ipsum. Not an Asgard service. |
| `/services/zero-gravity-experience/` | In sitemap, crawlable | **410 GONE** | — | Theme demo. Not an Asgard service. |
| `/services/astronomical-observations/` | In sitemap, crawlable | **410 GONE** | — | Theme demo. |
| `/services/extreme-sports-gear-rental/` | In sitemap, crawlable | **410 GONE** | — | Theme demo. Brand-damaging for a defense manufacturer. |
| `/services/adventure-sports-expeditions/` | In sitemap, crawlable | **410 GONE** | — | Theme demo. |
| `/services/space-adventure-consultations/` | In sitemap, crawlable | **410 GONE** | — | Theme demo. |
| `/services/observation-and-research/` | In sitemap, crawlable | **410 GONE** | — | Theme demo. |
| `/services/satellite-management/` | In sitemap, crawlable | **410 GONE** | — | Theme demo. Sounds plausible; content is template filler. Verify then remove. |
| `/services/educational-programs/` | In sitemap, crawlable | **410 GONE** | — | Theme demo. |
| `/services/night-sky-tours/` | In sitemap, crawlable | **410 GONE** | — | Theme demo. |
| `/services/stargazing-nights/` | In sitemap, crawlable | **410 GONE** | — | Theme demo. |
| `/services/space-exploration/` | In sitemap, crawlable | **410 GONE** | — | Theme demo. |
| `/shop/` | In `product-sitemap.xml`, crawlable | **410 GONE** | — | WooCommerce demo store. Asgard sells no retail products. |
| `/product/silver-telescope/` | In sitemap, crawlable | **410 GONE** | — | Demo product. |
| `/product/optical-telescope/` | In sitemap, crawlable | **410 GONE** | — | Demo product. |
| `/product/telescope-n200/` | In sitemap, crawlable | **410 GONE** | — | Demo product. |
| `/product/truss-tube-telescope/` | In sitemap, crawlable | **410 GONE** | — | Demo product. |
| `/product/modern-telescope-h03-2k/` | In sitemap, crawlable | **410 GONE** | — | Demo product. |
| `/product/telescope-h03-2k/` | In sitemap, crawlable | **410 GONE** | — | Demo product. |
| `/product/telescope-on-a-tripod/` | In sitemap, crawlable | **410 GONE** | — | Demo product. |
| `/product/telescope-8-with-a-tripod/` | In sitemap, crawlable | **410 GONE** | — | Demo product. |
| `/product/eyepiece-and-filter-set-1-25/` | In sitemap, crawlable | **410 GONE** | — | Demo product. |
| `/product/classic-eyepiece-set/` | In sitemap, crawlable | **410 GONE** | — | Demo product. |
| `/product/eyepiece-transport-case/` | In sitemap, crawlable | **410 GONE** | — | Demo product. |
| `/product/black-binoculars/` | In sitemap, crawlable | **410 GONE** | — | Demo product. |
| `/product/vesp-era-ultimate-set/` | In sitemap, crawlable | **410 GONE** | — | Demo product. |
| `/product/minitrack-lx-quattro/` | In sitemap, crawlable | **410 GONE** | — | Demo product. |
| `/product/satellite-aerial/` | In sitemap, crawlable | **410 GONE** | — | Demo product. |
| `/product/payload-fairing/` | In sitemap, crawlable | **410 GONE** | — | Demo product. Aerospace-sounding but a WooCommerce demo item. |
| `/product/aircraft-chassis/` | In sitemap, crawlable | **410 GONE** | — | Demo product. Aerospace-sounding but a WooCommerce demo item. |
| `/typography/` | In `page-sitemap.xml`, crawlable | **410 GONE** | — | Theme style-guide page. |
| `/portfolio-grid/` | In sitemap, crawlable | **410 GONE** | — | Theme layout demo. |
| `/portfolio-list/` | In sitemap, crawlable | **410 GONE** | — | Theme layout demo. |
| `/portfolio-metro/` | In sitemap, crawlable | **410 GONE** | — | Theme layout demo. |
| `/newsletter-popup/` | In sitemap, crawlable | **410 GONE** | — | Theme popup fragment, should never have been a URL. |
| `/launchbelt-demo-doc/` | In `post-sitemap.xml`, crawlable | **410 GONE** | — | Internal demo document. Not for public index. |

**Also required:** deactivate WooCommerce so `product-sitemap.xml`, `product_cat-sitemap.xml` and
`product_tag-sitemap.xml` stop regenerating; delete the `cpt_portfolio`, `cpt_layouts`, `cpt_testimonials`
and `cpt_team` demo entries and their `*_group` taxonomy sitemaps.

---

## B. Review before action

Names read as legitimate; content was not verified. Read each one, then apply the rule in the last column.

| URL | Current index status | Action | Destination | Reason |
|---|---|---|---|---|
| `/services/empower-the-aerospace-ecosystem/` | In sitemap, crawlable | **REVIEW** | `/company` if real, else 410 | Title is plausible Asgard messaging; verify body is not template filler. |
| `/services/building-with-purpose/` | In sitemap, crawlable | **REVIEW** | `/company` if real, else 410 | Same. |
| `/services/accelerating-aerospace-advancement/` | In sitemap, crawlable | **REVIEW** | `/company` if real, else 410 | Same. |
| `/services/` | In sitemap, crawlable | **REVIEW** | `/capabilities` if it is a real index, else 410 | Parent archive. If every child is removed, remove the archive. |
| `/brief/` | In `page-sitemap.xml`, crawlable | **REVIEW** | `/contact` if it is an intake form, else 410 | Purpose unverified. |

---

## C. Legitimate pages — 301 to asgard-ind.com

Redirect preserves link equity. **It does not carry the content across.** Per the implementation directive,
legacy page copy, capability claims, equipment lists and certification statements are not migrated; the new
pages stand on their own approved content.

| URL | Current index status | Action | Destination | Reason |
|---|---|---|---|---|
| `/about-us/` | In sitemap, crawlable | **301** | `https://asgard-ind.com/company` | Corporate identity page; successor exists. |
| `/capabilities-and-equipment/` | In sitemap, crawlable | **301** | `https://asgard-ind.com/capabilities` | Closest topical successor. Legacy equipment and certification content is **not** carried over. |
| `/aerospace-sectors/` | In sitemap, crawlable | **301** | `https://asgard-ind.com/domains` | Sector page; successor exists. |
| `/contact-us/` | In sitemap, crawlable | **301** | `https://asgard-ind.com/contact` | Successor exists. |
| `/launchbelt-platform/` | In sitemap, crawlable | **301** | `https://asgard-ind.com/launchbelt` | Successor exists. |
| `/privacy-policy/` | In sitemap, crawlable | **301** | `https://asgard-ind.com/privacy` | Successor exists. |
| `/` (homepage) | In sitemap, crawlable | **301** | `https://asgard-ind.com/` | Primary brand migration. See sequencing note below. |

---

## D. Editorial content — hold, then migrate

These are the only legacy URLs carrying genuine topical value. **Do not 301 them to the homepage.**
Correct sequence: build `/insights/` on `asgard-ind.com` → review each post against current claim discipline →
republish approved posts → then 301. Until `/insights/` exists, leave them live on the legacy domain.

| URL | Current index status | Action | Destination | Reason |
|---|---|---|---|---|
| `/blog/` | In sitemap, lastmod 2026-01-06 | **HOLD → 301** | `https://asgard-ind.com/insights/` | Archive index. Redirect once `/insights/` is live. |
| `/us-aerospace-gap/` | In sitemap, lastmod 2025-10-19 | **HOLD → 301** | `https://asgard-ind.com/insights/us-aerospace-gap/` | Real editorial content. Review claims, republish, then redirect. |
| `/the-next-decade/` | In sitemap, lastmod 2025-10-19 | **HOLD → 301** | `https://asgard-ind.com/insights/the-next-decade/` | Same. |
| `/uas-ecosystem/` | In sitemap, lastmod 2025-10-19 | **HOLD → 301** | `https://asgard-ind.com/insights/uas-ecosystem/` | Same. |

---

## E. Sequencing

1. **Now.** Execute all section A 410s. Deactivate WooCommerce. Delete demo CPT entries. This is independent
   of the migration and should not wait for it.
2. **Now.** Regenerate the legacy sitemaps and submit removal requests in Search Console and Bing Webmaster
   Tools for every section A URL.
3. **Now.** Complete section B reviews.
4. **On launch of asgard-ind.com.** Execute section C 301s, except the homepage.
5. **After `/insights/` is live.** Execute section D.
6. **Last.** Execute the homepage 301, once `asgard-ind.com` is verified in Search Console, indexed, and the
   `Asgard Industries` entity is resolving. Moving the homepage first would strand the migration.
7. **Keep the legacy domain registered and redirecting indefinitely.** Do not let it lapse; the redirects are
   what carry accrued authority to the new entity.

---

## F. Entity relationship

`Asgard Aerospace Corporation` is the current legal entity. `Asgard Industries` is the primary public brand.
Both names are declared on every page of `asgard-ind.com` in the Organization JSON-LD:

```json
"name": "Asgard Industries",
"legalName": "Asgard Aerospace Corporation",
"alternateName": ["Asgard", "Asgard Aerospace"]
```

This is what tells search engines and AI systems that the two names are one entity, with Asgard Industries as
the primary. It should be reinforced off-site by updating LinkedIn, Crunchbase, Austin Startups, pitch.vc,
Facebook and any trade directory listings to lead with **Asgard Industries** and reference Asgard Aerospace as
the legal entity or a division, never as a separate company.
