import React from 'react';
import { render, screen } from '@testing-library/react';
import VoteHistoryLogTable from '../../src/components/VoteHistoryLogTable';

describe('VoteHistoryLogTable component', () => {
  beforeAll(() => {});
  test('should show', () => {
    render(
      <table>
        <VoteHistoryLogTable heading={true} />
      </table>,
    );
    expect(screen.getAllByText(/daistats.vote_history.description/).length).toBeTruthy();
  });
});
