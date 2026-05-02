import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useDispatch } from "react-redux";
import { addNotification } from "../store/slices/notificationSlice";
import { updateUser } from "../store/slices/authSlice";

let socketInstance = null;
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "";
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, "");
const socketBaseUrl = normalizedBaseUrl.endsWith("/api")
  ? normalizedBaseUrl.slice(0, -4)
  : normalizedBaseUrl;
const socketUrl = socketBaseUrl || "/";
const socketListeners = new Set();

const notifySocketListeners = () => {
  socketListeners.forEach((listener) => listener(socketInstance));
};

export const subscribeToSocket = (listener) => {
  socketListeners.add(listener);
  listener(socketInstance);

  return () => {
    socketListeners.delete(listener);
  };
};

export const useSocket = (userId) => {
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    socketInstance = io(socketUrl, {
      auth: { userId },
      withCredentials: true,
      transports: ["websocket"],
    });

    socketRef.current = socketInstance;
    notifySocketListeners();

    socketInstance.on("connect", () => {
      console.log("🔌 Socket connected:", socketInstance.id);
    });

    socketInstance.on("notification", (notification) => {
      dispatch(addNotification(notification));
    });

    socketInstance.on("balance:update", ({ currentBalance }) => {
      dispatch(updateUser({ currentBalance }));
    });

    return () => {
      if (socketInstance) {
        socketInstance.off("connect");
        socketInstance.off("notification");
        socketInstance.off("balance:update");
        socketInstance.disconnect();
        socketInstance = null;
        socketRef.current = null;
        notifySocketListeners();
      }
    };
  }, [userId, dispatch]);

  return socketRef.current;
};

export const getSocket = () => socketInstance;

export const useSocketClient = () => {
  const [socket, setSocket] = useState(socketInstance);

  useEffect(() => subscribeToSocket(setSocket), []);

  return socket;
};
