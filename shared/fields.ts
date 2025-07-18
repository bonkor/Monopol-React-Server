import { type Case } from './types';

export type Money = number; // храним теперь в десятых
export const m = (value: number): Money => Math.round(value * 10);

export const moneyToDisplay = (money: Money): string =>
  (money / 10).toFixed(1);

export const moneyToString = (money: Money): string => {
  const value = money % 10;
  return (value === 0) ? (money / 10).toFixed(0) : (money / 10).toFixed(1);
}

export type FieldType =
  '3chance' |
  'chance' |
  'pip' |
  'start' |
  'taxi' |
  'jail' |
  'stock-exchange' |
  'firm';
export const FieldType = {
  Ques3: '3chance',
  Ques: 'chance',
  Pip: 'pip',
  Start: 'start',
  Taxi: 'taxi',
  Jail: 'jail',
  Birga: 'stock-exchange',
  Firm: 'firm'
} as const;

export type Country =
  'Switzerland' |
  'Holland' |
  'Italy' |
  'Hungary' |
  'BRD' |
  'DDR' |
  'France' |
  'Balkan' |
  'Japan' |
  'England' |
  'USA_Ind' |
  'USA_Int' |
  'USSR';
export const Country = {
  SWI: 'Switzerland',
  HOL: 'Holland',
  ITA: 'Italy',
  HUN: 'Hungary',
  BRD: 'BRD',
  DDR: 'DDR',
  FRA: 'France',
  BLK: 'Balkan',
  JAP: 'Japan',
  ENG: 'England',
  USA_Ind: 'USA_Ind',
  USA_Int: 'USA_Int',
  URS: 'USSR',
} as const;

export type Industry =
  'Port' |
  'Spy' |
  'Healthcare' |
  'Tourism' |
  'Radio' |
  'Food' |
  'Media' |
  'Automotive' |
  'Electro' |
  'Oil' |
  'Studio' |
  'Avia' |
  'Newspaper';
export const Industry = {
  Port: 'Port',
  Spy: 'Spy',
  Healthcare: 'Healthcare',
  Tourism: 'Tourism',
  Radio: 'Radio',
  Food: 'Food',
  Media: 'Media',
  Automotive: 'Automotive',
  Electro: 'Electro',
  Oil: 'Oil',
  Studio: 'Studio',
  Avia: 'Avia',
  Newspaper: 'Newspaper',
} as const;

export type InvestmentType = 'regular' | 'infinite' | 'sacrifice_company' | 'sacrifice_monopoly';
export const InvestmentType = {
  Regular: 'regular',              // Обычная инвестиция
  Infinite: 'infinite',            // Бесконечная (фикс. вложение — фикс. прирост)
  SacrificeCompany: 'sacrifice_company', // Требуется отказаться от любой своей фирмы
  SacrificeMonopoly: 'sacrifice_monopoly' // Требуется отказаться от фирмы из монополии
} as const;

export type InvestmentOption = {
  type: InvestmentType;
  cost: Money;
  resultingIncome: Money;
};

export type FieldDefinition = {
  index: number;
  type: FieldType;
  name?: string;
  cases?: Case[];
  country?: Country;
  industry?: Industry;
  investments?: InvestmentOption[];
};

export type FieldState = {
  index: number; // соответствует fieldDefinition.index
  ownerId?: string; // ID игрока-владельца, если есть
  investmentLevel?: number; // сколько вложений сделано (индекс в массиве investments)
};
// investmentLevel = 0 — нет вложений (куплено, но не инвестировано)
// investmentLevel = 2 — сделано 2 вложения, доход соответствует fieldDefinition.investments[2].resultingIncome

export function getFieldStateByIndex(state: FieldState[], pos: number): FieldState | undefined {
  return Array.isArray(state) ? state.find((f) => f.index === pos) : undefined;
}

export function getFieldByIndex(pos: number): FieldDefinition {
  const firm = fieldDefinitions.find((f) => f.index === pos);
  if (! firm) return {
    index: 0,
    type: FieldType.Pip,
  };
  return firm;
}

export function getCompanyCostByIndex(pos: number): Money {
  const investments = getFieldByIndex(pos).investments;
  if (! investments) return 0;
  return investments[0].cost ?? 0;
}

export function getMinFreePropertyPrice(
  state: FieldState[]
): Money | undefined {
  const freeProperties = state
    .filter((f) => f.ownerId == null)
    .map((f) => getFieldByIndex(f.index))
    .filter((def): def is FieldDefinition => !!def && !!def.investments?.[0]);

  if (freeProperties.length === 0) return undefined;

  return Math.min(...freeProperties.map((def) => def.investments![0].cost));
}

