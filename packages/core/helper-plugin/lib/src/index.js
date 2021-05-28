import { getType, getOtherInfos } from './content-manager/utils/getAttributeInfos';
// Assets
export { default as colors } from './assets/styles/colors';
export { default as sizes } from './assets/styles/sizes';

// Components
export { default as BackHeader } from './components/BackHeader';
export { default as BaselineAlignment } from './components/BaselineAlignment';
export { default as BlockerComponent } from './components/BlockerComponent';
export { default as Button } from './components/Button';
export { default as ButtonModal } from './components/ButtonModal';
export { default as Carret } from './components/Carret';
export { default as CircleButton } from './components/CircleButton';
export { default as ContainerFluid } from './components/ContainerFluid';
export { default as ErrorBoundary } from './components/ErrorBoundary';
export { default as ErrorFallback } from './components/ErrorFallback';
export { default as FilterButton } from './components/FilterButton';
export { default as GlobalPagination } from './components/GlobalPagination';
export { default as HeaderNav } from './components/HeaderNav';
export { default as HeaderModal } from './components/HeaderModal';
export { default as HeaderModalTitle } from './components/HeaderModalTitle';
export { default as HeaderSearch } from './components/HeaderSearch';
export { default as IcoContainer } from './components/IcoContainer';
export { default as InputAddon } from './components/InputAddon';
export { default as EmptyState } from './components/EmptyState';
export * from './components/Tabs';
export * from './components/Select';

export { default as DropdownIndicator } from './components/Select/DropdownIndicator';
export * from './components/InjectionZone';

export { default as InputAddonWithErrors } from './components/InputAddonWithErrors';
export { default as InputCheckbox } from './components/InputCheckbox';
export { default as InputCheckboxWithErrors } from './components/InputCheckboxWithErrors';
export { default as InputDescription } from './components/InputDescription';
export { default as InputEmail } from './components/InputEmail';
export { default as InputEmailWithErrors } from './components/InputEmailWithErrors';
export { default as InputErrors } from './components/InputErrors';
export { default as InputNumber } from './components/InputNumber';
export { default as InputNumberWithErrors } from './components/InputNumberWithErrors';
export { default as InputPassword } from './components/InputPassword';
export { default as InputPasswordWithErrors } from './components/InputPasswordWithErrors';
export { default as InputSearch } from './components/InputSearch';
export { default as InputSearchWithErrors } from './components/InputSearchWithErrors';
export { default as InputSelect } from './components/InputSelect';
export { default as InputSelectWithErrors } from './components/InputSelectWithErrors';
export { default as InputsIndex } from './components/InputsIndex';
export { default as InputSpacer } from './components/InputSpacer';
export { default as InputText } from './components/InputText';
export { default as InputTextWithErrors } from './components/InputTextWithErrors';
export { default as InputTextArea } from './components/InputTextArea';
export { default as InputTextAreaWithErrors } from './components/InputTextAreaWithErrors';
export { default as InputToggle } from './components/InputToggle';
export { default as InputToggleWithErrors } from './components/InputToggleWithErrors';

export { default as Label } from './components/Label';
export { default as LabelIconWrapper } from './components/LabelIconWrapper';
export { default as LeftMenu } from './components/LeftMenu';
export { default as LeftMenuList } from './components/LeftMenuList';
export { default as LiLink } from './components/LiLink';
export { default as List } from './components/List';
export { default as ListButton } from './components/ListButton';
export { default as ListRow } from './components/ListRow';
export { default as ListWrapper } from './components/ListWrapper';
export { default as ListHeader } from './components/ListHeader';
export { default as ListTitle } from './components/ListTitle';

export { default as LoadingBar } from './components/LoadingBar';
export { default as LoadingIndicator } from './components/LoadingIndicator';
export { default as LoadingIndicatorPage } from './components/LoadingIndicatorPage';

export { default as ModalConfirm } from './components/ModalConfirm';
export { default as Modal } from './components/Modal';
export { default as ModalBody } from './components/BodyModal';
export { default as ModalHeader } from './components/ModalHeader';
export { default as ModalFooter } from './components/FooterModal';
export { default as ModalForm } from './components/FormModal';
export { default as ModalSection } from './components/ModalSection';
export { default as NotAllowedInput } from './components/NotAllowedInput';
export { default as NotFound } from './components/NotFound';

export { default as PageFooter } from './components/PageFooter';
export { default as PluginHeader } from './components/PluginHeader';
export { default as RelationDPState } from './components/RelationDPState';
export { default as PopUpWarning } from './components/PopUpWarning';
export { default as Row } from './components/Row';
export { default as SearchInfo } from './components/SearchInfo';
export { default as SelectNav } from './components/SelectNav';
export { default as SelectWrapper } from './components/SelectWrapper';

