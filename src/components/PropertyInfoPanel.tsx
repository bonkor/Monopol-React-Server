import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InvestmentType, type FieldDefinition, type InvestmentOption, getFieldByIndex, getFieldStateByIndex,
  Country, getNextInvestmentType } from '@shared/fields';
import { type Player, getPlayerById } from '@shared/types';
import { getIncomeMultiplier, isFieldInCompetedMonopoly } from "@shared/monopolies"; // импорт монополий
import { getCurrentIncome, canBuy, canSell, canInvest, canIncome } from '@shared/game-rules';
import './PropertyInfoPanel.css';
//import { getCountryFlagIcon, getCompanyTypeIcon, getInvestmentIcon, getBuySellIcon,
//  getIncomeIcon } from './icons'; // Предположим, эти функции возвращают нужные SVG-иконки
import clsx from 'clsx';
import { useGameStore } from '../store/useGameStore';
import { sendMessage } from '../services/socket';
import { stringToColor } from '../utils/stringToColor';
import { useConfirmation } from '../context/ConfirmationContext';
import { usePropertyPanel } from '../context/PropertyPanelContext';

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
  USA_Ind: 1,
  USA_Int: 2,
  England: 3,
  Japan: 4,
  Balkan: 5,
  France: 6,
  BRD: 7,
  DDR: 8,
  Hungary: 9,
  Italy: 10,
  Holland: 11,
  Switzerland: 12,
  };
  const index = countryFlagIndexMap[country] ?? 0;
  const reg = `-262px -${79 + index * 19}px`; //
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
  let reg = `-334px -284px`;
  if (disabled) reg = `-334px -305px`;
  return (
    <div className="absolute top+[3px] left+[3px] w-5 h-5 bg-btn bg-no-repeat bg-contain" style={{
      backgroundPosition: reg
    }} />
  );
};
function getIncomeIcon(disabled: boolean) {
  let reg = `-313px -284px`;
  if (disabled) reg = `-313px -305px`;
  return (
    <div className="absolute top+[3px] left+[3px] w-5 h-5 bg-btn bg-no-repeat bg-contain" style={{
      backgroundPosition: reg
    }} />
  );
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
  const canIncomeResult = useMemo(() => {
    return lastLocalPlayerId && field.index !== null
      ? canIncome({ playerId: lastLocalPlayerId, fieldIndex: field.index, gameState: fieldStates, players: players })
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

  const multiplier =`x${getIncomeMultiplier(field.index, fieldStates)}`;

  const investmentList = field.investments.slice(1); // без первой (покупки)
  const isTwoColumn = investmentList.length > 3;
  const investmentGridClass = isTwoColumn ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-1';

  const countryKey = Object.entries(Country).find(
    ([_, value]) => value === field.country
  )?.[0].slice(0, 3);

  const sacrificeMode = useGameStore((s) => s.sacrificeMode);
  const { setSacrificeMode } = useGameStore.getState();

  const { openPropertyPanel, closePanel } = usePropertyPanel();
  const buyFirm = () => {
    if (sacrificeMode) {
      setSacrificeMode(null);
    } else {
      if (firstInvestment.type === InvestmentType.Regular) {
        sendMessage({ type: 'buy', playerId: lastLocalPlayerId, field: field });
      } else if (firstInvestment.type === InvestmentType.SacrificeCompany || firstInvestment.type === InvestmentType.SacrificeMonopoly) {
        setSacrificeMode({ targetFieldIndex: field.index, type: firstInvestment.type, buyOrInvest: 'buy' });
        closePanel();
      }
    }
  };

  const investFirm = () => {
    if (sacrificeMode) {
      setSacrificeMode(null);
    } else {
      const investType = getNextInvestmentType({fieldIndex: field.index, gameState: fieldStates});
      if (investType === InvestmentType.Regular || investType === InvestmentType.Infinite) {
        sendMessage({ type: 'invest', playerId: lastLocalPlayerId, field: field });
      } else if (investType === InvestmentType.SacrificeCompany || investType === InvestmentType.SacrificeMonopoly) {
        setSacrificeMode({ targetFieldIndex: field.index, type: investType, buyOrInvest: 'invest' });
        closePanel();
      }
    }
  };

  const { confirm } = useConfirmation();
  const sellFirm = async () => {
    if (sacrificeMode) {
      const target = getFieldByIndex(sacrificeMode?.targetFieldIndex);
      setSacrificeMode(null);
      if (sacrificeMode?.buyOrInvest === 'buy') {
        sendMessage({ type: 'buy', playerId: lastLocalPlayerId, field: target, sacrificeFirmId: field.index });
      } else if (sacrificeMode?.buyOrInvest === 'invest') {
        sendMessage({ type: 'invest', playerId: lastLocalPlayerId, field: target, sacrificeFirmId: field.index });
      }
      // открыть покупаемую/инвестируемую фирму
      openPropertyPanel(sacrificeMode?.targetFieldIndex);
    } else {
      if (!fieldState.investmentLevel) {
        sendMessage({ type: 'sell', playerId: lastLocalPlayerId, field: field });
      } else {
        const confirmed = await confirm(`Продаем ${field.name}? Уже есть вложения`);

        if (confirmed) {
          sendMessage({ type: 'sell', playerId: lastLocalPlayerId, field: field });
        } else {
        }
      }
    }
  };

  const fieldInCompetedMonopoly = isFieldInCompetedMonopoly({fieldIndex: field.index, gameState: fieldStates});
  const isCountryComplete = fieldInCompetedMonopoly.monopolies.find(m => m.group === 'country');
  const isIndustryComplete = fieldInCompetedMonopoly.monopolies.find(m => m.group === 'industry');
  const isComplexComplete = fieldInCompetedMonopoly.monopolies.find(m => m.ids);

  const confirmationPending = useGameStore((s) => s.confirmationPending);

  const disableInvest = confirmationPending || !canIvnestResult ||
    (sacrificeMode && sacrificeMode.targetFieldIndex !== field.index);
  const disableBuy = confirmationPending || !canBuyResult || sacrificeMode && sacrificeMode.targetFieldIndex !== field.index;
  const disableSell = confirmationPending || !canSellResult ||
    (sacrificeMode && sacrificeMode.type === InvestmentType.SacrificeCompany && sacrificeMode.targetFieldIndex === field.index) ||
    (sacrificeMode && sacrificeMode.type === InvestmentType.SacrificeMonopoly && sacrificeMode.targetFieldIndex === field.index &&
    fieldInCompetedMonopoly.monopolies.length > 0);
  const disableIncome = confirmationPending || !canIncomeResult || sacrificeMode;

  const { showMonopolyList, setShowMonopolyList, setSelectedIndex } = useGameStore.getState();

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
            <div
              className={clsx('border w-1/3 h-8 flex items-center justify-center', isCountryComplete ? 'border-4' : '')}
              style={{borderColor: isCountryComplete ? ownerColor : 'black' }}
              onClick={() => {
                closePanel();
                setShowMonopolyList(true);
              }}
            >
              {getCountryFlagIcon(field.country)}
            </div>
            <div
              className={clsx('border w-1/3 h-8 flex items-center justify-center', isComplexComplete ? 'border-4' : '')}
              style={{borderColor: isComplexComplete ? ownerColor : 'black' }}
              onClick={() => {
                closePanel();
                setShowMonopolyList(true);
              }}
            >
              {countryKey}
            </div>
            <div
              className={clsx('border w-1/3 h-8 flex items-center justify-center', isIndustryComplete ? 'border-4' : '')}
              style={{borderColor: isIndustryComplete ? ownerColor : 'black' }}
              onClick={() => {
                closePanel();
                setShowMonopolyList(true);
              }}
            >
              {getCompanyTypeIcon(field.industry)}
            </div>
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
            <div className="border w-1/3 h-8 flex items-center justify-center text-sm">{formatCost(getCurrentIncome({fieldIndex: field.index, gameState: fieldStates}))}</div>
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
                  style={{ color: i < fieldState.investmentLevel ? ownerColor : '#000' }}
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
                !disableInvest ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'
              )}
              onClick={() => {
                investFirm();
              }}
              disabled={disableInvest}
              title="Инвестировать"
            >
              {getInvestmentIcon(!disableInvest)}
            </button>
            {! canSellResult && (
              <button
                className={clsx(
                  'w-1/3 h-8 border rounded flex items-center justify-center transition',
                  !disableBuy ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'
                )}
                onClick={() => {
                  buyFirm();
                }}
                disabled={disableBuy}
                title="Купить"
              >
                {/*field.ownedByMe ? getSellIcon('sell') : getBuyIcon('buy')*/}
                {getBuyIcon(!disableBuy)}
              </button>
            )}
            {canSellResult && (
              <button
                className={clsx(
                  'w-1/3 h-8 border rounded flex items-center justify-center transition',
                  !disableSell ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'
                )}
                onClick={() => {
                  sellFirm();
                }}
                disabled={disableSell}
                title={sacrificeMode ? 'Пожертвовать' : 'Продать' }
              >
                {getSellIcon(true)}
              </button>
            )}
            <button
              className={clsx(
                'w-1/3 h-8 border rounded flex items-center justify-center transition',
                !disableIncome ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'
              )}
              onClick={() => {
                sendMessage({ type: 'income', playerId: lastLocalPlayerId, field: field });
              }}
              disabled={disableIncome}
              title="Получить"
            >
              {getIncomeIcon(!disableIncome)}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
