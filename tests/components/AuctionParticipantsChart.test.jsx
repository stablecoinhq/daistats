import React from 'react';
import { render } from '@testing-library/react';
import AuctionParticipantsChart from '../../src/components/AuctionParticipantsChart';

describe('AuctionParticipantsChart component', () => {
  beforeAll(() => {});
  test('should draw chart', () => {
    const props = {
      auctions: [],
    };
    render(<AuctionParticipantsChart {...props} />);
    // Without screen, you need to provide a container:
    const container = document.querySelector('.recharts-responsive-container');
    expect(container).toBeTruthy();
  });
});
