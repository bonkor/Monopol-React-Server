import type { ServerToClientMessage, ClientToServerMessage } from '@shared/messages';
import { ErrorReason } from '@shared/messages';
import { useGameStore } from '../store/useGameStore';
import { useChatStore } from '../store/useChatStore';
import { Direction, getPlayerById } from '@shared/types';
import { FieldType, getFieldByIndex } from '@shared/fields';
import { openPropertyPanelExternally, closePropertyPanelExternally } from '../controllers/PropertyPanelController';
import { confirm, requestConfirmation } from '../controllers/ConfirmationController';

// это чтобы не забыть, как вызывать confirm отсюда
async function onSellRequest(field) {
    console.log('111');
  const result = await confirm(`Продаем ggg? Уже есть вложения`);
  if (result) {
    console.log('aaaa');
    // отправка на сервер
  }
}

export const socket = new WebSocket('ws://localhost:3000');

socket.onopen = () => {
  console.log('[WebSocket] connected');
};

function addChatMessage(str: string, from?: string): string {
  useChatStore.getState().addMessage({
    from: from,
    text: str,
  });
}

socket.onmessage = async (event) => {
  const message: ServerToClientMessage = JSON.parse(event.data);
  const { currentPlayerId, setPlayers, animatePlayerMovement, movePlayer, setCurrentPlayer,
    confirmLocalPlayer, removePendingName, setGameStarted, setError, players, localPlayerIds,
    setAllowDice, setGoStayDir, setAllowGoStayBut, setAllowCenterBut, setAllowEndTurn,
    setMyTurn, setFieldStates, updateFieldState, setLastLocalCurrentPlayer, myTurn } = useGameStore.getState();

  console.log(message);

  switch (message.type) {
    case 'players': {
      setPlayers(message.players);

      // обрабатываем отложенные платежи и потери
      const playerId = myTurn ? currentPlayerId : localPlayerIds.length === 1 ? localPlayerIds[0] : null;
      if (! playerId) break;
      const player = getPlayerById(message.players, playerId);
      if (player.pendingActions.length === 0) break;
      const action = player.pendingActions[0];

      switch (action.type) {
        case 'payment':
          const recipient = action.to ? getPlayerById(players, action.to) : null;
          const recName = recipient?.name || '';
          requestConfirmation({
            message: `Платим ${recName} ${action.amount} ${action.reason}?`,
            buttons: [
              {
                label: 'Отказаться',
                className: 'bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700',
                action: () => sendMessage({ type: 'payment-decision', playerId: playerId, pay: false }),
              },
              {
                label: 'Заплатить',
                className: 'bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700',
                action: () => sendMessage({ type: 'payment-decision', playerId: playerId, pay: true }),
              },
            ],
          });
          break;
        case 'loose':
console.log('ставлю loose');
          useGameStore.getState().setInteractionMode({ type: 'loose' });
          break;
      }
      break;
    }

    case 'player-registered':
      setError(null);
      confirmLocalPlayer(message.playerId, message.name);
      break;

    case 'field-states-init': {
      setFieldStates(message.fieldsStates);
      break;
    }

    case 'field-states-update': {
      updateFieldState(message.fieldState);
      break;
    }

    case 'game-started': {
      setGameStarted(true);

      const lPlayer = localPlayerIds[0];
      if (lPlayer) {
        setLastLocalCurrentPlayer(lPlayer);
      }

      addChatMessage(`Игра началась`);
      break;
    }

    case 'allow-go-stay-but': {
      const { playerId, dir } = message;

      setGoStayDir(dir);
      setAllowGoStayBut(true);
      break;
    }

    case 'allow-center-but': {
      setAllowCenterBut(true);
      break;
    }

    case 'dir-choose': {
      const { playerId, dir } = message;
      const player = players.find((p) => p.id === playerId);
      
      let d = '';
      switch (dir) {
        case Direction.Left:
          d = 'идет налево';
          break;
        case Direction.Right:
          d = 'идет направо';
          break;
        case Direction.Up:
          d = 'идет наверх';
          break;
        case Direction.Down:
          d = 'идет вниз';
          break;
        case Direction.Stay:
          d = 'решил остаться';
          break;
        case Direction.Move:
          d = 'решил перейти';
          break;
      }

      if (player) {
        addChatMessage(`{p:${player.id}} ${d}`);
      }
      break;
    }

    case 'allow-dice': {
      const { value } = message;
      useGameStore.getState().setDiceResult(value);
      setAllowDice(true);
      break;
    }

    case 'allow-end-turn': {
      setAllowEndTurn(true);
      break;
    }

    case 'allow-chance-decision': {
      const { playerId, text } = message;
      requestConfirmation({
        message: `Отказаться от вопроса "${text}"?`,
        buttons: [
          {
            label: 'Отказаться',
            className: 'bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700',
            action: () => sendMessage({ type: 'chance-decision', playerId: playerId, make: false }),
          },
          {
            label: 'Не отказываться',
            className: 'bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700',
            action: () => sendMessage({ type: 'chance-decision', playerId: playerId, make: true }),
          },
        ],
      });
      break;
    }

    case 'need-sell': {
      useGameStore.getState().setInteractionMode({ type: 'needSell' });
      break;
    }

    case 'need-sell-monopoly': {
      useGameStore.getState().setInteractionMode({ type: 'needSellMonopoly' });
      break;
    }
    case 'change': {
      useGameStore.getState().setInteractionMode({ type: 'change', targetFieldIndex: undefined });
      break;
    }

    case 'need-buy': {
      useGameStore.getState().setInteractionMode({ type: 'needBuy' });
      break;
    }

    case 'need-sacrifice': {
      useGameStore.getState().setInteractionMode({ type: 'sacrificeFromChance' });
      break;
    }

    case 'need-invest-free': {
      useGameStore.getState().setInteractionMode({ type: 'needInvestFree' });
      break;
    }

    case 'need-remove-invest': {
      useGameStore.getState().setInteractionMode({ type: 'needRemoveInvest' });
      break;
    }

    case 'choose-pos': {
      const { positions } = message;
      useGameStore.getState().setInteractionMode({ type: 'choosePos', positions: positions });
      break;
    }

    case 'chat': {
      addChatMessage(message.text, message.from);
      break;
    }

    case 'show-chance': {
      const { res1, res2 } = message;
      useGameStore.getState().addChanceToQueue(res1, res2);
      break;
    }

    case 'show-dice-result': {
      const { playerId, result } = message;
      useGameStore.getState().setDiceResult(result);

      const player = players.find((p) => p.id === playerId);
      if (player) {
        addChatMessage(`{p:${player.id}} бросил кубик и выбросил ${result}`);
      }
      break;
    }

    case 'move': {
      const player = players.find((p) => p.id === message.playerId);
      let pos;
      let name;
      if (player) {
        if (message.stay) {
          pos = player.position;
          addChatMessage(`{p:${player.id}} остается на {F:${pos}:п}`);
        } else {
          pos = message.path.at(-1)!;
          addChatMessage(`{p:${player.id}} переместился на {F:${pos};в}`);
        }
      }
      await animatePlayerMovement(message.playerId, message.path);
      if (myTurn) {
        const field = getFieldByIndex(pos);
        if (field.type === FieldType.Firm) {
          openPropertyPanelExternally(pos);
        } else {
          closePropertyPanelExternally();
        }
      }
      break;
    }

    case 'turn':
      const player = players.find((p) => p.id === message.playerId);
      setCurrentPlayer(message.playerId);
      addChatMessage(`ходит {p:${player.id}}`);
      const lPlayer = localPlayerIds.find((p) => p === message.playerId);
      if (lPlayer) {
        setMyTurn(true);
        setLastLocalCurrentPlayer(lPlayer);
      } else {
        setMyTurn(false);
      }
      break;

    case 'error':
      setError(message.message);

      if (message.reason === ErrorReason.NameTaken && message.name) {
        removePendingName(message.name);
      }

      break;
  }
};

export function sendMessage(msg: ClientToServerMessage) {
  socket.send(JSON.stringify(msg));
}
