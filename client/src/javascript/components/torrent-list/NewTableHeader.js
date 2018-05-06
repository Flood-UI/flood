import classnames from 'classnames';
import React from 'react';
import TorrentProperties from '../../constants/TorrentProperties';
import {injectIntl} from 'react-intl';

let TableHeaderCell = class TableHeaderCell extends React.Component {
  handleCellClick = event => {
    this.props.onClick(this.props.id, event);
  };

  render() {
    const {cellWidth, id, isSortActive, sortPropDirection} = this.props;
    const classes = classnames(
      'table__cell table__heading',
      {
        'table__heading--is-sorted': isSortActive,
        [`table__heading--direction--${sortPropDirection}`]: isSortActive
      }
    );
    const label = this.props.intl.formatMessage({
      id: TorrentProperties[id].id,
      defaultMessage: TorrentProperties[id].defaultMessage
    });

    return (
      <div className={classes}
        key={id}
        onClick={this.handleCellClick}
        style={{ width: cellWidth }}>
        <span className="table__heading__label"
          title={label}>
          {label}
        </span>
      </div>
    );
  }
}
TableHeaderCell = injectIntl(TableHeaderCell);


export default class NewTableHeader extends React.Component {
  handleCellClick(id, event) {
    console.log(id, event);
  }

  render() {
    const { visibleProperties, getColumnWidthByIndex, setRef, sortProp } = this.props;    
    const headerCells = visibleProperties.reduce((accumulator, property, index) => {
      const { id, visible } = property;
      if (!visible) return accumulator;
      const isSortActive = id === sortProp.property;
      const cellWidth = getColumnWidthByIndex({index});
      return accumulator.concat(
        <TableHeaderCell
          key={id}
          cellWidth={cellWidth}
          onClick={this.handleCellClick}
          isSortActive={isSortActive}
          sortPropDirection={sortProp.direction}
          {...property}
        />
      );
    }, []);

    return (
      <div className="torrent-list__heading table__row--heading" ref={setRef}>
        {headerCells}
      </div>
    )
  }
}