/**
 * Google Apps Script - Webhook IntegrityView (Supabase Edge Function)
 * Tempel kode ini di editor Apps Script SETIAP Google Form
 * (Extensions > Apps Script).
 *
 * Langkah:
 * 1. Deploy Edge Function:
 *      supabase functions deploy webhook-survei --no-verify-jwt
 * 2. Set secret yang sama dengan yang dipakai di sini:
 *      supabase secrets set WEBHOOK_SECRET=string-acak-pilihanmu
 * 3. Ganti WEBHOOK_URL dengan URL Edge Function:
 *      https://<project-ref>.supabase.co/functions/v1/webhook-survei
 * 4. Ganti WEBHOOK_SECRET dengan nilai yang sama seperti langkah 2.
 * 5. Ganti "instrumen" sesuai form:
 *      SPAK, SPKP, Pengaduan, SPIP, Gratifikasi, Benturan, WBS,
 *      Budaya ZI, PENS JOSS, 5R.
 * 6. Buat Trigger: pilih fungsi onFormSubmit, event "On form submit".
 *
 * Catatan: menu Responses > Download responses (.csv) di Google Form tetap
 * bisa dipakai; webhook hanya jalur tambahan real-time ke Supabase.
 */

var WEBHOOK_URL = 'https://<project-ref>.supabase.co/functions/v1/webhook-survei';
var WEBHOOK_SECRET = 'GANTI_DENGAN_WEBHOOK_SECRET';

function onFormSubmit(e) {
  var data = ambilJawaban(e);
  Logger.log('Event keys: ' + (e ? Object.keys(e).join(', ') : 'e kosong'));
  Logger.log('Jumlah jawaban: ' + Object.keys(data).length);
  Logger.log('Judul jawaban: ' + Object.keys(data).join(' | '));

  if (!Object.keys(data).length) {
    console.error('Data kosong. Pastikan trigger: From form -> On form submit ' +
      '(bukan On edit / On change).');
    return;
  }

  var payloadData = {
    instrumen: 'SPAK', // GANTI TIAP FORM
    data: data
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-webhook-secret': WEBHOOK_SECRET
    },
    payload: JSON.stringify(payloadData),
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log('HTTP ' + response.getResponseCode() + ': ' + response.getContentText());
  } catch (error) {
    console.error('Webhook error: ' + error);
  }
}

/* Ambil jawaban dari event Form submit.
   e.response lebih andal untuk script yang terikat ke Form;
   e.namedValues dipakai sebagai fallback (termasuk event spreadsheet). */
function ambilJawaban(e) {
  var hasil = {};
  if (!e) return hasil;

  if (e.response && typeof e.response.getItemResponses === 'function') {
    e.response.getItemResponses().forEach(function (item) {
      var judul = item.getItem().getTitle();
      var jawab = item.getResponse();
      if (judul) hasil[judul] = [jawab];
    });
  }

  /* Email responden (opsi "Collect email addresses") tidak muncul sebagai
     pertanyaan, jadi ambil terpisah. */
  if (e.response && typeof e.response.getRespondentEmail === 'function') {
    var emailResponden = e.response.getRespondentEmail();
    Logger.log('Email responden terdeteksi: ' + (emailResponden ? 'ya' : 'tidak'));
    if (emailResponden && !hasil['Email Address']) {
      hasil['Email Address'] = [emailResponden];
    }
  }

  if (e.namedValues) {
    Object.keys(e.namedValues).forEach(function (kunci) {
      var nilai = e.namedValues[kunci];
      var adaIsi = Array.isArray(nilai)
        ? nilai.some(function (v) { return String(v == null ? '' : v).trim() !== ''; })
        : String(nilai == null ? '' : nilai).trim() !== '';
      if (kunci && (adaIsi || !hasil[kunci])) hasil[kunci] = nilai;
    });
  }

  return hasil;
}
