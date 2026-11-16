import React, { useState } from 'react';
import { useWorkspaceStore, AiModelId } from '../stores/useWorkspaceStore';
import { Bot, Send, Copy, ArrowDownRight, Check, X } from 'lucide-react';

export const AiAssistantPanel: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const models: { id: AiModelId; name: string; provider: string; tag: string }[] = [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google DeepMind', tag: 'Fast' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google DeepMind', tag: 'Complex' },
    { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', tag: 'Coding' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', tag: 'Omni' },
    { id: 'deepseek-coder', name: 'DeepSeek Coder V2', provider: 'DeepSeek', tag: 'Open' },
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    actions.sendAiMessage(input);
    setInput('');
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full bg-[#161b22] border-l border-[#30363d] flex flex-col h-full select-none text-xs font-mono">
      {/* Header */}
      <div className="p-3 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]/60">
        <div className="flex items-center space-x-2">
          <Bot className="w-4 h-4 text-[#58a6ff]" />
          <span className="font-bold text-white text-xs">Embedded AI Copilot</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-950 text-purple-300 border border-purple-800">
            PRO
          </span>
        </div>

        <button
          onClick={actions.toggleAiPanel}
          className="text-[#8b949e] hover:text-white p-1 rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Model Selector Bar */}
      <div className="p-2 border-b border-[#21262d] bg-[#0d1117] flex items-center justify-between">
        <span className="text-[10px] text-[#8b949e]">Model:</span>
        <select
          value={state.activeAiModel}
          onChange={(e) => actions.setAiModel(e.target.value as AiModelId)}
          className="bg-[#161b22] text-white border border-[#30363d] px-2 py-1 rounded text-[11px] outline-none cursor-pointer"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.provider})
            </option>
          ))}
        </select>
      </div>

      {/* Quick Prompt Pills */}
      <div className="p-2.5 border-b border-[#21262d] bg-[#161b22] space-y-1.5">
        <div className="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider">
          Quick Embedded Prompts:
        </div>
        <div className="flex flex-wrap gap-1">
          {[
            'Generate FreeRTOS Task',
            'Add Auto-reconnect WiFi',
            'Check Bugs & Leaks',
            'Explain Strapping Pins',
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => actions.sendAiMessage(prompt)}
              className="px-2 py-0.5 rounded bg-[#0d1117] text-[#58a6ff] hover:text-white hover:bg-[#21262d] border border-[#30363d] text-[10px] transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Message Chat Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#090d12]">
        {state.aiMessages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-xl border space-y-2 ${
              msg.sender === 'user'
                ? 'bg-[#1f6feb]/20 border-[#1f6feb]/40 text-white ml-6'
                : 'bg-[#161b22] border-[#30363d] text-[#c9d1d9] mr-2'
            }`}
          >
            <div className="flex items-center justify-between text-[10px]">
              <span className={`font-bold ${msg.sender === 'user' ? 'text-[#58a6ff]' : 'text-purple-400'}`}>
                {msg.sender === 'user' ? 'You' : msg.model}
              </span>
              <span className="text-[#8b949e]">{msg.timestamp}</span>
            </div>

            <p className="text-[11px] leading-relaxed select-text whitespace-pre-wrap">
              {msg.text}
            </p>

            {msg.suggestedCode && (
              <div className="rounded-lg bg-[#0d1117] border border-[#21262d] overflow-hidden mt-2">
                <div className="px-2.5 py-1.5 bg-[#161b22] border-b border-[#21262d] flex items-center justify-between text-[10px]">
                  <span className="text-[#8b949e]">C++ (ESP32-S3)</span>
                  <div className="flex space-x-1.5">
                    <button
                      onClick={() => handleCopyCode(msg.id, msg.suggestedCode!)}
                      className="px-2 py-0.5 rounded bg-[#0d1117] text-[#8b949e] hover:text-white border border-[#30363d] flex items-center space-x-1"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => actions.applyAiCode(msg.suggestedCode!)}
                      className="px-2 py-0.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white flex items-center space-x-1 font-semibold"
                    >
                      <ArrowDownRight className="w-3 h-3" />
                      <span>Insert Code</span>
                    </button>
                  </div>
                </div>
                <pre className="p-2.5 text-[10px] leading-relaxed overflow-x-auto text-[#58a6ff] select-text">
                  {msg.suggestedCode}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-2 bg-[#161b22] border-t border-[#30363d] flex items-center space-x-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${models.find((m) => m.id === state.activeAiModel)?.name || 'AI Copilot'}...`}
          className="flex-1 bg-[#0d1117] border border-[#30363d] px-2.5 py-1.5 rounded-lg text-white text-xs outline-none focus:border-[#58a6ff]"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-1.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-lg disabled:opacity-40"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
