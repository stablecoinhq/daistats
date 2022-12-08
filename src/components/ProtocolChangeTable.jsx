import React from 'react';
import { useTranslate } from 'react-polyglot';

function ProtocolChangeTable(props) {
  const t = useTranslate();
  const log = props.log;
  if (props.heading) {
    return (
      <thead>
        <tr>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t('daistats.protocol_change.time')}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t('daistats.protocol_change.transaction')}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t('daistats.protocol_change.contract')}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t('daistats.protocol_change.changed_parameter')}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t('daistats.protocol_change.changed_parameter_category')}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t('daistats.protocol_change.changed_value')}</th>
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
          <a href={`${props.etherscanBaseUrl}/tx/${log.transaction}`} target="_blank" rel="noopener noreferrer">
            <p className="subtitle is-size-6" style={{ 'lineHeight': '24px' }}>
              {log.transaction}
            </p>
          </a>
        </td>
        <td className="has-text-right" title={log.contractType}>
          {log.contractType}
        </td>
        <td className="has-text-right" title={log.parameterKey1}>
          {log.parameterKey1}
        </td>
        <td className="has-text-right" title={log.parameterKey2}>
          {log.parameterKey2}
        </td>
        <td className="has-text-left" title={log.parameterValue}>
          {log.parameterValue}
        </td>
      </tr>
    );
  }
}

export default ProtocolChangeTable;
