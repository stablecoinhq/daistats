import React from 'react';
import { render, act } from '@testing-library/react';
import VoteHistory from '../../src/components/VoteHistory';

describe('VoteHistory component', () => {
  beforeAll(() => {});
  test('empty', async () => {
    const props = {
      subgraphClient: {
        request: async () => {
          return null;
        },
      },
    };
    await act(async () => render(<VoteHistory {...props} />));
    expect(document.querySelector('div.columns')).toBeTruthy();
  });
  test('some data', async () => {
    const props = {
      subgraphClient: {
        request: async () => {
          return {
            voteLogs: [
              {
                timestamp: 1234235235,
                transaction: '0x00000000',
                sender: {
                  id: '0x1234',
                  voteWeight: '99991234',
                },
                __typename: 'VoteLogLock',
                wad: '12312412512512',
              },
            ],
          };
        },
      },
    };
    await act(async () => render(<VoteHistory {...props} />));
    expect(document.querySelector('div.columns')).toBeTruthy();
  });
});
