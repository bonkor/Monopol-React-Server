import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { getCompanyCostByIndex, moneyToDisplay, getPropertyTotalCost } from '@shared/fields';

const RefusalToChanceIcon = () => (
  <svg
    className="inline align-middle h-[1em] w-[1em]"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18 0C22.7739 0 27.3519 1.89681 30.7275 5.27246C34.1032 8.64812 36 13.2261 36 18C36 22.7739 34.1032 27.3519 30.7275 30.7275C27.3519 34.1032 22.7739 36 18 36C13.2261 36 8.64812 34.1032 5.27246 30.7275C1.89681 27.3519 0 22.7739 0 18C5.05128e-07 13.2261 1.89681 8.64812 5.27246 5.27246C8.64812 1.89681 13.2261 5.05135e-07 18 0ZM23.9424 13.4707C23.9122 13.6808 23.8707 13.8898 23.8164 14.0967C23.5218 15.2182 22.886 16.224 21.9951 16.9785L20.3145 18.4004C20.1037 18.5809 19.934 18.8035 19.8174 19.0537C19.7008 19.3039 19.6395 19.5762 19.6377 19.8516V21C19.6377 21.4284 19.4651 21.8396 19.1582 22.1426C18.8513 22.4453 18.4349 22.6152 18.001 22.6152C17.567 22.6151 17.1506 22.4454 16.8438 22.1426C16.548 21.8507 16.3783 21.4583 16.3662 21.0469L8.18555 29.2275C9.40544 30.2939 10.7919 31.1575 12.293 31.7793C14.1023 32.5287 16.0416 32.9141 18 32.9141C21.9555 32.9141 25.7489 31.3429 28.5459 28.5459C31.3429 25.7489 32.9141 21.9555 32.9141 18C32.9141 14.3789 31.596 10.8948 29.2275 8.18555L23.9424 13.4707ZM18.001 23.6924C18.5798 23.6924 19.1357 23.9193 19.5449 24.3232C19.9539 24.727 20.1835 25.2748 20.1836 25.8457C20.1836 26.4168 19.954 26.9652 19.5449 27.3691C19.1357 27.7731 18.5798 28 18.001 28C17.4223 27.9999 16.8672 27.773 16.458 27.3691C16.0488 26.9652 15.8193 26.4169 15.8193 25.8457C15.8195 25.2747 16.0489 24.727 16.458 24.3232C16.8672 23.9194 17.4223 23.6925 18.001 23.6924ZM18 3.08594C16.0416 3.08594 14.1023 3.47132 12.293 4.2207C10.4835 4.97022 8.83902 6.06918 7.4541 7.4541C6.06918 8.83902 4.97022 10.4835 4.2207 12.293C3.47132 14.1023 3.08594 16.0416 3.08594 18C3.08594 19.9584 3.47132 21.8977 4.2207 23.707C4.84228 25.2077 5.70554 26.5938 6.77148 27.8135L16.8086 17.7764C17.1191 17.0814 17.5846 16.4547 18.1826 15.9492L19.8652 14.5273C20.2489 14.2027 20.5224 13.7699 20.6494 13.2871C20.7764 12.8041 20.7506 12.2942 20.5752 11.8262C20.3998 11.3582 20.0838 10.9541 19.6689 10.6689C19.2541 10.3839 18.7604 10.2305 18.2549 10.2305H18.001C16.4954 10.2307 15.2736 11.4369 15.2734 12.9229V13.1533C15.2734 13.5817 15.1009 13.993 14.7939 14.2959C14.487 14.5988 14.0708 14.7686 13.6367 14.7686C13.2027 14.7686 12.7864 14.5988 12.4795 14.2959C12.1725 13.993 12 13.5817 12 13.1533V12.9229C12.0001 11.352 12.6324 9.84511 13.7578 8.73438C14.8832 7.62382 16.4096 7.00009 18.001 7H18.2549C19.4287 7.00062 20.5739 7.35635 21.5371 8.01855C22.5004 8.68088 23.2352 9.61835 23.6426 10.7051C23.6644 10.7633 23.6843 10.8221 23.7041 10.8809L27.8135 6.77148C25.1043 4.40356 21.6206 3.08594 18 3.08594Z" fill="black"/>
  </svg>
);
const InTaxiIcon = () => (
  <svg
    className="inline align-middle h-[1em] w-[1em]"
    viewBox="0 0 37 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M8 8H1V1H8V8H15V1H22V8H29V1H36V8H29V15H22V8H15V15H8V8Z" fill="black"/>
    <path d="M1 8H36V1H29V15H22V1H15V15H8V1H1V8Z" stroke="black"/>
  </svg>
);
const InJailIcon = () => (
  <svg
    className="inline align-middle h-[1em] w-[1em]"
    viewBox="0 0 31 29"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M8.5 0V29M23 0V29M0 9H31M0 22H31M12 6.5L5.5 12M26.5 6.5L20.5 12M12 19L5.5 24.5M26.5 19L20.5 24.5" stroke="black" stroke-width="2"/>
  </svg>
);

