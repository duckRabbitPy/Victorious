const audioFiles = {
  clickSound:
    "https://res.cloudinary.com/dkytnwn87/video/upload/v1705754398/dominion/clickSound.mp3",
  positiveSound:
    "https://res.cloudinary.com/dkytnwn87/video/upload/v1705754154/dominion/positive.mp3",
  loseSound:
    "https://res.cloudinary.com/dkytnwn87/video/upload/v1710672578/dominion/Sad-Trombone-C1-www.fesliyanstudios.com_yskkqh.mp3",
  winSound:
    "https://res.cloudinary.com/dkytnwn87/video/upload/v1710672682/dominion/medieval-fanfare-6826_qeeesk.mp3",
};

export function useSound() {
  return Object.entries(audioFiles).reduce((acc, [soundOption, filePath]) => {
    acc[soundOption as keyof typeof acc] = createSound(filePath);
    return acc;
  }, {} as Record<keyof typeof audioFiles, HTMLAudioElement | undefined>);
}

function createSound(path: string) {
  return typeof Audio !== "undefined" ? new Audio(path) : undefined;
}

export default useSound;
