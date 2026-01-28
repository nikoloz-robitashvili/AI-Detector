
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  probability: number;
}

export const ProbabilityGauge: React.FC<Props> = ({ probability }) => {
  const data = [
    { value: probability },
    { value: 100 - probability },
  ];

  const getColor = (prob: number) => {
    if (prob < 20) return '#22c55e'; // Green
    if (prob < 50) return '#eab308'; // Yellow
    if (prob < 80) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <div className="relative w-full min-h-[180px] min-w-[200px] flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full h-40">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              isAnimationActive={true}
            >
              <Cell fill={getColor(probability)} />
              <Cell fill="currentColor" className="text-slate-100 dark:text-slate-800" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="absolute bottom-4 inset-x-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{Math.round(probability)}%</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-black tracking-[0.2em] mt-1">AI Score</span>
      </div>
    </div>
  );
};
