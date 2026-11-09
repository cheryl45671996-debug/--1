import express from 'express';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to get Google Sheets client from Service Account JSON
function getSheetsClient() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    return { error: '未設定環境變數 GOOGLE_SERVICE_ACCOUNT_JSON' };
  }

  try {
    let credentials: any;
    if (typeof serviceAccountJson === 'string') {
      credentials = JSON.parse(serviceAccountJson);
    } else {
      credentials = serviceAccountJson;
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return { sheets, clientEmail: credentials.client_email };
  } catch (err: any) {
    console.error('Failed to initialize Google Auth:', err);
    return { error: 'Google Service Account 憑證解析失敗: ' + err.message };
  }
}

// Automatically ensure '玩家' and '遊戲記錄' worksheets exist with exact required headers
async function ensureWorksheetsAndHeaders(sheets: any, spreadsheetId: string) {
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const existingTitles = meta.data.sheets?.map((s: any) => s.properties?.title) || [];
    const requests: any[] = [];

    if (!existingTitles.includes('玩家')) {
      requests.push({ addSheet: { properties: { title: '玩家' } } });
    }
    if (!existingTitles.includes('遊戲記錄')) {
      requests.push({ addSheet: { properties: { title: '遊戲記錄' } } });
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests },
      });
    }

    // 1. 玩家 工作表: [玩家名稱, 密碼, 最後一次登入時間]
    const playersHeader = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'玩家'!A1:C1",
    });
    if (!playersHeader.data.values || playersHeader.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "'玩家'!A1:C1",
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['玩家名稱', '密碼', '最後一次登入時間']],
        },
      });
    }

    // 2. 遊戲記錄 工作表: [時間, 玩家名稱, 遊戲模式, 最終得分, 命中率, 擊破數, 最高連擊, 使用武器, 獲得夜市幣]
    const recordsHeader = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'遊戲記錄'!A1:I1",
    });
    if (!recordsHeader.data.values || recordsHeader.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "'遊戲記錄'!A1:I1",
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['時間', '玩家名稱', '遊戲模式', '最終得分', '命中率', '擊破數', '最高連擊', '使用武器', '獲得夜市幣']],
        },
      });
    }
  } catch (err: any) {
    console.warn('ensureWorksheetsAndHeaders note:', err.message);
  }
}

// In-memory fallback for local testing
const localPlayers: { [name: string]: { password: string; lastLogin: string } } = {
  士林神射手: { password: '123', lastLogin: '2026/11/09 11:20:00' },
  夜市小柴犬: { password: '123', lastLogin: '2026/11/09 10:45:00' },
};

const localGameRecords: any[] = [
  {
    time: '2026/11/09 11:20:00',
    playerName: '士林神射手',
    gameMode: '60秒限時挑戰',
    score: 3850,
    accuracy: '94%',
    hits: 28,
    maxCombo: 18,
    weapon: '連發BB玩具步槍',
    coins: 77,
  },
  {
    time: '2026/11/09 10:45:00',
    playerName: '夜市小柴犬',
    gameMode: '經典十發包廂',
    score: 2900,
    accuracy: '100%',
    hits: 10,
    maxCombo: 10,
    weapon: '復古軟木塞手槍',
    coins: 558,
  },
  {
    time: '2026/11/09 09:15:00',
    playerName: '珍珠奶茶狂熱者',
    gameMode: '橫向滑行極速',
    score: 2450,
    accuracy: '88%',
    hits: 22,
    maxCombo: 12,
    weapon: '霓虹雷射手槍',
    coins: 49,
  },
];

// Helper to format current local time
function getNowFormatted() {
  const d = new Date();
  return d.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
}

// ========================================================
// 1. Google Sheets Status & Config API
// ========================================================
app.get('/api/sheets/status', async (_req, res) => {
  const { sheets, clientEmail, error } = getSheetsClient();
  const sheetId = process.env.GOOGLE_SHEET_ID || '';

  if (error || !sheets) {
    return res.json({
      configured: false,
      hasServiceAccount: false,
      hasSheetId: !!sheetId,
      sheetId,
      clientEmail: null,
      message: error || 'Service Account 未配置',
    });
  }

  // If sheetId is provided, try to ensure worksheets
  if (sheetId) {
    ensureWorksheetsAndHeaders(sheets, sheetId).catch(() => {});
  }

  return res.json({
    configured: !!sheetId,
    hasServiceAccount: true,
    hasSheetId: !!sheetId,
    sheetId,
    clientEmail,
    message: sheetId
      ? 'Google Sheets 整合運作中（工作表：「玩家」、「遊戲記錄」已就緒）'
      : 'Service Account 憑證就緒，請綁定 Google Sheet ID 並授權服務帳號為編輯者',
  });
});

