import React, { useState, useEffect, useRef } from 'react';
import { Bot, Play, CheckCircle2, ShoppingCart, ShieldCheck, Activity, Search, ShieldAlert, CreditCard, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { SystemPipeline } from './SystemPipeline';

const QUICK_EXAMPLES = [
  "Sony WH-1000XM5 headphones, budget $350 max",
  "Latest iPhone 16 Pro, 256GB, best price",
  "Nike Air Max running shoes under $150",
  "4K gaming monitor, 144Hz, under $600"
];

const NAV_STEPS = [
  { id: 1, label: 'Intent' },
  { id: 2, label: 'Discovery' },
  { id: 3, label: 'Risk Score' },
  { id: 4, label: 'Selection' },
  { id: 5, label: 'Initiate Intent' },
  { id: 6, label: 'Payment Token' },
  { id: 7, label: 'Confirm' }
];

export default function AgenticDashboard() {
  const [intentString, setIntentString] = useState("");
  const [activeStep, setActiveStep] = useState(0); // 0 means not started
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMisaligned, setIsMisaligned] = useState(false);
  const [showMisalignmentPopup, setShowMisalignmentPopup] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [purchases, setPurchases] = useState<{item: string, price: string, merchant: string, date: string}[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  // Derived intent data
  let parsedProduct = "Requested Item";
  let parsedBudget = "Flexible";
  let parsedCategory = "General";
  
  const lowerIntent = intentString.toLowerCase();
  if (lowerIntent.includes("sony") || lowerIntent.includes("headphone")) {
    parsedProduct = "Sony WH-1000XM5 headphones";
    parsedCategory = "Audio";
    parsedBudget = "$350";
  } else if (lowerIntent.includes("iphone")) {
    parsedProduct = "iPhone 16 Pro, 256GB";
    parsedCategory = "Electronics";
    parsedBudget = "Market Price";
  } else if (lowerIntent.includes("shoe") || lowerIntent.includes("nike")) {
    parsedProduct = "Nike Air Max running shoes";
    parsedCategory = "Footwear";
    parsedBudget = "$150";
  } else if (lowerIntent.includes("monitor")) {
    parsedProduct = "4K gaming monitor, 144Hz";
    parsedCategory = "Computers";
    parsedBudget = "$600";
  } else if (intentString.length > 5) {
    parsedProduct = intentString;
    parsedCategory = "General Store";
  }

  const getDynamicMerchants = (intent: string) => {
    const words = intent.replace(/[^a-zA-Z\s]/g, '').split(' ').filter(w => w.length > 3 && !['with', 'under', 'from', 'that', 'this'].includes(w.toLowerCase()));
    
    // Fallbacks if no good words found
    const keyword = words.length > 0 
      ? words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase()
      : 'Global';
      
    const keyword2 = words.length > 1 
      ? words[1].charAt(0).toUpperCase() + words[1].slice(1).toLowerCase()
      : 'Tech';

    const templates = [
      `${keyword}Pro`,
      `Prime${keyword}`,
      `${keyword}Hub`,
      `${keyword2}Direct`,
      `Quick${keyword}`
    ];

    return templates.map((name, i) => {
      const risk = i === 0 ? Math.floor(8 + Math.random() * 5) : (i * 15 + Math.floor(Math.random() * 15));
      return {
        id: name.substring(0, 2).toUpperCase() + i,
        name,
        risk,
        status: i === 0 ? 'Visa Verified' : risk < 40 ? 'Pending Review' : 'Unverified',
        warn: risk > 65 ? 'Suspicious activity detected' : risk > 35 ? 'Recent chargeback spike' : undefined,
        selected: i === 0
      }
    });
  };

  const merchants = React.useMemo(() => {
    return getDynamicMerchants(intentString || parsedProduct);
  }, [intentString, parsedProduct]); // Re-generate on new intent

  const loadPastPurchase = (p: {item: string, price: string, merchant: string, date: string}) => {
    setIntentString(p.item);
    setActiveStep(8);
    setIsProcessing(false);
  };

  const startFlow = async (overrideIntent?: string) => {
    const activeIntent = overrideIntent || intentString;
    if (!activeIntent) return;
    setIsProcessing(true);
    setActiveStep(1);

    const isCoffeeWeek = activeIntent.toLowerCase().includes('coffee') && activeIntent.toLowerCase().includes('week') && !activeIntent.toLowerCase().includes('do not');
    setIsMisaligned(isCoffeeWeek);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const delay = (ms: number) => new Promise(resolve => {
      const timeout = setTimeout(resolve, ms);
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
      });
    });

    try {
      await delay(2000);
      if (signal.aborted) return;
      setActiveStep(2); // Step 2: Discovery

      await delay(2000);
      if (signal.aborted) return;
      setActiveStep(3); // Step 3: Risk Score

      await delay(2000);
      if (signal.aborted) return;
      setActiveStep(4); // Step 4: Selection

      await delay(2000);
      if (signal.aborted) return;
      setActiveStep(5); // Step 5: Initiate Intent

      await delay(2000);
      if (signal.aborted) return;
      setActiveStep(6); // Step 6: Payment Token & AMIR Assessment

      // Pause flow right after displaying AMIR if misaligned
      if (isCoffeeWeek) {
        setIsProcessing(false);
        setShowMisalignmentPopup(true);
        return; 
      }

      await delay(2000);
      if (signal.aborted) return;
      setActiveStep(7);

      await delay(2000);
      if (signal.aborted) return;
      setActiveStep(8);
      
      setIsProcessing(false);
      setPurchases(prev => [{
        item: parsedProduct,
        price: parsedBudget === 'Flexible' || parsedBudget === 'Market Value' ? '$349.00' : parsedBudget,
        merchant: merchants[0].name,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }, ...prev]);
    } catch (e) {
      // Aborted
    }
  };

  useEffect(() => {
    if (endRef.current && activeStep > 0) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeStep]);

  return (
    <div className="flex h-screen w-full bg-[#f8f9fc] font-sans overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-[360px] bg-slate-950 text-slate-300 flex flex-col shadow-[10px_0_40px_rgba(0,0,0,0.1)] z-20 shrink-0 border-r border-slate-800/50">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-widest uppercase">AI Agent</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Describe what you want to buy. The agent securely negotiates and purchases via Visa Network.
          </p>
        </div>
        
        <div className="p-6 pt-4 flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-b from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
              <textarea 
                className="relative w-full h-32 bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 shadow-inner font-medium transition-all"
                placeholder="e.g. Sony WH-1000XM5 headphones, budget $350..."
                value={intentString}
                onChange={(e) => setIntentString(e.target.value)}
                disabled={isProcessing || activeStep > 0}
              />
            </div>

            {activeStep === 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {QUICK_EXAMPLES.map((ex, i) => (
                    <button 
                      key={i}
                      className="text-left text-[11px] bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg py-2 px-3 text-slate-300 transition-colors leading-tight hover:text-white"
                      onClick={() => setIntentString(ex)}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              disabled={!intentString || isProcessing || activeStep > 0}
              onClick={() => {
                if (abortControllerRef.current) abortControllerRef.current.abort();
                startFlow();
              }}
              className="w-full relative group disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden rounded-xl mt-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:opacity-90 transition-opacity" />
              <div className="relative flex items-center justify-center gap-2 py-3.5 px-4 font-bold text-white tracking-wide shadow-xl">
                <ShoppingCart className="w-4 h-4" />
                {isProcessing ? "Purchase in Progress..." : activeStep > 0 ? "Purchase Complete" : "Buy for Me"}
              </div>
            </button>
            
            {activeStep >= 8 && !isProcessing && (
              <button 
                onClick={() => {
                  setActiveStep(0);
                  setIntentString("");
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-700"
              >
                Start New Session
              </button>
            )}
          </div>

          {/* Purchase History */}
          {purchases.length > 0 && (
            <div className="mt-2 text-slate-400">
               <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4 text-slate-500">Wallet History</h3>
               <div className="space-y-3">
                 {purchases.map((p, i) => (
                   <button 
                     key={i} 
                     onClick={() => loadPastPurchase(p)}
                     className="w-full text-left bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-3.5 transition-all cursor-pointer relative overflow-hidden group shadow-md"
                   >
                     <div className="absolute top-0 left-0 w-1 h-full bg-slate-800 group-hover:bg-blue-500 transition-colors" />
                     <div className="flex justify-between items-start mb-1.5 pl-2">
                        <div className="text-sm font-semibold text-slate-200 line-clamp-1 truncate pr-2">{p.item}</div>
                        <div className="text-emerald-400 font-bold text-sm shrink-0">{p.price}</div>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-medium text-slate-500 pl-2">
                        <span>{p.merchant}</span>
                        <span>{p.date}</span>
                     </div>
                   </button>
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#f8fafc] relative h-full overflow-hidden">
        {/* Top Navigation */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 h-16 flex items-center px-8 shrink-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar w-full">
            {NAV_STEPS.map((step, idx) => {
              const isPast = activeStep >= step.id;
              const isCurrent = activeStep === step.id;
              return (
                <div key={idx} className="flex items-center gap-2 shrink-0">
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] border font-bold transition-all",
                    isPast 
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : isCurrent
                      ? "bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/20 animate-pulse"
                      : "border-slate-300 text-slate-400 bg-slate-50"
                  )}>
                    {isPast ? <Check className="w-3 h-3" /> : step.id}
                  </div>
                  <span className={cn(
                    "text-xs font-bold tracking-wide uppercase transition-colors text-[10px]",
                    isPast ? "text-emerald-600" : isCurrent ? "text-blue-600" : "text-slate-400"
                  )}>
                    {step.label}
                  </span>
                  {idx < NAV_STEPS.length - 1 && (
                    <div className={cn(
                      "w-12 h-[2px] ml-4 transition-colors rounded-full",
                      isPast ? "bg-emerald-200" : "bg-slate-200"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable Flow Area */}
        <div className="flex-1 overflow-y-auto p-8 relative scroll-smooth custom-scrollbar">
          {activeStep === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
               <div className="relative mb-8 group">
                 <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors"></div>
                 <div className="w-20 h-20 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center justify-center relative z-10 transform group-hover:scale-105 transition-transform">
                   <Bot className="w-10 h-10 text-blue-600" />
                 </div>
               </div>
               <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Ready to Purchase</h2>
               <p className="text-slate-500 max-w-sm text-sm leading-relaxed mb-8 font-medium">
                 Enter your intent to let our secure AI agent handle negotiation, fraud checks, and final payment automatically.
               </p>
               <div className="flex gap-3">
                 {['Risk Scoring', 'AMIR Evaluation', 'Visa Secure Token'].map((t) => (
                   <span key={t} className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200/60 text-[10px] font-bold tracking-wider uppercase text-slate-500 shadow-sm">{t}</span>
                 ))}
               </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto pb-32 relative">
              <div className="absolute left-8 top-10 bottom-10 w-0.5 bg-slate-200/80 rounded-full" />
              <div className="space-y-8 relative z-10">
              
              {/* Step 1: Intent */}
              <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="relative pl-16 group">
                <div className="absolute left-[24px] top-6 w-4 h-4 bg-white rounded-full border-[3px] border-blue-500 shadow-[0_0_0_4px_#f8fafc] group-hover:scale-125 transition-transform" />
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100/60 flex items-center justify-between">
                     <h3 className="text-sm font-bold text-slate-800">Understanding Purchase Intent</h3>
                     {activeStep > 1 && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold tracking-wider uppercase">Verified</span>}
                  </div>
                  <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/30">
                    <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-4">
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Search className="w-3 h-3"/> Product</div>
                       <div className="text-sm font-semibold text-slate-800 truncate">{parsedProduct}</div>
                    </div>
                    <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-4">
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</div>
                       <div className="text-sm font-semibold text-slate-800">{parsedCategory}</div>
                    </div>
                    <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-4">
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Budget</div>
                       <div className="text-sm font-semibold text-emerald-600">{parsedBudget}</div>
                    </div>
                    <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-4">
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Priority</div>
                       <div className="text-sm font-semibold text-slate-800">Best Match</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 2 & 3: Discovery & Risk */}
              {activeStep >= 2 && (
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="relative pl-16 group">
                  <div className="absolute left-[24px] top-6 w-4 h-4 bg-white rounded-full border-[3px] border-blue-500 shadow-[0_0_0_4px_#f8fafc] group-hover:scale-125 transition-transform" />
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100/60 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800">Merchant Discovery & Risk Assessment</h3>
                      {activeStep > 3 && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold tracking-wider uppercase">Verified</span>}
                    </div>
                    
                    <div className="p-6 bg-slate-50/30">
                      <p className="text-xs text-slate-600 mb-4 font-mono font-medium flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-blue-500" /> Scanning Visa merchant network...
                      </p>
                      <div className="flex gap-4 mb-8 overflow-x-auto hide-scrollbar pb-2">
                        {merchants.map((m) => (
                          <div key={m.id} className="min-w-[100px] flex-1 border border-slate-200/80 rounded-xl p-3 text-center bg-white shadow-sm flex flex-col items-center justify-center py-4 hover:border-blue-400/30 transition-colors">
                             <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center mb-2">{m.id}</div>
                             <div className="text-[10px] font-bold text-slate-600 truncate w-full">{m.name}</div>
                          </div>
                        ))}
                      </div>

                      {activeStep >= 3 && (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
                          <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-5 mb-8 flex items-center justify-between relative overflow-hidden">
                             <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-emerald-100/50 to-transparent pointer-events-none" />
                             <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-full border-4 border-emerald-100 flex flex-col items-center justify-center bg-white shrink-0 shadow-sm relative z-10">
                                   <span className="text-xl font-black text-emerald-600">9</span>
                                   <span className="text-[8px] text-slate-400 font-bold">/ 100</span>
                                </div>
                                <div className="relative z-10">
                                   <div className="flex items-center gap-2 mb-1.5">
                                      <h4 className="text-sm font-bold text-slate-800">Merchant Discoverability Risk</h4>
                                      <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-200 text-emerald-800">LOW RISK</span>
                                   </div>
                                   <p className="text-xs text-slate-600 max-w-xl leading-relaxed">Evaluating physical and digital signals. No abusive synthetic listing practices detected for this target.</p>
                                </div>
                             </div>
                             <ShieldCheck className="w-12 h-12 text-emerald-200 absolute right-6 opacity-50" />
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between px-2 mb-2">
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidate</span>
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Risk Profile</span>
                            </div>
                            {merchants.map((m, idx) => (
                              <div key={m.id} className={cn("flex items-center justify-between p-4 rounded-xl border transition-all", m.selected ? "border-emerald-300 bg-emerald-50/40 shadow-sm" : "border-slate-200/60 bg-white")}>
                                 <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">{m.id}</div>
                                    <div>
                                       <div className="flex items-center gap-2 mb-0.5">
                                         <span className={cn("text-sm font-bold", m.selected ? "text-emerald-700" : "text-slate-700")}>{m.name}</span>
                                         {m.selected && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold tracking-wider">SELECTED</span>}
                                       </div>
                                       <div className="text-[10px] font-medium text-slate-500 flex items-center gap-1.5">
                                         {m.selected && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />} {m.status} {m.warn && <span className="text-slate-300">• <span className="text-amber-500">{m.warn}</span></span>}
                                       </div>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                      <div className={cn("h-full transition-all duration-1000", m.risk < 20 ? "bg-emerald-500" : m.risk < 50 ? "bg-amber-400" : "bg-red-500")} style={{width: `${m.risk}%`}} />
                                    </div>
                                    <span className="text-xs font-mono font-bold w-6 text-right text-slate-600">{m.risk}</span>
                                 </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Initiate Intent */}
              {activeStep >= 4 && (
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="relative pl-16 group">
                  <div className="absolute left-[24px] top-6 w-4 h-4 bg-white rounded-full border-[3px] border-blue-500 shadow-[0_0_0_4px_#f8fafc] group-hover:scale-125 transition-transform" />
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100/60 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800">Register Intent with Visa</h3>
                      {activeStep > 4 && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold tracking-wider uppercase">Verified</span>}
                    </div>
                  
                  <div className="p-6 bg-slate-50/30">
                     <div className="flex items-center justify-center gap-10 py-8">
                       <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 text-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10">
                             <Bot className="w-8 h-8" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">AI Agent</span>
                       </div>
                       
                       <div className="flex-1 max-w-[280px] relative">
                          <div className="h-2 bg-slate-200/60 rounded-full w-full overflow-hidden shadow-inner">
                             <motion.div 
                               initial={{ x: '-100%' }} 
                               animate={{ x: '100%' }} 
                               transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                               className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 w-1/2 rounded-full" 
                             />
                          </div>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-600 uppercase tracking-widest whitespace-nowrap bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                            Secure Context Sync
                          </div>
                       </div>

                       <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 text-white flex items-center justify-center mb-4 shadow-lg shadow-slate-900/20">
                             <ShieldCheck className="w-8 h-8 text-emerald-400" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Visa Network</span>
                       </div>
                     </div>

                     <div className="mt-2 bg-white rounded-xl p-5 border border-slate-200/60 flex items-center justify-between max-w-2xl mx-auto shadow-sm">
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Intent ID</div>
                          <div className="text-sm font-mono font-bold text-slate-700">int_wns688c</div>
                        </div>
                        <div className="w-px h-10 bg-slate-100" />
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Locked Amount</div>
                          <div className="text-sm font-bold text-slate-800">{parsedBudget === 'Flexible' || parsedBudget === 'Market Value' ? '$349.00' : parsedBudget}</div>
                        </div>
                        <div className="w-px h-10 bg-slate-100" />
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</div>
                          <div className="text-sm font-bold text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> SECURED</div>
                        </div>
                     </div>
                  </div>
                </div>
              </motion.div>
              )}

              {/* Step 5: Retrieve Token */}
              {activeStep >= 5 && (
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="relative pl-16 group">
                  <div className="absolute left-[24px] top-6 w-4 h-4 bg-white rounded-full border-[3px] border-blue-500 shadow-[0_0_0_4px_#f8fafc] group-hover:scale-125 transition-transform" />
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100/60 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800">Dynamic Payment Tokenization</h3>
                      {activeStep > 5 && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold tracking-wider uppercase">Verified</span>}
                    </div>
                  <div className="p-6 bg-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Token Card */}
                      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group/card transform hover:-translate-y-1 transition-transform">
                         <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] bg-[length:16px_16px] pointer-events-none" />
                         <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none" />
                         <CreditCard className="w-8 h-8 text-blue-300 mb-6" />
                         <div className="text-[10px] text-blue-200/80 tracking-[0.2em] uppercase mb-1.5 font-semibold">Single-Use Agent Token</div>
                         <div className="text-xl md:text-2xl font-mono tracking-widest mb-8 text-blue-50 drop-shadow-sm font-medium">4111 •••• •••• 1234</div>
                         <div className="flex items-end justify-between relative z-10">
                           <div className="space-y-1">
                             <div className="text-[9px] text-blue-300/80 uppercase tracking-widest">Valid For</div>
                             <div className="text-sm font-bold text-white">1 Transaction</div>
                           </div>
                           <div className="text-right space-y-1">
                             <div className="text-[9px] text-blue-300/80 uppercase tracking-widest">Cryptogram Type</div>
                             <div className="text-sm font-bold text-emerald-400">ARQC Validated</div>
                           </div>
                         </div>
                      </div>

                      {/* Fraud Score */}
                      <div className="border border-slate-200/60 rounded-2xl p-6 bg-white flex flex-col justify-center shadow-sm">
                         <div className="flex items-start gap-5">
                            <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-r-emerald-100 flex items-center justify-center shrink-0 shadow-sm relative">
                               <div className="absolute inset-2 border border-emerald-100 rounded-full" />
                               <span className="text-2xl font-black text-emerald-600">6</span>
                            </div>
                            <div>
                               <div className="flex items-center gap-2 mb-2">
                                  <h4 className="text-sm font-bold text-slate-800">Contextual Fraud Risk</h4>
                                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                               </div>
                               <p className="text-xs text-slate-500 mb-4 leading-relaxed">Real-time evaluation of device, behavioral, and network signals tailored specifically for automated agent purchases.</p>
                               <span className="px-3 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200 shadow-sm">Low Risk • Approved</span>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              )}

              {/* Step 6 & 7: Processing & Confirmation */}
              {activeStep >= 6 && (
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="relative pl-16 group">
                  <div className="absolute left-[24px] top-6 w-4 h-4 bg-white rounded-full border-[3px] border-emerald-500 shadow-[0_0_0_4px_#f8fafc] group-hover:scale-125 transition-transform" />
                  <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100/60 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800">Final Verification & Processing</h3>
                      {activeStep >= 7 && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold tracking-wider uppercase">Verified</span>}
                    </div>
                  
                  <div className="p-6 bg-slate-50/30">
                    {/* AMIR Assessment */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agent Misalignment Risk Score</h4>
                        <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider", isMisaligned ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800")}>Model: AMIR</span>
                      </div>
                      
                      <div className={cn("flex items-center justify-between bg-white border rounded-2xl p-5 shadow-sm transition-colors", isMisaligned ? "border-red-200" : "border-slate-200/80")}>
                        <div className="flex items-center gap-5">
                          <div className={cn("w-14 h-14 rounded-full border shadow-inner flex items-center justify-center shrink-0", isMisaligned ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100")}>
                            <Activity className={cn("w-6 h-6", isMisaligned ? "text-red-500" : "text-emerald-600")} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800 mb-1">
                              {isMisaligned ? "Score: 92/100 (High Risk)" : "Score: 22/100 (Low Risk)"}
                            </div>
                            <div className="text-xs text-slate-500 max-w-md leading-relaxed">
                              {isMisaligned 
                                ? "Agent misinterpreted the intent. User requested a specific set of items, but the agent initiated a different type of transaction (e.g. recurring subscription)." 
                                : "Agent acted strictly within cardholder boundaries. No scope creep, unprompted upselling, or unauthorized external actions detected."}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-3 items-end">
                           <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                             {isMisaligned ? <ShieldAlert className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />} 
                             {isMisaligned ? "Intent Mismatch" : "Intent Matched"}
                           </div>
                           <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                             {isMisaligned ? <ShieldAlert className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />} 
                             {isMisaligned ? "Scope Creep Detected" : "Budget Respected"}
                           </div>
                        </div>
                      </div>
                    </div>

                    {activeStep === 6 ? (
                       <div className="flex flex-col items-center justify-center py-16 border border-slate-200/80 rounded-2xl bg-white shadow-sm">
                          <div className="relative mb-6">
                            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                            <div className="w-16 h-16 bg-blue-50 rounded-full border border-blue-100 flex items-center justify-center relative z-10 shadow-inner">
                              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                          </div>
                          <div className="text-lg font-bold text-slate-800 mb-2">Processing Payment securely...</div>
                          <p className="text-sm text-slate-500 font-medium">Visa Intelligent Commerce is finalizing the transaction.</p>
                       </div>
                    ) : (
                       <motion.div initial={{opacity:0, scale:0.95, y:20}} animate={{opacity:1, scale:1, y:0}} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-2xl p-8 relative overflow-hidden mt-6 text-white shadow-xl">
                           {/* Cinematic background elements */}
                           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
                           <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-black/20 rounded-full blur-2xl pointer-events-none" />
                           
                           <div className="flex flex-col md:flex-row items-start md:items-center gap-8 z-10 relative">
                             <div className="w-20 h-20 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-lg relative">
                                <motion.div 
                                  initial={{ scale: 0 }} 
                                  animate={{ scale: 1 }} 
                                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                >
                                  <CheckCircle2 className="w-10 h-10" />
                                </motion.div>
                                <div className="absolute inset-0 rounded-full border-4 border-emerald-400 opacity-50 animate-ping" />
                             </div>
                             
                             <div className="w-full">
                                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Purchase Complete</h3>
                                <p className="text-emerald-50 text-sm mb-6 max-w-xl font-medium leading-relaxed">
                                  Your AI Agent has successfully secured this transaction through Visa. A digital receipt has been generated.
                                </p>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/20 backdrop-blur-md p-5 rounded-xl border border-white/10 shadow-inner">
                                  <div>
                                    <div className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest mb-1.5">Item Procured</div>
                                    <div className="text-sm font-bold text-white line-clamp-2 leading-tight" title={parsedProduct}>{parsedProduct}</div>
                                  </div>
                                  <div>
                                    <div className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest mb-1.5">Merchant</div>
                                    <div className="text-sm font-bold text-white">{merchants[0].name}</div>
                                  </div>
                                  <div>
                                    <div className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest mb-1.5">Total Paid</div>
                                    <div className="text-xl font-black text-white leading-none mt-1">{parsedBudget === 'Flexible' || parsedBudget === 'Market Value' ? '$349.00' : parsedBudget}</div>
                                  </div>
                                  <div>
                                    <div className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest mb-1.5">Receipt ID</div>
                                    <div className="text-sm font-mono font-bold text-emerald-100">#VISA-GFDQ9</div>
                                  </div>
                                </div>
                             </div>
                           </div>
                       </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
              )}

              <div ref={endRef} className="h-4" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Intelligent Commerce System Pipeline */}
      <SystemPipeline 
        activeStep={activeStep}
        parsedProduct={parsedProduct}
        parsedCategory={parsedCategory}
        parsedBudget={parsedBudget}
        isProcessing={isProcessing}
        merchant={merchants[0]}
      />

      {/* AMIR Misalignment Popup */}
      <AnimatePresence>
        {showMisalignmentPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl border border-red-200 w-full max-w-lg overflow-hidden relative z-10">
              <div className="p-6 border-b border-red-100 bg-red-50/50 flex gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex flex-col items-center justify-center shrink-0 border border-red-200">
                  <ShieldAlert className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight mb-1">Agent Misunderstood Intent</h3>
                  <p className="text-sm font-medium text-slate-600">AMIR model detected a severe intent mismatch (Score: 92/100).</p>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-6">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Original Request</div>
                  <div className="text-sm font-medium text-slate-700 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">"{intentString}"</div>
                  
                  <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Agent Action Executed</div>
                  <div className="text-sm font-bold text-red-700 bg-red-50 p-3 rounded-lg border border-red-100 shadow-inner">Initiated recurring weekly subscription</div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      setShowMisalignmentPopup(false);
                      setIsProcessing(true);
                      
                      const resumeFlow = async () => {
                        const signal = abortControllerRef.current?.signal;
                        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
                        await delay(2000);
                        if (signal?.aborted) return;
                        setActiveStep(7);
                        await delay(2000);
                        if (signal?.aborted) return;
                        setActiveStep(8);
                        setIsProcessing(false);
                        setPurchases(prev => [{
                          item: parsedProduct,
                          price: parsedBudget === 'Flexible' || parsedBudget === 'Market Value' ? '$349.00' : parsedBudget,
                          merchant: merchants[0].name,
                          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }, ...prev]);
                      };
                      resumeFlow();
                    }}
                    className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl transition-colors shadow-sm"
                  >
                    Approve Transaction Anyway
                  </button>
                  
                  <button 
                    onClick={() => {
                      setShowMisalignmentPopup(false);
                      setActiveStep(0);
                      setIsProcessing(false);
                    }}
                    className="w-full bg-white hover:bg-red-50 border border-red-200 text-red-600 font-bold py-3.5 px-4 rounded-xl transition-colors shadow-sm"
                  >
                    Decline Transaction
                  </button>
                  
                  <button 
                    onClick={() => {
                      setShowMisalignmentPopup(false);
                      setActiveStep(0);
                      setIsProcessing(false);
                      const correctedIntent = intentString + " (One-time purchase, do NOT subscribe)";
                      setIntentString(correctedIntent);
                      // Adding slight delay to let state render cycle complete if needed
                      setTimeout(() => startFlow(correctedIntent), 50);
                    }}
                    className="w-full relative group overflow-hidden rounded-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:opacity-90 transition-opacity" />
                    <div className="relative flex items-center justify-center gap-2 py-3.5 px-4 font-bold text-white tracking-wide shadow-xl">
                      <Bot className="w-4 h-4" />
                      Correct Intent & Restart
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

