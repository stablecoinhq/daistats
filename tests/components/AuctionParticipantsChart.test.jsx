import React from 'react';
import { render } from '@testing-library/react';
import AuctionParticipantsChart from '../../src/components/AuctionParticipantsChart';

describe('AuctionParticipantsChart component', () => {
  beforeAll(() => {});
  test('should draw empty chart', () => {
    const props = {
      auctions: [],
    };
    render(<AuctionParticipantsChart {...props} />);
    // Without screen, you need to provide a container:
    const container = document.querySelector('.recharts-responsive-container');
    expect(container).toBeTruthy();
  });

  test('should draw non-empty chart', () => {
    const props = {
      auctions: [
        { timestamp: 1, keepers: 1, takers: 1 },
        { timestamp: 2, keepers: 1, takers: 2 },
        { timestamp: 3, keepers: 1, takers: 3 },
        { timestamp: 4, keepers: 1, takers: 4 },
        { timestamp: 5, keepers: 1, takers: 2 },
      ],
    };
    render(<AuctionParticipantsChart {...props} />);
    // Without screen, you need to provide a container:
    const container = document.querySelector('.recharts-responsive-container');
    expect(container).toBeTruthy();
  });
});