export function getMaxPlayerIdPropertyPrice(
  state: FieldState[],
  playerId: string | null
): Money | undefined {
  if (!playerId) return undefined;
  const ownedProperties = state
    .filter((f) => f.ownerId === playerId)
    .map((f) => getFieldByIndex(f.index))
    .filter((def): def is FieldDefinition => !!def && !!def.investments?.[0]);

  if (ownedProperties.length === 0) return undefined;

  return Math.max(...ownedProperties.map((def) => def.investments![0].cost));
}

export const fieldDefinitions: FieldDefinition[] = [
  {
    index: 0,
    type: FieldType.Ques3,
    name: '???',
  },
  {
    index: 1,
    type: FieldType.Firm,
    name: 'ESSO',
    country: Country.USA_Ind,
    industry: Industry.Oil,
    investments: [
      { type: InvestmentType.Regular, cost: m(20), resultingIncome: m(2) },
      { type: InvestmentType.Regular, cost: m(15), resultingIncome: m(6) },
      { type: InvestmentType.Regular, cost: m(30), resultingIncome: m(20) },
      { type: InvestmentType.Regular, cost: m(50), resultingIncome: m(30) },
      { type: InvestmentType.Regular, cost: m(35), resultingIncome: m(40) },
    ]
  },
  {
    index: 2,
    type: FieldType.Firm,
    name: 'British Petrolium',
    country: Country.ENG,
    industry: Industry.Oil,
    investments: [
      { type: InvestmentType.Regular, cost: m(25), resultingIncome: m(2.5) },
      { type: InvestmentType.Regular, cost: m(20), resultingIncome: m(8) },
      { type: InvestmentType.Regular, cost: m(45), resultingIncome: m(25) },
      { type: InvestmentType.Regular, cost: m(55), resultingIncome: m(35) },
      { type: InvestmentType.Regular, cost: m(40), resultingIncome: m(55) },
    ]
  },
  {
    index: 3,
    type: FieldType.Ques,
    name: '?',
  },
  {
    index: 4,
    type: FieldType.Firm,
    name: 'Shell',
    country: Country.HOL,
    industry: Industry.Oil,
    investments: [
      { type: InvestmentType.Regular, cost: m(30), resultingIncome: m(3) },
      { type: InvestmentType.Regular, cost: m(25), resultingIncome: m(10) },
      { type: InvestmentType.Regular, cost: m(40), resultingIncome: m(30) },
      { type: InvestmentType.Regular, cost: m(60), resultingIncome: m(40) },
      { type: InvestmentType.Regular, cost: m(55), resultingIncome: m(60) },
    ]
  },
  {
    index: 5,
    type: FieldType.Firm,
    name: 'Yokogama',
    country: Country.JAP,
    industry: Industry.Port,
    investments: [
      { type: InvestmentType.Regular, cost: m(20), resultingIncome: m(5) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(10) },
    ]
  },
  {
    index: 6,
    type: FieldType.Firm,
    name: 'Борба',
    cases: [
      {case: 'р', value: 'Борбы'},
      {case: 'д', value: 'Борбе'},
      {case: 'в', value: 'Борбу'},
      {case: 'п', value: 'Борбе'},
    ],
    country: Country.BLK,
    industry: Industry.Radio,
    investments: [
      { type: InvestmentType.Regular, cost: m(25), resultingIncome: m(2.5) },
      { type: InvestmentType.Regular, cost: m(13), resultingIncome: m(7) },
      { type: InvestmentType.Regular, cost: m(30), resultingIncome: m(25) },
      { type: InvestmentType.Regular, cost: m(40), resultingIncome: m(35) },
      { type: InvestmentType.Regular, cost: m(35), resultingIncome: m(50) },
    ]
  },
  {
    index: 7,
    type: FieldType.Firm,
    name: 'BBC',
    country: Country.ENG,
    industry: Industry.Radio,
    investments: [
      { type: InvestmentType.Regular, cost: m(30), resultingIncome: m(3) },
      { type: InvestmentType.Regular, cost: m(17), resultingIncome: m(10) },
      { type: InvestmentType.Regular, cost: m(35), resultingIncome: m(25) },
      { type: InvestmentType.Regular, cost: m(50), resultingIncome: m(40) },
      { type: InvestmentType.Regular, cost: m(40), resultingIncome: m(60) },
    ]
  },
  {
    index: 8,
    type: FieldType.Pip,
    name: 'пипка',
    cases: [
      {case: 'р', value: 'пипку'},
      {case: 'д', value: 'пипки'},
      {case: 'в', value: 'пипку'},
      {case: 'п', value: 'пипке'},
    ],
  },
  {
    index: 9,
    type: FieldType.Firm,
    name: 'Маяк',
    cases: [
      {case: 'р', value: 'Маяка'},
      {case: 'д', value: 'Маяку'},
      {case: 'в', value: 'Маяк'},
      {case: 'п', value: 'Маяке'},
    ],
    country: Country.URS,
    industry: Industry.Radio,
    investments: [
      { type: InvestmentType.Regular, cost: m(35), resultingIncome: m(3.5) },
      { type: InvestmentType.Regular, cost: m(21), resultingIncome: m(16) },
      { type: InvestmentType.Regular, cost: m(40), resultingIncome: m(35) },
      { type: InvestmentType.Regular, cost: m(60), resultingIncome: m(45) },
      { type: InvestmentType.Regular, cost: m(55), resultingIncome: m(70) },
    ]
  },
  {
    index: 10,
    type: FieldType.Taxi,
    name: 'такси',
  },
  {
    index: 11,
    type: FieldType.Firm,
    name: 'Bulgarconserv',
    country: Country.BLK,
    industry: Industry.Food,
    investments: [
      { type: InvestmentType.Regular, cost: m(8), resultingIncome: m(.8) },
      { type: InvestmentType.Regular, cost: m(4), resultingIncome: m(2) },
      { type: InvestmentType.Regular, cost: m(4), resultingIncome: m(4) },
      { type: InvestmentType.Regular, cost: m(8), resultingIncome: m(8) },
      { type: InvestmentType.Regular, cost: m(8), resultingIncome: m(16) },
    ]
  },
  {
    index: 12,
    type: FieldType.Firm,
    name: 'Coca-Cola',
    country: Country.USA_Ind,
    industry: Industry.Food,
    investments: [
      { type: InvestmentType.Regular, cost: m(12), resultingIncome: m(1.2) },
      { type: InvestmentType.Regular, cost: m(6), resultingIncome: m(3) },
      { type: InvestmentType.Regular, cost: m(6), resultingIncome: m(6) },
      { type: InvestmentType.Regular, cost: m(12), resultingIncome: m(12) },
      { type: InvestmentType.Regular, cost: m(12), resultingIncome: m(24) },
    ]
  },
  {
    index: 13,
    type: FieldType.Ques,
    name: '?',
  },
  {
    index: 14,
    type: FieldType.Firm,
    name: 'Globus',
    country: Country.HUN,
    industry: Industry.Food,
    investments: [
      { type: InvestmentType.Regular, cost: m(16), resultingIncome: m(1.6) },
      { type: InvestmentType.Regular, cost: m(8), resultingIncome: m(4) },
      { type: InvestmentType.Regular, cost: m(8), resultingIncome: m(8) },
      { type: InvestmentType.Regular, cost: m(16), resultingIncome: m(16) },
      { type: InvestmentType.Regular, cost: m(16), resultingIncome: m(32) },
    ]
  },
  {
    index: 15,
    type: FieldType.Firm,
    name: 'Rostoc',
    country: Country.DDR,
    industry: Industry.Port,
    investments: [
      { type: InvestmentType.Regular, cost: m(20), resultingIncome: m(5) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(10) },
    ]
  },
  {
    index: 16,
    type: FieldType.Firm,
    name: 'BEA',
    country: Country.ENG,
    industry: Industry.Avia,
    investments: [
      { type: InvestmentType.Regular, cost: m(50), resultingIncome: m(5) },
      { type: InvestmentType.Regular, cost: m(25), resultingIncome: m(25) },
      { type: InvestmentType.Regular, cost: m(25), resultingIncome: m(50) },
      { type: InvestmentType.Regular, cost: m(50), resultingIncome: m(70) },
      { type: InvestmentType.Regular, cost: m(50), resultingIncome: m(100) },
    ]
  },
  {
    index: 17,
    type: FieldType.Firm,
    name: 'Lufthanza',
    country: Country.BRD,
    industry: Industry.Avia,
    investments: [
      { type: InvestmentType.Regular, cost: m(60), resultingIncome: m(6) },
      { type: InvestmentType.Regular, cost: m(30), resultingIncome: m(30) },
      { type: InvestmentType.Regular, cost: m(35), resultingIncome: m(70) },
      { type: InvestmentType.Regular, cost: m(60), resultingIncome: m(90) },
      { type: InvestmentType.Regular, cost: m(60), resultingIncome: m(120) },
    ]
  },
  {
    index: 18,
    type: FieldType.Pip,
    name: 'пипка',
    cases: [
      {case: 'р', value: 'пипку'},
      {case: 'д', value: 'пипки'},
      {case: 'в', value: 'пипку'},
      {case: 'п', value: 'пипке'},
    ],
  },
  {
    index: 19,
    type: FieldType.Firm,
    name: 'Air France',
    country: Country.FRA,
    industry: Industry.Avia,
    investments: [
      { type: InvestmentType.Regular, cost: m(70), resultingIncome: m(7) },
      { type: InvestmentType.Regular, cost: m(35), resultingIncome: m(35) },
      { type: InvestmentType.Regular, cost: m(35), resultingIncome: m(70) },
      { type: InvestmentType.Regular, cost: m(70), resultingIncome: m(100) },
      { type: InvestmentType.Regular, cost: m(70), resultingIncome: m(140) },
    ]
  },
  {
    index: 20,
    name: 'Биржа',
    type: FieldType.Birga,
  },
  {
    index: 21,
    type: FieldType.Firm,
    name: 'Omega',
    country: Country.SWI,
    industry: Industry.Electro,
    investments: [
      { type: InvestmentType.Regular, cost: m(6), resultingIncome: m(0.6) },
      { type: InvestmentType.Regular, cost: m(6), resultingIncome: m(3) },
      { type: InvestmentType.Regular, cost: m(6), resultingIncome: m(6) },
      { type: InvestmentType.Regular, cost: m(6), resultingIncome: m(9) },
      { type: InvestmentType.Regular, cost: m(6), resultingIncome: m(15) },
    ]
  },
  {
    index: 22,
    type: FieldType.Firm,
    name: 'Grundic',
    country: Country.BRD,
    industry: Industry.Electro,
    investments: [
      { type: InvestmentType.Regular, cost: m(8), resultingIncome: m(0.8) },
      { type: InvestmentType.Regular, cost: m(8), resultingIncome: m(4) },
      { type: InvestmentType.Regular, cost: m(8), resultingIncome: m(8) },
      { type: InvestmentType.Regular, cost: m(8), resultingIncome: m(16) },
      { type: InvestmentType.Regular, cost: m(8), resultingIncome: m(20) },
    ]
  },
  {
    index: 23,
    type: FieldType.Ques,
    name: '?',
  },
  {
    index: 24,
    type: FieldType.Firm,
    name: 'Bell',
    country: Country.USA_Ind,
    industry: Industry.Electro,
    investments: [
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(1) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(5) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(10) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(15) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(25) },
    ]
  },
  {
    index: 25,
    type: FieldType.Firm,
    name: 'Roterdam',
    country: Country.HOL,
    industry: Industry.Port,
    investments: [
      { type: InvestmentType.Regular, cost: m(20), resultingIncome: m(5) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(10) },
    ]
  },
  {
    index: 26,
    type: FieldType.Firm,
    name: 'NG',
    country: Country.FRA,
    industry: Industry.Spy,
    investments: [
      { type: InvestmentType.Regular, cost: m(30), resultingIncome: m(3) },
      { type: InvestmentType.Regular, cost: m(15), resultingIncome: m(15) },
      { type: InvestmentType.Regular, cost: m(15), resultingIncome: m(30) },
      { type: InvestmentType.Regular, cost: m(50), resultingIncome: m(50) },
      { type: InvestmentType.Regular, cost: m(30), resultingIncome: m(90) },
    ]
  },
  {
    index: 27,
    type: FieldType.Firm,
    name: 'IS',
    country: Country.ENG,
    industry: Industry.Spy,
    investments: [
      { type: InvestmentType.Regular, cost: m(35), resultingIncome: m(3.5) },
      { type: InvestmentType.Regular, cost: m(20), resultingIncome: m(20) },
      { type: InvestmentType.Regular, cost: m(20), resultingIncome: m(35) },
      { type: InvestmentType.Regular, cost: m(55), resultingIncome: m(55) },
      { type: InvestmentType.Regular, cost: m(40), resultingIncome: m(90) },
    ]
  },
  {
    index: 28,
    type: FieldType.Pip,
    name: 'пипка',
    cases: [
      {case: 'р', value: 'пипку'},
      {case: 'д', value: 'пипки'},
      {case: 'в', value: 'пипку'},
      {case: 'п', value: 'пипке'},
    ],
  },
  {
    index: 29,
    type: FieldType.Firm,
    name: 'CIA',
    country: Country.USA_Int,
    industry: Industry.Spy,
    investments: [
      { type: InvestmentType.Regular, cost: m(40), resultingIncome: m(4) },
      { type: InvestmentType.Regular, cost: m(25), resultingIncome: m(25) },
      { type: InvestmentType.Regular, cost: m(25), resultingIncome: m(40) },
      { type: InvestmentType.Regular, cost: m(40), resultingIncome: m(60) },
      { type: InvestmentType.Regular, cost: m(50), resultingIncome: m(100) },
    ]
  },
  {
    index: 30,
    type: FieldType.Jail,
    name: 'тюрьма',
    cases: [
      {case: 'р', value: 'тюрьмы'},
      {case: 'д', value: 'тюрьме'},
      {case: 'в', value: 'тюрьму'},
      {case: 'п', value: 'тюрьме'},
    ],
  },
  {
    index: 31,
    type: FieldType.Firm,
    name: 'Союзмультфильм',
    cases: [
      {case: 'р', value: 'Союзмультфильма'},
      {case: 'д', value: 'Союзмультфильму'},
      {case: 'в', value: 'Союзмультфильм'},
      {case: 'п', value: 'Союзмультфильме'},
    ],
    country: Country.URS,
    industry: Industry.Studio,
    investments: [
      { type: InvestmentType.Regular, cost: m(15), resultingIncome: m(1.5) },
      { type: InvestmentType.Regular, cost: m(8), resultingIncome: m(8) },
      { type: InvestmentType.Regular, cost: m(8), resultingIncome: m(6) },
      { type: InvestmentType.Regular, cost: m(30), resultingIncome: m(17) },
      { type: InvestmentType.Regular, cost: m(35), resultingIncome: m(40) },
    ]
  },
  {
    index: 32,
    type: FieldType.Firm,
    name: 'Defa',
    country: Country.DDR,
    industry: Industry.Studio,
    investments: [
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(1) },
      { type: InvestmentType.Regular, cost: m(4), resultingIncome: m(6) },
      { type: InvestmentType.Regular, cost: m(6), resultingIncome: m(4) },
      { type: InvestmentType.Regular, cost: m(25), resultingIncome: m(14) },
      { type: InvestmentType.Regular, cost: m(30), resultingIncome: m(35) },
    ]
  },
  {
    index: 33,
    type: FieldType.Ques,
    name: '?',
  },
  {
    index: 34,
    type: FieldType.Firm,
    name: 'XX-th centure fox',
    country: Country.USA_Int,
    industry: Industry.Studio,
    investments: [
      { type: InvestmentType.Regular, cost: m(20), resultingIncome: m(1.5) },
      { type: InvestmentType.Regular, cost: m(8), resultingIncome: m(10) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(8) },
      { type: InvestmentType.Regular, cost: m(25), resultingIncome: m(14) },
      { type: InvestmentType.Regular, cost: m(40), resultingIncome: m(45) },
    ]
  },
  {
    index: 35,
    type: FieldType.Firm,
    name: 'Genoa',
    country: Country.ITA,
    industry: Industry.Port,
    investments: [
      { type: InvestmentType.Regular, cost: m(20), resultingIncome: m(5) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(10) },
    ]
  },
  {
    index: 36,
    type: FieldType.Firm,
    name: 'Tanug',
    country: Country.BLK,
    industry: Industry.Media,
    investments: [
      { type: InvestmentType.Regular, cost: m(15), resultingIncome: m(1.5) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(7) },
      { type: InvestmentType.Regular, cost: m(25), resultingIncome: m(16) },
      { type: InvestmentType.Regular, cost: m(35), resultingIncome: m(20) },
      { type: InvestmentType.Regular, cost: m(30), resultingIncome: m(55) },
    ]
  },
  {
    index: 37,
    type: FieldType.Firm,
    name: 'Reuter',
    country: Country.ENG,
    industry: Industry.Media,
    investments: [
      { type: InvestmentType.Regular, cost: m(20), resultingIncome: m(2) },
      { type: InvestmentType.Regular, cost: m(13), resultingIncome: m(10) },
      { type: InvestmentType.Regular, cost: m(20), resultingIncome: m(18) },
      { type: InvestmentType.Regular, cost: m(40), resultingIncome: m(30) },
      { type: InvestmentType.Regular, cost: m(35), resultingIncome: m(45) },
    ]
  },
  {
    index: 38,
    type: FieldType.Pip,
    name: 'пипка',
    cases: [
      {case: 'р', value: 'пипку'},
      {case: 'д', value: 'пипки'},
      {case: 'в', value: 'пипку'},
      {case: 'п', value: 'пипке'},
    ],
  },
  {
    index: 39,
    type: FieldType.Firm,
    name: 'France Press',
    country: Country.FRA,
    industry: Industry.Media,
    investments: [
      { type: InvestmentType.Regular, cost: m(25), resultingIncome: m(2.5) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(13) },
      { type: InvestmentType.Regular, cost: m(25), resultingIncome: m(24) },
      { type: InvestmentType.Regular, cost: m(45), resultingIncome: m(30) },
      { type: InvestmentType.Regular, cost: m(40), resultingIncome: m(45) },
    ]
  },
  {
    index: 40,
    type: FieldType.Firm,
    name: 'Toyota',
    country: Country.JAP,
    industry: Industry.Automotive,
    investments: [
      { type: InvestmentType.Regular, cost: m(15), resultingIncome: m(5) },
      { type: InvestmentType.Regular, cost: m(5), resultingIncome: m(10) },
      { type: InvestmentType.Regular, cost: m(5), resultingIncome: m(15) },
      { type: InvestmentType.Regular, cost: m(5), resultingIncome: m(30) },
    ]
  },
  {
    index: 41,
    type: FieldType.Firm,
    name: 'Weimar',
    country: Country.DDR,
    industry: Industry.Tourism,
    investments: [
      { type: InvestmentType.SacrificeCompany, cost: m(10), resultingIncome: m(10) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(20) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(0) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(0) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(100) },
      { type: InvestmentType.SacrificeCompany, cost: m(0), resultingIncome: m(200) },
    ]
  },
  {
    index: 42,
    type: FieldType.Firm,
    name: 'Zarichev Zaitung',
    country: Country.SWI,
    industry: Industry.Newspaper,
    investments: [
      { type: InvestmentType.Regular, cost: m(20), resultingIncome: m(3) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(6) },
    ]
  },
  {
    index: 43,
    type: FieldType.Firm,
    name: 'Колыма',
    cases: [
      {case: 'р', value: 'Колымы'},
      {case: 'д', value: 'Колыме'},
      {case: 'в', value: 'Колыму'},
      {case: 'п', value: 'Колыме'},
    ],
    country: Country.URS,
    industry: Industry.Healthcare,
    investments: [
      { type: InvestmentType.Regular, cost: m(20), resultingIncome: m(2) },
      { type: InvestmentType.Regular, cost: m(20), resultingIncome: m(20) },
      { type: InvestmentType.Regular, cost: m(20), resultingIncome: m(40) },
      { type: InvestmentType.Regular, cost: m(60), resultingIncome: m(60) },
      { type: InvestmentType.Regular, cost: m(60), resultingIncome: m(80) },
    ]
  },
  {
    index: 44,
    type: FieldType.Start,
    name: 'СТАРТ',
    cases: [
      {case: 'р', value: 'СТАРТа'},
      {case: 'д', value: 'СТАРТу'},
      {case: 'в', value: 'СТАРТ'},
      {case: 'п', value: 'СТАРТе'},
    ],
  },
  {
    index: 45,
    type: FieldType.Firm,
    name: 'Icarus',
    country: Country.HUN,
    industry: Industry.Automotive,
    investments: [
      { type: InvestmentType.SacrificeMonopoly, cost: m(20), resultingIncome: m(10) },
      { type: InvestmentType.Regular, cost: m(20), resultingIncome: m(40) },
      { type: InvestmentType.Regular, cost: m(20), resultingIncome: m(40) },
      { type: InvestmentType.SacrificeCompany, cost: m(20), resultingIncome: m(60) },
      { type: InvestmentType.SacrificeCompany, cost: m(20), resultingIncome: m(100) },
      { type: InvestmentType.SacrificeCompany, cost: m(20), resultingIncome: m(300) },
      { type: InvestmentType.SacrificeMonopoly, cost: m(0), resultingIncome: m(500) },
    ]
  },
  {
    index: 46,
    type: FieldType.Firm,
    name: 'Volksvagen',
    country: Country.BRD,
    industry: Industry.Automotive,
    investments: [
      { type: InvestmentType.Regular, cost: m(15), resultingIncome: m(5) },
      { type: InvestmentType.Regular, cost: m(15), resultingIncome: m(20) },
    ]
  },
  {
    index: 47,
    type: FieldType.Firm,
    name: 'Nizza',
    country: Country.FRA,
    industry: Industry.Healthcare,
    investments: [
      { type: InvestmentType.Regular, cost: m(60), resultingIncome: m(6) },
      { type: InvestmentType.Regular, cost: m(60), resultingIncome: m(30) },
      { type: InvestmentType.Regular, cost: m(60), resultingIncome: m(60) },
      { type: InvestmentType.Regular, cost: m(120), resultingIncome: m(90) },
      { type: InvestmentType.Regular, cost: m(120), resultingIncome: m(120) },
    ]
  },
  {
    index: 48,
    type: FieldType.Firm,
    name: 'Fiat',
    country: Country.ITA,
    industry: Industry.Automotive,
    investments: [
      { type: InvestmentType.Regular, cost: m(20), resultingIncome: m(5) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(10) },
    ]
  },
  {
    index: 49,
    type: FieldType.Firm,
    name: 'Мурзилка',
    cases: [
      {case: 'р', value: 'Мурзилки'},
      {case: 'д', value: 'Мурзилке'},
      {case: 'в', value: 'Мурзилку'},
      {case: 'п', value: 'Мурзилке'},
    ],
    country: Country.URS,
    industry: Industry.Newspaper,
    investments: [
      { type: InvestmentType.Regular, cost: m(15), resultingIncome: m(5) },
      { type: InvestmentType.Infinite, cost: m(5), resultingIncome: m(5) },
    ]
  },
  {
    index: 50,
    type: FieldType.Firm,
    name: 'Lozanna',
    country: Country.SWI,
    industry: Industry.Healthcare,
    investments: [
      { type: InvestmentType.Regular, cost: m(80), resultingIncome: m(8) },
      { type: InvestmentType.Regular, cost: m(70), resultingIncome: m(35) },
      { type: InvestmentType.Regular, cost: m(70), resultingIncome: m(70) },
      { type: InvestmentType.Regular, cost: m(140), resultingIncome: m(100) },
      { type: InvestmentType.Regular, cost: m(140), resultingIncome: m(140) },
    ]
  },
  {
    index: 51,
    type: FieldType.Firm,
    name: 'Fudziama',
    country: Country.JAP,
    industry: Industry.Tourism,
    investments: [
      { type: InvestmentType.SacrificeCompany, cost: m(10), resultingIncome: m(10) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(20) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(30) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(40) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(50) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(100) },
      { type: InvestmentType.SacrificeCompany, cost: m(0), resultingIncome: m(150) },
    ]
  },
  {
    index: 52,
    type: FieldType.Firm,
    name: 'Запорожец',
    cases: [
      {case: 'р', value: 'Запорожца'},
      {case: 'д', value: 'Запорожцу'},
      {case: 'в', value: 'Запорожец'},
      {case: 'п', value: 'Запорожце'},
    ],
    country: Country.URS,
    industry: Industry.Automotive,
    investments: [
      { type: InvestmentType.Regular, cost: m(15), resultingIncome: m(3) },
      { type: InvestmentType.Regular, cost: m(3), resultingIncome: m(6) },
      { type: InvestmentType.Regular, cost: m(3), resultingIncome: m(9) },
      { type: InvestmentType.Regular, cost: m(3), resultingIncome: m(15) },
      { type: InvestmentType.Regular, cost: m(3), resultingIncome: m(30) },
    ]
  },
  {
    index: 53,
    type: FieldType.Firm,
    name: 'Unita',
    country: Country.ITA,
    industry: Industry.Newspaper,
    investments: [
      { type: InvestmentType.Regular, cost: m(20), resultingIncome: m(3) },
      { type: InvestmentType.Regular, cost: m(10), resultingIncome: m(6) },
    ]
  },
  {
    index: 54,
    type: FieldType.Firm,
    name: 'Playboy',
    country: Country.USA_Int,
    industry: Industry.Newspaper,
    investments: [
      { type: InvestmentType.SacrificeMonopoly, cost: m(40), resultingIncome: m(20) },
      { type: InvestmentType.Regular, cost: m(40), resultingIncome: m(40) },
      { type: InvestmentType.SacrificeCompany, cost: m(40), resultingIncome: m(50) },
      { type: InvestmentType.SacrificeCompany, cost: m(0), resultingIncome: m(100) },
      { type: InvestmentType.SacrificeCompany, cost: m(0), resultingIncome: m(200) },
      { type: InvestmentType.SacrificeCompany, cost: m(0), resultingIncome: m(400) },
      { type: InvestmentType.SacrificeCompany, cost: m(0), resultingIncome: m(500) },
    ]
  },
  {
    index: 55,
    type: FieldType.Firm,
    name: 'Renult',
    country: Country.FRA,
    industry: Industry.Automotive,
    investments: [
      { type: InvestmentType.Regular, cost: m(15), resultingIncome: m(3) },
      { type: InvestmentType.Regular, cost: m(3), resultingIncome: m(5) },
      { type: InvestmentType.Regular, cost: m(30), resultingIncome: m(15) },
    ]
  },
  {
    index: 56,
    type: FieldType.Firm,
    name: 'Venesia',
    country: Country.ITA,
    industry: Industry.Tourism,
    investments: [
      { type: InvestmentType.Regular, cost: m(40), resultingIncome: m(4) },
      { type: InvestmentType.Regular, cost: m(40), resultingIncome: m(20) },
      { type: InvestmentType.Regular, cost: m(40), resultingIncome: m(40) },
      { type: InvestmentType.Regular, cost: m(80), resultingIncome: m(60) },
      { type: InvestmentType.Regular, cost: m(80), resultingIncome: m(80) },
    ]
  },
];

