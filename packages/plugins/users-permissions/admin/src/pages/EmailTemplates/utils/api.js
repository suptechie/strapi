import { axiosInstance, getRequestURL } from '../../../utils';

const fetchData = async () => {
  console.warn(
    'Deprecation warning: Usage of "axiosInstance" utility is deprecated. This is discouraged and will be removed in the next major release. Please use instead the useFetchClient hook inside the helper plugin and its function getClient'
  );
  const { data } = await axiosInstance.get(getRequestURL('email-templates'));

  return data;
};

const putEmailTemplate = (body) => {
  console.warn(
    'Deprecation warning: Usage of "axiosInstance" utility is deprecated. This is discouraged and will be removed in the next major release. Please use instead the useFetchClient hook inside the helper plugin and its function putClient'
  );

  return axiosInstance.put(getRequestURL('email-templates'), body);
};

export { fetchData, putEmailTemplate };
