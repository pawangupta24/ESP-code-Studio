import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Layers } from 'lucide-react';

interface FreeRtosTask {
  name: string;
  state: 'Running' | 'Blocked' | 'Ready' | 'Suspended';
  priority: number;
  core: 0 | 1;
  stackWatermarkBytes: number;
  cpuPercentage: number;
}

export const FreeRtosMonitor: React.FC = () => {
  const [core0Load, setCore0Load] = useState(14);
  const [core1Load, setCore1Load] = useState(28);

  const [tasks, setTasks] = useState<FreeRtosTask[]>([
    { name: 'main_task', state: 'Running', priority: 1, core: 1, stackWatermarkBytes: 3420, cpuPercentage: 18.5 },
    { name: 'telemetry_task', state: 'Ready', priority: 2, core: 0, stackWatermarkBytes: 2840, cpuPercentage: 8.2 },
    { name: 'ws2812_task', state: 'Blocked', priority: 3, core: 1, stackWatermarkBytes: 1980, cpuPercentage: 4.1 },
    { name: 'wifi_station', state: 'Blocked', priority: 5, core: 0, stackWatermarkBytes: 4120, cpuPercentage: 2.4 },
    { name: 'IDLE0', state: 'Running', priority: 0, core: 0, stackWatermarkBytes: 1024, cpuPercentage: 75.4 },
    { name: 'IDLE1', state: 'Ready', priority: 0, core: 1, stackWatermarkBytes: 1024, cpuPercentage: 71.0 },
  ]);

  // Simulate subtle real-time load jitter
  useEffect(() => {
    const timer = setInterval(() => {
      setCore0Load(Math.floor(12 + Math.random() * 6));
      setCore1Load(Math.floor(25 + Math.random() * 8));
      setTasks((prev) =>
        prev.map((t) => {
          if (t.name.startsWith('IDLE')) return t;
          return {
            ...t,
            stackWatermarkBytes: Math.max(800, t.stackWatermarkBytes + Math.floor((Math.random() - 0.5) * 40)),
          };
        })
      );
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex-1 p-6 bg-[#0d1117] overflow-y-auto text-xs font-mono select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-[#58a6ff]" />
              <span>FreeRTOS Live Kernel & Task Profiler</span>
            </h2>
            <p className="text-[#8b949e] mt-0.5">
              Dual Xtensa LX7 Core 0 & Core 1 scheduling, stack watermarks, and runtime task statistics.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Tick Rate: 1000 Hz</span>
          </span>
        </div>

        {/* Dual Core CPU Meters */}
        <div className="grid grid-cols-2 gap-4">
          {/* Core 0 */}
          <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8b949e] flex items-center space-x-1.5 font-bold">
                <Cpu className="w-4 h-4 text-[#58a6ff]" />
                <span>Xtensa LX7 Core 0 (System & WiFi)</span>
              </span>
              <span className="text-white font-bold">{core0Load}% Active</span>
            </div>
            <div className="w-full bg-[#0d1117] h-2.5 rounded-full overflow-hidden border border-[#30363d]">
              <div
                className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full transition-all duration-500"
                style={{ width: `${core0Load}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-[#8b949e]">
              <span>Frequency: 240 MHz</span>
              <span>Running IDLE0</span>
            </div>
          </div>

          {/* Core 1 */}
          <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8b949e] flex items-center space-x-1.5 font-bold">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Xtensa LX7 Core 1 (App Loop & Telemetry)</span>
              </span>
              <span className="text-white font-bold">{core1Load}% Active</span>
            </div>
            <div className="w-full bg-[#0d1117] h-2.5 rounded-full overflow-hidden border border-[#30363d]">
              <div
                className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full transition-all duration-500"
                style={{ width: `${core1Load}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-[#8b949e]">
              <span>Frequency: 240 MHz</span>
              <span>Running main_task</span>
            </div>
          </div>
        </div>

        {/* Task List Table */}
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-3">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5">
            <span className="font-bold text-white text-xs flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#58a6ff]" />
              <span>Active FreeRTOS Task Control Blocks (TCB)</span>
            </span>
            <span className="text-[10px] text-[#8b949e]">{tasks.length} Active Tasks</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[#8b949e] border-b border-[#21262d] text-[11px]">
                  <th className="py-2 px-2">Task Name</th>
                  <th className="py-2 px-2">State</th>
                  <th className="py-2 px-2">Priority</th>
                  <th className="py-2 px-2">Pinned Core</th>
                  <th className="py-2 px-2">Stack High Watermark</th>
                  <th className="py-2 px-2 text-right">Runtime Load</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]">
                {tasks.map((task) => (
                  <tr key={task.name} className="hover:bg-[#0d1117]/50 transition-colors">
                    <td className="py-2.5 px-2 font-bold text-white flex items-center space-x-2">
                      <span className="text-[#58a6ff]">⚡</span>
                      <span>{task.name}</span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        task.state === 'Running' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        task.state === 'Ready' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                        'bg-[#21262d] text-[#8b949e]'
                      }`}>
                        {task.state}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-[#c9d1d9]">{task.priority}</td>
                    <td className="py-2.5 px-2">
                      <span className="px-1.5 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[10px] text-white">
                        Core {task.core}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[#c9d1d9]">{task.stackWatermarkBytes} B</span>
                        {task.stackWatermarkBytes < 1500 ? (
                          <span className="text-amber-400 text-[10px]" title="Low stack margin">⚠️</span>
                        ) : (
                          <span className="text-emerald-400 text-[10px]" title="Safe stack margin">✓</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-[#58a6ff]">
                      {task.cpuPercentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
