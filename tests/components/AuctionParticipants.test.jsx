import React from 'react';
import { render, screen } from '@testing-library/react';
import AuctionParticipants from '../../src/components/AuctionParticipants';

describe('AuctionParticipants component', () => {
  beforeAll(() => {});
  test('should chart container', () => {
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
});
