import React, { useState, useEffect } from 'react'
import { useTranslate } from 'react-polyglot';

function VaultsAtRisk(props) {
  const [priceDropRatio, setPriceDropRatio] = useState('0.8');
  useEffect(() => {
    setPriceDropRatio(priceDropRatio);
  }, [priceDropRatio]);

  const allVaults = props.allVaults ? props.allVaults[props.ilk] : undefined
  const t = useTranslate()
  if (allVaults) {
    const ilk = props.ilksByName[props.ilk]
    console.log(allVaults);
    console.log(JSON.stringify(ilk))

    const dangerousVaults = allVaults
      .filter((vault) => vault.debt > 0 && vault.collateral > 0)
      .filter((vault) => {
        const collateral = parseFloat(vault.collateral)
        const price = parseFloat(ilk.price)
        const debt = parseFloat(vault.debt)
        const rate = parseFloat(ilk.rate)
        const mat = parseFloat(ilk.mat)
        const collateralIsEnough = (collateral * price * priceDropRatio) > (debt * mat * rate)
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
                  MinCollateralRatio: {ilk.mat}
                </p>
                <p className="subtitle is-size-4">
                  CurrentPrice: {ilk.price}
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
                  SimulatedPrice: {ilk.price * priceDropRatio}
                </p>
              </div>
              {dangerousVaults.map((vault) =>
                <div className="box has-text-centered" key={vault.id} >
                  <p className="subtitle is-size-6">
                    CdpId: {vault.cdpId ? vault.cdpId : vault.id}
                  </p>
                  <p className="subtitle is-size-6">
                    Collateral: {vault.collateral}
                  </p>
                  <p className="subtitle is-size-6">
                    Debt: {(parseFloat(vault.debt) * parseFloat(ilk.rate))}
                  </p>
                  <p className="subtitle is-size-6">
                    CurrentCollateralRatio: {parseFloat(vault.collateral) * parseFloat(ilk.price) / (parseFloat(vault.debt) * parseFloat(ilk.rate))}
                  </p>
                  <p className="subtitle is-size-6">
                    SimulatedCollateralRatio: {parseFloat(vault.collateral) * parseFloat(ilk.price) * parseFloat(priceDropRatio) / (parseFloat(vault.debt) * parseFloat(ilk.rate))}
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
