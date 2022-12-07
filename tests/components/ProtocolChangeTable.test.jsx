import React from 'react';
import { render, screen } from '@testing-library/react';
import ProtocolChangeTable from '../../src/components/ProtocolChangeTable';

describe('ProtocolChangeTable component', () => {
  beforeAll(() => {});
  test('should show', () => {
    const props = {
      subgraphClient: {
        request: async () => {
          return {
            protocolParameterChangeLogs: [],
          };
        },
      },
    };
    render(
      <table>
        <ProtocolChangeTable {...props} heading={true} />
      </table>,
    );
    expect(screen.getAllByText(/changed_parameter_category/).length).toBeTruthy();
  });
});
