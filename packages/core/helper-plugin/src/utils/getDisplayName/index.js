/**
 * Retrivies display name based on user data and with the formatMessage function to show the name if required
 * @typedef AdminUserNamesAttributes
 * @property {string} firstname
 * @property {string} lastname
 * @property {string} username
 * @property {string} email
 *
 * @type {(user: AdminUserNamesAttributes, formatMessage: import('react-intl').formatMessage) => string}
 */
const getDisplayName = ({ firstname, lastname, username, email }, formatMessage) => {
    if (username) {
      return username;
    }
  
    if (firstname) {
      return formatMessage(
        {
          id: 'global.fullname',
          defaultMessage: '{firstname} {lastname}',
        },
        {
          firstname,
          lastname,
        }
      ).trim();
    }
  
    return email;
  };
  
  export { getDisplayName };