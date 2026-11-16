import { SerialOptions, SerialPortInfo } from '@esp-studio/shared-types';
import { SerialProvider } from './provider';

export class BrowserSerialProvider implements SerialProvider {
  private port: any = null;
  private reader: any = null;
  private writer: any = null;
  private connected: boolean = false;
  private dataListeners: Set<(chunk: string) => void> = new Set();
  private errorListeners: Set<(err: Error) => void> = new Set();

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public async listPorts(): Promise<SerialPortInfo[]> {
    if (!this.isSupported()) return [];
    try {
      const ports = await (navigator as any).serial.getPorts();
      return ports.map((_p: any, idx: number) => ({
        portId: `web-port-${idx}`,
        name: `ESP32-S3 Serial Device (COM Port ${idx + 1})`,
      }));
    } catch {
      return [];
    }
  }

  public async connect(_portId: string, options: SerialOptions): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Web Serial API is not supported in this browser environment. Use Chrome or Edge.');
    }
    try {
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({
        baudRate: options.baudRate,
        dataBits: options.dataBits || 8,
        stopBits: options.stopBits || 1,
        parity: options.parity || 'none',
      });
      this.connected = true;
      this.startReading();
    } catch (err: any) {
      this.errorListeners.forEach((fn) => fn(err));
      throw err;
    }
  }

  private async startReading(): Promise<void> {
    const textDecoder = new TextDecoderStream();
    if (!this.port.readable) return;
    this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    try {
      while (this.connected) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          this.dataListeners.forEach((fn) => fn(value));
        }
      }
    } catch (err: any) {
      this.errorListeners.forEach((fn) => fn(err));
    } finally {
      this.reader?.releaseLock();
    }
  }

  public async disconnect(): Promise<void> {
    this.connected = false;
    if (this.reader) {
      await this.reader.cancel();
    }
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
  }

  public async write(data: Uint8Array | string): Promise<void> {
    if (!this.connected || !this.port) throw new Error('Serial port is not connected.');
    const encoder = new TextEncoder();
    const payload = typeof data === 'string' ? encoder.encode(data) : data;
    this.writer = this.port.writable.getWriter();
    await this.writer.write(payload);
    this.writer.releaseLock();
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
