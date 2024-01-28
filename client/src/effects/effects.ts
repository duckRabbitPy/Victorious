import {
  CardName,
  ClientPayload,
  SupportedEffects,
} from "../../../shared/common";

const prepareMessage = ({
  effect,
  authToken,
  room,
  cardName,
  toDiscardFromHand,
  chatMessage,
  mutationIndex,
}: ClientPayload) => {
  return JSON.stringify({
    mutationIndex,
    effect,
    authToken,
    room,
    cardName,
    toDiscardFromHand,
    chatMessage,
  });
};

export const getInitialGameState = ({
  socket,
  authToken,
  roomNumber,
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
  setErrorMessage: (message: string | null) => void;
}) => {
  if (!socket || !authToken) {
    setErrorMessage(!socket ? "Socket is null" : "Auth token is null");
    return;
  }

  socket.send(
    prepareMessage({
      mutationIndex: -1,
      effect: SupportedEffects.getCurrentGameState,
      room: roomNumber,
      authToken,
      toDiscardFromHand: [],
    })
  );
};

export const addNewPlayer = ({
  socket,
  authToken,
  roomNumber,
  mutationIndex,
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
  mutationIndex: number;
  setErrorMessage: (message: string | null) => void;
}) => {
  if (!socket || !authToken) {
    setErrorMessage(!socket ? "Socket is null" : "Auth token is null");
    return;
  }

  socket.send(
    prepareMessage({
      mutationIndex,
      effect: SupportedEffects.addLivePlayer,
      authToken,
      room: roomNumber,
      toDiscardFromHand: [],
    })
  );
};

export const addBotPlayer = ({
  socket,
  authToken,
  roomNumber,
  mutationIndex,
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
  mutationIndex: number;
  setErrorMessage: (message: string | null) => void;
}) => {
  if (!socket || !authToken) {
    setErrorMessage(!socket ? "Socket is null" : "Auth token is null");
    return;
  }

  socket.send(
    prepareMessage({
      mutationIndex,
      effect: SupportedEffects.addBotPlayer,
      authToken,
      room: roomNumber,
      toDiscardFromHand: [],
    })
  );
};

export const incrementTurn = ({
  socket,
  authToken,
  roomNumber,
  mutationIndex,
  audio,
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  audio: HTMLAudioElement | undefined;
  roomNumber: number;
  mutationIndex: number;
  setErrorMessage: (message: string | null) => void;
}) => {
  if (!socket || !authToken) {
    setErrorMessage(!socket ? "Socket is null" : "Auth token is null");
    return;
  }

  audio?.play();
  socket.send(
    prepareMessage({
      mutationIndex,
      effect: SupportedEffects.incrementTurn,
      authToken,
      room: roomNumber,
      // todo: discard all
      toDiscardFromHand: [],
    })
  );
};

export const handleBotPlayerTurn = ({
  socket,
  authToken,
  roomNumber,
  mutationIndex,
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
  mutationIndex: number;
  setErrorMessage: (message: string | null) => void;
}) => {
  if (!socket || !authToken) {
    setErrorMessage(!socket ? "Socket is null" : "Auth token is null");
    return;
  }

  socket.send(
    prepareMessage({
      mutationIndex,
      effect: SupportedEffects.handleBotPlayerTurn,
      authToken,
      room: roomNumber,
      toDiscardFromHand: [],
    })
  );
};

export const buyCard = ({
  socket,
  authToken,
  roomNumber,
  cardName,
  mutationIndex,
  toDiscardFromHand,
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
  cardName: CardName;
  mutationIndex: number;
  toDiscardFromHand: CardName[];
  setErrorMessage: (message: string | null) => void;
}) => {
  if (!socket || !authToken) {
    setErrorMessage(!socket ? "Socket is null" : "Auth token is null");
    return;
  }

  socket.send(
    prepareMessage({
      mutationIndex,
      effect: SupportedEffects.buyCard,
      authToken,
      room: roomNumber,
      cardName,
      toDiscardFromHand,
    })
  );
};

