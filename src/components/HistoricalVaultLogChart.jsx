import React, { useCallback, useMemo } from 'react';
import { useTranslate } from 'react-polyglot';
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const HistoricalVaultLogChart = ({ vault, currentCollateralRatio }) => {
  const t = useTranslate();
  let logs = [];
  if (vault && vault.logs) {
    logs = vault.logs;
    // add current situation as single point only if logs has single point that cannot form a graph
    if (new Set(logs.map((log) => log.timestamp)).size < 2) {
      logs = [
        {
          timestamp: (Date.now() / 1000) | 0,
          debtAfter: vault.debt,
          postCollateralizationRatio: currentCollateralRatio,
        },
      ].concat(logs);
    }
  }
  // create new object, clone from vault.logs
  const logsPercent = logs
    .reverse()
    .concat()
    .map((log) => {
      const obj = Object.assign({}, log);
      obj.postCollateralizationRatio = obj.postCollateralizationRatio * 100;
      obj.preCollateralizationRatio = obj.preCollateralizationRatio * 100;
      return obj;
    });
  const getLiquidationRatioChangeLogWithBothEnds = (originalData) => {
    if (!logs.length) {
      return [];
    }
    const liquidationRatioChangeLogList = originalData;
    const liquidationRatioChangeLogRangeMin = +logs[0].timestamp;
    const liquidationRatioChangeLogRangeMax = +logs[logs.length - 1].timestamp;
    // get list within `logs` range
    const liquidationRatioChangeLogWithinRange = liquidationRatioChangeLogList.filter(
      (liquidationRatioChangeLog) =>
        +liquidationRatioChangeLogRangeMin < +liquidationRatioChangeLog.timestamp &&
        +liquidationRatioChangeLog.timestamp < +liquidationRatioChangeLogRangeMax,
    );
    // get last change log that is *NOT* within range
    const liquidationRatioChangeLogBeforeRange = liquidationRatioChangeLogList.filter(
      (liquidationRatioChangeLog) => +liquidationRatioChangeLogRangeMin > +liquidationRatioChangeLog.timestamp,
    );
    let lastLiquidationRatioChangeLogBeforeRange = undefined;
    if (!liquidationRatioChangeLogBeforeRange.length) {
      const liquidationRatioChangeLogAfterRange = liquidationRatioChangeLogList.filter(
        (liquidationRatioChangeLog) => +liquidationRatioChangeLogRangeMin < +liquidationRatioChangeLog.timestamp,
      );
      lastLiquidationRatioChangeLogBeforeRange = liquidationRatioChangeLogAfterRange[0];
    } else {
      lastLiquidationRatioChangeLogBeforeRange =
        liquidationRatioChangeLogBeforeRange[liquidationRatioChangeLogBeforeRange.length - 1];
    }
    // if there is no element, get last element
    if (!liquidationRatioChangeLogWithinRange.length) {
      // get last element which is *before* `liquidationRatioChangeLogRangeMin`
      liquidationRatioChangeLogWithinRange.push({
        ...lastLiquidationRatioChangeLogBeforeRange,
        timestamp: liquidationRatioChangeLogRangeMin,
      });
    }
    const liquidationRatioChangeLogWithBothEnds =
      // add min value
      [
        {
          mat: lastLiquidationRatioChangeLogBeforeRange.mat,
          timestamp: liquidationRatioChangeLogRangeMin,
        },
      ]
        // original data within range
        .concat(liquidationRatioChangeLogWithinRange)
        // add max value
        .concat([
          {
            mat: liquidationRatioChangeLogWithinRange[liquidationRatioChangeLogWithinRange.length - 1].mat,
            timestamp: liquidationRatioChangeLogRangeMax,
          },
        ]);
    const liquidationRatioPercent = liquidationRatioChangeLogWithBothEnds.map((element) => {
      element.mat = element.mat * 100;
      return element;
    });
    return liquidationRatioPercent;
  };
  const liquidationRatioChangeLogWithBothEnds = getLiquidationRatioChangeLogWithBothEnds(
    vault && vault.liquidationRatioChangeLog ? vault.liquidationRatioChangeLog.reverse() : [],
  );

  logsPercent.map((log, index) => {
    for (
      let liquidationRatioChangeLogIndex = 0;
      liquidationRatioChangeLogIndex < liquidationRatioChangeLogWithBothEnds.length;
      liquidationRatioChangeLogIndex++
    ) {
      const matChangeLog = liquidationRatioChangeLogWithBothEnds[liquidationRatioChangeLogIndex];
      if (log.timestamp <= matChangeLog.timestamp) {
        logsPercent[index].mat = matChangeLog.mat;
        break;
      } else if (liquidationRatioChangeLogIndex === liquidationRatioChangeLogWithBothEnds.length - 1) {
        logsPercent[index].mat = matChangeLog.mat;
        break;
      }
    }
  });

  const locale = useMemo(() => t._polyglot.currentLocale, [t]);

  const amountFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'long',
      }),
    [locale],
  );

  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: 'short',
        year: '2-digit',
      }),
    [locale],
  );
  const formatTick = useCallback(
    (index) => {
      const timestamp = new Date(index * 1000);
      const month = new Date(timestamp.getFullYear(), timestamp.getMonth());
      return monthFormatter.format(month);
    },
    [monthFormatter],
  );

  const formatTooltipTitle = useCallback(
    (index) => {
      const timestamp = new Date(index * 1000);
      return dateFormatter.format(timestamp);
    },
    [dateFormatter],
  );

  const formatTooltipValue = useCallback(
    (value, name) => {
      let output = amountFormatter.format(value);

      if (name === 'debtAfter') {
        return [output, t('daistats.vault_information.debt') + '(JPYSC)'];
      }

      if (name === 'postCollateralizationRatio') {
        return [output, t('daistats.vault_information.collateral_ratio') + '(%)'];
      }

      if (name === 'mat') {
        return [output, t('daistats.vault_information.liquidation_ratio') + '(%)'];
      }

      return output;
    },
    [amountFormatter, t],
  );

  return (
    <div
      style={{
        width: '100%',
        height: 180,
        marginTop: -24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ResponsiveContainer>
        <ComposedChart data={logsPercent}>
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
            domain={[
              logsPercent.length ? parseInt(logsPercent[0].timestamp) : 'auto',
              logsPercent.length ? parseInt(logsPercent[logsPercent.length - 1].timestamp) : 'auto',
            ]}
            type="number"
            dataKey="timestamp"
          />
          <YAxis yAxisId={1} label={{ value: 'DAI', angle: -90, dx: -20, fill: '#7E7E87' }} />
          <YAxis yAxisId={2} orientation="right" label={{ value: 'CR', angle: -90, dx: 20, fill: '#7E7E87' }} />
          <Area
            data={logsPercent}
            yAxisId={2}
            dataKey="debtAfter"
            type="monotone"
            animationDuration={750}
            stroke="#008E7B"
            fill="url(#totalDebtColor)"
            fillOpacity={1}
          />
          <Line
            data={logsPercent}
            yAxisId={1}
            dataKey="postCollateralizationRatio"
            type="stepAfter"
            dot={false}
            animationDuration={750}
            stroke="#7E7E87"
          />
          <Line
            yAxisId={1}
            data={logsPercent}
            dataKey="mat"
            type="stepAfter"
            dot={false}
            animationDuration={750}
            stroke="#7E0087"
          />
          <Tooltip labelStyle={{ fontWeight: 'bold' }} formatter={formatTooltipValue} labelFormatter={formatTooltipTitle} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoricalVaultLogChart;
