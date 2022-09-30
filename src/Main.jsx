import React from 'react'
import { useTranslate } from 'react-polyglot';
import Collateral from './components/Collateral';
import Psm from './components/Psm';
import HistoricalDebtChart from './components/HistoricalDebtChart';
import Pip from './components/Pip'
import CollateralChart from './components/CollateralChart';
import Clip from './components/Clip';
import Vest from './components/Vest';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { useLocation, useHistory } from "react-router-dom";
import VaultsAtRisk from './components/VaultsAtRisk';


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

const formatCurrency = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4
})

const formatTwoDp = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const formatPercent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const formatFiveDp = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 5,
  maximumFractionDigits: 5
})

const formatSixDp = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 6,
  maximumFractionDigits: 6
})

const formatEightDp = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 8,
  maximumFractionDigits: 8
})

const Main = (props) => {
  const t = useTranslate()
  document.title = `${formatNoDecimals.format(props.debt)} - Dai Stats`
  const sysCollat = props.sysLocked / props.debt

  const nextFlap = () =>
    formatAmount.format(
      (Number(props.surplusBuffer)
        + Number(props.surplusBump))
      - Number(props.sysSurplus)
    )

  // hack till Main component is broken into component per section
  const location = useLocation();
  const history = useHistory();
  const indexToTab = ['/vaults-at-risk']
  function tabNameToIndex() {
    let i = indexToTab.indexOf(location.pathname)
    return (i >= 0 ? i : 0)
  }

  return (
    <div>
      <div className="container">
        <Tabs defaultIndex={tabNameToIndex()} onSelect={index => history.push(indexToTab[index])}>
          <TabList>
            <Tab><p className="is-size-5">Vaults at risk</p></Tab>
          </TabList>
          <TabPanel>
            <Tabs>
              <TabList>
                <Tab><p className="is-size-5">ETH-A</p></Tab>
                <Tab><p className="is-size-5">ETH-B</p></Tab>
              </TabList>
              <TabPanel>
                <VaultsAtRisk {...props} ilk="ETH-A" />
              </TabPanel>
              <TabPanel>
                <VaultsAtRisk {...props} ilk="ETH-B" />
              </TabPanel>
            </Tabs>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  )
}

export default Main
