// [版本] v0.2 | [日期] 2026-04-19 | [功能] 車輛物理參數介面與資料載入器

import { RacingMode, VehicleType } from '@/data/GameConstants';

/**
 * 碰撞體尺寸定義
 */
export interface HitboxConfig {
    width: number;
    height: number;
}

/**
 * 核心車輛配置介面（對應 Unity 中的 ScriptableObject 資料）
 * 用於定義 Phaser Arcade Physics 的運動參數
 */
export interface VehicleConfig {
    /** 車輛唯一識別碼 (例: 'f3_red_01') */
    id: string;

    /** 車輛類型（CAR / BIKE） */
    type: VehicleType;

    /** 車輛適用的賽事模式（可多選） */
    modes: RacingMode[];

    /** 車輛顯示名稱 (繁體中文) */
    displayName: string;

    /** 車體質量 (Mass)，影響碰撞動量反彈 */
    mass: number;

    /** 最高速度 (Max Speed)，單位：km/h */
    maxSpeed: number;

    /** 加速度 (Acceleration)，數值越大起步越快 */
    acceleration: number;

    /** 制動力 (Braking Power)，煞車減速倍率 */
    braking: number;

    /** 操控性 / 轉向角速度 (Handling)，每秒旋轉角度 */
    handling: number;

    /**
     * 橫向抓地力 (Grip Factor)，範圍 0.0 ~ 1.0。
     * 數值越低在高速過彎時越容易漂移。
     */
    grip: number;

    /** 碰撞體大小（像素），決定 Arcade Physics Body 尺寸 */
    hitbox: HitboxConfig;

    /** Phaser 紋理緩存鍵值 */
    textureKey: string;

    /** 相對於 public/ 的素材路徑，供 BootScene 載入 */
    spritePath: string;

    /** 是否垂直翻轉（F3 素材上尾下頭需設 true） */
    flipY?: boolean;
}

/**
 * 車輛設定載入與管理靜態類別
 * 負責從 JSON 檔案讀取並提供緩存查詢
 */
export class VehicleConfigManager {
    private static _configs: Map<string, VehicleConfig> = new Map();

    /**
     * 從 JSON 陣列載入所有車輛配置
     * 通常在 BootScene 或 Preload 階段呼叫
     * @param jsonData 從 vehicle_configs.json 解析出來的陣列
     */
    public static loadConfigs(jsonData: VehicleConfig[]): void {
        this._configs.clear();
        for (const config of jsonData) {
            this._configs.set(config.id, config);
        }
        console.log(`[VehicleConfigManager] 已載入 ${this._configs.size} 輛車的配置資料。`);
    }

    /**
     * 透過 ID 取得指定的車輛配置
     * @param id 車輛唯一識別碼
     * @returns 車輛配置物件，若找不到則回傳 undefined
     */
    public static getConfig(id: string): VehicleConfig | undefined {
        return this._configs.get(id);
    }

    /**
     * 取得指定賽事模式下的所有車輛配置
     * @param mode 賽車模式
     * @returns 符合該模式的車輛配置陣列
     */
    public static getConfigsByMode(mode: RacingMode): VehicleConfig[] {
        const results: VehicleConfig[] = [];
        for (const config of this._configs.values()) {
            if (config.modes.includes(mode)) {
                results.push(config);
            }
        }
        return results;
    }
}
