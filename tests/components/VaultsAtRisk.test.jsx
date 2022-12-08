import React from 'react';
import { render, act } from '@testing-library/react';
import VaultsAtRisk from '../../src/components/VaultsAtRisk';

describe('VaultsAtRisk component', () => {
  beforeAll(() => {});
  test('empty', async () => {
    const props = {
      allVaults: {
        'FAU-A': [],
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
    await act(async () => render(<VaultsAtRisk {...props} ilk="FAU-A" />));
    expect(document.querySelector('div')).toBeTruthy();
  });
  test('some data', async () => {
    const props = {
      allVaults: {
        'FAU-A': [
          { id: 1, debt: 4321, collateral: 12345678 },
          { id: 1123, debt: 1234, collateral: 87654 },
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
    await act(async () => render(<VaultsAtRisk {...props} ilk="FAU-A" />));
    expect(document.querySelector('div')).toBeTruthy();
  });
});
