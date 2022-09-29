import { useContext, useRef } from 'react';
import axios from 'axios';
import TrackingContext from '../../contexts/TrackingContext';
import useAppInfos from '../useAppInfos';

const useTracking = () => {
  const trackRef = useRef();
  const { uuid, telemetryProperties, deviceId } = useContext(TrackingContext);
  const appInfo = useAppInfos();
  const adminUserId = appInfo?.adminUserId;

  trackRef.current = (event, properties) => {
    if (uuid) {
      try {
        axios.post(
          'https://analytics.strapi.io/api/v2/track',
          {
            event,
            adminUserId,
            deviceId,
            eventProperties: { ...properties },
            userProperties: {},
            groupProperties: { ...telemetryProperties, projectId: uuid },
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
