const audioCache: Record<string, HTMLAudioElement> = {};

export function playSound(name: string, volume = 1) {
  if (!audioCache[name]) {
    audioCache[name] = new Audio(`/sounds/${name}.mp3`);
  }

  const sound = audioCache[name].cloneNode() as HTMLAudioElement;
  sound.volume = volume;
  sound.play().catch(() => {}); // Игнорируем ошибки (например, автозапуск не разрешён)
}
