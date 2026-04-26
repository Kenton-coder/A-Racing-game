// [版本] v0.1 | [日期] 2026-04-19 | [功能] 全域事件發送器（替代 Unity 靜態事件）

import Phaser from 'phaser';
export const EventBus = new Phaser.Events.EventEmitter();