export function getPropertyPosOfPlayerId({
  playerId,
  gameState,
}: {
  playerId: string;
  gameState: FieldState[];
}): number[] {

  return gameState.filter(f => f.ownerId === playerId).map((f => f.index));
}

export function getPropertyTotalCost({
  playerId,
  gameState,
}: {
  playerId: string;
  gameState: FieldState[];
}): Money {

  const ownedFields = gameState.filter(f => f.ownerId === playerId);
  return ownedFields.reduce((sum, f) => sum + (getCompanyCostByIndex(f.index) ?? m(0)), m(0));
}

export function getFieldOwnerId({
  fieldIndex,
  gameState,
}: {
  fieldIndex: number;
  gameState: FieldState[];
}): string | undefined {
  const fieldState = getFieldStateByIndex(gameState, fieldIndex);
  if (! fieldState) return undefined;

  const ownerId = fieldState.ownerId;
  if (! ownerId) return undefined;

  return ownerId;
}

export function getCurrentInvestmentCost({
  fieldIndex,
  gameState,
}: {
  fieldIndex: number;
  gameState: FieldState[];
}): Money | undefined {
  const fieldDef = getFieldByIndex(fieldIndex);
  const fieldState = getFieldStateByIndex(gameState, fieldIndex);

  const level = fieldState?.investmentLevel ?? 0;
  if (level === 0) return undefined;
  const investmentOptions = fieldDef.investments;
  const lastInvestmentType = investmentOptions?.at(-1)?.type;

  if (lastInvestmentType === InvestmentType.Infinite && level >= (investmentOptions?.length ?? 0) - 1) {
    return investmentOptions?.at(-1)?.cost;
  } else {
    return investmentOptions?.at(level)?.cost;
  }
}

