import React, { useState, useEffect } from 'react';
import { useTranslate } from 'react-polyglot';

function VaultsAtRisk(props) {
  const [priceDropRatio, setPriceDropRatio] = useState('0.8');
  useEffect(() => {
    setPriceDropRatio(priceDropRatio);
  }, [priceDropRatio]);

  const allVaults = props.allVaults ? props.allVaults[props.ilk] : undefined;
  const t = useTranslate();
  if (allVaults) {
    const ilk = props.ilksByName[props.ilk];

    const dangerousVaults = allVaults
      .filter((vault) => vault.debt > 0 && vault.collateral > 0)
      .filter((vault) => {
        const collateral = parseFloat(vault.collateral);
        const price = parseFloat(ilk.price);
        const debt = parseFloat(vault.debt);
        const rate = parseFloat(ilk.rate);
        const mat = parseFloat(ilk.mat);
        const collateralIsEnough = collateral * price * priceDropRatio > debt * mat * rate;
        return !collateralIsEnough;
      });
    // split vaults list into chunks for display
    const dangerousVaultsChunks = [],
      chunkSize = 3;
    for (let i = 0; i < dangerousVaults.length; i += chunkSize) {
      const chunk = dangerousVaults.slice(i, i + chunkSize);
      dangerousVaultsChunks.push(chunk);
    }

    return (
      <div>
        <div className="has-text-centered">
          <div className="box has-text-centered">
            <p className="subtitle is-size-4">
              {t('daistats.vaults_at_risk.number_of_vaults_at_risk')}: {dangerousVaults.length} of {allVaults.length}
            </p>
            <p className="subtitle is-size-4">
              {t('daistats.vaults_at_risk.min_collateral_ratio')}: {ilk.mat}
            </p>
            <p className="subtitle is-size-4">
              {t('daistats.vaults_at_risk.current_price')}: {ilk.price}
            </p>
            <p className="subtitle is-size-4">
              {t('daistats.vaults_at_risk.price_drop_ratio')}:
              <input type="text" onChange={(event) => setPriceDropRatio(event.target.value)} value={priceDropRatio} />
            </p>
            <p className="subtitle is-size-4">
              {t('daistats.vaults_at_risk.simulated_price')}: {ilk.price * priceDropRatio}
            </p>
          </div>
          {dangerousVaultsChunks.map((vaultList, vaultListIndex) => (
            <div className="columns" key={`vaultListIndex_${vaultListIndex}`}>
              {vaultList.map((vault) => (
                <div className="column box has-text-centered" key={vault.id}>
                  <p className="subtitle is-size-6">CDP ID: {vault.cdpId ? vault.cdpId : vault.id}</p>
                  <p className="subtitle is-size-6">
                    {t('daistats.vaults_at_risk.collateral')}: {vault.collateral}
                  </p>
                  <p className="subtitle is-size-6">
                    {t('daistats.vaults_at_risk.debt')}: {parseFloat(vault.debt) * parseFloat(ilk.rate)}
                  </p>
                  <p className="subtitle is-size-6">
                    {t('daistats.vaults_at_risk.current_collateral_ratio')}:{' '}
                    {(parseFloat(vault.collateral) * parseFloat(ilk.price)) / (parseFloat(vault.debt) * parseFloat(ilk.rate))}
                  </p>
                  <p className="subtitle is-size-6">
                    {t('daistats.vaults_at_risk.simulated_collateral_ratio')}:{' '}
                    {(parseFloat(vault.collateral) * parseFloat(ilk.price) * parseFloat(priceDropRatio)) /
                      (parseFloat(vault.debt) * parseFloat(ilk.rate))}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
        <hr />
      </div>
    );
  } else {
    return <div></div>;
  }
}

export default VaultsAtRisk;
