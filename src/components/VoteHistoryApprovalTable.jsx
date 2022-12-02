import React from 'react';
import { useTranslate } from 'react-polyglot';

const VoteHistoryApprovalTable = (props) => {
  const t = useTranslate();
  const log = props.log;
  if (props.heading) {
    return (
      <thead>
        <tr>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t("daistats.vote_history.address")}</th>
          <th style={{ color: '#e6e8f1', fontWeight: 400 }}>{t("daistats.vote_history.approvals")}</th>
        </tr>
      </thead>
    );
  } else {
    return (
      <tr>
        <td className="has-text-right" title={log.address}>
          {log.address}
        </td>
        <td className="has-text-left" title={log.approvals}>
          {log.approvals}
        </td>
      </tr>
    );
  }
};

export default VoteHistoryApprovalTable;
