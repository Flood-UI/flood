import _ from 'lodash';
import {Button, Checkbox, Form, FormError, FormRow, FormRowGroup, FormRowItem, Select, SelectItem, Textbox} from 'flood-ui-kit';
import {defineMessages, FormattedMessage, injectIntl} from 'react-intl';
import React from 'react';

import ArrowIcon from '../../icons/ArrowIcon';
import Add from '../../icons/Add';
import Close from '../../icons/Close';
import EventTypes from '../../../constants/EventTypes';
import FeedMonitorStore from '../../../stores/FeedMonitorStore';
import ModalFormSectionHeader from '../ModalFormSectionHeader';
import TorrentDestination from '../../general/filesystem/TorrentDestination';
import Validator from '../../../util/Validator';

const MESSAGES = defineMessages({
  mustSpecifyDestination: {
    id: 'feeds.validation.must.specify.destination',
    defaultMessage: 'You must specify a destination.'
  },
  mustSelectFeed: {
    id: 'feeds.validation.must.select.feed',
    defaultMessage: 'You must select a feed.'
  },
  mustSpecifyLabel: {
    id: 'feeds.validation.must.specify.label',
    defaultMessage: 'You must specify a label.'
  },
  invalidRegularExpression: {
    id: 'feeds.validation.invalid.regular.expression',
    defaultMessage: 'Invalid regular expression.'
  },
  url: {
    id: 'feeds.url',
    defaultMessage: 'URL'
  },
  label: {
    id: 'feeds.label',
    defaultMessage: 'Label'
  },
  regEx: {
    id: 'feeds.regEx',
    defaultMessage: 'RegEx'
  },
  tags: {
    id: 'feeds.tags',
    defaultMessage: 'Tags'
  }
});

class DownloadRulesTab extends React.Component {
  validatedFields = {
    destination: {
      isValid: Validator.isNotEmpty,
      error: this.props.intl.formatMessage(MESSAGES.mustSpecifyDestination)
    },
    feedID: {
      isValid: Validator.isNotEmpty,
      error: this.props.intl.formatMessage(MESSAGES.mustSelectFeed)
    },
    label: {
      isValid: Validator.isNotEmpty,
      error: this.props.intl.formatMessage(MESSAGES.mustSpecifyLabel)
    },
    match: {
      isValid: (value) => {
        return Validator.isNotEmpty(value) && Validator.isRegExValid(value);
      },
      error: this.props.intl.formatMessage(MESSAGES.invalidRegularExpression)
    },
    exclude: {
      isValid: (value) => {
        if (Validator.isNotEmpty(value)) {
          return Validator.isRegExValid(value);
        }

        return true;
      },
      error: this.props.intl.formatMessage(MESSAGES.invalidRegularExpression)
    }
  };

  state = {
    errors: {},
    feeds: FeedMonitorStore.getFeeds(),
    rules: FeedMonitorStore.getRules(),
    currentlyEditingRule: 'none'
  };

  componentDidMount() {
    FeedMonitorStore.listen(
      EventTypes.SETTINGS_FEED_MONITORS_FETCH_SUCCESS,
      this.handleFeedMonitorsFetchSuccess
    );
  }

  componentWillUnmount() {
    FeedMonitorStore.unlisten(
      EventTypes.SETTINGS_FEED_MONITORS_FETCH_SUCCESS,
      this.handleFeedMonitorsFetchSuccess
    );
  }

  checkFieldValidity = _.throttle(
    (fieldName, fieldValue) => {
      const {errors} = this.state;

      if (
        this.state.errors[fieldName]
        && this.validatedFields[fieldName].isValid(fieldValue)
      ) {
        delete errors[fieldName];
        this.setState({errors});
      }
    },
    150
  );

  getAmendedFormData() {
    const formData = this.formRef.getFormData();

    return Object.assign(
      {},
      formData,
      {
        field: 'title',
        tags: formData.tags.split(',')
      }
    );
  }

