import React from 'react';
import { render, screen } from '@testing-library/react';
import Clip from '../../src/components/Clip';

describe('clip component', () => {
  beforeAll(() => {});
  test('should show table header', () => {
    render(
      <table>
        <Clip heading={true} />
      </table>,
    );
    expect(screen.getAllByText(/clip/).length).toBeTruthy();
  });
});