export function getNextInvestmentCost({
  fieldIndex,
  gameState,
}: {
  fieldIndex: number;
  gameState: FieldState[];
}): Money | undefined {
  const fieldDef = getFieldByIndex(fieldIndex);
  const fieldState = getFieldStateByIndex(gameState, fieldIndex);

  const level = fieldState?.investmentLevel ?? 0;
  const investmentOptions = fieldDef.investments;
  const lastInvestmentType = investmentOptions?.at(-1)?.type;

  if (lastInvestmentType !== InvestmentType.Infinite && level >= (investmentOptions?.length ?? 0) - 1) return undefined;

  if (lastInvestmentType === InvestmentType.Infinite && level >= (investmentOptions?.length ?? 0) - 1) {
    return investmentOptions?.at(-1)?.cost;
  } else {
    return investmentOptions?.at(level + 1)?.cost;
  }
}

export function getCurrentInvestmentType({
  fieldIndex,
  gameState,
}: {
  fieldIndex: number;
  gameState: FieldState[];
}): InvestmentType | undefined {
  const fieldDef = getFieldByIndex(fieldIndex);
  const fieldState = getFieldStateByIndex(gameState, fieldIndex);

  const level = fieldState?.investmentLevel ?? 0;
  if (level === 0) return undefined;
  const investmentOptions = fieldDef.investments;
  const lastInvestmentType = investmentOptions?.at(-1)?.type;

  if (lastInvestmentType === InvestmentType.Infinite && level >= (investmentOptions?.length ?? 0) - 1) {
    return InvestmentType.Infinite;
  } else {
    return investmentOptions?.at(level)?.type;
  }
}

export function getNextInvestmentType({
  fieldIndex,
  gameState,
}: {
  fieldIndex: number;
  gameState: FieldState[];
}): InvestmentType | undefined {
  const fieldDef = getFieldByIndex(fieldIndex);
  const fieldState = getFieldStateByIndex(gameState, fieldIndex);

  const level = fieldState?.investmentLevel ?? 0;
  const investmentOptions = fieldDef.investments;
  const lastInvestmentType = investmentOptions?.at(-1)?.type;

  if (lastInvestmentType !== InvestmentType.Infinite && level >= (investmentOptions?.length ?? 0) - 1) return undefined;

  if (lastInvestmentType === InvestmentType.Infinite && level >= (investmentOptions?.length ?? 0) - 1) {
    return InvestmentType.Infinite;
  } else {
    return investmentOptions?.at(level + 1)?.type;
  }
}