  getAvailableFeedsOptions() {
    if (!this.state.feeds.length) {
      return [
        <SelectItem key="empty" id="placeholder" placeholder>
          <em>
            <FormattedMessage
              id="feeds.no.feeds.available"
              defaultMessage="No feeds available."
            />
          </em>
        </SelectItem>
      ];
    }

    return this.state.feeds.reduce((feedOptions, feed) => {
      return feedOptions.concat(
        <SelectItem key={feed._id} id={feed._id}>
          {feed.label}
        </SelectItem>
      );
    }, [
      <SelectItem key="select-feed" id="placeholder" placeholder>
        <em>
          <FormattedMessage
            id="feeds.select.feed"
            defaultMessage="Select feed"
          />
        </em>
      </SelectItem>
    ]);
  }

  getModifyRuleForm(rule) {
    return (
      <li className="interactive-list__item interactive-list__item--stacked-content feed-list__feed" key={rule._id}>
        <FormRowGroup>
          <FormRow>
            <Textbox
              id="label"
              label={this.props.intl.formatMessage({
                id: 'feeds.label',
                defaultMessage: 'Label'
              })}
              defaultValue={rule.label}
            />
            <Select
              disabled={!this.state.feeds.length}
              id="feedID"
              label={this.props.intl.formatMessage({
                id: 'feeds.applicable.feed',
                defaultMessage: 'Applicable Feed'
              })}
              defaultID={rule.feedID}
            >
              {this.getAvailableFeedsOptions()}
            </Select>
          </FormRow>
          <FormRow>
            <Textbox
              id="match"
              label={this.props.intl.formatMessage({
                id: 'feeds.match.pattern',
                defaultMessage: 'Match Pattern'
              })}
              placeholder={this.props.intl.formatMessage(MESSAGES.regEx)}
              defaultValue={rule.match}
            />
            <Textbox
              id="exclude"
              label={this.props.intl.formatMessage({
                id: 'feeds.exclude.pattern',
                defaultMessage: 'Exclude Pattern'
              })}
              placeholder={this.props.intl.formatMessage(MESSAGES.regEx)}
              defaultValue={rule.exclude}
            />
            <Textbox
              id="tags"
              label={this.props.intl.formatMessage({
                id: 'feeds.apply.tags',
                defaultMessage: 'Apply Tags'
              })}
              placeholder={this.props.intl.formatMessage(MESSAGES.tags)}
              defaultValue={rule.tags.join(', ')}
            />
          </FormRow>
          <TorrentDestination
            id="destination"
            label={this.props.intl.formatMessage({
              id: 'feeds.torrent.destination',
              defaultMessage: 'Torrent Destination'
            })}
            suggested={rule.destination}
          />
          <FormRow>
            <FormRowItem width="auto" />
            <Checkbox id="startOnLoad" checked={rule.startOnLoad} matchTextboxHeight>
              <FormattedMessage
                id="feeds.start.on.load"
                defaultMessage="Start on load"
              />
            </Checkbox>
            <Button onClick={() => this.setState({currentlyEditingRule: 'none'})}>
              <FormattedMessage
                id="button.cancel"
                defaultMessage="Cancel"
              />
            </Button>
            <Button type="submit">
              <FormattedMessage
                id="button.save.feed"
                defaultMessage="Save"
              />
            </Button>
          </FormRow>
        </FormRowGroup>
      </li>
    );
  }

