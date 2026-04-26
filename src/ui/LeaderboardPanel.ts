// [版本] v0.1 | [日期] 2026-04-19 | [功能] 排行榜面板

import Phaser from 'phaser';
import { STR, COLOR_WHITE, COLOR_DARK, COLOR_GOLD, COLOR_RED } from '@/data/GameConstants';

export class LeaderboardPanel extends Phaser.GameObjects.Container {
    constructor(scene: Phaser.Scene, onClose: () => void) {
        super(scene, 0, 0);
        this.scene.add.existing(this);
        this.setScrollFactor(0);
        this.setDepth(200);

        const { width, height } = this.scene.scale;

        // 遮罩與背景
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x000000, 0.7);
        bg.fillRect(0, 0, width, height);
        bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

        const panel = this.scene.add.graphics();
        panel.fillStyle(COLOR_DARK, 1);
        panel.fillRoundedRect(width / 2 - 400, height / 2 - 250, 800, 500, 16);

        // 標題與關閉按鈕
        const title = this.scene.add.text(width / 2, height / 2 - 200, STR.LB_TITLE, {
            fontSize: '36px', color: `#${COLOR_GOLD.toString(16).padStart(6, '0')}`, fontStyle: 'bold'
        }).setOrigin(0.5);

        const btnClose = this.scene.add.text(width / 2 + 350, height / 2 - 220, 'X', {
            fontSize: '32px', color: `#${COLOR_RED.toString(16).padStart(6, '0')}`, fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        btnClose.on('pointerdown', onClose);

        // 表頭
        const header = this.scene.add.text(width / 2 - 320, height / 2 - 130, `#   ${STR.LB_PLAYER.padEnd(15, ' ')} ${STR.LB_TIME.padEnd(15, ' ')} ${STR.LB_DATE}`, {
            fontSize: '24px', fontFamily: 'monospace', color: `#${COLOR_WHITE.toString(16).padStart(6, '0')}`
        });

        // 模擬資料列表 (實際應接 API 或 Cache)
        const loadingText = this.scene.add.text(width / 2, height / 2, STR.LB_LOADING || '載入中...', {
            fontSize: '24px', color: '#888'
        }).setOrigin(0.5);

        this.add([bg, panel, title, btnClose, header, loadingText]);
        this.setVisible(false);
    }
}
