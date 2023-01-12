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
  const [vaultTypeInputError, setVaultTypeInputError] = useState(undefined);
  const defaultJumpSeverity = 50;
  const [jumpSeverity, setJumpSeverity] = useState(defaultJumpSeverity);
  const [jumpSeverityInputError, _setJumpSeverityInputError] = useState(undefined);
  const defaultJumpFrequency = 2;
  const [jumpFrequency, setJumpFrequency] = useState(defaultJumpFrequency);
  const [jumpFrequencyInputError, _setJumpFrequencyInputError] = useState(undefined);
  const defaultKeeperProfit = 5;
  const [keeperProfit, setKeeperProfit] = useState(defaultKeeperProfit);
  const [keeperProfitInputError, _setKeeperProfitInputError] = useState(undefined);
  // variables propagated to child chart template
  const [riskPremiumByDebtExposure, setRiskPremiumByDebtExposure] = useState([]);
  const [maximumDebtCeiling, setMaximumDebtCeiling] = useState(0);
  const [totalDebtByVaultType, setTotalDebtByVaultType] = useState(0);
  // variables used in this template
  const [riskPremium, setRiskPremium] = useState(0);
  const [capitalAtRisk, setCapitalAtRisk] = useState(0);

  const updateModel = () => {
    const run = async () => {
      if (props.allVaults && props.allVaults[vaultType]) {
        // props from fetched data
        const allVaults = props.allVaults[vaultType];
        if (allVaults.length) {
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
          const capitalAtRiskValue = dangerousVaults.reduce((previous, current) => {
            // this coefficient can be anything with safety level.
            // if it has higher safety level, coeffient should be smaller.
            // fit model
            let coefficient = 1.0
            if (current.safetyLevel > 25) {
              coefficient = 0.1
            }
            return previous + parseFloat(current.debt * coefficient);
          }, 0);

          const riskPremiumValue = ((1 + keeperProfit / 100) * capitalAtRiskValue) / totalDebtByVaultTypeValue;
          // we set risk premium criteria as `0.1` as in https://maker.blockanalitica.com/simulations/risk-model/
          const riskPremiumCriteria = 0.1;
          const maximumDebtCeilingValue = Math.min(
            (riskPremiumCriteria / riskPremiumValue) * totalDebtByVaultTypeValue,
            Number.MAX_SAFE_INTEGER / 1000, // this should be total cap? or is it just a simulation so no cap?
          );
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
        }
        setVaultTypeInputError(undefined);
      } else {
        setVaultTypeInputError(true);
      }
    };
    run();
  };

  const t = useTranslate();
  return (
    <div>
      <div className="columns">
        <div className="column">
          <div className="box has-text-centered">
            <div className="subtitle is-size-6">
              {t('daistats.risk_model.vault_type')}:
              <div className="field has-addons has-addons-centered">
                <div className="control">
                  {/** shoule be select */}
                  <input
                    type="text"
                    value={vaultType ? vaultType : ''}
                    onChange={(event) => setVaultType(event.target.value)}
                    className={!vaultTypeInputError ? 'input' : 'input is-danger'}
                  />
                </div>
              </div>
              {vaultTypeInputError && (
                <div className="help has-text-warning">{t('daistats.risk_model.vault_type_input_error')}</div>
              )}
            </div>
            <div className="subtitle is-size-6">
              {t('daistats.risk_model.jump_severity')}:
              <div className="field has-addons has-addons-centered">
                <div className="control">
                  <input
                    type="text"
                    value={jumpSeverity ? jumpSeverity : ''}
                    onChange={(event) => setJumpSeverity(+event.target.value)}
                    className={!jumpSeverityInputError ? 'input' : 'input is-danger'}
                  />
                </div>
                <p className="control">
                  <a className="button is-static">%</a>
                </p>
              </div>
              {jumpSeverityInputError && (
                <div className="help has-text-warning">{t('daistats.risk_model.jump_severity_input_error')}</div>
              )}
            </div>
            <div className="subtitle is-size-6">
              {t('daistats.risk_model.jump_frequency')}:
              <div className="field has-addons has-addons-centered">
                <div className="control">
                  <input
                    type="text"
                    value={jumpFrequency ? jumpFrequency : ''}
                    onChange={(event) => setJumpFrequency(+event.target.value)}
                    className={!jumpFrequencyInputError ? 'input' : 'input is-danger'}
                  />
                </div>
                <p className="control">
                  <a className="button is-static">%</a>
                </p>
              </div>
              {jumpFrequencyInputError && (
                <div className="help has-text-warning">{t('daistats.risk_model.jump_frequency_input_error')}</div>
              )}
            </div>
            <div className="subtitle is-size-6">
              {t('daistats.risk_model.keeper_profit')}:
              <div className="field has-addons has-addons-centered">
                <div className="control">
                  <input
                    type="text"
                    value={keeperProfit ? keeperProfit : ''}
                    onChange={(event) => setKeeperProfit(+event.target.value)}
                    className={!keeperProfitInputError ? 'input' : 'input is-danger'}
                  />
                </div>
                <p className="control">
                  <a className="button is-static">%</a>
                </p>
              </div>
              {keeperProfitInputError && (
                <div className="help has-text-warning">{t('daistats.risk_model.keeper_profit_input_error')}</div>
              )}
            </div>
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
