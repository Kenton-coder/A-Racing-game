// [版本] v0.2 | [日期] 2026-04-19 | [功能] Phaser.Game 入口，掛載所有 Scene

import Phaser from 'phaser';
import { gameConfig } from './config';
import { BootScene }          from './scenes/BootScene';
import { MainMenuScene }      from './scenes/MainMenuScene';
import { PreRaceSetupScene }  from './scenes/PreRaceSetupScene';
import { RaceScene }          from './scenes/RaceScene';
import { ResultsScene }       from './scenes/ResultsScene';
import { LeaderboardScene }   from './scenes/LeaderboardScene';
import { SettingsScene }      from './scenes/SettingsScene';

const config: Phaser.Types.Core.GameConfig = {
  ...gameConfig,
  scene: [
    BootScene,
    MainMenuScene,
    PreRaceSetupScene,
    RaceScene,
    ResultsScene,
    LeaderboardScene,
    SettingsScene,
  ],
};

new Phaser.Game(config);
