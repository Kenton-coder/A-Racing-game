// [版本] v0.3 | [日期] 2026-04-21 | [功能] 計圈與防作弊驗證（起跑線二次過線完圈判定）

import Phaser from 'phaser';
import { EventBus } from '../utils/EventBus';

export const EVENT_LAP_COMPLETED   = 'onLapCompleted';
export const EVENT_CHECKPOINT_HIT  = 'onCheckpointHit';
export const EVENT_WRONG_WAY       = 'onWrongWay';

export interface CheckpointZone {
  id: number;
  gameObject: Phaser.GameObjects.Zone;
}

interface VehicleProgress {
  nextCheckpoint: number;
  lapsCompleted: number;
  wrongWayCooldown: number;
  /** 第一次通過起跑線後設為 true，才開始計圈 */
  hasStarted: boolean;
}

export class CheckpointManager {
  private readonly _scene: Phaser.Scene;
  private readonly _totalLaps: number;
  private readonly _checkpoints: CheckpointZone[];
  private readonly _vehicleProgress: Map<string, VehicleProgress>;
  /** 防止同一 checkpoint 在一次通過中重複觸發 */
  private readonly _hitCooldown: Map<string, number>;

  constructor(scene: Phaser.Scene, totalLaps: number) {
    this._scene           = scene;
    this._totalLaps       = totalLaps;
    this._checkpoints     = [];
    this._vehicleProgress = new Map();
    this._hitCooldown     = new Map();
  }

  /**
   * 從路點樣條自動生成 Checkpoint Zone（純視覺，無 Arcade body）。
   * @returns Zone 陣列，供外部呼叫 setVisible(false)
   */
  public buildCheckpoints(
    splinePoints: { x: number; y: number }[],
    count: number,
    width  = 120,
    height = 40,
  ): Phaser.GameObjects.Zone[] {
    const step = Math.floor(splinePoints.length / count);

    for (let i = 0; i < count; i++) {
      const pt    = splinePoints[i * step];
      const next  = splinePoints[(i * step + step) % splinePoints.length];
      const angle = Math.atan2(next.y - pt.y, next.x - pt.x);
      const zone  = this._scene.add.zone(pt.x, pt.y, width, height)
        .setRotation(angle + Math.PI / 2);
      this._checkpoints.push({ id: i, gameObject: zone });
    }

    return this._checkpoints.map(cp => cp.gameObject);
  }

  /**
   * 登記一輛受追蹤車輛。
   */
  public registerVehicle(vehicleId: string): void {
    this._vehicleProgress.set(vehicleId, {
      nextCheckpoint:   0,
      lapsCompleted:    0,
      wrongWayCooldown: 0,
      hasStarted:       false,
    });
  }

  /**
   * 每幀呼叫：更新冷卻計時器並手動偵測各車輛與 checkpoint 的 overlap。
   * @param delta    毫秒
   * @param vehicles 所有車輛目前位置（與 registerVehicle id 對應）
   */
  public update(
    delta: number,
    vehicles?: { id: string; x: number; y: number }[],
  ): void {
    // 更新 wrong-way 與 hit 冷卻計時器
    this._vehicleProgress.forEach((p) => {
      if (p.wrongWayCooldown > 0) p.wrongWayCooldown -= delta;
    });
    this._hitCooldown.forEach((remaining, key) => {
      const next = remaining - delta;
      if (next <= 0) this._hitCooldown.delete(key);
      else           this._hitCooldown.set(key, next);
    });

    if (!vehicles) return;

    for (const v of vehicles) {
      for (const cp of this._checkpoints) {
        const key = `${v.id}_${cp.id}`;
        if (this._hitCooldown.has(key)) continue;

        const dx = v.x - cp.gameObject.x;
        const dy = v.y - cp.gameObject.y;
        const r  = cp.gameObject.width / 2;
        if (dx * dx + dy * dy < r * r) {
          this._hitCooldown.set(key, 2000); // 2秒冷卻，防止同圈重複
          this._triggerCheckpoint(v.id, cp.id);
        }
      }
    }
  }

  /** 取得車輛已完成圈數 */
  public getLapsCompleted(vehicleId: string): number {
    return this._vehicleProgress.get(vehicleId)?.lapsCompleted ?? 0;
  }

  /** 取得車輛下一個待過 checkpoint 索引 */
  public getNextCheckpoint(vehicleId: string): number {
    return this._vehicleProgress.get(vehicleId)?.nextCheckpoint ?? 0;
  }

  /** 取得總 checkpoint 數量 */
  public get checkpointCount(): number {
    return this._checkpoints.length;
  }

  private _triggerCheckpoint(vehicleId: string, hitCpId: number): void {
    const progress = this._vehicleProgress.get(vehicleId);
    if (!progress) return;

    const expected = progress.nextCheckpoint;
    const total    = this._checkpoints.length;

    if (hitCpId !== expected) {
      // 防作弊：跳過 checkpoint 或逆行
      if (progress.wrongWayCooldown <= 0) {
        progress.wrongWayCooldown = 3000;
        EventBus.emit(EVENT_WRONG_WAY, vehicleId);
      }
      return;
    }

    EventBus.emit(EVENT_CHECKPOINT_HIT, vehicleId, hitCpId);
    progress.nextCheckpoint = (expected + 1) % total;

    if (hitCpId === 0) {
      // checkpoint 0 = 起跑/終點線
      if (!progress.hasStarted) {
        progress.hasStarted = true; // 第一次過線：開始計圈，不計完成
      } else {
        // 已通過所有中間 checkpoint，再次過線 → 完成一圈
        progress.lapsCompleted++;
        EventBus.emit(EVENT_LAP_COMPLETED, vehicleId, progress.lapsCompleted);
        if (progress.lapsCompleted >= this._totalLaps) {
          EventBus.emit('onRaceFinished', vehicleId);
        }
      }
    }
  }
  /** 取得指定檢查點的位置（供外部計算距離） */
  public getCheckpointPosition(index: number): { x: number; y: number } | null {
    if (index < 0 || index >= this._checkpoints.length) return null;
    const cp = this._checkpoints[index];
    return { x: cp.gameObject.x, y: cp.gameObject.y };
  }
}
