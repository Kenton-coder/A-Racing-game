/**
 * GoogleAppsScript_MacauRacing.gs
 * 澳門東望洋賽車遊戲 — 線上排行榜服務端腳本
 * 版本 v0.1 | 2026-04-03
 *
 * 部署方式：
 *   1. 開啟 Google 試算表 → 擴充功能 → Apps Script
 *   2. 貼入此腳本全文
 *   3. 將下方 SPREADSHEET_ID 替換為您的試算表 ID（從試算表 URL 取得）
 *   4. 點選「儲存」
 *   5. 點選「部署」→「新增部署」→ 類型：網頁應用程式
 *   6. 執行身分：我（您的 Google 帳號）；存取權限：所有人
 *   7. 點選「部署」，複製產生的 Web App URL
 *   8. 將 URL 貼入 Unity 中 GoogleSheetsConnector 的 Web App URL 欄位
 *
 * 試算表 ID 取得方式：
 *   從試算表網址中複製：
 *   https://docs.google.com/spreadsheets/d/ ★這段★ /edit
 */

// ============================================================
//  ★ 設定區（必填）
// ============================================================

// ↓↓↓ 將 'YOUR_SPREADSHEET_ID_HERE' 替換為您的試算表 ID ↓↓↓
const SPREADSHEET_ID = '1XRsqB4YR1vHwVzPxC0Xaml1d2Yk55SUPFe2MR3Ks5H4';

// 每個賽車模式對應的工作表（分頁）名稱
const SHEET_NAMES = {
  'F3':         'F3',
  'GT3':        'GT3',
  'Touring':    'Touring',
  'Motorcycle': 'Motorcycle'
};

// 每個賽車模式保留的最大排名筆數
const MAX_ENTRIES = 20;

// 欄位標頭（第 1 列）
const HEADERS = [
  'Rank', 'PlayerName', 'BestLapSec', 'BestLapFormatted',
  'FinishTimeSec', 'FinishTimeFormatted', 'TotalLaps', 'Date'
];

// ============================================================
//  主要入口：處理所有 GET 請求
//  （使用 GET 而非 POST，避免 Unity UnityWebRequest 重導向問題）
// ============================================================

/**
 * 處理所有 HTTP GET 請求。
 * 根據 action 參數分派至對應函式。
 *
 * 支援的 action：
 *   action=submit  → 提交新分數
 *   action=fetch   → 查詢排行榜
 *   action=setup   → 初始化所有工作表標頭（僅需執行一次）
 */
function doGet(e) {
  try {
    var params = e.parameter;
    var action = params.action || 'fetch';

    var sheet = getSheet(params.mode || 'F3');
    if (!sheet) {
      return jsonResponse({ success: false, message: '無效的賽車模式：' + params.mode });
    }

    // 確保標頭列存在（首次使用時自動建立）
    ensureHeaders(sheet);

    if (action === 'submit') {
      return submitScore(params, sheet);
    } else if (action === 'fetch') {
      return fetchScores(params, sheet);
    } else if (action === 'setup') {
      setupAllSheets();
      return jsonResponse({ success: true, message: '所有工作表已初始化完成。' });
    } else {
      return jsonResponse({ success: false, message: '未知的 action：' + action });
    }

  } catch (err) {
    return jsonResponse({ success: false, message: '伺服器錯誤：' + err.toString() });
  }
}

// ============================================================
//  功能一：提交分數
// ============================================================

/**
 * 處理分數提交請求。
 * 邏輯：
 *   1. 驗證必要參數
 *   2. 檢查玩家是否已有記錄
 *      - 有且新分數更好 → 更新現有列
 *      - 有且新分數較差 → 返回「無需更新」
 *      - 沒有 → 新增一列
 *   3. 重新排序（BestLapSec 升序）
 *   4. 裁剪至 MAX_ENTRIES 筆
 */
function submitScore(params, sheet) {
  // 驗證必要欄位
  var required = ['name', 'bestLapSec', 'laps'];
  for (var i = 0; i < required.length; i++) {
    if (!params[required[i]]) {
      return jsonResponse({ success: false, message: '缺少必要參數：' + required[i] });
    }
  }

  var playerName    = params.name.substring(0, 20);  // 最多 20 字元
  var bestLapSec    = parseFloat(params.bestLapSec);
  var bestLapFmt    = params.bestLapFmt  || formatTime(bestLapSec);
  var finishSec     = parseFloat(params.finishSec  || 0);
  var finishFmt     = params.finishFmt   || formatTime(finishSec);
  var totalLaps     = parseInt(params.laps) || 0;
  var date          = params.date || new Date().toISOString().split('T')[0];

  // 搜尋玩家是否已有記錄
  var data          = sheet.getDataRange().getValues();
  var existingRow   = -1;      // 1-based 列號（含標頭），-1 表示未找到
  var existingTime  = Infinity;

  for (var r = 1; r < data.length; r++) { // 跳過第 0 列（標頭）
    // data[r][1] = PlayerName 欄（欄索引 1，對應 HEADERS[1]）
    if (data[r][1] && data[r][1].toString().toLowerCase() === playerName.toLowerCase()) {
      existingRow  = r + 1;  // getValues() 是 0-based，getRange() 需 1-based
      existingTime = parseFloat(data[r][2]) || Infinity;  // data[r][2] = BestLapSec
      break;
    }
  }

  if (existingRow > 0 && bestLapSec >= existingTime) {
    // 現有記錄更好，不更新
    return jsonResponse({ success: true, message: '現有記錄較佳，無需更新。' });
  }

  if (existingRow > 0) {
    // 更新現有列（新分數更好）
    sheet.getRange(existingRow, 1, 1, HEADERS.length).setValues([[
      0,            // Rank（稍後重算）
      playerName,
      bestLapSec,
      bestLapFmt,
      finishSec,
      finishFmt,
      totalLaps,
      date
    ]]);
  } else {
    // 新增列
    sheet.appendRow([
      0,            // Rank（稍後重算）
      playerName,
      bestLapSec,
      bestLapFmt,
      finishSec,
      finishFmt,
      totalLaps,
      date
    ]);
  }

  // 排序並裁剪
  sortAndTrimSheet(sheet);

  return jsonResponse({ success: true, message: '成績已成功提交！' });
}

