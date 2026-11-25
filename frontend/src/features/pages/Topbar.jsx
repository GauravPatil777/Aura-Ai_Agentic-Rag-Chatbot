import React from 'react';
import { Sparkles, LayoutPanelLeft } from 'lucide-react';

export default function Topbar({ onToggleTelemetry, showTelemetry }) {

  return (

    <header className="h-14 bg-[#f8f7f4] border-b border-[#e5e3dc] flex items-center justify-between px-5 shrink-0">

      {/* Left: AURA AI */}
      <div className="flex items-center gap-3">

        <div className="w-8 h-8 rounded-lg bg-[#3b5e43] flex items-center justify-center text-white">
          <Sparkles size={17} />
        </div>

        <div>
          <h1 className="text-sm font-bold tracking-wide text-[#1c241d]">
            AURA AI
          </h1>

          <p className="text-[10px] text-[#738375]">
            Intelligent AI Assistant
          </p>
        </div>

      </div>

      {/* Right: Status and Telemetry */}
      <div className="flex items-center gap-4">

        {/* Status */}
        <div className="flex items-center gap-2 text-xs text-[#526355]">

          <span className="w-2 h-2 rounded-full bg-[#4a7c59]" />

          <span>Ready</span>

        </div>

        <div className="h-5 w-px bg-[#d9d6cd]" />


      </div>

    </header>

  );
}
