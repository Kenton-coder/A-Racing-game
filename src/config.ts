// [版本] v0.1 | [日期] 2026-04-19 | [功能] Phaser.Game 全域設定

import Phaser from 'phaser';

export const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'app',
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a1a',
    physics: {
        default: 'matter',
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
        matter: { gravity: { x: 0, y: 0 }, debug: false, enableSleeping: false },
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    // scene 清單由 main.ts 注入
};
