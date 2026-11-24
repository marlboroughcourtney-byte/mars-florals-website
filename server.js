/* =========================================================
   Mars Florals — Node.js server (no packages needed)
   - Serves the website files on http://localhost:3000
   - POST /api/enquiry: checks the form data again on the server,
     logs it, and saves it to data/enquiries.json
   NOTE: sending an email to Shannon is deferred. When ready,
   add an email service (e.g. Nodemailer) where marked below.
   Run with:  node server.js
   ========================================================= */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data', 'enquiries.json');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const AU_PHONE_RE = /^(?:\+?61|0)[2-478]\d{8}$/;
const ENQUIRY_TYPES = ['wedding', 'event', 'bouquet', 'other'];

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

// Server-side check: never trust the browser alone
function validateEnquiry(d) {
  const errors = [];
  if (!d || typeof d !== 'object') return ['No data received'];
  if (!d.firstName || !String(d.firstName).trim()) errors.push('firstName');
  if (!d.lastName || !String(d.lastName).trim()) errors.push('lastName');
  if (!EMAIL_RE.test(String(d.email || '').trim())) errors.push('email');
  const phone = String(d.phone || '').replace(/[\s()-]/g, '');
  if (phone && !AU_PHONE_RE.test(phone)) errors.push('phone');
  if (!ENQUIRY_TYPES.includes(d.enquiryType)) errors.push('enquiryType');
  if (String(d.message || '').trim().length < 20) errors.push('message');
  if (d.consent !== true) errors.push('consent');
  if ((d.enquiryType === 'wedding' || d.enquiryType === 'event') && !String(d.venue || '').trim()) {
    errors.push('venue');
  }
  return errors;
}

function saveEnquiry(enquiry) {
  let list = [];
  try { list = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { list = []; }
  list.push(enquiry);
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

function handleEnquiry(req, res) {
  let raw = '';
  req.on('data', chunk => {
    raw += chunk;
    if (raw.length > 20000) req.destroy();   // stop oversized posts
  });
  req.on('end', () => {
    let data;
    try { data = JSON.parse(raw); } catch (e) { return sendJson(res, 400, { error: 'Invalid JSON' }); }

    const errors = validateEnquiry(data);
    if (errors.length) return sendJson(res, 422, { error: 'Please check: ' + errors.join(', '), fields: errors });

    const enquiry = { id: Date.now().toString(36), receivedAt: new Date().toISOString(), ...data };
    console.log('\n📩 New enquiry received:\n', enquiry);
    saveEnquiry(enquiry);

    // TODO (deferred): email Shannon here, e.g. with Nodemailer
    sendJson(res, 200, { ok: true, id: enquiry.id });
  });
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.normalize(path.join(ROOT, urlPath));

  // Block path tricks and private files
  if (!filePath.startsWith(ROOT) || filePath.includes(`${path.sep}data${path.sep}`) || filePath.endsWith('server.js')) {
    res.writeHead(403); return res.end('Forbidden');
  }
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Page not found');
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream' });
    res.end(content);
  });
}

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/enquiry') return handleEnquiry(req, res);
  if (req.method === 'GET') return serveStatic(req, res);
  res.writeHead(405); res.end('Method not allowed');
}).listen(PORT, () => {
  console.log(`Mars Florals running at http://localhost:${PORT}`);
});
