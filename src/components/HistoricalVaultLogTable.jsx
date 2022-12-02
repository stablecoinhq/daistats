import React from 'react';
import { useTranslate } from 'react-polyglot';

function HistoricalVaultLogTable(props) {
  const t = useTranslate();
  const log = props.log;
  if (props.heading) {
    return (
      <thead>
        <tr>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t("daistats.vault_information.time")}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t("daistats.vault_information.operations")}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t("daistats.vault_information.collateral_change")}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t("daistats.vault_information.debt_change")}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t("daistats.vault_information.market_price")}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t("daistats.vault_information.oracle_price")}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t("daistats.vault_information.pre_collateralization_ratio")}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t("daistats.vault_information.post_collateralization_ratio")}</th>
        </tr>
      </thead>
    );
  } else {
    let typeName = ""
    switch (log.__typename) {
      case "VaultCreationLog": {
        typeName = t("daistats.vault_information.vault_creation_log")
        break;
      }
      case "VaultCollateralChangeLog": {
        typeName = t("daistats.vault_information.vault_collateral_change_log")
        break;
      }
      case "VaultDebtChangeLog": {
        typeName = t("daistats.vault_information.vault_debt_change_log")
        break;
      }
      case "VaultSplitChangeLog": {
        typeName = t("daistats.vault_information.vault_split_change_log")
        break;
      }
      case "VaultTransferChangeLog": {
        typeName = t("daistats.vault_information.vault_transfer_change_log")
        break;
      }
      default: {
        typeName = log.__typename
        break;
      }
    }
    return (
      <tr>
        <td className="has-text-right" title={log.timestamp}>
          {new Date(parseInt(log.timestamp) * 1000).toLocaleString()}
        </td>
        <td className="has-text-left">
          <a href={`https://etherscan.io/tx/${log.transaction}`} target="_blank" rel="noopener noreferrer">
            <p className="subtitle is-size-6" style={{ 'lineHeight': '24px' }}>
              {typeName}
            </p>
          </a>
        </td>
        <td className="has-text-right" title={log.collateralChange}>
          {log.collateralChange}
        </td>
        <td className="has-text-right" title={log.debtChange}>
          {log.debtChange}
        </td>
        <td className="has-text-right" title={log.oraclePrice}>
          {log.oraclePrice}
        </td>
        <td className="has-text-right" title={log.oraclePrice}>
          {log.oraclePrice}
        </td>
        <td className="has-text-right" title={log.preCollateralizationRatio}>
          {log.preCollateralizationRatio}
        </td>
        <td className="has-text-right" title={log.postCollateralizationRatio}>
          {log.postCollateralizationRatio}
        </td>
      </tr>
    );
  }
}

export default HistoricalVaultLogTable;
