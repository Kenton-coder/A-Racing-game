// [版本] v0.3 | [日期] 2026-04-26 | [功能] 集成 Vercel Analytics 与 Speed Insights

import Phaser from 'phaser';
import { gameConfig } from './config';
import { BootScene }          from './scenes/BootScene';
import { MainMenuScene }      from './scenes/MainMenuScene';
import { PreRaceSetupScene }  from './scenes/PreRaceSetupScene';
import { RaceScene }          from './scenes/RaceScene';
import { ResultsScene }       from './scenes/ResultsScene';
import { LeaderboardScene }   from './scenes/LeaderboardScene';
import { SettingsScene }      from './scenes/SettingsScene';
import { inject as injectAnalytics } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

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

// 啟用 Vercel Analytics 與 Speed Insights（僅在生產環境生效）
injectAnalytics();
injectSpeedInsights();