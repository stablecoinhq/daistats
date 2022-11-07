import React, { useCallback, useMemo } from "react"
import { useTranslate } from "react-polyglot"
import { ComposedChart, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, Label } from "recharts"

const RiskModelChart = (props) => {
  const t = useTranslate()
  let logs = (props.riskPremiumByDebtExposure && props.riskPremiumByDebtExposure.length) ? props.riskPremiumByDebtExposure : []
  const maximumDebtCeiling = props.maximumDebtCeiling ?? 0
  const totalDebtByVaultType = props.totalDebtByVaultType ?? 0

  const formatTooltipTitle = useCallback(
    (value, name) => {
      return `debtExposure: ${(value | 0).toLocaleString()} DAI`
    },
    [logs]
  )

  const formatTooltipValue = useCallback(
    (value, name) => {
      let output = `${(value * 100).toLocaleString()} %`
      return [output, "riskPremium"]
    },
    [logs, t]
  )

  return (
    logs.length > 0 ?
      <div style={{
        width: "100%",
        height: 180,
        marginTop: -10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <ResponsiveContainer>
          <LineChart data={logs}>
            <Line type="monotone" dataKey="riskPremium" stroke="#8884d8" dot={false} />
            <XAxis type="number" dataKey="debtExposure" domain={[logs[0].debtExposure, logs[logs.length - 1].debtExposure]} />
            <YAxis dataKey="riskPremium" />
            <Tooltip
              labelStyle={{ fontWeight: "bold" }}
              formatter={formatTooltipValue}
              labelFormatter={formatTooltipTitle}
            />
            <ReferenceLine
              x={maximumDebtCeiling}
              label={<Label value={"maximumDebtCeiling"} position="insideTop" />}

              stroke={"green"} strokeWidth={2} strokeOpacity={.5}
              // alwaysShow={true}
              scale="auto"
            />
            <ReferenceLine
              x={totalDebtByVaultType}
              label={<Label value={"totalDebtByVaultType"} position="insideBottom" />}

              stroke={"green"} strokeWidth={2} strokeOpacity={.5}
              // alwaysShow={true}
              scale="auto"
            />

          </LineChart>
        </ResponsiveContainer>
      </div>
      : <div></div>
  )
}

export default RiskModelChart
