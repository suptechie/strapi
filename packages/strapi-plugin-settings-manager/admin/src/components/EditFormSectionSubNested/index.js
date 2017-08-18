/**
*
* EditFormSectionSubNested
*
*/

import React from 'react';
import { map } from 'lodash';
import WithFormSection from 'components/WithFormSection';

class EditFormSectionSubNested extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    return (
      <div className={`${this.props.styles.padded} ${this.props.styles.subNestedFormContainer}`}>
        <div className="row">
          {map(this.props.section, (item, key) => (
            this.props.renderInput(item, key)
          ))}
        </div>
      </div>

    );
  }
}

EditFormSectionSubNested.propTypes = {
  renderInput: React.PropTypes.func.isRequired,
  section: React.PropTypes.oneOfType([
    React.PropTypes.array.isRequired,
    React.PropTypes.object.isRequired,
  ]).isRequired,
  styles: React.PropTypes.object.isRequired,
};

export default WithFormSection(EditFormSectionSubNested); // eslint-disable-line new-cap
