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
//   return [
//     {
//       store: CountStore,
//       event: [EventTypes.NAME_CHANGE, EventTypes.COUNT_CHANGE, EventTypes.TIME_CHANGE],
//       getValue: ({store}) => {
//         return {
//           count: store.getCount(),
//           name: store.getName(),
//           time: store.getTime()
//         };
//       },
//     },
//   ];
// });

const connectStores = (Component, getEventListenerDescriptors) => {
  class ConnectedComponent extends React.Component {
    constructor(props) {
      super(props);
      this.state = getEventListenerDescriptors(props).reduce((state, eventListenerDescriptor) => {
        const {store, getValue} = eventListenerDescriptor;
        return {
          ...state,
          ...getValue({state, props, store, payload: null}),
        };
      }, {});
    }

    componentDidMount() {
      const eventListenerDescriptors = getEventListenerDescriptors(this.props);

      eventListenerDescriptors.forEach(eventListenerDescriptor => {
        const {store, event, getValue} = eventListenerDescriptor;
        const eventHandler = payload => this.setState((state, props) => getValue({state, props, store, payload}));
        const events = Array.isArray(event) ? event : [event];

        events.forEach(storeEvent => {
          store.listen(storeEvent, eventHandler);
        });

        if (this.eventHandlersByStore.get(store) == null) {
          this.eventHandlersByStore.set(store, new Set());
        }

        this.eventHandlersByStore.get(store).add({
          events,
          eventHandler,
        });
      });
    }

    componentWillUnmount() {
      this.eventHandlersByStore.forEach((listenerDescriptors, store) => {
        listenerDescriptors.forEach(({events, eventHandler}) => {
          events.forEach(event => {
            store.unlisten(event, eventHandler);
          });
        });
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
