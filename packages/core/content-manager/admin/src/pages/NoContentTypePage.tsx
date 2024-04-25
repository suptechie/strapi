import { Page } from '@strapi/admin/strapi-admin';
import { ContentLayout, EmptyStateLayout, HeaderLayout, LinkButton } from '@strapi/design-system';
import { Plus } from '@strapi/icons';
import { EmptyDocuments } from '@strapi/icons/symbols';
import { useIntl } from 'react-intl';
import { NavLink } from 'react-router-dom';

import { getTranslation } from '../utils/translations';

const NoContentType = () => {
  const { formatMessage } = useIntl();

  return (
    <Page.Main>
      <HeaderLayout
        title={formatMessage({
          id: getTranslation('header.name'),
          defaultMessage: 'Content',
        })}
      />
      <ContentLayout>
        <EmptyStateLayout
          action={
            <LinkButton
              as={NavLink}
              variant="secondary"
              startIcon={<Plus />}
              // @ts-expect-error – DS inference does not work with the `as` prop.
              to="/plugins/content-type-builder/content-types/create-content-type"
            >
              {formatMessage({
                id: 'app.components.HomePage.create',
                defaultMessage: 'Create your first Content-type',
              })}
            </LinkButton>
          }
          content={formatMessage({
            id: 'content-manager.pages.NoContentType.text',
            defaultMessage:
              "You don't have any content yet, we recommend you to create your first Content-Type.",
          })}
          hasRadius
          icon={<EmptyDocuments width="16rem" />}
          shadow="tableShadow"
        />
      </ContentLayout>
    </Page.Main>
  );
};

export { NoContentType };
