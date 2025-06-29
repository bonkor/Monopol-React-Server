import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InvestmentType, FieldType, type FieldDefinition, getFieldByIndex, getFieldStateByIndex,
  Country, getNextInvestmentType, type Money, moneyToString } from '@shared/fields';
import { getPlayerById } from '@shared/types';
import { getIncomeMultiplier, isFieldInCompetedMonopoly } from "@shared/monopolies"; // импорт монополий
import { getCurrentIncome } from '@shared/game-rules';
import { getFieldsIcon } from './GameCell';
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

  function getBuyIcon(disabled: boolean) {
    if (disabled) return (
      <svg
        className="w-full h-full p-0.5"
        viewBox="0 0 20 20"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 18V14H8V9H17V18H0Z" fill="black"/>
        <path d="M1 17V15H9V10H16V17H1Z" fill="white" stroke="black" stroke-width="0.2"/>
        <path d="M10 13V11H11V13H10Z" fill="black"/>
        <path d="M10 16V14H11V16H10Z" fill="black"/>
        <path d="M12 13V11H13V13H12Z" fill="black"/>
        <path d="M12 16V14H13V16H12Z" fill="black"/>
        <path d="M14 13V11H15V13H14Z" fill="black"/>
        <path d="M14 16V14H15V16H14Z" fill="black"/>
        <path d="M3 14H2V3H4V4H3V14Z" fill="#BF0000"/>
        <path d="M6 14H5V5H7V6H6V14Z" fill="#BF0000"/>
        <path d="M4 4H3V14H4V4Z" fill="#800000"/>
        <path d="M7 6H6V14H7V6Z" fill="#800000"/>
        <path d="M3 3V2H4V1H14V2H18V3H20V7H19V8H15V7H12V6H8V5H6V4H8V3H3Z" fill="#484848"/>
      </svg>
    );
    else return (
      <svg
        className="w-full h-full p-0.5"
        viewBox="0 0 20 20"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 15H4V3H8V6H12V7H15V8H19V7H20V8H19V9H18V19H0V15Z" fill="white"/>
        <path d="M7 6V15H1V17H7V18H0V14H3V4H4V14H6V6H7Z" fill="#484848"/>
        <path d="M7 15V14H8V9H17V18H7V17H16V10H9V15H7Z" fill="#484848"/>
        <path d="M10 13V11H11V13H10Z" fill="#484848"/>
        <path d="M10 16V14H11V16H10Z" fill="#484848"/>
        <path d="M12 13V11H13V13H12Z" fill="#484848"/>
        <path d="M12 16V14H13V16H12Z" fill="#484848"/>
        <path d="M14 13V11H15V13H14Z" fill="#484848"/>
        <path d="M14 16V14H15V16H14Z" fill="#484848"/>
        <path d="M2 17V16H11V17H2Z" fill="#C6C6C6"/>
        <path d="M12 17V16H13V17H12Z" fill="#C6C6C6"/>
        <path d="M14 17V16H15V17H14Z" fill="#C6C6C6"/>
        <path d="M11 15V14H12V15H11Z" fill="#C6C6C6"/>
        <path d="M13 15V14H14V15H13Z" fill="#C6C6C6"/>
        <path d="M15 15V14H16V15H15Z" fill="#C6C6C6"/>
        <path d="M11 12V11H12V12H11Z" fill="#C6C6C6"/>
        <path d="M13 12V11H14V12H13Z" fill="#C6C6C6"/>
        <path d="M15 12V11H16V12H15Z" fill="#C6C6C6"/>
        <path d="M10 14V13H11V14H10Z" fill="#C5C5C5"/>
        <path d="M12 14V13H13V14H12Z" fill="#C5C5C5"/>
        <path d="M14 14V13H15V14H14Z" fill="#C5C5C5"/>
        <path d="M4 3V4H3V14H2V3H4Z" fill="#8D5C5C"/>
        <path d="M5 14V5H7V6H6V14H5Z" fill="#8D5C5C"/>
        <path d="M8 9V7H12V8H15V9H8Z" fill="#F5F5F5"/>
        <path d="M5 5V4H6V5H5Z" fill="#C0C0C0"/>
        <path d="M3 3V2H4V1H14V2H18V3H20V7H19V8H15V7H12V6H8V5H6V4H8V3H3Z" fill="#808080"/>
      </svg>
    );
  };
  function getSellIcon() {
    return (
      <svg
        className="w-full h-full p-0.5"
        viewBox="0 0 20 20"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M1 17V15H4V17H1Z" fill="white"/>
        <path d="M8 17V15H9V13H11V11H12V10H16V17H8Z" fill="white"/>
        <path d="M6 14V15H1V17H4V18H0V14H6Z" fill="#808080"/>
        <path d="M7 18V17H16V18H7Z" fill="#808080"/>
        <path d="M10 16V14H11V16H10Z" fill="#808080"/>
        <path d="M12 16V15H13V16H12Z" fill="#808080"/>
        <path d="M12 13V11H13V13H12Z" fill="#808080"/>
        <path d="M14 13V11H15V13H14Z" fill="#808080"/>
        <path d="M17 15H16V10H13V9H17V15Z" fill="#808080"/>
        <path d="M17 8V7H18V6H19V5H20V7H19V8H17Z" fill="#808080"/>
        <path d="M19 4V3H20V4H19Z" fill="#808080"/>
        <path d="M18 3V2H14V1H4V2H5V3H8V4H7V5H8V6H13V5H14V4H16V3H18Z" fill="#808080"/>
        <path d="M3 3H2V14H3V3Z" fill="#8D5C5C"/>
        <path d="M6 6H5V14H6V6Z" fill="#8D5C5C"/>
        <path d="M4 4H3V14H4V4Z" fill="#8F3030"/>
        <path d="M7 8H6V14H7V8Z" fill="#8F3030"/>
        <path d="M3 4V2H5V3H6V4H7V6H8V8H9V9H11V8H12V7H13V6H15V5H16V4H19V5H18V6H17V7H16V8H14V9H13V10H12V11H11V12H12V13H14V14H16V15H18V16H19V18H16V17H15V16H13V15H12V14H11V13H9V15H8V17H7V19H4V15H6V14H7V12H8V9H7V8H6V6H5V5H4V4H3Z" fill="#FF0000"/>
      </svg>
    );
  };
  function getInvestmentIcon(disabled: boolean) {
    if (disabled) return (
      <svg
        className="w-full h-full p-0.5"
        viewBox="0 0 20 20"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M2 11V10H5V5H6V11H2Z" fill="#2020FF"/>
        <path d="M2 10V9H5V10H2Z" fill="#6020FF"/>
        <path d="M2 9V7H4V6H2V5H5V9H2Z" fill="#0060FF"/>
        <path d="M2 7V6H4V7H2Z" fill="#2080FF"/>
        <path d="M6 9V7H7V6H8V7H7V9H6Z" fill="#C08040"/>
        <path d="M6 7V6H7V5H9V4H13V5H15V7H13V5H9V6H7V7H6Z" fill="#FF8040"/>
        <path d="M8 7V6H10V7H8Z" fill="white"/>
        <path d="M7 8V7H10V6H9V5H13V6H12V7H11V8H7Z" fill="#FFC080"/>
        <path d="M7 9V8H10V9H7Z" fill="#808040"/>
        <path d="M11 8V7H12V6H13V7H15V6H16V7H17V8H13V7H12V8H11Z" fill="#808040"/>
        <path d="M6 10V9H10V8H11V9H10V10H6Z" fill="#202000"/>
        <path d="M10 10V9H11V8H12V7H13V8H16V10H17V13H16V10H15V9H11V10H10V13H9V10H10Z" fill="#FFFF80"/>
        <path d="M10 13H11V14H12V15H14V14H15V13H16V10H17V13H16V15H14V16H12V15H10V13Z" fill="#FFFF80"/>
        <path d="M10 13V10H11V9H12V10H11V11H12V13H10Z" fill="#FFFF00"/>
        <path d="M14 13V9H15V10H16V13H14Z" fill="#FFFF00"/>
        <path d="M12 15V14H14V15H12Z" fill="#FFFF00"/>
        <path d="M16 10V9H17V10H16Z" fill="#BFBF00"/>
        <path d="M9 14V13H10V14H9Z" fill="#BFBF00"/>
        <path d="M11 16V15H12V16H11Z" fill="#BFBF00"/>
        <path d="M14 16V15H15V16H14Z" fill="#BFBF00"/>
        <path d="M16 14V13H17V14H16Z" fill="#BFBF00"/>
        <path d="M9 16V15H10V16H9Z" fill="#808080"/>
        <path d="M16 16V15H17V16H16Z" fill="#808080"/>
        <path d="M8 10H9V14H10V15H11V16H15V15H16V14H17V9H16V8H17V9H18V14H17V15H16V16H15V17H11V16H10V15H9V14H8V10Z" fill="#800000"/>
        <path d="M15 13V14H11V13H12V11H11V10H12V9H14V13H15Z" fill="#800000"/>
      </svg>
    );
    else return (
      <svg
        className="w-full h-full p-0.5"
        viewBox="0 0 20 20"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M2 10V5H5V10H2Z" fill="#5C5C8D"/>
        <path d="M2 11V10H5V5H6V6H7V5H9V4H13V5H15V6H16V7H15V8H13V7H15V6H13V5H9V6H8V7H6V9H10V8H11V7H12V8H11V9H10V10H6V11H2Z" fill="#484848"/>
        <path d="M16 9V8H17V9H18V14H17V15H16V16H15V17H11V16H10V15H9V14H8V11H9V14H10V15H11V16H15V15H16V14H17V9H16Z" fill="#484848"/>
        <path d="M6 9V7H10V6H12V7H11V8H10V9H6Z" fill="#808040"/>
        <path d="M13 7V6H15V7H13Z" fill="#808040"/>
        <path d="M8 7V6H9V5H13V8H12V6H10V7H8Z" fill="#808080"/>
        <path d="M16 8V7H17V8H16Z" fill="#808080"/>
        <path d="M16 10V9H17V10H16Z" fill="#808080"/>
        <path d="M16 14V13H17V14H16Z" fill="#808080"/>
        <path d="M16 16V15H17V16H16Z" fill="#808080"/>
        <path d="M15 16V15H14V16H15Z" fill="#808080"/>
        <path d="M12 15V16H11V15H12Z" fill="#808080"/>
        <path d="M10 15V16H9V15H10Z" fill="#808080"/>
        <path d="M10 13V14H9V13H10Z" fill="#808080"/>
        <path d="M11 10V9H12V10H11V11H12V13H11V15H10V13H9V11H10V10H11Z" fill="#C0C0C0"/>
        <path d="M12 16V15H14V16H12Z" fill="#C0C0C0"/>
        <path d="M15 13H17V10H16V8H15V9H14V10H15V13Z" fill="#C0C0C0"/>
        <path d="M2 12V11H6V10H10V9H11V8H15V7H16V8H15V9H11V10H10V11H7V12H2Z" fill="white"/>
        <path d="M6 6V5H7V6H6Z" fill="white"/>
        <path d="M14 10H15V13H16V15H11V14H15V13H14V10Z" fill="white"/>
        <path d="M10 17V16H11V17H15V16H17V14H18V9H17V7H18V9H19V15H18V17H16V18H11V17H10Z" fill="white"/>
        <path d="M11 11V10H12V9H14V13H15V14H11V13H12V11H11Z" fill="#8D5C5C"/>
      </svg>
    );
  };
  function getRemInvestmentIcon() {
    return (
      <svg
        className="w-full h-full p-0.5"
        viewBox="0 0 20 20"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M2 10V5H5V10H2Z" fill="#5C5C8D"/>
        <path d="M2 11V10H5V5H6V6H7V5H9V4H13V5H15V6H16V7H15V8H13V7H15V6H13V5H9V6H8V7H6V9H10V8H11V7H12V8H11V9H10V10H6V11H2Z" fill="#484848"/>
        <path d="M16 9V8H17V9H18V14H17V15H16V16H15V17H11V16H10V15H9V14H8V11H9V14H10V15H11V16H15V15H16V14H17V9H16Z" fill="#484848"/>
        <path d="M6 9V7H10V6H12V7H11V8H10V9H6Z" fill="#808040"/>
        <path d="M13 7V6H15V7H13Z" fill="#808040"/>
        <path d="M8 7V6H9V5H13V8H12V6H10V7H8Z" fill="#808080"/>
        <path d="M16 8V7H17V8H16Z" fill="#808080"/>
        <path d="M16 10V9H17V10H16Z" fill="#808080"/>
        <path d="M16 14V13H17V14H16Z" fill="#808080"/>
        <path d="M16 16V15H17V16H16Z" fill="#808080"/>
        <path d="M15 16V15H14V16H15Z" fill="#808080"/>
        <path d="M12 15V16H11V15H12Z" fill="#808080"/>
        <path d="M10 15V16H9V15H10Z" fill="#808080"/>
        <path d="M10 13V14H9V13H10Z" fill="#808080"/>
        <path d="M11 10V9H12V10H11V11H12V13H11V15H10V13H9V11H10V10H11Z" fill="#C0C0C0"/>
        <path d="M12 16V15H14V16H12Z" fill="#C0C0C0"/>
        <path d="M15 13H17V10H16V8H15V9H14V10H15V13Z" fill="#C0C0C0"/>
        <path d="M2 12V11H6V10H10V9H11V8H15V7H16V8H15V9H11V10H10V11H7V12H2Z" fill="white"/>
        <path d="M6 6V5H7V6H6Z" fill="white"/>
        <path d="M14 10H15V13H16V15H11V14H15V13H14V10Z" fill="white"/>
        <path d="M10 17V16H11V17H15V16H17V14H18V9H17V7H18V9H19V15H18V17H16V18H11V17H10Z" fill="white"/>
        <path d="M11 11V10H12V9H14V13H15V14H11V13H12V11H11Z" fill="#8D5C5C"/>
        <path d="M3 4V2H5V3H6V4H7V6H8V8H9V9H11V8H12V7H13V6H15V5H16V4H19V5H18V6H17V7H16V8H14V9H13V10H12V11H11V12H12V13H14V14H16V15H18V16H19V18H16V17H15V16H13V15H12V14H11V13H9V15H8V17H7V19H4V15H6V14H7V12H8V9H7V8H6V6H5V5H4V4H3Z" fill="#FF0000"/>
      </svg>
    );
  };
  function getIncomeIcon(disabled: boolean) {
    if (disabled) return (
      <svg
        className="w-full h-full p-0.5"
        viewBox="0 0 20 20"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M15 10H14V16H18V15H15V10Z" fill="#2020FF"/>
        <path d="M15 15V14H18V15H15Z" fill="#6020FF"/>
        <path d="M18 10V11H16V12H18V14H15V10H18Z" fill="#2060FF"/>
        <path d="M16 12V11H18V12H16Z" fill="#2080FF"/>
        <path d="M13 15V14H14V15H13V16H12V17H7V16H12V15H13Z" fill="#202000"/>
        <path d="M10 14V13H11V14H10V15H9V14H8V13H9V14H10Z" fill="#202000"/>
        <path d="M6 15V16H5V15H4V14H5V15H6Z" fill="#202000"/>
        <path d="M7 16H6V17H7V16Z" fill="#808080"/>
        <path d="M4 13V14H3V13H4Z" fill="#808080"/>
        <path d="M4 6H3V5H4V6Z" fill="#808080"/>
        <path d="M10 6V5H11V6H10Z" fill="#808080"/>
        <path d="M5 14V13H6V14H5Z" fill="#C0C0C0"/>
        <path d="M10 13V12H13V13H10Z" fill="white"/>
        <path d="M13 14V12H14V14H13V15H12V14H13Z" fill="#C08040"/>
        <path d="M10 12V11H14V12H10V13H9V12H10Z" fill="#FF8040"/>
        <path d="M9 15V14H8V15H9Z" fill="#FF8040"/>
        <path d="M11 13H13V14H12V15H10V14H9V13H10V14H11V13Z" fill="#FFC080"/>
        <path d="M8 15V14H5V15H8Z" fill="#FFC080"/>
        <path d="M12 15H8V16H12V15Z" fill="#808000"/>
        <path d="M8 13V14H7V13H8Z" fill="#808000"/>
        <path d="M5 13V14H4V13H5Z" fill="#808000"/>
        <path d="M6 14V13H7V14H6Z" fill="#BFBF00"/>
        <path d="M4 11V12H3V11H4Z" fill="#BFBF00"/>
        <path d="M3 8V7H4V8H3Z" fill="#BFBF00"/>
        <path d="M5 6V5H6V6H5Z" fill="#BFBF00"/>
        <path d="M8 6V5H9V6H8Z" fill="#BFBF00"/>
        <path d="M10 8V7H11V8H10Z" fill="#BFBF00"/>
        <path d="M6 16V15H8V16H6Z" fill="#808040"/>
        <path d="M6 13V12H8V13H6Z" fill="#FFFF00"/>
        <path d="M10 11H8V7H9V8H10V11Z" fill="#FFFF00"/>
        <path d="M6 7V8H5V9H6V11H4V8H5V7H6Z" fill="#FFFF00"/>
        <path d="M4 13V11H3V8H4V6H6V5H8V6H10V8H11V11H10V12H9V13H8V12H9V11H10V8H9V7H5V8H4V11H5V12H6V13H4Z" fill="#FFFF80"/>
        <path d="M4 12V13H3V12H2V7H3V6H4V5H5V4H9V5H10V6H11V7H12V11H11V7H10V6H9V5H5V6H4V7H3V12H4Z" fill="#804000"/>
        <path d="M8 7H6V8H5V9H6V11H5V12H9V11H8V7Z" fill="#804000"/>
      </svg>
    );
    else return (
      <svg
        className="w-full h-full p-0.5"
        viewBox="0 0 20 20"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M15 15V10H18V15H15Z" fill="#5C5C8D"/>
        <path d="M18 15V16H14V15H13V16H12V17H7V16H12V15H13V14H14V10H15V15H18Z" fill="#484848"/>
        <path d="M6 16H5V15H4V14H5V15H6V16Z" fill="#484848"/>
        <path d="M8 14V13H9V14H10V13H11V14H10V15H9V14H8Z" fill="#484848"/>
        <path d="M12 11H11V7H10V6H9V5H5V6H4V7H3V12H4V13H3V12H2V7H3V6H4V5H5V4H9V5H10V6H11V7H12V11Z" fill="#484848"/>
        <path d="M14 13V11H10V12H9V13H14Z" fill="#808080"/>
        <path d="M7 17V16H6V17H7Z" fill="#808080"/>
        <path d="M5 13V14H3V13H5Z" fill="#808080"/>
        <path d="M4 11V12H3V11H4Z" fill="#808080"/>
        <path d="M10 8H11V7H10V8Z" fill="#808080"/>
        <path d="M10 6H11V5H10V6Z" fill="#808080"/>
        <path d="M4 6V5H3V6H4Z" fill="#808080"/>
        <path d="M14 13V14H13V15H12V16H6V15H5V13H7V14H9V13H10V14H11V13H14Z" fill="#808040"/>
        <path d="M8 14H7V13H8V14Z" fill="#C0C0C0"/>
        <path d="M11 11H9V7H6V8H5V9H6V11H5V13H4V7H5V6H10V8H11V11Z" fill="#C0C0C0"/>
        <path d="M3 8V7H4V8H3Z" fill="#EFEFEF"/>
        <path d="M5 6V5H6V6H5Z" fill="#EFEFEF"/>
        <path d="M8 6V5H9V6H8Z" fill="#EFEFEF"/>
        <path d="M5 17V16H6V17H12V16H13V15H14V16H18V10H19V17H12V18H6V17H5Z" fill="white"/>
        <path d="M13 11H12V7H11V6H12V7H13V11Z" fill="white"/>
        <path d="M10 11V12H9V13H5V12H9V11H8V7H9V11H10Z" fill="white"/>
        <path d="M3 11H4V8H3V11Z" fill="white"/>
        <path d="M4 7V6H5V7H4Z" fill="white"/>
        <path d="M6 6V5H8V6H6Z" fill="white"/>
        <path d="M5 9V8H6V7H8V11H9V12H5V11H6V9H5Z" fill="#8D5C5C"/>
      </svg>
    );
  };
  function getGoIcon() {
    return (
      <svg
        className="w-full h-full p-0.5"
        viewBox="0 0 40 20"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M21.0179 0.565215C12.3872 0.636504 -1.69706 4.19334 1.9945 18.1629C1.9945 9.93342 11.2623 5.83373 16.1987 5.83373C19.4581 5.83373 21.714 7.19877 21.9653 9.8474H18.794L19.3579 10.3821L28.3376 18.9087L28.9822 19.5215L29.629 18.9087L38.6086 10.3821L39.1725 9.84744H34.5289C34.2484 4.08619 28.2125 0.595293 21.4258 0.565215C21.2916 0.564551 21.155 0.564043 21.0179 0.565215ZM20.6592 2.30713C27.3432 2.2635 32.079 5.26287 32.2754 10.5774H36.7529L28.9843 17.9553L21.2133 10.5773H26.3379C26.1565 5.10045 21.6308 2.69295 12.9222 3.53631C15.6691 2.72193 18.2874 2.32264 20.6591 2.30709L20.6592 2.30713Z" fill="#FFFF00"/>
      </svg>
    );
  };

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

  const formatCost = (cost: Money, type?: InvestmentType) =>
    `${moneyToString(cost)}${investmentSuffix(type!)}`;

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

  const { setShowMonopolyList } = useGameStore.getState();

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
                <svg
                  className="absolute top+[4px] left+[4px] w-6 h-6 bg-flag bg-no-repeat bg-contain"
                >
                  <use href={`#icon-flag-${field.country}-Bright`} />
                </svg>
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
                <svg
                  className="absolute top+[2px] left+[2px] w-6 h-6"
                >
                  <use href={`#icon-industries-${field.industry}-Bright`} />
                </svg>
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
                  : `${moneyToString(inv.cost)}${investmentSuffix(inv.type)}`;
                const incomeStr = inv.type === InvestmentType.Infinite
                  ? `+${moneyToString(inv.resultingIncome)}`
                  : moneyToString(inv.resultingIncome);
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
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-2/3 h-2/3">
                {getFieldsIcon(field.type)}
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