app.post('/api/sheets/set-id', async (req, res) => {
  const { sheetId } = req.body;
  if (!sheetId || typeof sheetId !== 'string') {
    return res.status(400).json({ error: '請提供有效的 Google Sheet ID' });
  }

  process.env.GOOGLE_SHEET_ID = sheetId.trim();
  const { sheets } = getSheetsClient();
  if (sheets) {
    await ensureWorksheetsAndHeaders(sheets, process.env.GOOGLE_SHEET_ID);
  }

  return res.json({
    success: true,
    sheetId: process.env.GOOGLE_SHEET_ID,
    message: 'Google Sheet ID 設定成功，已自動初始化「玩家」與「遊戲記錄」工作表！',
  });
});

// ========================================================
// 2. 玩家 工作表 API: [玩家名稱, 密碼, 最後一次登入時間]
// ========================================================

// 註冊玩家
app.post('/api/player/register', async (req, res) => {
  const { username, password } = req.body;
  const name = (username || '').trim();
  const pass = (password || '').trim();

  if (!name || !pass) {
    return res.status(400).json({ error: '請輸入玩家名稱與密碼' });
  }

  const now = getNowFormatted();
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const { sheets } = getSheetsClient();

  if (sheetId && sheets) {
    try {
      await ensureWorksheetsAndHeaders(sheets, sheetId);
      // Read existing players from '玩家'!A2:C
      const readRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "'玩家'!A2:C",
      });
      const rows = readRes.data.values || [];
      const existing = rows.find((r: any[]) => r[0] && r[0].trim().toLowerCase() === name.toLowerCase());

      if (existing) {
        return res.status(400).json({ error: '此玩家名稱已被註冊，請直接登入或更換名稱' });
      }

      // Append new player to '玩家'!A:C
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "'玩家'!A:C",
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[name, pass, now]],
        },
      });

      // Keep in local fallback as well
      localPlayers[name] = { password: pass, lastLogin: now };

      return res.json({
        success: true,
        player: { name, lastLogin: now },
        destination: 'google_sheets',
        message: '註冊成功！資料已同步登錄至 Google Sheet「玩家」工作表',
      });
    } catch (err: any) {
      console.error('Register sheet error:', err.message);
      // Fallback to local
    }
  }

  // Local fallback registration
  if (localPlayers[name]) {
    return res.status(400).json({ error: '此玩家名稱已被註冊，請直接登入或更換名稱' });
  }

  localPlayers[name] = { password: pass, lastLogin: now };
  return res.json({
    success: true,
    player: { name, lastLogin: now },
    destination: 'local',
    message: '註冊成功！（已保存於本地工作表）',
  });
});

