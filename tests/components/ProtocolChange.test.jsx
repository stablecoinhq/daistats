import React from 'react';
import { render, act } from '@testing-library/react';
import ProtocolChange from '../../src/components/ProtocolChange';

describe('ProtocolChange component', () => {
  beforeAll(() => {});
  test('should show', async () => {
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
});
