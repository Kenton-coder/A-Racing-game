// [版本] v0.7 | [日期] 2026-04-23 | [功能] 改用指數衰減煞車（任何速度均流暢）；新增倒車邏輯

import Phaser from 'phaser';
import { VehicleConfig } from '@/data/VehicleConfig';
import { PHYSICS } from '@/data/GameConstants';

/**
 * 標準化輸入值（玩家與 AI 共用）
 */
export interface DriveInput {
  /** 油門量 0..1 */
  throttle: number;
  /** 轉向量 -1(左)..1(右) */
  steering: number;
  /** 煞車量 0..1 */
  brake: number;
}

/**
 * 頂視角賽車物理控制器（Phaser Matter.js）
 *
 * 轉向：每幀設定角速度，Matter 負責旋轉積分。
 * 抓地：每幀將橫向速度乘以 (1-grip)，消除側滑。
 * 推進：在分解速度基礎上加減速，再還原至世界座標。
 */
export class VehiclePhysics {
  private readonly _sprite: Phaser.Physics.Matter.Sprite;
  private readonly _config: VehicleConfig;

  private readonly _maxSpeedPx: number;
  private readonly _accelPxS2: number;
  private readonly _brakeDecay: number;
  private readonly _naturalDecelPxS2: number;
  private readonly _handlingRadS: number;
  private readonly _maxReversePx: number;
  private readonly _reverseAccelPxS2: number;
  private readonly _minForwardPx: number;

  constructor(sprite: Phaser.Physics.Matter.Sprite, config: VehicleConfig) {
    this._sprite            = sprite;
    this._config            = config;
    const ppm               = PHYSICS.PIXELS_PER_METER;
    this._maxSpeedPx        = config.maxSpeed     * ppm / 3.6;   // km/h → px/s
    this._accelPxS2         = config.acceleration * ppm;          // m/s² → px/s²
    // 煞車衰減基數：pow(_brakeDecay, dt) 指數衰減，任何速度均不瞬間歸零
    // config.braking 必須在 0~1；clamp 防止設定錯誤時產生 NaN（如 braking: 20 → -19）
    this._brakeDecay        = Math.max(0.001, 1 - Math.min(config.braking, 0.999));
    this._naturalDecelPxS2  = config.acceleration * 0.15 * ppm;  // 鬆油自然減速 = 加速度 15%
    this._handlingRadS      = Phaser.Math.DegToRad(config.handling);
    // 倒車：最高 10 km/h，1.5 秒達到最大倒車速度
    const MAX_REVERSE_KMH   = 10;
    this._maxReversePx      = MAX_REVERSE_KMH * ppm / 3.6;
    this._reverseAccelPxS2  = this._maxReversePx / 1.5;
    // 低速閾值（1 km/h）：低於此值視為停止，允許直接進入倒車
    this._minForwardPx      = 1 * ppm / 3.6;

    sprite.setMass(config.mass);
    // 所有摩擦與反彈均設為 0，由程式碼統一管理，消除撞牆抖動
    sprite.setFriction(0, 0, 0);
    sprite.setBounce(0);
  }

