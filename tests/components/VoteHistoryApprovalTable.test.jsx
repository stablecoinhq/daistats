import React from 'react';
import { render, screen } from '@testing-library/react';
import VoteHistoryApprovalTable from '../../src/components/VoteHistoryApprovalTable';

describe('VoteHistoryApprovalTable component', () => {
  beforeAll(() => {});
  test('should show', () => {
    render(
      <table>
        <VoteHistoryApprovalTable heading={true} />
      </table>,
    );
    expect(screen.getAllByText(/approvals/).length).toBeTruthy();
  });
});
