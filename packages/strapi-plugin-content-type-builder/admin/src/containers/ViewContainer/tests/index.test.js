import React from 'react';
import { shallow } from 'enzyme';

import ViewContainer from '../index';

const renderCompo = (props = {}) => {
  shallow(<ViewContainer {...props} />);
};

const defaultProps = {
  children: null,
  featureType: 'group',
  handleClickIcon: jest.fn(),
  headerTitle: 'Ingredients',
  headerDescription: 'description',
  match: {
    params: {
      groupName: 'ingredients',
    },
  },
  pluginHeaderActions: [],
};

describe('CTB <ViewContainer />', () => {
  it('should not crash', () => {
    renderCompo(defaultProps);
  });

  it('should use the defaultProps', () => {
    delete defaultProps.onClickIcon;
    renderCompo(defaultProps);

    const {
      defaultProps: { onClickIcon },
    } = ViewContainer;

    expect(onClickIcon).toBeDefined();
    expect(onClickIcon()).toBe(undefined);
  });
});
