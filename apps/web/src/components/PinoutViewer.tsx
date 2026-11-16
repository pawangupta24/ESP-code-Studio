import React, { useState } from 'react';
import { Cpu, AlertTriangle, CheckCircle2, Info, Search } from 'lucide-react';

interface PinDefinition {
  pin: number;
  label: string;
  defaultFunc: string;
  capabilities: ('ADC' | 'PWM' | 'TOUCH' | 'SPI' | 'I2C' | 'UART' | 'USB' | 'STRAPPING')[];
  assignedInCode?: string;
  warning?: string;
}

export const PinoutViewer: React.FC = () => {
  const [selectedPin, setSelectedPin] = useState<PinDefinition | null>(null);
  const [filterCap, setFilterCap] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const pins: PinDefinition[] = [
    { pin: 0, label: 'GPIO 0', defaultFunc: 'Boot Button', capabilities: ['STRAPPING', 'TOUCH', 'PWM'], warning: 'Strapping pin: Pull LOW on reset to enter ROM bootloader.' },
    { pin: 1, label: 'GPIO 1', defaultFunc: 'ADC1_CH0', capabilities: ['ADC', 'TOUCH', 'PWM'] },
    { pin: 2, label: 'GPIO 2', defaultFunc: 'ADC1_CH1', capabilities: ['ADC', 'TOUCH', 'PWM'] },
    { pin: 3, label: 'GPIO 3', defaultFunc: 'ADC1_CH2', capabilities: ['ADC', 'STRAPPING', 'PWM'], warning: 'Strapping pin for JTAG debugging configuration.' },
    { pin: 4, label: 'GPIO 4', defaultFunc: 'ADC1_CH3', capabilities: ['ADC', 'TOUCH', 'PWM'] },
    { pin: 5, label: 'GPIO 5', defaultFunc: 'ADC1_CH4', capabilities: ['ADC', 'TOUCH', 'PWM'] },
    { pin: 6, label: 'GPIO 6', defaultFunc: 'ADC1_CH5', capabilities: ['ADC', 'TOUCH', 'PWM'] },
    { pin: 7, label: 'GPIO 7', defaultFunc: 'ADC1_CH6', capabilities: ['ADC', 'TOUCH', 'PWM'] },
    { pin: 8, label: 'GPIO 8', defaultFunc: 'ADC1_CH7', capabilities: ['ADC', 'TOUCH', 'PWM', 'I2C'], assignedInCode: 'I2C SDA (Wire)' },
    { pin: 9, label: 'GPIO 9', defaultFunc: 'ADC1_CH8', capabilities: ['ADC', 'TOUCH', 'PWM', 'I2C'], assignedInCode: 'I2C SCL (Wire)' },
    { pin: 10, label: 'GPIO 10', defaultFunc: 'ADC1_CH9', capabilities: ['ADC', 'TOUCH', 'PWM', 'SPI'], assignedInCode: 'SPI CS (Display)' },
    { pin: 11, label: 'GPIO 11', defaultFunc: 'SPI MOSI', capabilities: ['SPI', 'PWM'], assignedInCode: 'SPI MOSI' },
    { pin: 12, label: 'GPIO 12', defaultFunc: 'SPI SCK', capabilities: ['SPI', 'PWM'], assignedInCode: 'SPI SCK' },
    { pin: 13, label: 'GPIO 13', defaultFunc: 'SPI MISO', capabilities: ['SPI', 'PWM'], assignedInCode: 'SPI MISO' },
    { pin: 14, label: 'GPIO 14', defaultFunc: 'TOUCH 14', capabilities: ['TOUCH', 'PWM'] },
    { pin: 19, label: 'GPIO 19', defaultFunc: 'USB D-', capabilities: ['USB'], warning: 'Native USB CDC D- line. Do not connect external loads.' },
    { pin: 20, label: 'GPIO 20', defaultFunc: 'USB D+', capabilities: ['USB'], warning: 'Native USB CDC D+ line. Do not connect external loads.' },
    { pin: 43, label: 'GPIO 43', defaultFunc: 'U0TXD', capabilities: ['UART'], assignedInCode: 'Serial TX (115200)' },
    { pin: 44, label: 'GPIO 44', defaultFunc: 'U0RXD', capabilities: ['UART'], assignedInCode: 'Serial RX (115200)' },
    { pin: 45, label: 'GPIO 45', defaultFunc: 'VSPI CS', capabilities: ['STRAPPING', 'PWM'], warning: 'Strapping pin: VDD_SPI voltage selection (3.3V vs 1.8V).' },
    { pin: 46, label: 'GPIO 46', defaultFunc: 'BOOT LOG', capabilities: ['STRAPPING'], warning: 'Strapping pin: ROM messages print mode.' },
    { pin: 48, label: 'GPIO 48', defaultFunc: 'WS2812 RGB LED', capabilities: ['PWM'], assignedInCode: 'Status RGB Blinker (ACTIVE)' },
  ];

  const filteredPins = pins.filter((p) => {
    const matchesSearch = p.label.toLowerCase().includes(search.toLowerCase()) ||
                          p.defaultFunc.toLowerCase().includes(search.toLowerCase()) ||
                          (p.assignedInCode && p.assignedInCode.toLowerCase().includes(search.toLowerCase()));
    const matchesCap = filterCap === 'ALL' || p.capabilities.includes(filterCap as any);
    return matchesSearch && matchesCap;
  });

  return (
    <div className="flex-1 p-6 bg-[#0d1117] overflow-y-auto text-xs font-mono select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-[#58a6ff]" />
              <span>Interactive ESP32-S3 Pinout & GPIO Matrix</span>
            </h2>
            <p className="text-[#8b949e] mt-0.5">
              Inspect peripheral multiplexing, strapping pin restrictions, and detect hardware conflicts in firmware.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded bg-[#161b22] border border-[#30363d] text-[#58a6ff] text-[11px]">
              Active Board: ESP32-S3-DevKitC-1-N8
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[#161b22] border border-[#30363d]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8b949e]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by pin number, name, or peripheral function (e.g. 48, I2C, SPI)..."
              className="w-full bg-[#0d1117] border border-[#30363d] pl-9 pr-3 py-1.5 rounded-lg text-white text-xs outline-none focus:border-[#58a6ff]"
            />
          </div>

          <div className="flex space-x-1">
            {['ALL', 'ADC', 'I2C', 'SPI', 'UART', 'STRAPPING'].map((cap) => (
              <button
                key={cap}
                onClick={() => setFilterCap(cap)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  filterCap === cap
                    ? 'bg-[#58a6ff] text-black'
                    : 'bg-[#0d1117] text-[#8b949e] hover:text-white border border-[#30363d]'
                }`}
              >
                {cap}
              </button>
            ))}
          </div>
        </div>

        {/* Pin Grid & Detail Inspector */}
        <div className="grid grid-cols-3 gap-6">
          {/* Pins List */}
          <div className="col-span-2 space-y-2">
            <div className="text-[11px] font-bold text-[#8b949e] uppercase px-1">
              GPIO Pin Matrix ({filteredPins.length} pins)
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredPins.map((p) => {
                const isSelected = selectedPin?.pin === p.pin;
                const hasConflict = !!p.warning;
                const isAssigned = !!p.assignedInCode;

                return (
                  <div
                    key={p.pin}
                    onClick={() => setSelectedPin(p)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#1f6feb]/20 border-[#58a6ff] text-white shadow-md'
                        : 'bg-[#161b22] border-[#21262d] text-[#c9d1d9] hover:bg-[#21262d]/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${
                        p.pin === 48 ? 'bg-purple-950 text-purple-300 border border-purple-700' :
                        hasConflict ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                        isAssigned ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                        'bg-[#0d1117] text-[#58a6ff] border border-[#30363d]'
                      }`}>
                        {p.pin}
                      </div>

                      <div>
                        <div className="font-bold text-xs flex items-center space-x-2">
                          <span>{p.label}</span>
                          {isAssigned && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                              ASSIGNED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8b949e]">{p.defaultFunc}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {p.capabilities.map((c) => (
                        <span key={c} className="px-1.5 py-0.5 rounded text-[9px] bg-[#0d1117] text-[#8b949e] border border-[#21262d]">
                          {c}
                        </span>
                      ))}
                      {hasConflict && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 ml-1" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pin Details Card */}
          <div className="col-span-1">
            <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] sticky top-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5">
                <span className="font-bold text-white text-xs">Pin Inspector</span>
                {selectedPin ? (
                  <span className="text-[#58a6ff] font-bold">GPIO {selectedPin.pin}</span>
                ) : (
                  <span className="text-[#8b949e]">Select a pin</span>
                )}
              </div>

              {selectedPin ? (
                <div className="space-y-3 text-[11px]">
                  <div>
                    <div className="text-[#8b949e]">Default Mapping:</div>
                    <div className="text-white font-bold mt-0.5">{selectedPin.defaultFunc}</div>
                  </div>

                  {selectedPin.assignedInCode && (
                    <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/60 space-y-1">
                      <div className="text-emerald-400 font-bold flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Configured in Firmware</span>
                      </div>
                      <div className="text-white">{selectedPin.assignedInCode}</div>
                    </div>
                  )}

                  {selectedPin.warning && (
                    <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800/60 space-y-1">
                      <div className="text-amber-400 font-bold flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Hardware Caution</span>
                      </div>
                      <div className="text-amber-200/90 text-[10px] leading-relaxed">
                        {selectedPin.warning}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-[#8b949e] mb-1">Supported Capabilities:</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedPin.capabilities.map((c) => (
                        <span key={c} className="px-2 py-0.5 rounded bg-[#0d1117] text-[#58a6ff] border border-[#30363d] text-[10px]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#21262d] text-[10px] text-[#8b949e]">
                    Voltage Level: 3.3V Logic (Not 5V Tolerant)
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-[#8b949e] space-y-2">
                  <Info className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-[11px]">Click any GPIO pin from the matrix on the left to inspect its hardware capabilities and strapping restrictions.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
