import { SerialOptions, SerialPortInfo } from '@esp-studio/shared-types';

export interface SerialProvider {
  listPorts(): Promise<SerialPortInfo[]>;
  connect(portId: string, options: SerialOptions): Promise<void>;
  disconnect(): Promise<void>;
  write(data: Uint8Array | string): Promise<void>;
  onData(handler: (chunk: string) => void): () => void;
  onError(handler: (err: Error) => void): () => void;
  isConnected(): boolean;
}
