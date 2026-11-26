# Mars Florals website

Website for Mars Florals (Shannon Mars), a Perth wedding and event florist.
Built with HTML, CSS, Bootstrap 5 (via CDNJS), vanilla JavaScript and a small Node.js server.

## Pages

| Page | File | Interactive features (vanilla JS) |
|---|---|---|
| Home | `index.html` | Scrolling photo strip (CSS animation) that pauses on hover and stops if the device is set to reduce motion |
| Pricing | `pricing.html` | Filter buttons (All / Weddings / Events / Bouquets); "What's included" toggles; links like `pricing.html#events` open that section filtered |
| FAQ | `faq.html` | Bootstrap accordion (questions open and close) |
| Enquire | `enquire.html` | Form with validation (see below); sends to the Node.js endpoint |

On every page, the Bootstrap navbar collapses into a menu on mobile, and `js/main.js` highlights the current page.

## Folder structure

```
mars-florals-site/
├── index.html, pricing.html, faq.html, enquire.html
├── css/styles.css        brand colours, fonts, Bootstrap overrides
├── js/main.js            nav highlight, nav shadow on scroll, mobile menu, footer year (all pages)
├── js/pricing.js         pricing filter + "What's included" toggles
├── js/enquire.js         form validation + submit
├── images/               photos and logo
├── data/enquiries.json   enquiries saved by the server
├── server.js             Node.js server + POST /api/enquiry
└── package.json
```

## Running it

1. Install Node.js 18 or newer.
2. In VS Code, open this folder and run in the terminal:
   ```
   npm start
   ```
3. Open http://localhost:3000

You can open the HTML files directly by double-clicking them. Without the server, the enquiry
form falls back to email (see below), exactly as it does on the live AWS site.

## Deployment (AWS)

**Live site:** https://www.marsflorals.com.au

The site is hosted as a static website on AWS. The Node.js server is not deployed, so on the live
site the enquiry form uses the email fallback (see "Enquiry form" below).

```
Visitor ──HTTPS──▶ CloudFront (CDN, HTTPS certificate) ──private access──▶ S3 bucket (site files)
                        ▲
www.marsflorals.com.au ─┘  (DNS at VentraIP: CNAME www → CloudFront)
```

| Part | Service | Details |
|---|---|---|
| File storage | Amazon S3 | Bucket `mars-florals-site-428270342447`, Region ap-southeast-2 (Sydney). Private: all public access is blocked and only CloudFront can read it (Origin Access Control). |
| Delivery and HTTPS | Amazon CloudFront | Distribution `E19AFZP0BIB5FW` (`dm1vwrqw7zuth.cloudfront.net`). Redirects HTTP to HTTPS, compresses files, caches them at edge locations (visitors in Perth are served from Perth) and adds security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy). Default page `index.html`. |
| Certificate | AWS Certificate Manager | Free certificate for `marsflorals.com.au` and `www.marsflorals.com.au`, validated by DNS and renewed automatically. It is in us-east-1 because CloudFront requires that. |
| Domain | VentraIP | `marsflorals.com.au`, registered and DNS-hosted at VentraIP. |

