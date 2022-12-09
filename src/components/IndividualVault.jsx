import React, { useState, useEffect } from 'react';
import { useTranslate } from 'react-polyglot';
import { gql } from 'graphql-request';
import HistoricalVaultLogChart from './HistoricalVaultLogChart';
import HistoricalVaultLogTable from './HistoricalVaultLogTable';

var IndividualVault = (props) => {
  const round = (num, digits = 2) => new Number(+num).toFixed(digits);
  const convertLowerCaseAddress = (cdpIdStr) => {
    if (!cdpIdStr) {
      return undefined;
    }
    if (cdpIdStr.match(/^[0-9]+$/)) {
      return cdpIdStr;
    } else {
      const matched = cdpIdStr.match(/^([^-]+)-(.+)$/);
      if (matched && matched[1] && matched[2]) {
        return matched[1].toLowerCase() + '-' + matched[2];
      } else {
        return undefined;
      }
    }
  };

  const [cdpId, setCdpId] = useState(convertLowerCaseAddress(props.cdpId) ?? '1');
  const [vault, setVault] = useState(undefined);
  const [priceList, setPriceList] = useState([]);
  const [currentCollateralRatio, setCurrentCollateralRatio] = useState(undefined);
  const updateVault = () => {
    const getData = async () => {
      const subgraphClient = props.subgraphClient;

      const getSingleVault = async (cdpIdStr) => {
        let fetchResult;
        // get vault information and logs specified by search condition.
        const logsQuery = (searchCondition) => `
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
        `;
        // get auctions specified by vault id
        const auctionsQuery = (vaultId) => `
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
        `;
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
        `;
        // cdpId is specified by number
        if (cdpIdStr.match(/^[0-9]+$/)) {
          try {
            const vaultByCdpId = await subgraphClient.request(gql`{
              ${logsQuery(`{cdpId: ${cdpIdStr}}`)}
            }`);

            let saleAuctionsAndVaultSplitChangeLogsDestinationAddressQueryResult;
            if (vaultByCdpId && vaultByCdpId.vaults[0] && vaultByCdpId.vaults[0].id) {
              const [destinationAddress, _destinationIlk] = vaultByCdpId.vaults[0].id.split('-');
              saleAuctionsAndVaultSplitChangeLogsDestinationAddressQueryResult = await subgraphClient.request(gql`{
                ${auctionsQuery(vaultByCdpId.vaults[0].id)}
                ${vaultSplitChangeLogsDestinationAddressQuery(destinationAddress)}
              }`);
            }

            if (vaultByCdpId && saleAuctionsAndVaultSplitChangeLogsDestinationAddressQueryResult) {
              fetchResult = vaultByCdpId;
              fetchResult.saleAuctions = saleAuctionsAndVaultSplitChangeLogsDestinationAddressQueryResult.saleAuctions;
              fetchResult.vaultSplitChangeLogs =
                saleAuctionsAndVaultSplitChangeLogsDestinationAddressQueryResult.vaultSplitChangeLogs;
            }
          } catch (err) {
            console.log('Vault could not be retrieved by CdpId. Retrying with vaultId...');
          }
        }
        // could not get by cdpId number, use id string `address`-`ilk` format.
        if (!fetchResult) {
          const [destinationAddress, _destinationIlk] = cdpIdStr.split('-');
          try {
            const vaultById = await subgraphClient.request(gql`{
              ${logsQuery(`{id: "${cdpIdStr}"}`)}
              ${auctionsQuery(cdpIdStr)}
              ${vaultSplitChangeLogsDestinationAddressQuery(destinationAddress)}
            }`);
            if (vaultById) {
              fetchResult = vaultById;
            }
          } catch (err) {
            console.log('Vault could not be retrieved by id');
          }
        }
        if (!fetchResult) {
          console.error('Vault could not be retrieved');
          fetchResult = undefined;
        } else {
          const fetchedVault = fetchResult.vaults[0];
          if (fetchedVault && fetchedVault.logs) {
            const collateralType = fetchedVault.collateralType;
            const vaultId = fetchedVault.id;
            const vaultLogs = fetchedVault.logs.concat().map((log) => Object.assign({}, log));

            // merge logs from vault split change logs, where it could have destination address
            const vaultLogsWithVaultSplitChangeLogsDestination = vaultLogs.concat(fetchResult.vaultSplitChangeLogs);

            // logs are ordered from new to old, change it as from old to new
            const reversedLogs = vaultLogsWithVaultSplitChangeLogsDestination.sort((left, right) => {
              const timestampDiff = parseInt(left.timestamp) - parseInt(right.timestamp);
              if (timestampDiff) {
                return timestampDiff;
              } else {
                const [_leftTxHash, leftLogIndex, leftSuffix] = left.id.split('-');
                const [_rightTxHash, rightLogIndex, rightSuffix] = right.id.split('-');
                const logIndexDiff = parseInt(leftLogIndex) - parseInt(rightLogIndex);
                if (logIndexDiff) {
                  return logIndexDiff;
                } else {
                  return parseInt(leftSuffix) - parseInt(rightSuffix);
                }
              }
            });

            // some auctions exist for vault, let's merge auction logs to vault change logs
            let auctionLogs = [];
            if (fetchResult.saleAuctions[0] && fetchResult.saleAuctions[0].startedAt) {
              auctionLogs = fetchResult.saleAuctions
                .map((saleAuction) => {
                  const resultArray = [];
                  if (saleAuction.startedAt && parseInt(saleAuction.startedAt)) {
                    resultArray.push({
                      ...saleAuction,
                      id: `liquidationStartLog-${saleAuction.id}`,
                      timestamp: saleAuction.startedAt,
                      __typename: `liquidationStartLog`,
                    });
                  }
                  if (saleAuction.boughtAt && parseInt(saleAuction.boughtAt)) {
                    resultArray.push({
                      ...saleAuction,
                      id: `liquidationFinishLog-${saleAuction.id}`,
                      timestamp: saleAuction.boughtAt,
                      __typename: `liquidationFinishLog`,
                    });
                  }
                  return resultArray;
                })
                .flat();
            }
            console.log(fetchResult.saleAuctions);
            console.log(reversedLogs.map((log) => ({ _t: log.__typename, t: log.timestamp })));
            const vaultWithAuctionLogs = reversedLogs
              .concat(auctionLogs)
              .sort((left, right) => left.timestamp - right.timestamp);
            console.log(vaultWithAuctionLogs.map((log) => ({ _t: log.__typename, t: log.timestamp })));

            // logs have collateral/debt change in different format.
            // calculate before/after/change value.
            const modifiedLogs = vaultWithAuctionLogs.map((log, mapIndex) => {
              // Collateral Change ()
              const updateCollateralChange = (log, index) => {
                let collateralChange = 0;
                let collateralBefore = undefined;
                let collateralAfter = undefined;
                if (log.__typename === 'VaultCollateralChangeLog') {
                  collateralChange = parseFloat(log.collateralDiff);
                  collateralBefore = parseFloat(log.collateralBefore);
                  collateralAfter = parseFloat(log.collateralAfter);
                } else if (log.__typename === 'VaultSplitChangeLog') {
                  if (vaultId && vaultId.includes(log.src)) {
                    collateralChange = -parseFloat(log.collateralToMove);
                  } else if (vaultId && vaultId.includes(log.dst)) {
                    collateralChange = parseFloat(log.collateralToMove);
                  }
                } else if (log.__typename === 'VaultTransferChangeLog') {
                  if (vaultId && vaultId.includes(log.previousOwner)) {
                    collateralChange = -0;
                  } else if (vaultId && vaultId.includes(log.nextOwner)) {
                    collateralChange = 0;
                  }
                } else if (index !== 0 && index > 1) {
                  const previousLog = vaultWithAuctionLogs[index - 1];
                  collateralChange = parseFloat(log.collateral) - parseFloat(previousLog.collateral);
                  if (Number.isNaN(collateralChange)) {
                    collateralChange = 0;
                  }
                }
                log.collateralBefore = collateralBefore;
                log.collateralAfter = collateralAfter;
                log.collateralChange = collateralChange;
                return log;
              };
              const logUpdatedCollateralChange = updateCollateralChange(log, mapIndex);

              // Debt Change (DAI)
              const updateDebtChange = (log, index) => {
                let debtChange = 0;
                let debtBefore = undefined;
                let debtAfter = undefined;
                if (log.__typename === 'VaultDebtChangeLog') {
                  debtChange = parseFloat(log.debtDiff);
                  debtBefore = parseFloat(log.debtBefore);
                  debtAfter = parseFloat(log.debtAfter);
                } else if (log.__typename === 'VaultSplitChangeLog') {
                  if (vaultId && vaultId.includes(log.src)) {
                    debtChange = -parseFloat(log.debtToMove);
                  } else if (vaultId && vaultId.includes(log.dst)) {
                    debtChange = parseFloat(log.debtToMove);
                  }
                } else if (log.__typename === 'VaultTransferChangeLog') {
                  if (vaultId && vaultId.includes(log.previousOwner)) {
                    debtChange = -0;
                  } else if (vaultId && vaultId.includes(log.nextOwner)) {
                    debtChange = 0;
                  }
                } else if (index !== 0 && index > 1) {
                  const previousLog = vaultWithAuctionLogs[index - 1];
                  debtChange = parseFloat(log.debt) - parseFloat(previousLog.debt);
                  if (Number.isNaN(debtChange)) {
                    debtChange = 0;
                  }
                }
                log.debtBefore = debtBefore;
                log.debtAfter = debtAfter;
                log.debtChange = debtChange;
                return log;
              };
              const logUpdatedDebtChange = updateDebtChange(logUpdatedCollateralChange, mapIndex);
              return logUpdatedDebtChange;
            });
            // get list of time points where price values will be fetched
            const getUnsortedPriceTimestampList = (logs) => {
              const priceTimestampList = logs.map((log) => log.timestamp);
              if (new Set(priceTimestampList).size < 2) {
                priceTimestampList.push(((Date.now() / 1000) | 0).toString());
              }
              const firstTimestamp = +priceTimestampList[0];
              const lastTimestamp = +priceTimestampList[priceTimestampList.length - 1];
              const numberOfPoints = 100;
              const pointDiff = +(lastTimestamp - firstTimestamp) / numberOfPoints;
              const middlePoints = [...Array(numberOfPoints).keys()].map((_v, index) =>
                ((firstTimestamp + index * pointDiff) | 0).toString(),
              );
              return priceTimestampList.concat(middlePoints);
            };
            const priceTimestampList = getUnsortedPriceTimestampList(modifiedLogs);
            // get oracle price log
            const priceListGql = priceTimestampList.map((timestamp, index) => {
              return `
                _${index}: collateralPriceUpdateLogs(first: 1, orderBy: timestamp, orderDirection: desc, where: {timestamp_lte: ${timestamp}, collateral: "${collateralType.id}"}){
                  id,
                  newValue,
                  newSpotPrice,
                  block,
                  timestamp,
                  transaction,
                }
              `;
            });
            const unsortedPriceList = await subgraphClient.request(gql`{ ${priceListGql} }`);

            // update all log records for view
            for (let logIndex = 0; logIndex < vaultWithAuctionLogs.length; logIndex++) {
              // oracle price
              if (
                unsortedPriceList &&
                unsortedPriceList[`_${logIndex}`] &&
                unsortedPriceList[`_${logIndex}`][0] &&
                unsortedPriceList[`_${logIndex}`][0].newValue
              ) {
                vaultWithAuctionLogs[logIndex].oraclePrice = unsortedPriceList[`_${logIndex}`][0].newValue;
              } else if (
                vaultWithAuctionLogs[logIndex - 1] &&
                vaultWithAuctionLogs[logIndex - 1].oraclePrice &&
                vaultWithAuctionLogs[logIndex - 1].oraclePrice
              ) {
                vaultWithAuctionLogs[logIndex].oraclePrice = vaultWithAuctionLogs[logIndex - 1].oraclePrice;
              } else {
                vaultWithAuctionLogs[logIndex].oraclePrice = 0;
              }
              const oraclePrice = vaultWithAuctionLogs[logIndex].oraclePrice;

              // spot price
              if (
                unsortedPriceList &&
                unsortedPriceList[`_${logIndex}`] &&
                unsortedPriceList[`_${logIndex}`][0] &&
                unsortedPriceList[`_${logIndex}`][0].newSpotPrice
              ) {
                vaultWithAuctionLogs[logIndex].spotPrice = unsortedPriceList[`_${logIndex}`][0].newSpotPrice;
              } else if (
                vaultWithAuctionLogs[logIndex - 1] &&
                vaultWithAuctionLogs[logIndex - 1].spotPrice &&
                vaultWithAuctionLogs[logIndex - 1].spotPrice
              ) {
                vaultWithAuctionLogs[logIndex].spotPrice = vaultWithAuctionLogs[logIndex - 1].spotPrice;
              } else {
                vaultWithAuctionLogs[logIndex].spotPrice = 0;
              }

              // update all the log records so that they all have price/diff/before/after value.
              if (logIndex === 0) {
                vaultWithAuctionLogs[logIndex].debtBefore = 0;
                vaultWithAuctionLogs[logIndex].collateralBefore = 0;
                vaultWithAuctionLogs[logIndex].debtAfter = 0;
                vaultWithAuctionLogs[logIndex].collateralAfter = 0;
                vaultWithAuctionLogs[logIndex].preCollateralizationRatio = 0;
                vaultWithAuctionLogs[logIndex].postCollateralizationRatio = 0;
              } else {
                // debtBefore
                if (!vaultWithAuctionLogs[logIndex].debtBefore) {
                  vaultWithAuctionLogs[logIndex].debtBefore = vaultWithAuctionLogs[logIndex - 1].debtAfter;
                }

                // debtAfter
                if (vaultWithAuctionLogs[logIndex].__typename === 'liquidationFinishLog') {
                  vaultWithAuctionLogs[logIndex].debtAfter = 0;
                  vaultWithAuctionLogs[logIndex].debtChange = -vaultWithAuctionLogs[logIndex].debtBefore;
                } else {
                  if (!vaultWithAuctionLogs[logIndex].debtAfter) {
                    if (!vaultWithAuctionLogs[logIndex].debtChange) {
                      vaultWithAuctionLogs[logIndex].debtAfter = vaultWithAuctionLogs[logIndex].debtBefore;
                    } else {
                      vaultWithAuctionLogs[logIndex].debtAfter =
                        vaultWithAuctionLogs[logIndex - 1].debtAfter + vaultWithAuctionLogs[logIndex].debtChange;
                    }
                  }
                }

                // collateralBefore
                if (!vaultWithAuctionLogs[logIndex].collateralBefore) {
                  vaultWithAuctionLogs[logIndex].collateralBefore = vaultWithAuctionLogs[logIndex - 1].collateralAfter;
                }

                // collateralAfter
                if (vaultWithAuctionLogs[logIndex].__typename === 'liquidationFinishLog') {
                  vaultWithAuctionLogs[logIndex].collateralAfter = 0;
                  vaultWithAuctionLogs[logIndex].collateralChange = -vaultWithAuctionLogs[logIndex].collateralBefore;
                } else {
                  if (!vaultWithAuctionLogs[logIndex].collateralAfter) {
                    if (!vaultWithAuctionLogs[logIndex].collateralChange) {
                      vaultWithAuctionLogs[logIndex].collateralAfter = vaultWithAuctionLogs[logIndex].collateralBefore;
                    } else {
                      vaultWithAuctionLogs[logIndex].collateralAfter =
                        vaultWithAuctionLogs[logIndex - 1].collateralAfter + vaultWithAuctionLogs[logIndex].collateralChange;
                    }
                  }
                }

                // Pre Collateralization Ratio
                if (parseFloat(vaultWithAuctionLogs[logIndex].debtBefore)) {
                  vaultWithAuctionLogs[logIndex].preCollateralizationRatio =
                    (oraclePrice * parseFloat(vaultWithAuctionLogs[logIndex].collateralBefore)) /
                    (parseFloat(vaultWithAuctionLogs[logIndex].debtBefore) * parseFloat(collateralType.rate));
                } else {
                  vaultWithAuctionLogs[logIndex].preCollateralizationRatio = 0;
                }
                // Post Collateralization Ratio
                if (parseFloat(vaultWithAuctionLogs[logIndex].debtAfter)) {
                  vaultWithAuctionLogs[logIndex].postCollateralizationRatio =
                    (oraclePrice * parseFloat(vaultWithAuctionLogs[logIndex].collateralAfter)) /
                    (parseFloat(vaultWithAuctionLogs[logIndex].debtAfter) * parseFloat(collateralType.rate));
                } else {
                  vaultWithAuctionLogs[logIndex].postCollateralizationRatio = 0;
                }
              }
            }

            // reverse it again to view as from new to old
            fetchResult.vaults[0].logs = vaultWithAuctionLogs.reverse().map((log) => Object.assign({}, log));

            // add price list
            const priceListDeepElement = Object.keys(unsortedPriceList).map((key) => unsortedPriceList[key][0]);
            fetchResult.priceList = [...new Map(priceListDeepElement.map((item) => [item.timestamp, item])).values()].sort(
              (left, right) => +left.timestamp - +right.timestamp,
            );
          }
        }
        return fetchResult;
      };

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
        `;
        try {
          const collateralTypeChangeLogsQueryResult = await subgraphClient.request(gql`{
            ${collateralTypeChangeLogsQuery}
          }`);
          if (collateralTypeChangeLogsQueryResult && collateralTypeChangeLogsQueryResult.collateralTypeChangeLogs) {
            return collateralTypeChangeLogsQueryResult.collateralTypeChangeLogs;
          } else {
            return [];
          }
        } catch (e) {
          console.log(e);
          return [];
        }
      };

      if (cdpId) {
        const getSingleVaultResult = await getSingleVault(cdpId);
        // get liquidation ratio change log
        if (getSingleVaultResult && getSingleVaultResult.vaults && getSingleVaultResult.vaults[0]) {
          const singleVault = getSingleVaultResult.vaults[0];
          const liquidationRatioChangeLog = await getLiquidationRatioChangeLog(singleVault.collateralType.id);
          const collateralFloat = parseFloat(singleVault.collateral);
          const floatPrice = parseFloat(props.ilksByName[singleVault.collateralType.id].price);
          const denominator = parseFloat(singleVault.debt) * parseFloat(props.ilksByName[singleVault.collateralType.id].rate);
          const currentCollateralRatioValue = denominator ? (collateralFloat * floatPrice) / denominator : 0;
          singleVault.liquidationRatioChangeLog = liquidationRatioChangeLog;
          setVault(singleVault);
          setCurrentCollateralRatio(currentCollateralRatioValue);
        }
        // get price list
        if (getSingleVaultResult && getSingleVaultResult.priceList) {
          setPriceList(getSingleVaultResult.priceList);
        }
      }
    };
    getData();
  };
  useEffect(
    updateVault,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props],
  );

  const t = useTranslate();
  return (
    <div>
      <div className="columns">
        <div className="column">
          <div className="has-text-centered">
            <div className="box has-text-centered">
              <p className="subtitle is-size-6">
                {t('daistats.vault_information.cdp_id_or_vault_id')}:
                <input
                  type="text"
                  value={cdpId ? cdpId : undefined}
                  onChange={(event) => setCdpId(convertLowerCaseAddress(event.target.value))}
                />
                <button onClick={updateVault}>{t('daistats.vault_information.go')}</button>
              </p>
              {vault && vault.collateralType && vault.collateralType.id ? (
                <div>
                  <p className="subtitle is-size-6">
                    {t('daistats.vault_information.collateral_type')}: {vault.collateralType.id}
                  </p>
                  <p className="subtitle is-size-6">
                    {t('daistats.vault_information.min_collateral_ratio')}:{' '}
                    {round(100 * props.ilksByName[vault.collateralType.id].mat)}%
                  </p>
                  <p className="subtitle is-size-6">
                    {t('daistats.vault_information.current_price')}: {round(props.ilksByName[vault.collateralType.id].price)}{' '}
                    JPY
                  </p>
                  <p className="subtitle is-size-6">CDP ID: {vault.cdpId ? vault.cdpId : vault.id}</p>
                  <p className="subtitle is-size-6">
                    {t('daistats.vault_information.collateral')}: {vault.collateral}{' '}
                    {props.ilksByName[vault.collateralType.id].token}
                  </p>
                  <p className="subtitle is-size-6">
                    {t('daistats.vault_information.debt')}:
                    {round(parseFloat(vault.debt) * parseFloat(props.ilksByName[vault.collateralType.id].rate))} JPYSC
                  </p>
                  <p className="subtitle is-size-6">
                    {t('daistats.vault_information.current_collateral_ratio')}: {round(100 * currentCollateralRatio)}%
                  </p>
                </div>
              ) : (
                <div></div>
              )}
            </div>
          </div>
        </div>
        <div className="column">
          <div className="box has-text-centered">
            <h3 className="title" title={props.debt}>
              {props.debt >= 420000000 && props.debt < 421000000 && (
                <span role="img" aria-label="Tree">
                  🌲
                </span>
              )}
            </h3>
            <h4 className="subtitle is-size-3">{t('daistats.vault_information.individual_vault_history')}</h4>
            {vault ? (
              <HistoricalVaultLogChart vault={vault} currentCollateralRatio={currentCollateralRatio} priceList={priceList} />
            ) : (
              <div></div>
            )}
          </div>
        </div>
      </div>
      <div className="columns">
        <div className="column">
          <h3 className="title" title={props.debt}>
            {props.debt >= 420000000 && props.debt < 421000000 && (
              <span role="img" aria-label="Tree">
                🌲
              </span>
            )}
          </h3>
          {vault && vault.logs ? (
            <table className="table" style={{ margin: '0 auto', backgroundColor: '#192734', color: '#e6e8f1' }}>
              <HistoricalVaultLogTable {...props} heading={true} />
              <tbody>
                {vault.logs.map((log) => (
                  <HistoricalVaultLogTable {...props} key={log.id} log={log} />
                ))}
              </tbody>
            </table>
          ) : (
            <div></div>
          )}
        </div>
      </div>
      <hr />
    </div>
  );
};

export default IndividualVault;
