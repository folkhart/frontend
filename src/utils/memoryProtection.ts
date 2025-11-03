/**
 * Protected Value - Obfuscates values in memory to prevent easy modification
 */
class ProtectedValue {
  private _encodedValue: number;
  private _offset: number;
  private _multiplier: number;

  constructor(value: number) {
    this._offset = Math.random() * 10000;
    this._multiplier = Math.random() * 100 + 1;
    this._encodedValue = (value + this._offset) * this._multiplier;
  }

  get value(): number {
    const decoded = this._encodedValue / this._multiplier - this._offset;
    return Math.round(decoded * 100) / 100; // Round to 2 decimal places
  }

  set value(val: number) {
    this._encodedValue = (val + this._offset) * this._multiplier;
  }

  // Add to value
  add(amount: number) {
    this.value = this.value + amount;
  }

  // Subtract from value
  subtract(amount: number) {
    this.value = this.value - amount;
  }
}

/**
 * Protected String - Obfuscates strings in memory
 */
class ProtectedString {
  private _encodedValue: string;
  private _key: number;

  constructor(value: string) {
    this._key = Math.floor(Math.random() * 256);
    this._encodedValue = this.encode(value);
  }

  private encode(str: string): string {
    return btoa(
      str
        .split('')
        .map((char) => String.fromCharCode(char.charCodeAt(0) ^ this._key))
        .join('')
    );
  }

  private decode(encoded: string): string {
    return atob(encoded)
      .split('')
      .map((char) => String.fromCharCode(char.charCodeAt(0) ^ this._key))
      .join('');
  }

  get value(): string {
    return this.decode(this._encodedValue);
  }

  set value(val: string) {
    this._encodedValue = this.encode(val);
  }
}

/**
 * Protected Player State
 * Use this to store critical player data that should be harder to modify
 */
export class ProtectedPlayerState {
  private _gold: ProtectedValue;
  private _gems: ProtectedValue;
  private _level: ProtectedValue;
  private _energy: ProtectedValue;
  private _username: ProtectedString;

  constructor(gold = 0, gems = 0, level = 1, energy = 100, username = '') {
    this._gold = new ProtectedValue(gold);
    this._gems = new ProtectedValue(gems);
    this._level = new ProtectedValue(level);
    this._energy = new ProtectedValue(energy);
    this._username = new ProtectedString(username);
  }

  // Getters
  get gold(): number {
    return this._gold.value;
  }

  get gems(): number {
    return this._gems.value;
  }

  get level(): number {
    return this._level.value;
  }

  get energy(): number {
    return this._energy.value;
  }

  get username(): string {
    return this._username.value;
  }

  // Setters
  set gold(value: number) {
    this._gold.value = value;
  }

  set gems(value: number) {
    this._gems.value = value;
  }

  set level(value: number) {
    this._level.value = value;
  }

  set energy(value: number) {
    this._energy.value = value;
  }

  set username(value: string) {
    this._username.value = value;
  }

  // Methods
  addGold(amount: number) {
    this._gold.add(amount);
  }

  subtractGold(amount: number) {
    this._gold.subtract(amount);
  }

  addGems(amount: number) {
    this._gems.add(amount);
  }

  subtractGems(amount: number) {
    this._gems.subtract(amount);
  }

  addEnergy(amount: number) {
    this._energy.add(amount);
  }

  subtractEnergy(amount: number) {
    this._energy.subtract(amount);
  }

  // Get plain object for API calls
  toPlainObject() {
    return {
      gold: this.gold,
      gems: this.gems,
      level: this.level,
      energy: this.energy,
      username: this.username,
    };
  }

  // Update from server response
  updateFromServer(data: any) {
    if (data.gold !== undefined) this.gold = data.gold;
    if (data.gems !== undefined) this.gems = data.gems;
    if (data.level !== undefined) this.level = data.level;
    if (data.energy !== undefined) this.energy = data.energy;
    if (data.username !== undefined) this.username = data.username;
  }
}

/**
 * Anti-Debug Detection
 */
export class AntiDebug {
  private static debuggerCheckInterval: NodeJS.Timeout | null = null;
  private static onDebugDetected: (() => void) | null = null;

  static start(onDetected: () => void) {
    this.onDebugDetected = onDetected;

    // Check for debugger periodically
    this.debuggerCheckInterval = setInterval(() => {
      const start = performance.now();
      debugger; // This will pause if debugger is attached
      const end = performance.now();

      if (end - start > 100) {
        console.warn('⚠️ Debugger detected!');
        this.onDebugDetected?.();
      }
    }, 2000);

    // Check for dev tools using window size
    this.checkDevTools();
    window.addEventListener('resize', () => this.checkDevTools());
  }

  private static checkDevTools() {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;

    if (widthThreshold || heightThreshold) {
      console.warn('⚠️ DevTools may be open!');
      this.onDebugDetected?.();
    }
  }

  static stop() {
    if (this.debuggerCheckInterval) {
      clearInterval(this.debuggerCheckInterval);
      this.debuggerCheckInterval = null;
    }
  }
}

/**
 * Environment Tampering Detection
 */
export class TamperingDetector {
  static detect(): { isTampered: boolean; checks: any } {
    const checks = {
      devTools: false,
      modifiedPrototypes: false,
      suspiciousGlobals: false,
    };

    // Check if DevTools is open
    const threshold = 160;
    checks.devTools =
      window.outerWidth - window.innerWidth > threshold ||
      window.outerHeight - window.innerHeight > threshold;

    // Check if core prototypes have been modified
    try {
      checks.modifiedPrototypes =
        Object.prototype.toString.call([]) !== '[object Array]' ||
        Object.prototype.toString.call({}) !== '[object Object]';
    } catch (e) {
      checks.modifiedPrototypes = true;
    }

    // Check for suspicious global variables
    const suspiciousVars = [
      '__REACT_DEVTOOLS_GLOBAL_HOOK__',
      '__REDUX_DEVTOOLS_EXTENSION__',
    ];
    checks.suspiciousGlobals = suspiciousVars.some((v) => v in window);

    const isTampered = Object.values(checks).some((v) => v);

    return { isTampered, checks };
  }
}

export { ProtectedValue, ProtectedString };
