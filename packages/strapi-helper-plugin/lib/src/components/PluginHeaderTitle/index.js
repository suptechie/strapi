/**
*
* PluginHeaderTitle
*
*/

import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { isFunction, isObject } from 'lodash';

import styles from './styles.scss';

function PluginHeaderTitle({ description, title }) {
  const contentTitle = formatData(title);
  const contentDescription = formatData(description);

  return (
    <div>
      <h1 className={styles.pluginHeaderTitleName}>
        {contentTitle}
      </h1>
      <p className={styles.pluginHeaderTitleDescription}>
        {contentDescription}&nbsp;
      </p>
    </div>
  );
}

const formatData = (data) => {
  if (isObject(data) && data.id) {
    return <FormattedMessage id={data.id} defaultMessage={data.id} values={data.values} />;
  }

  if (isFunction(data)) {
    return data();
  }

  return data;
}


PluginHeaderTitle.defaultProps = {
  description: '',
  title: '',
};

PluginHeaderTitle.propTypes = {
  description: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.shape({
      id: PropTypes.string,
      values: PropTypes.object,
    }),
  ]),
  title: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.shape({
      id: PropTypes.string,
      values: PropTypes.object,
    }),
  ]),
};

export default PluginHeaderTitle;
