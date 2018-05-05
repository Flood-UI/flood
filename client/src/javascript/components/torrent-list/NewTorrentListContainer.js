import {defaultCellRangeRenderer, AutoSizer, Grid, ScrollSync} from 'react-virtualized';
import {FormattedMessage, injectIntl} from 'react-intl';
import React, {Component} from 'react';

import EventTypes from '../../constants/EventTypes';
import NewTableHeader from './NewTableHeader';
import ProgressBar from '../general/ProgressBar';
import SettingsStore from '../../stores/SettingsStore';
import TorrentDetail from '../../components/torrent-list/TorrentDetail';
import TorrentProperties from '../../constants/TorrentProperties';
import {torrentStatusIcons} from '../../util/torrentStatusIcons';
import TorrentFilterStore from '../../stores/TorrentFilterStore';
import TorrentStore from '../../stores/TorrentStore';
import UIActions from '../../actions/UIActions';

const condensedValueTransformers = {
  downloadTotal: torrent => torrent.bytesDone,
  peers: torrent => torrent.peersConnected,
  percentComplete: torrent => { 
    return <ProgressBar percent={torrent.percentComplete} icon={torrentStatusIcons(torrent.status)} />;
  },
  seeds: torrent => torrent.seedsConnected,
};

const condensedSecondaryValueTransformers = {
  peers: torrent => torrent.peersTotal,
  seeds: torrent => torrent.seedsTotal,
};

const defaultPropWidths = {
  name: 200,
  eta: 100,
};

class TorrentListContainer extends Component {
  state = {
    displayedProperties: SettingsStore.getFloodSettings('torrentDetails'),
    torrentCount: TorrentStore.getTorrents().length,
    torrents: TorrentStore.getTorrents(),
    torrentListColumnWidths: SettingsStore.getFloodSettings('torrentListColumnWidths'),
    torrentListViewSize: SettingsStore.getFloodSettings('torrentListViewSize'),
    selectedTorrents: TorrentStore.getSelectedTorrents(),
    selectedTorrentsKey: TorrentStore.getSelectedTorrents().join(),
  };

  componentDidMount() {
    SettingsStore.listen(EventTypes.SETTINGS_CHANGE, this.handleSettingsChange);
    TorrentStore.listen(EventTypes.CLIENT_TORRENTS_REQUEST_SUCCESS, this.handleTorrentRequestSuccess);
    TorrentStore.listen(EventTypes.UI_TORRENT_SELECTION_CHANGE, this.handleTorrentSelectionChange);
  }

  componentWillUnmount() {
    SettingsStore.unlisten(EventTypes.SETTINGS_CHANGE, this.handleSettingsChange);
    TorrentStore.unlisten(EventTypes.CLIENT_TORRENTS_REQUEST_SUCCESS, this.handleTorrentRequestSuccess);
    TorrentStore.unlisten(EventTypes.UI_TORRENT_SELECTION_CHANGE, this.handleTorrentSelectionChange);
  }

  cellRenderer = ({columnIndex, key, rowIndex, style}) => {
    const torrent = this.state.torrents[rowIndex];
    const displayedProp = this.state.displayedProperties[columnIndex];
    const propId = displayedProp.id;

    let value = torrent[propId];
    let secondaryValue;

    if (propId in condensedValueTransformers) {
      value = condensedValueTransformers[propId](torrent);
    }

    if (propId in condensedSecondaryValueTransformers) {
      secondaryValue = condensedSecondaryValueTransformers[propId](torrent);
    }

    const isSelected = this.state.selectedTorrents.indexOf(torrent.hash) !== -1;

    return (
      <TorrentDetail
        className="table__cell"
        hash={torrent.hash}
        isSelected={isSelected}
        key={key}
        preventTransform={propId === 'percentComplete'}
        secondaryValue={secondaryValue}
        slug={propId}
        style={style}
        value={value}
      />
    );
  };

