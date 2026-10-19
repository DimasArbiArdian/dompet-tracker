import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatRupiah } from '../../utils/formatRupiah';

// Semantic palette variations for categories
const PALETTE_COLORS = [
  '#FF8C52', // Coral
  '#359FA0', // Deep Teal
  '#8AD6D1', // Soft Mint
  '#112A2B', // Deep Slate
  '#F4A261', // Soft Coral/Orange
  '#2A9D8F', // Ocean Teal
  '#E76F51', // Burnt Sienna
  '#527072', // Slate Muted
];

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-ink text-surface-bg border-2 border-ink rounded-xl p-2.5 shadow-xl text-xs font-sans">
        <div className="font-bold text-brand-cream">{data.name}</div>
        <div className="font-mono font-bold tabular-nums text-white mt-0.5">
          {formatRupiah(data.value)} ({data.payload.percentage || 0}%)
        </div>
      </div>
    );
  }
  return null;
};

const CategoryDonutChart = ({
  categories = [],
  total = 0,
  className = '',
}) => {
  const chartData = categories.map((cat, idx) => ({
    name: cat.name,
    value: cat.totalAmount,
    percentage: cat.percentage,
    color: cat.color || PALETTE_COLORS[idx % PALETTE_COLORS.length],
  }));

  return (
    <div
      className={`bg-white border-2 border-ink rounded-2xl p-5 shadow-tactile flex flex-col justify-between ${className}`}
    >
      <div className="mb-2">
        <h3 className="text-base font-bold text-ink">Pengeluaran per Kategori</h3>
        <p className="text-xs text-ink-muted">Distribusi pos belanja bulan ini</p>
      </div>

      {chartData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center my-auto">
          {/* Donut Chart */}
          <div className="h-48 sm:h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomPieTooltip />} />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Total in Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                Total
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-ink tabular-nums">
                {formatRupiah(total)}
              </span>
            </div>
          </div>

          {/* Breakdown percentage list */}
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {chartData.map((item, idx) => (
              <div key={idx} className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-ink truncate max-w-[140px]">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="font-mono font-bold tabular-nums text-ink">
                    {formatRupiah(item.value)} ({item.percentage}%)
                  </span>
                </div>
                {/* Visual bar */}
                <div className="w-full h-1.5 bg-surface-bg rounded-full overflow-hidden border border-ink/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-56 flex items-center justify-center text-xs text-ink-muted">
          Belum ada data pengeluaran untuk periode ini
        </div>
      )}
    </div>
  );
};

export default CategoryDonutChart;
