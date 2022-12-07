import React from 'react';
import { render, screen } from '@testing-library/react';
import RiskModel from '../../src/components/RiskModel';

describe('RiskModel component', () => {
  beforeAll(() => {});
  test('should show', () => {
    const props = {
      subgraphClient: {
        request: async () => {
          return {
            protocolParameterChangeLogs: [],
          };
        },
      },
    };
    render(<RiskModel {...props} />);
    expect(screen.getAllByText(/maximum_debt_ceiling_for_risk_premium/).length).toBeTruthy();
  });
});