export const gainCard = ({
  socket,
  authToken,
  roomNumber,
  cardName,
  mutationIndex,
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
  cardName: CardName;
  mutationIndex: number;
  setErrorMessage: (message: string | null) => void;
}) => {
  if (!socket || !authToken) {
    setErrorMessage(!socket ? "Socket is null" : "Auth token is null");
    return;
  }

  socket.send(
    prepareMessage({
      mutationIndex,
      effect: SupportedEffects.gainCard,
      authToken,
      room: roomNumber,
      cardName,
      toDiscardFromHand: [],
    })
  );
};

export const playTreasure = ({
  socket,
  authToken,
  roomNumber,
  cardName,
  mutationIndex,
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
  cardName: CardName;
  mutationIndex: number;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  if (!socket || !authToken) {
    setErrorMessage(!socket ? "Socket is null" : "Auth token is null");
    return;
  }

  socket.send(
    prepareMessage({
      effect: SupportedEffects.playTreasure,
      authToken,
      mutationIndex,
      room: roomNumber,
      cardName,
      toDiscardFromHand: [],
    })
  );
};

export const trashCardToMeetDemand = ({
  socket,
  authToken,
  roomNumber,
  cardName,
  mutationIndex,
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
  cardName: CardName;
  mutationIndex: number;

  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  if (!socket || !authToken) {
    setErrorMessage(!socket ? "Socket is null" : "Auth token is null");
    return;
  }

  socket.send(
    prepareMessage({
      effect: SupportedEffects.trashCardToMeetDemand,
      authToken,
      mutationIndex,
      room: roomNumber,
      cardName,
      toDiscardFromHand: [],
    })
  );
};

export const resetPlayedTreasures = ({
  socket,
  authToken,
  roomNumber,
  mutationIndex,
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
  mutationIndex: number;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  if (!socket || !authToken) {
    setErrorMessage(!socket ? "Socket is null" : "Auth token is null");
    return;
  }

  socket.send(
    prepareMessage({
      effect: SupportedEffects.resetPlayedTreasures,
      authToken,
      room: roomNumber,
      mutationIndex,
      toDiscardFromHand: [],
    })
  );
};

export const playAction = ({
  socket,
  authToken,
  roomNumber,
  cardName,
  mutationIndex,
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
  cardName: CardName;
  mutationIndex: number;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  if (!socket || !authToken) {
    setErrorMessage(!socket ? "Socket is null" : "Auth token is null");
    return;
  }

  socket.send(
    prepareMessage({
      effect: SupportedEffects.playAction,
      authToken,
      room: roomNumber,
      cardName,
      mutationIndex,
      toDiscardFromHand: [cardName],
    })
  );
};

export const startGame = ({
  socket,
  authToken,
  roomNumber,
  mutationIndex,
  audio,
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
  audio: HTMLAudioElement | undefined;
  mutationIndex: number;
  setErrorMessage: (message: string | null) => void;
}) => {
  if (!socket || !authToken) {
    setErrorMessage(!socket ? "Socket is null" : "Auth token is null");
    return;
  }

  audio?.play();
  socket.send(
    prepareMessage({
      mutationIndex,
      effect: SupportedEffects.startGame,
      authToken,
      room: roomNumber,
      toDiscardFromHand: [],
    })
  );
};

export const getInititalChatLog = ({
  socket,
  authToken,
  roomNumber,
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
  setErrorMessage: (message: string | null) => void;
}) => {
  if (!socket || !authToken) {
    setErrorMessage("Socket or auth token is null");
    return;
  }

  socket.send(
    prepareMessage({
      mutationIndex: -1,
      effect: SupportedEffects.getCurrentChatLog,
      room: roomNumber,
      authToken,
      toDiscardFromHand: [],
    })
  );
};

export const sendChatMessage = ({
  socket,
  authToken,
  roomNumber,
  chatMessage,
  setInputValue,
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
  chatMessage: string | null;
  setInputValue: React.Dispatch<React.SetStateAction<string | null>>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  if (!socket || !authToken) {
    setErrorMessage(!socket ? "Socket is null" : "Auth token is null");
    return;
  }

  if (!chatMessage) {
    setErrorMessage("Chat message is empty");
    return;
  }

  socket.send(
    prepareMessage({
      mutationIndex: -1,
      effect: SupportedEffects.sendChatMessage,
      authToken,
      room: roomNumber,
      chatMessage,
      toDiscardFromHand: [],
    })
  );

  setInputValue("");
};
