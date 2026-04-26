// [版本] v0.3 | [日期] 2026-04-22 | [功能] 新增 GT3/Sedan/Bike 玩家貼圖 key（Issue 2）

import Phaser from 'phaser';
import { SCENE, ASSET, COLOR_GREEN, COLOR_GOLD, COLOR_WHITE } from '@/data/GameConstants';

export class BootScene extends Phaser.Scene {
    constructor() {
        super(SCENE.BOOT);
    }

    preload(): void {
        const { width, height } = this.scale;

        // ── 繪製載入進度條 UI ──
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(COLOR_GREEN, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: '載入中...',
            style: { font: '20px monospace', color: `#${COLOR_WHITE.toString(16).padStart(6, '0')}` }
        }).setOrigin(0.5, 0.5);

        const percentText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: '0%',
            style: { font: '18px monospace', color: `#${COLOR_GOLD.toString(16).padStart(6, '0')}` }
        }).setOrigin(0.5, 0.5);

        this.load.on('progress', (value: number) => {
            percentText.setText(`${Math.floor(value * 100)}%`);
            progressBar.clear();
            progressBar.fillStyle(COLOR_GOLD, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        this.load.on('loaderror', (file: Phaser.Loader.File) => {
            console.error('[Loader Error]', file.key, file.src);
        });

        // ── 載入貼圖 ──
        this.load.setPath('assets/sprites/');
        this.load.image(ASSET.CAR_PLAYER,  'car_red_F3.png');   // 保留可能其他用途
        this.load.image(ASSET.CAR_AI_1,    'car_blue_F3.png');
        this.load.image(ASSET.CAR_AI_2,    'car_yellow_F3.png');
        this.load.image(ASSET.BIKE_PLAYER, 'bike_player.png');
        this.load.image(ASSET.BIKE_AI_1,   'bike_ai_1.png');
        this.load.image(ASSET.TRACK_BG,    'track_bg.png');
        this.load.image(ASSET.UI_PANEL,    'ui_panel.png');

        // ── F3 顏色變體（車頭向下）────────────────────────────────────
        const f3Colors = ['black','blue','green','grey','lightgray','orange','red','whitegray','white','yellow'];
        for (const c of f3Colors) {
            // 將內部存放的顏色名轉換為實際檔名（處理空格）
            let fileNameColor = c;
            if (c === 'lightgray') fileNameColor = 'light gray';
            else if (c === 'whitegray') fileNameColor = 'white and gray';
            this.load.image(`f3_${c}`, `vehicles/f3/car_${fileNameColor}_F3.png`);
        }

        // ── GT3 顏色變體（車頭向上）────────────────────────────────────
        const gt3Colors = ['black','blue','green','red','yellow'];
        for (const c of gt3Colors) {
            this.load.image(`gt3_${c}`, `vehicles/car_gt3/car_${c}.png`);
        }

        // ── Sedan 顏色變體（車頭向上）──────────────────────────────────
        for (const c of gt3Colors) { // 同五色
            this.load.image(`sedan_${c}`, `vehicles/car_sedan/car_${c}.png`);
        }

        // ── Bike（motorcycles）顏色變體（車頭向上）──────────────────────
        for (const c of gt3Colors) {
            this.load.image(`bike_${c}`, `vehicles/motorcycles/motorcycle_${c}.png`);
        }

        // 玩家貼圖：以 vehicleId 為 key，供 RaceScene 動態查找
        this.load.image('f3_red_01', 'car_red_F3.png');
        this.load.image('gt3_01',    'car_gt3.png');
        this.load.image('sedan_01',  'car_sedan.png');
        this.load.image('bike_01',   'bike_player.png');

        // ── 載入音效 ──
        this.load.setPath('assets/audio/');
        this.load.audio(ASSET.SFX_UI_CLICK,   'sfx_ui_click.mp3');
        this.load.audio(ASSET.SFX_FINISH,     'The match ended.mp3');
        this.load.audio(ASSET.SFX_COUNTDOWN,  'make_more_sound-321-go-8-bit-video-game-sound-version-1-145007.mp3');
        /*
        this.load.audio(ASSET.BGM_MENU,       'bgm_menu.mp3');
        this.load.audio(ASSET.BGM_RACE,       'bgm_race.mp3');
        this.load.audio(ASSET.SFX_ENGINE,     'sfx_engine.mp3');
        this.load.audio(ASSET.SFX_CHECKPOINT, 'sfx_checkpoint.mp3');
        this.load.audio(ASSET.SFX_BUTTON,     'sfx_button.mp3');
        */

        // ── 載入 JSON ──
        this.load.setPath('assets/data/');
        this.load.json(ASSET.VEHICLE_CONFIGS,   'vehicle_configs.json');
        this.load.json(ASSET.LEADERBOARD_CACHE, 'leaderboard_cache.json');
    }

    create(): void {
        this.scene.start(SCENE.MAIN_MENU);
    }
}
