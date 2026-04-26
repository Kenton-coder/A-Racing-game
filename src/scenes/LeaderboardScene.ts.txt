// [版本] v0.2 | [日期] 2026-04-22 | [功能] 排行榜：對接 GAS API，4 分頁資料顯示

import Phaser from 'phaser';
import {
  SCENE, ASSET, COLOR_GOLD, COLOR_WHITE, COLOR_DARK, COLOR_GRAY, STR,
} from '@/data/GameConstants';
import { LeaderboardManager } from '@/leaderboard/LeaderboardManager';
import type { GasEntry } from '@/leaderboard/LeaderboardManager';

const TABS: { label: string; mode: string }[] = [
  { label: STR.LB_TAB_F3,    mode: 'F3' },
  { label: STR.LB_TAB_GT3,   mode: 'GT3' },
  { label: STR.LB_TAB_SEDAN, mode: 'Touring' },
  { label: STR.LB_TAB_BIKE,  mode: 'Motorcycle' },
];

// 表格欄位 X 座標（相對 width/2）
const COL_OFFSETS = [-300, -250, 10, 170];

export class LeaderboardScene extends Phaser.Scene {
  private _activeMode = 'F3';
  private _tabBtns:   Phaser.GameObjects.Text[] = [];
  private _dataRows:  Phaser.GameObjects.Text[] = [];
  private _statusText!: Phaser.GameObjects.Text;

  constructor() { super(SCENE.LEADERBOARD); }

  create(): void {
    this.input.on('gameobjectdown', () => { this.sound.play(ASSET.SFX_UI_CLICK, { volume: 0.8 }); });

    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x111111);

    this.add.text(width / 2, 50, STR.LB_TITLE, {
      fontSize: '36px',
      color: `#${COLOR_GOLD.toString(16).padStart(6, '0')}`,
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this._buildTabs(width);
    this._buildHeader(width);

    this._statusText = this.add.text(width / 2, height / 2, '', {
      fontSize: '22px',
      color: `#${COLOR_GRAY.toString(16).padStart(6, '0')}`,
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(width / 2 - 120, height - 40, '← 返回', {
      fontSize: '22px',
      color: `#${COLOR_WHITE.toString(16).padStart(6, '0')}`,
      fontFamily: 'monospace',
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start(SCENE.MAIN_MENU));

    // 刷新排行榜按鈕
    this.add.text(width / 2 + 120, height - 40, STR.LB_REFRESH, {
      fontSize: '22px',
      color: `#${COLOR_WHITE.toString(16).padStart(6, '0')}`,
      fontFamily: 'monospace',
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this._fetchAndDisplay(this._activeMode);
      });

    this._fetchAndDisplay('F3');
  }

  private _buildTabs(width: number): void {
    const startX = width / 2 - ((TABS.length - 1) * 140) / 2;
    TABS.forEach((tab, i) => {
      const isActive = tab.mode === this._activeMode;
      const btn = this.add.text(startX + i * 140, 110, tab.label, {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: isActive
          ? `#${COLOR_GOLD.toString(16).padStart(6, '0')}`
          : `#${COLOR_GRAY.toString(16).padStart(6, '0')}`,
        backgroundColor: `#${COLOR_DARK.toString(16).padStart(6, '0')}`,
        padding: { x: 12, y: 6 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        if (this._activeMode === tab.mode) return;
        this._setActiveTab(tab.mode);
        this._fetchAndDisplay(tab.mode);
      });

      this._tabBtns.push(btn);
    });
  }

  private _buildHeader(width: number): void {
    const labels = [`#`, STR.LB_PLAYER, STR.LB_TIME, STR.LB_DATE];
    labels.forEach((label, i) => {
      this.add.text(width / 2 + COL_OFFSETS[i], 160, label, {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: `#${COLOR_GOLD.toString(16).padStart(6, '0')}`,
      });
    });
  }

  private _setActiveTab(mode: string): void {
    this._activeMode = mode;
    this._tabBtns.forEach((btn, i) => {
      const isActive = TABS[i].mode === mode;
      btn.setStyle({
        color: isActive
          ? `#${COLOR_GOLD.toString(16).padStart(6, '0')}`
          : `#${COLOR_GRAY.toString(16).padStart(6, '0')}`,
      });
    });
  }

  /** 清除資料列、顯示載入中文字，然後向 GAS 請求資料 */
  private _fetchAndDisplay(mode: string): void {
    this._clearRows();
    this._statusText.setText(STR.LB_LOADING).setVisible(true);

    LeaderboardManager.fetchScores(mode)
      .then(entries => this._renderEntries(entries))
      .catch(() => this._statusText.setText(STR.LB_FETCH_ERROR).setVisible(true));
  }

  private _clearRows(): void {
    this._dataRows.forEach(t => t.destroy());
    this._dataRows = [];
  }

  private _renderEntries(entries: GasEntry[]): void {
    this._statusText.setVisible(false);

    if (entries.length === 0) {
      this._statusText.setText(STR.LB_NO_RECORDS).setVisible(true);
      return;
    }

    const { width } = this.scale;
    entries.forEach((entry, i) => {
      const y = 195 + i * 32;
      const cells = [
        String(entry.rank),
        entry.playerName.substring(0, 12),
        entry.bestLapTimeFormatted,
        entry.date,
      ];
      cells.forEach((text, col) => {
        const t = this.add.text(width / 2 + COL_OFFSETS[col], y, text, {
          fontSize: '18px',
          fontFamily: 'monospace',
          color: `#${COLOR_WHITE.toString(16).padStart(6, '0')}`,
        });
        this._dataRows.push(t);
      });
    });
  }
}
