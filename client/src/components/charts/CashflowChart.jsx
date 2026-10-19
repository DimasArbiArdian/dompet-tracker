import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { formatRupiah, formatCompactRupiah } from '../../utils/formatRupiah';

// Custom Tooltip strictly following PRD: Dark Slate #112A2B background with Warm Cream #FFF0C5 text
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-ink text-surface-bg border-2 border-ink rounded-xl p-3 shadow-xl text-xs font-sans">
        <div className="font-bold text-brand-cream border-b border-white/10 pb-1.5 mb-2">
          {label}
        </div>
        <div className="space-y-1">
          {payload.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-white/80">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}:
              </span>
              <span className="font-mono font-bold tabular-nums text-white">
                {formatRupiah(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const CashflowChart = ({
  data = [],
  period = 'daily',
  onPeriodChange,
  className = '',
}) => {
  return (
    <div
      className={`bg-white border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-ink">Arus Kas (Cashflow Trend)</h3>
          <p className="text-xs text-ink-muted">
            Perbandingan pemasukan harian dan pengeluaran
          </p>
        </div>

        {onPeriodChange && (
          <div className="inline-flex p-1 bg-surface-bg border border-ink/20 rounded-xl text-xs font-bold self-start sm:self-auto">
            <button
              onClick={() => onPeriodChange('daily')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                period === 'daily'
                  ? 'bg-ink text-brand-cream shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Harian
            </button>
            <button
              onClick={() => onPeriodChange('monthly')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                period === 'monthly'
                  ? 'bg-ink text-brand-cream shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Bulanan
            </button>
          </div>
        )}
      </div>

      <div className="h-64 sm:h-72 w-full mt-2">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              {/* Only horizontal dashed grid lines, no vertical lines */}
              <CartesianGrid
                stroke="#DCE7E7"
                strokeDasharray="4 4"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="#527072"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#DCE7E7' }}
              />
              <YAxis
                stroke="#527072"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => formatCompactRupiah(val)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="income"
                name="Pemasukan"
                fill="#359FA0"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expense"
                name="Pengeluaran"
                fill="#FF8C52"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-ink-muted">
            Belum ada data transaksi untuk periode ini
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-ink/10 text-xs font-semibold text-ink">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-brand-teal" />
          <span>Pemasukan</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-brand-coral" />
          <span>Pengeluaran</span>
        </div>
      </div>
    </div>
  );
};

export default CashflowChart;