  getAddRuleForm() {
    return (
      <li className="interactive-list__item interactive-list__item--stacked-content feed-list__feed" key="new">
        <FormRowGroup>
          <FormRow>
            <Textbox
              id="label"
              label={this.props.intl.formatMessage({
                id: 'feeds.label',
                defaultMessage: 'Label'
              })}
            />
            <Select
              disabled={!this.state.feeds.length}
              id="feedID"
              label={this.props.intl.formatMessage({
                id: 'feeds.applicable.feed',
                defaultMessage: 'Applicable Feed'
              })}
            >
              {this.getAvailableFeedsOptions()}
            </Select>
          </FormRow>
          <FormRow>
            <Textbox
              id="match"
              label={this.props.intl.formatMessage({
                id: 'feeds.match.pattern',
                defaultMessage: 'Match Pattern'
              })}
              placeholder={this.props.intl.formatMessage(MESSAGES.regEx)}
            />
            <Textbox
              id="exclude"
              label={this.props.intl.formatMessage({
                id: 'feeds.exclude.pattern',
                defaultMessage: 'Exclude Pattern'
              })}
              placeholder={this.props.intl.formatMessage(MESSAGES.regEx)}
            />
            <Textbox
              id="tags"
              label={this.props.intl.formatMessage({
                id: 'feeds.apply.tags',
                defaultMessage: 'Apply Tags'
              })}
              placeholder={this.props.intl.formatMessage(MESSAGES.tags)}
            />
          </FormRow>
          <TorrentDestination
            id="destination"
            label={this.props.intl.formatMessage({
              id: 'feeds.torrent.destination',
              defaultMessage: 'Torrent Destination'
            })}
          />
          <FormRow>
            <FormRowItem width="auto" />
            <Checkbox id="startOnLoad" matchTextboxHeight>
              <FormattedMessage
                id="feeds.start.on.load"
                defaultMessage="Start on load"
              />
            </Checkbox>
            <Button onClick={() => this.setState({currentlyEditingRule: 'none'})}>
              <FormattedMessage
                id="button.cancel"
                defaultMessage="Cancel"
              />
            </Button>
            <Button type="submit">
              <FormattedMessage
                id="button.add"
                defaultMessage="Add"
              />
            </Button>
          </FormRow>
        </FormRowGroup>
      </li>
    );
  }

