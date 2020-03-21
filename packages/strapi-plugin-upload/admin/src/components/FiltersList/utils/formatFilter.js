import moment from 'moment';
import { dateFormats } from 'strapi-helper-plugin';

const dateToUtcTime = date => moment.parseZone(date).utc();

const formatFilter = filterToFormat => {
  const { name, filter, value } = filterToFormat;

  // Mime filter - Display different wording than the received ones
  if (name === 'mime') {
    return {
      ...filterToFormat,
      name: 'type',
      filter: filter === '_contains' ? '=' : '_ne',
    };
  }

  // Format date to readable format
  if (dateToUtcTime(value)._isUTC === true) {
    return {
      ...filterToFormat,
      value: dateToUtcTime(value).format(dateFormats.datetime),
    };
  }

  return filterToFormat;
};

export default formatFilter;
