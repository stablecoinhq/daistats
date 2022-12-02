import React, { useState } from 'react';
import { useTranslate } from 'react-polyglot';
import RiskModelChart from './RiskModelChart';

var RiskModel = (props) => {
  // get total debt for ilk

  // read some variables using user input via `useState`, `useEffect`
  // - vault type
  // - jump severity
  // - jump frequency
  // - keeper profit
  const defaultVaultType = 'FAU-A';
  const [vaultType, setVaultType] = useState(defaultVaultType);
  const defaultJumpSeverity = 50;
  const [jumpSeverity, setJumpSeverity] = useState(defaultJumpSeverity);
  const defaultJumpFrequency = 2;
  const [jumpFrequency, setJumpFrequency] = useState(defaultJumpFrequency);
  const defaultKeeperProfit = 5;
  const [keeperProfit, setKeeperProfit] = useState(defaultKeeperProfit);
  // variables propagated to child chart template
  const [riskPremiumByDebtExposure, setRiskPremiumByDebtExposure] = useState([]);
  const [maximumDebtCeiling, setMaximumDebtCeiling] = useState(0);
  const [totalDebtByVaultType, setTotalDebtByVaultType] = useState(0);
  // variables used in this template
  const [riskPremium, setRiskPremium] = useState(0);
  const [capitalAtRisk, setCapitalAtRisk] = useState(0);

  const updateModel = () => {
    const run = async () => {
      // props from fetched data
      const allVaults = props.allVaults && props.allVaults[vaultType] ? props.allVaults[vaultType] : [];
      const ilk = props.ilksByName[vaultType];
      // calculate risk premium when debt exposure is $100M
      const totalDebtByVaultTypeValue = parseFloat(ilk && ilk.Art ? ilk.Art : 0);
      const priceDropRatio = (1 - jumpSeverity / 100) ** jumpFrequency;
      // filter dangerous vaults with `dropRatio`.
      // we don't use `vaults-protected-score` data here.
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
      const capitalAtRiskValue = dangerousVaults
        .map((vault) => vault.debt)
        .reduce((previous, current) => previous + parseFloat(current), 0);

      const riskPremiumValue = ((1 + keeperProfit / 100) * capitalAtRiskValue) / totalDebtByVaultTypeValue;
      // we set risk premium criteria as `0.1` as in https://maker.blockanalitica.com/simulations/risk-model/
      const riskPremiumCriteria = 0.1;
      const maximumDebtCeilingValue = (riskPremiumCriteria / riskPremiumValue) * totalDebtByVaultTypeValue;

      // build graph data, decide showing x-axis range
      let xAxisStart = 0,
        xAxisEnd = 0;
      if (maximumDebtCeilingValue > totalDebtByVaultTypeValue) {
        xAxisStart = Math.max(
          Math.min(
            totalDebtByVaultTypeValue,
            totalDebtByVaultTypeValue - (maximumDebtCeilingValue - totalDebtByVaultTypeValue) * 1,
          ),
          0,
        );
        xAxisEnd = maximumDebtCeilingValue + (maximumDebtCeilingValue - totalDebtByVaultTypeValue) * 5;
      } else {
        xAxisStart = Math.max(
          Math.min(
            maximumDebtCeilingValue,
            maximumDebtCeilingValue - (totalDebtByVaultTypeValue - maximumDebtCeilingValue) * 1,
          ),
          0,
        );
        xAxisEnd = totalDebtByVaultTypeValue + (totalDebtByVaultTypeValue - maximumDebtCeilingValue) * 5;
      }
      const xAxisDiff = ((xAxisEnd - xAxisStart) * 1) / 100;
      const riskPremiumByDebtExposureList = [];
      for (let xAxisValue = xAxisStart; xAxisValue <= xAxisEnd; xAxisValue += xAxisDiff) {
        let yAxisValue = 0;
        if (xAxisValue < totalDebtByVaultTypeValue && totalDebtByVaultTypeValue < maximumDebtCeilingValue) {
          yAxisValue = riskPremiumValue;
        } else {
          yAxisValue = (xAxisValue / maximumDebtCeilingValue) * riskPremiumCriteria;
        }
        riskPremiumByDebtExposureList.push({ debtExposure: xAxisValue, riskPremium: yAxisValue });
      }
      setCapitalAtRisk(capitalAtRiskValue);
      setRiskPremium(riskPremiumValue);
      setMaximumDebtCeiling(maximumDebtCeilingValue);
      setTotalDebtByVaultType(totalDebtByVaultTypeValue);
      setRiskPremiumByDebtExposure(riskPremiumByDebtExposureList);
    };
    run();
  };

  const t = useTranslate();
  return (
    <div>
      <div className="columns">
        <div className="column">
          <div className="box has-text-centered">
            <p className="subtitle is-size-6">
              {t('daistats.risk_model.vault_type')}:
              <input
                type="text"
                value={vaultType ? vaultType : defaultVaultType}
                onChange={(event) => setVaultType(event.target.value)}
              />
            </p>
            <p className="subtitle is-size-6">
              {t('daistats.risk_model.jump_severity')}:
              <input
                type="text"
                value={jumpSeverity ? jumpSeverity : defaultJumpSeverity}
                onChange={(event) => setJumpSeverity(event.target.value)}
              />
              %
            </p>
            <p className="subtitle is-size-6">
              {t('daistats.risk_model.jump_frequency')}:
              <input
                type="text"
                value={jumpFrequency ? jumpFrequency : defaultJumpFrequency}
                onChange={(event) => setJumpFrequency(event.target.value)}
              />
            </p>
            <p className="subtitle is-size-6">
              {t('daistats.risk_model.keeper_profit')}:
              <input
                type="text"
                value={keeperProfit ? keeperProfit : defaultKeeperProfit}
                onChange={(event) => setKeeperProfit(event.target.value)}
              />
              %
            </p>
            <p className="subtitle is-size-6">
              <button onClick={updateModel}>{t('daistats.risk_model.go')}</button>
            </p>
            <div>
              <p className="subtitle is-size-6">
                {t('daistats.risk_model.maximum_debt_ceiling_for_risk_premium', {
                  riskPremium: 10,
                  maximumDebtCeiling: (maximumDebtCeiling | 0).toLocaleString(),
                })}
              </p>
              <p className="subtitle is-size-6">
                {t('daistats.risk_model.risk_premium_at_current_debt_exposure', {
                  totalDebtExposure: (totalDebtByVaultType | 0).toLocaleString(),
                  riskPremium: (riskPremium * 100).toLocaleString(),
                })}
              </p>
              <p className="subtitle is-size-6">
                {t('daistats.risk_model.capital_at_risk')}: ￥{(capitalAtRisk | 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="column">
          <div className="box has-text-centered">
            <h4 className="subtitle is-size-3">{t('daistats.risk_model.risk_model_chart')}</h4>
            <div>
              {riskPremiumByDebtExposure ? (
                <RiskModelChart
                  riskPremiumByDebtExposure={riskPremiumByDebtExposure}
                  maximumDebtCeiling={maximumDebtCeiling}
                  totalDebtByVaultType={totalDebtByVaultType}
                />
              ) : (
                <div></div>
              )}
            </div>
          </div>
        </div>
      </div>
      <hr />
    </div>
  );
};
export default RiskModel;