  getRulesListItem(rule){
    const matchedCount = rule.count || 0;
    let excludeNode = null;
    let tags = null;

    if (rule.exclude) {
      excludeNode = (
        <li className="interactive-list__detail-list__item
          interactive-list__detail interactive-list__detail--tertiary">
          <FormattedMessage
            id="feeds.exclude"
            defaultMessage="Exclude"
          /> {rule.exclude}
        </li>
      );
    }

    if (rule.tags && rule.tags.length > 0) {
      const tagNodes = rule.tags.map((tag, index) => {
        return <span className="tag" key={index}>{tag}</span>;
      });

      tags = (
        <li
          className="interactive-list__detail-list__item interactive-list__detail interactive-list__detail--tertiary"
        >
          <FormattedMessage
            id="feeds.tags"
            defaultMessage="Tags"
          /> {tagNodes}
        </li>
      );
    }

    return (
      <li className="interactive-list__item interactive-list__item--stacked-content" key={rule._id}>
        <div className="interactive-list__label">
          <ul className="interactive-list__detail-list">
            <li className="interactive-list__detail-list__item
              interactive-list__detail--primary">
              {rule.label}
            </li>
            <li className="interactive-list__detail-list__item
              interactive-list__detail-list__item--overflow
              interactive-list__detail interactive-list__detail--secondary">
              <FormattedMessage id="feeds.match.count"
                defaultMessage="{count, plural, =1 {# match} other
                  {# matches}}" values={{count: matchedCount}} />
            </li>
          </ul>
          <ul className="interactive-list__detail-list">
            <li className="interactive-list__detail-list__item
              interactive-list__detail interactive-list__detail--tertiary">
              <FormattedMessage
                id="feeds.match"
                defaultMessage="Match"
              /> {rule.match}
            </li>
            {excludeNode}
            {tags}
          </ul>
        </div>
        <span
          className="interactive-list__icon interactive-list__icon--action"
          onClick={() => this.handleModifyRuleClick(rule)}
        >
          <ArrowIcon />
        </span>
        <span
          className="interactive-list__icon interactive-list__icon--action interactive-list__icon--action--warning"
          onClick={() => this.handleRemoveRuleClick(rule)}
        >
          <Close />
        </span>
      </li>
    );
  }

  getRulesList() {
    if (this.state.rules.length === 0 && this.state.currentlyEditingRule === 'none') {
      return (
        <ul className="interactive-list">
          <li className="interactive-list__item">
            <div className="interactive-list__label">
              <FormattedMessage
                id="feeds.no.rules.defined"
                defaultMessage="No rules defined."
              />
            </div>
            <span
            className="interactive-list__icon interactive-list__icon--action"
            onClick={() => this.handleAddRuleClick()}
            >
              <Add/>
            </span>
          </li>
        </ul>
      );
    }

    const rulesList = this.state.rules.map((rule, index) => {
      if (rule._id === this.state.currentlyEditingRule){
        return this.getModifyRuleForm(rule);
      } else {
        return this.getRulesListItem(rule);
      }
    });

    return (
      <ul className="interactive-list">
        {rulesList}
        {(this.state.currentlyEditingRule=== 'new') ? this.getAddRuleForm() :
          <li className="interactive-list__item">
            <div className="interactive-list__label">
            </div>
            <span
            className="interactive-list__icon interactive-list__icon--action"
            onClick={() => this.handleAddRuleClick()}
            >
              <Add />
            </span>
          </li>}
      </ul>
    );
  }

  handleFeedMonitorsFetchSuccess = () => {
    this.setState({
      feeds: FeedMonitorStore.getFeeds(),
      rules: FeedMonitorStore.getRules()
    });
  };

  handleFormChange = ({event, formData}) => {
    this.checkFieldValidity(event.target.name, formData[event.target.name]);
  };

  handleFormSubmit = () => {
    const {errors, isValid} = this.validateForm();
    const formData = this.getAmendedFormData();

    if (!isValid) {
      this.setState({errors});
    } else {
      let currentRule = this.state.currentlyEditingRule;
      if (currentRule !== 'none' && currentRule !== 'new'){
        FeedMonitorStore.removeRule(currentRule);
      }
      FeedMonitorStore.addRule(formData);
      this.formRef.resetForm();
      this.setState({currentlyEditingRule: 'none'})
    }
  };

  handleRemoveRuleClick(rule) {
    FeedMonitorStore.removeRule(rule._id);
  }

  handleAddRuleClick(){
    this.setState({currentlyEditingRule: 'new'})
  }

  handleModifyRuleClick(rule){
    this.setState({currentlyEditingRule: rule._id})
  }

  validateForm() {
    const formData = this.getAmendedFormData();

    const errors = Object.keys(this.validatedFields).reduce(
      (accumulator, fieldName) => {
        const fieldValue = formData[fieldName];

        if (!this.validatedFields[fieldName].isValid(fieldValue)) {
          accumulator[fieldName] = this.validatedFields[fieldName].error;
        }

        return accumulator;
      },
      {}
    );

    return {errors, isValid: !Object.keys(errors).length};
  }

  render() {
    const errors = Object.keys(this.state.errors).map(
      (errorID, index) => {
        return (
          <FormRow key={index}>
            <FormError>
              {this.state.errors[errorID]}
            </FormError>
          </FormRow>
        );
      }
    );

    return (
      <Form
        className="inverse"
        onChange={this.handleFormChange}
        onSubmit={this.handleFormSubmit}
        ref={ref => this.formRef = ref}
      >
        <ModalFormSectionHeader>
          <FormattedMessage
            id="feeds.existing.rules"
            defaultMessage="Existing Rules"
          />
        </ModalFormSectionHeader>
        {errors}
        <FormRow>
          <FormRowItem>
            {this.getRulesList()}
          </FormRowItem>
        </FormRow>
        {/*<ModalFormSectionHeader>
          <FormattedMessage
            id="feeds.add.automatic.download.rule"
            defaultMessage="Add Download Rule"
          />
        </ModalFormSectionHeader>
        {this.getRuleFields()}*/}
      </Form>
    );
  }
}

export default injectIntl(DownloadRulesTab);
