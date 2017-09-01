/**
*
* TableListRow
*
*/

import React from 'react';
import { startCase } from 'lodash';
import { FormattedMessage } from 'react-intl';
import PopUpWarning from 'components/PopUpWarning';
import styles from 'components/TableList/styles.scss';
import { router } from 'app';
/* eslint-disable jsx-a11y/no-static-element-interactions */

class TableListRow extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);
    this.state = {
      showWarning: false,
    };
  }
  edit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`plugins/content-type-builder/#edit${this.props.rowItem.name}::contentType::baseSettings`);
  }

  delete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.props.handleDelete(this.props.rowItem.name)
    this.setState({ showWarning: false });
  }

  goTo = () => {
    router.push(`/plugins/content-type-builder/models/${this.props.rowItem.name}`);
  }

  toggleModalWarning = () => {
    this.setState({ showWarning: !this.state.showWarning });
  }

  showModalWarning = (e) => {
    e.stopPropagation();
    this.setState({ showWarning: !this.state.showWarning });
  }

  render() {
    const temporary = this.props.rowItem.isTemporary ? <FormattedMessage id={'contentType.temporaryDisplay'} /> : '';
    return (
      <li>
        <div className={`${styles.liInnerContainer} row`} onClick={this.goTo} role="button">
          <div className="col-md-1"><i className={`fa ${this.props.rowItem.icon}`} /></div>
          <div className={`col-md-3 ${styles.italic}`}>{startCase(this.props.rowItem.name)} {temporary}</div>
          <div className="col-md-5 text-center">{this.props.rowItem.description}</div>
          <div className="col-md-2 text-center">{this.props.rowItem.fields}</div>
          <div className="col-md-1">
            <div className={styles.icContainer}>
              <div>
                <i className="fa fa-pencil" onClick={this.edit} role="button" />
              </div>
              <div>
                <i className="fa fa-trash" onClick={this.showModalWarning} role="button" />
              </div>
            </div>
          </div>
        </div>
        <PopUpWarning
          isOpen={this.state.showWarning}
          toggleModal={this.toggleModalWarning}
          bodyMessage={'popUpWarning.bodyMessage.contentType.delete'}
          popUpWarningType={'danger'}
          handleConfirm={this.delete}
        />
      </li>
    );
  }
}

TableListRow.propTypes = {
  handleDelete: React.PropTypes.func,
  rowItem: React.PropTypes.object.isRequired,
};

export default TableListRow;
