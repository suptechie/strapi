import * as React from 'react';

import { Typography, Badge, Flex, Loader, useNotifyAT } from '@strapi/design-system';
import { Menu } from '@strapi/design-system/v2';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import { useGetRelationsQuery } from '../../../../services/relations';
import { getTranslation } from '../../../../utils/translations';

import { CellValue } from './CellValue';

import type { CellContentProps } from './CellContent';
import type { Data } from '@strapi/types';

/* -------------------------------------------------------------------------------------------------
 * RelationSingle
 * -----------------------------------------------------------------------------------------------*/

interface RelationSingleProps extends Pick<CellContentProps, 'mainField' | 'content'> {}

/**
 * TODO: fix this component – tracking issue https://strapi-inc.atlassian.net/browse/CONTENT-2184
 */
const RelationSingle = ({ mainField, content }: RelationSingleProps) => {
  return null;
  // return (
  //   <TypographyMaxWidth textColor="neutral800" ellipsis>
  //     <CellValue
  //       // integer is default because that's what the id will be.
  //       type={metadatas.mainField?.type ?? 'integer'}
  //       value={metadatas.mainField?.name ? content[metadatas.mainField?.name] : content.id}
  //     />
  //   </TypographyMaxWidth>
  // );
};

const TypographyMaxWidth = styled(Typography)`
  max-width: 500px;
`;

/* -------------------------------------------------------------------------------------------------
 * RelationMultiple
 * -----------------------------------------------------------------------------------------------*/

interface RelationMultipleProps extends Pick<CellContentProps, 'mainField' | 'name' | 'content'> {
  entityId: Data.ID;
  uid: string;
}

/**
 * TODO: fix this component – tracking issue https://strapi-inc.atlassian.net/browse/CONTENT-2184
 */
const RelationMultiple = ({ mainField, name, entityId, content, uid }: RelationMultipleProps) => {
  return null;

  // const { formatMessage } = useIntl();
  // const { notifyStatus } = useNotifyAT();
  // const [isOpen, setIsOpen] = React.useState(false);

  // const [fieldName] = name.split('.');

  // const { data, isLoading } = useGetRelationsQuery(
  //   {
  //     model: uid,
  //     id: entityId.toString(),
  //     targetField: fieldName,
  //   },
  //   {
  //     skip: !isOpen,
  //     refetchOnMountOrArgChange: true,
  //   }
  // );

  // React.useEffect(() => {
  //   if (data) {
  //     notifyStatus(
  //       formatMessage({
  //         id: getTranslation('DynamicTable.relation-loaded'),
  //         defaultMessage: 'Relations have been loaded',
  //       })
  //     );
  //   }
  // }, [data, formatMessage, notifyStatus]);

  // return (
  //   <Menu.Root onOpenChange={(isOpen) => setIsOpen(isOpen)}>
  //     <MenuTrigger onClick={(e) => e.stopPropagation()}>
  //       <Flex gap={1} wrap="nowrap">
  //         <Badge>{content.count}</Badge>
  //         {formatMessage(
  //           {
  //             id: 'content-manager.containers.list.items',
  //             defaultMessage: '{number, plural, =0 {items} one {item} other {items}}',
  //           },
  //           { number: content.count }
  //         )}
  //       </Flex>
  //     </MenuTrigger>
  //     <Menu.Content>
  //       {isLoading && (
  //         <Menu.Item disabled>
  //           <Loader small>
  //             {formatMessage({
  //               id: getTranslation('ListViewTable.relation-loading'),
  //               defaultMessage: 'Relations are loading',
  //             })}
  //           </Loader>
  //         </Menu.Item>
  //       )}

  //       {data?.results && (
  //         <>
  //           {data.results.map((entry) => (
  //             <Menu.Item key={entry.id} disabled>
  //               <TypographyMaxWidth ellipsis>
  //                 <CellValue
  //                   type={metadatas.mainField?.type ?? 'integer'}
  //                   // @ts-expect-error – can't use a string to index the RelationResult object.
  //                   value={metadatas.mainField?.name ? entry[metadatas.mainField.name] : entry.id}
  //                 />
  //               </TypographyMaxWidth>
  //             </Menu.Item>
  //           ))}

  //           {data?.pagination && data?.pagination.total > 10 && (
  //             <Menu.Item
  //               aria-disabled
  //               aria-label={formatMessage({
  //                 id: getTranslation('ListViewTable.relation-more'),
  //                 defaultMessage: 'This relation contains more entities than displayed',
  //               })}
  //             >
  //               <Typography>…</Typography>
  //             </Menu.Item>
  //           )}
  //         </>
  //       )}
  //     </Menu.Content>
  //   </Menu.Root>
  // );
};

/**
 * TODO: this needs to be solved in the Design-System
 */
// const MenuTrigger = styled(Menu.Trigger)`
//   svg {
//     width: ${6 / 16}rem;
//     height: ${4 / 16}rem;
//   }
// `;

export { RelationSingle, RelationMultiple };
export type { RelationSingleProps, RelationMultipleProps };
