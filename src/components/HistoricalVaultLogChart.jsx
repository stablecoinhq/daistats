import React, { useCallback, useMemo } from 'react';
import { useTranslate } from 'react-polyglot';
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const HistoricalVaultLogChart = ({ ilksByName, vault, currentCollateralRatio, priceList }) => {
  // vault.logs contains preprocessed data for vault manipulation logs in descending order.
  // currentCollateralRatio is a scalar value for current collateral ratio.
  // priceList contains price map for vault manipulation logs and its middle points.
  const t = useTranslate();
  let logs = [];
  // check data actually exists. also, add auxiliary point to data
  if (vault && vault.logs) {
    logs = vault.logs.map((log) => Object.assign({}, log));
    // add current situation as single point only if logs has single point that cannot form a graph
    // or it currently has any debt or collateral in vault.
    if (new Set(logs.map((log) => log.timestamp)).size < 2 || vault.debt > 0 || vault.collateral > 0) {
      logs = [
        {
          timestamp: (Date.now() / 1000) | 0,
          debtAfter: parseFloat(vault.debt) * parseFloat(ilksByName[vault.collateralType.id].rate),
          collateral: vault.collateral,
          postCollateralizationRatio: +currentCollateralRatio,
        },
      ].concat(logs);
    }
  }
  // convert price point to graph data
  const searchLogPointBeforeEqualTimestamp = (logPoints, timestamp) => logPoints.find((log) => +log.timestamp <= +timestamp);
  const minTimestamp = logs[logs.length - 1].timestamp;
  const pricePointsWithoutLogsPoint = priceList
    .map((pricePoint) => {
      const searchedLogPoint = searchLogPointBeforeEqualTimestamp(logs, pricePoint.timestamp);
      const log = Object.assign({}, searchedLogPoint);
      if (log) {
        if (vault.collateralType && vault.collateralType.rate && pricePoint.newValue) {
          if (log.debtAfter * vault.collateralType.rate) {
            log.postCollateralizationRatio =
              (log.collateralAfter * pricePoint.newValue) / (log.debtAfter * vault.collateralType.rate);
          } else {
            log.postCollateralizationRatio = 0;
          }
        }
        log.timestamp = pricePoint.timestamp;
      }
      if (logs.find((logPoint) => +logPoint.timestamp == +pricePoint.timestamp)) {
        return null;
      }
      return log;
    })
    .filter((v) => v && v.timestamp > minTimestamp);
  const mergeTwoArrays = (array1, array2) => {
    const mergedArray = [];
    let array1Index = 0;
    let array2Index = 0;
    while (array1Index < array1.length || array2Index < array2.length) {
      if (!array1[array1Index]) {
        mergedArray.push(array2[array2Index]);
        array2Index++;
        continue;
      }
      if (!array2[array2Index]) {
        mergedArray.push(array1[array1Index]);
        array1Index++;
        continue;
      }
      const array1TopValue = array1[array1Index].timestamp;
      const array2TopValue = array2[array2Index].timestamp;
      if (array1TopValue < array2TopValue) {
        mergedArray.push(array1[array1Index]);
        array1Index++;
        continue;
      } else {
        mergedArray.push(array2[array2Index]);
        array2Index++;
        continue;
      }
    }
    return mergedArray;
  };
  const duplicateLogsWithPricePoint = mergeTwoArrays(
    pricePointsWithoutLogsPoint,
    logs
      .map((log) => {
        const v = Object.assign({}, log);
        return v;
      })
      .reverse(),
  ).map((log) => {
    log.postCollateralizationRatio = log.postCollateralizationRatio * 100;
    return log;
  });
  const uniqueLogsWithPricePoint = duplicateLogsWithPricePoint;
  const logsPercent =
    priceList.length && logs[0].timestamp - logs[logs.length - 1].timestamp > 60 * 60 * 24 * 7
      ? uniqueLogsWithPricePoint
      : logs.map((log) => {
          log.postCollateralizationRatio = log.postCollateralizationRatio * 100;
          return log;
        });
  // add liquidation ratio change data points to datasets
  const getLiquidationRatioChangeLogWithBothEnds = (originalData) => {
    if (!logs.length || !originalData.length) {
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

  // set liquidation ratio value
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
        height: 250,
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
          <YAxis yAxisId={1} label={{ value: 'CR', angle: -90, dx: -20, fill: '#7E7E87' }} />
          <YAxis yAxisId={2} orientation="right" label={{ value: 'JPYSC', angle: -90, dx: 20, fill: '#7E7E87' }} />
          <Area
            data={logsPercent}
            yAxisId={2}
            dataKey="debtAfter"
            type="stepAfter"
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
