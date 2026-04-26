// [版本] v0.1 | [日期] 2026-04-19 | [功能] 結算畫面元件

import Phaser from 'phaser';
import { STR, SCENE, COLOR_GREEN, COLOR_GOLD, COLOR_DARK } from '@/data/GameConstants';

export class ResultsPanel extends Phaser.GameObjects.Container {
    constructor(scene: Phaser.Scene, rank: number, totalTimeMs: number, bestLapMs: number) {
        super(scene, 0, 0);
        this.scene.add.existing(this);
        this.setScrollFactor(0);
        this.setDepth(400);

        const { width, height } = this.scene.scale;

        const bg = this.scene.add.graphics();
        bg.fillStyle(COLOR_DARK, 0.95);
        bg.fillRect(0, 0, width, height);

        const title = this.scene.add.text(width / 2, 100, STR.RESULTS_TITLE, {
            fontSize: '64px', color: `#${COLOR_GOLD.toString(16).padStart(6, '0')}`, fontStyle: 'bold'
        }).setOrigin(0.5);

        const formatTime = (ms: number) => {
            const m = Math.floor(ms / 60000);
            const s = Math.floor((ms % 60000) / 1000);
            const msRem = Math.floor(ms % 1000);
            return `${m}:${s.toString().padStart(2, '0')}.${msRem.toString().padStart(3, '0')}`;
        };

        const txtRank = this.scene.add.text(width / 2, 250, `${STR.RESULTS_RANK}: P${rank}`, { fontSize: '42px', color: '#FFF' }).setOrigin(0.5);
        const txtTotal = this.scene.add.text(width / 2, 330, `${STR.RESULTS_TOTAL}: ${formatTime(totalTimeMs)}`, { fontSize: '32px', color: '#FFF' }).setOrigin(0.5);
        const txtBest = this.scene.add.text(width / 2, 400, `${STR.RESULTS_BEST_LAP}: ${formatTime(bestLapMs)}`, { fontSize: '32px', color: '#FFF' }).setOrigin(0.5);

        const btnMenu = this.scene.add.text(width / 2, height - 150, STR.RESULTS_MENU, {
            fontSize: '32px', backgroundColor: `#${COLOR_GREEN.toString(16).padStart(6, '0')}`, padding: { x: 30, y: 15 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnMenu.on('pointerdown', () => this.scene.scene.start(SCENE.MAIN_MENU));

        this.add([bg, title, txtRank, txtTotal, txtBest, btnMenu]);
    }
}
