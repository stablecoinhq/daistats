import React from 'react'
import { useTranslate } from 'react-polyglot';

const formatTwoDp = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

function VoteHistoryLogTable(props) {
  const t = useTranslate()
  const log = props.log
  if (props.heading) {
    return (<thead>
      <tr>
        <th style={{ color: "#e6e8f1", fontWeight: 400 }}>Time</th>
        <th style={{ color: "#e6e8f1", fontWeight: 400 }}>Transaction</th>
        {/* <th style={{ color: "#e6e8f1", fontWeight: 400 }}>Type</th> */}
        {/* <th style={{ color: "#e6e8f1", fontWeight: 400 }}>Sender</th> */}
        <th style={{ color: "#e6e8f1", fontWeight: 400 }}>Description</th>
      </tr>
    </thead>)
  } else {
    return (
      <tr>
        <td className="has-text-right" title={log.timestamp}>{(new Date(parseInt(log.timestamp) * 1000)).toLocaleString()}</td>
        <td className="has-text-left">
          <a href={`https://etherscan.io/tx/${log.transaction}`} target="_blank" rel="noopener noreferrer">
            <p className="subtitle is-size-6" style={{ 'lineHeight': '24px' }}>
              {log.transaction}
            </p>
          </a>
        </td>
        {/* <td className="has-text-left" title={log.__typename}>{log.__typename}</td> */}
        {/* <td className="has-text-left" title={log.sender}>{log.sender}</td> */}
        <td className="has-text-left" title={log.description}>{log.description}</td>
      </tr>
    )
  }
}

export default VoteHistoryLogTable
