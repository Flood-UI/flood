import {injectIntl} from 'react-intl';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import AboutMarkdownPath from '../../../../../../ABOUT.md';

import SettingsTab from './SettingsTab';

class AboutTab extends SettingsTab {
  constructor(props) {
    super(props);

    this.state = {about: null};
  }

  componentWillMount() {
    fetch(AboutMarkdownPath)
      .then(response => response.text())
      .then(text => {
        this.setState({about: text});
      });
  }

  render() {
    return (
      <div className="content">
        <ReactMarkdown source={this.state.about} />
      </div>
    );
  }
}

export default injectIntl(AboutTab);
