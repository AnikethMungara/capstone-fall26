// Small dependency-free grouped bar chart. Always shows title, axis labels and n;
// charts with n < 30 are marked indicative (#85).
const COLORS = ["#5b8cff", "#2fbf71"];

export default function BarChart({ title, xLabel, yLabel, groups, series, yMax, n, step = 1 }) {
  const W = 640, H = 320, m = { l: 52, r: 12, t: 12, b: 64 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const gw = iw / Math.max(groups.length, 1);
  const bw = Math.min(34, (gw - 14) / series.length);
  const y = (v) => m.t + ih - (v / yMax) * ih;
  const ticks = [];
  for (let v = 0; v <= yMax; v += step) ticks.push(v);

  return (
    <figure className="chart">
      <figcaption>
        <strong>{title}</strong>
        <span className="muted"> · n = {n}{n < 30 && " (indicative, n under 30)"}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} stroke="#2a3550" />
            <text x={m.l - 8} y={y(v) + 4} textAnchor="end" fill="#8c97b2" fontSize="11">{v}</text>
          </g>
        ))}
        {groups.map((g, gi) => (
          <g key={g.label}>
            {g.values.map((v, si) => (
              <g key={si}>
                <rect x={m.l + gi * gw + (gw - bw * series.length) / 2 + si * bw} y={y(v)} width={bw - 2}
                  height={ih - (y(v) - m.t)} fill={COLORS[si]} rx="3" />
                <text x={m.l + gi * gw + (gw - bw * series.length) / 2 + si * bw + (bw - 2) / 2} y={y(v) - 4}
                  textAnchor="middle" fill="#e8ecf6" fontSize="11">{Number.isInteger(v) ? v : v.toFixed(1)}</text>
              </g>
            ))}
            <text x={m.l + gi * gw + gw / 2} y={H - m.b + 18} textAnchor="middle" fill="#8c97b2" fontSize="11">{g.label}</text>
          </g>
        ))}
        <text x={m.l + iw / 2} y={H - 8} textAnchor="middle" fill="#8c97b2" fontSize="12">{xLabel}</text>
        <text transform={`translate(14 ${m.t + ih / 2}) rotate(-90)`} textAnchor="middle" fill="#8c97b2" fontSize="12">{yLabel}</text>
      </svg>
      <div className="legend">
        {series.map((s, i) => <span key={s}><i style={{ background: COLORS[i] }} /> {s}</span>)}
      </div>
    </figure>
  );
}
