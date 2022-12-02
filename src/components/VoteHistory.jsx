import React, { useState, useEffect } from 'react';
import { useTranslate } from 'react-polyglot';
import { gql } from 'graphql-request';
import VoteHistoryApprovalTable from './VoteHistoryApprovalTable';
import VoteHistoryLogTable from './VoteHistoryLogTable';
import { utils } from 'ethers';

var VoteHistory = (props) => {
  const [voteLogs, setVoteLogs] = useState(undefined);
  const [voteApprovals, setVoteApprovals] = useState(undefined);
  const floatFromWad = (num) => utils.formatEther(num);
  const updateLogs = () => {
    const getData = async () => {
      const subgraphClient = props.subgraphClient;
      const getVoteLogs = async () => {
        const voteLogsQuery = `
                    voteLogs(first: 1000, orderBy: timestamp, orderDirection: desc){
                        # id,
                        timestamp,
                        transaction,
                        sender {
                            id,
                            voteWeight
                        },
                        __typename,
                        ... on VoteLogLock {
                            wad
                        }
                        ... on VoteLogSetDelay{
                            delay_
                        }
                        ... on VoteLogFree{
                            wad
                        }
                        ... on VoteLogLift{
                            hat {
                                id
                            }
                            oldHat {
                                id
                            }
                        }
                        ... on VoteLogEtch{
                            yays
                        }
                        ... on VoteLogVote{
                            oldSlate{
                                addresses
                            },
                            newSlate{
                                addresses
                            },
                        }
                    }
                    voteApprovals(first: 1000, where: {approvals_gt: 0}, orderBy: approvals, orderDirection: desc){
                        id,
                        address,
                        approvals
                    }
                    systemState(id:"current"){
                        hat {
                            id,
                            address,
                            approvals
                        }
                    },
                    users(first: 1000, where:{voteWeight_gt: 0}, orderBy: voteWeight, orderDirection: desc){
                        id,
                        voteWeight
                    }
                `;
        try {
          const voteLogsQueryResult = await subgraphClient.request(gql`{
                        ${voteLogsQuery}
                    }`);
          if (voteLogsQueryResult && voteLogsQueryResult.voteLogs) {
            voteLogsQueryResult.voteLogs = voteLogsQueryResult.voteLogs.map((voteLog) => {
              voteLog.description = t('daistats.vote_history.description.sent_transaction', {
                sender: voteLog.sender ? voteLog.sender.id : 'Someone',
                type: voteLog.__typename.replace('VoteLog', ''),
              });
              if (voteLog.__typename == 'VoteLogLock') {
                voteLog.description += t('daistats.vote_history.description.vote_log_lock', { mkr: floatFromWad(voteLog.wad) });
              } else if (voteLog.__typename == 'VoteLogFree') {
                voteLog.description += t('daistats.vote_history.description.vote_log_lock', { mkr: floatFromWad(voteLog.wad) });
              } else if (voteLog.__typename == 'VoteLogLift') {
                let message = '';
                if (voteLog.oldHat) {
                  message = t('daistats.vote_history.description.vote_log_lift.old_hat', {
                    newHat: voteLog.hat.id,
                    oldHat: voteLog.oldHat.id,
                  });
                } else {
                  message = t('daistats.vote_history.description.vote_log_lift.not_old_hat', { newHat: voteLog.hat.id });
                }
                voteLog.description += message;
              } else if (voteLog.__typename == 'VoteLogEtch') {
                voteLog.description += t('daistats.vote_history.description.vote_log_etch', {
                  candidates: voteLog.yays.join(', '),
                });
              } else if (voteLog.__typename == 'VoteLogVote') {
                let message = '';
                if (voteLog.oldSlate) {
                  message = t('daistats.vote_history.description.vote_log_vote.old_slate', {
                    yendao: floatFromWad(voteLog.sender.voteWeight),
                    newAddresses: voteLog.newSlate.addresses.join(', '),
                    oldAddresses: voteLog.oldSlate.addresses.join(', '),
                  });
                } else {
                  message = t('daistats.vote_history.description.vote_log_vote.not_old_slate', {
                    yendao: floatFromWad(voteLog.sender.voteWeight),
                    newAddresses: voteLog.newSlate.addresses.join(', '),
                  });
                }
                voteLog.description += message;
              }
              return voteLog;
            });
            return voteLogsQueryResult;
          } else {
            return {};
          }
        } catch (e) {
          console.log(e);
          return {};
        }
      };

      const voteLogsObject = await getVoteLogs();
      setVoteLogs(voteLogsObject.voteLogs);
      setVoteApprovals(voteLogsObject.voteApprovals);
    };
    getData();
  };
  useEffect(updateLogs, [props, t]);

  const t = useTranslate();
  return (
    <div>
      <div className="columns">
        <div className="column" key="VoteHistoryApprovalTable">
          {voteApprovals ? (
            <table className="table" style={{ margin: '0 auto', backgroundColor: '#192734', color: '#e6e8f1' }}>
              <VoteHistoryApprovalTable heading={true} />
              <tbody>
                {voteApprovals.map((log, idx) => (
                  <VoteHistoryApprovalTable log={log} key={idx} />
                ))}
              </tbody>
            </table>
          ) : (
            <div></div>
          )}
        </div>
        <div className="column" key="VoteHistoryLogTableKey">
          {voteLogs ? (
            <table className="table" style={{ margin: '0 auto', backgroundColor: '#192734', color: '#e6e8f1' }}>
              <VoteHistoryLogTable heading={true} />
              <tbody>
                {voteLogs.map((log, idx) => (
                  <VoteHistoryLogTable log={log} key={idx} />
                ))}
              </tbody>
            </table>
          ) : (
            <div></div>
          )}
        </div>
      </div>
      <hr />
    </div>
  );
};

export default VoteHistory;
