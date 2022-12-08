import React from 'react';
import { render, screen, act } from '@testing-library/react';
import VoteHistoryApprovalTable from '../../src/components/VoteHistoryApprovalTable';

describe('VoteHistoryApprovalTable component', () => {
  beforeAll(() => {});
  test('empty', async () => {
    await act(async () =>
      render(
        <table>
          <VoteHistoryApprovalTable heading={true} />
        </table>,
      ),
    );
    expect(screen.getAllByText(/approvals/).length).toBeTruthy();
  });
  test('some data', async () => {
    const props = {
      log: { address: '0x01', approvals: '12345678901234567' },
    };
    await act(async () =>
      render(
        <table>
          <tbody>
            <VoteHistoryApprovalTable heading={false} {...props} />
          </tbody>
        </table>,
      ),
    );
    expect(screen.getAllByText(/12345678901234567/).length).toBeTruthy();
  });
});
