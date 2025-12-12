import { useMemo, useState } from 'react';
import { BodyPart, BODY_PART_LABELS } from '@/types/accident.types';

interface BodyPartData {
  body_part: BodyPart;
  count: number;
}

interface BodySilhouetteProps {
  data: BodyPartData[];
  className?: string;
}

// Posições base (onde a linha começa no corpo) e posições do indicador (onde o círculo fica)
interface IndicatorPosition {
  x: number;
  y: number;
  // Se definido, o indicador será puxado para fora com uma linha
  lineEnd?: { x: number; y: number };
}

// viewBox "0 0 220 320" - corpo centralizado em x=110
// Linhas organizadas para não se cruzarem:
// - Lado esquerdo do corpo → indicadores à esquerda
// - Lado direito do corpo → indicadores à direita
// - Partes centrais alternadas por altura para evitar cruzamentos
const BODY_PART_POSITIONS: Record<BodyPart, IndicatorPosition> = {
  // Cabeça - centro, sem linha
  [BodyPart.CABECA]: { x: 110, y: 30 },
  // Olhos - centro, vai para direita (alto)
  [BodyPart.OLHOS]: { x: 110, y: 38, lineEnd: { x: 185, y: 20 } },
  // Ouvidos - esquerda do corpo, vai para esquerda
  [BodyPart.OUVIDOS]: { x: 94, y: 42, lineEnd: { x: 35, y: 20 } },
  // Face - centro, vai para direita (abaixo dos olhos)
  [BodyPart.FACE]: { x: 110, y: 48, lineEnd: { x: 185, y: 45 } },
  // Pescoço - centro, vai para esquerda (abaixo ouvidos)
  [BodyPart.PESCOCO]: { x: 110, y: 64, lineEnd: { x: 35, y: 55 } },

  // Ombros - cada um para seu lado
  [BodyPart.OMBRO_ESQUERDO]: { x: 80, y: 78, lineEnd: { x: 25, y: 78 } },
  [BodyPart.OMBRO_DIREITO]: { x: 140, y: 78, lineEnd: { x: 195, y: 78 } },

  // Braços - cada um para seu lado
  [BodyPart.BRACO_ESQUERDO]: { x: 70, y: 115, lineEnd: { x: 20, y: 105 } },
  [BodyPart.BRACO_DIREITO]: { x: 150, y: 115, lineEnd: { x: 200, y: 105 } },

  // Mãos - cada uma para seu lado
  [BodyPart.MAO_ESQUERDA]: { x: 64, y: 155, lineEnd: { x: 18, y: 135 } },
  [BodyPart.MAO_DIREITA]: { x: 156, y: 155, lineEnd: { x: 202, y: 135 } },

  // Dedos das mãos - cada um para seu lado (abaixo das mãos)
  [BodyPart.DEDOS_MAO_ESQUERDA]: { x: 62, y: 160, lineEnd: { x: 18, y: 165 } },
  [BodyPart.DEDOS_MAO_DIREITA]: { x: 158, y: 160, lineEnd: { x: 202, y: 165 } },

  // Tronco - centro, sem linha
  [BodyPart.TORAX]: { x: 110, y: 98 },
  [BodyPart.ABDOMEN]: { x: 110, y: 128 },

  // Coluna - centro, vai para direita
  [BodyPart.COLUNA]: { x: 110, y: 113, lineEnd: { x: 195, y: 195 } },
  // Quadril - centro, vai para esquerda
  [BodyPart.QUADRIL]: { x: 110, y: 150, lineEnd: { x: 25, y: 195 } },

  // Pernas - cada uma para seu lado
  [BodyPart.PERNA_ESQUERDA]: { x: 98, y: 205, lineEnd: { x: 25, y: 225 } },
  [BodyPart.PERNA_DIREITA]: { x: 122, y: 205, lineEnd: { x: 195, y: 225 } },

  // Joelhos - cada um para seu lado
  [BodyPart.JOELHO_ESQUERDO]: { x: 96, y: 230, lineEnd: { x: 25, y: 255 } },
  [BodyPart.JOELHO_DIREITO]: { x: 124, y: 230, lineEnd: { x: 195, y: 255 } },

  // Pés - cada um para seu lado
  [BodyPart.PE_ESQUERDO]: { x: 92, y: 285, lineEnd: { x: 25, y: 285 } },
  [BodyPart.PE_DIREITO]: { x: 128, y: 285, lineEnd: { x: 195, y: 285 } },

  // Dedos dos pés - cada um para seu lado (abaixo dos pés)
  [BodyPart.DEDOS_PE_ESQUERDO]: { x: 88, y: 292, lineEnd: { x: 25, y: 310 } },
  [BodyPart.DEDOS_PE_DIREITO]: { x: 132, y: 292, lineEnd: { x: 195, y: 310 } },

  // Múltiplas partes e corpo inteiro - vão para a direita em alturas diferentes
  [BodyPart.MULTIPLAS_PARTES]: { x: 110, y: 135, lineEnd: { x: 195, y: 150 } },
  [BodyPart.CORPO_INTEIRO]: { x: 110, y: 165, lineEnd: { x: 195, y: 175 } },
};

