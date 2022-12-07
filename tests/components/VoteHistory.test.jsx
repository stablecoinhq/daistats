import React from 'react';
import { render } from '@testing-library/react';
import VoteHistory from '../../src/components/VoteHistory';

describe('VoteHistory component', () => {
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
    render(<VoteHistory {...props} />);
    expect(document.querySelector('div.columns')).toBeTruthy();
  });
});
