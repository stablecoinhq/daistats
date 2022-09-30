import React, { useState, useEffect } from 'react'
import { useTranslate } from 'react-polyglot';

function VaultsAtRisk(props) {
  const [priceDropRatio, setPriceDropRatio] = useState('0.8');
  useEffect(() => {
    setPriceDropRatio(priceDropRatio);
  }, [priceDropRatio]);

  const allVaults = props.allVaults[props.ilk]
  const t = useTranslate()
  if (allVaults) {
    const ilkETHA = props.ilksByName[props.ilk]
    console.log(allVaults);
    console.log(JSON.stringify(ilkETHA))

    const dangerousVaults = allVaults
      .filter((vault) => vault.debt > 0 && vault.collateral > 0)
      .filter((vault) => {
        const collateral = parseFloat(vault.collateral)
        const price = parseFloat(ilkETHA.price)
        const debt = parseFloat(vault.debt)
        const mat = parseFloat(ilkETHA.mat)
        const collateralIsEnough = (collateral * price * priceDropRatio) > (debt * mat)
        return !collateralIsEnough
      })

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
                  PriceDropRatio:
                  <input
                    type="text"
                    onChange={event => setPriceDropRatio(event.target.value)}
                    value={priceDropRatio}
                  />
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