// ============================================================
//  功能二：查詢排行榜
// ============================================================

/**
 * 回傳指定工作表前 limit 筆資料（JSON 格式）。
 */
function fetchScores(params, sheet) {
  var limit = Math.min(parseInt(params.limit) || MAX_ENTRIES, MAX_ENTRIES);
  var data  = sheet.getDataRange().getValues();
  var entries = [];

  for (var r = 1; r < data.length && entries.length < limit; r++) {
    var row = data[r];
    if (!row[1]) continue;  // 跳過空白列（PlayerName 為空）

    entries.push({
      rank:                 r,
      playerName:           row[1] ? row[1].toString() : '',
      bestLapTimeSeconds:   parseFloat(row[2]) || 0,
      bestLapTimeFormatted: row[3] ? row[3].toString() : '--:--.---',
      finishTimeSeconds:    parseFloat(row[4]) || 0,
      finishTimeFormatted:  row[5] ? row[5].toString() : '--:--.---',
      totalLaps:            parseInt(row[6]) || 0,
      racingMode:           '',  // 由 Unity 端已知，不需回傳
      date:                 row[7] ? row[7].toString() : ''
    });
  }

  return jsonResponse({ success: true, entries: entries });
}

// ============================================================
//  工具函式
// ============================================================

/**
 * 取得對應賽車模式的工作表（分頁）。
 * 若分頁不存在，自動建立並初始化標頭。
 */
function getSheet(mode) {
  var sheetName = SHEET_NAMES[mode];
  if (!sheetName) return null;

  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    // 自動建立缺少的分頁
    sheet = ss.insertSheet(sheetName);
    Logger.log('已自動建立工作表：' + sheetName);
  }

  // 無論分頁是否新建，均確保標頭存在（修正：手動預建分頁也能正確初始化）
  ensureHeaders(sheet);
  return sheet;
}

/**
 * 確保工作表第 1 列為標頭列。
 * 若第 1 列已有 PlayerName 標頭，則跳過。
 */
function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0 || sheet.getRange(1, 2).getValue() !== 'PlayerName') {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

    // 設定標頭格式（粗體、背景色）
    var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#007A3D');  // 澳門旗綠色
    headerRange.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
}

/**
 * 按 BestLapSec（第 3 欄，升序）排序，裁剪至 MAX_ENTRIES 筆，並更新 Rank 欄。
 */
function sortAndTrimSheet(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;  // 只有標頭或空表

  // 排序資料列（不含標頭），按第 3 欄（BestLapSec）升序
  var dataRange = sheet.getRange(2, 1, lastRow - 1, HEADERS.length);
  dataRange.sort({ column: 3, ascending: true });  // column 為 1-based

  // 裁剪超出 MAX_ENTRIES 的資料列
  var newLastRow = sheet.getLastRow();
  if (newLastRow > MAX_ENTRIES + 1) {
    sheet.deleteRows(MAX_ENTRIES + 2, newLastRow - MAX_ENTRIES - 1);
  }

  // 重新填入 Rank 欄（第 1 欄）
  var finalLastRow = sheet.getLastRow();
  for (var r = 2; r <= finalLastRow; r++) {
    sheet.getRange(r, 1).setValue(r - 1);
  }
}

/**
 * 初始化所有賽車模式的工作表。
 * 首次部署後，手動執行此函式一次即可（也可透過 action=setup 觸發）。
 */
function setupAllSheets() {
  Object.keys(SHEET_NAMES).forEach(function(mode) {
    getSheet(mode);
  });
  Logger.log('所有工作表初始化完成。');
}

/**
 * 建立標準 JSON ContentService 回應。
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 將秒數格式化為 "MM:SS.mmm"（供伺服器端備用）。
 */
function formatTime(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '--:--.---';
  var minutes = Math.floor(totalSeconds / 60);
  var seconds = Math.floor(totalSeconds % 60);
  var ms      = Math.round((totalSeconds % 1) * 1000);
  return ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2) + '.' + ('00' + ms).slice(-3);
}
