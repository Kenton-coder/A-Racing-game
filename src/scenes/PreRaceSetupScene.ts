// [版本] v0.4 | [日期] 2026-04-22 | [功能] 新增玩家名稱輸入欄位，對應 GAS name 參數

import Phaser from 'phaser';
import {
  SCENE, ASSET, COLOR_GOLD, COLOR_GREEN, COLOR_WHITE, COLOR_DARK, COLOR_GRAY,
  STR, VehicleType, AIDifficulty, RacingMode,
} from '@/data/GameConstants';
import { RaceSetup, saveRaceSetup, loadRaceSetup } from '@/data/RaceSetup';
import { VehicleConfig, VehicleConfigManager } from '@/data/VehicleConfig';

const AI_DIFF_LABEL: Record<AIDifficulty, string> = {
  [AIDifficulty.BEGINNER]: STR.SETUP_AI_BEGINNER,
  [AIDifficulty.AMATEUR]:  STR.SETUP_AI_AMATEUR,
  [AIDifficulty.PRO]:      STR.SETUP_AI_PRO,
};

export class PreRaceSetupScene extends Phaser.Scene {
  private _setup: RaceSetup = loadRaceSetup();
  private _txtVehicleStats!: Phaser.GameObjects.Text;

  constructor() { super(SCENE.PRE_RACE_SETUP); }

  /** 根據當前選擇的車輛類型與顏色，生成 vehicleId */
  private _updateVehicleId(): void {
    const type = this._setup.vehicleType;          // 'f3' | 'gt3' | 'sedan' | 'bike'
    const color = this._setup.playerColor;         // 'black' | 'blue' | ...
    this._setup.vehicleId = `${type}_${color}`;
  }

