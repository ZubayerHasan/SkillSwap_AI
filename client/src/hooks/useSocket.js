import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useDispatch } from "react-redux";
import { addNotification } from "../store/slices/notificationSlice";
import { updateUser } from "../store/slices/authSlice";

let socketInstance = null;

export const useSocket = (userId) => {
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    socketInstance = io("/", {
      auth: { userId },
      withCredentials: true,
      transports: ["websocket"],
    });

    socketRef.current = socketInstance;

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
        socketInstance.disconnect();
        socketInstance = null;
      }
    };
  }, [userId, dispatch]);

  return socketRef.current;
};

export const getSocket = () => socketInstance;