interface PlayerListProps {
  onPlayerClick?: (playerId: number) => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({ onPlayerClick }) => {
  const players = useGameStore((s) => s.players);
  const localPlayerIds = useGameStore((s) => s.localPlayerIds);
  const currentTurnPlayerId = useGameStore((s) => s.currentPlayerId);
  const lastLocalPlayerId = useGameStore((s) => s.lastLocalPlayerId);
  const fieldStates = useGameStore((s) => s.fieldStates);

  return (
    <div className="overflow-y-auto max-h-[300px] border rounded text-sm font-mono">
      <table className="w-full table-fixed">
      <colgroup>
        {['1.5rem', '4.5rem', '4.5rem', '2.5rem', '4.5rem', 'auto'].map((width, i) => (
          <col key={i} style={{ width }} />
        ))}
      </colgroup>
        <tbody>
          {players.map((player) => {
            const isLocal = localPlayerIds.find(p => p === player.id);
            const isCurrent = player.id === currentTurnPlayerId;
            const ownedFields = fieldStates.filter(f => f.ownerId === player.id);
            const firmCount = ownedFields.length;
            const totalCost = getPropertyTotalCost({playerId: player.id, gameState: fieldStates});
            const textColor = player.color;

            return (
              <tr
                key={player.id}
                className={`cursor-pointer ${player.isBankrupt || player.isOffline ? 'text-gray-400' : ''} ${player.id === lastLocalPlayerId ? 'bg-gray-400' : ''}`}
                onClick={() => onPlayerClick?.(player.id)}
              >
                {/* Индикатор хода */}
                <td className="px-1 py-1 w-4 text-center" title="Ход">
                  {isCurrent ? '➡' : ''}
                </td>

                {/* Имя */}
                <td
                  className="px-2 py-1 truncate"
                  title="Имя игрока"
                >
                  <span style={{ color: textColor, fontWeight: isLocal ? 'bold' : 'normal' }}>
                    {player.name}
                  </span>
                </td>

                {/* Баланс */}
                <td
                  className={`px-2 py-1 text-right ${player.balance < 0 ? 'text-red-900' : ''}`}
                  title="Баланс"
                >
                  {moneyToDisplay(player.balance)}
                </td>

                {/* Кол-во фирм */}
                <td
                  className="px-2 py-1 text-center"
                  title="Количество фирм"
                >
                  {firmCount}
                </td>

                {/* Общая стоимость */}
                <td
                  className="px-2 py-1 text-right"
                  title="Общая стоимость фирм"
                >
                  {moneyToDisplay(totalCost)}
                </td>

                {/* Статусы */}
                <td
                  className="px-2 py-1 text-left"
                  title="Статусы"
                >
                  {player.inJail &&
                    <span key={`inJail`} title="В тюрьме" className="inline-block mx-[3px]">
                      <InJailIcon />
                    </span>
                   }
                  {player.inTaxi &&
                    <span key={`inTaxi`} title="В такси" className="inline-block mx-[3px]">
                      <InTaxiIcon />
                    </span>
                   }
                  {player.refusalToPay > 0 && 
                    <span key={`refusalToPay`} title="Отказ от оплаты" className="inline-block mx-[3px]">
                      {'o'.repeat(player.refusalToPay)}
                    </span>
                  }
                  {player.refusalToChance > 0 &&
                    [...Array(player.refusalToChance)].map((_, i) => (
                      <span key={`refusal-${i}`} title="Отказ от шанса" className="inline-block mx-[3px]">
                        <RefusalToChanceIcon />
                      </span>
                    ))
                  }
                  {player.plusStart > 0 &&
                    <span key={`plusStart`} title="Плюс старт" className="inline-block mx-[3px]">
                      {'+st'.repeat(player.plusStart)}
                    </span>
                  }
                  {player.plusStart < 0 &&
                    <span key={`minusStart`} title="Минус старт" className="inline-block mx-[3px]">
                      {'-st'.repeat(-player.plusStart)}
                    </span>
                  }
                  {player.sequester > 0 &&
                    <span key={`sequester`} title="Секвестр" className="inline-block mx-[3px]">
                      {`seq:${player.sequester}`}
                    </span>
                  }
                  {player.turnToStart > 0 &&
                    <span key={`turnToStart`} title="Свернуть к старту" className="inline-block mx-[3px]">
                      {'↴'.repeat(player.turnToStart)}
                    </span>
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
