export interface SerialOptions {
  baudRate: number;        // e.g. 115200, 921600
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
  flowControl?: 'none' | 'hardware';
  bufferSize?: number;
}

export interface SerialPortInfo {
  portId: string;
  name: string;
  vendorId?: number;
  productId?: number;
  manufacturer?: string;
  serialNumber?: string;
}

export interface SerialLogMessage {
  id: string;
  timestamp: number;
  direction: 'rx' | 'tx' | 'system';
  data: string;
}
