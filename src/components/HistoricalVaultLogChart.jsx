import React, { useCallback, useMemo } from "react"
import { useTranslate } from "react-polyglot"
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const HistoricalVaultLogChart = ({ vault }) => {
  const t = useTranslate()
  let logs = [];
  if (vault && vault.logs) {
    logs = Array.from(vault.logs)
  }
  logs.reverse();

  const locale = useMemo(() => (
    t._polyglot.currentLocale
  ),
    [t]
  )

  const amountFormatter = useMemo(() => (
    new Intl.NumberFormat(locale, {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  ),
    [locale]
  )

  const dateFormatter = useMemo(() => (
    new Intl.DateTimeFormat(locale, {
      dateStyle: "long"
    })
  ),
    [locale]
  )

  const monthFormatter = useMemo(() => (
    new Intl.DateTimeFormat(locale, {
      month: "short",
      year: "2-digit"
    })
  ),
    [locale]
  )

  const ticks = useMemo(
    () => (
      // logs.concat(vault.liquidationRatioChangeLog).reduce((output, point, index, points) => {
      logs.reduce((output, point, index, points) => {
        if (!point || !points) {
          return output
        }

        const c = new Date(point?.timestamp * 1000)
        const p = new Date(points?.[index - 1]?.["timestamp"] * 1000)

        if (c.getFullYear() !== p.getFullYear() || c.getMonth() !== p.getMonth()) {
          output.push(index)
        }

        return output
      }, [])
    ),
    [logs]
  )

  const formatTick = useCallback(
    (index) => {
      const timestamp = new Date((logs[index]?.["timestamp"] ?? 0) * 1000)
      const month = new Date(timestamp.getFullYear(), timestamp.getMonth())

      return monthFormatter.format(month)
    },
    [logs, monthFormatter]
  )

  const formatTooltipTitle = useCallback(
    (index) => {
      const timestamp = new Date((logs[index]?.["timestamp"] ?? 0) * 1000)

      return dateFormatter.format(timestamp)
    },
    [logs, dateFormatter]
  )

  const formatTooltipValue = useCallback(
    (value, name) => {
      let output = amountFormatter.format(value)

      if (name === "debtAfter") {
        return [output, "debtAfter"]
      }

      if (name === "postCollateralizationRatio") {
        return [output, "postCollateralizationRatio"]
      }

      if (name === "mat") {
        return [output, "LiquidationRatio"]
      }

      return output
    },
    [logs, amountFormatter, t]
  )

  return (
    <div style={{
      width: "100%",
      height: 180,
      marginTop: -24,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <ResponsiveContainer>
        <ComposedChart>
          <defs>
            <linearGradient id="totalDebtColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1AAB9B" stopOpacity={0.95} />
              <stop offset="95%" stopColor="#087C6D" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <XAxis
            axisLine={false}
            ticks={ticks}
            tickFormatter={formatTick}
            style={{ userSelect: 'none' }}
            domain={[logs[0].timestamp, logs[logs.length - 1].timestamp]}
          />
          <YAxis yAxisId={1} label={{ value: "DAI", angle: -90, dx: -20, fill: "#7E7E87" }}
          />
          <YAxis
            yAxisId={2}
            orientation="right"
            label={{ value: "CR", angle: -90, dx: 20, fill: "#7E7E87" }}
          />
          <Area
            data={logs}
            yAxisId={2}
            dataKey="debtAfter"
            type="monotone"
            stackId={2}
            animationDuration={750}
            stroke="#008E7B"
            fill="url(#totalDebtColor)"
            fillOpacity={1}
          />
          <Line
            data={logs}
            yAxisId={1}
            dataKey="postCollateralizationRatio"
            type="step"
            dot={false}
            stackId={1}
            animationDuration={750}
            stroke="#7E7E87"
          />
          <Line
            yAxisId={2}
            data={vault.liquidationRatioChangeLog}
            dataKey="mat"
            type="step"
            dot={false}
            stackId={2}
            animationDuration={750}
            stroke="#7E0087"
          />
          <Tooltip
            labelStyle={{ fontWeight: "bold" }}
            formatter={formatTooltipValue}
            labelFormatter={formatTooltipTitle}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default HistoricalVaultLogChart
