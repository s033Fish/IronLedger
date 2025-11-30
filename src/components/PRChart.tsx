// src/components/PRChart.tsx
import React, { useMemo, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";
import { colors } from "../theme/colors";

export interface ChartPoint { x: Date; y: number; }

const H = 220;
const P = { left: 44, right: 12, top: 18, bottom: 28 };

function formatDateShort(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const PRChart: React.FC<{ data: ChartPoint[] }> = ({ data }) => {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const { path, circles, ticks } = useMemo(() => {
    if (!w || data.length === 0) return { path: "", circles: [] as { cx:number; cy:number }[], ticks: null as any };

    const xVals = data.map(d => +d.x);
    const yVals = data.map(d => d.y);

    let xMin = Math.min(...xVals);
    let xMax = Math.max(...xVals);
    if (xMin === xMax) { xMin -= 86400000; xMax += 86400000; } // widen 1 day on each side

    let yMin = Math.min(...yVals);
    let yMax = Math.max(...yVals);
    if (yMin === yMax) { yMin = Math.max(0, yMin - 5); yMax = yMax + 5; }

    const innerW = w - P.left - P.right;
    const innerH = H - P.top - P.bottom;

    const sx = (t: number) => P.left + ((t - xMin) / (xMax - xMin)) * innerW;
    const sy = (y: number) => P.top + (1 - (y - yMin) / (yMax - yMin)) * innerH;

    // Line path
    const pts = data
      .slice()
      .sort((a, b) => +a.x - +b.x)
      .map(d => ({ cx: sx(+d.x), cy: sy(d.y) }));

    const path = pts.reduce((acc, p, i) =>
      i === 0 ? `M ${p.cx} ${p.cy}` : `${acc} L ${p.cx} ${p.cy}`, "");

    // Axis ticks (x: min & max date; y: min & max values)
    const xTicks = [
      { x: sx(xMin), label: formatDateShort(new Date(xMin)), anchor: "start" as const },
      { x: sx(xMax), label: formatDateShort(new Date(xMax)), anchor: "end" as const },
    ];
    const yTicks = [
      { y: sy(yMin), label: `${Math.round(yMin)}` },
      { y: sy(yMax), label: `${Math.round(yMax)}` },
    ];

    return { path, circles: pts, ticks: { xTicks, yTicks, xMin, xMax, yMin, yMax } };
  }, [w, data]);

  return (
    <View
      onLayout={onLayout}
      style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 8 }}
    >
      {w > 0 && (
        <Svg width="100%" height={H}>
          <G>
            {/* Axes */}
            <Line x1={P.left} y1={H - P.bottom} x2={w - P.right} y2={H - P.bottom} stroke={colors.charcoal} strokeWidth={1} />
            <Line x1={P.left} y1={P.top} x2={P.left} y2={H - P.bottom} stroke={colors.charcoal} strokeWidth={1} />

            {/* X tick labels */}
            {ticks?.xTicks.map((t: any, i: number) => (
              <SvgText
                key={`xt-${i}`}
                x={t.x}
                y={H - P.bottom + 16}
                fontSize={10}
                fill={colors.charcoal}
                textAnchor={t.anchor}
              >
                {t.label}
              </SvgText>
            ))}

            {/* Y tick labels + grid lines */}
            {ticks?.yTicks.map((t: any, i: number) => (
              <G key={`yt-${i}`}>
                <Line x1={P.left} y1={t.y} x2={w - P.right} y2={t.y} stroke="#e6e6e6" strokeWidth={1} />
                <SvgText
                  x={P.left - 6}
                  y={t.y + 3}
                  fontSize={10}
                  fill={colors.charcoal}
                  textAnchor="end"
                >
                  {t.label}
                </SvgText>
              </G>
            ))}

            {/* Line + points */}
            {path ? <Path d={path} stroke={colors.crimson} strokeWidth={3} fill="none" /> : null}
            {circles.map((c, i) => (
              <Circle key={`pt-${i}`} cx={c.cx} cy={c.cy} r={3} fill={colors.crimson} />
            ))}
          </G>
        </Svg>
      )}
    </View>
  );
};

export default PRChart;
