import React from 'react';
import PropTypes from 'prop-types';
import useStrapi from '../../hooks/useStrapi';

const InjectionZone = ({ area, ...props }) => {
  const { strapi: globalStrapi } = useStrapi();

  const [plugin, page, position] = area.split('.');
  const cmPlugin = globalStrapi.getPlugin(plugin);
  const compos = cmPlugin.getInjectedComponents(page, position);

  return compos.map(compo => <compo.Component key={compo.name} {...props} />);
};

InjectionZone.propTypes = {
  area: PropTypes.string.isRequired,
};

export default InjectionZone;
