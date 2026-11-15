/** 
 * =========================================================================================
 * === SCRIPT DE CONFIRMACIÓN AUTOMÁTICA (GOOGLE APPS SCRIPT)                            ===
 * === PROYECTO: BODA LUZ ANDREA MARTÍNEZ ORDÓÑEZ & ANGEL EMMANUEL REYES GUÍA            ===
 * === SISTEMAS LIRA / INVITACIONES DIGITALES LIRA                                       ===
 * =========================================================================================
 */

var CFG = {
  // ID de tu hoja de cálculo vinculada
  spreadsheetId: "1UyAKc_Z8U9dgKgMh3NM50pcNgyYqAaZm08sQzGVukCU",

  // Pestaña donde se guardarán las confirmaciones
  sheetName: "Confirmaciones - Boda Luz & Emmanuel",

  // Correos receptores (Novios y Correo Oficial Lira)
  recipients: "zelivereyesmartinez@gmail.com, invitaciones.digitales.lira@gmail.com",

  // Asunto del correo
  subject: "💍 Nueva confirmación - Boda Luz Andrea & Angel Emmanuel",

  // Encabezados (columnas de la hoja)
  headers: [
    "Marca temporal",
    "Nombre",
    "Telefono",
    "Asistencia",
    "Adultos confirmados",    
    "Mensaje"
  ]
};

function openSheetEnsureHeaders_() {
  var ss = SpreadsheetApp.openById(CFG.spreadsheetId);
  var sh = ss.getSheetByName(CFG.sheetName);
  if (!sh) {
    sh = ss.insertSheet(CFG.sheetName);
  }

  var firstRow = sh.getRange(1, 1, 1, CFG.headers.length).getValues()[0];
  var needsHeaders = firstRow.every(function (cell) { return cell === ""; });

  if (needsHeaders) {
    var headerRange = sh.getRange(1, 1, 1, CFG.headers.length);
    headerRange.setValues([CFG.headers]);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#e5c365"); // Dorado élfico elegante
    headerRange.setFontColor("#0b1528");
    headerRange.setHorizontalAlignment("center");
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, CFG.headers.length);
  }
  return sh;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sh = openSheetEnsureHeaders_();
    var data = (e && e.parameter) ? e.parameter : {};

    var newRow = CFG.headers.map(function (header) {
      if (header === "Marca temporal") {
        return Utilities.formatDate(new Date(), "GMT-6", "dd/MM/yyyy HH:mm:ss");
      }
      return data[header] || "";
    });

    sh.appendRow(newRow);

    // Formatear la última fila agregada
    var lastRowIdx = sh.getLastRow();
    sh.getRange(lastRowIdx, 1, 1, CFG.headers.length).setHorizontalAlignment("left");
    sh.autoResizeColumns(1, CFG.headers.length);

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

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "online", service: "RSVP Boda Luz & Emmanuel - Sistemas Lira" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendConfirmationEmailWithExcel_(data, spreadsheet) {
  var msg = "¡Se ha recibido una nueva confirmación para la boda de Luz Andrea & Angel Emmanuel!\n\n";
  msg += "=======================================================\n";

  CFG.headers.forEach(function (header) {
    if (header !== "Marca temporal" && data[header] !== undefined) {
      msg += "• " + header + ": " + data[header] + "\n";
    }
  });

  msg += "=======================================================\n\n";
  msg += "Se adjunta la lista completa y actualizada en formato Excel: Boda_Luz_y_Emmanuel_Confirmaciones.xlsx\n";
  msg += "También puedes consultar la hoja en vivo en Google Drive aquí:\n" + spreadsheet.getUrl() + "\n\n";
  msg += "---\nInvitaciones Digitales Lira\nhttps://www.instagram.com/invitaciones_digitales_lira";

  var tempSpreadsheet = SpreadsheetApp.create("Boda_Luz_y_Emmanuel_Confirmaciones_" + new Date().getTime());
  try {
    var mainSheet = spreadsheet.getSheetByName(CFG.sheetName);
    mainSheet.copyTo(tempSpreadsheet).setName(CFG.sheetName);
    tempSpreadsheet.deleteSheet(tempSpreadsheet.getSheets()[0]);

    var tempId = tempSpreadsheet.getId();
    var exportUrl = "https://docs.google.com/spreadsheets/d/" + tempId + "/export?format=xlsx";

    var response = UrlFetchApp.fetch(exportUrl, {
      headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }
    });

    // Nombre bonito para el archivo Excel adjunto
    var excelFile = response.getBlob().setName("Boda_Luz_Andrea_y_Angel_Emmanuel_Confirmaciones.xlsx");

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
      msg + "\n\nError exportando Excel: " + err
    );
  } finally {
    try {
      DriveApp.getFileById(tempSpreadsheet.getId()).setTrashed(true);
    } catch (e) { }
  }
}
