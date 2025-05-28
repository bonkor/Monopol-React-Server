import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InvestmentType, type FieldDefinition, type InvestmentOption, getFieldStateByIndex } from '@shared/fields';
import { Country } from '@shared/fields';
import { type Player, getPlayerById } from '@shared/types';
import { canBuy, canSell, canInvest } from '@shared/game-rules';
import './PropertyInfoPanel.css';
//import { getCountryFlagIcon, getCompanyTypeIcon, getInvestmentIcon, getBuySellIcon, getIncomeIcon } from './icons'; // Предположим, эти функции возвращают нужные SVG-иконки
import clsx from 'clsx';
import { useGameStore } from '../store/useGameStore';
import { sendMessage } from '../services/socket';
import { stringToColor } from '../utils/stringToColor';

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
function getCountryFlagIcon(country) {
  const countryFlagIndexMap: Record<string, number> = {
    USSR: 0,
    USA: 1,
    England: 2,
    Japan: 3,
    Balkan: 4,
    France: 5,
    Germany: 6,
    Hungary: 7,
    Italy: 8,
    Holland: 9,
    Switzerland: 10,
  };
  const index = countryFlagIndexMap[country] ?? 0;
  const reg = `-262px -${117 + index * 19}px`; //
  return (
    <div className="absolute top+[5px] left+[5px] w-5 h-5 bg-flag bg-no-repeat bg-contain" style={{
      backgroundPosition: reg
    }} />
  );
};
function getCompanyTypeIcon(industry) {
  const industryIconIndexMap: Record<string, number> = {
    Avia: 0,
    Studio: 1,
    Oil: 2,
    Electro: 3,
    Newspaper: 4,
    Automotive: 5,
    Media: 6,
    Food: 7,
    Radio: 8,
    Tourism: 9,
    Healthcare: 10,
    Spy: 11,
    Port: 12,
  };
  const index = industryIconIndexMap[industry] ?? 0;
  const reg = `-288px -${1 + index * 25}px`; //
  return (
    <div className="absolute top+[3px] left+[3px] w-5 h-5 bg-ind bg-no-repeat bg-contain" style={{
      backgroundPosition: reg
    }} />
  );
};
function getBuyIcon(disabled: boolean) {
  let reg = `-355px -284px`;
  if (disabled) reg = `-355px -305px`;
  return (
    <div className="absolute top+[3px] left+[3px] w-5 h-5 bg-btn bg-no-repeat bg-contain" style={{
      backgroundPosition: reg
    }} />
  );
};
function getSellIcon() {
  const reg = `-376px -305px`; //
  return (
    <div className="absolute top+[3px] left+[3px] w-5 h-5 bg-btn bg-no-repeat bg-contain" style={{
      backgroundPosition: reg
    }} />
  );
};
function getInvestmentIcon(disabled: boolean) {
  let reg = `-334px -305px`;
  if (disabled) reg = `-334px -284px`;
  return (
    <div className="absolute top+[3px] left+[3px] w-5 h-5 bg-btn bg-no-repeat bg-contain" style={{
      backgroundPosition: reg
    }} />
  );
};
function getIncomeIcon() {
  return 'aaa';
};
/////////////////////////////////////////////////
  const players = useGameStore((state) => state.players);
  const fieldStates = useGameStore((state) => state.fieldStates);
  const lastLocalPlayerId = useGameStore((state) => state.lastLocalPlayerId);
  const fieldState = getFieldStateByIndex(fieldStates, field.index);
  const owner = fieldState.ownerId;

  const canBuyResult = useMemo(() => {
    return lastLocalPlayerId && field.index !== null
      ? canBuy({ playerId: lastLocalPlayerId, fieldIndex: field.index, gameState: fieldStates, players: players })
      : false;
  }, [lastLocalPlayerId, field?.index, fieldStates]);
  const canSellResult = useMemo(() => {
    return lastLocalPlayerId && field.index !== null
      ? canSell({ playerId: lastLocalPlayerId, fieldIndex: field.index, gameState: fieldStates, players: players })
      : false;
  }, [lastLocalPlayerId, field?.index, fieldStates]);
  const canIvnestResult = useMemo(() => {
    return lastLocalPlayerId && field.index !== null
      ? canInvest({ playerId: lastLocalPlayerId, fieldIndex: field.index, gameState: fieldStates, players: players })
      : false;
  }, [lastLocalPlayerId, field?.index, fieldStates]);

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

  const ownerColor = owner ? stringToColor(getPlayerById(players, owner).name) : '#484848';

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
          className="absolute bg-[#c0c0c0] border shadow-lg z-50 w-[220px] p-4"
          style={adjustedPosition}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          {/* Верхняя тройка */}
          <div className="flex justify-between items-center mb-2 gap-1">
            <div className="border w-1/3 h-8 flex items-center justify-center">{getCountryFlagIcon(field.country)}</div>
            <div className="border w-1/3 h-8 flex items-center justify-center font-mono text-sm">{countryKey}</div>
            <div className="border w-1/3 h-8 flex items-center justify-center">{getCompanyTypeIcon(field.industry)}</div>
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
            <div className="border w-1/3 h-8 flex items-center justify-center text-sm">
              {formatCost(firstInvestment.cost, firstInvestment.type)}
            </div>
            <div className="border w-1/3 h-8 flex items-center justify-center text-sm">{multiplier}</div>
            <div className="border w-1/3 h-8 flex items-center justify-center text-sm">{firstInvestment.resultingIncome}</div>
          </div>

          {/* Инвестиции */}
          <div className={clsx(investmentGridClass, 'mb-2 flex justify-center text-center')}>
            {investmentList.map((inv, i) => {
              const costStr = inv.cost === 0
                ? investmentSuffix(inv.type)
                : `${inv.cost}${investmentSuffix(inv.type)}`;
              const incomeStr = inv.type === InvestmentType.Infinite
                ? `+${inv.resultingIncome}`
                : inv.resultingIncome;
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
            <button
              className={clsx(
                'w-1/3 h-8 border rounded flex items-center justify-center transition',
                canIvnestResult ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'
              )}
              onClick={() => {
                sendMessage({ type: 'invest', playerId: lastLocalPlayerId, field: field });
              }}
              disabled={!canIvnestResult}
              title="Инвестировать"
            >
              {getInvestmentIcon(canIvnestResult)}
            </button>
            {! canSellResult && (
              <button
                className={clsx(
                  'w-1/3 h-8 border rounded flex items-center justify-center transition',
                  canBuyResult ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'
                )}
                onClick={() => {
                  sendMessage({ type: 'buy', playerId: lastLocalPlayerId, field: field });
                }}
                disabled={!canBuyResult}
                title="Купить"
              >
                {/*field.ownedByMe ? getSellIcon('sell') : getBuyIcon('buy')*/}
                {getBuyIcon(canBuyResult)}
              </button>
            )}
            {canSellResult && (
              <button
                className={clsx(
                  'w-1/3 h-8 border rounded flex items-center justify-center transition',
                  canSellResult ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'
                )}
                onClick={() => {
                  sendMessage({ type: 'sell', playerId: lastLocalPlayerId, field: field });
                }}
                disabled={!canSellResult}
                title="Продать"
              >
                {getSellIcon(true)}
              </button>
            )}
            <button
              className={clsx(
                'w-1/3 h-8 border rounded flex items-center justify-center transition',
                field.canBuySell ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'
              )}
              disabled={!field.canTakeIncome}
            >
              {getIncomeIcon()}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
