import React from 'react';
import { render, screen } from '@testing-library/react';
import ProtocolChangeTable from '../../src/components/ProtocolChangeTable';

describe('ProtocolChangeTable component', () => {
  beforeAll(() => {});
  test('empty', () => {
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
  test('empty', () => {
    const props = {
      log: {
        contractType: 'ABACUS',
        parameterKey1: 'step',
        parameterKey2: '',
        parameterValue: '0.00000000000000000000000009',
        transaction: '0x00000000',
        timestamp: 88888888,
      },
    };
    render(
      <table>
        <tbody>
          <ProtocolChangeTable {...props} />
        </tbody>
      </table>,
    );
    expect(screen.getAllByText(/1972/).length).toBeTruthy();
  });
});