export { default as ViewContainer } from './components/ViewContainer';
export { default as CheckPagePermissions } from './components/CheckPagePermissions';
export { default as CheckPermissions } from './components/CheckPermissions';
export { default as SettingsPageTitle } from './components/SettingsPageTitle';
export { default as FormBloc } from './components/FormBloc';
export { default as IntlInput } from './components/IntlInput';
export { default as SizedInput } from './components/SizedInput';

export * from './components/Permissions';

// PopUpWarning
export { default as PopUpWarningBody } from './components/PopUpWarning/Body';
export { default as PopUpWarningFooter } from './components/PopUpWarning/StyledFooter';
export { default as PopUpWarningHeader } from './components/PopUpWarning/Header';
export { default as PopUpWarningIcon } from './components/PopUpWarning/Icon';
export { default as PopUpWarningModal } from './components/PopUpWarning/StyledModal';

// Contexts
export { default as AppInfosContext } from './contexts/AppInfosContext';
export { default as AutoReloadOverlayBockerContext } from './contexts/AutoReloadOverlayBockerContext';
export { default as NotificationsContext } from './contexts/NotificationsContext';
export { default as OverlayBlockerContext } from './contexts/OverlayBlockerContext';
export { default as ContentManagerEditViewDataManagerContext } from './contexts/ContentManagerEditViewDataManagerContext';
export { default as RBACProviderContext } from './contexts/RBACProviderContext';
export { default as TrackingContext } from './contexts/TrackingContext';
// TODO Remove this context
export { default as AppMenuContext } from './contexts/AppMenuContext';

// Hooks
export { default as useAppInfos } from './hooks/useAppInfos';
export { default as useContentManagerEditViewDataManager } from './hooks/useContentManagerEditViewDataManager';
export { default as useQuery } from './hooks/useQuery';
export { default as useLibrary } from './hooks/useLibrary';
export { default as useNotification } from './hooks/useNotification';
export { default as useStrapiApp } from './hooks/useStrapiApp';
export { default as useTracking } from './hooks/useTracking';
// TODO remove this hook
export { default as useAppMenu } from './hooks/useAppMenu';

export { default as useQueryParams } from './hooks/useQueryParams';
export { default as useOverlayBlocker } from './hooks/useOverlayBlocker';
export { default as useAutoReloadOverlayBlocker } from './hooks/useAutoReloadOverlayBlocker';
export { default as useRBACProvider } from './hooks/useRBACProvider';
export { default as useRBAC } from './hooks/useRBAC';

// Providers
export { default as LibraryProvider } from './providers/LibraryProvider';
export { default as NotificationsProvider } from './providers/NotificationsProvider';
export { default as StrapiAppProvider } from './providers/StrapiAppProvider';

// Utils
export { default as auth } from './utils/auth';
export { default as cleanData } from './utils/cleanData';
export { default as difference } from './utils/difference';
export { default as contentManagementUtilRemoveFieldsFromData } from './content-manager/utils/contentManagementUtilRemoveFieldsFromData';
export { default as dateFormats } from './utils/dateFormats';
export { default as dateToUtcTime } from './utils/dateToUtcTime';
export { default as formatComponentData } from './content-manager/utils/formatComponentData';
export { default as hasPermissions } from './utils/hasPermissions';
export { findMatchingPermissions } from './utils/hasPermissions';
export { default as translatedErrors } from './utils/translatedErrors';
export { darken } from './utils/colors';
export { default as getFileExtension } from './utils/getFileExtension';
export { default as getFilterType } from './utils/getFilterType';
export { default as getQueryParameters } from './utils/getQueryParameters';
export { default as validateInput } from './utils/inputsValidations';
export { default as request } from './utils/request';
export { default as storeData } from './utils/storeData';
export { default as templateObject } from './utils/templateObject';
export { getType };
export { getOtherInfos };
export { default as getYupInnerErrors } from './utils/getYupInnerErrors';
export { default as generateFiltersFromSearch } from './utils/generateFiltersFromSearch';
export { default as generateSearchFromFilters } from './utils/generateSearchFromFilters';
export { default as generateSearchFromObject } from './utils/generateSearchFromObject';
export { default as prefixFileUrlWithBackendUrl } from './utils/prefixFileUrlWithBackendUrl';

// SVGS
export { default as LayoutIcon } from './svgs/Layout';
export { default as ClearIcon } from './svgs/Clear';
export { default as Close } from './svgs/Close';
export { default as EyeSlashed } from './svgs/EyeSlashed';
export { default as FilterIcon } from './svgs/Filter';
export { default as SearchIcon } from './svgs/Search';