**Files uploaded:** `index.html`, `pricing.html`, `faq.html`, `enquire.html`, `css/`, `js/` and
`images/` (32 files). **Not uploaded:** `data/` (customers' personal details), `server.js`,
`package.json`, `README.md`, `CLAUDE.md` and `.git`.

**DNS records at VentraIP (DNS Hosting):**

| Type | Hostname | Points to | Purpose |
|---|---|---|---|
| CNAME | `www` | `dm1vwrqw7zuth.cloudfront.net` | Sends the www address to CloudFront |
| CNAME | `_0ef9…76c1` | `…acm-validations.aws` | Proves domain ownership for the certificate (keep, needed for renewal) |
| CNAME | `_bdd6…a929.www` | `…acm-validations.aws` | Same, for the www name |

The bare domain (`marsflorals.com.au`, without www) has no record pointing at the site yet; use the
www address.

**Updating the live site:**
1. Upload the changed files to the S3 bucket at the same paths (e.g. `css/styles.css`), with the
   right content type (`text/html`, `text/css`, `text/javascript`, `image/jpeg`, `image/png`).
2. In CloudFront, create an invalidation for `/*`. Otherwise visitors can see the old version for up to 24 hours.

**Cost:** $0 a month at this size. The site is about 3 MB, well within the S3 and CloudFront free
allowances (CloudFront: 1 TB of transfer and 10 million requests a month). The domain is paid
yearly to VentraIP.

**Deployment checks (24 November 2026):**
- All four pages, the CSS, the JavaScript and the images load over HTTPS on `www.marsflorals.com.au`
- `http://` redirects to `https://` (301)
- `data/enquiries.json` and `server.js` are not reachable on the live site
- The S3 bucket can't be accessed directly; only through CloudFront

## Enquiry form

**Fields:** first name*, last name*, email*, phone, enquiry type* (dropdown: Wedding / Event /
Bouquet order / Something else), date, message*, how did you hear, consent*.
Choosing **Wedding** or **Event** reveals: venue*, guest count, budget range* and a services
checklist* (tick at least one).

**Frontend validation (`js/enquire.js`):**
- Email checked with regex `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`
- Phone (optional) checked as an Australian number with `/^(?:\+?61|0)[2-478]\d{8}$/` after removing spaces
- Date must be today or later. It's required for weddings, events and bouquets.
- Message must be at least 20 characters, with a live character counter
- Errors appear under each field, and the first invalid field is focused
- Links like `enquire.html?type=wedding` pre-select the enquiry type

**How it sends (`js/enquire.js`):**
- **With the Node server (local):** posts to `/api/enquiry`, then shows the thank-you message.
- **On GitHub Pages / AWS S3 (no server):** the post fails (404/405, network error or an 8-second
  timeout), so the form opens the visitor's email app with a message to `marsflorals@outlook.com`,
  subject and body filled in from the form (e.g. "Wedding enquiry from Jane Citizen (13 March 2027)").
  The thank-you message then asks them to press **Send**, with a "Try again" link in case no email
  app opened. An enquiry only reaches Shannon if the visitor sends that email.
- If the server is running but rejects the data (400/422), its error is shown instead.

**Backend (`server.js`):** `POST /api/enquiry` re-checks the data on the server, logs it to the
terminal and saves it to `data/enquiries.json`. **Emailing Shannon is deferred.** The spot to add
it (for example with Nodemailer) is marked `TODO` in `server.js`.

## Testing completed

- All four pages load (HTTP 200); `data/` and `server.js` can't be downloaded (403)
- All four pages pass an HTML tag-balance check (no unclosed or mismatched tags)
- Checked at desktop (1440px) and mobile (390px) widths
- Nav highlights the active page; the mobile menu opens and closes
- Pricing filter buttons show one service at a time and "All" brings everything back; the address
  updates (`pricing.html#events`) so a filtered view can be shared
- Arriving from the home page at `pricing.html#events` / `#bouquets` opens that section filtered, with
  the filter buttons in view (desktop 1440px and mobile 390px); back/forward re-filters
- "What's included" toggles work
- FAQ accordion works
- Submitting the form empty flags 6 fields and focuses First name
- With the Node server, a valid wedding enquiry saves to `data/enquiries.json` and shows the
  thank-you message
- On a static server (no `/api/enquiry`), a valid wedding enquiry opens a pre-filled email to
  `marsflorals@outlook.com` and shows the "press Send" thank-you message (tested in headless Chrome)
- Server rejects bad data (HTTP 422) even if the browser checks are bypassed
- No JavaScript errors in the console

## Changes after client review

- Freelance removed as a service (home page card, pricing section, form option, server check)
- Hero slideshow and FAQ search removed to keep pages simple


