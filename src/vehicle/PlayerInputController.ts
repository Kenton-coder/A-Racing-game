// [版本] v0.1 | [日期] 2026-04-19 | [功能] 鍵盤輸入 → 標準化 DriveInput

import Phaser from 'phaser';
import { DriveInput } from '@/vehicle/VehiclePhysics';

/**
 * 將鍵盤輸入轉換為標準化的 DriveInput 值。
 * 支援方向鍵與 WASD 雙配置；Escape 鍵偵測暫停。
 */
export class PlayerInputController {
  private readonly _cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly _keyW: Phaser.Input.Keyboard.Key;
  private readonly _keyA: Phaser.Input.Keyboard.Key;
  private readonly _keyS: Phaser.Input.Keyboard.Key;
  private readonly _keyD: Phaser.Input.Keyboard.Key;
  private readonly _keySpace: Phaser.Input.Keyboard.Key;
  private readonly _keyEsc: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this._cursors = kb.createCursorKeys();
    this._keyW    = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this._keyA    = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this._keyS    = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this._keyD    = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this._keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._keyEsc  = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  /**
   * 讀取當前幀的鍵盤狀態並回傳標準化輸入。
   * 每幀呼叫一次，結果傳入 VehiclePhysics.update()。
   */
  public getInput(): DriveInput {
    const up    = this._cursors.up.isDown    || this._keyW.isDown;
    const down  = this._cursors.down.isDown  || this._keyS.isDown;
    const left  = this._cursors.left.isDown  || this._keyA.isDown;
    const right = this._cursors.right.isDown || this._keyD.isDown;

    const braking = down || this._keySpace.isDown;
    return {
      throttle: up ? 1 : 0,
      brake:    braking ? 1 : 0,
      steering: left ? -1 : right ? 1 : 0,
    };
  }

  /**
   * 偵測暫停鍵（Escape）是否於本幀剛被按下。
   * 使用 JustDown 確保每次按壓只觸發一次。
   */
  public isPauseJustPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this._keyEsc);
  }

  /**
   * 釋放所有鍵盤監聽，於 Scene shutdown 時呼叫。
   */
  public destroy(): void {
    this._keyW.destroy();
    this._keyA.destroy();
    this._keyS.destroy();
    this._keyD.destroy();
    this._keySpace.destroy();
    this._keyEsc.destroy();
  }
}
