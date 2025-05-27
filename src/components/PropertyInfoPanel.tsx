import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InvestmentType, type FieldDefinition, type InvestmentOption } from '@shared/fields';
import { Country } from '@shared/fields';
//import { getCountryFlagIcon, getCompanyTypeIcon, getInvestmentIcon, getBuySellIcon, getIncomeIcon } from './icons'; // Предположим, эти функции возвращают нужные SVG-иконки
import clsx from 'clsx';

export function PropertyInfoPanel({
  field,
  x,
  y,
  onRequestClose,
}: {
  field: FieldDefinition;
  x: number;
  y: number;
  onRequestClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ top: y + 10, left: x + 10 });
  const [visible, setVisible] = useState(true);

///////////////////////// временно ////////////////////
function getCountryFlagIcon() {
  return 'aaa';
};
function getCompanyTypeIcon() {
  return 'aaa';
};
function getInvestmentIcon() {
  return 'aaa';
};
function getBuySellIcon() {
  return 'aaa';
};
function getIncomeIcon() {
  return 'aaa';
};
/////////////////////////////////////////////////


  useEffect(() => {
    const panel = panelRef.current;
    if (panel) {
      const { innerWidth, innerHeight } = window;
      const rect = panel.getBoundingClientRect();
      const newLeft = x + rect.width + 20 > innerWidth ? x - rect.width - 10 : x + 10;
      const newTop = y + rect.height + 20 > innerHeight ? y - rect.height - 10 : y + 10;
      setAdjustedPosition({ left: newLeft, top: newTop });
    }
  }, [x, y, field]);

  useEffect(() => {
    const handleClickOutside = () => setVisible(false);
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && setVisible(false);
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const ownerColor = field.ownerColor || '#333';

  const firstInvestment = field.investments[0];
  const investmentSuffix = (type: InvestmentType) =>
    type === InvestmentType.SacrificeCompany ? '*' : type === InvestmentType.SacrificeMonopoly ? '**' : '';

  const formatCost = (cost: number, type?: InvestmentType) =>
    Number.isInteger(cost) ? `${cost}${investmentSuffix(type!)}` : `${cost.toFixed(1)}${investmentSuffix(type!)}`;

  const multiplier =
    (true ? 'x1' : field.monopolyCount === 0 ? 'x1' :
      field.monopolyCount === 1 ? 'x2' :
      field.monopolyCount === 2 ? 'x4' : `x${2 ** field.monopolyCount}`);

  const investmentList = field.investments.slice(1); // без первой (покупки)
  const isTwoColumn = investmentList.length > 3;
  const investmentGridClass = isTwoColumn ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-1';
  const countryKey = Object.entries(Country).find(
    ([_, value]) => value === field.country
  )?.[0];

  return (
    <AnimatePresence onExitComplete={onRequestClose}>
      {visible && (
        <motion.div
          ref={panelRef}
          className="absolute bg-white border shadow-lg z-50 w-[320px] p-4"
          style={adjustedPosition}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          {/* Верхняя тройка */}
          <div className="flex justify-between items-center mb-2 gap-1">
            <div className="border w-1/3 h-12 flex items-center justify-center">{getCountryFlagIcon(field.country)}</div>
            <div className="border w-1/3 h-12 flex items-center justify-center font-mono text-sm">{countryKey}</div>
            <div className="border w-1/3 h-12 flex items-center justify-center">{getCompanyTypeIcon(field.type)}</div>
          </div>

          {/* Верхняя полоска */}
          <div className="w-[90%] h-[5px] mx-auto mb-1" style={{ backgroundColor: ownerColor }} />

          {/* Название */}
          <div className="text-center text-lg font-bold leading-tight mb-1 break-words">
            {field.name.split(' ').map((part, i) => <div key={i}>{part}</div>)}
          </div>

          {/* Нижняя полоска */}
          <div className="w-[90%] h-[5px] mx-auto my-1" style={{ backgroundColor: ownerColor }} />

          {/* Нижняя тройка */}
          <div className="flex justify-between items-center mb-2 gap-1">
            <div className="border w-1/3 h-12 flex items-center justify-center text-sm">
              {formatCost(firstInvestment.cost, firstInvestment.type)}
            </div>
            <div className="border w-1/3 h-12 flex items-center justify-center text-sm">{multiplier}</div>
            <div className="border w-1/3 h-12 flex items-center justify-center text-sm">{firstInvestment.resultingIncome}</div>
          </div>

          {/* Инвестиции */}
          <div className={clsx(investmentGridClass, 'mb-2')}>
            {investmentList.map((inv, i) => {
              const costStr = inv.cost === 0
                ? investmentSuffix(inv.type)
                : `${inv.cost}${investmentSuffix(inv.type)}`;
              const incomeStr = inv.type === InvestmentType.Infinite ? `+${inv.resultingIncome}` : inv.resultingIncome;
              return (
                <div
                  key={i}
                  className="text-sm"
                  style={{ color: inv.done ? ownerColor : '#000' }}
                >
                  {costStr} - {incomeStr}
                </div>
              );
            })}
          </div>

          {/* Кнопки */}
          <div className="flex justify-between gap-1">
            <button className="border w-1/3 h-12 flex items-center justify-center" disabled={!field.canInvest}>
              {getInvestmentIcon()}
            </button>
            <button className="border w-1/3 h-12 flex items-center justify-center" disabled={!field.canBuySell}>
              {field.ownedByMe ? getBuySellIcon('sell') : getBuySellIcon('buy')}
            </button>
            <button className="border w-1/3 h-12 flex items-center justify-center" disabled={!field.canTakeIncome}>
              {getIncomeIcon()}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
