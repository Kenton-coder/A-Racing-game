// [版本] v0.1 | [日期] 2026-04-19 | [功能] AI 路點追蹤代理（Easy / Normal / Hard）

import Phaser from 'phaser';
import { DriveInput } from '@/vehicle/VehiclePhysics';

// ── AI 難度設定 ───────────────────────────────────────────────────────────────

export enum AIDifficulty {
  EASY   = 'EASY',
  NORMAL = 'NORMAL',
  HARD   = 'HARD',
}

interface AIProfile {
  /** 佔最大速度的比例上限 */
  speedFactor: number;
  /** 追蹤的前瞻距離（像素），速度越高實際前瞻距離越高 */
  lookAheadBase: number;
  /** 轉向隨機噪音幅度（0 = 完美，0.3 = 明顯擺動） */
  steerNoise: number;
  /** 彎道煞車觸發角度閾值（弧度，越小越提早煞車） */
  brakeAngleThreshold: number;
  /** 煞車力道倍率 */
  brakeFactor: number;
  /** 判斷到達路點的距離（像素） */
  reachRadius: number;
}

const AI_PROFILE: Record<AIDifficulty, AIProfile> = {
  [AIDifficulty.EASY]: {
    speedFactor:          0.70,
    lookAheadBase:        180,
    steerNoise:           0.12,
    brakeAngleThreshold:  0.50,
    brakeFactor:          0.70,
    reachRadius:          55,
  },
  [AIDifficulty.NORMAL]: {
    speedFactor:          0.85,
    lookAheadBase:        220,
    steerNoise:           0.04,
    brakeAngleThreshold:  0.42,
    brakeFactor:          0.90,
    reachRadius:          50,
  },
  [AIDifficulty.HARD]: {
    speedFactor:          0.97,
    lookAheadBase:        260,  
    steerNoise:           0.01,
    brakeAngleThreshold:  0.36,
    brakeFactor:          1.00,
    reachRadius:          45,
  },
} as const;

/** 路點座標（像素，已乘以 PIXELS_PER_METER） */
export interface Waypoint {
  x: number;
  y: number;
}

// ── AIWaypointAgent ──────────────────────────────────────────────────────────

/**
 * 單一 AI 車輛的路點追蹤代理。
 *
 * 使用方式：
 * 1. 在 RaceScene.create() 為每輛 AI 車建立實例。
 * 2. 每幀呼叫 getInput(sprite) 取得 DriveInput，再傳入 VehiclePhysics.update()。
 *
 * 注意：waypoints 必須為像素座標（已由 GuiaCircuitData 公尺值乘上 PIXELS_PER_METER）。
 */
export class AIWaypointAgent {
  private readonly _profile: AIProfile;
  private readonly _waypoints: Waypoint[];
  private readonly _totalWaypoints: number;

  /** 當前追蹤的基準路點索引 */
  private _targetIdx: number = 0;

  /** 圈數計數 */
  private _lapCount: number = 0;

  private readonly _difficulty: AIDifficulty;
  private _wallHitTimer: number = 0;
  private _wasOutsideLastFrame: boolean = false;
  
  /** 是否需要強制重置 */
  private _needsRespawn: boolean = false;
  /** 重置時的目標位置與角度 */
  private _respawnX: number = 0;
  private _respawnY: number = 0;
  private _respawnAngle: number = 0;
  private static readonly RESPAWN_TIMEOUT = 3.0; // 超過 3 秒卡住就瞬移

  /** 低速自救計時器（秒） */
  private _stuckTimer: number = 0;
  private static readonly STUCK_SPEED_THRESHOLD = 30;   // px/s，低於此視為卡住
  private static readonly STUCK_TIMEOUT = 1.5;          // 超過 1.5 秒觸發自救

