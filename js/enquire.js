/* =========================================================
   Mars Florals — enquiry form (vanilla JS)
   - Pre-selects the enquiry type from the link (?type=wedding)
   - Shows wedding/event fields only when relevant
   - Validates on submit, then live as the person fixes errors
   - Regex checks for email and Australian phone numbers

   HOW AN ENQUIRY IS SENT (after validation passes)
   The site runs in two places:
     * Locally with the Node server (npm start): POST /api/enquiry
       works, the server saves the enquiry, and the thank-you
       message shows.
     * On GitHub Pages or AWS S3 (static hosting): there is no
       server, so the POST fails (404/405, a network error, or no
       reply within 8 seconds). The script then opens a mailto: link
       to marsflorals@outlook.com with the subject and body filled
       in from the form, and shows the thank-you message with a
       note asking the visitor to press Send in their email app.
   If the server IS running but rejects the data (400/422), the
   error is shown instead of falling back to email.
   ========================================================= */
(function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // 04XX XXX XXX mobiles, 0X XXXX XXXX landlines, or +61 versions
  var AU_PHONE_RE = /^(?:\+?61|0)[2-478]\d{8}$/;
  var MIN_MESSAGE = 20;
  var ENDPOINT = '/api/enquiry';
  var EMAIL_TO = 'marsflorals@outlook.com';
  var TIMEOUT_MS = 8000;
  var TYPE_LABELS = { wedding: 'Wedding', event: 'Event', bouquet: 'Bouquet order', other: 'General' };

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('enquiry-form');
    if (!form) return;

    var f = form.elements;
    var eventFields = form.querySelector('[data-event-fields]');
    var servicesMsg = form.querySelector('[data-services-msg]');
    var dateReq = form.querySelector('[data-date-req]');
    var dateMsg = form.querySelector('[data-date-msg]');
    var charCount = form.querySelector('[data-char-count]');
    var errorBox = form.querySelector('[data-form-error]');
    var submitBtn = form.querySelector('[data-submit]');
    var success = document.querySelector('[data-success]');
    var attempted = false;

    /* ---------- helpers ---------- */
    function needsEventDetails() {
      return f.enquiryType.value === 'wedding' || f.enquiryType.value === 'event';
    }
    function dateRequired() {
      return needsEventDetails() || f.enquiryType.value === 'bouquet';
    }
    function setValid(el, ok) {
      el.classList.toggle('is-invalid', !ok);
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    }
    function today() {
      var d = new Date(); d.setHours(0, 0, 0, 0); return d;
    }

    /* ---------- show / hide wedding & event fields ---------- */
    function updateTypeFields() {
      var show = needsEventDetails();
      eventFields.hidden = !show;
      f.venue.required = show;
      f.budget.required = show;
      dateReq.hidden = !dateRequired();
      if (attempted) validate();
    }

    /* ---------- validation rules ---------- */
    function validate() {
      var results = [];

      results.push([f.firstName, setValid(f.firstName, f.firstName.value.trim().length > 0)]);
      results.push([f.lastName, setValid(f.lastName, f.lastName.value.trim().length > 0)]);
      results.push([f.email, setValid(f.email, EMAIL_RE.test(f.email.value.trim()))]);

      var phone = f.phone.value.replace(/[\s()-]/g, '');
      results.push([f.phone, setValid(f.phone, phone === '' || AU_PHONE_RE.test(phone))]);

      results.push([f.enquiryType, setValid(f.enquiryType, f.enquiryType.value !== '')]);

      // date: required for weddings, events and bouquets; never in the past
      var dateOk = true;
      if (f.eventDate.value) {
        dateOk = new Date(f.eventDate.value + 'T00:00:00') >= today();
        dateMsg.textContent = 'Please choose a date in the future.';
      } else if (dateRequired()) {
        dateOk = false;
        dateMsg.textContent = 'Please choose a date.';
      }
      results.push([f.eventDate, setValid(f.eventDate, dateOk)]);

      if (needsEventDetails()) {
        results.push([f.venue, setValid(f.venue, f.venue.value.trim().length > 0)]);
        var g = f.guests.value;
        results.push([f.guests, setValid(f.guests, g === '' || (Number(g) >= 1 && Number(g) <= 1000))]);
        results.push([f.budget, setValid(f.budget, f.budget.value !== '')]);

        var ticked = form.querySelectorAll('input[name="services"]:checked').length > 0;
        servicesMsg.hidden = ticked;
        results.push([form.querySelector('input[name="services"]'), ticked]);
      } else {
        [f.venue, f.guests, f.budget].forEach(function (el) { setValid(el, true); });
        servicesMsg.hidden = true;
      }

      results.push([f.message, setValid(f.message, f.message.value.trim().length >= MIN_MESSAGE)]);
      results.push([f.consent, setValid(f.consent, f.consent.checked)]);

      var firstBad = results.find(function (r) { return !r[1]; });
      return firstBad ? firstBad[0] : null;
    }

    /* ---------- collect the data ---------- */
    function collect() {
      var services = Array.prototype.map.call(
        form.querySelectorAll('input[name="services"]:checked'),
        function (c) { return c.value; }
      );
      return {
        firstName: f.firstName.value.trim(),
        lastName: f.lastName.value.trim(),
        email: f.email.value.trim(),
        phone: f.phone.value.trim(),
        enquiryType: f.enquiryType.value,
        eventDate: f.eventDate.value,
        venue: needsEventDetails() ? f.venue.value.trim() : '',
        guests: needsEventDetails() ? f.guests.value : '',
        budget: needsEventDetails() ? f.budget.value : '',
        services: needsEventDetails() ? services : [],
        message: f.message.value.trim(),
        source: f.source.value,
        consent: f.consent.checked
      };
    }

    /* ---------- email fallback (static hosting) ---------- */
    function niceDate(iso) {
      if (!iso) return '';
      return new Date(iso + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function buildMailto(d) {
      var type = TYPE_LABELS[d.enquiryType] || 'Website';
      var date = niceDate(d.eventDate);
      var subject = type + ' enquiry from ' + d.firstName + ' ' + d.lastName + (date ? ' (' + date + ')' : '');
      var lines = ['Name: ' + d.firstName + ' ' + d.lastName, 'Email: ' + d.email];
      function add(label, value) { if (value) lines.push(label + ': ' + value); }
      add('Phone', d.phone);
      add('Enquiry type', type);
      add('Date', date);
      add('Venue', d.venue);
      add('Guests', d.guests);
      add('Budget', d.budget);
      add('Would like', d.services.join(', '));
      add('Heard about us via', d.source);
      lines.push('', 'Message:', d.message);
      return 'mailto:' + EMAIL_TO +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\r\n'));
    }

    /* ---------- send to the Node server ----------
       Resolves 'server' when saved, 'email' when there is no server
       to talk to; rejects only when the server refused the data. */
    function postEnquiry(data) {
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS) : null;

      return fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: ctrl ? ctrl.signal : undefined
      })
        .then(function (res) {
          clearTimeout(timer);
          if (res.ok) return 'server';
          if (res.status === 400 || res.status === 422) {
            return res.json().catch(function () { return {}; }).then(function (body) {
              var err = new Error(body.error || 'Please check your details and try again.');
              err.rejected = true;
              throw err;
            });
          }
          return 'email';   // 404/405/5xx: no working endpoint here (static hosting)
        }, function () {
          clearTimeout(timer);
          return 'email';   // network error or timeout
        });
    }

    function showSuccess(data, mailto) {
      form.hidden = true;
      success.querySelector('[data-success-name]').textContent = data.firstName;
      success.querySelector('[data-success-email]').textContent = data.email;
      var note = success.querySelector('[data-success-mailto]');
      if (mailto) {
        success.querySelector('[data-success-heading]').textContent = 'Nearly there';
        success.querySelector('[data-mailto-link]').href = mailto;
      }
      note.hidden = !mailto;
      success.hidden = false;
      success.focus();
    }

    /* ---------- submit ---------- */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      attempted = true;
      errorBox.hidden = true;

      var firstBad = validate();
      if (firstBad) {
        errorBox.textContent = 'A few details need fixing before this can be sent.';
        errorBox.hidden = false;
        firstBad.focus();
        return;
      }

      var data = collect();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      postEnquiry(data)
        .then(function (route) {
          if (route === 'email') {
            var mailto = buildMailto(data);
            window.location.href = mailto;   // opens the visitor's email app
            showSuccess(data, mailto);
          } else {
            showSuccess(data, null);
          }
        })
        .catch(function (err) {
          console.warn('Enquiry not sent:', err);
          errorBox.textContent = err.rejected ? err.message
            : 'Sorry, your enquiry couldn’t be sent just now. Please try again.';
          if (!err.rejected) {
            errorBox.innerHTML += ' Or email <a href="mailto:' + EMAIL_TO + '">' + EMAIL_TO + '</a>.';
          }
          errorBox.hidden = false;
          errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send enquiry';
        });
    });

    /* ---------- live feedback after the first attempt ---------- */
    form.addEventListener('input', function () { if (attempted) validate(); });
    form.addEventListener('change', function () { if (attempted) validate(); });
    f.enquiryType.addEventListener('change', updateTypeFields);

    /* ---------- character counter ---------- */
    function updateCount() {
      charCount.textContent = f.message.value.length + ' / ' + f.message.maxLength;
    }
    f.message.addEventListener('input', updateCount);

    /* ---------- no past dates in the date picker ---------- */
    var t = today();
    f.eventDate.min = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');

    /* ---------- pre-select type from ?type= in the link ---------- */
    var type = new URLSearchParams(window.location.search).get('type');
    if (type && f.enquiryType.querySelector('option[value="' + type + '"]')) {
      f.enquiryType.value = type;
    }

    updateTypeFields();
    updateCount();
  });
})();
