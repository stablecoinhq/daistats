import React, { useState, useEffect } from 'react'
import { useTranslate } from 'react-polyglot';
import { gql, GraphQLClient } from "graphql-request"
import HistoricalVaultLogChart from './HistoricalVaultLogChart';
import HistoricalVaultLogTable from './HistoricalVaultLogTable';

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
                id,
                rate,
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
          console.log("Vault could not be retrieved by CdpId. Retrying with vaultId...", err)
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
                  id,
                  rate,
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
            console.log("Vault could not be retrieved by id")
          }
        }
        if (!vault) {
          console.error("Vault could not be retrieved")
          vault = undefined;
        } else {
          if (vault.vaults[0] && vault.vaults[0].logs) {
            const collateralType = vault.vaults[0].collateralType
            const reversedLogs = vault.vaults[0].logs.reverse()
            const modifiedLogs = reversedLogs.map((log, index) => {

              // Collateral Change ()
              let collateralChange = 0;
              let collateralBefore = undefined;
              let collateralAfter = undefined;
              if (log.__typename === 'VaultCollateralChangeLog') {
                collateralChange = parseFloat(log.collateralDiff)
                collateralBefore = parseFloat(log.collateralBefore)
                collateralAfter = parseFloat(log.collateralAfter)
              } else if (log.__typename === 'VaultSplitChangeLog') {
                if (vault.id.includes(log.src)) {
                  collateralChange = -parseFloat(log.collateralToMove)
                } else if (vault.id.includes(log.dst)) {
                  collateralChange = parseFloat(log.collateralToMove)
                }
              } else if (log.__typename === 'VaultTransferChangeLog') {
                if (vault.id.includes(log.previousOwner)) {
                  collateralChange = -0
                } else if (vault.id.includes(log.nextOwner)) {
                  collateralChange = 0
                }
              } else if (index !== 0 && index > 1) {
                const previousLog = reversedLogs[index - 1]
                collateralChange = parseFloat(log.collateral) - parseFloat(previousLog.collateral)
                if (Number.isNaN(collateralChange)) {
                  collateralChange = 0;
                }
              }
              log.collateralBefore = collateralBefore
              log.collateralAfter = collateralAfter
              log.collateralChange = collateralChange;

              // Debt Change (DAI)
              let debtChange = 0;
              let debtBefore = undefined;
              let debtAfter = undefined;
              if (log.__typename === 'VaultDebtChangeLog') {
                debtChange = parseFloat(log.debtDiff)
                debtBefore = parseFloat(log.debtBefore)
                debtAfter = parseFloat(log.debtAfter)
              } else if (log.__typename === 'VaultSplitChangeLog') {
                if (vault.id.includes(log.src)) {
                  debtChange = -parseFloat(log.debtToMove)
                } else if (vault.id.includes(log.dst)) {
                  debtChange = parseFloat(log.debtToMove)
                }
              } else if (log.__typename === 'VaultTransferChangeLog') {
                if (vault.id.includes(log.previousOwner)) {
                  debtChange = -0
                } else if (vault.id.includes(log.nextOwner)) {
                  debtChange = 0
                }
              } else if (index !== 0 && index > 1) {
                const previousLog = reversedLogs[index - 1]
                debtChange = parseFloat(log.debt) - parseFloat(previousLog.debt)
                if (Number.isNaN(debtChange)) {
                  debtChange = 0;
                }
              }
              log.debtBefore = debtBefore
              log.debtAfter = debtAfter
              log.debtChange = debtChange;

              // Paid fees (DAI)
              // Market Price (USD)
              // Oracle Price (USD)

              /**
                Collateral Change ()
                Debt Change (DAI)
                Paid fees (DAI)
                Market Price (USD)
                Oracle Price (USD)
                Pre Collateralization Ratio
                Post Collateralization Ratio
               */
              return log
            })
            const priceList = await Promise.all(modifiedLogs.map(log => {
              return subgraphClient.request(gql`{
                collateralPriceUpdateLogs(first: 1, orderBy: timestamp, orderDirection: desc, where: {timestamp_lte: ${log.timestamp}, collateral: "${collateralType.id}"}){
                  id,
                  newValue,
                  newSpotPrice,
                  block,
                  timestamp,
                  transaction,
                }
              }`)
            }))


            for (let logIndex = 0; logIndex < modifiedLogs.length; logIndex++) {
              // oracle price
              if (priceList[logIndex] &&
                priceList[logIndex].collateralPriceUpdateLogs &&
                priceList[logIndex].collateralPriceUpdateLogs[0] &&
                priceList[logIndex].collateralPriceUpdateLogs[0].newValue) {

                modifiedLogs[logIndex].oraclePrice = priceList[logIndex].collateralPriceUpdateLogs[0].newValue;
              } else if (modifiedLogs[logIndex - 1] && modifiedLogs[logIndex - 1].oraclePrice && modifiedLogs[logIndex - 1].oraclePrice) {
                modifiedLogs[logIndex].oraclePrice = modifiedLogs[logIndex - 1].oraclePrice
              } else {
                modifiedLogs[logIndex].oraclePrice = 0
              }
              const oraclePrice = modifiedLogs[logIndex].oraclePrice;

              // spot price
              if (priceList[logIndex] &&
                priceList[logIndex].collateralPriceUpdateLogs &&
                priceList[logIndex].collateralPriceUpdateLogs[0] &&
                priceList[logIndex].collateralPriceUpdateLogs[0].newSpotPrice) {

                modifiedLogs[logIndex].spotPrice = priceList[logIndex].collateralPriceUpdateLogs[0].newSpotPrice;
              } else if (modifiedLogs[logIndex - 1] && modifiedLogs[logIndex - 1].spotPrice && modifiedLogs[logIndex - 1].spotPrice) {
                modifiedLogs[logIndex].spotPrice = modifiedLogs[logIndex - 1].spotPrice
              } else {
                modifiedLogs[logIndex].spotPrice = 0
              }

              if (logIndex === 0) {
                modifiedLogs[logIndex].debtBefore = 0
                modifiedLogs[logIndex].collateralBefore = 0
                modifiedLogs[logIndex].debtAfter = 0
                modifiedLogs[logIndex].collateralAfter = 0
                modifiedLogs[logIndex].preCollateralizationRatio = 0
                modifiedLogs[logIndex].postCollateralizationRatio = 0

              } else {

                // debtBefore
                if (!modifiedLogs[logIndex].debtBefore) {
                  modifiedLogs[logIndex].debtBefore = modifiedLogs[logIndex - 1].debtAfter
                }

                // debtAfter
                if (!modifiedLogs[logIndex].debtAfter) {
                  if (!modifiedLogs[logIndex].debtChange) {
                    modifiedLogs[logIndex].debtAfter = modifiedLogs[logIndex].debtBefore
                  } else {
                    modifiedLogs[logIndex].debtAfter = modifiedLogs[logIndex - 1].debtAfter + modifiedLogs[logIndex].debtChange
                  }
                }

                // collateralBefore
                if (!modifiedLogs[logIndex].collateralBefore) {
                  modifiedLogs[logIndex].collateralBefore = modifiedLogs[logIndex - 1].collateralAfter
                }

                // collateralAfter
                if (!modifiedLogs[logIndex].collateralAfter) {
                  if (!modifiedLogs[logIndex].collateralChange) {
                    modifiedLogs[logIndex].collateralAfter = modifiedLogs[logIndex].collateralBefore
                  } else {
                    modifiedLogs[logIndex].collateralAfter = modifiedLogs[logIndex - 1].collateralAfter + modifiedLogs[logIndex].collateralChange
                  }
                }

                // Pre Collateralization Ratio
                if (parseFloat(modifiedLogs[logIndex].debtBefore)) {
                  modifiedLogs[logIndex].preCollateralizationRatio = (oraclePrice * parseFloat(modifiedLogs[logIndex].collateralBefore)) / (parseFloat(modifiedLogs[logIndex].debtBefore) * parseFloat(collateralType.rate))
                } else {
                  modifiedLogs[logIndex].preCollateralizationRatio = 0
                }
                // Post Collateralization Ratio
                if (parseFloat(modifiedLogs[logIndex].debtAfter)) {
                  modifiedLogs[logIndex].postCollateralizationRatio = (oraclePrice * parseFloat(modifiedLogs[logIndex].collateralAfter)) / (parseFloat(modifiedLogs[logIndex].debtAfter) * parseFloat(collateralType.rate))
                } else {
                  modifiedLogs[logIndex].postCollateralizationRatio = 0
                }
              }
            }



            vault.vaults[0].logs = modifiedLogs.reverse();
            console.log(JSON.stringify({ msg: "logs in getSingleVault", logs: vault.vaults[0].logs }))
          }
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
        <div className="column">
          <div className="box has-text-centered">
            <h3 className="title" title={props.debt}>
              {props.debt >= 420000000 && props.debt < 421000000 && <span role="img" aria-label="Tree">🌲</span>}
            </h3>
            <h4 className="subtitle is-size-3">{t('daistats.total_token', { token: 'Dai' })}</h4>
            {vault ?
              <HistoricalVaultLogChart data={props.historicalDebt} />
              : <div></div>
            }
          </div>
        </div>
      </div>
      <div className="columns">
        <div className="column">
          <h3 className="title" title={props.debt}>
            {props.debt >= 420000000 && props.debt < 421000000 && <span role="img" aria-label="Tree">🌲</span>}
          </h3>
          {vault ?
            <table className="table" style={{ margin: '0 auto', backgroundColor: '#192734', color: '#e6e8f1' }}>
              <HistoricalVaultLogTable heading={true} />
              <tbody>
                {vault.logs.map((log, idx) => (
                  <HistoricalVaultLogTable key={log.id} log={log} />
                ))}
              </tbody>
            </table>
            : <div></div>
          }
        </div>
      </div>
      <hr />
    </div>
  )
}

export default IndividualVault
