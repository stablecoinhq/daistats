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
  const getLiquidationRatioChangeLogWithBothEnds = (originalData) => {
    const liquidationRatioChangeLogList = originalData
    const liquidationRatioChangeLogLast = liquidationRatioChangeLogList[liquidationRatioChangeLogList.length - 1];
    const liquidationRatioChangeLogRangeMin = +logs[0].timestamp
    const liquidationRatioChangeLogRangeMax = +logs[logs.length - 1].timestamp
    // get list within `logs` range
    const liquidationRatioChangeLogWithinRange = liquidationRatioChangeLogList
      .filter(liquidationRatioChangeLog =>
        +liquidationRatioChangeLogRangeMin < +liquidationRatioChangeLog.timestamp &&
        +liquidationRatioChangeLog.timestamp < +liquidationRatioChangeLogRangeMax)
    // if there is no element, get last element
    if (!liquidationRatioChangeLogWithinRange.length) {
      liquidationRatioChangeLogWithinRange.push(liquidationRatioChangeLogLast)
    }
    // get last change log that is *NOT* within range
    const liquidationRatioChangeLogBeforeRange = liquidationRatioChangeLogList
      .filter(liquidationRatioChangeLog =>
        +liquidationRatioChangeLogRangeMin > +liquidationRatioChangeLog.timestamp)
    let lastLiquidationRatioChangeLogBeforeRange = undefined;
    if (!liquidationRatioChangeLogBeforeRange.length) {
      const liquidationRatioChangeLogAfterRange = liquidationRatioChangeLogList
        .filter(liquidationRatioChangeLog =>
          +liquidationRatioChangeLogRangeMin < +liquidationRatioChangeLog.timestamp)
      lastLiquidationRatioChangeLogBeforeRange = liquidationRatioChangeLogAfterRange[0]
    } else {
      lastLiquidationRatioChangeLogBeforeRange = liquidationRatioChangeLogBeforeRange[liquidationRatioChangeLogBeforeRange.length - 1]
    }

    const liquidationRatioChangeLogWithBothEnds =
      // add min value
      [{
        mat: (lastLiquidationRatioChangeLogBeforeRange.mat),
        timestamp: liquidationRatioChangeLogRangeMin
      }]
        // original data within range
        .concat(liquidationRatioChangeLogWithinRange)
        // add max value
        .concat([{
          mat: liquidationRatioChangeLogWithinRange[liquidationRatioChangeLogWithinRange.length - 1].mat,
          timestamp: liquidationRatioChangeLogRangeMax
        }])

    return liquidationRatioChangeLogWithBothEnds
  }
  const liquidationRatioChangeLogWithBothEnds = getLiquidationRatioChangeLogWithBothEnds(vault.liquidationRatioChangeLog.reverse())

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
      const timestamp = new Date(index * 1000)
      const month = new Date(timestamp.getFullYear(), timestamp.getMonth())
      return monthFormatter.format(month)
    },
    [monthFormatter]
  )

  const formatTooltipTitle = useCallback(
    (index) => {
      const timestamp = new Date(index * 1000)
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
    [amountFormatter, t]
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
        <ComposedChart
          data={logs}
        >
          <defs>
            <linearGradient id="totalDebtColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1AAB9B" stopOpacity={0.95} />
              <stop offset="95%" stopColor="#087C6D" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <XAxis
            axisLine={false}
            tickFormatter={formatTick}
            style={{ userSelect: 'none' }}
            domain={[parseInt(logs[0].timestamp), parseInt(logs[logs.length - 1].timestamp)]}
            type="number"
            dataKey="timestamp"
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
            animationDuration={750}
            stroke="#008E7B"
            fill="url(#totalDebtColor)"
            fillOpacity={1}
          />
          <Line
            data={logs}
            yAxisId={1}
            dataKey="postCollateralizationRatio"
            type="stepAfter"
            dot={false}
            animationDuration={750}
            stroke="#7E7E87"
          />
          <Line
            yAxisId={1}
            data={liquidationRatioChangeLogWithBothEnds}
            dataKey="mat"
            type="stepAfter"
            dot={false}
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
