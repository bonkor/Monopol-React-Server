import { useEffect, useRef } from "react";
import { monopolies } from "@shared/monopolies"; // импорт монополий
import { useGameStore } from '../store/useGameStore';
import { FieldType, fieldDefinitions } from '@shared/fields';

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

  // Закрытие при клике вне панели
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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

//console.log(structuredCountryBlocks);
  const industryBlocks = monopolies.filter(m => m.group === "industry");

  return (
    <div className="absolute inset-0 z-50 bg-transparent">
      <div
        ref={panelRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 max-h-[90vh] overflow-auto bg-white border border-gray-300 rounded-lg p-4 shadow-xl"
      >
        <div className="text-xl font-bold mb-2 text-center">Монополии</div>

        {/* Первая строка — Заголовки */}
        <div className="grid grid-cols-7 gap-4 mb-2">
          {structuredCountryBlocks.map((group, i) =>
            group.title ? (
              <div
                key={i}
                className={`col-span-${group.blocks.length} text-center font-bold text-sm`}
              >
                {group.title}
              </div>
            ) : (
              group.blocks.map((_, j) => <div key={`${i}-${j}`} />)
            )
          )}
        </div>

        {/* Вторая строка — Блоки стран */}
        <div className="grid grid-cols-7 gap-4 mb-6">
          {structuredCountryBlocks.flatMap((group, i) =>
            group.blocks.map(monopoly => {
              const owners = monopoly.companyIndexes
                .map(i => fieldStates.find(f => f.index === i)?.ownerId)
                .filter(Boolean);
              const uniqueOwners = [...new Set(owners)];
              const color =
                uniqueOwners.length === 1
                  ? players.find(p => p.id === uniqueOwners[0])?.color ?? "black"
                  : "black";

              return (
                <div key={monopoly.id} className="flex flex-col items-start text-sm">
                  <div
                    className="font-bold cursor-pointer"
                    style={{ color }}
                    onClick={e => {
                      e.stopPropagation();
                      handleMonopolyClick(monopoly.companyIndexes);
                    }}
                  >
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
            })
          )}
        </div>

        {/* Отрасли (7 на строку) */}
        <div className="grid grid-cols-7 gap-4">
          {industryBlocks.map(monopoly => {
            const owners = monopoly.companyIndexes
              .map(i => fieldStates.find(f => f.index === i)?.ownerId)
              .filter(Boolean);
            const uniqueOwners = [...new Set(owners)];
            const color =
              uniqueOwners.length === 1
                ? players.find(p => p.id === uniqueOwners[0])?.color ?? "black"
                : "black";

            return (
              <div key={monopoly.id} className="flex flex-col items-start text-sm">
                <div
                  className="font-bold cursor-pointer"
                  style={{ color }}
                  onClick={e => {
                    e.stopPropagation();
                    handleMonopolyClick(monopoly.companyIndexes);
                  }}
                >
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
          })}
        </div>
      </div>
    </div>
  );
}