  create(): void {
    this.input.on('gameobjectdown', () => { this.sound.play(ASSET.SFX_UI_CLICK, { volume: 0.8 }); });

    const { width, height } = this.scale;
    const cx = width / 2;

    this.cameras.main.setBackgroundColor(`#${COLOR_DARK.toString(16).padStart(6, '0')}`);
    this._loadVehicleConfigsFromCache();


    // 標題
    this.add.text(cx, 55, STR.SETUP_TITLE, {
      fontSize: '34px', fontFamily: 'monospace',
      color: `#${COLOR_GOLD.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    // ── 選擇賽車模式（Radio 2×2）──────────────────────────────────────
    this.add.text(cx - 280, 115, STR.SETUP_VEHICLE_LABEL, this._labelStyle()).setOrigin(0, 0.5);

    this._createRadioGroup<VehicleType>(
      cx - 280, 155,
      [
        { label: STR.SETUP_VEHICLE_F3,    value: VehicleType.F3 },
        { label: STR.SETUP_VEHICLE_GT3,   value: VehicleType.GT3 },
        { label: STR.SETUP_VEHICLE_SEDAN, value: VehicleType.SEDAN },
        { label: STR.SETUP_VEHICLE_BIKE,  value: VehicleType.BIKE },
      ],
      this._setup.vehicleType,
      (v) => {
        this._setup.vehicleType    = v;
        this._setup.aiVehicleClass = v;
        this._updateVehicleId();            
        this._updateVehicleStats();
        saveRaceSetup(this._setup);
      },
    );

    // 車輛數據顯示（極速 / 加速度）
    this._txtVehicleStats = this.add.text(cx, 222, '', {
      fontSize: '18px', fontFamily: 'monospace',
      color: `#${COLOR_GRAY.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5, 0);
    this._txtVehicleStats.setVisible(false);   
    this._updateVehicleStats();

    // ── 賽車顏色 ──────────────────────────────────────────────────
    const COLOR_OPTIONS = ['black','blue','green','red','yellow'];
    const COLOR_LABELS: Record<string, string> = {
      black: '黑', blue: '藍', green: '綠', red: '紅', yellow: '黃'
    };

    this.add.text(cx - 280, 262, '賽車顏色:', this._labelStyle()).setOrigin(0, 0.5);

    let colorIdx = COLOR_OPTIONS.indexOf(this._setup.playerColor);
    if (colorIdx < 0) colorIdx = 3; // 預設紅

    const colorBtn = this.add.text(cx - 60, 262,
      `[ ${COLOR_LABELS[COLOR_OPTIONS[colorIdx]]} ▼ ]`,
      {
        fontSize: '22px', fontFamily: 'monospace',
        color: `#${COLOR_GOLD.toString(16).padStart(6, '0')}`,
        backgroundColor: `#${COLOR_GREEN.toString(16).padStart(6, '0')}`,
        padding: { x: 10, y: 5 },
      }
    ).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    colorBtn.on('pointerdown', () => {
      colorIdx = (colorIdx + 1) % COLOR_OPTIONS.length;
      const newColor = COLOR_OPTIONS[colorIdx];
      colorBtn.setText(`[ ${COLOR_LABELS[newColor]} ▼ ]`);
      this._setup.playerColor = newColor;
      this._updateVehicleId();
      saveRaceSetup(this._setup); 
    });

    // ── AI 對手數量 ────────────────────────────────────────────────────
    this.add.text(cx - 280, 312, STR.SETUP_AI_COUNT, this._labelStyle()).setOrigin(0, 0.5);
    this.add.text(cx + 80, 312, '（0 ～ 5）', this._hintStyle()).setOrigin(0, 0.5);
    this._createDropdown<number>(
      cx - 60, 312,
      [0, 1, 2, 3, 4, 5],
      this._setup.aiCount,
      (v) => {
        this._setup.aiCount = v;
        this._setup.mode    = v > 0 ? RacingMode.RACE : RacingMode.TIME_TRIAL;
        saveRaceSetup(this._setup);
      },
    );

    // ── AI 難度 ───────────────────────────────────────────────────────
    this.add.text(cx - 280, 362, STR.SETUP_AI_DIFF, this._labelStyle()).setOrigin(0, 0.5);
    this.add.text(cx + 80, 362, '（初級 / 業餘 / 專業）', this._hintStyle()).setOrigin(0, 0.5);
    this._createDropdown<AIDifficulty>(
      cx - 60, 362,
      [AIDifficulty.BEGINNER, AIDifficulty.AMATEUR, AIDifficulty.PRO],
      this._setup.aiDifficulty,
      (v) => { 
        this._setup.aiDifficulty = v; 
        saveRaceSetup(this._setup);
      },
      (v) => AI_DIFF_LABEL[v],
    );

    // ── 比賽圈數 ──────────────────────────────────────────────────────
    this.add.text(cx - 280, 412, STR.SETUP_LAPS_LABEL, this._labelStyle()).setOrigin(0, 0.5);
    this.add.text(cx + 80, 412, '（1 / 3 / 5 / 10）', this._hintStyle()).setOrigin(0, 0.5);
    this._createDropdown<number>(
      cx - 60, 412,
      [1, 3, 5, 10],
      this._setup.totalLaps,
      (v) => {
        this._setup.totalLaps = v;
        saveRaceSetup(this._setup);
      },
    );

    // ── 玩家名稱（對應 GAS name 欄位，同名才能更新排名）────────────────
    this.add.text(cx - 280, 470, STR.SETUP_PLAYER_NAME, this._labelStyle()).setOrigin(0, 0.5);

    const nameDisplay = this.add.text(cx - 60, 470, `[ ${this._setup.playerName} ✎ ]`, {
      fontSize: '22px', fontFamily: 'monospace',
      color: `#${COLOR_GOLD.toString(16).padStart(6, '0')}`,
      backgroundColor: `#${COLOR_GREEN.toString(16).padStart(6, '0')}`,
      padding: { x: 10, y: 5 },
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    nameDisplay.on('pointerdown', () => {
      const entered = window.prompt(STR.SETUP_PLAYER_PROMPT, this._setup.playerName);
      if (entered !== null) {
        this._setup.playerName = entered.trim().substring(0, 20) || 'PLAYER';
        nameDisplay.setText(`[ ${this._setup.playerName} ✎ ]`);
        saveRaceSetup(this._setup);
      }
    });

    // ── 按鈕列 ────────────────────────────────────────────────────────
    const backBtn = this.add.text(cx - 160, height - 65, `← ${STR.SETUP_BACK}`, {
      fontSize: '22px', fontFamily: 'monospace',
      color: `#${COLOR_WHITE.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setAlpha(0.7));
    backBtn.on('pointerout',  () => backBtn.setAlpha(1.0));
    backBtn.on('pointerdown', () => this.scene.start(SCENE.MAIN_MENU));

    const startBtn = this.add.text(cx + 160, height - 65, `${STR.SETUP_CONFIRM} →`, {
      fontSize: '24px', fontFamily: 'monospace',
      color: `#${COLOR_GOLD.toString(16).padStart(6, '0')}`,
      backgroundColor: `#${COLOR_GREEN.toString(16).padStart(6, '0')}`,
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    startBtn.on('pointerover', () => startBtn.setAlpha(0.85));
    startBtn.on('pointerout',  () => startBtn.setAlpha(1.0));
    startBtn.on('pointerdown', () => {
      this.registry.set('raceSetup', { ...this._setup });
      this.scene.start(SCENE.RACE);
    });
  }

  private _loadVehicleConfigsFromCache(): void {
    try {
      const json = this.cache.json.get(ASSET.VEHICLE_CONFIGS) as VehicleConfig[] | null;
      if (json && json.length > 0) VehicleConfigManager.loadConfigs(json);
    } catch (_e) { /* configs 將在 RaceScene 再嘗試一次 */ }
  }

  private _updateVehicleStats(): void {
    //const id  = this._setup.vehicleId;   // 直接使用動態 vehicleId
    //const cfg = VehicleConfigManager.getConfig(id);
    //if (cfg) {
    //  this._txtVehicleStats.setText(
    //    `極速 ${cfg.maxSpeed} km/h  ·  加速度 ${cfg.acceleration} m/s²`,
    //  );
    //} else {
    //  this._txtVehicleStats.setText('');
    //}
  }

  private _labelStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontSize: '22px', fontFamily: 'monospace', color: '#FFFFFF' };
  }

  private _hintStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontSize: '16px', fontFamily: 'monospace', color: '#888888' };
  }

  /**
   * 建立 Radio Button 群組（2 欄網格排版）。
   */
  private _createRadioGroup<T>(
    x: number, y: number,
    options: { label: string; value: T }[],
    initialValue: T,
    onChange: (v: T) => void,
  ): void {
    const goldHex = `#${COLOR_GOLD.toString(16).padStart(6, '0')}`;
    const radios: Phaser.GameObjects.Text[] = [];

    options.forEach((opt, idx) => {
      const col      = idx % 2;
      const row      = Math.floor(idx / 2);
      const rx       = x + col * 230;
      const ry       = y + row * 44;
      const selected = opt.value === initialValue;

      const radio = this.add.text(rx, ry, `${selected ? '●' : '○'}  ${opt.label}`, {
        fontSize: '22px', fontFamily: 'monospace',
        color: selected ? goldHex : '#FFFFFF',
      }).setInteractive({ useHandCursor: true });

      radio.on('pointerdown', () => {
        radios.forEach((r, i) => {
          r.setText(`${i === idx ? '●' : '○'}  ${options[i].label}`)
           .setColor(i === idx ? goldHex : '#FFFFFF');
        });
        onChange(opt.value);
      });

      radios.push(radio);
    });
  }

  /**
   * 建立 Dropdown（點擊循環遞增）。
   * @param labelFn 可選的值→顯示文字轉換函數
   */
  private _createDropdown<T>(
    x: number, y: number,
    options: T[],
    initial: T,
    onChange: (v: T) => void,
    labelFn?: (v: T) => string,
  ): void {
    let idx = options.indexOf(initial);
    if (idx < 0) idx = 0;

    const display = (v: T): string => (labelFn ? labelFn(v) : String(v));

    const btn = this.add.text(x, y, `[ ${display(options[idx])} ▼ ]`, {
      fontSize: '22px', fontFamily: 'monospace',
      color: `#${COLOR_GOLD.toString(16).padStart(6, '0')}`,
      backgroundColor: `#${COLOR_GREEN.toString(16).padStart(6, '0')}`,
      padding: { x: 10, y: 5 },
    }).setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      idx = (idx + 1) % options.length;
      btn.setText(`[ ${display(options[idx])} ▼ ]`);
      onChange(options[idx]);
    });
  }
}
