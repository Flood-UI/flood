import React from 'react';

export default class TableHeadingItem extends React.Component {
  render() {
    const isSortActive = id === sortProp.property;
    const classes = classnames(
      'table__cell table__heading',
      {
        'table__heading--is-sorted': isSortActive,
        [`table__heading--direction--${sortProp.direction}`]: isSortActive
      }
    );

    const label = (
      <FormattedMessage
        id={TorrentProperties[id].id}
        defaultMessage={TorrentProperties[id].defaultMessage} />
    );

    return (
      <div className={classes}
        key={id}
        onClick={event => this.handleCellClick(id, event)}
        style={{ width: `${width}px` }}>
        <span className="table__heading__label"
          title={this.props.intl.formatMessage({
            id: TorrentProperties[id].id,
            defaultMessage: TorrentProperties[id].defaultMessage
          })}>
          {label}
        </span>
        {handle}
      </div>
    );
  }
}