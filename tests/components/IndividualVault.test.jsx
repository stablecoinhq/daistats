import React from 'react';
import { render, screen } from '@testing-library/react';
import IndividualVault from '../../src/components/IndividualVault';

describe('IndividualVault component', () => {
  beforeAll(() => {});
  test('should show', () => {
    const props = {};
    const cdpId = '1';
    render(<IndividualVault {...props} cdpId={cdpId} />);
    expect(screen.getAllByText(/cdp_id_or_vault_id/).length).toBeTruthy();
  });
});
