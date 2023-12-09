import {
  CardName,
  ClientPayload,
  SupportedEffects,
} from "../../../shared/common";

const prepareMessage = ({ effect, authToken, room }: ClientPayload) => {
  return JSON.stringify({
    effect,
    authToken,
    room,
  });
};

export const getInititalGameState = ({
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
  socket?.send(
    prepareMessage({
      effect: SupportedEffects.getCurrentGameState,
      room: roomNumber,
      authToken,
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
    })
  );
};

export const buyCard = ({
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
    })
  );
};
