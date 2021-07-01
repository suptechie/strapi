import baseModel from '../../../../../../admin/src/components/Users/ModalCreateBody/utils/formDataModel';

const ssoInputsModel = strapi.features.includes('sso')
  ? {
      useSSORegistration: true,
    }
  : {};

const formDataModel = {
  ...baseModel,
  ...ssoInputsModel,
};

export default formDataModel;
