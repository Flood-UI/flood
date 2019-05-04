import React from 'react';

// A utility for connecting to listening & unlistening to Flux stores

// Example usage:
// class MyComponent extends React.Component {
//   render() {
//     const {name, count, time} = this.props;
//     return (
//       <div>
//         {name}, {count}, {time}
//       </div>
//     );
//   }
// }

// const MyConnectedComponent = connectStores(MyComponent, props => {
//   return {
//     count: {
//       store: SettingsStore,
//       event: EventTypes.CLIENT_TORRENT_STATUS_COUNT_CHANGE,
//       getValue: store => store.getCount(),
//     },
//     name: {
//       store: SettingsStore,
//       event: EventTypes.CLIENT_TORRENT_STATUS_COUNT_CHANGE,
//       getValue: store => store.getCount(),
//     },
//     time: {
//       store: SettingsStore,
//       event: EventTypes.CLIENT_TORRENT_STATUS_COUNT_CHANGE,
//       getValue: store => store.getCount(),
//     },
//   };
// });

const connectStores = (Component, getEventListenerDescriptors) => {
  class ConnectedComponent extends React.Component {
    constructor(props) {
      super(props);
      const eventListenerDescriptors = getEventListenerDescriptors(props);
      let initialState = {};

      eventListenerDescriptors.forEach(eventListenerDescriptor => {
        const {store, getValue} = eventListenerDescriptor;
        initialState = {
          ...initialState,
          ...getValue(store, props),
        };
      });

      this.state = initialState;
    }

    componentDidMount() {
      const eventListenerDescriptors = getEventListenerDescriptors(this.props);

      eventListenerDescriptors.forEach(eventListenerDescriptor => {
        const {store, event, getValue} = eventListenerDescriptor;
        const eventHandler = () => {
          this.setState((state, props) => getValue(store, props, state));
        };

        store.listen(event, eventHandler);

        if (this.eventHandlersByStore.get(store) == null) {
          this.eventHandlersByStore.set(store, new Set());
        }

        this.eventHandlersByStore.get(store).add(eventHandler);
      });
    }

    componentWillUnmount() {
      this.eventHandlersByStore.forEach((listener, store) => {
        store.unlisten(listener);
      });

      this.eventHandlersByStore.clear();
    }

    eventHandlersByStore = new Map();

    render() {
      return <Component {...this.props} {...this.state} />;
    }
  }

  return props => <ConnectedComponent {...props} />;
};

export default connectStores;
