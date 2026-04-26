// [版本] v0.2 | [日期] 2026-04-22 | [功能] 全域常量、列舉、中文字串；新增 TEXT_UPLOAD_SCORE（Issue 3）

// ── 澳門色系 ──────────────────────────────────────────────────────────────
export const COLOR_GREEN  = 0x007A3D;
export const COLOR_WHITE  = 0xFFFFFF;
export const COLOR_GOLD   = 0xFFD700;
export const COLOR_DARK   = 0x2C2C2C;
export const COLOR_RED    = 0xC8102E;
export const COLOR_BLACK  = 0x000000;
export const COLOR_GRAY   = 0x888888;

export const TEXT_UPLOAD_SCORE = '上傳成績';

// ── 列舉 ──────────────────────────────────────────────────────────────────
export enum RacingMode {
  TIME_TRIAL  = 'TIME_TRIAL',
  RACE        = 'RACE',
}

export enum VehicleType {
  F3     = 'f3',
  GT3    = 'gt3',
  SEDAN  = 'sedan',
  BIKE   = 'bike',
}

export enum AIDifficulty {
  BEGINNER = 'beginner',
  AMATEUR  = 'amateur',
  PRO      = 'pro',
}

export enum GameState {
  IDLE        = 'IDLE',
  COUNTDOWN   = 'COUNTDOWN',
  RACING      = 'RACING',
  PAUSED      = 'PAUSED',
  FINISHED    = 'FINISHED',
}

// ── 中文字串（禁止在邏輯中硬編碼） ────────────────────────────────────────
export const STR = {
  // 主畫面
  MENU_TITLE:           '澳門格蘭披治賽車',
  MENU_START:           '開始遊戲',
  MENU_LEADERBOARD:     '排行榜',
  MENU_SETTINGS:        '規則',

  // 賽前設置
  SETUP_TITLE:          '賽前設置',
  SETUP_MODE_LABEL:     '比賽模式',
  SETUP_MODE_TRIAL:     '計時賽',
  SETUP_MODE_RACE:      '競速賽',
  SETUP_VEHICLE_LABEL:  '選擇賽車模式：',
  SETUP_VEHICLE_F3:     'F3 方程式',
  SETUP_VEHICLE_GT3:    'GT3',
  SETUP_VEHICLE_SEDAN:  '房車',
  SETUP_VEHICLE_BIKE:   '機車',
  SETUP_AI_COUNT:       'AI 對手數量：',
  SETUP_AI_DIFF:        'AI 難度：',
  SETUP_AI_BEGINNER:    '初級',
  SETUP_AI_AMATEUR:     '業餘',
  SETUP_AI_PRO:         '專業',
  SETUP_LAPS_LABEL:     '比賽圈數：',
  SETUP_PLAYER_NAME:    '玩家名稱：',
  SETUP_PLAYER_PROMPT:  '請輸入玩家名稱（最多 20 字元）：',
  SETUP_CONFIRM:        '開始比賽',
  SETUP_BACK:           '返回',

  // HUD
  HUD_LAP:              '圈數',
  HUD_RANK:             '排名',
  HUD_SPEED:            'km/h',
  HUD_BEST_LAP:         '最快圈',
  HUD_TOTAL_TIME:       '總時間',

  // 倒計時
  COUNTDOWN_GO:         'GO!',

  // 暫停
  PAUSE_TITLE:          '暫停',
  PAUSE_RESUME:         '繼續',
  PAUSE_RESTART:        '重新開始',
  PAUSE_MAIN_MENU:      '返回主畫面',

  // 結算
  RESULTS_TITLE:        '比賽結束',
  RESULTS_SUBMIT:       '提交成績',
  RESULTS_RETRY:        '再試一次',
  RESULTS_MENU:         '主畫面',
  RESULTS_BEST_LAP:     '最快圈速',
  RESULTS_TOTAL:        '總時間',
  RESULTS_RANK:         '最終排名',
  RESULTS_UPLOAD_OK:    '上傳成功！',
  RESULTS_UPLOAD_ERR:   '上傳失敗，請重試',

  // 排行榜
  LB_TITLE:             '排行榜',
  LB_TAB_CAR_TRIAL:     '跑車計時',
  LB_TAB_CAR_RACE:      '跑車競速',
  LB_TAB_BIKE_TRIAL:    '摩托計時',
  LB_TAB_BIKE_RACE:     '摩托競速',
  LB_PLAYER:            '玩家',
  LB_TIME:              '最佳單圈時間',
  LB_DATE:              '日期',
  LB_LOADING:           '載入中…',
  LB_OFFLINE:           '（離線模式）',
  LB_NO_RECORDS:        '暫無記錄',
  LB_FETCH_ERROR:       '載入失敗，請重試',
  LB_REFRESH:           '刷新',
  LB_TAB_F3:            'F3',
  LB_TAB_GT3:           'GT3',
  LB_TAB_SEDAN:         '房車',
  LB_TAB_BIKE:          '機車',

  // 錯誤
  ERR_SUBMIT_FAILED:    '提交失敗，請稍後再試',
} as const;

// ── 物理常量 ───────────────────────────────────────────────────────────────
export const PHYSICS = {
  PIXELS_PER_METER:     10,
  MAX_SPEED_KMH:        300,
  DRAG:                 0.98,
  ANGULAR_DRAG:         0.85,
} as const;

// ── 場景 Key ───────────────────────────────────────────────────────────────
export const SCENE = {
  BOOT:           'BootScene',
  MAIN_MENU:      'MainMenuScene',
  PRE_RACE_SETUP: 'PreRaceSetupScene',
  RACE:           'RaceScene',
  RESULTS:        'ResultsScene',
  LEADERBOARD:    'LeaderboardScene',
  SETTINGS:       'SettingsScene',
} as const;

// ── 資產 Key（對應 BootScene 中 this.load.* 的 key） ──────────────────────
export const ASSET = {
  // 音效
  BGM_MENU:           'bgm_menu',
  BGM_RACE:           'bgm_race',
  SFX_ENGINE:         'sfx_engine',
  SFX_CHECKPOINT:     'sfx_checkpoint',
  SFX_COUNTDOWN:      'sfx_countdown',
  SFX_FINISH:         'sfx_finish',
  SFX_BUTTON:         'sfx_button',
  SFX_UI_CLICK:       'sfx_ui_click',

  // 貼圖
  CAR_PLAYER:         'car_player',
  CAR_AI_1:           'car_ai_1',
  CAR_AI_2:           'car_ai_2',
  BIKE_PLAYER:        'bike_player',
  BIKE_AI_1:          'bike_ai_1',
  TRACK_BG:           'track_bg',
  UI_PANEL:           'ui_panel',

  // JSON
  VEHICLE_CONFIGS:    'vehicle_configs',
  LEADERBOARD_CACHE:  'leaderboard_cache',
} as const;

// ── 排行榜 ─────────────────────────────────────────────────────────────────
export const LEADERBOARD = {
  CACHE_KEY:          'guia_leaderboard_cache',
  CACHE_TTL_MS:       5 * 60 * 1000,  // 5 分鐘
  MAX_ENTRIES:        100,
} as const;
