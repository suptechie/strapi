import { Box, Flex, Grid, GridItem, Typography } from '@strapi/design-system';
import { Link } from '@strapi/helper-plugin';
import { Cog } from '@strapi/icons';
import get from 'lodash/get';
import { useIntl } from 'react-intl';

import { getTranslation } from '../../../utils/translations';
import { useLayoutDnd } from '../hooks/useLayoutDnd';

interface ComponentFieldListProps {
  componentUid: string;
}

const ComponentFieldList = ({ componentUid }: ComponentFieldListProps) => {
  const { componentLayouts } = useLayoutDnd();
  const { formatMessage } = useIntl();
  const componentData = get(componentLayouts, [componentUid]);
  const componentLayout = get(componentData, ['layouts', 'edit']);

  return (
    <Box padding={3}>
      {componentLayout.map((row, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <Grid gap={4} key={index}>
          {row.map((rowContent) => (
            <GridItem key={rowContent.name} col={rowContent.size}>
              <Box paddingTop={2}>
                <Flex
                  alignItems="center"
                  background="neutral0"
                  paddingLeft={3}
                  paddingRight={3}
                  height={`${32 / 16}rem`}
                  hasRadius
                  borderColor="neutral200"
                >
                  <Typography textColor="neutral800">{rowContent.name}</Typography>
                </Flex>
              </Box>
            </GridItem>
          ))}
        </Grid>
      ))}
      <Box paddingTop={2}>
        <Link
          startIcon={<Cog />}
          to={`/content-manager/components/${componentUid}/configurations/edit`}
        >
          {formatMessage({
            id: getTranslation('components.FieldItem.linkToComponentLayout'),
            defaultMessage: "Set the component's layout",
          })}
        </Link>
      </Box>
    </Box>
  );
};

export { ComponentFieldList };