const getIntensityColor = (ratio: number): string => {
  if (ratio >= 0.75) return '#ef4444';
  if (ratio >= 0.5) return '#f97316';
  if (ratio >= 0.25) return '#eab308';
  return '#12b0a0';
};

const getIndicatorSize = (count: number, maxCount: number): number => {
  const minSize = 14;
  const maxSize = 22;
  if (maxCount === 0) return minSize;
  const ratio = count / maxCount;
  return Math.round(minSize + (maxSize - minSize) * ratio);
};

export function BodySilhouette({ data, className = '' }: BodySilhouetteProps) {
  const [hoveredPart, setHoveredPart] = useState<BodyPart | null>(null);

  const maxCount = useMemo(() => {
    return Math.max(...data.map((d) => d.count), 1);
  }, [data]);

  const dataMap = useMemo(() => {
    const map = new Map<BodyPart, number>();
    data.forEach((d) => map.set(d.body_part, d.count));
    return map;
  }, [data]);

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <svg viewBox="0 0 220 320" className="h-full w-auto max-h-[350px]">
          {/* Silhueta humana - centralizada em x=110 */}
          <g fill="#E0E0E0" stroke="#C0C0C0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            {/* Cabeça e pescoço integrados */}
            <path d="
              M 110 22
              C 126 22 128 34 128 44
              C 128 54 122 58 116 60
              L 118 68
              L 102 68
              L 104 60
              C 98 58 92 54 92 44
              C 92 34 94 22 110 22
              Z
            " />

            {/* Corpo */}
            <path d="
              M 102 68
              C 92 70 82 74 78 80
              L 66 118
              L 62 152
              L 68 158
              L 74 152
              L 78 122
              L 84 88
              L 90 74

              L 90 140
              L 88 165
              L 86 205
              L 88 245
              L 86 268
              L 82 288
              L 86 292
              L 102 292
              L 104 288
              L 102 268
              L 104 245
              L 106 205
              L 108 170

              L 110 165

              L 112 170
              L 114 205
              L 116 245
              L 118 268
              L 116 288
              L 118 292
              L 134 292
              L 138 288
              L 134 268
              L 132 245
              L 134 205
              L 132 165
              L 130 140

              L 130 74
              L 136 88
              L 142 122
              L 146 152
              L 152 158
              L 158 152
              L 154 118
              L 142 80
              C 138 74 128 70 118 68
              Z
            " />
          </g>

          {/* Indicadores */}
          {data.map((item) => {
            const pos = BODY_PART_POSITIONS[item.body_part];
            if (!pos) return null;

            const ratio = item.count / maxCount;
            const color = getIntensityColor(ratio);
            const size = getIndicatorSize(item.count, maxCount);
            const isHovered = hoveredPart === item.body_part;

            // Se tem lineEnd, o indicador fica no fim da linha
            const indicatorX = pos.lineEnd ? pos.lineEnd.x : pos.x;
            const indicatorY = pos.lineEnd ? pos.lineEnd.y : pos.y;

            return (
              <g
                key={item.body_part}
                onMouseEnter={() => setHoveredPart(item.body_part)}
                onMouseLeave={() => setHoveredPart(null)}
                className="cursor-pointer"
              >
                {/* Linha conectora (se existir) */}
                {pos.lineEnd && (
                  <>
                    <line
                      x1={pos.x}
                      y1={pos.y}
                      x2={pos.lineEnd.x}
                      y2={pos.lineEnd.y}
                      stroke={color}
                      strokeWidth={isHovered ? 2 : 1.5}
                      opacity={isHovered ? 0.9 : 0.6}
                    />
                    {/* Ponto de origem no corpo */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={3}
                      fill={color}
                      opacity={0.8}
                    />
                  </>
                )}
                {/* Halo do indicador */}
                <circle
                  cx={indicatorX}
                  cy={indicatorY}
                  r={size / 2 + 3}
                  fill={color}
                  opacity={isHovered ? 0.4 : 0.15}
                />
                {/* Indicador principal */}
                <circle
                  cx={indicatorX}
                  cy={indicatorY}
                  r={isHovered ? size / 2 + 1 : size / 2}
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Número */}
                <text
                  x={indicatorX}
                  y={indicatorY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="9"
                  fontWeight="bold"
                  className="pointer-events-none select-none"
                >
                  {item.count}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Info */}
      <div className="h-12 flex items-center justify-center shrink-0">
        {hoveredPart && dataMap.has(hoveredPart) ? (
          <div className="text-center">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {BODY_PART_LABELS[hoveredPart]}
            </p>
            <p className="text-base font-bold text-[#1e6076] dark:text-[#12b0a0]">
              {dataMap.get(hoveredPart)} ocorrência{dataMap.get(hoveredPart) !== 1 ? 's' : ''}
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Passe o mouse sobre um indicador
          </p>
        )}
      </div>

      {/* Legenda */}
      <div className="flex justify-center gap-3 text-xs flex-wrap shrink-0 pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#12b0a0]" />
          <span className="text-gray-600 dark:text-gray-400">Baixo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#eab308]" />
          <span className="text-gray-600 dark:text-gray-400">Médio</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#f97316]" />
          <span className="text-gray-600 dark:text-gray-400">Alto</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
          <span className="text-gray-600 dark:text-gray-400">Crítico</span>
        </div>
      </div>
    </div>
  );
}
