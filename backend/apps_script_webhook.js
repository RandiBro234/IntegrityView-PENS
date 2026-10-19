/**
 * Google Apps Script — Webhook IntegrityView
 * Tempel kode ini di editor Apps Script SETIAP Google Form (Extensions > Apps Script).
 *
 * Langkah:
 * 1. Jalankan backend:  uvicorn main:app --reload --host 0.0.0.0 --port 8010
 * 2. Ekspos ke internet untuk development:  ngrok http 8010
 * 3. Salin URL ngrok (https://xxxx.ngrok-free.app) ke apiUrl di bawah.
 * 4. Ganti nilai "instrumen" sesuai form (SPAK, SPIP, WBS, Gratifikasi, 5R, dst).
 * 5. Buat Trigger: pilih fungsi onFormSubmit, event "On form submit".
 */

function onFormSubmit(e) {
  // Ganti dengan URL ngrok + endpoint
  var apiUrl = "https://YOUR_NGROK_URL.ngrok-free.app/api/webhook/survei";

  var payloadData = {
    "instrumen": "SPAK", // GANTI TIAP FORM (contoh: "SPIP", "WBS", "Gratifikasi", "5R")
    "data": e.namedValues
  };

  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payloadData),
    "muteHttpExceptions": true
  };

  try {
    UrlFetchApp.fetch(apiUrl, options);
  } catch (error) {
    console.error("Webhook error: " + error);
  }
}
