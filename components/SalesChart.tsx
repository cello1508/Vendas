import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sale } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SalesChartProps {
  sales: Sale[];
}

export const SalesChart: React.FC<SalesChartProps> = ({ sales }) => {
  // Aggregate sales by day for the chart
  const data = React.useMemo(() => {
    const map = new Map<string, number>();
    const sortedSales = [...sales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedSales.forEach(sale => {
      const dateKey = format(new Date(sale.date), 'dd/MM', { locale: ptBR });
      map.set(dateKey, (map.get(dateKey) || 0) + sale.amount);
    });

    // If no data, provide empty placeholders to keep chart structure
    if (map.size === 0) return [{ name: 'Início', value: 0 }];

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-xl">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-blue-600 font-bold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#8E8E93' }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#8E8E93' }} 
            tickFormatter={(value) => `R$${value/1000}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#007AFF', strokeWidth: 1, strokeDasharray: '5 5' }} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#007AFF" 
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#colorSales)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
