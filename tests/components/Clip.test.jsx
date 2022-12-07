import React from 'react';
import { render, screen } from '@testing-library/react';
import { prepareMocksResult } from '../utils/helper';
import Clip from '../../src/components/Clip';

describe('clip component', () => {
  beforeAll(() => {});
  test('should show table header', () => {
    expect(prepareMocksResult).toBeTruthy();
    render(
      <table>
        <Clip heading={true} />
      </table>,
    );
    expect(screen.getAllByText(/clip/).length).toBeTruthy();
  });
});
