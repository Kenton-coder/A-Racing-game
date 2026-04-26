// [版本] v0.2 | [日期] 2026-04-19 | [功能] 暫停選單

import Phaser from 'phaser';
import { STR, SCENE, COLOR_WHITE, COLOR_GREEN, COLOR_DARK, COLOR_GOLD } from '@/data/GameConstants';

type VisibleGameObject = Phaser.GameObjects.Graphics | Phaser.GameObjects.Text;

/** 不使用 Container，每個元素單獨 setScrollFactor(0)，確保鏡頭縮放時按鍵可正常點擊 */
export class PauseMenu {
  private _elements: VisibleGameObject[] = [];

  constructor(scene: Phaser.Scene, onResume: () => void) {
    const { width, height } = scene.scale;

    // 半透明遮罩（不設 interactive，讓按鍵穿透接收點擊）
    const bg = scene.add.graphics()
      .fillStyle(COLOR_DARK, 0.8)
      .fillRect(0, 0, width, height)
      .setScrollFactor(0)
      .setDepth(290);

    // 標題
    const title = scene.add.text(width / 2, height / 2 - 120, STR.PAUSE_TITLE, {
      fontSize: '48px',
      color: `#${COLOR_GOLD.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300);

    const makeBtn = (y: number, label: string, cb: () => void): Phaser.GameObjects.Text =>
      scene.add.text(width / 2, y, label, {
        fontSize: '28px',
        backgroundColor: `#${COLOR_GREEN.toString(16).padStart(6, '0')}`,
        color: `#${COLOR_WHITE.toString(16).padStart(6, '0')}`,
        padding: { x: 24, y: 12 },
      })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(300)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', function (this: Phaser.GameObjects.Text) {
          this.setColor(`#${COLOR_GOLD.toString(16).padStart(6, '0')}`);
        })
        .on('pointerout', function (this: Phaser.GameObjects.Text) {
          this.setColor(`#${COLOR_WHITE.toString(16).padStart(6, '0')}`);
        })
        .on('pointerdown', cb);

    const btnResume  = makeBtn(height / 2 - 20,  STR.PAUSE_RESUME,    onResume);
    const btnRestart = makeBtn(height / 2 + 70,   STR.PAUSE_RESTART,   () => scene.scene.restart());
    const btnMenu    = makeBtn(height / 2 + 160,  STR.PAUSE_MAIN_MENU, () => scene.scene.start(SCENE.MAIN_MENU));

    this._elements = [bg, title, btnResume, btnRestart, btnMenu];
    // 初始隱藏
    this._elements.forEach(el => el.setVisible(false));

    // ─── 解決縮放與位移造成的排版崩壞 ────────────────────────────────
    // 1. 建立專屬 UI 攝影機，不追蹤車輛、不縮放
    const uiCamera = scene.cameras.add(0, 0, width, height).setName('PauseUICamera');

    this._elements.forEach(el => {
      // 2. 主攝影機忽略暫停選單元素
      scene.cameras.main.ignore(el);
      el.setScrollFactor(0);
    });

    // 3. UI 攝影機只看暫停介面，忽略世界中既有物件
    scene.children.list.forEach(child => {
      if (!this._elements.includes(child as VisibleGameObject)) {
        uiCamera.ignore(child);
      }
    });

    // 4. 後續動態生成的物件（輪胎印、特效等）也不污染 UI 攝影機
    scene.events.on('addedtoscene', (gameObject: Phaser.GameObjects.GameObject) => {
      if (!this._elements.includes(gameObject as VisibleGameObject)) {
        uiCamera.ignore(gameObject);
      }
    });
  }

  /** 顯示暫停面板 */
  public show(): void {
    this._elements.forEach(el => el.setVisible(true));
  }

  /** 隱藏暫停面板 */
  public hide(): void {
    this._elements.forEach(el => el.setVisible(false));
  }

  /** 場景關閉時清理 */
  public destroy(): void {
    this._elements.forEach(el => el.destroy());
  }
}
