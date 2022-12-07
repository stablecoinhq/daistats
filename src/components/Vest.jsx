import React from 'react';
import { useTranslate } from 'react-polyglot';

const formatTwoDp = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function Vest(props) {
  const t = useTranslate();
  const award = props.award;
  if (props.heading) {
    return (
      <thead>
        <tr>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t('daistats.vesting.id')}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t('daistats.vesting.recipient')}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t('daistats.vesting.public')}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t('daistats.vesting.claimed')}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t('daistats.vesting.unpaid')}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t('daistats.vesting.accrued')}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t('daistats.vesting.total_reward')}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t('daistats.vesting.start_date')}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t('daistats.vesting.cliff_date')}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t('daistats.vesting.end_date')}</th>
        </tr>
      </thead>
    );
  } else {
    return (
      <tr>
        <td className="has-text-right" title={award.id}>
          {award.id}
        </td>
        <td className="has-text-left">
          <a href={`${props.etherscanBaseUrl}/address/${award.usr}`} target="_blank" rel="noopener noreferrer">
            <p className="subtitle is-size-6" style={{ 'lineHeight': '24px' }}>
              {award.usrName}
              {!award.usrName && award.usr.substring(0, 6) + '...' + award.usr.substring(37, 42)}
            </p>
          </a>
        </td>
        <td className="has-text-left" title={award.res}>
          {award.res === 0 ? 'Yes' : 'No'}
        </td>
        <td className="has-text-right" title={award.rxd}>
          {formatTwoDp.format(award.rxd)}
        </td>
        <td className="has-text-right" title={award.unpaid}>
          {formatTwoDp.format(award.unpaid)}
        </td>
        <td className="has-text-right" title={award.accrued}>
          {formatTwoDp.format(award.accrued)}
        </td>
        <td className="has-text-right" title={award.tot}>
          {formatTwoDp.format(award.tot)}
        </td>
        <td className="has-text-right" style={{ paddingLeft: '0.2em', paddingRight: '0.2em' }}>
          {award.bgn}
        </td>
        <td className="has-text-right" style={{ paddingLeft: '0.2em', paddingRight: '0.2em' }}>
          {award.clf}
        </td>
        <td className="has-text-right" style={{ paddingLeft: '0.2em', paddingRight: '0.2em' }}>
          {award.fin}
        </td>
      </tr>
    );
  }
}

export default Vest;
