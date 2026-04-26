// [版本] v0.1 | [日期] 2026-04-20 | [功能] 設定畫面（音量、鍵位）
import Phaser from 'phaser';
import { SCENE, ASSET, COLOR_GOLD, COLOR_WHITE } from '@/data/GameConstants';

export class SettingsScene extends Phaser.Scene {
  constructor() { super(SCENE.SETTINGS); }

  create(): void {
    this.input.on('gameobjectdown', () => { this.sound.play(ASSET.SFX_UI_CLICK, { volume: 0.8 }); });

    const { width, height } = this.scale;

    this.add.text(width / 2, 60, '設定', {
      fontSize: '36px',
      color: `#${COLOR_GOLD.toString(16).padStart(6, '0')}`,
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(width / 2, 200, 'BGM 音量：[=====----] 50%', {
      fontSize: '22px',
      color: `#${COLOR_WHITE.toString(16).padStart(6, '0')}`,
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(width / 2, height - 50, '← 返回', {
      fontSize: '22px',
      color: `#${COLOR_WHITE.toString(16).padStart(6, '0')}`,
      fontFamily: 'monospace',
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start(SCENE.MAIN_MENU));
  }
}
