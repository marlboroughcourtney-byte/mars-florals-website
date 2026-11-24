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
form falls back to email (see below), exactly as it does on GitHub Pages and AWS S3.

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

## To confirm with Shannon (client content)

- [ ] All prices in `pricing.html`, including the Classic bouquet ($65)
- [ ] Wedding minimum spend: pricing says $999, the FAQ says $1000
- [ ] FAQ details: notice periods, 30% deposit, 3-day reply time
- [ ] Email address `marsflorals@outlook.com`
- [ ] Full-resolution photos. The current images are cropped from Instagram screenshots and are low-res.
