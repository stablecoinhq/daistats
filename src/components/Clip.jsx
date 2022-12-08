import React from 'react';
import { useTranslate } from 'react-polyglot';

const formatAmount = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatPercent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function Clip(props) {
  const t = useTranslate();
  if (props.heading) {
    return (
      <thead>
        <tr>
          <th style={{ color: '#e6e8f1', fontWeight: 400, paddingLeft: '0.1em', paddingRight: '0.1em' }}>
            {t('daistats.auction.clip.collateral_ilk')}
          </th>
          <th style={{ color: '#e6e8f1', fontWeight: 400, paddingLeft: '0.1em', paddingRight: '0.1em' }}>
            {t('daistats.auction.clip.clip_auctions')}
          </th>
          <th style={{ color: '#e6e8f1', fontWeight: 400, paddingLeft: '0.1em', paddingRight: '0.1em' }}>
            {t('daistats.auction.clip.active_auctions')}
          </th>
          <th style={{ color: '#e6e8f1', fontWeight: 400, paddingLeft: '0.1em', paddingRight: '0.1em' }}>
            {t('daistats.auction.clip.bad_debt_dirt')}
          </th>
          <th style={{ color: '#e6e8f1', fontWeight: 400, paddingLeft: '0.1em', paddingRight: '0.1em' }}>
            {t('daistats.auction.clip.limit_hole')}
          </th>
          <th style={{ color: '#e6e8f1', fontWeight: 400, paddingLeft: '0.1em', paddingRight: '0.1em' }}>
            {t('daistats.auction.clip.penalty_chop')}
          </th>
          <th style={{ color: '#e6e8f1', fontWeight: 400, paddingLeft: '0.1em', paddingRight: '0.1em' }}>
            {t('daistats.auction.clip.price_change_multiplier_cut')}
          </th>
          <th style={{ color: '#e6e8f1', fontWeight: 400, paddingLeft: '0.1em', paddingRight: '0.1em' }}>
            {t('daistats.auction.clip.price_change_interval_step_seconds')}
          </th>
          <th style={{ color: '#e6e8f1', fontWeight: 400, paddingLeft: '0.1em', paddingRight: '0.1em' }}>
            {t('daistats.auction.clip.auction_price_multiplier_buf')}
          </th>
          <th style={{ color: '#e6e8f1', fontWeight: 400, paddingLeft: '0.1em', paddingRight: '0.1em' }}>
            {t('daistats.auction.clip.maximum_auction_drawdown_cusp')}
          </th>
          <th style={{ color: '#e6e8f1', fontWeight: 400, paddingLeft: '0.1em', paddingRight: '0.1em' }}>
            {t('daistats.auction.clip.max_auction_duration_tail_minutes')}
          </th>
          <th style={{ color: '#e6e8f1', fontWeight: 400, paddingLeft: '0.1em', paddingRight: '0.1em' }}>
            {t('daistats.auction.clip.kick_incentive_chip')}
          </th>
          <th style={{ color: '#e6e8f1', fontWeight: 400, paddingLeft: '0.1em', paddingRight: '0.1em' }}>
            {t('daistats.auction.clip.flat_kick_incentive_tip')}
          </th>
        </tr>
      </thead>
    );
  } else {
    const ilk = props.ilksByName[props.ilk];
    return (
      <tr>
        <td className="has-text-left">{props.token}</td>
        <td className="has-text-right">{formatAmount.format(ilk.kicks)}</td>
        <td className="has-text-right">{formatAmount.format(ilk.count)}</td>
        <td className="has-text-right">{formatAmount.format(ilk.dirt)}</td>
        <td className="has-text-right">{formatAmount.format(ilk.hole)}</td>
        <td className="has-text-right">{formatPercent.format(Math.abs(1 - ilk.chop))}</td>
        <td className="has-text-right">{formatAmount.format(ilk.cut)}</td>
        <td className="has-text-right">{formatAmount.format(ilk.step)}</td>
        <td className="has-text-right">{formatAmount.format(ilk.buf)}</td>
        <td className="has-text-right">{formatAmount.format(ilk.cusp)}</td>
        <td className="has-text-right">{formatAmount.format(ilk.tail / 60)}</td>
        <td className="has-text-right">{formatPercent.format(ilk.chip)}</td>
        <td className="has-text-right">{formatAmount.format(ilk.tip)}</td>
      </tr>
    );
  }
}
/*
FIXME show current starting price
Auction Price

    Auction Price Function (calc): Stairstep Exponential   - any way to find this?
        Price Change Multiplier (cut): 0.99    - from calc contract
        Price Change Interval (step): 90 seconds   - from calc contract
    Auction Price Multiplier (buf): 1.3   - from Dog ilk map?

Limits

    Maximum Auction Drawdown (cusp): 0.4
    Maximum Auction Duration (tail): 8,400 seconds
    Breaker Price Tolerance (tolerance): 0.5

Incentives

    Proportional Kick Incentive (chip): 0.1%
    Flat Kick Incentive (tip): 0 DAI

from clip:
    uint256 public buf;    // Multiplicative factor to increase starting price                  [ray]
    uint256 public tail;   // Time elapsed before auction reset                                 [seconds]
    uint256 public cusp;   // Percentage drop before auction reset                              [ray]
    uint64  public chip;   // Percentage of tab to suck from vow to incentivize keepers         [wad]
    uint192 public tip;    // Flat fee to suck from vow to incentivize keepers                  [rad]

    uint256   public kicks;   // Total auctions
    uint256[] public active;  // Array of active auction ids clip.count()

    Active Auction count abacus.count   or active.length?

    // Levels for circuit breaker
    // 0: no breaker
    // 1: no new kick()
    // 2: no new kick() or redo()
    // 3: no new kick(), redo(), or take()
    uint256 public stopped = 0;

clip_calc:
    uint256 public step; // Length of time between price drops [seconds]
    uint256 public cut;  // Per-step multiplicative factor     [ray]

*/

export default Clip;
