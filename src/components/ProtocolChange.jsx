import React, { useState, useEffect } from 'react'
import { useTranslate } from 'react-polyglot';
import { gql, GraphQLClient } from "graphql-request"
import ProtocolChangeTable from './ProtocolChangeTable';

function ProtocolChange(props) {
  const [logs, setLogs] = useState(undefined);
  const updateLogs = () => {
    const getData = async () => {
      const subgraphClient = props.subgraphClient
      const getProtocolParameterChangeLog = async (ilkName) => {
        const protocolParameterChangeLogsQuery = `
          protocolParameterChangeLogs(
            first: 1000,
            orderBy: timestamp,
            orderDirection: desc, 
            #where: {
            #    parameterKey2: "${ilkName}"
            #    parameterKey1: "mat",
            #    contractType: SPOT,
            #}
            where: {
              parameterKey1_not: "spot"
            }
          ){
            timestamp,
            transaction,
            contractType,
            __typename,
            parameterKey1,
            parameterKey2,
            ... on ProtocolParameterChangeLogBigDecimal {parameterValue},
            ... on ProtocolParameterChangeLogBigInt {parameterValue},
            ... on ProtocolParameterChangeLogBytes {parameterValue},
          }
        `
        try {
          const protocolParameterChangeLogsQueryResult = await subgraphClient.request(gql`{
            ${protocolParameterChangeLogsQuery}
          }`)
          if (protocolParameterChangeLogsQueryResult && protocolParameterChangeLogsQueryResult.protocolParameterChangeLogs) {
            return protocolParameterChangeLogsQueryResult.protocolParameterChangeLogs
          } else {
            return []
          }
        } catch (e) {
          console.log(e)
          return []
        }
      }

      const protocolParameterChangeLogs = await getProtocolParameterChangeLog()
      setLogs(protocolParameterChangeLogs)
    }
    getData();
  }
  useEffect(updateLogs, []);

  const t = useTranslate()
  return (
    <div>
      <div className="columns">
        <div className="column" key="ProtocolChangeTableParameters">
          {/* <div className="box has-text-centered"  >
            <p className="subtitle is-size-6">
              VaultType:
              <input
                type="text"
                value={vaultType ? vaultType : defaultVaultType}
                onChange={event => setVaultType(event.target.value)}
              />
            </p>
            <p className="subtitle is-size-6">
              JumpSeverity:
              <input
                type="text"
                value={jumpSeverity ? jumpSeverity : defaultJumpSeverity}
                onChange={event => setJumpSeverity(event.target.value)}
              />
            </p>
            <p className="subtitle is-size-6">
              JumpFrequency:
              <input
                type="text"
                value={jumpFrequency ? jumpFrequency : defaultJumpFrequency}
                onChange={event => setJumpFrequency(event.target.value)}
              />
            </p>
            <p className="subtitle is-size-6">
              KeeperProfit:
              <input
                type="text"
                value={keeperProfit ? keeperProfit : defaultKeeperProfit}
                onChange={event => setKeeperProfit(event.target.value)}
              />
            </p>
            <p className="subtitle is-size-6">
              <button onClick={updateModel}>Go</button>
            </p>
            <div>
              <p className="subtitle is-size-6">
                Maximum Debt Ceiling (Risk Premium = 10%) is ${(maximumDebtCeiling | 0).toLocaleString()}
              </p>
              <p className="subtitle is-size-6">
                Risk Premium at current Debt Exposure (${(totalDebtByVaultType | 0).toLocaleString()}) is {(riskPremium * 100).toLocaleString()}%
              </p>
              <p className="subtitle is-size-6">
                Capital at Risk: ${(capitalAtRisk | 0).toLocaleString()}
              </p>
            </div>
          </div> */}
        </div>
      </div>
      <div className="columns">
        <div className="column" key="ProtocolChangeTable">
          {(logs) ?
            <table className="table" style={{ margin: '0 auto', backgroundColor: '#192734', color: '#e6e8f1' }}>
              <ProtocolChangeTable heading={true} />
              <tbody>
                {logs.map((log, idx) => (
                  <ProtocolChangeTable log={log} />
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

export default ProtocolChange
