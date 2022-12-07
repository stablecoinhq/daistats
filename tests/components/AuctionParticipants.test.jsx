import React from 'react';
import { render, screen, act } from '@testing-library/react';
import AuctionParticipants from '../../src/components/AuctionParticipants';

describe('AuctionParticipants component', () => {
  beforeAll(() => {});
  test('should show empty chart', () => {
    const props = {
      subgraphClient: {
        request: async () => {
          return {
            saleAuctions: [],
          };
        },
      },
    };
    render(<AuctionParticipants {...props} />);
    expect(screen.getAllByText(/auction_participants_chart/).length).toBeTruthy();
  });
  test('should show non-empty chart', async () => {
    const props = {
      subgraphClient: {
        request: async () => {
          return {
            saleAuctions: [
              { boughtAt: 1, userIncentives: { id: '0x02' }, userTaker: '0x01' },
              { boughtAt: 1, userIncentives: { id: '0x02' }, userTaker: '0x03' },
              { boughtAt: 2, userIncentives: { id: '0x02' }, userTaker: '0x04' },
              { boughtAt: 3, userIncentives: { id: '0x03' }, userTaker: '0x01' },
              { boughtAt: 3, userIncentives: { id: '0x02' }, userTaker: '0x04' },
            ],
          };
        },
      },
    };
    await act(async () => render(<AuctionParticipants {...props} />));
    expect(screen.getAllByText(/auction_participants_chart/).length).toBeTruthy();
  });
});
