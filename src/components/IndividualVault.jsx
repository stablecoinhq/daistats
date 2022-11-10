import React, { useState, useEffect } from 'react'
import { useTranslate } from 'react-polyglot';
import { gql, GraphQLClient } from "graphql-request"
import HistoricalVaultLogChart from './HistoricalVaultLogChart';
import HistoricalVaultLogTable from './HistoricalVaultLogTable';

function IndividualVault(props) {

  const convertLowerCaseAddress = (cdpId) => {
    if (!cdpId) {
      return undefined
    }
    if (cdpId.match(/^[0-9]+$/)) {
      return cdpId
    } else {
      const matched = cdpId.match(/^([^-]+)-(.+)$/)
      if (matched && matched[1] && matched[2]) {
        return matched[1].toLowerCase() + "-" + matched[2]
      } else {
        return undefined
      }
    }
  }

  const [cdpId, setCdpId] = useState(convertLowerCaseAddress(props.cdpId) ?? "0x468e7aa34ca25986c7e46d6b78f1dfff0a8c8c02-ETH-A");
  const [vault, setVault] = useState(undefined);
  const [currentCollateralRatio, setCurrentCollateralRatio] = useState(undefined);
  const updateVault = () => {
    const getData = async () => {
      const subgraphClient = props.subgraphClient

      const getSingleVault = async (cdpId) => {
        let fetchResult;
        // get vault information and logs specified by search condition.
        const logsQuery = searchCondition => `
          vaults(first: 1, where: ${searchCondition}) {
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
        `
        // get auctions specified by vault id
        const auctionsQuery = vaultId => `
          saleAuctions(where: {vault: "${vaultId}"}){
            id,
            vault{
              id
            },
            amountDaiToRaise,
            amountCollateralToSell,
            boughtAt,
            isActive,
            startedAt,
            resetedAt,
            updatedAt
          }
        `
        // get split change logs where address is destination.
        const vaultSplitChangeLogsDestinationAddressQuery = (destionationAddress) => `
          vaultSplitChangeLogs(where: {dst: "${destionationAddress}"}){
            __typename,
            id,
            dst,
            src,
            collateralToMove,
            debtToMove,
            transaction,
            timestamp,
            block,
          }
        `
        // cdpId is specified by number
        if (cdpId.match(/^[0-9]+$/)) {
          try {
            const vaultByCdpId = await subgraphClient.request(gql`{
              ${logsQuery(`{cdpId: ${cdpId}}`)}
            }`)

            let saleAuctionsAndVaultSplitChangeLogsDestinationAddressQueryResult;
            if (vaultByCdpId && vaultByCdpId.vaults[0] && vaultByCdpId.vaults[0].id) {
              const [destinationAddress, destinationIlk] = vaultByCdpId.vaults[0].id.split("-")
              saleAuctionsAndVaultSplitChangeLogsDestinationAddressQueryResult = await subgraphClient.request(gql`{
                ${auctionsQuery(vaultByCdpId.vaults[0].id)}
                ${vaultSplitChangeLogsDestinationAddressQuery(destinationAddress)}
              }`)
            }

            if (vaultByCdpId && saleAuctionsAndVaultSplitChangeLogsDestinationAddressQueryResult) {
              fetchResult = vaultByCdpId
              fetchResult.saleAuctions = saleAuctionsAndVaultSplitChangeLogsDestinationAddressQueryResult.saleAuctions
              fetchResult.vaultSplitChangeLogs = saleAuctionsAndVaultSplitChangeLogsDestinationAddressQueryResult.vaultSplitChangeLogs
            }
          } catch (err) {
            console.log("Vault could not be retrieved by CdpId. Retrying with vaultId...")
          }
        }
        // could not get by cdpId number, use id string `address`-`ilk` format.
        if (!fetchResult) {
          const [destinationAddress, destinationIlk] = cdpId.split("-")
          try {
            const vaultById = await subgraphClient.request(gql`{
              ${logsQuery(`{id: "${cdpId}"}`)}
              ${auctionsQuery(cdpId)}
              ${vaultSplitChangeLogsDestinationAddressQuery(destinationAddress)}
            }`)
            if (vaultById) {
              fetchResult = vaultById
            }
          } catch (err) {
            console.log("Vault could not be retrieved by id")
          }
        }
        if (!fetchResult) {
          console.error("Vault could not be retrieved")
          fetchResult = undefined;
        } else {
          if (fetchResult.vaults[0] && fetchResult.vaults[0].logs) {
            const collateralType = fetchResult.vaults[0].collateralType
            const vaultId = fetchResult.vaults[0].id
            const vaultLogs = fetchResult.vaults[0].logs;

            // merge logs from vault split change logs, where it could have destination address
            const vaultLogsWithVaultSplitChangeLogsDestination = vaultLogs.concat(fetchResult.vaultSplitChangeLogs);

            // logs are ordered from new to old, change it as from old to new
            const reversedLogs = vaultLogsWithVaultSplitChangeLogsDestination.sort((left, right) => {
              const timestampDiff = (parseInt(left.timestamp) - parseInt(right.timestamp));
              if (timestampDiff) {
                return timestampDiff
              } else {
                const [leftTxHash, leftLogIndex, leftSuffix] = left.id.split("-")
                const [rightTxHash, rightLogIndex, rightSuffix] = right.id.split("-")
                const logIndexDiff = parseInt(leftLogIndex) - parseInt(rightLogIndex)
                if (logIndexDiff) {
                  return logIndexDiff
                } else {
                  return parseInt(leftSuffix) - parseInt(rightSuffix)
                }
              }
            })

            // some auctions exist for vault, let's merge auction logs to vault change logs
            let auctionLogs = []
            if (fetchResult.saleAuctions[0] && fetchResult.saleAuctions[0].startedAt) {
              auctionLogs = fetchResult.saleAuctions.map(saleAuction => {
                const resultArray = []
                if (saleAuction.startedAt && parseInt(saleAuction.startedAt)) {
                  resultArray.push({
                    ...saleAuction,
                    id: `liquidationStartLog-${saleAuction.id}`,
                    timestamp: saleAuction.startedAt,
                    __typename: `liquidationStartLog`,
                  })
                }
                if (saleAuction.boughtAt && parseInt(saleAuction.boughtAt)) {
                  resultArray.push({
                    ...saleAuction,
                    id: `liquidationFinishLog-${saleAuction.id}`,
                    timestamp: saleAuction.boughtAt,
                    __typename: `liquidationFinishLog`
                  })
                }
                return resultArray
              }).flat()
            }
            const vaultWithAuctionLogs = reversedLogs
              .concat(auctionLogs)
              .sort((left, right) => left.timestamp - right.timestamp)

            // logs have collateral/debt change in different format.
            // calculate before/after/change value.
            const modifiedLogs = vaultWithAuctionLogs.map((log, mapIndex) => {

              // Collateral Change ()
              const updateCollateralChange = (log, index) => {
                let collateralChange = 0;
                let collateralBefore = undefined;
                let collateralAfter = undefined;
                if (log.__typename === 'VaultCollateralChangeLog') {
                  collateralChange = parseFloat(log.collateralDiff)
                  collateralBefore = parseFloat(log.collateralBefore)
                  collateralAfter = parseFloat(log.collateralAfter)
                } else if (log.__typename === 'VaultSplitChangeLog') {
                  if (vaultId && vaultId.includes(log.src)) {
                    collateralChange = -parseFloat(log.collateralToMove)
                  } else if (vaultId && vaultId.includes(log.dst)) {
                    collateralChange = parseFloat(log.collateralToMove)
                  }
                } else if (log.__typename === 'VaultTransferChangeLog') {
                  if (vaultId && vaultId.includes(log.previousOwner)) {
                    collateralChange = -0
                  } else if (vaultId && vaultId.includes(log.nextOwner)) {
                    collateralChange = 0
                  }
                } else if (index !== 0 && index > 1) {
                  const previousLog = vaultWithAuctionLogs[index - 1]
                  collateralChange = parseFloat(log.collateral) - parseFloat(previousLog.collateral)
                  if (Number.isNaN(collateralChange)) {
                    collateralChange = 0;
                  }
                }
                log.collateralBefore = collateralBefore
                log.collateralAfter = collateralAfter
                log.collateralChange = collateralChange;
                return log
              }
              const logUpdatedCollateralChange = updateCollateralChange(log, mapIndex)

              // Debt Change (DAI)
              const updateDebtChange = (log, index) => {
                let debtChange = 0;
                let debtBefore = undefined;
                let debtAfter = undefined;
                if (log.__typename === 'VaultDebtChangeLog') {
                  debtChange = parseFloat(log.debtDiff)
                  debtBefore = parseFloat(log.debtBefore)
                  debtAfter = parseFloat(log.debtAfter)
                } else if (log.__typename === 'VaultSplitChangeLog') {
                  if (vaultId && vaultId.includes(log.src)) {
                    debtChange = -parseFloat(log.debtToMove)
                  } else if (vaultId && vaultId.includes(log.dst)) {
                    debtChange = parseFloat(log.debtToMove)
                  }
                } else if (log.__typename === 'VaultTransferChangeLog') {
                  if (vaultId && vaultId.includes(log.previousOwner)) {
                    debtChange = -0
                  } else if (vaultId && vaultId.includes(log.nextOwner)) {
                    debtChange = 0
                  }

                } else if (index !== 0 && index > 1) {
                  const previousLog = vaultWithAuctionLogs[index - 1]
                  debtChange = parseFloat(log.debt) - parseFloat(previousLog.debt)
                  if (Number.isNaN(debtChange)) {
                    debtChange = 0;
                  }
                }
                log.debtBefore = debtBefore
                log.debtAfter = debtAfter
                log.debtChange = debtChange;
                return log
              }
              const logUpdatedDebtChange = updateDebtChange(logUpdatedCollateralChange, mapIndex)
              return logUpdatedDebtChange;
            })
            // get oracle price log
            const priceListGql = modifiedLogs.map((log, index) => {
              return `
                _${index}: collateralPriceUpdateLogs(first: 1, orderBy: timestamp, orderDirection: desc, where: {timestamp_lte: ${log.timestamp}, collateral: "${collateralType.id}"}){
                  id,
                  newValue,
                  newSpotPrice,
                  block,
                  timestamp,
                  transaction,
                }
              `
            })
            const priceList = await subgraphClient.request(gql`{ ${priceListGql} }`)

            // update all log records for view
            for (let logIndex = 0; logIndex < vaultWithAuctionLogs.length; logIndex++) {
              // oracle price
              if (priceList &&
                priceList[`_${logIndex}`] &&
                priceList[`_${logIndex}`][0] &&
                priceList[`_${logIndex}`][0].newValue) {

                vaultWithAuctionLogs[logIndex].oraclePrice = priceList[`_${logIndex}`][0].newValue;
              } else if (vaultWithAuctionLogs[logIndex - 1] && vaultWithAuctionLogs[logIndex - 1].oraclePrice && vaultWithAuctionLogs[logIndex - 1].oraclePrice) {
                vaultWithAuctionLogs[logIndex].oraclePrice = vaultWithAuctionLogs[logIndex - 1].oraclePrice
              } else {
                vaultWithAuctionLogs[logIndex].oraclePrice = 0
              }
              const oraclePrice = vaultWithAuctionLogs[logIndex].oraclePrice;

              // spot price
              if (priceList &&
                priceList[`_${logIndex}`] &&
                priceList[`_${logIndex}`][0] &&
                priceList[`_${logIndex}`][0].newSpotPrice) {

                vaultWithAuctionLogs[logIndex].spotPrice = priceList[`_${logIndex}`][0].newSpotPrice;
              } else if (vaultWithAuctionLogs[logIndex - 1] && vaultWithAuctionLogs[logIndex - 1].spotPrice && vaultWithAuctionLogs[logIndex - 1].spotPrice) {
                vaultWithAuctionLogs[logIndex].spotPrice = vaultWithAuctionLogs[logIndex - 1].spotPrice
              } else {
                vaultWithAuctionLogs[logIndex].spotPrice = 0
              }

              // update all the log records so that they all have price/diff/before/after value.
              if (logIndex === 0) {
                vaultWithAuctionLogs[logIndex].debtBefore = 0
                vaultWithAuctionLogs[logIndex].collateralBefore = 0
                vaultWithAuctionLogs[logIndex].debtAfter = 0
                vaultWithAuctionLogs[logIndex].collateralAfter = 0
                vaultWithAuctionLogs[logIndex].preCollateralizationRatio = 0
                vaultWithAuctionLogs[logIndex].postCollateralizationRatio = 0

              } else {

                // debtBefore
                if (!vaultWithAuctionLogs[logIndex].debtBefore) {
                  vaultWithAuctionLogs[logIndex].debtBefore = vaultWithAuctionLogs[logIndex - 1].debtAfter
                }

                // debtAfter
                if (vaultWithAuctionLogs[logIndex].__typename === "liquidationFinishLog") {
                  vaultWithAuctionLogs[logIndex].debtAfter = 0;
                  vaultWithAuctionLogs[logIndex].debtChange = -vaultWithAuctionLogs[logIndex].debtBefore;
                } else {
                  if (!vaultWithAuctionLogs[logIndex].debtAfter) {
                    if (!vaultWithAuctionLogs[logIndex].debtChange) {
                      vaultWithAuctionLogs[logIndex].debtAfter = vaultWithAuctionLogs[logIndex].debtBefore
                    } else {
                      vaultWithAuctionLogs[logIndex].debtAfter = vaultWithAuctionLogs[logIndex - 1].debtAfter + vaultWithAuctionLogs[logIndex].debtChange
                    }
                  }
                }

                // collateralBefore
                if (!vaultWithAuctionLogs[logIndex].collateralBefore) {
                  vaultWithAuctionLogs[logIndex].collateralBefore = vaultWithAuctionLogs[logIndex - 1].collateralAfter
                }

                // collateralAfter
                if (vaultWithAuctionLogs[logIndex].__typename === "liquidationFinishLog") {
                  vaultWithAuctionLogs[logIndex].collateralAfter = 0;
                  vaultWithAuctionLogs[logIndex].collateralChange = -vaultWithAuctionLogs[logIndex].collateralBefore;
                } else {
                  if (!vaultWithAuctionLogs[logIndex].collateralAfter) {
                    if (!vaultWithAuctionLogs[logIndex].collateralChange) {
                      vaultWithAuctionLogs[logIndex].collateralAfter = vaultWithAuctionLogs[logIndex].collateralBefore
                    } else {
                      vaultWithAuctionLogs[logIndex].collateralAfter = vaultWithAuctionLogs[logIndex - 1].collateralAfter + vaultWithAuctionLogs[logIndex].collateralChange
                    }
                  }
                }

                // Pre Collateralization Ratio
                if (parseFloat(vaultWithAuctionLogs[logIndex].debtBefore)) {
                  vaultWithAuctionLogs[logIndex].preCollateralizationRatio = (oraclePrice * parseFloat(vaultWithAuctionLogs[logIndex].collateralBefore)) / (parseFloat(vaultWithAuctionLogs[logIndex].debtBefore) * parseFloat(collateralType.rate))
                } else {
                  vaultWithAuctionLogs[logIndex].preCollateralizationRatio = 0
                }
                // Post Collateralization Ratio
                if (parseFloat(vaultWithAuctionLogs[logIndex].debtAfter)) {
                  vaultWithAuctionLogs[logIndex].postCollateralizationRatio = (oraclePrice * parseFloat(vaultWithAuctionLogs[logIndex].collateralAfter)) / (parseFloat(vaultWithAuctionLogs[logIndex].debtAfter) * parseFloat(collateralType.rate))
                } else {
                  vaultWithAuctionLogs[logIndex].postCollateralizationRatio = 0
                }
              }
            }

            // reverse it again to view as from new to old
            fetchResult.vaults[0].logs = vaultWithAuctionLogs.reverse()
          }
        }
        return fetchResult
      }

      const getLiquidationRatioChangeLog = async (ilkName) => {
        // get split change logs where address is destination.
        const collateralTypeChangeLogsQuery = `
          collateralTypeChangeLogs: protocolParameterChangeLogBigDecimals(
              first: 1000,
              orderBy: timestamp,
              orderDirection: desc, 
              where: {
                  parameterKey2: "${ilkName}"
                  parameterKey1: "mat",
                  contractType: SPOT,
              })
            {
              mat: parameterValue,
              timestamp
            }
        `
        try {
          const collateralTypeChangeLogsQueryResult = await subgraphClient.request(gql`{
            ${collateralTypeChangeLogsQuery}
          }`)
          if (collateralTypeChangeLogsQueryResult && collateralTypeChangeLogsQueryResult.collateralTypeChangeLogs) {
            return collateralTypeChangeLogsQueryResult.collateralTypeChangeLogs
          } else {
            return []
          }
        } catch (e) {
          console.log(e)
          return []
        }
      }

      if (cdpId) {
        const getSingleVaultResult = await getSingleVault(cdpId);
        // get liquidation ratio change log
        if ((getSingleVaultResult && getSingleVaultResult.vaults && getSingleVaultResult.vaults[0])) {
          const singleVault = getSingleVaultResult.vaults[0]
          const liquidationRatioChangeLog = await getLiquidationRatioChangeLog(singleVault.collateralType.id)
          const currentCollateralRatioValue = parseFloat(singleVault.collateral) * parseFloat(props.ilksByName[singleVault.collateralType.id].price) / (parseFloat(singleVault.debt) * parseFloat(props.ilksByName[singleVault.collateralType.id].rate))
          singleVault.liquidationRatioChangeLog = liquidationRatioChangeLog
          setVault(singleVault)
          setCurrentCollateralRatio(currentCollateralRatioValue)
        }
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
                  onChange={event => setCdpId(convertLowerCaseAddress(event.target.value))}
                />
                <button onClick={updateVault}>Go</button>
              </p> {
                (vault && vault.collateralType && vault.collateralType.id) ? <div>
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
                    CurrentCollateralRatio: {currentCollateralRatio}
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
            <h4 className="subtitle is-size-3">IndividualVaultHistory</h4>
            {vault ?
              <HistoricalVaultLogChart vault={vault} currentCollateralRatio={currentCollateralRatio} />
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
          {(vault && vault.logs) ?
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
