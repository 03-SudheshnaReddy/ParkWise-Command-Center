import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface RiskSegment {
  name: string;
  value: number;
  color: string;
}

interface RiskDonutChartProps {
  data: RiskSegment[];
}

export function RiskDonutChart({ data }: RiskDonutChartProps) {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid rgba(148,163,184,0.18)",
              borderRadius: 16,
            }}
            formatter={(value) => [`${value ?? 0}%`, "Exposure"]}
            itemStyle={{ color: "#cbd5e1" }}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="42%"
            innerRadius={58}
            outerRadius={88}
            stroke="transparent"
            paddingAngle={3}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            iconType="circle"
            iconSize={9}
            wrapperStyle={{ color: "#94a3b8", fontSize: 11, lineHeight: "24px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
