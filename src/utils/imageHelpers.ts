// Image preloader utility
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Batch image preloader
export const preloadImages = async (urls: string[]): Promise<void[]> => {
  const promises = urls.map(url => preloadImage(url));
  return Promise.all(promises);
};