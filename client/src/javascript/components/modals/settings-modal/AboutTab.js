import React from 'react';
import ReactMarkdown from 'react-markdown';
import AboutMarkdownPath from '../../../../../../ABOUT.md';

import SettingsTab from './SettingsTab';

export default class AboutTab extends SettingsTab {
  state = {
    about: null,
  };

  componentWillMount() {
    fetch(AboutMarkdownPath)
      .then(response => response.text())
      .then(text => {
        this.setState({about: text});
      });
  }

  render() {
    return (
      <ReactMarkdown source={this.state.about} />
    );
  }
}
