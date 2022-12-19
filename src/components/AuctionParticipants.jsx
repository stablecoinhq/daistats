import React, { useState, useEffect } from 'react';
import { useTranslate } from 'react-polyglot';
import { gql } from 'graphql-request';
import AuctionParticipantsChart from './AuctionParticipantsChart';

var AuctionParticipants = (props) => {
  const [auctions, setAuctions] = useState(undefined);
  const updateVault = () => {
    const getData = async () => {
      const subgraphClient = props.subgraphClient;
      const getAuctionParticipants = async () => {
        const auctionLogs = [];
        // async operation to update logs
        const graphQuery = `{
            saleAuctions(orderBy: boughtAt, orderDirection:desc, first:1000){
                id,
                boughtAt,
                userIncentives{
                    id
                },
                userTaker
            }
        }`;
        try {
          const saleAuctionsQueryResult = await subgraphClient.request(
            gql`
              ${graphQuery}
            `,
          );
          if (saleAuctionsQueryResult && saleAuctionsQueryResult.saleAuctions && saleAuctionsQueryResult.saleAuctions[0]) {
            const timestampList = saleAuctionsQueryResult.saleAuctions
              .map((saleAuction) => parseInt(saleAuction.boughtAt))
              .filter((timestamp) => timestamp > 0);
            const diffTimestamp = 60 * 60 * 24; // 1 day
            const minTimestamp = ((Math.min(...timestampList) / diffTimestamp) | 0) * diffTimestamp;
            const maxTimestamp = (((Math.max(...timestampList) / diffTimestamp) | 0) + 1) * diffTimestamp;
            for (let timestampIndex = minTimestamp; timestampIndex <= maxTimestamp; timestampIndex += diffTimestamp) {
              // collect auctions which happened around at `timeStampIndex`
              const auctionsInTimeWindow = saleAuctionsQueryResult.saleAuctions.filter(
                (saleAuction) =>
                  timestampIndex < saleAuction.boughtAt && saleAuction.boughtAt <= timestampIndex + diffTimestamp,
              );
              // count unique keepers from that time
              const uniqueKeepers = new Set(auctionsInTimeWindow.map((auction) => auction.userIncentives.id)).size;
              // count unique takers from that time
              const uniqueTakers = new Set(auctionsInTimeWindow.map((auction) => auction.userTaker)).size;
              auctionLogs.push({
                keepers: uniqueKeepers,
                takers: uniqueTakers,
                timestamp: timestampIndex,
              });
            }
            auctionLogs.push({
              keepers: auctionLogs[auctionLogs.length - 1].keepers,
              takers: auctionLogs[auctionLogs.length - 1].takers,
              timestamp: (Date.now() / 1000) | 0,
            });
          }
        } catch (e) {
          console.log(`failed to fetch subgraph query: ` + e);
        }
        return auctionLogs;
      };
      const auctionParticipants = await getAuctionParticipants();
      if (auctionParticipants && auctionParticipants.length > 0) {
        setAuctions(auctionParticipants);
      }
    };
    getData();
  };
  useEffect(updateVault, [props]);

  const t = useTranslate();
  return (
    <div>
      <div className="columns">
        <div className="column">
          <div className="box has-text-centered">
            <h4 className="subtitle is-size-3">{t('daistats.auction_participants.auction_participants_chart')}</h4>
            {auctions ? <AuctionParticipantsChart auctions={auctions} /> : <div></div>}
          </div>
        </div>
      </div>
      <hr />
    </div>
  );
};

export default AuctionParticipants;
