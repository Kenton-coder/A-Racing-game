// [版本] v0.1 | [日期] 2026-04-19 | [功能] Catmull-Rom 插值平滑賽道中心線

export interface Waypoint {
  x: number;
  y: number;
}

export class TrackSplineGenerator {
  private readonly _points: Waypoint[];
  private readonly _tension: number;

  constructor(waypoints: Waypoint[], tension = 0.5) {
    this._points = waypoints;
    this._tension = tension;
  }

  /**
   * 生成平滑插值後的中心線點陣列
   * @param samplesPerSegment 每段插值樣本數
   */
  public generateSpline(samplesPerSegment = 10000): Waypoint[] {
    const result: Waypoint[] = [];
    const pts = this._points;
    const count = pts.length;

    for (let i = 0; i < count; i++) {
      const p0 = pts[(i - 1 + count) % count];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % count];
      const p3 = pts[(i + 2) % count];

      for (let s = 0; s < samplesPerSegment; s++) {
        const t = s / samplesPerSegment;
        result.push(this._catmullRom(p0, p1, p2, p3, t));
      }
    }

    return result;
  }

  /**
   * 取得指定歸一化進度（0–1）在樣條上的位置
   * @param progress 0（起點）到 1（終點）
   * @param spline 預先生成的樣條點陣列
   */
  public getPositionAtProgress(progress: number, spline: Waypoint[]): Waypoint {
    const clamped = Math.max(0, Math.min(1, progress));
    const idx = Math.floor(clamped * (spline.length - 1));
    return spline[Math.min(idx, spline.length - 1)];
  }

  /**
   * 計算樣條總長度（折線近似）
   */
  public computeLength(spline: Waypoint[]): number {
    let total = 0;
    for (let i = 1; i < spline.length; i++) {
      const dx = spline[i].x - spline[i - 1].x;
      const dy = spline[i].y - spline[i - 1].y;
      total += Math.sqrt(dx * dx + dy * dy);
    }
    return total;
  }

  private _catmullRom(
    p0: Waypoint,
    p1: Waypoint,
    p2: Waypoint,
    p3: Waypoint,
    t: number
  ): Waypoint {
    const alpha = this._tension;
    const t2 = t * t;
    const t3 = t2 * t;

    const x =
      alpha * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      );

    const y =
      alpha * (
        (2 * p1.y) +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      );

    return { x, y };
  }
}
