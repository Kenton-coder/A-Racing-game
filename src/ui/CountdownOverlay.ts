// [版本] v0.1 | [日期] 2026-04-19 | [功能] 賽前倒數計時遮罩

import Phaser from 'phaser';
import { STR, COLOR_GOLD, COLOR_GREEN } from '@/data/GameConstants';

export class CountdownOverlay extends Phaser.GameObjects.Container {
    private _bg!: Phaser.GameObjects.Graphics;
    private _txtCount!: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0);
        this.scene.add.existing(this);
        this.setScrollFactor(0);
        this.setDepth(200);

        const { width, height } = this.scene.scale;

        // 黑色半透明背景 (Alpha 60%)
        this._bg = this.scene.add.graphics();
        this._bg.fillStyle(0x000000, 0.6);
        this._bg.fillRect(0, 0, width, height);

        // 倒數文字
        this._txtCount = this.scene.add.text(width / 2, height / 2, '', {
            fontFamily: 'sans-serif', fontSize: '150px', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 10
        }).setOrigin(0.5);

        this.add([this._bg, this._txtCount]);
        this.setVisible(false);
    }

    /** 顯示倒數數字（tick > 0）或 GO!（tick === 0） */
    public showTick(tick: number): void {
        this.setVisible(true);
        if (tick > 0) {
            this._txtCount.setText(tick.toString());
            this._txtCount.setColor(`#${COLOR_GOLD.toString(16).padStart(6, '0')}`);
        } else {
            this._txtCount.setText(STR.COUNTDOWN_GO);
            this._txtCount.setColor(`#${COLOR_GREEN.toString(16).padStart(6, '0')}`);
        }

        // 簡單的縮放彈性動畫
        this.scene.tweens.add({
            targets: this._txtCount,
            scaleX: { from: 0.5, to: 1 },
            scaleY: { from: 0.5, to: 1 },
            ease: 'Back.easeOut',
            duration: 300
        });
    }

    /** 隱藏倒數遮罩 */
    public hide(): void {
        this.setVisible(false);
    }
}
