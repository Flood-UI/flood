import React from 'react';

import EventTypes from '../constants/EventTypes';

interface GenericStore {
  listen: (event: keyof typeof EventTypes, eventHandler: (payload: any) => void) => void;
  unlisten: (event: keyof typeof EventTypes, eventHandler: (payload: any) => void) => void;
}

const connectStores = <DerivedState extends object, WrappedComponentProps extends object = {}>(
  InputComponent: React.JSXElementConstructor<WrappedComponentProps & DerivedState>,
  getEventListenerDescriptors: (
    props: WrappedComponentProps,
  ) => Array<{
    store: GenericStore;
    event: (keyof typeof EventTypes) | Array<keyof typeof EventTypes>;
    getValue: (
      props: {
        payload: any;
        props: WrappedComponentProps;
        state: DerivedState;
        store: GenericStore;
      },
    ) => Partial<DerivedState>;
  }>,
) => {
  class ConnectedComponent extends React.Component<WrappedComponentProps, DerivedState> {
    eventHandlersByStore: Map<
      GenericStore,
      Set<{events: Array<keyof typeof EventTypes>; eventHandler: (payload: any) => void}>
    > = new Map();

    constructor(props: WrappedComponentProps) {
      super(props);
      this.state = getEventListenerDescriptors(props).reduce(
        (state, eventListenerDescriptor) => {
          const {store, getValue} = eventListenerDescriptor;
          return {
            ...state,
            ...getValue({state, props, store, payload: null}),
          };
        },
        {} as DerivedState,
      );
    }

    componentDidMount() {
      const eventListenerDescriptors = getEventListenerDescriptors(this.props);

      eventListenerDescriptors.forEach(eventListenerDescriptor => {
        const {store, event, getValue} = eventListenerDescriptor;
        const eventHandler = (payload: any) =>
          this.setState(
            (state: DerivedState, props: WrappedComponentProps) =>
              getValue({state, props, store, payload}) as DerivedState,
          );
        const events = Array.isArray(event) ? event : [event];

        events.forEach(storeEvent => {
          store.listen(storeEvent, eventHandler);
        });

        if (this.eventHandlersByStore.get(store) == null) {
          const newSet: Set<{
            events: Array<keyof typeof EventTypes>;
            eventHandler: (payload: any) => void;
          }> = new Set();
          this.eventHandlersByStore.set(store, newSet);
        }

        const eventHandlersForStore = this.eventHandlersByStore.get(store);
        if (eventHandlersForStore != null) {
          eventHandlersForStore.add({events, eventHandler});
        }
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

    render() {
      return <InputComponent {...this.props as WrappedComponentProps} {...this.state as DerivedState} />;
    }
  }

  return (props: WrappedComponentProps) => <ConnectedComponent {...props} />;
};

export default connectStores;
