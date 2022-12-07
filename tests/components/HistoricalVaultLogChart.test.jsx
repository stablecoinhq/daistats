import React from 'react';
import { render } from '@testing-library/react';
import HistoricalVaultLogChart from '../../src/components/HistoricalVaultLogChart';

describe('HistoricalVaultLogChart component', () => {
  beforeAll(() => {});
  test('empty', () => {
    const vault = {};
    const currentCollateralRatio = 1;
    render(<HistoricalVaultLogChart vault={vault} currentCollateralRatio={currentCollateralRatio} />);
    const container = document.querySelector('.recharts-responsive-container');
    expect(container).toBeTruthy();
  });
  test('chart is rendered', () => {
    const vault = {
      logs: [{ timestamp: 1 }],
      debt: '999',
      postCollateralizationRatio: '1.05',
      preCollateralizationRatio: '1.07',
      liquidationRatioChangeLog: [
        { timestamp: 1, mat: '1.01234' },
        { timestamp: 10, mat: '1.01234' },
      ],
    };
    const currentCollateralRatio = 1;
    render(<HistoricalVaultLogChart vault={vault} currentCollateralRatio={currentCollateralRatio} />);
    const container = document.querySelector('.recharts-responsive-container');
    expect(container).toBeTruthy();
  });
});
