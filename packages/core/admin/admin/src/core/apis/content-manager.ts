/* eslint-disable check-file/filename-naming-convention */
/**
 * This file can be removed when the content-manager is moved back to it's own plugin,
 * we would just add the APIs that plugin and continue to alias their methods on the
 * main StrapiApp class.
 */

import { ReviewWorkflowsPanel } from '../../../../ee/admin/src/content-manager/pages/EditView/components/ReviewWorkflowsPanel';
import { HistoryAction } from '../../content-manager/history/components/HistoryAction';
import {
  DEFAULT_ACTIONS,
  type DocumentActionDescription,
} from '../../content-manager/pages/EditView/components/DocumentActions';
import {
  DEFAULT_HEADER_ACTIONS,
  type HeaderActionDescription,
} from '../../content-manager/pages/EditView/components/Header';
import {
  ActionsPanel,
  type PanelDescription,
} from '../../content-manager/pages/EditView/components/Panels';
import {
  DEFAULT_BULK_ACTIONS,
  type BulkActionDescription,
} from '../../content-manager/pages/ListView/components/BulkActions/Actions';
import { DEFAULT_TABLE_ROW_ACTIONS } from '../../content-manager/pages/ListView/components/TableActions';

import type { PluginConfig } from './Plugin';
import type { DescriptionComponent } from '../../components/DescriptionComponentRenderer';
import type { Document } from '../../content-manager/hooks/useDocument';
import type { Contracts } from '@strapi/plugin-content-manager/_internal/shared';

/* -------------------------------------------------------------------------------------------------
 * Configuration Types
 * -----------------------------------------------------------------------------------------------*/

type DescriptionReducer<Config extends object> = (prev: Config[]) => Config[];

interface EditViewContext {
  /**
   * This will ONLY be null, if the content-type
   * does not have draft & published enabled.
   */
  activeTab: 'draft' | 'published' | null;
  /**
   * Will be either 'single-types' | 'collection-types'
   */
  collectionType: string;
  /**
   * this will be undefined if someone is creating an entry.
   */
  document?: Document;
  /**
   * this will be undefined if someone is creating an entry.
   */
  documentId?: string;
  /**
   * this will be undefined if someone is creating an entry.
   */
  meta?: Contracts.CollectionTypes.DocumentMetadata;
  /**
   * The current content-type's model.
   */
  model: string;
}

interface ListViewContext {
  /**
   * Will be either 'single-types' | 'collection-types'
   */
  collectionType: string;
  /**
   * TODO: add comment
   */
  documentIds: string[];
  /**
   * The current content-type's model.
   */
  model: string;
}

interface PanelComponentProps extends EditViewContext {}

interface PanelComponent extends DescriptionComponent<PanelComponentProps, PanelDescription> {
  /**
   * The defaults are added by Strapi only, if you're providing your own component,
   * you do not need to provide this.
   */
  type?: 'actions' | 'review-workflows' | 'releases';
}

interface DocumentActionProps extends EditViewContext {}

interface DocumentActionComponent
  extends DescriptionComponent<DocumentActionProps, DocumentActionDescription> {
  type?:
    | 'clone'
    | 'configure-the-view'
    | 'delete'
    | 'discard'
    | 'edit'
    | 'edit-the-model'
    | 'history'
    | 'publish'
    | 'unpublish'
    | 'update';
}

interface HeaderActionProps extends EditViewContext {}

interface HeaderActionComponent
  extends DescriptionComponent<HeaderActionProps, HeaderActionDescription> {}

interface BulkActionComponentProps extends ListViewContext {}

interface BulkActionComponent
  extends DescriptionComponent<BulkActionComponentProps, BulkActionDescription> {
  actionType?: 'delete' | 'publish' | 'unpublish';
}

/* -------------------------------------------------------------------------------------------------
 * ContentManager plugin
 * -----------------------------------------------------------------------------------------------*/

class ContentManagerPlugin {
  /**
   * The following properties are the stored ones provided by any plugins registering with
   * the content-manager. The function calls however, need to be called at runtime in the
   * application, so instead we collate them and run them later with the complete list incl.
   * ones already registered & the context of the view.
   */
  bulkActions: BulkActionComponent[] = [...DEFAULT_BULK_ACTIONS];
  documentActions: DocumentActionComponent[] = [
    ...DEFAULT_ACTIONS,
    ...DEFAULT_TABLE_ROW_ACTIONS,
    ...DEFAULT_HEADER_ACTIONS,
    HistoryAction,
  ];
  editViewSidePanels: PanelComponent[] = [ActionsPanel, ReviewWorkflowsPanel];
  headerActions: HeaderActionComponent[] = [];

