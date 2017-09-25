/**
*
* EditFormSectionNested
*
*/

import React from 'react';
import { has, map, forEach } from 'lodash';

// HOC
import EditFormSectionSubNested from 'components/EditFormSectionSubNested';
import WithFormSection from 'components/WithFormSection';

class EditFormSectionNested extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);
    this.state = {
      hasNestedInput: false,
      showNestedForm: false,
      inputWithNestedForm: '',
    };
  }
  componentDidMount() {
    // check if there is inside a section an input that requires nested input to display it on the entire line
    // TODO add logic in withform section HOC
    if (this.props.section) {
      this.checkForNestedForm(this.props);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.values) {
      this.checkForNestedForm(nextProps);
    }
  }

  checkForNestedForm(props) {
    forEach(props.section, (input) => {
      if (input.type === 'enum') {
        forEach(input.items, (item) => {
          if (has(item, 'items')) {
            this.setState({ hasNestedInput: true, inputWithNestedForm: input.target, section: item.items });

            if (props.values[input.target] === item.value) {
              this.setState({ showNestedForm: true });
            } else {
              this.setState({ showNestedForm: false });
            }
          }
        });
      }
    });
  }

  render() {
    return (
      <div className={`${this.props.styles.padded} ${this.props.styles.nesTedFormContainer}`}>
        <div className="row">
          {map(this.props.section, (item, key) => {
            if (this.state.showNestedForm) {

              return (
                <div key={key} style={{width: '100%'}}>
                  {this.props.renderInput(item, key)}
                  <EditFormSectionSubNested
                    section={this.state.section}
                    values={this.props.values}
                    handleChange={this.props.handleChange}
                    formErrors={this.props.formErrors}
                  />
                </div>
              )
            }

            return this.props.renderInput(item, key)
          })}
        </div>
      </div>
    );
  }
}

EditFormSectionNested.propTypes = {
  formErrors: React.PropTypes.array.isRequired,
  handleChange: React.PropTypes.func.isRequired,
  renderInput: React.PropTypes.func.isRequired,
  section: React.PropTypes.oneOfType([
    React.PropTypes.array.isRequired,
    React.PropTypes.object.isRequired,
  ]).isRequired,
  styles: React.PropTypes.object.isRequired,
  value: React.PropTypes.object.isRequired,
  values: React.PropTypes.object.isRequired,
};

export default WithFormSection(EditFormSectionNested); // eslint-disable-line new-cap
