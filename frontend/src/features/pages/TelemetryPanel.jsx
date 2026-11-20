import React from 'react';
import { 
  X, ExternalLink, Sliders, Database, Layers, MinusCircle, FileText, Table 
} from 'lucide-react';

export default function TelemetryPanel({ onClose }) {
  const mountedObjects = [
    { name: 'Q3_Financial_Performance.pdf', size: '14,200 tokens • Chunked', type: 'pdf' },
    { name: 'user_retention_raw.csv', size: '8,840 tokens • Vectorized', type: 'csv' },
    { name: 'warehouse_schema_def.sql', size: '1,150 tokens • System DDL', type: 'sql' }
  ];

  const agentToolhooks = [
    { name: 'Python Sandbox (v3.11.4)', endpoint: 'docker://iso' },
    { name: 'Snowflake SQL Connector', endpoint: 'pool-03' },
    { name: 'FastVector pgvector Query', endpoint: 'indexed' },
    { name: 'Browser Playwright Scraper', endpoint: 'idle' }
  ];

  return (
    <aside className="w-80 bg-[#f4f2ec] border-l border-[#dedbd2] flex flex-col h-screen text-xs text-[#2c392e] overflow-y-auto shrink-0 select-none">
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-[#dad7cd] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-[#4a7c59]" />
          <h3 className="font-semibold text-sm text-[#1c241d]">Execution Telemetry</h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] bg-[#dbe8dc] text-[#34633f] px-2 py-0.5 rounded font-medium flex items-center gap-1">
            Live Link <ExternalLink size={10} />
          </span>
          <button onClick={onClose} className="p-1 hover:bg-[#dedbd2] text-[#637365] rounded-md transition-colors ml-1">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-around border-b border-[#dad7cd] text-[11px] text-[#637365] font-medium bg-[#ece9e1]">
        <button className="py-2 border-b-2 border-[#4a7c59] text-[#1c241d] flex-1 text-center">
          Context & Files
        </button>
        <button className="py-2 hover:text-[#1c241d] flex-1 text-center">
          KV Memory
        </button>
        <button className="py-2 hover:text-[#1c241d] flex-1 text-center">
          Hyperparams
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Resource Utilization */}
        <div className="bg-[#eae7de] p-3 rounded-xl border border-[#dad7ce] space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-[#1c241d]">Resource Utilization</span>
            <span className="text-[10px] text-[#4a7c59] font-medium">Active Load</span>
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-[#637365] mb-1">
              <span>Token Window</span>
              <span>24,190 / 128,000 (18.9%)</span>
            </div>
            <div className="w-full h-1.5 bg-[#dcd8ce] rounded-full overflow-hidden">
              <div className="w-[18.9%] h-full bg-[#4a7c59] rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="bg-[#dedbd1] p-2 rounded-lg">
              <p className="text-[#637365]">Session Incurred</p>
              <p className="font-semibold text-sm text-[#1c241d]">$0.0412</p>
            </div>
            <div className="bg-[#dedbd1] p-2 rounded-lg">
              <p className="text-[#637365]">Tools Dispatched</p>
              <p className="font-semibold text-sm text-[#1c241d]">4 Operations</p>
            </div>
          </div>
        </div>

        {/* Agent Identity Profile */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-[#1c241d]">Agent Identity Profile</span>
            <span className="text-[10px] text-[#738375]">v24.4</span>
          </div>
          <p className="text-[11px] text-[#556658] leading-relaxed">
            Aura Autonomous Financial Auditor: Instructed to execute double-entry verification on vector indices before returning user reports.
          </p>
          <div className="flex justify-between items-center text-[11px] text-[#637365] pt-1">
            <span>Temperature: <strong>0.15 (Deterministic)</strong></span>
            <button className="text-[#4a7c59] hover:underline">Inspect Prompt</button>
          </div>
        </div>

        {/* Mounted Context Objects */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-[#1c241d]">MOUNTED CONTEXT OBJECTS</span>
            <span className="text-[10px] text-[#738375]">3 Mounted</span>
          </div>
          <div className="space-y-1.5">
            {mountedObjects.map((obj, i) => (
              <div key={i} className="flex items-center justify-between bg-[#eae7de] p-2 rounded-lg border border-[#dad7ce]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded bg-[#dedbd1] text-[#4a7c59]">
                    {obj.type === 'pdf' ? <FileText size={14} /> : <Table size={14} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#1c241d] truncate text-[11px]">{obj.name}</p>
                    <p className="text-[10px] text-[#637365]">{obj.size}</p>
                  </div>
                </div>
                <button className="text-[#738375] hover:text-[#d9383a]">
                  <MinusCircle size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Available Agent Toolhooks */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-[#1c241d]">Available Agent Toolhooks</span>
            <span className="text-[10px] text-[#4a7c59] font-medium">Active</span>
          </div>
          <div className="space-y-1.5 font-mono text-[11px]">
            {agentToolhooks.map((tool, i) => (
              <div key={i} className="flex justify-between items-center py-1 px-1.5 hover:bg-[#eae7de] rounded transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4a7c59]" />
                  <span className="text-[#2c392e] font-sans">{tool.name}</span>
                </div>
                <span className="text-[#738375] text-[10px]">{tool.endpoint}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
