import React from 'react';
import { render } from '@testing-library/react';
import VaultsAtRisk from '../../src/components/VaultsAtRisk';

describe('VaultsAtRisk component', () => {
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
    render(<VaultsAtRisk {...props} ilk="ETH-A" />);
    expect(document.querySelector('div')).toBeTruthy();
  });
});
