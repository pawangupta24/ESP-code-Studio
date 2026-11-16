import { SerialOptions, SerialPortInfo } from '@esp-studio/shared-types';
import { SerialProvider } from './provider';

export class MockSerialProvider implements SerialProvider {
  private connected: boolean = false;
  private intervalId: any = null;
  private dataListeners: Set<(chunk: string) => void> = new Set();
  private errorListeners: Set<(err: Error) => void> = new Set();
  private count: number = 0;

  public async listPorts(): Promise<SerialPortInfo[]> {
    return [
      {
        portId: 'COM4_SIMULATED',
        name: 'ESP32-S3 USB CDC (COM4 - SPRAYER-001)',
        vendorId: 0x303a,
        productId: 0x1001,
        manufacturer: 'Espressif Systems',
      },
    ];
  }

  public async connect(_portId: string, _options: SerialOptions): Promise<void> {
    this.connected = true;
    this.emitLine('[ESP-ROM] ESP32-S3 (revision v0.2) boot: 0x20 (DOWNLOAD_BOOT)');
    this.emitLine('[ESP-ROM] Booting from flash address 0x00000000...');
    this.emitLine('[ESP-IDF] System clock initialized @ 240 MHz');
    this.emitLine('[ESP Studio] Identity verified: Device ID = SPRAYER-001 (MAC: 84:F7:03:1A:2B:3C)');
    this.emitLine('[APP] Initializing ESP32-S3 PWM spray solenoids & valve sensors...');
    this.emitLine('[APP] Sensor calibrations loaded from NVS namespace: esp_studio');

    this.intervalId = setInterval(() => {
      if (!this.connected) return;
      this.count++;
      const heap = Math.floor(280000 + Math.random() * 5000);
      const pressure = (2.4 + Math.sin(this.count / 5) * 0.2).toFixed(2);
      this.emitLine(`[TELEMETRY] Loop: ${this.count} | Free Heap: ${heap} bytes | Tank Pressure: ${pressure} bar | Status: OK`);
    }, 1500);
  }

  public async disconnect(): Promise<void> {
    this.connected = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.emitLine('[ESP Studio] Serial connection closed.');
  }

  public async write(data: Uint8Array | string): Promise<void> {
    const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
    this.emitLine(`> ${text.trim()}`);
    if (text.includes('PING')) {
      setTimeout(() => this.emitLine('{"$esp_studio": {"event": "PONG", "uptime_ms": 34100}}'), 200);
    } else if (text.includes('RESET')) {
      setTimeout(() => this.emitLine('[ESP-IDF] Software reset triggered by host... restarting...'), 200);
    }
  }

  private emitLine(line: string): void {
    const formatted = `[${new Date().toISOString().substring(11, 23)}] ${line}\r\n`;
    this.dataListeners.forEach((fn) => fn(formatted));
  }

  public onData(handler: (chunk: string) => void): () => void {
    this.dataListeners.add(handler);
    return () => this.dataListeners.delete(handler);
  }

  public onError(handler: (err: Error) => void): () => void {
    this.errorListeners.add(handler);
    return () => this.errorListeners.delete(handler);
  }

  public isConnected(): boolean {
    return this.connected;
  }
}
