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
}: ClientPayload) => {
  return JSON.stringify({
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
  setErrorMessage?: (message: string | null) => void;
}) => {
  if (!socket || !authToken) {
    setErrorMessage?.("Socket or auth token is null");
    return;
  }
  socket.send(
    prepareMessage({
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
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
  setErrorMessage: (message: string | null) => void;
}) => {
  if (!socket) {
    setErrorMessage("Socket is null");
    return;
  }
  if (!authToken) {
    setErrorMessage("Auth token is null");
    return;
  }

  socket.send(
    prepareMessage({
      effect: SupportedEffects.addLivePlayer,
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
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
  setErrorMessage: (message: string | null) => void;
}) => {
  if (!socket) {
    setErrorMessage("Socket is null");
    return;
  }
  if (!authToken) {
    setErrorMessage("Auth token is null");
    return;
  }

  socket.send(
    prepareMessage({
      effect: SupportedEffects.incrementTurn,
      authToken,
      room: roomNumber,
      // todo: discard all
      toDiscardFromHand: [],
    })
  );
};

export const buyCard = ({
  socket,
  authToken,
  roomNumber,
  cardName,
  toDiscardFromHand,
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
  cardName: CardName;
  toDiscardFromHand: CardName[];
  setErrorMessage: (message: string | null) => void;
}) => {
  if (!socket) {
    setErrorMessage("Socket is null");
    return;
  }
  if (!authToken) {
    setErrorMessage("Auth token is null");
    return;
  }
  socket.send(
    prepareMessage({
      effect: SupportedEffects.buyCard,
      authToken,
      room: roomNumber,
      cardName,
      toDiscardFromHand,
    })
  );
};

export const playTreasure = ({
  socket,
  authToken,
  roomNumber,
  cardName,
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
  cardName: CardName;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  if (!socket) {
    setErrorMessage("Socket is null");
    return;
  }
  if (!authToken) {
    setErrorMessage("Auth token is null");
    return;
  }

  socket.send(
    prepareMessage({
      effect: SupportedEffects.playTreasure,
      authToken,
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
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  if (!socket) {
    setErrorMessage("Socket is null");
    return;
  }
  if (!authToken) {
    setErrorMessage("Auth token is null");
    return;
  }

  socket.send(
    prepareMessage({
      effect: SupportedEffects.resetPlayedTreasures,
      authToken,
      room: roomNumber,
      toDiscardFromHand: [],
    })
  );
};

export const playAction = ({
  socket,
  authToken,
  roomNumber,
  cardName,
  setErrorMessage,
}: {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
  cardName: CardName;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  if (!socket) {
    setErrorMessage("Socket is null");
    return;
  }
  if (!authToken) {
    setErrorMessage("Auth token is null");
    return;
  }

  socket.send(
    prepareMessage({
      effect: SupportedEffects.playAction,
      authToken,
      room: roomNumber,
      cardName,
      toDiscardFromHand: [cardName],
    })
  );
};

export const startGame = ({
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
  if (!socket) {
    setErrorMessage("Socket is null");
    return;
  }
  if (!authToken) {
    setErrorMessage("Auth token is null");
    return;
  }

  socket.send(
    prepareMessage({
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
  if (!socket) {
    setErrorMessage("Socket is null");
    return;
  }
  if (!authToken) {
    setErrorMessage("Auth token is null");
    return;
  }
  if (!chatMessage) {
    setErrorMessage("Chat message is empty");
    return;
  }

  socket.send(
    prepareMessage({
      effect: SupportedEffects.sendChatMessage,
      authToken,
      room: roomNumber,
      chatMessage,
      toDiscardFromHand: [],
    })
  );

  setInputValue("");
};
