import React, { memo } from 'react';
import { Tab, TabGroup, TabPanel, TabPanels, Tabs } from '@strapi/design-system/Tabs';
import { useIntl } from 'react-intl';
import ContentTypesSection from '../ContenTypesSection';
import { useApiTokenPermissionsContext } from '../../../../../../../contexts/ApiTokenPermissions';
import TAB_LABELS from './utils/tabLabels';

const Permissions = () => {
  const {
    value: { modifiedData },
  } = useApiTokenPermissionsContext();
  const { formatMessage } = useIntl();

  return (
    <TabGroup
      id="tabs"
      label={formatMessage({
        id: 'Settings.permissions.users.tabs.label',
        defaultMessage: 'Tabs Permissions',
      })}
    >
      <Tabs>
        {TAB_LABELS.map(tabLabel => (
          <Tab key={tabLabel.id}>
            {formatMessage({ id: tabLabel.labelId, defaultMessage: tabLabel.defaultMessage })}
          </Tab>
        ))}
      </Tabs>
      <TabPanels style={{ position: 'relative' }}>
        <TabPanel>
          <ContentTypesSection section={modifiedData?.collectionTypes} name="collectionTypes" />
        </TabPanel>
        <TabPanel>
          <ContentTypesSection section={modifiedData?.singleTypes} name="singleTypes" />
        </TabPanel>
      </TabPanels>
    </TabGroup>
  );
};

export default memo(Permissions);
