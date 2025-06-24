import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { getCompanyCostByIndex, moneyToDisplay, getPropertyTotalCost } from '@shared/fields';

const RefusalToChanceIcon = () => (
  <svg
    className="inline align-middle h-[1em] w-[1em]"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M24.0013 16.2308C22.4955 16.2308 21.2734 17.4369 21.2734 18.9231V19.1535C21.2734 19.582 21.101 19.9928 20.7941 20.2958C20.4871 20.5987 20.0708 20.7689 19.6367 20.7689C19.2026 20.7689 18.7863 20.5987 18.4794 20.2958C18.1724 19.9928 18 19.582 18 19.1535V18.9231C18 17.3522 18.6323 15.8456 19.7577 14.7348C20.8832 13.624 22.4097 13 24.0013 13H24.2545C25.4285 13.0005 26.5742 13.3559 27.5375 14.0182C28.5008 14.6805 29.2355 15.6181 29.6429 16.7048C30.0502 17.7915 30.1107 18.9753 29.8161 20.0969C29.5214 21.2185 28.8859 22.2242 27.9949 22.9788L26.3146 24.4003C26.1037 24.5809 25.9344 24.8038 25.8177 25.0542C25.701 25.3045 25.6398 25.5765 25.638 25.852V27C25.638 27.4284 25.4656 27.8393 25.1587 28.1422C24.8517 28.4452 24.4354 28.6154 24.0013 28.6154C23.5672 28.6154 23.1509 28.4452 22.844 28.1422C22.537 27.8393 22.3646 27.4284 22.3646 27V25.852C22.3646 24.3508 23.028 22.9249 24.1825 21.9492L25.865 20.5277C26.2489 20.2029 26.5228 19.7699 26.6499 19.2868C26.7769 18.8037 26.7509 18.2939 26.5755 17.8258C26.4001 17.3578 26.0836 16.954 25.6686 16.6688C25.2536 16.3836 24.7601 16.2308 24.2545 16.2308H24.0013ZM24.0013 34C24.5801 34 25.1352 33.7731 25.5444 33.3692C25.9537 32.9652 26.1836 32.4174 26.1836 31.8462C26.1836 31.2749 25.9537 30.7271 25.5444 30.3232C25.1352 29.9192 24.5801 29.6923 24.0013 29.6923C23.4225 29.6923 22.8675 29.9192 22.4582 30.3232C22.0489 30.7271 21.819 31.2749 21.819 31.8462C21.819 32.4174 22.0489 32.9652 22.4582 33.3692C22.8675 33.7731 23.4225 34 24.0013 34Z" fill="black"/>
    <path d="M6 24C6 19.2261 7.89642 14.6477 11.2721 11.2721C14.6477 7.89642 19.2261 6 24 6C28.7739 6 33.3523 7.89642 36.7279 11.2721C40.1036 14.6477 42 19.2261 42 24C42 28.7739 40.1036 33.3523 36.7279 36.7279C33.3523 40.1036 28.7739 42 24 42C19.2261 42 14.6477 40.1036 11.2721 36.7279C7.89642 33.3523 6 28.7739 6 24ZM24 9.08571C22.0414 9.08571 20.102 9.47148 18.2926 10.221C16.4831 10.9705 14.8389 12.0691 13.454 13.454C12.0691 14.8389 10.9705 16.4831 10.221 18.2926C9.47148 20.102 9.08571 22.0414 9.08571 24C9.08571 25.9586 9.47148 27.898 10.221 29.7075C10.9705 31.5169 12.0691 33.1611 13.454 34.546C14.8389 35.9309 16.4831 37.0295 18.2926 37.779C20.102 38.5285 22.0414 38.9143 24 38.9143C27.9555 38.9143 31.749 37.343 34.546 34.546C37.343 31.749 38.9143 27.9555 38.9143 24C38.9143 20.0445 37.343 16.251 34.546 13.454C31.749 10.657 27.9555 9.08571 24 9.08571Z" fill="black"/>
    <path d="M35.5 12.5L12 36" stroke="black" stroke-width="2"/>
  </svg>
);
const InTaxiIcon = () => (
  <svg
    className="inline align-middle h-[1em] w-[1em]"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M13 24H6V17H13V24H20V17H27V24H34V17H41V24H34V31H27V24H20V31H13V24Z" fill="black"/>
    <path d="M6 24H41V17H34V31H27V17H20V31H13V17H6V24Z" stroke="black"/>
  </svg>
);
const InJailIcon = () => (
  <svg
    className="inline align-middle h-[1em] w-[1em]"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M16.5 10V39M31 10V39M8 19H39M8 32H39M20 16.5L13.5 22M34.5 16.5L28.5 22M20 29L13.5 34.5M34.5 29L28.5 34.5" stroke="black" stroke-width="2"/>
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
                    <span key={`inJail`} title="В тюрьме" className="inline-block mx-[1px]">
                      <InJailIcon />
                    </span>
                   }
                  {player.inTaxi &&
                    <span key={`inTaxi`} title="В такси" className="inline-block mx-[1px]">
                      <InTaxiIcon />
                    </span>
                   }
                  {player.refusalToPay > 0 && 'o'.repeat(player.refusalToPay)}
                  {player.refusalToChance > 0 &&
                    [...Array(player.refusalToChance)].map((_, i) => (
                      <span key={`refusal-${i}`} title="Отказ от шанса" className="inline-block mx-[1px]">
                        <RefusalToChanceIcon />
                      </span>
                    ))
                  }
                  {player.plusStart > 0 && ' ' + '+st'.repeat(player.plusStart)}
                  {player.plusStart < 0 && ' ' + '-st'.repeat(-player.plusStart)}
                  {player.sequester > 0 && ` seq:${player.sequester}`}
                  {player.turnToStart > 0 && ' ' + '↴'.repeat(player.turnToStart)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
