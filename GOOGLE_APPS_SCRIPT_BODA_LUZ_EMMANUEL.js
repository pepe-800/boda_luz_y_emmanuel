/** 
 * =========================================================================================
 * === SCRIPT DE CONFIRMACIÓN AUTOMÁTICA (GOOGLE APPS SCRIPT)                            ===
 * === PROYECTO: BODA LUZ ANDREA MARTÍNEZ ORDÓÑEZ & ANGEL EMMANUEL REYES GUÍA            ===
 * === SISTEMAS LIRA / INVITACIONES DIGITALES LIRA                                       ===
 * =========================================================================================
 *
 * 📋 INSTRUCCIONES DE INSTALACIÓN:
 * 1. Crea una Hoja de Cálculo en Google Drive con el nombre:
 *    "Confirmaciones - Boda Luz y Emmanuel"
 * 2. Copia el ID de la URL de tu hoja (la cadena de letras y números entre /d/ y /edit).
 * 3. Pega ese ID abajo en: CFG.spreadsheetId = "TU_ID_AQUÍ";
 * 4. En la hoja de cálculo, ve al menú superior: Extensiones -> Apps Script.
 * 5. Borra todo lo que haya y pega este código completo.
 * 6. Haz clic en "Implementar" (botón azul arriba a la derecha) -> "Nueva implementación".
 * 7. Selecciona tipo: "Aplicación web".
 *    - Descripción: "RSVP Boda Luz y Emmanuel"
 *    - Ejecutar como: "Yo (tu cuenta de Google)"
 *    - Quién tiene acceso: "Cualquiera" (IMPORTANTE para que la web pueda enviar datos).
 * 8. Autoriza los permisos de Google.
 * 9. Copia la URL de la aplicación web generada (termina en /exec) y pégala en index.html:
 *    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/TU_ID/exec";
 * =========================================================================================
 */

/** ====== CONFIGURACIÓN ====== */
var CFG = {
  // ID de tu hoja de cálculo en Google Drive
  spreadsheetId: "1UyAKc_Z8U9dgKgMh3NM50pcNgyYqAaZm08sQzGVukCU",

  // Nombre de la pestaña donde se guardarán las confirmaciones
  sheetName: "Confirmaciones",

  // Correos para recibir las notificaciones (los novios y el correo oficial de Lira)
  recipients: "zelivereyesmartinez@gmail.com, invitaciones.digitales.lira@gmail.com",

  // Asunto del correo que recibirán
  subject: "💍 Nueva confirmación - Boda Luz Andrea & Angel Emmanuel",

  // Encabezados (columnas) de la hoja de cálculo
  headers: [
    "Marca temporal",
    "Nombre",
    "Telefono",
    "Asistencia",
    "Adultos confirmados",    
    "Mensaje"
  ]
};

/**
 * Se asegura de que la hoja de cálculo y los encabezados existan.
 */
function openSheetEnsureHeaders_() {
  var ss = SpreadsheetApp.openById(CFG.spreadsheetId);
  var sh = ss.getSheetByName(CFG.sheetName);
  if (!sh) {
    sh = ss.insertSheet(CFG.sheetName);
  }

  // Escribe los encabezados solo si la primera fila está vacía
  var firstRow = sh.getRange(1, 1, 1, CFG.headers.length).getValues()[0];
  var needsHeaders = firstRow.every(function (cell) { return cell === ""; });

  if (needsHeaders) {
    sh.getRange(1, 1, 1, CFG.headers.length).setValues([CFG.headers]);
    sh.getRange(1, 1, 1, CFG.headers.length).setFontWeight("bold").setBackground("#e5c365");
  }
  return sh;
}

/**
 * Procesa los datos recibidos desde la invitación digital (HTML) y los guarda en la hoja.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Espera hasta 10 segundos para evitar bloqueos por concurrencia

  try {
    var sh = openSheetEnsureHeaders_();
    var data = (e && e.parameter) ? e.parameter : {};

    // Construye la nueva fila en el orden de CFG.headers
    var newRow = CFG.headers.map(function (header) {
      if (header === "Marca temporal") {
        return new Date();
      }
      return data[header] || "";
    });

    sh.appendRow(newRow);

    // Objeto con los datos de la fila para el correo
    var rowObj = {};
    CFG.headers.forEach(function (h, i) {
      rowObj[h] = newRow[i];
    });

    var ss = SpreadsheetApp.openById(CFG.spreadsheetId);
    sendConfirmationEmailWithExcel_(rowObj, ss);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, message: "Confirmación registrada correctamente." }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    MailApp.sendEmail(
      CFG.recipients,
      "⚠️ ERROR en Script de RSVP - Boda Luz & Emmanuel",
      "Ocurrió un error al procesar una confirmación: " + error.toString()
    );
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, message: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Responde a peticiones GET (para verificar si el script está activo en el navegador)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "online", service: "RSVP Boda Luz & Emmanuel - Sistemas Lira" }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Envía el correo de notificación con el archivo Excel adjunto a los novios y a la agencia.
 */
function sendConfirmationEmailWithExcel_(data, spreadsheet) {
  var msg = "¡Se ha recibido una nueva confirmación para la boda de Luz Andrea & Angel Emmanuel!\n\n";
  msg += "=======================================================\n";

  CFG.headers.forEach(function (header) {
    if (header !== "Marca temporal" && data[header] !== undefined) {
      msg += "• " + header + ": " + data[header] + "\n";
    }
  });

  msg += "=======================================================\n\n";
  msg += "Se adjunta la lista completa y actualizada de confirmaciones en formato Excel.\n";
  msg += "También puedes consultar la hoja en vivo en Google Drive aquí:\n" + spreadsheet.getUrl() + "\n\n";
  msg += "---\nInvitaciones Digitales Lira\nhttps://www.instagram.com/invitaciones_digitales_lira";

  var tempSpreadsheet = SpreadsheetApp.create("Temp_Confirmaciones_" + new Date().getTime());
  try {
    var mainSheet = spreadsheet.getSheetByName(CFG.sheetName);
    mainSheet.copyTo(tempSpreadsheet).setName(CFG.sheetName);
    // Borrar la hoja vacía por defecto
    tempSpreadsheet.deleteSheet(tempSpreadsheet.getSheets()[0]);

    var tempId = tempSpreadsheet.getId();
    var exportUrl = "https://docs.google.com/spreadsheets/d/" + tempId + "/export?format=xlsx";

    var response = UrlFetchApp.fetch(exportUrl, {
      headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }
    });

    var excelFile = response.getBlob().setName("Confirmaciones_Boda_Luz_y_Emmanuel.xlsx");

    MailApp.sendEmail({
      to: CFG.recipients,
      subject: CFG.subject + " - " + (data["Nombre"] || "Invitado"),
      body: msg,
      attachments: [excelFile]
    });

  } catch (err) {
    MailApp.sendEmail(
      CFG.recipients,
      CFG.subject + " (Error al adjuntar Excel)",
      msg + "\n\nNota: No se pudo adjuntar el archivo Excel automáticamente: " + err
    );
  } finally {
    try {
      DriveApp.getFileById(tempSpreadsheet.getId()).setTrashed(true);
    } catch (e) { }
  }
}
