// [版本] v0.2 | [日期] 2026-04-19 | [功能] 遊戲主控 HUD 介面

import Phaser from 'phaser';
import { STR, COLOR_WHITE, COLOR_GOLD } from '@/data/GameConstants';

/** 直接建立於場景（不用 Container），確保 setScrollFactor(0) 在鏡頭縮放時正確作用 */
export class HUDController {
  private _txtTime: Phaser.GameObjects.Text;
  private _txtLap: Phaser.GameObjects.Text;
  private _txtSpeed: Phaser.GameObjects.Text;
  private _txtRank: Phaser.GameObjects.Text;
  private _elements: Phaser.GameObjects.Text[];

  constructor(scene: Phaser.Scene, totalLaps: number) {
    const { width, height } = scene.scale;

    // 左上角：計時器
    this._txtTime = scene.add.text(20, 20, '00:00.000', {
      fontFamily: 'monospace', fontSize: '32px',
      color: `#${COLOR_WHITE.toString(16).padStart(6, '0')}`,
      stroke: '#000000', strokeThickness: 4,
    }).setScrollFactor(0).setDepth(100);

    // 左上角下方：圈數
    this._txtLap = scene.add.text(20, 62, `${STR.HUD_LAP}: 1/${totalLaps}`, {
      fontFamily: 'monospace', fontSize: '24px',
      color: `#${COLOR_GOLD.toString(16).padStart(6, '0')}`,
      stroke: '#000000', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(100);

    // 右上角：排名
    this._txtRank = scene.add.text(width - 20, 20, 'P1', {
      fontFamily: 'monospace', fontSize: '36px',
      color: `#${COLOR_GOLD.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

    // 右下角：時速表
    this._txtSpeed = scene.add.text(width - 20, height - 20, `0 ${STR.HUD_SPEED}`, {
      fontFamily: 'monospace', fontSize: '42px',
      color: `#${COLOR_WHITE.toString(16).padStart(6, '0')}`,
      fontStyle: 'italic', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(100);

    this._elements = [this._txtTime, this._txtLap, this._txtRank, this._txtSpeed];
  }

  /**
   * 每幀由 RaceScene 呼叫，刷新全部 HUD 數值
   */
  public updateHUD(
    speedKmh: number,
    timeMs: number,
    currentLap: number,
    totalLaps: number,
    rank: number,
  ): void {
    this._txtSpeed.setText(`${Math.floor(speedKmh)} ${STR.HUD_SPEED}`);

    const mins = Math.floor(timeMs / 60000);
    const secs = Math.floor((timeMs % 60000) / 1000);
    const ms   = Math.floor(timeMs % 1000);
    this._txtTime.setText(
      `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`,
    );

    this._txtLap.setText(`${STR.HUD_LAP}: ${currentLap}/${totalLaps}`);
    this._txtRank.setText(`P${rank}`);
  }

  /** 顯示或隱藏全部 HUD 元素 */
  public setVisible(visible: boolean): void {
    this._elements.forEach(el => el.setVisible(visible));
  }

  /** 返回所有 HUD 元素，供 Camera.ignore() 使用 */
  public getElements(): Phaser.GameObjects.Text[] {
    return [...this._elements];
  }

  /** 場景關閉時清理 */
  public destroy(): void {
    this._elements.forEach(el => el.destroy());
  }
}
