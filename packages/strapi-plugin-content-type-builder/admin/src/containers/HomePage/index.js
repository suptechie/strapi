/*
 *
 * HomePage
 *
 */

import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createStructuredSelector } from 'reselect';
import { size } from 'lodash';
import Helmet from 'react-helmet';
import { makeSelectLoading, makeSelectModels } from 'containers/App/selectors';

// Design
import ContentHeader from 'components/ContentHeader';
import EmptyContentTypeView from 'components/EmptyContentTypeView';
import TableList from 'components/TableList';

import selectHomePage from './selectors';
import styles from './styles.scss';

export class HomePage extends React.Component { // eslint-disable-line react/prefer-stateless-function

  handleClick = () => {
    console.log('ici', this.props.homePage);
  }

  renderTableListComponent = () => {
    const availableNumber = size(this.props.models);
    const title = availableNumber > 1 ? 'table.contentType.title.plural'
      : 'table.contentType.title.singular';
    return (
      <TableList
        availableNumber={availableNumber}
        title={title}
        buttonLabel={'button.contentType.add'}
        handleButtonClick={this.handleClick}
        rowItems={this.props.models}
      />
    );
  }


  render() {
    if (this.props.modelsLoading) return <div />;

    const component = size(this.props.models) === 0 ?
      <EmptyContentTypeView handleClick={this.handleClick} />
        : this.renderTableListComponent();

    return (
      <div className={styles.homePage}>
        <Helmet
          title="HomePage"
          meta={[
            { name: 'description', content: 'Description of HomePage' },
          ]}
        />
        <ContentHeader
          name={'home.contentTypeBuilder.name'}
          description={'home.contentTypeBuilder.description'}
          noMargin
        />
        {component}
      </div>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  homePage: selectHomePage(),
  modelsLoading: makeSelectLoading(),
  models: makeSelectModels(),
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {},
    dispatch,
  );
};

HomePage.propTypes =  {
  homePage: React.PropTypes.object.isRequired,
  models: React.PropTypes.oneOfType([
    React.PropTypes.object,
    React.PropTypes.array,
  ]),
  modelsLoading: React.PropTypes.bool,
};

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);
