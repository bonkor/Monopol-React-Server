import { type Player } from '../shared/types';
import { type Money, getPropertyTotalCost, moneyToString } from '../shared/fields';
import { fieldState, broadcast, makePlayerBankrupt, getPlayers } from './game';
import { botPaymentDecision } from '../bot/bot';

export function handlePayment(payer: Player, receiver?: Player, amount: Money, reason: string) {
  if (payer.isBankrupt) return;

  if (payer.sequester > 0 || (receiver && receiver.sequester > 0)) {
    if (receiver) broadcast({ type: 'chat', text: `{p:${receiver.id}} ничего не получает от {p:${payer.id}:р} ${reason}. Секвестр` });
    else broadcast({ type: 'chat', text: `{p:${payer.id}} ничего не платит ${reason}. Секвестр` });
    return;
  }
  if (receiver && receiver.isBankrupt) {
    broadcast({ type: 'chat', text: `{p:${receiver.id}} ничего не получает от {p:${payer.id}:д} ${reason}. Банкрот` });
    return;
  }

  if (payer.refusalToPay > 0) {
    if (receiver) broadcast({ type: 'chat', text: `{p:${payer.id}} должен заплатить {p:${receiver.id}:д} ${moneyToString(amount)} ${reason}` });
    else broadcast({ type: 'chat', text: `{p:${payer.id}} должен заплатить ${moneyToString(amount)} ${reason}` });
    if (payer.bot) {
      processDecision(payer, receiver, amount, reason, botPaymentDecision(payer, amount));
      broadcast({ type: 'players', players: getPlayers() });
    } else
      payer.pendingActions.push({
        type: 'payment',
        to: receiver?.id,
        amount,
        reason,
      });
    return; // ничего не делаем сразу
  }

  processPayment(payer, receiver, amount, reason);
}

export function processDecision(payer: Player, receiver?: Player, amount: Money, reason: string, pay: boolean) {
  const recName = receiver?.name || null;
  const prefix = pay ? 'платит' : 'отказался платить';
  const recipientPart = recName ? ` ${recName}` : '';
  const mes = `${payer.name} ${prefix}${recipientPart} ${moneyToString(amount)} ${reason}`;

  if (pay) {
    processPayment(payer, receiver, amount, reason);
  } else {
    payer.refusalToPay -= 1;
    broadcast({ type: 'chat', text: mes });
  }
}

export function processPayment(payer: Player, receiver?: Player, amount: Money, reason: string) {
  if (payer.sequester > 0 || (receiver && receiver.sequester > 0)) {
    if (receiver) broadcast({ type: 'chat', text: `{p:${receiver.id}} ничего не получает от {p:${payer.id}:р} ${reason}. Секвестр` });
    else broadcast({ type: 'chat', text: `{p:${payer.id}} ничего не платит ${reason}. Секвестр` });
    return;
  }
  if (receiver && receiver.isBankrupt) {
    broadcast({ type: 'chat', text: `{p:${receiver.id}} ничего не получает от {p:${payer.id}:р} ${reason}. Банкрот` });
    return;
  }

  const totalAssets = Number((payer.balance + getPropertyTotalCost({playerId: payer.id, gameState: fieldState})).toFixed(2));

  if (amount <= totalAssets) {
    payer.balance -= amount;
    if (receiver) {
      receiver.balance += amount;
      broadcast({ type: 'chat', text: `{p:${receiver.id}} получает от {p:${payer.id}:р} ${moneyToString(amount)} ${reason}` });
    } else {
      broadcast({ type: 'chat', text: `{p:${payer.id}} платит ${moneyToString(amount)} ${reason}` });
    }
  } else {
    payer.balance = 0;
    makePlayerBankrupt(payer.id);
    if (receiver) {
      receiver.balance += totalAssets;
      broadcast({ type: 'chat', text: `{p:${receiver.id}} получает от {p:${payer.id}:р} ${moneyToString(totalAssets)} ${reason}. Больше не может.` });
    }
  }
}
