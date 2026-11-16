import React, { useState, useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { Download, Trash2, ArrowDownCircle, Clock, Play, Square } from 'lucide-react';

export const SerialMonitor: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.autoScrollSerial && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [state.serialLogs, state.autoScrollSerial]);

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    actions.sendSerialCommand(commandInput);
    setCommandHistory((prev) => [commandInput, ...prev.slice(0, 30)]);
    setHistoryIndex(-1);
    setCommandInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setCommandInput(commandHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setCommandInput(commandHistory[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommandInput('');
      }
    }
  };

  const exportLogs = () => {
    const blob = new Blob([state.serialLogs.join('')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serial-${state.activeDevice.deviceId}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090d12] overflow-hidden font-mono text-xs select-none">
      {/* Serial Toolbar */}
      <div className="h-10 bg-[#161b22] border-b border-[#30363d] px-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${state.isSerialConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
            <span className="font-bold text-white text-xs">Live Serial Stream</span>
            <span className="text-[#8b949e]">({state.activeDevice.deviceId} • COM4)</span>
          </div>

          {/* Baud Rate Selector */}
          <select
            value={state.serialBaudRate}
            onChange={(e) => actions.setBaudRate(Number(e.target.value))}
            className="bg-[#0d1117] text-[#c9d1d9] border border-[#30363d] px-2 py-0.5 rounded text-[11px] outline-none"
          >
            <option value={9600}>9600 baud</option>
            <option value={115200}>115200 baud (Standard)</option>
            <option value={230400}>230400 baud</option>
            <option value={921600}>921600 baud (High Speed)</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Quick injection triggers */}
          <button
            onClick={() => actions.sendSerialCommand('ESP:PING')}
            disabled={!state.isSerialConnected}
            className="px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] border border-[#30363d] text-[11px] disabled:opacity-40"
          >
            PING
          </button>
          <button
            onClick={() => actions.sendSerialCommand('ESP:RESET')}
            disabled={!state.isSerialConnected}
            className="px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-rose-400 border border-[#30363d] text-[11px] disabled:opacity-40"
          >
            RESET
          </button>

          <button
            onClick={actions.toggleAutoScroll}
            className={`p-1 rounded border ${
              state.autoScrollSerial ? 'bg-blue-950 text-[#58a6ff] border-blue-800' : 'text-[#8b949e] border-[#30363d]'
            }`}
            title="Toggle Auto-Scroll"
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={actions.toggleTimestamps}
            className={`p-1 rounded border ${
              state.showTimestamps ? 'bg-blue-950 text-[#58a6ff] border-blue-800' : 'text-[#8b949e] border-[#30363d]'
            }`}
            title="Toggle Timestamps"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={exportLogs}
            disabled={state.serialLogs.length === 0}
            className="p-1 rounded border text-[#8b949e] hover:text-white border-[#30363d] disabled:opacity-40"
            title="Export Serial Log to TXT"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={actions.clearSerialLogs}
            className="p-1 rounded border text-[#8b949e] hover:text-white border-[#30363d]"
            title="Clear Terminal Buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={actions.toggleSerialConnection}
            className={`flex items-center space-x-1 px-3 py-1 rounded font-semibold text-white transition-colors ${
              state.isSerialConnected ? 'bg-rose-700 hover:bg-rose-600' : 'bg-emerald-700 hover:bg-emerald-600'
            }`}
          >
            {state.isSerialConnected ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            <span>{state.isSerialConnected ? 'Disconnect' : 'Connect'}</span>
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div
        ref={logContainerRef}
        className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-5 text-[#8b949e] select-text bg-[#090d12]"
      >
        {state.serialLogs.length === 0 ? (
          <div className="text-slate-600 italic">
            Serial port idle. Click "Connect" above to begin streaming from ESP32-S3 ({state.activeDevice.deviceId}).
          </div>
        ) : (
          state.serialLogs.map((line, idx) => (
            <div key={idx} className="whitespace-pre-wrap font-mono">
              {line.includes('[TELEMETRY]') ? (
                <span className="text-emerald-400">{line}</span>
              ) : line.includes('[BOOT]') || line.includes('[ESP Studio]') ? (
                <span className="text-[#58a6ff]">{line}</span>
              ) : line.includes('>') ? (
                <span className="text-amber-400 font-bold">{line}</span>
              ) : (
                <span className="text-[#c9d1d9]">{line}</span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Command Injection Bar */}
      <form onSubmit={handleSendCommand} className="h-9 bg-[#161b22] border-t border-[#30363d] px-2 flex items-center">
        <span className="text-[#58a6ff] mr-2 font-bold">&gt;</span>
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={state.isSerialConnected ? "Send command to ESP32-S3 (↑/↓ for history)..." : "Serial port disconnected"}
          disabled={!state.isSerialConnected}
          className="flex-1 bg-transparent text-[#c9d1d9] text-xs outline-none font-mono placeholder-[#484f58]"
        />
        <button
          type="submit"
          disabled={!state.isSerialConnected || !commandInput.trim()}
          className="px-3 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white disabled:opacity-40 text-xs font-semibold"
        >
          Send
        </button>
      </form>
    </div>
  );
};
