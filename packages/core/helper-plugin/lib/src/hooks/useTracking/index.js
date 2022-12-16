import { useContext, useRef } from 'react';
import axios from 'axios';
import TrackingContext from '../../contexts/TrackingContext';
import useAppInfos from '../useAppInfos';

const useTracking = () => {
  const trackRef = useRef();
  const { uuid, telemetryProperties, deviceId } = useContext(TrackingContext);
  const appInfo = useAppInfos();
  const userId = appInfo?.userId;

  trackRef.current = async (event, properties) => {
    if (uuid && !window.strapi.telemetryDisabled) {
      try {
        await axios.post(
          'https://analytics.strapi.io/api/v2/track',
          {
            event,
            userId,
            deviceId,
            eventProperties: { ...properties },
            userProperties: {},
            groupProperties: {
              ...telemetryProperties,
              projectId: uuid,
              projectType: window.strapi.projectType,
            },
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } catch (err) {
        // Silent
      }
    }
  };

  return { trackUsage: trackRef.current };
};

export default useTracking;