  headingCellRenderer = ({columnIndex, key, rowIndex, style}) => {
    const {id} = this.state.displayedProperties[columnIndex];

    return (
      <div className="torrent-list__heading__cell" key={key} style={style}>
        <FormattedMessage
          id={TorrentProperties[id].id}
          defaultMessage={TorrentProperties[id].defaultMessage} />
      </div>
    );
  };

  handleTorrentRequestSuccess = () => {
    const torrents = TorrentStore.getTorrents();

    this.setState({
      torrents,
      torrentCount: torrents.length,
    });
  };

  handleTorrentSelectionChange = () => {
    const selectedTorrents = TorrentStore.getSelectedTorrents();
    const selectedTorrentsKey = selectedTorrents.join();

    this.setState({selectedTorrents, selectedTorrentsKey});
  };

  noContentRenderer() {
    return <div>no content</div>;
  }

  getColumnWidthByIndex = ({index}) => {
    const displayedProp = this.state.displayedProperties[index].id;
    return this.state.torrentListColumnWidths[displayedProp] || 100;
  };

  getRowHeight() {
    return 30;
  }

  handleSettingsChange = () => {
    this.setState({
      displayedProperties: SettingsStore.getFloodSettings('torrentDetails'),
      torrentListColumnWidths: SettingsStore.getFloodSettings('torrentListColumnWidths'),
      torrentListViewSize: SettingsStore.getFloodSettings('torrentListViewSize'),
    });
  };

  handleTorrentListClick = event => {
    let elementWithHashData = event.target;
    while (elementWithHashData.dataset && !elementWithHashData.dataset.hash) {
      elementWithHashData = elementWithHashData.parentNode;
    }
    if (!elementWithHashData.dataset) return;
    UIActions.handleTorrentClick({hash: elementWithHashData.dataset.hash, event});
  };

  renderCellRange = (props) => {
    const {verticalOffsetAdjustment} = props;
    if (verticalOffsetAdjustment != null) {
      props.verticalOffsetAdjustment = 30;
    }

    const children = defaultCellRangeRenderer(props);
    children.unshift(this.renderTorrentListHeadings());
    return children;
  };

  // TODO: Remove the ScrollSync component and this header element
  renderTorrentListHeadings = () => {
    const headingItems = this.state.displayedProperties.map(({id}, index) => {
      return (
        <div className="torrent-list__heading__cell" key={id} style={{width: this.getColumnWidthByIndex({index})}}>
          <FormattedMessage
            id={TorrentProperties[id].id}
            defaultMessage={TorrentProperties[id].defaultMessage} />
        </div>
      );
    });

    return (
      <div className="torrent-list__heading">
        {headingItems}
      </div>
    );
  };

  doSomeShit = (width) => {
    console.log(width);
  };

  handleScroll = event => {
    this.setState({scrollLeft: event.target.scrollLeft, scrollTop: event.target.scrollTop});
  };

  render() {
    // TODO: Re-enable nice header rendering but not fixed behavior, add this in Grid:
    // cellRangeRenderer={this.renderCellRange}
    return (
      <AutoSizer>
        {({ height, width }) => (
          <div style={{width, overflow: 'scroll'}} onScroll={this.handleScroll}>
            {this.doSomeShit(width)}
            <NewTableHeader
              {...this.props}
              displayedProperties={this.state.displayedProperties}
              getColumnWidthByIndex={this.getColumnWidthByIndex}
              sortProp={TorrentFilterStore.getTorrentsSort()} />
            <Grid
              cellRenderer={this.cellRenderer}
              selectedTorrentsKey={this.state.selectedTorrentsKey}
              columnWidth={this.getColumnWidthByIndex}
              columnCount={this.state.displayedProperties.length}
              height={height}
              noContentRenderer={this.noContentRenderer}
              overscanColumnCount={1}
              overscanRowCount={1}
              rowHeight={this.getRowHeight}
              rowCount={this.state.torrentCount}
              scrollLeft={this.state.scrollLeft}
              scrollTop={this.state.scrollTop}
              width={width}
            />
          </div>
        )}
      </AutoSizer>
    );
  }
}

export default injectIntl(TorrentListContainer);
