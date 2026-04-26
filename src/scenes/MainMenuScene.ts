// [版本] v0.1 | [日期] 2026-04-19 | [功能] 遊戲主畫面，包含標題與選單導覽

import Phaser from 'phaser';
import { SCENE, ASSET, STR, COLOR_GREEN, COLOR_WHITE, COLOR_GOLD } from '@/data/GameConstants';

export class MainMenuScene extends Phaser.Scene {

    constructor() {
        super(SCENE.MAIN_MENU);
    }

    create(): void {
        this.input.on('gameobjectdown', () => { this.sound.play(ASSET.SFX_UI_CLICK, { volume: 0.8 }); });

        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor('#1a1a1a');

        // 播放主畫面 BGM（暫時註解，待 .mp3 檔案就緒後取消）
        /*
        if (!this.sound.get(ASSET.BGM_MENU)) {
            this._bgm = this.sound.add(ASSET.BGM_MENU, { loop: true, volume: 0.5 });
            this._bgm.play();
        }
        */

        // 遊戲標題
        this.add.text(width / 2, height / 3, STR.MENU_TITLE, {
            fontSize: '48px',
            fontFamily: 'sans-serif',
            color: `#${COLOR_GOLD.toString(16).padStart(6, '0')}`,
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // 選單按鈕
        this._createButton(width / 2, height / 2 + 20,  STR.MENU_START,       () => this.scene.start(SCENE.PRE_RACE_SETUP));
        this._createButton(width / 2, height / 2 + 100, STR.MENU_LEADERBOARD, () => this.scene.start(SCENE.LEADERBOARD));
        this._createButton(width / 2, height / 2 + 180, STR.MENU_SETTINGS,    () => this.scene.start(SCENE.SETTINGS));
    }

    /** 建立互動文字按鈕，含 hover 色彩變化 */
    private _createButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
        const btn = this.add.text(x, y, label, {
            fontSize: '28px',
            fontFamily: 'sans-serif',
            color: `#${COLOR_WHITE.toString(16).padStart(6, '0')}`,
            backgroundColor: `#${COLOR_GREEN.toString(16).padStart(6, '0')}`,
            padding: { x: 20, y: 10 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setStyle({ color: `#${COLOR_GOLD.toString(16).padStart(6, '0')}` }));
        btn.on('pointerout',  () => btn.setStyle({ color: `#${COLOR_WHITE.toString(16).padStart(6, '0')}` }));
        btn.on('pointerdown', () => {
            // this.sound.play(ASSET.SFX_BUTTON); // 暫時註解，待 .mp3 就緒後取消
            onClick();
        });

        return btn;
    }
}
