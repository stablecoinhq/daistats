import React, { useCallback, useMemo } from "react"
import { useTranslate } from "react-polyglot"
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { gql, GraphQLClient } from "graphql-request"

const AuctionParticipantsChart = (props) => {
  const t = useTranslate()
  let logs = (props.auctions && props.auctions.length) ? props.auctions : []

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

      if (name === "keepers") {
        return [output, "keepers"]
      }

      if (name === "takers") {
        return [output, "takers"]
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
        <ComposedChart data={logs}>
          <XAxis
            axisLine={false}
            ticks={ticks}
            tickFormatter={formatTick}
            style={{ userSelect: 'none' }}
          />
          <YAxis yAxisId={1} label={{ value: "DAI", angle: -90, dx: -20, fill: "#7E7E87" }}
          />
          <Line
            yAxisId={1}
            dataKey="keepers"
            type="step"
            dot={false}
            stackId={1}
            animationDuration={750}
            stroke="#7E7E87"
          />
          <Line
            yAxisId={1}
            dataKey="takers"
            type="step"
            dot={false}
            stackId={1}
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

export default AuctionParticipantsChart
