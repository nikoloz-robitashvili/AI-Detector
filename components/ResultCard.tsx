
import React from 'react';
import { DetectionResult } from '../types';
import { ProbabilityGauge } from './ProbabilityGauge';
import { Info, CheckCircle, AlertTriangle, HelpCircle, Globe } from 'lucide-react';

interface Props {
  result: DetectionResult;
}

export const ResultCard: React.FC<Props> = ({ result }) => {
  const isTooShort = result.is_ai_generated === null;
  const isAI = result.is_ai_generated === true;

  // Check if summary contains Georgian characters
  const isGeorgian = /[\u10A0-\u10FF]/.test(result.analysis_summary);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-4 gap-4">
            <div className="flex items-center gap-3">
              {isTooShort ? (
                <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              ) : isAI ? (
                <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-500 dark:text-green-400" />
              )}
              <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
                {isTooShort ? 'Result Inconclusive' : isAI ? 'AI Presence Detected' : 'Likely Human-Written'}
              </h2>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full">
              <Globe className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                {result.detected_language}
              </span>
            </div>
          </div>

          <p className={`text-slate-600 dark:text-slate-200 text-lg leading-relaxed mb-8 ${isGeorgian ? 'font-normal leading-loose' : 'italic'}`}>
            "{result.analysis_summary}"
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Confidence</span>
              <span className={`text-sm font-bold capitalize ${
                result.confidence_level === 'high' ? 'text-green-600 dark:text-green-400' :
                result.confidence_level === 'medium' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {result.confidence_level} Level
              </span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Context Engine</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Veritas v2.1</span>
            </div>
          </div>
        </div>

        {!isTooShort && (
          <div className="w-full md:w-64 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-6 md:pt-0 md:pl-8 min-w-0">
            <ProbabilityGauge probability={result.ai_probability_percent || 0} />
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <Info className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Detection is based on probabilistic analysis of {result.detected_language} syntax and patterns.
        </span>
      </div>
    </div>
  );
};
