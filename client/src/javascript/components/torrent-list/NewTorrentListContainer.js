import {AutoSizer, Grid} from 'react-virtualized';
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
const filterInvisibleProperties = properties => properties.filter(property => property.visible);

class TorrentListContainer extends Component {
  rafId = null;

  constructor(props) {
    super(props);
    const torrentProperties = SettingsStore.getFloodSettings('torrentDetails');
    this.state = {
      visibleProperties: filterInvisibleProperties(torrentProperties),
      properties: torrentProperties,
      torrentCount: TorrentStore.getTorrents().length,
      torrents: TorrentStore.getTorrents(),
      torrentListColumnWidths: SettingsStore.getFloodSettings('torrentListColumnWidths'),
      torrentListViewSize: SettingsStore.getFloodSettings('torrentListViewSize'),
      selectedTorrents: TorrentStore.getSelectedTorrents(),
      selectedTorrentsKey: TorrentStore.getSelectedTorrents().join(),
    };
  }

  componentDidMount() {
    SettingsStore.listen(EventTypes.SETTINGS_CHANGE, this.handleSettingsChange);
    TorrentStore.listen(EventTypes.CLIENT_TORRENTS_REQUEST_SUCCESS, this.handleTorrentRequestSuccess);
    TorrentStore.listen(EventTypes.UI_TORRENT_SELECTION_CHANGE, this.handleTorrentSelectionChange);
  }

  componentWillUnmount() {
    SettingsStore.unlisten(EventTypes.SETTINGS_CHANGE, this.handleSettingsChange);
    TorrentStore.unlisten(EventTypes.CLIENT_TORRENTS_REQUEST_SUCCESS, this.handleTorrentRequestSuccess);
    TorrentStore.unlisten(EventTypes.UI_TORRENT_SELECTION_CHANGE, this.handleTorrentSelectionChange);
    global.cancelAnimationFrame(this.rafId);
  }

  cellRenderer = ({columnIndex, key, rowIndex, style}) => {
    const torrent = this.state.torrents[rowIndex];
    const displayedProp = this.state.visibleProperties[columnIndex];
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
    const {id} = this.state.visibleProperties[columnIndex];

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
    const displayedProp = this.state.properties[index].id;
    return this.state.torrentListColumnWidths[displayedProp] || 100;
  };

  getRowHeight() {
    return 30;
  }

  handleSettingsChange = () => {
    const torrentProperties = SettingsStore.getFloodSettings('torrentDetails');
    this.setState({
      visibleProperties: filterInvisibleProperties(torrentProperties),
      properties: torrentProperties,
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

  handleGridScroll = (scrollEvent) => {
    this.rafId = global.requestAnimationFrame(() => {
      this.headerRef.style.transform = `translateX(${scrollEvent.scrollLeft * -1}px)`;
    });
  };

  setHeaderRef = ref => {
    this.headerRef = ref;
  };

  render() {
    return (
      <div className="torrent-list">
        <NewTableHeader
          {...this.props}
          visibleProperties={this.state.visibleProperties}
          getColumnWidthByIndex={this.getColumnWidthByIndex}
          setRef={this.setHeaderRef}
          sortProp={TorrentFilterStore.getTorrentsSort()} />
        <div className="torrent-list__list" onClick={this.handleTorrentListClick}>
          <AutoSizer>
            {({ height, width }) => (
              <Grid
                cellRenderer={this.cellRenderer}
                className="torrent-list__grid"
                selectedTorrentsKey={this.state.selectedTorrentsKey}
                columnWidth={this.getColumnWidthByIndex}
                columnCount={this.state.visibleProperties.length}
                height={height}
                noContentRenderer={this.noContentRenderer}
                onScroll={this.handleGridScroll}
                overscanColumnCount={1}
                overscanRowCount={1}
                rowHeight={this.getRowHeight}
                rowCount={this.state.torrentCount}
                scrollLeft={this.state.scrollLeft}
                scrollTop={this.state.scrollTop}
                width={width}
              />
            )}
          </AutoSizer>
        </div>
      </div>
    );
  }
}

export default injectIntl(TorrentListContainer);
