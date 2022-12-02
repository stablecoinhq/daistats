import React from 'react';
import { useTranslate } from 'react-polyglot';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { useLocation, useHistory } from 'react-router-dom';
import VaultsAtRisk from './components/VaultsAtRisk';
import IndividualVault from './components/IndividualVault';
import AuctionParticipants from './components/AuctionParticipants';
import RiskModel from './components/RiskModel';
import ProtocolChange from './components/ProtocolChange';
import VoteHistory from './components/VoteHistory';

const formatNoDecimals = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const Main = (props) => {
  const t = useTranslate();
  document.title = `${formatNoDecimals.format(props.debt)} - Dai Stats`;

  // hack till Main component is broken into component per section
  const location = useLocation();
  const history = useHistory();
  const indexToTab = [
    '/vaults-at-risk',
    '/vault-information',
    '/auction-participants',
    '/risk-model',
    '/protocol-change',
    '/vote-history',
  ];
  const tabNameToIndex = () => {
    let i = indexToTab.map((tabName) => location.pathname.includes(tabName)).indexOf(true);

    return i >= 0 ? i : 0;
  };
  const cdpId = (() => {
    const matchList = location.pathname.match(/\/vault-information\/([^/]+)/);
    if (matchList && matchList.length >= 2 && matchList[1]) {
      return matchList[1];
    }
  })();

  return (
    <div>
      <div className="container">
        <Tabs defaultIndex={tabNameToIndex()} onSelect={(index) => history.push(indexToTab[index])}>
          <TabList>
            <Tab>
              <p className="is-size-5">{t('daistats.vaults_at_risk.title')}</p>
            </Tab>
            <Tab>
              <p className="is-size-5">{t('daistats.vault_information.title')}</p>
            </Tab>
            <Tab>
              <p className="is-size-5">{t('daistats.auction_participants.title')}</p>
            </Tab>
            <Tab>
              <p className="is-size-5">{t('daistats.risk_model.title')}</p>
            </Tab>
            <Tab>
              <p className="is-size-5">{t('daistats.protocol_change.title')}</p>
            </Tab>
            <Tab>
              <p className="is-size-5">{t('daistats.vote_history.title')}</p>
            </Tab>
          </TabList>
          <TabPanel>
            <Tabs>
              <TabList>
                <Tab>
                  <p className="is-size-5">ETH-A</p>
                </Tab>
                <Tab>
                  <p className="is-size-5">FAU-A</p>
                </Tab>
              </TabList>
              <TabPanel>
                <VaultsAtRisk {...props} ilk="ETH-A" />
              </TabPanel>
              <TabPanel>
                <VaultsAtRisk {...props} ilk="FAU-A" />
              </TabPanel>
            </Tabs>
          </TabPanel>
          <TabPanel>
            <Tabs>
              <TabList>
                <Tab>
                  <p className="is-size-5">{t('daistats.vault_information.title')}</p>
                </Tab>
              </TabList>
              <TabPanel>
                <IndividualVault {...props} cdpId={cdpId} />
              </TabPanel>
            </Tabs>
          </TabPanel>
          <TabPanel>
            <Tabs>
              <TabList>
                <Tab>
                  <p className="is-size-5">{t('daistats.auction_participants.title')}</p>
                </Tab>
              </TabList>
              <TabPanel>
                <AuctionParticipants {...props} />
              </TabPanel>
            </Tabs>
          </TabPanel>
          <TabPanel>
            <Tabs>
              <TabList>
                <Tab>
                  <p className="is-size-5">{t('daistats.risk_model.title')}</p>
                </Tab>
              </TabList>
              <TabPanel>
                <RiskModel {...props} />
              </TabPanel>
            </Tabs>
          </TabPanel>
          <TabPanel>
            <Tabs>
              <TabList>
                <Tab>
                  <p className="is-size-5">{t('daistats.protocol_change.title')}</p>
                </Tab>
              </TabList>
              <TabPanel>
                <ProtocolChange {...props} />
              </TabPanel>
            </Tabs>
          </TabPanel>
          <TabPanel>
            <Tabs>
              <TabList>
                <Tab>
                  <p className="is-size-5">{t('daistats.vote_history.title')}</p>
                </Tab>
              </TabList>
              <TabPanel>
                <VoteHistory {...props} />
              </TabPanel>
            </Tabs>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
};

export default Main;
