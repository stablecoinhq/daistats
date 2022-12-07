import React from 'react';
import { render, screen } from '@testing-library/react';
import AuctionParticipants from '../../src/components/AuctionParticipants';

describe('AuctionParticipants component', () => {
  beforeAll(() => {});
  test('should chart container', () => {
    render(<AuctionParticipants />);
    expect(screen.getAllByText(/auction_participants_chart/).length).toBeTruthy();
  });
});
