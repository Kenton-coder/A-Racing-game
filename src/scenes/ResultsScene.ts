// [版本] v0.2 | [日期] 2026-04-22 | [功能] 結算畫面；新增「上傳成績」按鈕（Issue 3）

import Phaser from 'phaser';
import { SCENE, ASSET, COLOR_GOLD, COLOR_GREEN, COLOR_WHITE, COLOR_GRAY, STR, TEXT_UPLOAD_SCORE } from '@/data/GameConstants';
import { RaceTimer } from '@/systems/RaceTimer';
import { LeaderboardManager } from '@/leaderboard/LeaderboardManager';
import type { RaceSetup } from '@/data/RaceSetup';

interface RaceResult {
  totalMs:   number;
  bestLapMs: number;
  lapTimes:  number[];
  position:  number;
}

export class ResultsScene extends Phaser.Scene {
  constructor() { super(SCENE.RESULTS); }

  create(): void {
    this.input.on('gameobjectdown', () => { this.sound.play(ASSET.SFX_UI_CLICK, { volume: 0.8 }); });

    const result = (this.registry.get('raceResult') as RaceResult | undefined);
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x111111);

    this.add.text(width / 2, 80, STR.RESULTS_TITLE, {
      fontSize: '42px', fontFamily: 'monospace',
      color: `#${COLOR_GOLD.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    if (result) {
      this.add.text(width / 2, 180,
        `${STR.RESULTS_TOTAL}：${RaceTimer.format(result.totalMs)}`, {
          fontSize: '24px', fontFamily: 'monospace',
          color: `#${COLOR_WHITE.toString(16).padStart(6, '0')}`,
        }).setOrigin(0.5);

      this.add.text(width / 2, 220,
        `${STR.RESULTS_BEST_LAP}：${RaceTimer.format(result.bestLapMs)}`, {
          fontSize: '24px', fontFamily: 'monospace',
          color: `#${COLOR_GREEN.toString(16).padStart(6, '0')}`,
        }).setOrigin(0.5);

      this.add.text(width / 2, 260,
        `${STR.RESULTS_RANK}：${result.position}`, {
          fontSize: '24px', fontFamily: 'monospace',
          color: `#${COLOR_WHITE.toString(16).padStart(6, '0')}`,
        }).setOrigin(0.5);

      // 各圈時間
      result.lapTimes.forEach((ms, i) => {
        this.add.text(width / 2, 310 + i * 30,
          `圈 ${i + 1}：${RaceTimer.format(ms)}`, {
            fontSize: '20px', fontFamily: 'monospace',
            color: `#${COLOR_WHITE.toString(16).padStart(6, '0')}`,
          }).setOrigin(0.5);
      });
    }

    // ── 上傳成績按鈕（Issue 3）────────────────────────────────────────────
    const feedbackText = this.add.text(width / 2, height - 200, '', {
      fontSize: '18px', fontFamily: 'monospace',
      color: `#${COLOR_WHITE.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    if (result) {
      const setup = this.registry.get('raceSetup') as RaceSetup | undefined;

      const btnUpload = this.add.text(width / 2, height - 155, TEXT_UPLOAD_SCORE, {
        fontSize: '22px', fontFamily: 'monospace', color: '#ffffff',
        backgroundColor: `#${COLOR_GREEN.toString(16).padStart(6, '0')}`,
        padding: { x: 16, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btnUpload.on('pointerdown', () => {
        btnUpload.disableInteractive();
        btnUpload.setStyle({ backgroundColor: `#${COLOR_GRAY.toString(16).padStart(6, '0')}` });

        LeaderboardManager.submitScore({
          playerName:  setup?.playerName ?? 'PLAYER',
          totalMs:     result.totalMs,
          bestLapMs:   result.bestLapMs,
          totalLaps:   result.lapTimes.length,
          position:    result.position,
          vehicleType: String(setup?.vehicleType ?? ''),
          mode:        String(setup?.mode ?? ''),
          date:        new Date().toISOString().slice(0, 10),
        }).then(() => {
          feedbackText.setText(STR.RESULTS_UPLOAD_OK);
          this.time.delayedCall(2000, () => feedbackText.setText(''));
          // 成功後按鈕保持 disabled（不恢復）
        }).catch(() => {
          feedbackText.setText(STR.RESULTS_UPLOAD_ERR);
          btnUpload.setStyle({ backgroundColor: `#${COLOR_GREEN.toString(16).padStart(6, '0')}` });
          btnUpload.setInteractive({ useHandCursor: true });
        });
      });
    }

    // ── 現有按鈕（位置不變）───────────────────────────────────────────────
    this._addBtn(width / 2 - 120, height - 100, STR.RESULTS_RETRY, () => {
      this.scene.start(SCENE.RACE);
    });
    this._addBtn(width / 2 + 120, height - 100, STR.RESULTS_MENU, () => {
      this.scene.start(SCENE.MAIN_MENU);
    });
  }

  private _addBtn(x: number, y: number, label: string, cb: () => void): void {
    this.add.text(x, y, label, {
      fontSize: '22px', fontFamily: 'monospace', color: '#ffffff',
      backgroundColor: `#${COLOR_GREEN.toString(16).padStart(6, '0')}`,
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', cb);
  }
}
