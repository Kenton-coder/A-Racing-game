// [版本] v0.2 | [日期] 2026-04-26 | [功能] 即時排名（依圈數 + checkpoint + 段落進度排序）

export interface Standing {
  vehicleId: string;
  position: number;
  laps: number;
  checkpoints: number;
}

export class RaceStandings {
  private _data: Map<string, { laps: number; checkpoints: number; progress: number }> = new Map();

  /** 登記車輛 */
  public register(vehicleId: string): void {
    this._data.set(vehicleId, { laps: 0, checkpoints: 0, progress: 0 });
  }

  /**
   * 每幀更新車輛進度
   * @param progress 0–1，當前檢查點區間的完成比例
   */
  public update(vehicleId: string, laps: number, checkpoints: number, progress = 0): void {
    this._data.set(vehicleId, { laps, checkpoints, progress });
  }

  /** 取得車輛當前名次（1-based） */
  public getPosition(vehicleId: string): number {
    return this._getSorted().findIndex(([id]) => id === vehicleId) + 1;
  }

  /** 取得完整排名陣列 */
  public getAll(): Standing[] {
    return this._getSorted().map(([id, d], i) => ({
      vehicleId: id,
      position: i + 1,
      laps: d.laps,
      checkpoints: d.checkpoints,
    }));
  }

  private _getSorted(): [string, { laps: number; checkpoints: number; progress: number }][] {
    return Array.from(this._data.entries()).sort((a, b) => {
      if (b[1].laps !== a[1].laps) return b[1].laps - a[1].laps;
      if (b[1].checkpoints !== a[1].checkpoints) return b[1].checkpoints - a[1].checkpoints;
      return b[1].progress - a[1].progress;
    });
  }
}