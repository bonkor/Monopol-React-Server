import React, { forwardRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { FieldType, fieldDefinitions } from '@shared/fields';
import { useCellInteractionState } from '../utils/hooks/useCellInteractionState';
import './GameCell.css';
import clsx from 'clsx';

export const countryFlagIndexMap: Record<string, number> = {
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

export const industryIconIndexMap: Record<string, number> = {
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

export function getFielsIcon(type: FieldType): JSX.Element {
  switch (type) {
    case FieldType.Taxi :
      return (
        <svg
          className="w-full h-full"
          viewBox="0 0 43 27"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M24 14V20H29V14H24Z" fill="#484848"/>
          <path d="M24 20V21H30V14H29V20H24Z" fill="black"/>
          <path d="M23 20H24V14H30V13H23V20Z" fill="#EFEFEF"/>
          <path d="M12 14V20H17V14H12Z" fill="#484848"/>
          <path d="M12 20V21H18V14H17V20H12Z" fill="black"/>
          <path d="M11 20H12V14H18V13H11V20Z" fill="#EFEFEF"/>
          <path d="M30 7V13H35V7H30Z" fill="#484848"/>
          <path d="M30 13V14H36V7H35V13H30Z" fill="black"/>
          <path d="M29 13H30V7H36V6H29V13Z" fill="#EFEFEF"/>
          <path d="M18 7V13H23V7H18Z" fill="#484848"/>
          <path d="M18 13V14H24V7H23V13H18Z" fill="black"/>
          <path d="M17 13H18V7H24V6H17V13Z" fill="#EFEFEF"/>
          <path d="M6 7V13H11V7H6Z" fill="#484848"/>
          <path d="M6 13V14H12V7H11V13H6Z" fill="black"/>
          <path d="M5 13H6V7H12V6H5V13Z" fill="#EFEFEF"/>
        </svg>
      );
    case FieldType.Birga :
      return (
        <svg
          className="w-full h-full"
          viewBox="0 0 43 27"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M13 11V17H14V19H16V21H18V22H25V21H27V20H28V19H29V17H30V10H29V8H28V7H27V6H25V5H18V6H16V7H15V8H14V11H13Z" fill="#EFEFEF"/>
          <path d="M13 20H12V19H13V20H14V21H15V22H16V23H18V24H25V23H27V22H28V21H29V20H30V19H31V17H32V10H31V8H30V7H29V6H30V7H31V8H32V10H33V18H32V20H31V21H30V22H29V23H28V24H26V25H18V24H16V23H15V22H14V21H13V20Z" fill="black"/>
          <path d="M11 10H12V17H13V19H14V20H15V21H16V22H18V23H25V22H27V21H28V20H29V19H30V17H31V10H30V8H29V7H28V6H27V5H25V4H18V5H16V6H15V7H14V8H13V7H14V6H15V5H16V4H18V3H25V4H27V5H28V6H29V7H30V8H31V10H32V17H31V19H30V20H29V21H28V22H27V23H25V24H18V23H16V22H15V21H14V20H13V19H12V17H11V10Z" fill="#484848"/>
          <path d="M13 8H12V10H13V8Z" fill="#484848"/>
          <path d="M13 17H14V19H16V21H18V22H25V21H27V20H28V19H29V17H30V10H29V8H28V7H27V6H25V5H18V6H16V7H15V8H14V7H15V6H16V5H18V4H25V5H27V6H28V7H29V8H30V10H31V17H30V19H29V20H28V21H27V22H25V23H18V22H16V21H15V20H14V19H13V17Z" fill="#D9D9D9"/>
          <path d="M13 8H14V11H13V17H12V10H13V8Z" fill="#D9D9D9"/>
          <path d="M12 19H11V17H10V10H11V8H12V7H13V6H14V5H15V4H16V3H18V2H25V3H27V4H28V5H29V6H28V5H27V4H25V3H18V4H16V5H15V6H14V7H13V8H12V10H11V17H12V19Z" fill="#EFEFEF"/>
          <path d="M16 9V13H18V9H16Z" fill="#484848"/>
          <path d="M18 9V8H20V7H21V20H20V19H18V18H16V16H18V18H20V14H18V13H20V9H18Z" fill="#484848"/>
          <path d="M25 11V9H23V13H25V14H23V18H25V19H23V20H22V19H21V18H22V14H21V13H22V9H21V8H22V7H23V8H25V9H27V11H25Z" fill="#484848"/>
          <path d="M25 18V14H27V18H25Z" fill="#484848"/>
          <path d="M17 8V9H18V8H17Z" fill="#808080"/>
          <path d="M18 13V14H17V13H18V12H19V13H18Z" fill="#808080"/>
          <path d="M24 10V9H25V8H26V9H25V10H24Z" fill="#808080"/>
          <path d="M25 14V13H26V14H25V14.5V15H24V14H25Z" fill="#808080"/>
          <path d="M25 17V18H26V19H25V18H24V17H25Z" fill="#808080"/>
          <path d="M19 17V18H18V19H17V18H18V17H19Z" fill="#808080"/>
        </svg>
      );
    case FieldType.Jail :
      return (
        <svg
          className="w-full h-full"
          viewBox="0 0 43 27"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M15 26V25H17V19H23V20H18V26H15Z" fill="black"/>
          <path d="M15 21V20H16V21H15Z" fill="black"/>
          <path d="M14 20V19H10V20H14Z" fill="black"/>
          <path d="M24 21V20H25V21H24Z" fill="black"/>
          <path d="M24 26V25H26V19H32V17H33V20H27V26H24Z" fill="black"/>
          <path d="M27 18V17H28V18H27Z" fill="black"/>
          <path d="M18 18V17H19V18H18Z" fill="black"/>
          <path d="M10 11V10H14V11H10Z" fill="black"/>
          <path d="M15 12V11H16V12H15Z" fill="black"/>
          <path d="M18 9V8H19V9H18Z" fill="black"/>
          <path d="M18 16H17V10H23V11H18V16Z" fill="black"/>
          <path d="M24 12V11H25V12H24Z" fill="black"/>
          <path d="M26 16V10H32V9H33V11H27V16H26Z" fill="black"/>
          <path d="M27 9V8H28V9H27Z" fill="black"/>
          <path d="M17 7V2H18V7H17Z" fill="black"/>
          <path d="M26 7V2H27V7H26Z" fill="black"/>
          <path d="M17 25H16V20H15V19H10V18H16V11H15V10H10V9H16V2H17V8H18V9H21V10H17V17H18V18H21V19H17V25Z" fill="#484848"/>
          <path d="M21 10V9H25V2H26V8H27V9H32V10H26V17H27V18H32V19H26V25H25V20H24V19H21V18H25V11H24V10H21Z" fill="#484848"/>
          <path d="M18 8V7H19V8H18Z" fill="#808080"/>
          <path d="M14 12V11H15V12H14Z" fill="#808080"/>
          <path d="M18 17V16H19V17H18Z" fill="#808080"/>
          <path d="M14 21V20H15V21H14Z" fill="#808080"/>
          <path d="M23 21V20H24V21H23Z" fill="#808080"/>
          <path d="M27 17V16H28V17H27Z" fill="#808080"/>
          <path d="M27 8V7H28V8H27Z" fill="#808080"/>
          <path d="M23 12V11H24V12H23Z" fill="#808080"/>
          <path d="M15 25V21H16V25H15Z" fill="#EFEFEF"/>
          <path d="M15 20V19H14V20H15Z" fill="#EFEFEF"/>
          <path d="M23 20V19H24V20H23Z" fill="#EFEFEF"/>
          <path d="M24 25V21H25V25H24Z" fill="#EFEFEF"/>
          <path d="M28 18V17H32V18H28Z" fill="#EFEFEF"/>
          <path d="M27 17V16H26V17H27Z" fill="#EFEFEF"/>
          <path d="M18 17V16H17V17H18Z" fill="#EFEFEF"/>
          <path d="M19 18V17H24V12H25V18H19Z" fill="#EFEFEF"/>
          <path d="M23 11V10H24V11H23Z" fill="#EFEFEF"/>
          <path d="M9 20H10V18H16V12H15V17H9V20Z" fill="#EFEFEF"/>
          <path d="M14 11V10H15V11H14Z" fill="#EFEFEF"/>
          <path d="M9 11H10V9H16V2H18V1H15V8H9V11Z" fill="#EFEFEF"/>
          <path d="M17 8V7H18V8H17Z" fill="#EFEFEF"/>
          <path d="M19 9V8H24V1H27V2H25V9H19Z" fill="#EFEFEF"/>
          <path d="M26 8V7H27V8H26Z" fill="#EFEFEF"/>
          <path d="M28 9V8H33V9H28Z" fill="#EFEFEF"/>
        </svg>
      );
    case FieldType.Start :
      return (
        <svg
          className="w-full h-full"
          viewBox="0 0 43 27"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M1 20V19H2V20H3V21H8V20H9V17H10V20H9V21H8V22H3V21H2V20H1Z" fill="black"/>
          <path d="M5 17H4V16H2V15H4V16H5V17Z" fill="black"/>
          <path d="M6 14V13H10V14H6Z" fill="black"/>
          <path d="M2 9V8H7V6H8V9H2Z" fill="black"/>
          <path d="M10 9V8H12V9H10Z" fill="black"/>
          <path d="M17 6H16V8H14V21H12V22H15V9H17V6Z" fill="black"/>
          <path d="M17 22V21H19V19H22V20H20V22H17Z" fill="black"/>
          <path d="M22 22V21H25V16H24V12H25V16H26V22H22Z" fill="black"/>
          <path d="M20 17H19V14H20V13H22V14H20V17Z" fill="black"/>
          <path d="M33 6H32V8H19V9H33V6Z" fill="black"/>
          <path d="M31 15H30V12H32V13H31V15Z" fill="black"/>
          <path d="M28 22V21H30V18H32V19H31V22H28Z" fill="black"/>
          <path d="M32 22V21H35V19H36V22H32Z" fill="black"/>
          <path d="M34 17V16H35V12H36V16H35V17H34Z" fill="black"/>
          <path d="M38 22V21H40V8H42V6H43V9H41V22H38Z" fill="black"/>
          <path d="M35 9V8H38V9H35Z" fill="black"/>
          <path d="M2 20V19H6V17H5V16H4V15H2V12H3V11H8V12H10V13H6V16H8V17H9V20H8V21H3V20H2Z" fill="#484848"/>
          <path d="M2 8V6H7V8H2Z" fill="#484848"/>
          <path d="M10 8V6H16V8H14V21H12V8H10Z" fill="#484848"/>
          <path d="M17 21V16H18V12H19V11H22V13H20V14H19V17H20V18H22V19H19V21H17Z" fill="#484848"/>
          <path d="M19 8V6H32V8H19Z" fill="#484848"/>
          <path d="M30 21H28V11H32V12H30V15H31V16H32V18H30V21Z" fill="#484848"/>
          <path d="M35 8V6H42V8H40V21H38V8H35Z" fill="#484848"/>
          <path d="M22 14V11H24V16H25V21H22V18H23V14H22Z" fill="#484848"/>
          <path d="M32 11H35V16H34V19H35V21H32V16H33V13H32V11Z" fill="#484848"/>
          <path d="M20 17V14H22V17H20Z" fill="#C0C0C0"/>
          <path d="M31 15V13H32V15H31Z" fill="#C0C0C0"/>
          <path d="M1 19V18H5V17H6V19H1Z" fill="#EFEFEF"/>
          <path d="M1 15V12H2V11H3V10H8V11H9V12H8V11H3V12H2V15H1Z" fill="#EFEFEF"/>
          <path d="M6 16V15H8V16H10V17H8V16H6Z" fill="#EFEFEF"/>
          <path d="M8 6V5H1V8H2V6H8Z" fill="#EFEFEF"/>
          <path d="M12 9H11V21H12V9Z" fill="#EFEFEF"/>
          <path d="M9 8H10V6H17V5H9V8Z" fill="#EFEFEF"/>
          <path d="M17 21H16V16H17V12H18V10H24V11H19V12H18V16H17V21Z" fill="#EFEFEF"/>
          <path d="M20 18V17H22V14H23V18H20Z" fill="#EFEFEF"/>
          <path d="M28 11V21H27V10H34V11H28Z" fill="#EFEFEF"/>
          <path d="M31 16V15H32V13H33V16H31Z" fill="#EFEFEF"/>
          <path d="M34 19V18H36V19H34Z" fill="#EFEFEF"/>
          <path d="M19 6V8H18V5H33V6H19Z" fill="#EFEFEF"/>
          <path d="M37 21V9H38V21H37Z" fill="#EFEFEF"/>
          <path d="M35 6H43V5H34V8H35V6Z" fill="#EFEFEF"/>
        </svg>
      );
    case FieldType.Pip :
      return (
        <svg
          className="w-full h-full"
          viewBox="0 0 43 27"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 20V19H13V20H14V21H15V22H16V23H18V24H25V23H27V22H28V21H29V20H30V19H31V17H32V10H31V8H30V7H29V6H30V7H31V8H32V10H33V18H32V20H31V21H30V22H29V23H28V24H26V25H18V24H16V23H15V22H14V21H13V20H12Z" fill="black"/>
          <path d="M15 20V19H16V18H17V17H18V16H19V15H20V14H21V15H20V16H19V17H18V18H17V19H16V20H15Z" fill="black"/>
          <path d="M21 3V4H18V5H16V7H15V8H16V9H17V10H18V11H19V12H20V13H21V14H20V15H19V16H18V17H17V18H16V19H15V21H16V22H18V23H25V22H27V21H28V22H27V23H25V24H18V23H16V22H15V21H14V20H13V19H12V17H11V10H12V8H13V7H14V6H15V5H16V4H18V3H21Z" fill="#484848"/>
          <path d="M21 4V3H25V4H27V5H28V6H29V7H30V8H31V10H32V17H31V19H30V20H29V21H28V19H27V18H26V17H25V16H24V15H23V14H21V13H23V12H24V11H25V10H26V9H27V8H28V7H27V5H25V4H21Z" fill="#484848"/>
          <path d="M27 5V6H25V5H18V6H16V5H18V4H25V5H27Z" fill="#C0C0C0"/>
          <path d="M16 7V8H17V9H18V10H19V11H20V12H21V13H20V12H19V11H18V10H17V9H16V8H15V7H16Z" fill="#C0C0C0"/>
          <path d="M22 15V14H23V15H24V16H25V17H26V18H27V19H28V21H27V22H25V23H18V22H16V21H15V20H16V21H18V22H25V21H27V19H26V18H25V17H24V16H23V15H22Z" fill="#C0C0C0"/>
          <path d="M12 19H11V17H10V10H11V8H12V7H13V6H14V5H15V4H16V3H18V2H26V3H27V4H28V5H29V6H28V5H27V4H25V3H18V4H16V5H15V6H14V7H13V8H12V10H11V17H12V19Z" fill="#EFEFEF"/>
          <path d="M25 5H18V6H16V8H17V9H18V10H19V11H20V12H21V13H22V12H23V11H24V10H25V9H26V8H27V6H25V5Z" fill="#EFEFEF"/>
          <path d="M22 14H21V15H20V16H19V17H18V18H17V19H16V21H18V22H25V21H27V19H26V18H25V17H24V16H23V15H22V14Z" fill="#EFEFEF"/>
        </svg>
      );
    case FieldType.Ques :
      return (
        <svg
          className="w-full h-full"
          viewBox="0 0 43 27"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M18 24V23H19V24H22V23H23V20H22V19H23V20H24V23H23V24H22V25H19V24H18Z" fill="black"/>
          <path d="M19 16V15H22V14H23V13H24V12H26V11H27V7H26V6H27V7H28V11H27V12H26V13H24V14H23V16H19Z" fill="black"/>
          <path d="M21 7V8H19V11H18V12H14V11H18V8H19V7H21Z" fill="black"/>
          <path d="M19 20V19H22V20H23V23H22V24H19V23H18V20H19Z" fill="#484848"/>
          <path d="M22 15H19V13H20V12H21V10H22V8H21V7H19V8H18V11H14V7H15V6H16V5H19V4H22V5H25V6H26V7H27V11H26V12H24V13H23V14H22V15Z" fill="#484848"/>
          <path d="M18 23H17V20H18V19H19V18H22V19H19V20H18V23Z" fill="#EFEFEF"/>
          <path d="M19 15H18V13H19V12H20V10H21V8H22V10H21V12H20V13H19V15Z" fill="#EFEFEF"/>
          <path d="M26 6H25V5H22V4H19V5H16V6H15V7H14V11H13V7H14V6H15V5H16V4H19V3H22V4H25V5H26V6Z" fill="#EFEFEF"/>
        </svg>
      );
    case FieldType.Ques3 :
      return (
        <svg
          className="w-full h-full"
          viewBox="0 0 43 27"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6 23V22H8V21H9V19H8V18H9V19H10V22H9V23H6Z" fill="black"/>
          <path d="M19 22V21H20V22H22V21H23V19H22V18H23V19H24V22H23V23H20V22H19Z" fill="black"/>
          <path d="M6 16V15H8V14H9V13H10V12H12V13H10V14H9V15H8V16H6Z" fill="black"/>
          <path d="M2 11V10H5V9H6V7H9V8H7V9H6V10H5V11H2Z" fill="black"/>
          <path d="M12 6V5H13V6H14V11H13V6H12Z" fill="black"/>
          <path d="M16 11V10H19V9H20V7H23V8H21V9H20V10H19V11H16Z" fill="black"/>
          <path d="M26 6V5H27V6H28V11H27V12H26V13H24V14H23V15H22V16H20V15H22V14H23V13H24V12H26V11H27V6H26Z" fill="black"/>
          <path d="M30 11V10H33V9H34V7H37V8H35V9H34V10H33V11H30Z" fill="black"/>
          <path d="M40 6V5H41V6H42V11H41V12H40V13H38V14H37V15H36V16H34V15H36V14H37V13H38V12H40V11H41V6H40Z" fill="black"/>
          <path d="M36 19V18H37V19H38V22H37V23H34V22H33V21H34V22H36V21H37V19H36Z" fill="black"/>
          <path d="M8 22H5V19H6V18H8V19H9V21H8V22Z" fill="#484848"/>
          <path d="M19 21V19H20V18H22V19H23V21H22V22H20V21H19Z" fill="#484848"/>
          <path d="M8 15H6V12H7V11H8V10H9V7H6V9H5V10H2V6H3V5H5V4H11V5H12V6H13V12H10V13H9V14H8V15Z" fill="#484848"/>
          <path d="M16 6V10H19V9H20V7H23V10H22V11H21V12H20V15H22V14H23V13H24V12H26V11H27V6H26V5H25V4H19V5H17V6H16Z" fill="#484848"/>
          <path d="M30 6V10H33V9H34V7H37V10H36V11H35V12H34V12.5V15H36V14H37V13H38V12H40V11H41V6H40V5H39V4H33V5H31V6H30Z" fill="#484848"/>
          <path d="M34 19H33V21H34V22H36V21H37V19H36V18H34V19Z" fill="#484848"/>
          <path d="M5 15V14H6V15H5Z" fill="#909090"/>
          <path d="M1 11V10H2V11H1Z" fill="#909090"/>
          <path d="M19 15V14H20V15H19Z" fill="#909090"/>
          <path d="M15 11V10H16V11H15Z" fill="#909090"/>
          <path d="M29 11V10H30V11H29Z" fill="#909090"/>
          <path d="M33 15V14H34V15H33Z" fill="#909090"/>
          <path d="M4 21V19H5V18H6V17H8V18H6V19H5V21H4Z" fill="#EFEFEF"/>
          <path d="M19 21H18V19H19V18H20V17H22V18H20V19H19V21Z" fill="#EFEFEF"/>
          <path d="M6 14H5V12H6V11H7V10H8V8H9V10H8V11H7V12H6V14Z" fill="#EFEFEF"/>
          <path d="M2 6V10H1V6H2V5H3V4H5V3H11V4H12V5H11V4H5V5H3V6H2Z" fill="#EFEFEF"/>
          <path d="M15 10V6H16V5H17V4H19V3H25V4H26V5H25V4H19V5H17V6H16V10H15Z" fill="#EFEFEF"/>
          <path d="M22 8H23V10H22V11H21V11.5V12H20V14H19V12H20V11H21V10H22V8Z" fill="#EFEFEF"/>
          <path d="M30 10H29V6H30V5H31V4H33V3H39V4H40V5H39V4H33V5H31V6H30V10Z" fill="#EFEFEF"/>
          <path d="M36 8H37V10H36V11H35V12H34V14H33V12H34V11H35V10H36V8Z" fill="#EFEFEF"/>
          <path d="M34 18V17H36V18H34V19H33V21H32V19H33V18H34Z" fill="#EFEFEF"/>
        </svg>
      );
    default: return (
      <div />
    );
  }
}

export function getFlagOffset(country: string): string {
  const index = countryFlagIndexMap[country] ?? 0;
  return `-54px -${79 + index * 19}px`; //
}

export function getIndustryOffset(industry: string): string {
  const index = industryIconIndexMap[industry] ?? 0;
  return `-79px -${1 + index * 25}px`; //
}

interface GameCellProps {
  index: number;
  cellIndex: number | null;
  onClickFirm?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const GameCell = forwardRef<HTMLDivElement, GameCellProps>(
  function GameCell({ index, cellIndex, onClickFirm }, ref) {
    const field = fieldDefinitions.find((f) => f.index === cellIndex) ?? null;
    const players = useGameStore((state) => state.players);
    const fieldStates = useGameStore((state) => state.fieldStates);
    const fieldState = fieldStates.find(f => f.index === cellIndex);

    const ownerId = fieldState?.ownerId;
    const owner = players.find(p => p.id === ownerId);

    const playersHere = cellIndex !== null
      ? players.filter((p) => p.position === cellIndex)
      : [];

    if (!field) return <div className="bg-transparent" />;

    const highlightedCompanies = useGameStore((s) => s.highlightedCompanies);
    const isHighlighted = highlightedCompanies.includes(field.index);

    const isFirm = field.type === FieldType.Firm;

    const interaction = useCellInteractionState(field, fieldState);

    return (
      <div
        ref={ref}
        className={clsx(
          'relative w-full h-full border-1 border-gray-300 transition-colors duration-500 select-none',
          {
            'bg-yellow-300 cursor-pointer': isHighlighted,
            'bg-yellow-400 cursor-pointer': interaction.isTarget,
            'bg-red-500 cursor-pointer': interaction.isCandidate,
            'bg-[#c0c0c0] hover:bg-green-400 cursor-pointer': isFirm && !interaction.isTarget && !interaction.isCandidate,
            'bg-[#c0c0c0]': !isFirm || (!interaction.isTarget && !interaction.isCandidate && !interaction.isHighlighted),
          }
        )}
        onClick={isFirm || (interaction.isTarget) ? onClickFirm : undefined}
      >
        <div
          className="w-full h-full"
          style={{
            border: isFirm && owner ? `4px solid ${owner.color}` : undefined,
          }}
        >
          {/* Иконка в центре — если не фирма */}
          {!isFirm && (
            <div className="w-full h-full flex items-center justify-center">
              {getFielsIcon(field.type)}
              {/*<div className="icon-wrapper">
                <div className={`sprite sprite-${field.type}`} />
              </div>*/}
            </div>
          )}

          {/* Контент фирмы */}
          {isFirm && (
            <>
              {/* Флаг страны */}
              <div className="absolute top-[7px] left-[7px] w-5 h-5 bg-flag bg-no-repeat bg-contain" style={{
                backgroundPosition: getFlagOffset(field.country)
              }} />

              {/* Иконка типа компании */}
              <div className="absolute top-[4px] right-[4px] w-5 h-5 bg-ind bg-no-repeat bg-contain" style={{
                backgroundPosition: getIndustryOffset(field.industry)
              }} />

              {/* Название */}
              <div className="absolute inset-0 flex items-center justify-center text-[18px] text-center font-mono px-1">
                {field.name}
              </div>
            </>
          )}

          {/* Фишки игроков */}
          <div className="absolute bottom-1 left-1 right-1 flex gap-[2px] flex-wrap justify-center items-center">
            {playersHere.map((player) => (
              <div
                key={player.id}
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: player.color }}
                title={player.name}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
);
