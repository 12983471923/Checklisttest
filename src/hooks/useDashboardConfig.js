import { useEffect, useState } from 'react';
import {
  subscribeDashboardConfig,
  normalizeDashboardConfig,
  isWidgetVisible,
  getVisibleTabIds,
} from '../firebase/dashboardConfig';

export function useDashboardConfig() {
  const [config, setConfig] = useState(() => normalizeDashboardConfig(null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeDashboardConfig((data) => {
      setConfig(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return {
    config,
    loading,
    hotelInfo: config.hotelInfo,
    receptionWidgets: config.reception.widgets,
    hskWidgets: config.hsk.widgets,
    floatingHskTabs: config.floatingHsk.tabs,
    isReceptionWidgetVisible: (id) => isWidgetVisible(config.reception.widgets, id),
    isHskWidgetVisible: (id) => isWidgetVisible(config.hsk.widgets, id),
    visibleFloatingTabs: getVisibleTabIds(config.floatingHsk.tabs),
  };
}
