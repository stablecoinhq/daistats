import React, { useState, useEffect } from 'react'
import { useTranslate } from 'react-polyglot';
import { gql, GraphQLClient } from "graphql-request"

function IndividualVault(props) {


  const [cdpId, setCdpId] = useState("0x468e7aa34ca25986c7e46d6b78f1dfff0a8c8c02-ETH-A");
  const [vault, setVault] = useState(undefined);
  const updateVault = () => {
    const getData = async () => {
      const subgraphClient = new GraphQLClient(
        //"https://api.thegraph.com/subgraphs/name/protofire/maker-protocol",
        "https://api.studio.thegraph.com/query/33920/dai-goerli-test/v0.0.6",
        { mode: "cors" }
      )

      const getSingleVault = async (cdpId) => {
        let vault;
        try {
          const vaultByCdpId = await subgraphClient.request(gql`{
            vaults(first: 1, where: {cdpId: ${cdpId}}) {
              id,
              cdpId,
              openedAt,
              updatedAt,
              collateral,
              debt,
              collateralType{
                id
              },
              logs(orderBy: timestamp, orderDirection: desc, first: 1000) {
                __typename,
                transaction,
                timestamp,
                ... on VaultCreationLog {
                  id,
                },
                ... on VaultCollateralChangeLog {
                  id,
                  collateralDiff,
                  collateralAfter,
                  collateralBefore,
                }
                ... on VaultDebtChangeLog {
                  id,
                  debtDiff,
                  debtAfter,
                  debtBefore
                },
                ... on VaultTransferChangeLog {
                  id,
                  previousOwner{id},
                  nextOwner{id},
                },
                ...on VaultSplitChangeLog {
                  id,
                  dst,
                  src,
                  collateralToMove,
                  debtToMove,
                },
              }
            }
          }`)
          if (vaultByCdpId) {
            vault = vaultByCdpId
          }
        } catch (err) {
          console.error("Vault could not be retrieved by CdpId", err)
        }
        if (!vault) {
          try {
            const vaultById = await subgraphClient.request(gql`{
              vaults(first: 1, where: {id: "${cdpId}"}) {
                id,
                cdpId,
                openedAt,
                updatedAt,
                collateral,
                debt,
                collateralType{
                  id
                },
                logs(orderBy: timestamp, orderDirection: desc, first: 1000) {
                  __typename,
                  transaction,
                  timestamp,
                  ... on VaultCreationLog {
                    id,
                  },
                  ... on VaultCollateralChangeLog {
                    id,
                    collateralDiff,
                    collateralAfter,
                    collateralBefore,
                  }
                  ... on VaultDebtChangeLog {
                    id,
                    debtDiff,
                    debtAfter,
                    debtBefore
                  },
                  ... on VaultTransferChangeLog {
                    id,
                    previousOwner{id},
                    nextOwner{id},
                  },
                  ...on VaultSplitChangeLog {
                    id,
                    dst,
                    src,
                    collateralToMove,
                    debtToMove,
                  },
                }
              }
            }`)
            if (vaultById) {
              vault = vaultById
            }
          } catch (err) {
            console.error("Vault could not be retrieved by id", err)
          }
        }
        if (!vault) {
          console.error("Vault could not be retrieved")
          vault = undefined;
        }
        return vault
      }

      if (cdpId) {
        const vault = await getSingleVault(cdpId);
        console.log(JSON.stringify({ vault, msg: "vault in getData" }))
        setVault((vault.vaults && vault.vaults[0]) ? vault.vaults[0] : {})
      }
    }
    getData();
  }
  useEffect(updateVault, []);

  const t = useTranslate()
  return (
    <div>
      <div className="columns">
        <div className="column">
          <div className="has-text-centered">
            <div className="box has-text-centered"  >
              <p className="subtitle is-size-6">
                CdpId/VaultId:
                <input
                  type="text"
                  value={cdpId ? cdpId : undefined}
                  onChange={event => setCdpId(event.target.value)}
                />
                <button onClick={updateVault}>Go</button>
              </p> {
                vault ? <div>
                  <p className="subtitle is-size-6">
                    MinCollateralRatio: {props.ilksByName[vault.collateralType.id].mat}
                  </p>
                  <p className="subtitle is-size-6">
                    CurrentPrice: {props.ilksByName[vault.collateralType.id].price}
                  </p>
                  <p className="subtitle is-size-6">
                    CdpId: {vault.cdpId ? vault.cdpId : vault.id}
                  </p>
                  <p className="subtitle is-size-6">
                    Collateral: {vault.collateral}
                  </p>
                  <p className="subtitle is-size-6">
                    Debt: {(parseFloat(vault.debt) * parseFloat(props.ilksByName[vault.collateralType.id].rate))}
                  </p>
                  <p className="subtitle is-size-6">
                    CurrentCollateralRatio: {parseFloat(vault.collateral) * parseFloat(props.ilksByName[vault.collateralType.id].price) / (parseFloat(vault.debt) * parseFloat(props.ilksByName[vault.collateralType.id].rate))}
                  </p>
                </div> : <div></div>
              }
            </div>
          </div>
        </div>
      </div>
      <hr />
    </div>
  )
}

export default IndividualVault
