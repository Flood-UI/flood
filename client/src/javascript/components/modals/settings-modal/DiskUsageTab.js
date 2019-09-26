import {Checkbox, Form, FormRow, Select, SelectItem, Radio} from 'flood-ui-kit';
import {FormattedMessage, injectIntl} from 'react-intl';
import React from 'react';

import ModalFormSectionHeader from '../ModalFormSectionHeader';
import SettingsStore from '../../../stores/SettingsStore';
import SettingsTab from './SettingsTab';
import SortableList from '../../general/SortableList';
import DiskUsageStore from '../../../stores/DiskUsageStore';

class DiskUsageTab extends SettingsTab {
  tooltipRef = null;

  state = {
    diskItems: [],
  };

  componentWillMount() {
    // assemble disk items from saved "mountPoints" and list fo disks "disks"
    const mountPoints = SettingsStore.getFloodSettings('mountPoints');
    const disks = DiskUsageStore.getDiskUsage().reduce((a, c) => {
      a[c.target] = c;
      return a;
    }, {});
    const diskItems = [];
    // first targets saved in mountPoints that exist in disks
    diskItems.push(
      ...mountPoints.filter(target => target in disks).map(target => ({
        id: target,
        visible: true,
      })),
    );
    // then remaing targets from disks
    diskItems.push(
      ...Object.keys(disks)
        .filter(target => !mountPoints.includes(target))
        .map(target => ({
          id: target,
          visible: false,
        })),
    );
    this.setState({diskItems});
  }

  updateSettings = () => {
    const {diskItems} = this.state;
    const mountPoints = diskItems.filter(item => item.visible).map(item => item.id);
    this.props.onSettingsChange({mountPoints});
  };

  handleDiskCheckboxValueChange = (id, value) => {
    let {diskItems} = this.state;

    diskItems = diskItems.map(disk => {
      if (disk.id === id) {
        disk.visible = value;
      }
      return disk;
    });

    this.setState({diskItems});
    this.updateSettings();
  };

  handleFormChange = ({event, formData}) => {};

  handleDiskMouseDown = () => {
    if (this.tooltipRef != null) {
      this.tooltipRef.dismissTooltip();
    }
  };

  handleDiskMove = items => {
    this.setState({diskItems: items});
    this.updateSettings();
  };

  renderDiskItem = (item, index) => {
    const {id, visible} = item;
    let checkbox = null;

    if (!item.dragIndicator) {
      checkbox = (
        <span className="sortable-list__content sortable-list__content--secondary">
          <Checkbox
            checked={visible}
            onChange={event => this.handleDiskCheckboxValueChange(id, event.target.checked)}
            modifier="dark">
            <FormattedMessage id="settings.diskusage.show" defaultMessage="Show" />
          </Checkbox>
        </span>
      );
    }

    const content = (
      <div className="sortable-list__content sortable-list__content__wrapper">
        <span className="sortable-list__content sortable-list__content--primary">
          <div>{id}</div>
        </span>
        {checkbox}
      </div>
    );

    if (item.dragIndicator) {
      return <div className="sortable-list__item">{content}</div>;
    }

    return content;
  };

  render() {
    // const torrentDetailItems = new Array(5);
    const {diskItems} = this.state;

    return (
      <Form onChange={this.handleFormChange}>
        <ModalFormSectionHeader>
          <FormattedMessage defaultMessage="Disk Usage Mount Points" id="settings.diskusage.mount.points" />
        </ModalFormSectionHeader>
        <FormRow>
          <SortableList
            className="sortable-list--disks"
            items={diskItems}
            lockedIDs={[]}
            onMouseDown={this.handleDiskMouseDown}
            onDrop={this.handleDiskMove}
            renderItem={this.renderDiskItem}
          />
        </FormRow>
      </Form>
    );
  }
}

export default injectIntl(DiskUsageTab);
