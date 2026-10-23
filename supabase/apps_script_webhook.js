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
  var payloadData = {
    instrumen: 'SPAK', // GANTI TIAP FORM
    data: e.namedValues
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
    Logger.log(response.getContentText());
  } catch (error) {
    console.error('Webhook error: ' + error);
  }
}
