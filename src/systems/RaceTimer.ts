// [版本] v0.1 | [日期] 2026-04-19 | [功能] 倒計時與圈計時

export class RaceTimer {
  private _totalMs: number = 0;
  private _lapStartMs: number = 0;
  private _lapTimes: number[] = [];
  private _running: boolean = false;

  /** 開始計時（清除舊資料） */
  public start(): void {
    this._totalMs   = 0;
    this._lapStartMs = 0;
    this._lapTimes  = [];
    this._running   = true;
  }

  /** 每幀呼叫 */
  public update(deltaMs: number): void {
    if (this._running) this._totalMs += deltaMs;
  }

  /** 記錄當前圈完成，回傳該圈時間（ms） */
  public recordLap(): number {
    const lapMs = this._totalMs - this._lapStartMs;
    this._lapTimes.push(lapMs);
    this._lapStartMs = this._totalMs;
    return lapMs;
  }

  /** 停止計時 */
  public stop(): void { this._running = false; }

  public getTotalMs(): number { return this._totalMs; }
  public getCurrentLapMs(): number { return this._totalMs - this._lapStartMs; }
  public getLapTimes(): number[] { return [...this._lapTimes]; }
  public getBestLapMs(): number {
    return this._lapTimes.length > 0 ? Math.min(...this._lapTimes) : 0;
  }

  /** mm:ss.cc 格式 */
  public static format(ms: number): string {
    const m  = Math.floor(ms / 60000);
    const s  = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }
}
