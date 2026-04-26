// [版本] v0.1 | [日期] 2026-04-19 | [功能] 各車各圈時間記錄

export interface LapRecord {
  vehicleId: string;
  lapNumber: number;
  lapMs: number;
}

export class LapRecorder {
  private _records: Map<string, number[]> = new Map();

  /** 登記車輛 */
  public registerVehicle(vehicleId: string): void {
    this._records.set(vehicleId, []);
  }

  /** 記錄一圈時間 */
  public record(vehicleId: string, lapMs: number): void {
    this._records.get(vehicleId)?.push(lapMs);
  }

  /** 取得所有圈時間 */
  public getLapTimes(vehicleId: string): number[] {
    return [...(this._records.get(vehicleId) ?? [])];
  }

  /** 取得最快圈（ms），無記錄回傳 0 */
  public getBestLap(vehicleId: string): number {
    const times = this._records.get(vehicleId);
    return times && times.length > 0 ? Math.min(...times) : 0;
  }

  /** 取得已完成圈數 */
  public getLapCount(vehicleId: string): number {
    return this._records.get(vehicleId)?.length ?? 0;
  }
}
