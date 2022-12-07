import React from 'react';
import { render, screen } from '@testing-library/react';
import ProtocolChange from '../../src/components/ProtocolChange';

describe('ProtocolChange component', () => {
  beforeAll(() => { });
  test('should show', () => {
    const props = {
      subgraphClient: {
        request: async () => {
          return {
            protocolParameterChangeLogs: [],
          };
        },
      },
    }; render(
      <ProtocolChange {...props} />
    );
    expect(document.querySelector('.columns')).toBeTruthy();
  });
});
