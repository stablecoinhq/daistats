import React, { useCallback } from 'react';
import { useTranslate } from 'react-polyglot';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, Label } from 'recharts';

const RiskModelChart = (props) => {
  const t = useTranslate();
  const round = (num, digits = 2) => new Number(+num).toFixed(digits);
  let logs = props.riskPremiumByDebtExposure && props.riskPremiumByDebtExposure.length ? props.riskPremiumByDebtExposure : [];
  const maximumDebtCeiling = props.maximumDebtCeiling ?? 0;
  const totalDebtByVaultType = props.totalDebtByVaultType ?? 0;

  const formatTooltipTitle = useCallback(
    (value, _name) => {
      return `${t('daistats.risk_model.debt_exposure')}: ${Math.floor(value).toLocaleString()} JPYSC`;
    },
    [t],
  );

  const formatTooltipValue = useCallback(
    (value, _name) => {
      let output = `${(value * 100).toLocaleString()} %`;
      return [output, t('daistats.risk_model.risk_premium')];
    },
    [t],
  );

  return logs.length > 0 ? (
    <div
      style={{
        width: '100%',
        height: 240,
        marginTop: -10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ResponsiveContainer>
        <LineChart data={logs}>
          <Line type="monotone" dataKey="riskPremium" stroke="#8884d8" dot={false} />
          <XAxis
            type="number"
            dataKey="debtExposure"
            domain={[logs[0].debtExposure, logs[logs.length - 1].debtExposure]}
            tickFormatter={(v) => round(v)}
          />
          <YAxis dataKey="riskPremium" tickFormatter={(v) => round(v * 100)} />
          <Tooltip labelStyle={{ fontWeight: 'bold' }} formatter={formatTooltipValue} labelFormatter={formatTooltipTitle} />
          <ReferenceLine
            x={maximumDebtCeiling}
            label={<Label value={t('daistats.risk_model.maximum_debt_ceiling')} position="insideTop" fill="#60c040" />}
            stroke={'#99ff77'}
            strokeWidth={2}
            strokeOpacity={0.5}
            scale="auto"
          />
          <ReferenceLine
            x={totalDebtByVaultType}
            label={<Label value={t('daistats.risk_model.total_debt_by_vault_type')} position="insideBottom" fill="#1040c0" />}
            stroke={'#4477ff'}
            strokeWidth={2}
            strokeOpacity={0.5}
            scale="auto"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  ) : (
    <div></div>
  );
};

export default RiskModelChart;
