import classnames from 'classnames';
import React from 'react';
import TorrentProperties from '../../constants/TorrentProperties';

export default class NewTableHeader extends React.Component {
  render() {
    const { sortProp } = this.props;
    
    const header = this.props.displayedProperties.reduce((accumulator, property, index) => {
      const { id, visible } = property;
      const isSortActive = id === sortProp.property;
      const classes = classnames(
        'table__cell table__heading',
        {
          'table__heading--is-sorted': isSortActive,
          [`table__heading--direction--${sortProp.direction}`]: isSortActive
        }
      );
      const label = this.props.intl.formatMessage({
        id: TorrentProperties[id].id,
        defaultMessage: TorrentProperties[id].defaultMessage
      });
      const cellWidth = this.props.getColumnWidthByIndex({ index });
      
      accumulator.width += cellWidth;
      accumulator.cells.push(
        <div className={classes}
          key={id}
          onClick={event => this.handleCellClick(id, event)}
          style={{width: cellWidth}}>
          <span className="table__heading__label"
            title={label}>
            {label}
          </span>
        </div>
      );

      return accumulator;
    }, {
      cells: [],
      width: 0
    });

    return (
      <div onScroll={this.handleScroll} style={{ width: header.width }}>
        {header.cells}
      </div>
    )
  }
}