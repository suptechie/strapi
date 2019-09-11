import React from 'react';
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
// import App from './containers/App';
import App from './containers/Main';
import Initializer from './containers/Initializer';
import lifecycles from './lifecycles';
import trads from './translations';

const pluginDescription = pluginPkg.strapi.description || pluginPkg.description;

function Comp(props) {
  return <App {...props} />;
}

const plugin = {
  blockerComponent: null,
  blockerComponentProps: {},
  description: pluginDescription,
  icon: pluginPkg.strapi.icon,
  id: pluginId,
  initializer: Initializer,
  injectedComponents: [],
  layout: null,
  lifecycles,
  leftMenuLinks: [],
  leftMenuSections: [],
  mainComponent: Comp,
  name: pluginPkg.strapi.name,
  preventComponentRendering: false,
  // suffixUrl: () => {
  //   console.log('lll');
  //   return '/application';
  // },
  suffixUrl: () => '/ctm-configurations/models',
  suffixUrlToReplaceForLeftMenuHighlight: '/models',
  trads,
};

export default plugin;
