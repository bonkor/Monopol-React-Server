import { useEffect, useRef } from "react";
import { monopolies } from "@shared/monopolies"; // импорт монополий
import { useGameStore } from '../store/useGameStore';
import { fieldDefinitions, getFieldByIndex } from '@shared/fields';

type MonopolyBlockProps = {
  monopolyId: string;
  monopoly: typeof monopolies[number];
  players: Player[];
  fieldStates: FieldState[];
  handleMonopolyClick: (companyIndexes: number[]) => void;
  handleFirmClick: (index: number) => void;
};

export function MonopolyGroupTitle({
  monopolyId,
  monopoly,
  players,
  fieldStates,
  handleMonopolyClick,
}: MonopolyBlockProps) {
  const ownerIds = monopoly.companyIndexes.map(
    i => fieldStates.find(f => f.index === i)?.ownerId ?? null
  );

  // Проверяем, что у всех есть владелец (ownerId !== null)
  const allOwned = ownerIds.every(id => id !== null);

  // Получаем уникальные ownerId
  const uniqueOwners = [...new Set(ownerIds.filter(id => id !== null))];

  const isFullMonopoly = allOwned && uniqueOwners.length === 1;

  const color = isFullMonopoly
    ? players.find(p => p.id === uniqueOwners[0])?.color ?? "black"
    : "black";

  return (
    <div
      key={monopolyId}
      className={`${getColSpanClass(monopoly.blocks.length)} text-center font-bold text-sm cursor-pointer -translate-x-7`}
      style={{ color }}
      onClick={e => {
        e.stopPropagation();
        handleMonopolyClick(monopoly.companyIndexes);
      }}
    >
      {monopoly.name}
    </div>
  );
}

function MonopolyBlock({
  monopolyId,
  monopoly,
  players,
  fieldStates,
  handleMonopolyClick,
  handleFirmClick,
}: MonopolyBlockProps) {
  const ownerIds = monopoly.companyIndexes.map(
    i => fieldStates.find(f => f.index === i)?.ownerId ?? null
  );

  // Проверяем, что у всех есть владелец (ownerId !== null)
  const allOwned = ownerIds.every(id => id !== null);

  // Получаем уникальные ownerId
  const uniqueOwners = [...new Set(ownerIds.filter(id => id !== null))];

  const isFullMonopoly = allOwned && uniqueOwners.length === 1;

  const color = isFullMonopoly
    ? players.find(p => p.id === uniqueOwners[0])?.color ?? "black"
    : "black";

  const bgColor = isFullMonopoly
    ? `${players.find(p => p.id === uniqueOwners[0])?.color ?? "black"}20`
    : "transparent";

  const firstFirm = getFieldByIndex(monopoly.companyIndexes[0]);
  const icon = monopoly.group === 'country'
    ? `#icon-flag-${firstFirm.country}-Muted`
    : `#icon-industries-${firstFirm.industry}-Muted`;

  return (
    <div
      key={monopolyId}
      className="flex flex-col items-start text-sm"
      style={{ backgroundColor: bgColor }}
    >
      <div
        className="font-bold cursor-pointer  flex items-center gap-1"
        style={{ color }}
        onClick={e => {
          e.stopPropagation();
          handleMonopolyClick(monopoly.companyIndexes);
        }}
      >
        {/*<svg className="inline align-middle h-[1em] w-auto">
          <use href={icon} />
        </svg>*/}
        {monopoly.name}
      </div>
      <div className="mt-1 space-y-1">
        {monopoly.companyIndexes.map(index => {
          const field = fieldDefinitions.find(f => f.index === index);
          const ownerId = fieldStates.find(f => f.index === index)?.ownerId;
          const companyColor = ownerId
            ? players.find(p => p.id === ownerId)?.color ?? "gray"
            : "gray";

          return (
            <div
              key={index}
              className="cursor-pointer"
              style={{ color: companyColor }}
              onClick={e => {
                e.stopPropagation();
                handleFirmClick(index);
              }}
            >
              {field?.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getColSpanClass(n: number): string {
  return {
    1: "col-span-1",
    2: "col-span-2",
    3: "col-span-3",
    4: "col-span-4",
    5: "col-span-5",
    6: "col-span-6",
    7: "col-span-7",
  }[n] ?? "";
}

type Props = {
  onClose: () => void;
  handleMonopolyClick: (companyIndexes: number[]) => void;
  handleFirmClick: (index: number) => void;
};

export function MonopolyListPanel({ onClose, handleMonopolyClick, handleFirmClick }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  const fieldStates = useGameStore(s => s.fieldStates);
  const players = useGameStore(s => s.players);

  useEffect(() => {
    function handleClickAnywhere() {
      setTimeout(() => {
        onClose();
      }, 0); // Позволяет onClick вложенных элементов выполниться первыми
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("click", handleClickAnywhere);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClickAnywhere);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Структурируем монополии
  const groupedIds = new Set(
    monopolies.flatMap(m => m.ids ?? [])
  );

  const countryGroups = monopolies.filter(m => m.ids);
  const simpleCountries = monopolies.filter(
    m => m.group === "country" && !groupedIds.has(m.id)
  );

  const structuredCountryBlocks = [
    ...countryGroups.map(group => ({
      title: group.name,
      blocks: group.ids.map(id => monopolies.find(m => m.id === id)!),
    })),
    ...simpleCountries.map(m => ({
      title: null,
      blocks: [m],
    })),
  ];

  const industryBlocks = monopolies.filter(m => m.group === "industry" && m.inList !== false);

  return (
    <div className="absolute inset-0 z-50 bg-transparent">
      <div
        ref={panelRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 max-h-[90vh] overflow-auto bg-white border border-gray-300 rounded-lg p-4 shadow-xl select-none"
      >
        <div className="text-xl font-bold mb-2 text-center">Монополии</div>

        {/* Первая строка — Заголовки */}
        <div className="grid grid-cols-7 gap-1">
          {structuredCountryBlocks.map((group, i) =>
            group.title ? (
              <MonopolyGroupTitle
                key={group.title}
                monopolyId={group.title}
                monopoly={{
                  id: group.title,
                  name: group.title,
                  blocks: group.blocks,
                  companyIndexes: group.blocks.flatMap(b => b.companyIndexes),
                }}
                players={players}
                fieldStates={fieldStates}
                handleMonopolyClick={handleMonopolyClick}
              />
            ) : (
              group.blocks.map((_, j) => <div key={`${i}-${j}`} />)
            )
          )}
        </div>

        {/* Вторая строка — Блоки стран */}
        <div className="grid grid-cols-7 gap-4 mb-6">
          {structuredCountryBlocks.flatMap((group) =>
            group.blocks.map(monopoly => {
              return (
                <MonopolyBlock
                  key={monopoly.id}
                  monopolyId={monopoly.id}
                  monopoly={monopoly}
                  players={players}
                  fieldStates={fieldStates}
                  handleMonopolyClick={handleMonopolyClick}
                  handleFirmClick={handleFirmClick}
                />
              );
            })
          )}
        </div>

        {/* Отрасли (7 на строку) */}
        <div className="grid grid-cols-7 gap-4">
          {industryBlocks.map(monopoly => {
            return (
              <MonopolyBlock
                key={monopoly.id}
                monopolyId={monopoly.id}
                monopoly={monopoly}
                players={players}
                fieldStates={fieldStates}
                handleMonopolyClick={handleMonopolyClick}
                handleFirmClick={handleFirmClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
