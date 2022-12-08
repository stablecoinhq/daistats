import React, { useCallback, useMemo } from 'react';
import { useTranslate } from 'react-polyglot';
import { ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const AuctionParticipantsChart = (props) => {
  const t = useTranslate();
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

      if (name === 'keepers') {
        return [output, t('daistats.auction_participants.keepers')];
      }

      if (name === 'takers') {
        return [output, t('daistats.auction_participants.takers')];
      }

      return output;
    },
    [amountFormatter, t],
  );

  return (
    <div
      style={{
        width: '100%',
        height: 300,
        marginTop: -24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ResponsiveContainer>
        <ComposedChart data={props.auctions ?? []}>
          <XAxis
            type="number"
            dataKey="timestamp"
            axisLine={false}
            tickFormatter={(unixTime) => new Date(unixTime * 1000).toLocaleDateString()}
            domain={['auto', 'auto']}
          />
          <YAxis domain={['auto', 'auto']} yAxisId={1} label={{ value: 'Users', angle: -90, dx: -20, fill: '#7E7E87' }} />
          <Line
            yAxisId={1}
            dataKey="keepers"
            type="stepAfter"
            dot={false}
            stackId={1}
            animationDuration={750}
            stroke="#7E7E87"
          />
          <Line
            yAxisId={1}
            dataKey="takers"
            type="stepAfter"
            dot={false}
            stackId={1}
            animationDuration={750}
            stroke="#7E0087"
          />
          <Tooltip labelStyle={{ fontWeight: 'bold' }} formatter={formatTooltipValue} labelFormatter={formatTooltipTitle} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AuctionParticipantsChart;
