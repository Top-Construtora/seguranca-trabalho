import React, { useState } from 'react';

interface BarChartData {
  name: string;
  conforme?: number;
  nao_conforme?: number;
  value?: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  showValues?: boolean;
  isPercentage?: boolean;
  isGrouped?: boolean;
}

export function BarChart({ data, height = 300, showValues = true, isPercentage = false, isGrouped = false }: BarChartProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hoveredGroup, setHoveredGroup] = useState<{ group: number; bar: 'conforme' | 'nao_conforme' } | null>(null);
  
  const maxValue = isGrouped 
    ? Math.max(...data.flatMap(d => [d.conforme || 0, d.nao_conforme || 0]))
    : Math.max(...data.map(d => d.value || 0));
  
  const groupWidth = isGrouped ? `${Math.min(120, 400 / data.length)}px` : `${Math.min(80, 300 / data.length)}px`;
  const barWidth = isGrouped ? '45%' : '100%';

  return (
    <div className="w-full">
      {/* Chart Container */}
      <div 
        className="relative flex items-end justify-center gap-4 p-4 bg-gray-50 rounded-lg"
        style={{ height: `${height}px` }}
      >
        {/* Y-axis labels */}
        <div className="absolute left-2 top-4 bottom-16 flex flex-col justify-between text-xs text-gray-500">
          <span>{isPercentage ? '100%' : maxValue}</span>
          <span>{isPercentage ? '75%' : Math.round(maxValue * 0.75)}</span>
          <span>{isPercentage ? '50%' : Math.round(maxValue * 0.5)}</span>
          <span>{isPercentage ? '25%' : Math.round(maxValue * 0.25)}</span>
          <span>0</span>
        </div>

        {/* Grid lines */}
        <div className="absolute left-8 right-4 top-4 bottom-16">
          {[0, 25, 50, 75, 100].map((_, index) => (
            <div 
              key={index}
              className="absolute w-full border-t border-gray-200"
              style={{ bottom: `${index * 25}%` }}
            />
          ))}
        </div>

        {/* Bars */}
        <div className="flex items-end justify-center gap-4 h-full pb-12 pl-8 pr-4">
          {data.map((item, index) => {
            if (isGrouped) {
              const conformeHeight = ((item.conforme || 0) / (isPercentage ? 100 : maxValue)) * (height - 80);
              const naoConformeHeight = ((item.nao_conforme || 0) / (isPercentage ? 100 : maxValue)) * (height - 80);
              const isConformeHovered = hoveredGroup?.group === index && hoveredGroup?.bar === 'conforme';
              const isNaoConformeHovered = hoveredGroup?.group === index && hoveredGroup?.bar === 'nao_conforme';
              
              return (
                <div key={index} className="flex gap-1 items-end" style={{ width: groupWidth }}>
                  {/* Conforme Bar */}
                  <div
                    className="relative cursor-pointer transition-all duration-200 flex flex-col items-center"
                    style={{ width: barWidth }}
                    onMouseEnter={() => setHoveredGroup({ group: index, bar: 'conforme' })}
                    onMouseLeave={() => setHoveredGroup(null)}
                  >
                    {isConformeHovered && (
                      <div className="absolute -top-12 bg-gray-800 text-white px-3 py-1 rounded shadow-lg text-sm whitespace-nowrap z-10">
                        Conforme: {item.conforme}{isPercentage ? '%' : ''}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    )}
                    <div
                      className={`transition-all duration-300 rounded-t-md bg-green-500 ${
                        isConformeHovered ? 'opacity-80 scale-105' : ''
                      }`}
                      style={{ 
                        width: '100%',
                        height: `${Math.max(conformeHeight, 4)}px`
                      }}
                    >
                      {showValues && (item.conforme || 0) > 0 && (
                        <div className="flex items-center justify-center h-full">
                          <span className={`text-xs font-medium ${
                            conformeHeight > 20 ? 'text-white' : 'text-gray-700 -mt-5'
                          }`}>
                            {item.conforme}{isPercentage ? '%' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Não Conforme Bar */}
                  <div
                    className="relative cursor-pointer transition-all duration-200 flex flex-col items-center"
                    style={{ width: barWidth }}
                    onMouseEnter={() => setHoveredGroup({ group: index, bar: 'nao_conforme' })}
                    onMouseLeave={() => setHoveredGroup(null)}
                  >
                    {isNaoConformeHovered && (
                      <div className="absolute -top-12 bg-gray-800 text-white px-3 py-1 rounded shadow-lg text-sm whitespace-nowrap z-10">
                        Não Conforme: {item.nao_conforme}{isPercentage ? '%' : ''}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    )}
                    <div
                      className={`transition-all duration-300 rounded-t-md bg-red-500 ${
                        isNaoConformeHovered ? 'opacity-80 scale-105' : ''
                      }`}
                      style={{ 
                        width: '100%',
                        height: `${Math.max(naoConformeHeight, 4)}px`
                      }}
                    >
                      {showValues && (item.nao_conforme || 0) > 0 && (
                        <div className="flex items-center justify-center h-full">
                          <span className={`text-xs font-medium ${
                            naoConformeHeight > 20 ? 'text-white' : 'text-gray-700 -mt-5'
                          }`}>
                            {item.nao_conforme}{isPercentage ? '%' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            } else {
              // Original single bar logic
              const barHeight = ((item.value || 0) / (isPercentage ? 100 : maxValue)) * (height - 80);
              const isHovered = hoveredBar === index;
              
              return (
                <div
                  key={index}
                  className="flex flex-col items-center relative cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredBar(index)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {isHovered && (
                    <div className="absolute -top-12 bg-gray-800 text-white px-3 py-1 rounded shadow-lg text-sm whitespace-nowrap z-10">
                      {item.name}: {item.value}{isPercentage ? '%' : ''}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                  <div
                    className={`transition-all duration-300 rounded-t-md ${
                      isHovered ? 'opacity-80 scale-105' : ''
                    }`}
                    style={{
                      width: groupWidth,
                      height: `${Math.max(barHeight, 4)}px`,
                      backgroundColor: item.color,
                    }}
                  >
                    {showValues && (item.value || 0) > 0 && (
                      <div className="flex items-center justify-center h-full">
                        <span className={`text-xs font-medium ${
                          barHeight > 30 ? 'text-white' : 'text-gray-700 -mt-6'
                        }`}>
                          {item.value}{isPercentage ? '%' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-center gap-4 mt-2 pl-8 pr-4">
        {data.map((item, index) => (
          <div
            key={index}
            className="text-sm text-gray-700 text-center font-medium"
            style={{ width: isGrouped ? groupWidth : groupWidth }}
          >
            {item.name}
          </div>
        ))}
      </div>

      {/* Legend for grouped charts */}
      {isGrouped && (
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm font-medium text-gray-700">Conforme</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm font-medium text-gray-700">Não Conforme</span>
          </div>
        </div>
      )}
    </div>
  );
}