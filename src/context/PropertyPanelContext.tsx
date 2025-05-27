import React, { createContext, useContext, useState, useCallback } from 'react';

interface PropertyPanelContextType {
  selectedIndex: number | null;
  openPropertyPanel: (index: number) => void;
  closePanel: () => void;
}

const PropertyPanelContext = createContext<PropertyPanelContextType | undefined>(undefined);

export const usePropertyPanel = () => {
  const context = useContext(PropertyPanelContext);
  if (!context) throw new Error('usePropertyPanel must be used within PropertyPanelProvider');
  return context;
};

export const PropertyPanelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openPropertyPanel = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const closePanel = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  return (
    <PropertyPanelContext.Provider value={{ selectedIndex, openPropertyPanel, closePanel }}>
      {children}
    </PropertyPanelContext.Provider>
  );
};