  /**
   * 每幀呼叫：角速度轉向 → 橫向抓地 → 推進/制動 → setVelocity。
   * @param deltaMs Phaser update delta（毫秒）
   * @param input   當前幀的標準化輸入
   */
  public update(deltaMs: number, input: DriveInput): void {
    const dt   = deltaMs / 1000;
    const grip = this._config.grip;

    if (!this._sprite.body) return;
    const vel = this._sprite.body.velocity as { x: number; y: number };

    // 無輸入且速度極小：強制歸零並跳出，阻斷 Matter.js 微衝量振盪循環
    if (input.throttle === 0 && input.brake === 0 && input.steering === 0) {
      if (vel.x * vel.x + vel.y * vel.y < 0.1) {
        this._sprite.setVelocity(0, 0);
        this._sprite.setAngularVelocity(0);
        return;
      }
    }

    // ─── 1. 轉向：設定角速度（Matter 在下一步執行旋轉）────────────────────
    // 5 km/h 以上達到全力轉向；靜止時無法原地旋轉
    const speedKmh   = this.getCurrentSpeedKmh();
    const turnFactor = Phaser.Math.Clamp(speedKmh / 5, 0.2, 1);
    const angularVel = input.steering * this._handlingRadS * turnFactor * dt;
    this._sprite.setAngularVelocity(angularVel);

    // ─── 2. 速度分解（車頭向下素材：facing = rotation + PI/2）──────────────
    const facing = this._sprite.rotation + Math.PI / 2;
    const cosFwd = Math.cos(facing),  sinFwd = Math.sin(facing);
    const cosRt  = -sinFwd,           sinRt  =  cosFwd;  // 車體右側垂直向量

    // Matter.js body.velocity 單位為 px/frame；轉換至 px/s 統一計算
    let fwdSpd = (vel.x * cosFwd + vel.y * sinFwd) * 60;
    let latSpd = (vel.x * cosRt  + vel.y * sinRt)  * 60;

    // ─── 3. 橫向抓地力（消除側滑）──────────────────────────────────────────
    // grip=0.9：每幀橫向速度剩 10%，高抓地力；幀率無關版本
    latSpd *= Math.pow(1 - grip, dt * 60);

    // ─── 4. 推進力 / 制動 / 自然減速（全部 px/s）────────────────────────────
    if (input.throttle > 0) {
      fwdSpd += this._accelPxS2 * input.throttle * dt;
      fwdSpd  = Math.min(fwdSpd, this._maxSpeedPx);
    } else if (input.brake === 0) {
      // 鬆油不踩煞：前進/倒車均自然減速回零
      if (fwdSpd > 0) {
        fwdSpd = Math.max(0, fwdSpd - this._naturalDecelPxS2 * dt);
      } else if (fwdSpd < 0) {
        fwdSpd = Math.min(0, fwdSpd + this._naturalDecelPxS2 * dt);
      }
    }
    if (input.brake > 0) {
      if (fwdSpd > this._minForwardPx) {
        // 前進中煞車：指數衰減確保低速不瞬間歸零（解決問題 1）
        fwdSpd *= Math.pow(this._brakeDecay, dt);
        if (fwdSpd <= this._minForwardPx) fwdSpd = 0;
      } else {
        // 車速趨近零或已停止：緩慢倒車，最高 10 km/h（解決問題 2）
        fwdSpd -= this._reverseAccelPxS2 * input.brake * dt;
        fwdSpd  = Math.max(-this._maxReversePx, fwdSpd);
      }
    }

    // ─── 5. 還原至世界座標（轉回 px/frame 後呼叫 setVelocity）───────────────
    const newFacing = (this._sprite.rotation + angularVel) + Math.PI / 2;
    const nCosFwd   = Math.cos(newFacing), nSinFwd = Math.sin(newFacing);
    const nCosRt    = -nSinFwd,            nSinRt  =  nCosFwd;

    this._sprite.setVelocity(
      (nCosFwd * fwdSpd + nCosRt * latSpd) / 60,
      (nSinFwd * fwdSpd + nSinRt * latSpd) / 60,
    );
  }

  /**
   * 當前車速（km/h），供 HUD 顯示。
   */
  public getCurrentSpeedKmh(): number {
    if (!this._sprite.body) return 0;
    const v = this._sprite.body.velocity as { x: number; y: number };
    // Matter.js velocity is px/frame; multiply by 60 to get px/sec
    const speedPxPerSec = Math.sqrt(v.x * v.x + v.y * v.y) * 60;
    return (speedPxPerSec * 3.6) / PHYSICS.PIXELS_PER_METER;
  }

    /**
   * 返回當前速度（px/s），供 AI 前瞻距離計算使用。
   */
  public getCurrentSpeedPx(): number {
    if (!this._sprite.body) return 0;
    const v = this._sprite.body.velocity as { x: number; y: number };
    return Math.sqrt(v.x * v.x + v.y * v.y) * 60; // Matter 速度是 px/frame，轉換為 px/s
  }

  /**
   * 當前速度佔最大速度的比例 0..1。
   */
  public getSpeedNormalized(): number {
    if (!this._sprite.body) return 0;
    const v = this._sprite.body.velocity as { x: number; y: number };
    const speedPxPerSec = Math.sqrt(v.x * v.x + v.y * v.y) * 60;
    return Phaser.Math.Clamp(speedPxPerSec / this._maxSpeedPx, 0, 1);
  }

  /**
   * 設定車輛初始旋轉角（弧度）。
   */
  public setRotation(rad: number): void {
    this._sprite.setRotation(rad);
  }

  /**
   * 重置所有速度狀態（用於比賽重置）。
   */
  public reset(): void {
    this._sprite.setVelocity(0, 0);
    this._sprite.setAngularVelocity(0);
  }
}
