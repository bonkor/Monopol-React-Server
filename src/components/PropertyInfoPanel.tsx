import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InvestmentType, FieldType, type FieldDefinition, getFieldByIndex, getFieldStateByIndex,
  Country, getNextInvestmentType } from '@shared/fields';
import { getPlayerById } from '@shared/types';
import { getIncomeMultiplier, isFieldInCompetedMonopoly } from "@shared/monopolies"; // импорт монополий
import { getCurrentIncome, canInvestFree } from '@shared/game-rules';
import './PropertyInfoPanel.css';
//import { getCountryFlagIcon, getCompanyTypeIcon, getInvestmentIcon, getBuySellIcon,
//  getIncomeIcon } from './icons'; // Предположим, эти функции возвращают нужные SVG-иконки
import clsx from 'clsx';
import { useGameStore } from '../store/useGameStore';
import { sendMessage } from '../services/socket';
import { useConfirmation } from '../context/ConfirmationContext';
import { usePropertyPanel } from '../context/PropertyPanelContext';
import { useCellInfoInteractionState } from '../utils/hooks/useCellInfoInteractionState';

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
function getRemInvestmentIcon() {
  let reg = `-334px -263px`;
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
function getGoIcon() {
  let reg = `-355px -263px`;
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

  const interactionInfo = useCellInfoInteractionState(field, fieldState);

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

  const ownerColor = owner ? getPlayerById(players, owner).color : '#484848';

  const firstInvestment = field.investments?.[0];
  const investmentSuffix = (type: InvestmentType) =>
    type === InvestmentType.SacrificeCompany ? '*' : type === InvestmentType.SacrificeMonopoly ? '**' : '';

  const formatCost = (cost: number, type?: InvestmentType) =>
    Number.isInteger(cost) ? `${cost}${investmentSuffix(type!)}` : `${cost?.toFixed(1)}${investmentSuffix(type!)}`;

  const multiplier =`x${getIncomeMultiplier(field.index, fieldStates)}`;

  const investmentList = field.investments?.slice(1); // без первой (покупки)
  const isTwoColumn = investmentList?.length > 3;
  const investmentGridClass = isTwoColumn ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-1';

  const countryKey = Object.entries(Country).find(
    ([_, value]) => value === field.country
  )?.[0].slice(0, 3);

  const sacrificeMode = useGameStore((s) => s.sacrificeMode);
  const { setSacrificeMode } = useGameStore.getState();
  const interactionMode = useGameStore((s) => s.interactionMode);
  const { setInteractionMode } = useGameStore.getState();

  const fieldInCompetedMonopoly = isFieldInCompetedMonopoly({fieldIndex: field.index, gameState: fieldStates});

  const { openPropertyPanel, closePanel } = usePropertyPanel();
  const buyFirm = () => {
    if (sacrificeMode) {
      setSacrificeMode(null);
    } else if (interactionInfo.isTarget) {  // а значит interactionMode.type === 'change'
      if (interactionMode.targetFieldIndex) {
        setInteractionMode({type: 'change', targetFieldIndex: undefined});
      } else {
        setInteractionMode({type: 'change', targetFieldIndex: field.index});
      }
    } else {
      if (firstInvestment?.type === InvestmentType.Regular) {
        sendMessage({ type: 'buy', playerId: lastLocalPlayerId, field: field });
        setInteractionMode({type: 'none'});
      } else if (firstInvestment?.type === InvestmentType.SacrificeCompany || firstInvestment?.type === InvestmentType.SacrificeMonopoly) {
        setSacrificeMode({ targetFieldIndex: field.index, type: firstInvestment?.type, buyOrInvest: 'buy' });
        closePanel();
      }
    }
  };

  const investFirm = () => {
    if (sacrificeMode) {
      setSacrificeMode(null);
    } else {
      if (interactionMode.type === 'needInvestFree') {
        sendMessage({ type: 'invest', playerId: lastLocalPlayerId, field: field });
        setInteractionMode({type: 'none'});
      } else {
        const investType = getNextInvestmentType({fieldIndex: field.index, gameState: fieldStates});
        if (investType === InvestmentType.Regular || investType === InvestmentType.Infinite) {
          sendMessage({ type: 'invest', playerId: lastLocalPlayerId, field: field });
        } else if (investType === InvestmentType.SacrificeCompany || investType === InvestmentType.SacrificeMonopoly) {
          setSacrificeMode({ targetFieldIndex: field.index, type: investType, buyOrInvest: 'invest' });
          closePanel();
        }
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
      setInteractionMode({type: 'none'});
      // открыть покупаемую/инвестируемую фирму
      openPropertyPanel(sacrificeMode?.targetFieldIndex);
    } else if (interactionMode.type === 'loose') {
      setInteractionMode({type: 'none'});
      sendMessage({ type: 'loose', playerId: lastLocalPlayerId, field: field });
    } else if (interactionMode.type === 'sacrificeFromChance') {
      sendMessage({ type: 'sacrifice', playerId: lastLocalPlayerId, field: field });
      setInteractionMode({type: 'none'});
    } else if (interactionMode.type === 'change') {
      const target = getFieldByIndex(interactionMode?.targetFieldIndex);
      sendMessage({ type: 'change', playerId: lastLocalPlayerId, takeField: target, giveFirmId: field.index });
      setInteractionMode({type: 'none'});
      // открыть полученную фирму
      openPropertyPanel(interactionMode?.targetFieldIndex);
    } else {
      if (!fieldState.investmentLevel && firstInvestment.type === InvestmentType.Regular) {
        sendMessage({ type: 'sell', playerId: lastLocalPlayerId, field: field });
        setInteractionMode({type: 'none'});
      } else {
        const reason = firstInvestment.type !== InvestmentType.Regular ? 'Покупалась с жертвой' : 'Уже есть вложения';
        const confirmed = await confirm(`Продаем ${field.name}? ${reason}`);

        if (confirmed) {
          sendMessage({ type: 'sell', playerId: lastLocalPlayerId, field: field });
          setInteractionMode({type: 'none'});
        }
      }
    }
  };

  const isCountryComplete = fieldInCompetedMonopoly.monopolies.find(m => m.group === 'country');
  const isIndustryComplete = fieldInCompetedMonopoly.monopolies.find(m => m.group === 'industry');
  const isComplexComplete = fieldInCompetedMonopoly.monopolies.find(m => m.ids);

  const { showMonopolyList, setShowMonopolyList, setSelectedIndex } = useGameStore.getState();

  return (
    <AnimatePresence onExitComplete={onRequestClose}>
      {visible && (
        <motion.div
          ref={panelRef}
          className="absolute bg-[#c0c0c0] border shadow-lg z-50 w-[220px] p-4 select-none"
          style={adjustedPosition}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          {field.type === FieldType.Firm && (
          <div>
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
              {field.name?.split(' ').map((part, i) => <div key={i}>{part}</div>)}
            </div>

            {/* Нижняя полоска */}
            <div className="w-[90%] h-[5px] mx-auto my-1" style={{ backgroundColor: ownerColor }} />

            {/* Нижняя тройка */}
            <div className="flex justify-between items-center mb-2 gap-1">
              <div className="border w-1/3 h-8 flex items-center justify-center text-sm">
                {formatCost(firstInvestment?.cost, firstInvestment?.type)}
              </div>
              <div className="border w-1/3 h-8 flex items-center justify-center text-sm">{multiplier}</div>
              <div className="border w-1/3 h-8 flex items-center justify-center text-sm">{formatCost(getCurrentIncome({fieldIndex: field.index, gameState: fieldStates}))}</div>
            </div>

            {/* Инвестиции */}
            <div className={clsx(investmentGridClass, 'mb-2 flex justify-center text-center')}>
              {investmentList?.map((inv, i) => {
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
          </div>
          )}
          {field.type !== FieldType.Firm && (
          <div className="w-full h-full mb-5 flex items-center justify-center">
            <div className="icon-wrapper">
              <div className={`sprite sprite-${field.type}`} />
            </div>
          </div>
          )}

          {/* Кнопки */}
          {! interactionInfo.showGo && (
            <div className="flex justify-between gap-1">
              {! interactionInfo.showRemInvest && (
              <button
                className={clsx(
                  'w-1/3 h-8 border rounded flex items-center justify-center transition',
                  !interactionInfo.disableInvest ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'
                )}
                onClick={() => {
                  investFirm();
                }}
                disabled={interactionInfo.disableInvest}
                title="Инвестировать"
              >
                {getInvestmentIcon(!interactionInfo.disableInvest)}
              </button>
              )}
              {interactionInfo.showRemInvest && (
              <button
                className={clsx(
                  'w-1/3 h-8 border rounded flex items-center justify-center transition',
                  'bg-green-500 hover:bg-green-600'
                )}
                onClick={() => {
                  sendMessage({ type: 'rem-invest', playerId: lastLocalPlayerId, field: field });
                  setInteractionMode({type: 'none'});
                }}
                disabled={false}
                title="Снять мезон"
              >
                {getRemInvestmentIcon()}
              </button>
              )}
              {! interactionInfo.showSell && (
                <button
                  className={clsx(
                    'w-1/3 h-8 border rounded flex items-center justify-center transition',
                    !interactionInfo.disableBuy ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'
                  )}
                  onClick={() => {
                    buyFirm();
                  }}
                  disabled={interactionInfo.disableBuy}
                  title={interactionInfo.buyTitle}
                >
                  {getBuyIcon(!interactionInfo.disableBuy)}
                </button>
              )}
              {interactionInfo.showSell && (
                <button
                  className={clsx(
                    'w-1/3 h-8 border rounded flex items-center justify-center transition',
                    !interactionInfo.disableSell ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'
                  )}
                  onClick={() => {
                    sellFirm();
                  }}
                  disabled={interactionInfo.disableSell}
                  title={interactionInfo.sellTitle}
                >
                  {getSellIcon(true)}
                </button>
              )}
              <button
                className={clsx(
                  'w-1/3 h-8 border rounded flex items-center justify-center transition',
                  !interactionInfo.disableIncome ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'
                )}
                onClick={() => {
                  sendMessage({ type: 'income', playerId: lastLocalPlayerId, field: field });
                }}
                disabled={interactionInfo.disableIncome}
                title="Получить"
              >
                {getIncomeIcon(!interactionInfo.disableIncome)}
              </button>
            </div>
          )}
          {interactionInfo.showGo && (
            <div className="flex justify-between gap-1">
              <button
                className={clsx(
                  'w-full h-8 border rounded flex items-center justify-center transition',
                  'bg-green-500 hover:bg-green-600'
                )}
                onClick={() => {
                  closePanel();
                  sendMessage({ type: 'go', playerId: lastLocalPlayerId, position: field.index });
                  setInteractionMode({type: 'none'});
                }}
                disabled={false}
                title="Перейти"
              >
                {getGoIcon()}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
