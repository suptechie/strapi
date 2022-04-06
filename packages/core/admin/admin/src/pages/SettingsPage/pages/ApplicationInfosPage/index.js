import React, { useRef, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  useAppInfos,
  SettingsPageTitle,
  useFocusWhenNavigate,
  CheckPermissions,
} from '@strapi/helper-plugin';
import { HeaderLayout, Layout, ContentLayout } from '@strapi/design-system/Layout';
import { Main } from '@strapi/design-system/Main';
import { Box } from '@strapi/design-system/Box';
import { Grid, GridItem } from '@strapi/design-system/Grid';
import { Typography } from '@strapi/design-system/Typography';
import { Stack } from '@strapi/design-system/Stack';
import { Link } from '@strapi/design-system/Link';
import { Button } from '@strapi/design-system/Button';
import ExternalLink from '@strapi/icons/ExternalLink';
import Check from '@strapi/icons/Check';
import Form from './components/Form';
import LogoAPI from './temp/LogoAPI';

const API = new LogoAPI();

const permissions = [{ action: 'admin::project-settings.update', subject: null }];

const ApplicationInfosPage = () => {
  const inputsRef = useRef();
  const { formatMessage } = useIntl();
  useFocusWhenNavigate();
  const appInfos = useAppInfos();
  const { shouldUpdateStrapi, latestStrapiReleaseTag, strapiVersion } = appInfos;
  const [modifiedData, setModifiedData] = useState({ menuLogo: undefined });

  const currentPlan = appInfos.communityEdition
    ? 'app.components.UpgradePlanModal.text-ce'
    : 'app.components.UpgradePlanModal.text-ee';

  const handleSubmit = () => {
    const data = inputsRef.current.getValues();
    API.setProjectSettings(data);
  };

  useEffect(() => {
    const projectSettingsStored = API.getProjectSettings();
    const { menuLogo } = projectSettingsStored;

    setModifiedData(prev => ({ ...prev, menuLogo }));
  }, []);

  return (
    <Layout>
      <SettingsPageTitle name="Application" />
      <Main>
        <HeaderLayout
          title={formatMessage({ id: 'Settings.application.title', defaultMessage: 'Overview' })}
          subtitle={formatMessage({
            id: 'Settings.application.description',
            defaultMessage: 'Administration panel’s global information',
          })}
          primaryAction={
            <Button onClick={handleSubmit} startIcon={<Check />}>
              Save
            </Button>
          }
        />
        <ContentLayout>
          <Stack spacing={6}>
            <Box
              hasRadius
              background="neutral0"
              shadow="tableShadow"
              paddingTop={7}
              paddingBottom={7}
              paddingRight={6}
              paddingLeft={6}
            >
              <Stack spacing={5}>
                <Typography variant="delta" as="h3">
                  {formatMessage({
                    id: 'global.details',
                    defaultMessage: 'Details',
                  })}
                </Typography>

                <Grid paddingTop={1}>
                  <GridItem col={6} s={12}>
                    <Typography variant="sigma" textColor="neutral600">
                      {formatMessage({
                        id: 'Settings.application.strapiVersion',
                        defaultMessage: 'strapi version',
                      })}
                    </Typography>
                    <Typography as="p">v{strapiVersion}</Typography>
                    <Link
                      href={
                        appInfos.communityEdition
                          ? 'https://discord.strapi.io'
                          : 'https://support.strapi.io/support/home'
                      }
                      endIcon={<ExternalLink />}
                    >
                      {formatMessage({
                        id: 'Settings.application.get-help',
                        defaultMessage: 'Get help',
                      })}
                    </Link>
                  </GridItem>
                  <GridItem col={6} s={12}>
                    <Typography variant="sigma" textColor="neutral600">
                      {formatMessage({
                        id: 'Settings.application.edition-title',
                        defaultMessage: 'current plan',
                      })}
                    </Typography>
                    <Typography as="p">
                      {formatMessage({
                        id: currentPlan,
                        defaultMessage: `${
                          appInfos.communityEdition ? 'Community Edition' : 'Enterprise Edition'
                        }`,
                      })}
                    </Typography>
                  </GridItem>
                </Grid>

                <Grid paddingTop={1}>
                  <GridItem col={6} s={12}>
                    {shouldUpdateStrapi && (
                      <Link
                        href={`https://github.com/strapi/strapi/releases/tag/${latestStrapiReleaseTag}`}
                        endIcon={<ExternalLink />}
                      >
                        {formatMessage({
                          id: 'Settings.application.link-upgrade',
                          defaultMessage: 'Upgrade your admin panel',
                        })}
                      </Link>
                    )}
                  </GridItem>
                  <GridItem col={6} s={12}>
                    <Link href="https://strapi.io/pricing-self-hosted" endIcon={<ExternalLink />}>
                      {formatMessage({
                        id: 'Settings.application.link-pricing',
                        defaultMessage: 'See all pricing plans',
                      })}
                    </Link>
                  </GridItem>
                </Grid>

                <Box paddingTop={1}>
                  <Typography variant="sigma" textColor="neutral600">
                    {formatMessage({
                      id: 'Settings.application.node-version',
                      defaultMessage: 'node version',
                    })}
                  </Typography>
                  <Typography as="p">{appInfos.nodeVersion}</Typography>
                </Box>
              </Stack>
            </Box>
            <CheckPermissions permissions={permissions}>
              <Form ref={inputsRef} projectSettingsStored={modifiedData} />
            </CheckPermissions>
          </Stack>
        </ContentLayout>
      </Main>
    </Layout>
  );
};

export default ApplicationInfosPage;
