const audioCache: Record<string, HTMLAudioElement> = {};

export function playSound(name: string, volume = 1) {
  if (!audioCache[name]) {
    audioCache[name] = new Audio(`src/assets/sounds/${name}.wav`);
  }

  const sound = audioCache[name].cloneNode() as HTMLAudioElement;
  sound.volume = volume;
  sound.play().catch(() => {}); // Игнорируем ошибки (например, автозапуск не разрешён)
}

// 💡 Разбудить аудио (например, при первом клике)
export function unlockAudio() {
  const silent = new Audio();
  silent.volume = 0;
  silent.play().catch(() => {});
}
