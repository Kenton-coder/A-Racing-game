// [版本] v0.3.1 | [日期] 2026-04-26 | [功能] 規則說明頁面（滾動條，修正底行顯示）

import Phaser from 'phaser';
import { SCENE, ASSET, COLOR_GOLD, COLOR_WHITE } from '@/data/GameConstants';

export class SettingsScene extends Phaser.Scene {
  constructor() { super(SCENE.SETTINGS); }

  create(): void {
    this.input.on('gameobjectdown', () => { this.sound.play(ASSET.SFX_UI_CLICK, { volume: 0.8 }); });

    const { width, height } = this.scale;

    // 標題
    this.add.text(width / 2, 50, '規則', {
      fontSize: '36px',
      color: `#${COLOR_GOLD.toString(16).padStart(6, '0')}`,
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // ── 滾動區域設定 ──────────────────────────────────
    const boxX = 60;
    const boxY = 100;
    const boxW = width - 120;        // 文字顯示寬度
    const boxH = height - 160;       // 顯示高度，保留底部返回按鈕空間
    const scrollBarX = boxX + boxW + 10;
    const scrollBarW = 12;
    const scrollBarH = boxH;

    // 規則全文
    const rules = `🏁 遊戲規則

1. 遊戲簡介
《澳門格蘭披治賽車》是一款以真實澳門東望洋賽道（Guia Circuit）為藍本的競速遊戲。
你將駕駛不同類型的賽車，在高低起伏、充滿挑戰的街道賽道上奔馳，與 AI 對手比拼速度，爭取最快圈速與最終冠軍。

2. 操作方式
- 加速：方向鍵 ↑ 或 W
- 減速／倒車：方向鍵 ↓ 或 S 或 空白鍵
- 左轉：方向鍵 ← 或 A
- 右轉：方向鍵 → 或 D
- 暫停／繼續：Esc

3. 遊戲模式
🕒 計時賽（Time Trial）
- 獨自挑戰賽道，沒有 AI 對手。
- 目標：在指定圈數內刷出最快單圈時間。
- 適合練習路線與挑戰自我極限。

🏎️ 競速賽（Race）
- 與最多 5 名 AI 車手同場競技。
- 目標：率先完成所有圈數並衝過終點線。
- 最終排名會記錄並可上傳至線上排行榜。

4. 比賽規則
- 起跑：比賽開始前會有 3 秒倒數，倒數歸零後方可出發。
- 圈數：每場比賽需完成設定的圈數（可選擇 1／3／5／10 圈）。
- 排名判定：即時排名根據「已完成圈數 → 已通過檢查點數量 → 賽道完成進度」依序比較。
- 衝線：玩家率先完成所有圈數並衝線即為優勝，比賽會於 3 秒後自動結束並顯示結算畫面。

5. AI 對手
- AI 分為「初級」「業餘」「專業」三種難度。難度越高，AI 的操控越精準、反應越快。
- AI 車輛會盡量維持在賽道中央行駛，若偏離賽道壓上路肩，會根據難度在數秒內自動修正路線回到路中央。

6. 車輛類型
遊戲提供四種賽車模式：
- F3 方程式：高速、高抓地力。
- GT3：均衡的操控與速度。
- 房車：穩定性較高，適合初學者。
- 摩托車：靈活但抓地力較低。

7. 排行榜
- 比賽結束後可選擇「上傳成績」，成績會記錄至線上排行榜，與其他玩家比較。
- 排行榜依照車輛類別（F3／GT3／房車／摩托車）分頁顯示。

8. 注意事項
- 賽道邊的紅白路肩僅供視覺參考，車輛若完全駛出賽道撞上護欄，速度會大幅衰減。
- 比賽中可隨時按 Esc 暫停，選擇繼續、重新開始或返回主畫面。
- 建議使用實體鍵盤獲得最佳體驗。`;

    const text = this.add.text(boxX + 6, boxY + 6, rules, {
      fontSize: '15px',
      fontFamily: 'monospace',
      color: `#${COLOR_WHITE.toString(16).padStart(6, '0')}`,
      wordWrap: { width: boxW - 12 },
      lineSpacing: 4,
    });
    text.updateText(); // 強制計算文字實際高度

    // 裁切遮罩
    const maskShape = this.make.graphics({ x: 0, y: 0 });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(boxX, boxY, boxW, boxH);
    const mask = maskShape.createGeometryMask();
    text.setMask(mask);

    // 背景外框
    const frame = this.add.graphics();
    frame.lineStyle(2, COLOR_GOLD, 0.8);
    frame.strokeRect(boxX, boxY, boxW, boxH);

    // 滾動條背景
    const scrollTrack = this.add.graphics();
    scrollTrack.fillStyle(0x333333, 0.7);
    scrollTrack.fillRect(scrollBarX, boxY, scrollBarW, scrollBarH);

    // 滾動條滑塊
    const thumbH = Math.min(scrollBarH, (scrollBarH / text.height) * scrollBarH);
    const thumb = this.add.graphics();
    thumb.fillStyle(COLOR_GOLD, 0.9);
    thumb.fillRect(scrollBarX, boxY, scrollBarW, thumbH);
    thumb.setInteractive(
      new Phaser.Geom.Rectangle(scrollBarX, 0, scrollBarW, scrollBarH),
      Phaser.Geom.Rectangle.Contains
    );

    // 修正最大滾動量，確保底部文字完全可見
    const maxScrollY = Math.max(0, text.height - boxH + 12); // +12 底部安全距離

    const updateScroll = (scrollY: number) => {
      const clampedY = Phaser.Math.Clamp(scrollY, 0, maxScrollY);
      text.y = boxY + 6 - clampedY;
      const thumbY = boxY + (maxScrollY === 0 ? 0 : (clampedY / maxScrollY) * (scrollBarH - thumbH));
      thumb.clear();
      thumb.fillStyle(COLOR_GOLD, 0.9);
      thumb.fillRect(scrollBarX, thumbY, scrollBarW, thumbH);
      return clampedY;
    };

    let currentScroll = 0;
    updateScroll(0);

    // 鼠標滾輪
    this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
      currentScroll = updateScroll(currentScroll + deltaY * 0.5);
    });

    // 滑塊拖曳
    let isDragging = false;
    thumb.on('pointerdown', () => { isDragging = true; });
    this.input.on('pointerup', () => { isDragging = false; });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!isDragging) return;
      const thumbCenterY = pointer.y - thumbH / 2;
      const ratio = (thumbCenterY - boxY) / (scrollBarH - thumbH);
      currentScroll = updateScroll(ratio * maxScrollY);
    });

    // 返回按鈕
    this.add.text(width / 2, height - 30, '← 返回', {
      fontSize: '22px',
      color: `#${COLOR_WHITE.toString(16).padStart(6, '0')}`,
      fontFamily: 'monospace',
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start(SCENE.MAIN_MENU));
  }
}