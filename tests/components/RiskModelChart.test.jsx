import React from 'react';
import { render, act } from '@testing-library/react';
import RiskModelChart from '../../src/components/RiskModelChart';

describe('RiskModelChart component', () => {
  beforeAll(() => {});
  test('empty', async () => {
    const riskPremiumByDebtExposure = [];
    const maximumDebtCeiling = 2;
    const totalDebtByVaultType = 3;
    await act(async () =>
      render(
        <RiskModelChart
          riskPremiumByDebtExposure={riskPremiumByDebtExposure}
          maximumDebtCeiling={maximumDebtCeiling}
          totalDebtByVaultType={totalDebtByVaultType}
        />,
      ),
    );
    expect(document.querySelector('div')).toBeTruthy();
  });
  test('some data', async () => {
    const riskPremiumByDebtExposure = [
      { debtExposure: 1, riskPremium: 2 },
      { debtExposure: 2, riskPremium: 4 },
      { debtExposure: 3, riskPremium: 6 },
    ];
    const maximumDebtCeiling = 2;
    const totalDebtByVaultType = 3;
    await act(async () =>
      render(
        <RiskModelChart
          riskPremiumByDebtExposure={riskPremiumByDebtExposure}
          maximumDebtCeiling={maximumDebtCeiling}
          totalDebtByVaultType={totalDebtByVaultType}
        />,
      ),
    );
    expect(document.querySelector('div')).toBeTruthy();
  });
});
