import React from 'react';
import { useTranslate } from 'react-polyglot';

function HistoricalVaultLogTable(props) {
  const _t = useTranslate();
  const log = props.log;
  if (props.heading) {
    return (
      <thead>
        <tr>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>Time</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>Operations</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>Collateral Change ()</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>Debt Change (DAI)</th>
          {/* <th style={{ color: "#e6e8f1", fontWeight: 400 }}>Paid fees (DAI)</th> */}
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>Market Price (USD)</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>Oracle Price (USD)</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>Pre Collateralization Ratio</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>Post Collateralization Ratio</th>
        </tr>
      </thead>
    );
  } else {
    return (
      <tr>
        <td className="has-text-right" title={log.timestamp}>
          {new Date(parseInt(log.timestamp) * 1000).toLocaleString()}
        </td>
        <td className="has-text-left">
          <a href={`https://etherscan.io/tx/${log.transaction}`} target="_blank" rel="noopener noreferrer">
            <p className="subtitle is-size-6" style={{ 'lineHeight': '24px' }}>
              {log.__typename}
            </p>
          </a>
        </td>
        <td className="has-text-right" title={log.collateralChange}>
          {log.collateralChange}
        </td>
        <td className="has-text-right" title={log.debtChange}>
          {log.debtChange}
        </td>
        {/* <td className="has-text-right" title={log.paidFees}>{log.paidFees}</td> */}
        <td className="has-text-right" title={log.oraclePrice}>
          {log.oraclePrice}
        </td>
        <td className="has-text-right" title={log.oraclePrice}>
          {log.oraclePrice}
        </td>
        <td className="has-text-right" title={log.preCollateralizationRatio}>
          {log.preCollateralizationRatio}
        </td>
        <td className="has-text-right" title={log.postCollateralizationRatio}>
          {log.postCollateralizationRatio}
        </td>
      </tr>
    );
  }
}

export default HistoricalVaultLogTable;
