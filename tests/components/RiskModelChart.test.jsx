import React from 'react';
import { render } from '@testing-library/react';
import RiskModelChart from '../../src/components/RiskModelChart';

describe('RiskModelChart component', () => {
  beforeAll(() => {});
  test('should show', () => {
    const riskPremiumByDebtExposure = 1;
    const maximumDebtCeiling = 2;
    const totalDebtByVaultType = 3;
    render(
      <RiskModelChart
        riskPremiumByDebtExposure={riskPremiumByDebtExposure}
        maximumDebtCeiling={maximumDebtCeiling}
        totalDebtByVaultType={totalDebtByVaultType}
      />,
    );
    expect(document.querySelector('div')).toBeTruthy();
  });
});