  constructor(
    waypoints: Waypoint[],
    difficulty: AIDifficulty,
    startWaypointOffset: number = 0,
    initialPosition?: { x: number; y: number }   // ← 新增參數
  ) {
    this._profile         = AI_PROFILE[difficulty];
    this._waypoints       = waypoints;
    this._totalWaypoints  = waypoints.length;

    if (initialPosition) {
      // 自動尋找距離車輛最近的路點作為起始追蹤目標
      let minDistSq = Infinity;
      let nearestIdx = 0;
      for (let i = 0; i < this._totalWaypoints; i++) {
        const wp = this._waypoints[i];
        const dx = wp.x - initialPosition.x;
        const dy = wp.y - initialPosition.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < minDistSq) {
          minDistSq = distSq;
          nearestIdx = i;
        }
      }
      this._targetIdx = nearestIdx;
    } else {
      this._targetIdx = startWaypointOffset % this._totalWaypoints;
    }
    this._difficulty = difficulty;
  }

  /**
   * 計算本幀的 AI 輸入。
   * @param sprite 該 AI 車輛的 Sprite（提供位置與旋轉）
   * @param currentSpeedPx 當前車速（px/s），用於動態前瞻距離
   */
  public getInput(
    sprite: { x: number; y: number; rotation: number },
    currentSpeedPx?: number
  ): DriveInput {
    if (this._totalWaypoints === 0) {
      return { throttle: 0, steering: 0, brake: 0 };
    }

    const pos = new Phaser.Math.Vector2(sprite.x, sprite.y);
    const speedPx = currentSpeedPx ?? 0;

    // ── 低速自救 / 強制重置 ──
    if (speedPx < AIWaypointAgent.STUCK_SPEED_THRESHOLD) {
      this._stuckTimer += 1 / 60;
    } else {
      this._stuckTimer = 0;
    }

    if (this._stuckTimer > AIWaypointAgent.RESPAWN_TIMEOUT) {
      // 計算當前路段投影中心，作為重置目標
      const wpCurr = this._waypoints[this._targetIdx];
      const wpNext = this._waypoints[(this._targetIdx + 1) % this._totalWaypoints];
      const segDx = wpNext.x - wpCurr.x;
      const segDy = wpNext.y - wpCurr.y;
      const segLen = Math.sqrt(segDx * segDx + segDy * segDy);
      if (segLen > 0.001) {
        const toVehX = pos.x - wpCurr.x;
        const toVehY = pos.y - wpCurr.y;
        let t = (toVehX * segDx + toVehY * segDy) / (segLen * segLen);
        t = Phaser.Math.Clamp(t, 0, 1);
        this._respawnX = wpCurr.x + segDx * t;
        this._respawnY = wpCurr.y + segDy * t;
        this._respawnAngle = Math.atan2(segDy, segDx) - Math.PI / 2;
      } else {
        this._respawnX = wpCurr.x;
        this._respawnY = wpCurr.y;
        this._respawnAngle = sprite.rotation;
      }
      this._needsRespawn = true;
      this._stuckTimer = 0;
    }

    if (this._stuckTimer > AIWaypointAgent.STUCK_TIMEOUT) {
      let bestDistSq = Infinity;
      let bestIdx = this._targetIdx;
      const fwdX = Math.cos(sprite.rotation + Math.PI / 2);
      const fwdY = Math.sin(sprite.rotation + Math.PI / 2);
      for (let i = 0; i < this._totalWaypoints; i++) {
        const wp = this._waypoints[i];
        const dx = wp.x - pos.x;
        const dy = wp.y - pos.y;
        if (dx * fwdX + dy * fwdY <= 0) continue;
        const distSq = dx * dx + dy * dy;
        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          bestIdx = i;
        }
      }
      this._targetIdx = bestIdx;
      this._stuckTimer = 0;
    }

    this._advanceTarget(pos);

    // ── 防呆：不追趕後方路點 ──
    const fwdX2 = Math.cos(sprite.rotation + Math.PI / 2);
    const fwdY2 = Math.sin(sprite.rotation + Math.PI / 2);
    for (let i = 0; i < 10; i++) {
      const wp = this._waypoints[this._targetIdx];
      const toX = wp.x - pos.x;
      const toY = wp.y - pos.y;
      if (toX * fwdX2 + toY * fwdY2 > 0) break;
      this._targetIdx = (this._targetIdx + 1) % this._totalWaypoints;
    }

    const lookDist = this._profile.lookAheadBase + speedPx * 0.5;
    const target = this._getLookAheadPoint(this._targetIdx, pos, lookDist);

    const desiredAngle = Math.atan2(target.y - pos.y, target.x - pos.x) - Math.PI / 2;
    let angleDiff = Phaser.Math.Angle.Wrap(desiredAngle - sprite.rotation);

    if (this._profile.steerNoise > 0) {
      angleDiff += (Math.random() * 2 - 1) * this._profile.steerNoise;
    }

    // ── 計算當前路段投影，用於中心線吸引與路肩檢測 ──
    const wpCurr = this._waypoints[this._targetIdx];
    const wpNext = this._waypoints[(this._targetIdx + 1) % this._totalWaypoints];
    const segDx = wpNext.x - wpCurr.x;
    const segDy = wpNext.y - wpCurr.y;
    const segLen = Math.sqrt(segDx * segDx + segDy * segDy);
    let projX = pos.x;
    let projY = pos.y;
    let distToCenter = 0;

    if (segLen > 0.001) {
      const toVehX = pos.x - wpCurr.x;
      const toVehY = pos.y - wpCurr.y;
      let t = (toVehX * segDx + toVehY * segDy) / (segLen * segLen);
      t = Phaser.Math.Clamp(t, 0, 1);
      projX = wpCurr.x + segDx * t;
      projY = wpCurr.y + segDy * t;
      distToCenter = Math.sqrt((pos.x - projX) ** 2 + (pos.y - projY) ** 2);
    }

    // ── 中心線吸引（正常行駛修正） ──
    const CENTER_ATTRACT_THRESHOLD = 20;
    if (distToCenter > CENTER_ATTRACT_THRESHOLD) {
      const toProjAngle = Math.atan2(projY - pos.y, projX - pos.x) - Math.PI / 2;
      const angleToProj = Phaser.Math.Angle.Wrap(toProjAngle - sprite.rotation);
      angleDiff += Phaser.Math.Clamp(angleToProj, -0.1, 0.1);
    }

    // ── 路肩檢測與強制矯正（根據難度） ──
    const offTrackThreshold = 60; // 偏離中心超過 60px 視為壓上路肩
    if (distToCenter > offTrackThreshold) {
      if (!this._wasOutsideLastFrame) {
        this._wallHitTimer = 0;
      }
      this._wallHitTimer += 1 / 60;

      let shouldForceRecover = false;
      if (this._difficulty === AIDifficulty.HARD) {
        shouldForceRecover = true; // 專業：立即矯正
      } else {
        const timeout = (this._difficulty === AIDifficulty.EASY) ? 4.0 : 2.0; // 初級 4s，業餘 2s
        if (this._wallHitTimer > timeout) {
          shouldForceRecover = true;
        }
      }

      if (shouldForceRecover) {
        // 強制將車頭指向路中央投影點，AI 自行開回去
        const toProjAngle = Math.atan2(projY - pos.y, projX - pos.x) - Math.PI / 2;
        angleDiff = Phaser.Math.Angle.Wrap(toProjAngle - sprite.rotation);
        this._wallHitTimer = 0;
      }

      this._wasOutsideLastFrame = true;
    } else {
      this._wallHitTimer = 0;
      this._wasOutsideLastFrame = false;
    }

    const steering = Phaser.Math.Clamp(angleDiff / (Math.PI * 0.5), -1, 1);

    const lookAheadCount = Phaser.Math.Clamp(5 + Math.floor(speedPx / 100), 5, 15);
    const cornerSharpness = this._calcCornerSharpness(this._targetIdx, lookAheadCount);
    const isCorner = cornerSharpness > this._profile.brakeAngleThreshold;
    const throttle = isCorner
      ? Phaser.Math.Clamp(this._profile.speedFactor * 0.5, 0, 1)
      : this._profile.speedFactor;
    const brake = isCorner ? this._profile.brakeFactor * 0.8 : 0;

    return { throttle, steering, brake };
  }

  /** 當前已完成圈數（由外部 CheckpointManager 更新時使用） */
  public getLapCount(): number { return this._lapCount; }

  /** 是否需要強制回到賽道中心 */
  public needsRespawn(): boolean { return this._needsRespawn; }

  /** 取得重置資訊，並清除需求旗標 */
  public consumeRespawn(): { x: number; y: number; angle: number } | null {
    if (!this._needsRespawn) return null;
    this._needsRespawn = false;
    return { x: this._respawnX, y: this._respawnY, angle: this._respawnAngle };
  }

    /**
   * 從 startIdx 路點開始，沿著路徑往前累積距離，直到達到 lookDist，
   * 返回該位置的座標（線性內插）。
   * 若超出總路徑長度，則返回最後一個路點。
   */
  private _getLookAheadPoint(
    startIdx: number,
    pos: Phaser.Math.Vector2,
    lookDist: number
  ): { x: number; y: number } {
    let remaining = lookDist;
    let currentIdx = startIdx;

    // 先從車輛位置走到 startIdx 點
    const wp0 = this._waypoints[currentIdx];
    let segDx = wp0.x - pos.x;
    let segDy = wp0.y - pos.y;
    let segDist = Math.sqrt(segDx * segDx + segDy * segDy);
    if (remaining <= segDist) {
      const t = segDist > 0 ? remaining / segDist : 0;
      return {
        x: pos.x + segDx * t,
        y: pos.y + segDy * t,
      };
    }
    remaining -= segDist;

    // 沿路徑前進
    let loops = 0;
    const maxLoops = this._totalWaypoints * 2;
    while (remaining > 0 && loops < maxLoops) {
      loops++;
      const nextIdx = (currentIdx + 1) % this._totalWaypoints;
      const p1 = this._waypoints[currentIdx];
      const p2 = this._waypoints[nextIdx];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (remaining <= dist) {
        const t = dist > 0 ? remaining / dist : 0;
        return {
          x: p1.x + dx * t,
          y: p1.y + dy * t,
        };
      }
      remaining -= dist;
      currentIdx = nextIdx;
    }

    // 失敗時回傳最遠的路點
    return this._waypoints[currentIdx];
  }

  /** 重置 AI 狀態（比賽重新開始） */
  public reset(startOffset: number = 0, initialPosition?: { x: number; y: number }): void {
    if (initialPosition) {
      let minDistSq = Infinity;
      let nearestIdx = 0;
      for (let i = 0; i < this._totalWaypoints; i++) {
        const wp = this._waypoints[i];
        const dx = wp.x - initialPosition.x;
        const dy = wp.y - initialPosition.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < minDistSq) {
          minDistSq = distSq;
          nearestIdx = i;
        }
      }
      this._targetIdx = nearestIdx;
    } else {
      this._targetIdx = startOffset % this._totalWaypoints;
    }
    this._lapCount = 0;
  }

  // ── 私有方法 ─────────────────────────────────────────────────────────────────

  /**
   * 若車輛已進入當前基準路點的到達半徑，則推進到下一路點。
   */
  private _advanceTarget(pos: Phaser.Math.Vector2): void {
    let bestIdx = this._targetIdx;
    let bestDistSq = Infinity;
    // 搜尋從當前目標往前 10 個路點，找到最近的
    for (let i = 0; i < 10; i++) {
      const idx = (this._targetIdx + i) % this._totalWaypoints;
      const wp = this._waypoints[idx];
      const dx = wp.x - pos.x;
      const dy = wp.y - pos.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        bestIdx = idx;
      }
    }
    if (bestIdx !== this._targetIdx && bestDistSq < this._profile.reachRadius * this._profile.reachRadius * 1.5) {
      // 如果最近的路點不是當前目標，且距離在合理範圍內，則直接跳轉
      if (bestIdx === 0 && this._targetIdx !== 0) this._lapCount++;
      this._targetIdx = bestIdx;
      return;
    }

    // 正常檢查當前目標
    const wp = this._waypoints[this._targetIdx];
    const dx = wp.x - pos.x;
    const dy = wp.y - pos.y;
    const distSq = dx * dx + dy * dy;
    const radiusSq = this._profile.reachRadius * this._profile.reachRadius;
    if (distSq < radiusSq) {
      const next = (this._targetIdx + 1) % this._totalWaypoints;
      if (next === 0) this._lapCount++;
      this._targetIdx = next;
    }
  }

  /**
   * 計算從指定路點開始、往前 count 個路點的累積轉向角（弧度）。
   * 值越大代表彎道越急。
   */
  private _calcCornerSharpness(fromIdx: number, count: number): number {
    let totalAngle = 0;

    for (let i = 0; i < count; i++) {
      const a  = this._waypoints[(fromIdx + i)     % this._totalWaypoints];
      const b  = this._waypoints[(fromIdx + i + 1) % this._totalWaypoints];
      const c  = this._waypoints[(fromIdx + i + 2) % this._totalWaypoints];

      const ab = Math.atan2(b.y - a.y, b.x - a.x);
      const bc = Math.atan2(c.y - b.y, c.x - b.x);
      totalAngle += Math.abs(Phaser.Math.Angle.Wrap(bc - ab));
    }

    return totalAngle / count;
  }
}

// ── 工廠函式 ──────────────────────────────────────────────────────────────────

/**
 * 建立指定數量的 AI 代理，自動分散起始路點偏移以避免堆疊。
 * @param waypoints       路點陣列（像素座標）
 * @param count           AI 數量（1..5）
 * @param difficulty      AI 難度
 * @param startSpacing    相鄰 AI 起點間隔路點數（預設 4）
 */
export function createAIAgents(
  waypoints: Waypoint[],
  count: number,
  difficulty: AIDifficulty,
  startSpacing: number = 4
): AIWaypointAgent[] {
  const clampedCount = Phaser.Math.Clamp(count, 1, 5);
  const agents: AIWaypointAgent[] = [];

  for (let i = 0; i < clampedCount; i++) {
    agents.push(new AIWaypointAgent(waypoints, difficulty, i * startSpacing));
  }

  return agents;
}
