import { useState, useEffect } from 'react';

// Global state for selected POS equipment IDs
let globalSelectedEquipmentIds: number[] = [];
let subscribers: Array<(ids: number[]) => void> = [];

const notifySubscribers = () => {
  subscribers.forEach(callback => callback([...globalSelectedEquipmentIds]));
};

export const useSelectedEquipment = (): [number[], (ids: number[]) => void] => {
  const [localIds, setLocalIds] = useState<number[]>(globalSelectedEquipmentIds);

  useEffect(() => {
    const callback = (newIds: number[]) => setLocalIds(newIds);
    subscribers.push(callback);
    
    return () => {
      subscribers = subscribers.filter(sub => sub !== callback);
    };
  }, []);

  const setGlobalIds = (newIds: number[]) => {
    globalSelectedEquipmentIds = [...newIds];
    notifySubscribers();
  };

  return [localIds, setGlobalIds];
};