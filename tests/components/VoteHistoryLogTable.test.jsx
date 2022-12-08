import React from 'react';
import { render, screen, act } from '@testing-library/react';
import VoteHistoryLogTable from '../../src/components/VoteHistoryLogTable';

describe('VoteHistoryLogTable component', () => {
  beforeAll(() => { });
  test('empty', async () => {
    await act(async () => render(
      <table>
        <VoteHistoryLogTable heading={true} />
      </table>,
    ));
    expect(screen.getAllByText(/daistats.vote_history.description/).length).toBeTruthy();
  });
  test('some data', async () => {
    const props = {
      log: {
        timestamp: 12345678,
        transaction: "0x01",
        description: "some user voted"
      }
    }
    await act(async () => render(
      <table>
        <tbody>
          <VoteHistoryLogTable heading={false} {...props} />
        </tbody>
      </table>,
    ));
    expect(screen.getAllByText(/some user voted/).length).toBeTruthy();
  });
});
