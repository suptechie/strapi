import React from 'react';
import { shallow } from 'enzyme';

import GroupPage from '../index';

describe('<GroupPage />', () => {
  it('should not crash', () => {
    shallow(<GroupPage />);
  });
});
