import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import RiskModel from '../../src/components/RiskModel';

describe('RiskModel component', () => {
  beforeAll(() => {});
  test('empty', async () => {
    const props = {};
    await act(async () => render(<RiskModel {...props} />));
    expect(screen.getAllByText(/maximum_debt_ceiling_for_risk_premium/).length).toBeTruthy();
  });
  test('some data', async () => {
    const props = {
      allVaults: {
        'FAU-A': [
          { debt: 4321, collateral: 12345678 },
          { debt: 1234, collateral: 87654 },
        ],
      },
      ilksByName: {
        'FAU-A': {
          Art: 1,
          price: 123,
          rate: 123214,
          mat: 1.04,
        },
      },
    };
    await act(async () => render(<RiskModel {...props} />));
    expect(screen.getAllByText(/maximum_debt_ceiling_for_risk_premium/).length).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByText(/daistats.risk_model.go/)));
  });
});
