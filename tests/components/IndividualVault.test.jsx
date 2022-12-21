import React from 'react';
import { render, screen, act } from '@testing-library/react';
import IndividualVault from '../../src/components/IndividualVault';

describe('IndividualVault component', () => {
  beforeAll(() => {});
  test('should show', async () => {
    const props = {
      subgraphClient: {
        request: async (query) => {
          if (query.match(/vaults\(/)) {
            return {
              vaults: [
                {
                  id: '0x0add',
                  cdpId: '1',
                  openedAt: '1',
                  updatedAt: '1',
                  collateral: '1000',
                  debt: '10000',
                  collateralType: {
                    id: 'ETH-A',
                    rate: '1.04',
                  },
                  logs: [],
                },
              ],
              saleAuctions: [
                {
                  id: '0x0000',
                  vault: {
                    id: '0x0add',
                  },
                  amountDaiToRaise: '1',
                  amountCollateralToSell: '1',
                  boughtAt: 1,
                  isActive: 1,
                  startedAt: 1,
                  resetedAt: 2,
                  updatedAt: 4,
                },
              ],
              vaultSplitChangeLogs: [
                {
                  __typename: 'any-type-name',
                  id: '1',
                  dst: '0x01',
                  src: '0x02',
                  collateralToMove: '1000',
                  debtToMove: '10000',
                  transaction: '0x0000',
                  timestamp: 4,
                  block: 1234,
                },
              ],
            };
          } else if (query.match(/protocolParameterChangeLogBigDecimals\(/)) {
            return [
              { mat: '1.03', timestamp: 4 },
              { mat: '1.04', timestamp: 5 },
            ];
          } else if (query.match(/collateralPriceUpdateLogs\(/)) {
            return [
              {
                id: '0x12341234',
                newValue: 1234,
                newSpotPrice: 1234,
                block: 800000,
                timestamp: 1671439090,
                transaction: '0x12341234',
              },
            ];
          }
        },
      },
      ilksByName: {
        'ETH-A': {
          price: '123456',
        },
      },
    };
    const cdpId = '1';
    await act(async () => render(<IndividualVault {...props} cdpId={cdpId} />));
    expect(screen.getAllByText(/cdp_id_or_vault_id/).length).toBeTruthy();
  });

  test('empty case', async () => {
    const props = {
      subgraphClient: {
        request: async () => {
          return null;
        },
      },
    };
    const cdpId = '1';
    await act(async () => render(<IndividualVault {...props} cdpId={cdpId} />));
    expect(screen.getAllByText(/cdp_id_or_vault_id/).length).toBeTruthy();
  });
});
