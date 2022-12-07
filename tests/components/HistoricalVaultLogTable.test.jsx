import React from 'react';
import { render, screen } from '@testing-library/react';
import { prepareMocksResult } from '../utils/helper';
import HistoricalVaultLogTable from '../../src/components/HistoricalVaultLogTable';

describe('HistoricalVaultLogTable component', () => {
  beforeAll(() => {});
  test('should show table header', () => {
    expect(prepareMocksResult).toBeTruthy();
    render(
      <table>
        <HistoricalVaultLogTable heading={true} />
      </table>,
    );
    expect(screen.getAllByText(/collateral_change/).length).toBeTruthy();
  });
});
