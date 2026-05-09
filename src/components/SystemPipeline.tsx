import React, { useEffect, useRef, useState } from 'react';
import { Activity, ChevronRight, ChevronLeft, Server, ArrowRightLeft, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const renderHighlighted = (text: string, isRes: boolean) => {
  if (!text) return null;
  const parts = text.split('\n');
  const highlighted = parts.map((line) => {
    if (line.trim().startsWith('//')) {
      return `<span class="text-slate-500 italic">${line}</span>`;
    }
    const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'text-sky-300'; 
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = isRes ? 'text-emerald-400 font-semibold' : 'text-indigo-300 font-semibold';
        } else {
          cls = isRes ? 'text-emerald-200' : 'text-sky-200'; 
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-amber-300'; 
      }
      return `<span class="${cls}">${match}</span>`;
    });
  }).join('\n');
  
  return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
};

interface SystemPipelineProps {
  activeStep: number;
  parsedProduct: string;
  parsedCategory: string;
  parsedBudget: string;
  isProcessing: boolean;
  merchant?: { id: string; name: string; risk: number };
}

export function SystemPipeline({ activeStep, parsedProduct, parsedCategory, parsedBudget, isProcessing, merchant }: SystemPipelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<Record<string, 'req' | 'res'>>({});
  const [expandedPayloads, setExpandedPayloads] = useState<Record<string, boolean>>({});

  const togglePayloadExpand = (id: string) => {
    setExpandedPayloads(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTab = (id: string, tab: 'req' | 'res') => {
    setActiveTab(prev => ({ ...prev, [id]: tab }));
  };

  const getTab = (id: string) => activeTab[id] || 'req';

  const [sessionId, setSessionId] = useState(1);
  const prevStepRef = useRef(activeStep);
  const [globalEvents, setGlobalEvents] = useState<any[]>([]);
  // Metrics state
  const [metrics, setMetrics] = useState({
    agents: 1245082,
    alignment: 98.2,
    sessions: 24082,
    value: 4105000000
  });

  // Random metric fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        agents: prev.agents + Math.floor(Math.random() * 3),
        sessions: prev.sessions + Math.floor(Math.random() * 5) - 2,
        value: prev.value + Math.floor(Math.random() * 5000)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeStep === 0 && prevStepRef.current > 0) {
      setSessionId(s => s + 1);
    }
    prevStepRef.current = activeStep;
  }, [activeStep]);

  useEffect(() => {
    const evts = [];
    if (activeStep >= 1) {
      evts.push({
        id: `${sessionId}-intent`,
        title: 'Analyze Intent',
        method: 'POST',
        path: '/v1/agent/intent',
        reqPayload: `{\n  "agent_id": "agn_88d",\n  "raw_input": "...",\n  "parsed_context": {\n    "product": "${parsedProduct}",\n    "category": "${parsedCategory}",\n    "budget": "${parsedBudget}"\n  }\n}`,
        resPayload: `{\n  "intent_id": "int_${sessionId}wns6",\n  "status": "ANALYZED",\n  "confidence": 0.98\n}`
      });
    }
    if (activeStep >= 2 && merchant) {
      evts.push({
        id: `${sessionId}-merchant`,
        title: 'Merchant Discovery',
        method: 'GET',
        path: `/v1/merchants?category=${parsedCategory}`,
        reqPayload: `// Query Parameters\n{\n  "category": "${parsedCategory}",\n  "limit": 5,\n  "include_risk_data": true\n}`,
        resPayload: `{\n  "merchants": [\n    {"id": "${merchant.id}", "risk": ${merchant.risk}},\n    {"id": "PS", "risk": 14}\n  ],\n  "count": 5,\n  "status": "success"\n}`
      });
    }
    if (activeStep >= 3 && merchant) {
      evts.push({
        id: `${sessionId}-risk`,
        title: 'Contextual Risk Assessment',
        method: 'POST',
        path: '/v1/risk/merchant-abuse',
        reqPayload: `{\n  "merchant_id": "${merchant.id}",\n  "agent_id": "agn_88d",\n  "intent_id": "int_${sessionId}wns6",\n  "behavior_signals": [...]\n}`,
        resPayload: `{\n  "risk_score": ${merchant.risk},\n  "risk_level": "${merchant.risk < 20 ? 'LOW' : 'MEDIUM'}",\n  "reasons": ["Historical trust", "Verified inventory"]\n}`
      });
    }
    if (activeStep >= 4 && merchant) {
      evts.push({
        id: `${sessionId}-reg`,
        title: 'Register Intent',
        method: 'POST',
        path: '/v1/payment-intents',
        reqPayload: `{\n  "intent_id": "int_${sessionId}wns6",\n  "amount": 35000,\n  "currency": "USD",\n  "merchant_id": "${merchant.id}"\n}`,
        resPayload: `{\n  "intent_id": "int_${sessionId}wns6",\n  "status": "SECURED",\n  "locked_amount": 35000\n}`
      });
    }
    if (activeStep >= 5 && merchant) {
      evts.push({
        id: `${sessionId}-token`,
        title: 'Tokenization',
        method: 'POST',
        path: '/v1/payment-credentials',
        reqPayload: `{\n  "intent_id": "int_${sessionId}wns6",\n  "type": "SINGLE_USE_AGENT",\n  "merchant_id": "${merchant.id}"\n}`,
        resPayload: `{\n  "dpan": "4111********1234",\n  "type": "SINGLE_USE",\n  "arqc_validated": true,\n  "expires_in": 300\n}`
      });
    }
    if (activeStep >= 6) {
      evts.push({
        id: `${sessionId}-amir`,
        title: 'AMIR Evaluation',
        method: 'POST',
        path: '/v1/risk/amir',
        reqPayload: `{\n  "agent_id": "agn_88d",\n  "action": "PURCHASE",\n  "target_amount": 35000,\n  "user_boundaries": {...}\n}`,
        resPayload: `{\n  "alignment_score": 22,\n  "status": "APPROVED",\n  "flags": []\n}`
      });
    }
    if (activeStep >= 7 && !isProcessing && merchant) {
      evts.push({
        id: `${sessionId}-tx`,
        title: 'Transaction Event',
        method: 'POST',
        path: '/v1/transaction-events',
        reqPayload: `{\n  "dpan": "4111********1234",\n  "amount": 35000,\n  "merchant_id": "${merchant.id}",\n  "intent_id": "int_${sessionId}wns6"\n}`,
        resPayload: `{\n  "status": "COMPLETED",\n  "receipt": "#VISA-GFDQ${sessionId}",\n  "timestamp": "${new Date().toISOString()}"\n}`
      });
    }

    setGlobalEvents(prev => {
      const updated = [...prev];
      let changed = false;
      evts.forEach(ne => {
        if (!updated.find(e => e.id === ne.id)) {
          updated.push(ne);
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [activeStep, sessionId, merchant, parsedProduct, parsedCategory, parsedBudget, isProcessing]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [globalEvents.length, isExpanded, activeTab]);

  return (
    <motion.div 
      initial={false}
      animate={{ width: isExpanded ? 440 : 64 }}
      className="bg-slate-50 border-l border-slate-200/80 flex flex-col shrink-0 relative z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.05)]"
    >
      <div className="p-4 border-b border-slate-200/80 bg-white/80 backdrop-blur-md z-20 relative flex items-center justify-between shrink-0 shadow-sm">
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-hidden pr-4">
              <div className="text-[10px] uppercase tracking-widest text-blue-600 font-bold mb-1 flex items-center justify-between">
                <span>Intelligent Commerce</span>
                {activeStep > 0 && isProcessing && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[8px] font-bold text-slate-500">LIVE</span>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 whitespace-nowrap mb-4 tracking-tight">
                <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                Visa Network Operations
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-2">
                 <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-3 hover:border-blue-500/30 transition-colors">
                    <div className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Agents Secured</div>
                    <div className="text-lg font-mono font-black text-slate-800">
                      {(metrics.agents / 1000000).toFixed(2)}M+
                    </div>
                 </div>
                 <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-3 hover:border-blue-500/30 transition-colors">
                    <div className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Avg Alignment</div>
                    <div className="text-lg font-mono font-black text-emerald-600">
                       {metrics.alignment.toFixed(1)}%
                    </div>
                 </div>
              </div>
              
              <div className="bg-slate-900 rounded-xl p-3 mb-4 shadow-inner border border-slate-800">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                  <span>Visa Security Stack</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${activeStep >= (i * 2) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-700'}`} />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${activeStep >= 2 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                      <span className={`text-[10px] font-bold ${activeStep >= 2 ? 'text-slate-200' : 'text-slate-500'}`}>Merchant Risk Model</span>
                    </div>
                    {activeStep >= 3 && <span className="text-[8px] font-black text-emerald-400 uppercase">Passed</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${activeStep >= 4 ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`} />
                      <span className={`text-[10px] font-bold ${activeStep >= 4 ? 'text-slate-200' : 'text-slate-500'}`}>VIC Fraud Engine</span>
                    </div>
                    {activeStep >= 5 && <span className="text-[8px] font-black text-blue-400 uppercase">Secured</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${activeStep >= 6 ? (activeStep >= 6 && activeStep < 7 && activeStep !== 0 ? 'bg-red-400 animate-ping' : 'bg-emerald-500 animate-pulse') : 'bg-slate-700'}`} />
                      <span className={`text-[10px] font-bold ${activeStep >= 6 ? 'text-slate-200' : 'text-slate-500'}`}>AMIR Alignment Score</span>
                    </div>
                    {activeStep >= 7 && <span className="text-[8px] font-black text-emerald-400 uppercase">Validated</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                 <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-3">
                    <div className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Active Sessions</div>
                    <div className="text-lg font-mono font-bold text-slate-800 flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                       {metrics.sessions.toLocaleString()}
                    </div>
                 </div>
                 <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-3">
                     <div className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Protected Value</div>
                     <div className="text-lg font-mono font-bold text-blue-600">
                       ${(metrics.value / 1000000000).toFixed(2)}B
                     </div>
                 </div>
              </div>
              
              <div className="flex items-center gap-2 mt-4 text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2 border-b border-slate-200/80 pb-2">
                <Activity className="w-3 h-3 text-slate-400" /> Live Session Feed
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-8 h-8 absolute top-4 right-4 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0"
        >
          {isExpanded ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 relative hide-scrollbar mt-4 custom-scrollbar" ref={containerRef} style={{ display: isExpanded ? 'block' : 'none' }}>
        <div className="absolute left-[24px] top-6 bottom-6 w-px bg-slate-200" />
        
        <div className="space-y-6 relative z-10 w-[368px]">
          <AnimatePresence>
            {globalEvents.map((evt, idx) => {
              const tab = getTab(evt.id);
              return (
                <motion.div 
                  key={evt.id}
                  initial={{ opacity: 0, x: 20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="relative group"
                >
                  <div className="absolute top-2 -left-[24px] w-2.5 h-2.5 rounded-full border-[3px] border-blue-500 bg-white shadow-[0_0_0_2px_#f8fafc] z-10" />
                  <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-3.5 border-b border-slate-100/80 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800">{evt.title}</span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100/50">
                          {evt.method}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-1">
                        <Server className="w-3 h-3 text-slate-400" />
                        {evt.path}
                      </div>
                    </div>
                    
                    <div className="flex bg-slate-900 text-[9px] font-bold text-slate-400">
                      <button 
                        onClick={() => toggleTab(evt.id, 'req')}
                        className={`flex-1 py-2 text-center transition-colors ${tab === 'req' ? 'bg-slate-800 text-white' : 'hover:text-slate-200'}`}
                      >
                        REQUEST
                      </button>
                      <div className="w-px bg-slate-800" />
                      <button 
                        onClick={() => toggleTab(evt.id, 'res')}
                        className={`flex-1 py-2 text-center transition-colors ${tab === 'res' ? 'bg-slate-800 text-emerald-400' : 'hover:text-emerald-300'}`}
                      >
                        RESPONSE
                      </button>
                    </div>

                    <div className={`bg-slate-900 relative transition-all duration-300 ease-in-out ${expandedPayloads[evt.id] ? 'max-h-[500px]' : 'max-h-[80px]'} overflow-hidden flex flex-col`}>
                      <div className="p-3 pt-2 overflow-y-auto custom-scrollbar w-full">
                        <pre className="text-[10px] font-mono leading-relaxed whitespace-pre-wrap break-words w-full">
                          {renderHighlighted(tab === 'req' ? evt.reqPayload : evt.resPayload, tab === 'res')}
                        </pre>
                      </div>
                      {!expandedPayloads[evt.id] && (
                        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
                      )}
                    </div>
                    
                    <button 
                      onClick={() => togglePayloadExpand(evt.id)}
                      className="bg-slate-900 hover:bg-slate-800 border-t border-slate-800 py-2 flex items-center justify-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest transition-colors w-full z-10 relative cursor-pointer"
                    >
                      {expandedPayloads[evt.id] ? (
                        <>Collapse <ChevronUp className="w-3 h-3" /></>
                      ) : (
                        <>Expand <ChevronDown className="w-3 h-3" /></>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {globalEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <ArrowRightLeft className="w-8 h-8 mb-4 opacity-30 text-slate-400" />
              <div className="text-xs font-medium uppercase tracking-widest">Awaiting API traffic...</div>
            </div>
          )}
        </div>
      </div>
      
      {!isExpanded && (
        <div className="flex-1 overflow-hidden flex flex-col items-center py-6 gap-6">
          {globalEvents.map((evt, idx) => (
             <div key={evt.id} className="w-8 h-8 rounded-full bg-white border border-slate-200/80 shadow-sm flex items-center justify-center group relative">
               <div className="w-2 h-2 rounded-full bg-blue-500" />
               <div className="absolute left-10 py-1.5 px-2.5 rounded shadow-xl bg-slate-800 border border-slate-700 text-[10px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 font-medium">
                 {evt.title}
               </div>
             </div>
          ))}
          {activeStep > 0 && isProcessing && (
            <div className="w-8 h-8 rounded-full bg-white border border-slate-200/80 shadow-sm flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

