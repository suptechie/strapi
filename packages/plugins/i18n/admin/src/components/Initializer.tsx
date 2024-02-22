import * as React from 'react';

import { pluginId } from '../pluginId';

type InitializerProps = {
  setPlugin: (plugin: string) => void;
};

const Initializer = ({ setPlugin }: InitializerProps) => {
  const setPluginRef = React.useRef(setPlugin);

  React.useEffect(() => {
    setPluginRef.current(pluginId);
  }, []);

  return null;
};

export { Initializer };