  constructor() {}

  addEditViewSidePanel(panels: DescriptionReducer<PanelComponent>): void;
  addEditViewSidePanel(panels: PanelComponent[]): void;
  addEditViewSidePanel(panels: DescriptionReducer<PanelComponent> | PanelComponent[]) {
    if (Array.isArray(panels)) {
      this.editViewSidePanels = [...this.editViewSidePanels, ...panels];
    } else if (typeof panels === 'function') {
      this.editViewSidePanels = panels(this.editViewSidePanels);
    } else {
      throw new Error(
        `Expected the \`panels\` passed to \`addEditViewSidePanel\` to be an array or a function, but received ${getPrintableType(
          panels
        )}`
      );
    }
  }

  addDocumentAction(actions: DescriptionReducer<DocumentActionComponent>): void;
  addDocumentAction(actions: DocumentActionComponent[]): void;
  addDocumentAction(
    actions: DescriptionReducer<DocumentActionComponent> | DocumentActionComponent[]
  ) {
    if (Array.isArray(actions)) {
      this.documentActions = [...this.documentActions, ...actions];
    } else if (typeof actions === 'function') {
      this.documentActions = actions(this.documentActions);
    } else {
      throw new Error(
        `Expected the \`actions\` passed to \`addDocumentAction\` to be an array or a function, but received ${getPrintableType(
          actions
        )}`
      );
    }
  }

  addDocumentHeaderAction(actions: DescriptionReducer<HeaderActionComponent>): void;
  addDocumentHeaderAction(actions: HeaderActionComponent[]): void;
  addDocumentHeaderAction(
    actions: DescriptionReducer<HeaderActionComponent> | HeaderActionComponent[]
  ) {
    if (Array.isArray(actions)) {
      this.headerActions = [...this.headerActions, ...actions];
    } else if (typeof actions === 'function') {
      this.headerActions = actions(this.headerActions);
    } else {
      throw new Error(
        `Expected the \`actions\` passed to \`addBulkAction\` to be an array or a function, but received ${getPrintableType(
          actions
        )}`
      );
    }
  }

  addBulkAction(actions: DescriptionReducer<BulkActionComponent>): void;
  addBulkAction(actions: BulkActionComponent[]): void;
  addBulkAction(actions: DescriptionReducer<BulkActionComponent> | BulkActionComponent[]) {
    if (Array.isArray(actions)) {
      this.bulkActions = [...this.bulkActions, ...actions];
    } else if (typeof actions === 'function') {
      this.bulkActions = actions(this.bulkActions);
    } else {
      throw new Error(
        `Expected the \`actions\` passed to \`addBulkAction\` to be an array or a function, but received ${getPrintableType(
          actions
        )}`
      );
    }
  }

  get config() {
    return {
      id: 'content-manager',
      name: 'Content Manager',
      apis: {
        addDocumentAction: this.addDocumentAction.bind(this),
        addDocumentHeaderAction: this.addDocumentHeaderAction.bind(this),
        addEditViewSidePanel: this.addEditViewSidePanel.bind(this),
        getDocumentActions: () => this.documentActions,
        getHeaderActions: () => this.headerActions,
        getEditViewSidePanels: () => this.editViewSidePanels,
        addBulkAction: this.addBulkAction.bind(this),
        getBulkActions: () => this.bulkActions,
      },
    } satisfies PluginConfig;
  }
}

/* -------------------------------------------------------------------------------------------------
 * getPrintableType
 * -----------------------------------------------------------------------------------------------*/

/**
 * @internal
 * @description Gets the human-friendly printable type name for the given value, for instance it will yield
 * `array` instead of `object`, as the native `typeof` operator would do.
 */
const getPrintableType = (value: unknown): string => {
  const nativeType = typeof value;

  if (nativeType === 'object') {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Object && value.constructor.name !== 'Object') {
      return value.constructor.name;
    }
  }

  return nativeType;
};

export { ContentManagerPlugin };
export type {
  EditViewContext,
  ListViewContext,
  BulkActionComponent,
  BulkActionComponentProps,
  BulkActionDescription,
  DescriptionComponent,
  DescriptionReducer,
  PanelComponentProps,
  PanelComponent,
  PanelDescription,
  DocumentActionComponent,
  DocumentActionDescription,
  DocumentActionProps,
  HeaderActionComponent,
  HeaderActionDescription,
  HeaderActionProps,
};
