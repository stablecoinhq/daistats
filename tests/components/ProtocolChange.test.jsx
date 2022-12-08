import React from 'react';
import { render, act } from '@testing-library/react';
import ProtocolChange from '../../src/components/ProtocolChange';

describe('ProtocolChange component', () => {
  beforeAll(() => {});
  test('empty', async () => {
    const props = {
      subgraphClient: {
        request: async () => {
          return {
            protocolParameterChangeLogs: [],
          };
        },
      },
    };
    await act(async () => render(<ProtocolChange {...props} />));
    expect(document.querySelector('.columns')).toBeTruthy();
  });
  test('some data', async () => {
    const props = {
      subgraphClient: {
        request: async () => {
          return {
            protocolParameterChangeLogs: [
              {
                timestamp: 88888888,
                transaction: '0x00000000',
                contractType: 'ABACUS',
                __typename: 'ProtocolParameterChangeLogBigDecimal',
                parameterKey1: 'step',
                parameterKey2: '',
                parameterValue: '0.00000000000000000000000009',
              },
            ],
          };
        },
      },
    };
    await act(async () => render(<ProtocolChange {...props} />));
    expect(document.querySelector('.columns')).toBeTruthy();
  });
});
