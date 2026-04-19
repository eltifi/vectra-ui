import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface CapacityChartProps {
  data: {
    scenario: string;
    throughput: number;
  }[];
}

const CapacityChart: React.FC<CapacityChartProps> = ({ data }) => {
  return (
    <div className="w-full h-48 mt-4 bg-slate-900/50 rounded-lg p-2 border border-slate-700">
      <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
        Throughput Capacity (vph)
      </h4>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="scenario" 
            stroke="#94a3b8" 
            fontSize={10} 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={10} 
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '4px', fontSize: '11px' }}
            itemStyle={{ color: '#f8fafc' }}
          />
          <Bar dataKey="throughput" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.scenario.toLowerCase().includes('contra') ? '#38bdf8' : '#64748b'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CapacityChart;
