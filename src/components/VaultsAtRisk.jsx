import React from 'react'
import { useTranslate } from 'react-polyglot';

const formatAmount = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
})

const formatNoDecimals = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

const formatDp = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 8,
  maximumFractionDigits: 8
})

const formatPercent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const formatPercentNoDecimals = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

function autoLine(props, label) {
  const ilk = props.ilksByName[props.ilk]
  if (ilk.lineMax > 0) {
    return (
      <>
        <p className="title subtitle is-size-6">{label}: {formatAmount.format(ilk.lineMax)}</p>
        <p className="title subtitle is-size-6">Gap: {formatAmount.format(ilk.gap)} Ttl: {ilk.ttl / 60 / 60}h</p>
        <p className="title subtitle is-size-6">Last Change: {ilk.lastInc}</p>
      </>
    )
  } else {
    return null;
  }
}

function VaultsAtRisk(props) {
  const allVaults = props.allVaults
  const t = useTranslate()
  if (allVaults) {
    const ilkETHA = props.ilksByName[props.ilk]
    console.log(allVaults);
    console.log(JSON.stringify(ilkETHA))
    const priceDropRatio = 0.8

    const dangerousVaults = allVaults
      // .map((vault) => {
      //   if (vault.saleAuction) {
      //     const saleAuctionSoldCollateralSum = vault.saleAuction
      //       .filter(auction => auction.vault.id === vault.id)
      //       .map(auction => auction.amountCollateralToSell)
      //       .reduce((previous, current) => {
      //         return previous + parseFloat(current)
      //       }, 0)

      //     vault.collateral -= saleAuctionSoldCollateralSum

      //     const saleAuctionRaisedDebtSum = vault.saleAuction
      //       .filter(auction => auction.vault.id === vault.id)
      //       .map(auction => auction.amountDaiToRaise)
      //       .reduce((previous, current) => {
      //         return previous + parseFloat(current)
      //       }, 0)

      //     vault.debt -= saleAuctionRaisedDebtSum
      //   }
      //   return vault
      // })
      // .map((vault) => {
      //   const vaultSplitChangeLogsCollateralOutgoingSum = vault.logs
      //     .filter(log => log.__typename === "VaultSplitChangeLogs" && log.src === vault.owner)
      //     .map(log => log.collateralToMove)
      //     .reduce((previous, current) => previous + parseFloat(current), 0)
      //   const vaultSplitChangeLogsCollateralIncomingSum = vault.logs
      //     .filter(log => log.__typename === "VaultSplitChangeLogs" && log.dst === vault.owner)
      //     .map(log => log.collateralToMove)
      //     .reduce((previous, current) => previous + parseFloat(current), 0)

      //   vault.collateral -= vaultSplitChangeLogsCollateralOutgoingSum
      //   vault.collateral += vaultSplitChangeLogsCollateralIncomingSum

      //   const vaultSplitChangeLogsDebtOutgoingSum = vault.logs
      //     .filter(log => log.__typename === "VaultSplitChangeLogs" && log.src === vault.owner)
      //     .map(log => log.debtToMove)
      //     .reduce((previous, current) => previous + parseFloat(current), 0)
      //   const vaultSplitChangeLogsDebtIncomingSum = vault.logs
      //     .filter(log => log.__typename === "VaultSplitChangeLogs" && log.dst === vault.owner)
      //     .map(log => log.debtToMove)
      //     .reduce((previous, current) => previous + parseFloat(current), 0)

      //   vault.debt -= vaultSplitChangeLogsDebtOutgoingSum
      //   vault.debt += vaultSplitChangeLogsDebtIncomingSum

      //   return vault
      // })
      .filter((vault) => vault.debt > 0 && vault.collateral > 0)
      .filter((vault) => {
        const collateral = parseFloat(vault.collateral)
        const price = parseFloat(ilkETHA.price)
        const debt = parseFloat(vault.debt)
        const mat = parseFloat(ilkETHA.mat)
        const collateralIsEnough = (collateral * price * priceDropRatio) > (debt * mat)
        if (!collateralIsEnough) {
          // console.log(JSON.stringify({
          //   vault,
          //   collateral: (collateral * price * priceDropRatio),
          //   debt: (debt * mat),
          //   collateralIsEnough
          // }))
        }
        return !collateralIsEnough
      })

    // need to remove already liquidated vaults from dangerousVaults
    // console.log(JSON.stringify({ dangerousVaults }))

    return (
      <div>
        <div className="columns">
          <div className="column">
            <div className="has-text-centered">
              <div className="box has-text-centered">
                <p className="subtitle is-size-4">
                  NumberOfVaultsAtRisk: {dangerousVaults.length} of {allVaults.length}
                </p>
                <p className="subtitle is-size-4">
                  MinCollateralRatio: {ilkETHA.mat}
                </p>
                <p className="subtitle is-size-4">
                  CurrentPrice: {ilkETHA.price}
                </p>
                <p className="subtitle is-size-4">
                  PriceDropRatio: {priceDropRatio}
                </p>
                <p className="subtitle is-size-4">
                  SimulatedPrice: {ilkETHA.price * priceDropRatio}
                </p>
              </div>
              {dangerousVaults.map((vault) =>
                <div className="box has-text-centered" key={vault.id} >
                  <p className="subtitle is-size-6">
                    CdpId: {vault.cdpId}
                  </p>
                  <p className="subtitle is-size-6">
                    Collateral: {vault.collateral}
                  </p>
                  <p className="subtitle is-size-6">
                    Debt: {vault.debt}
                  </p>
                  <p className="subtitle is-size-6">
                    CurrentCollateralRatio: {parseFloat(vault.collateral) * parseFloat(ilkETHA.price) / parseFloat(vault.debt)}
                  </p>
                  <p className="subtitle is-size-6">
                    SimulatedCollateralRatio: {parseFloat(vault.collateral) * parseFloat(ilkETHA.price) * parseFloat(priceDropRatio) / parseFloat(vault.debt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <hr />
      </div>
    )
  } else {
    return (<div></div>)
  }
}

export default VaultsAtRisk
