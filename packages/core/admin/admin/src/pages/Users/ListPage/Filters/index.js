import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Button, Box } from '@strapi/parts';
import { FilterIcon } from '@strapi/icons';
import FilterList from './FilterList';
import FilterPicker from './FilterPicker';

const Filters = ({ displayedFilters }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { formatMessage } = useIntl();
  const buttonRef = useRef();

  const handleToggle = () => {
    setIsVisible(prev => !prev);
  };

  return (
    <>
      <Box padding={1}>
        <Button
          variant="tertiary"
          ref={buttonRef}
          startIcon={<FilterIcon />}
          onClick={handleToggle}
          size="S"
        >
          {formatMessage({ id: 'app.utils.filters', defaultMessage: 'Filters' })}
        </Button>
        {isVisible && (
          <FilterPicker
            displayedFilters={displayedFilters}
            isVisible={isVisible}
            onToggle={handleToggle}
            source={buttonRef}
          />
        )}
      </Box>
      <FilterList />
    </>
  );
};

Filters.propTypes = {
  displayedFilters: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      metadatas: PropTypes.shape({ label: PropTypes.string }),
      fieldSchema: PropTypes.shape({ type: PropTypes.string }),
    })
  ).isRequired,
};

export default Filters;