// 登入玩家
app.post('/api/player/login', async (req, res) => {
  const { username, password } = req.body;
  const name = (username || '').trim();
  const pass = (password || '').trim();

  if (!name || !pass) {
    return res.status(400).json({ error: '請輸入玩家名稱與密碼' });
  }

  const now = getNowFormatted();
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const { sheets } = getSheetsClient();

  if (sheetId && sheets) {
    try {
      await ensureWorksheetsAndHeaders(sheets, sheetId);
      const readRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "'玩家'!A2:C",
      });
      const rows = readRes.data.values || [];
      let foundIndex = -1;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row[0] && row[0].trim().toLowerCase() === name.toLowerCase()) {
          if (row[1] === pass) {
            foundIndex = i;
            break;
          } else {
            return res.status(400).json({ error: '密碼錯誤，請重新確認' });
          }
        }
      }

      if (foundIndex === -1) {
        return res.status(404).json({ error: '找不到此玩家名稱，請先點擊註冊' });
      }

      // Update '最後一次登入時間' at row (foundIndex + 2) in column C
      const targetRow = foundIndex + 2;
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `'玩家'!C${targetRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[now]],
        },
      });

      localPlayers[name] = { password: pass, lastLogin: now };

      return res.json({
        success: true,
        player: { name, lastLogin: now },
        destination: 'google_sheets',
        message: '登入成功！已更新 Google Sheet「玩家」最後一次登入時間',
      });
    } catch (err: any) {
      console.error('Login sheet error:', err.message);
      // Fall through to local fallback
    }
  }

  // Local fallback login
  const localUser = localPlayers[name];
  if (!localUser) {
    return res.status(404).json({ error: '找不到此玩家名稱，請先點擊註冊' });
  }
  if (localUser.password !== pass) {
    return res.status(400).json({ error: '密碼錯誤，請重新確認' });
  }

  localUser.lastLogin = now;
  return res.json({
    success: true,
    player: { name, lastLogin: now },
    destination: 'local',
    message: '登入成功！',
  });
});

// ========================================================
// 3. 遊戲記錄 工作表 API: [時間, 玩家名稱, 遊戲模式, 最終得分, 命中率, 擊破數, 最高連擊, 使用武器, 獲得夜市幣]
// ========================================================

// 取得遊戲記錄 / 風雲榜
app.get('/api/records', async (_req, res) => {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const { sheets } = getSheetsClient();

  if (sheetId && sheets) {
    try {
      await ensureWorksheetsAndHeaders(sheets, sheetId);
      const readRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "'遊戲記錄'!A2:I",
      });

      const rows = readRes.data.values || [];
      const records = rows.map((r: any[]) => ({
        time: r[0] || '',
        playerName: r[1] || '匿名神射手',
        gameMode: r[2] || '60秒限時挑戰',
        score: parseInt(r[3] || '0', 10),
        accuracy: r[4] || '0%',
        hits: parseInt(r[5] || '0', 10),
        maxCombo: parseInt(r[6] || '0', 10),
        weapon: r[7] || '復古軟木塞手槍',
        coins: parseInt(r[8] || '0', 10),
      }));

      // Sort by score descending
      records.sort((a, b) => b.score - a.score);

      return res.json({
        source: 'google_sheets',
        sheetId,
        records: records.length > 0 ? records : localGameRecords,
      });
    } catch (err: any) {
      console.error('Read records error:', err.message);
    }
  }

  // Local fallback
  const records = [...localGameRecords].sort((a, b) => b.score - a.score);
  return res.json({
    source: 'local',
    sheetId: sheetId || null,
    records,
  });
});

// 寫入遊戲記錄
app.post('/api/records', async (req, res) => {
  const {
    playerName,
    gameMode,
    score,
    accuracy,
    hits,
    maxCombo,
    weapon,
    coins,
  } = req.body;

  const now = getNowFormatted();
  const name = (playerName || '夜市新星').trim().substring(0, 20);
  const mode = gameMode || '60秒限時挑戰';
  const finalScore = Number(score) || 0;
  const acc = typeof accuracy === 'number' ? `${accuracy}%` : accuracy || '0%';
  const hitCount = Number(hits) || 0;
  const combo = Number(maxCombo) || 0;
  const usedWeapon = weapon || '復古軟木塞手槍';
  const earnedCoins = Number(coins) || 0;

  const newRecord = {
    time: now,
    playerName: name,
    gameMode: mode,
    score: finalScore,
    accuracy: acc,
    hits: hitCount,
    maxCombo: combo,
    weapon: usedWeapon,
    coins: earnedCoins,
  };

  // Add to local fallback
  localGameRecords.push(newRecord);

  const sheetId = process.env.GOOGLE_SHEET_ID;
  const { sheets } = getSheetsClient();

  if (sheetId && sheets) {
    try {
      await ensureWorksheetsAndHeaders(sheets, sheetId);

      // Append row to '遊戲記錄' 工作表
      // 欄位: [時間, 玩家名稱, 遊戲模式, 最終得分, 命中率, 擊破數, 最高連擊, 使用武器, 獲得夜市幣]
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "'遊戲記錄'!A:I",
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              newRecord.time,
              newRecord.playerName,
              newRecord.gameMode,
              newRecord.score,
              newRecord.accuracy,
              newRecord.hits,
              newRecord.maxCombo,
              newRecord.weapon,
              newRecord.coins,
            ],
          ],
        },
      });

      return res.json({
        success: true,
        destination: 'google_sheets',
        message: '🎉 遊戲記錄已成功寫入 Google Sheet「遊戲記錄」工作表！',
        record: newRecord,
      });
    } catch (err: any) {
      console.error('Append record error:', err.message);
      return res.json({
        success: true,
        destination: 'local',
        warning: 'Google Sheet 寫入失敗: ' + err.message,
        record: newRecord,
      });
    }
  }

  return res.json({
    success: true,
    destination: 'local',
    message: '遊戲記錄已保存於本地記錄',
    record: newRecord,
  });
});

// Backward compatibility alias for leaderboard
app.get('/api/leaderboard', (_req, res) => {
  res.redirect('/api/records');
});

// Mount Vite in dev mode
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Night Market Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
