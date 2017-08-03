/**
*
* WithFormSection
*
*/

import React from 'react';
import { forEach, has, isObject } from 'lodash';

import InputNumber from 'components/InputNumber';
import InputText from 'components/InputText';
import InputToggle from 'components/InputToggle';
import InputSelect from 'components/InputSelect';
import InputEnum from 'components/InputEnum';
import config from './config.json';
import styles from './styles.scss';


const WithFormSection = (InnerComponent) => class extends React.Component {
  static propTypes = {
    handleChange: React.PropTypes.func.isRequired,
    section: React.PropTypes.oneOfType([
      React.PropTypes.object,
      React.PropTypes.array,
    ]),
    values: React.PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.state = {
      hasNestedInput: false,
      showNestedForm: false,
      inputWithNestedForm: '',
    };

    this.inputs = {
      string: InputText,
      number: InputNumber,
      boolean: InputToggle,
      enum: InputEnum,
      select: InputSelect,
    };
  }

  componentDidMount() {
    // check if there is inside a section an input that requires nested input to display it on the entire line
    if (isObject(this.props.section)) {
      this.checkForNestedForm(this.props);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.section !== this.props.section) {
      this.setState({ showNestedForm: false, hasNestedInput: false, inputWithNestedForm: '' });
      if (isObject(nextProps.section)) {
        this.checkForNestedForm(nextProps);
      }
    }
  }

  checkForNestedForm(props) {
    forEach(props.section.items, (input) => {
      if(has(input, 'items')) {
        this.setState({ hasNestedInput: true, inputWithNestedForm: input.target })

        if (props.values[input.target]) {
          this.setState({ showNestedForm: true });
        }
      }
    });
  }

  handleChange = ({ target }) => {
    // display nestedForm if the selected input has a nested form
    if (target.name === this.state.inputWithNestedForm) {
      this.setState({ showNestedForm: target.value });
    }

    this.props.handleChange({ target });
  }

  renderInput = (props, key) => {
    const Input = this.inputs[props.type];
    const inputValue = this.props.values[props.target];
    // retrieve options for the select input
    const selectOptions = props.type === 'enum' || props.type === 'select' ? props.items : [];

    // check if the input has a nested form so it is displayed on the entire line
    const customBootstrapClass = this.state.hasNestedInput ?
      // bootstrap class to make the input displayed on the entire line
      'col-md-6 offset-md-6 pull-md-6' :
      // if the input hasn't a nested form but the config requires him to be displayed differently
      config[props.target] || '';

    // custom handleChange props for nested input form
    const handleChange = this.state.hasNestedInput ? this.handleChange :  this.props.handleChange;

    return (
      <Input
        customBootstrapClass={customBootstrapClass}
        key={key}
        handleChange={handleChange}
        name={props.name}
        target={props.target}
        isChecked={inputValue}
        selectOptions={selectOptions}
        validations={props.validations}
        value={inputValue}
      />
    );
  }

  render() {
    return (
      <InnerComponent
        {...this.props}
        showNestedForm={this.state.showNestedForm}
        renderInput={this.renderInput}
        styles={styles}
      />
    );
  }
}

export default WithFormSection;
