export const proxify = (u?: string) =>
  u && u.startsWith('http') ? `/api/drive?url=${encodeURIComponent(u)}` : u || '/img/placeholder.svg';

export const onImgError = (orig?: string) =>
  (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.dataset.step === 'proxy') {
      img.dataset.step = 'orig';
      img.src = orig || '/img/placeholder.svg';
    } else {
      img.src = '/img/placeholder.svg';
    }
  };
