import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Message } from "../../typings";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";

let socket: Socket | null = null;

const ChatList = () => {
  const [message, setMessage] = useState<string>("");
  const [chat, setChat] = useState<Message[]>([]);
  const user = useSelector((state: RootState) => state.global.user);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const selectedOrder = useSelector(
    (state: RootState) => state.global.selectedOrder
  );

  useEffect(() => {
    if (!socket) {
        socket = io("http://localhost:8000");
    }

    return () => {
      if (!socket) return;
        socket.disconnect();
        socket = null;
    };
}, []);

useEffect(() => {
  // This will run every time the `chat` state changes
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [chat]);


  useEffect(() => {
    if (!user || !selectedOrder || !socket) return;

    const users = {
      from: user.isManufacturer
        ? selectedOrder.manufacturerId
        : selectedOrder.transporterId,
      to: user.isManufacturer
        ? selectedOrder.transporterId
        : selectedOrder.manufacturerId,
    };

    socket.emit("joinRoom", users);

    socket.on("message", (message: Message) => {
      // console.log("Message: ", message);
      setChat((prevChat) => [...prevChat, message]);

    });

    socket.on("chatHistory", (messages: Message[]) => {
      // console.log("Chat history: ", messages);
      setChat(messages);
    });
    return () => {
      if (socket) {
        socket.off("message", (message: Message) => {
          // console.log("Message: ", message);
          setChat((prevChat) => [...prevChat, message]);
        });
        socket.off("chatHistory", (messages: Message[]) => {
          // console.log("Chat history: ", messages);
          setChat(messages);
        });
      }
    };
  }, [user, selectedOrder]);

  const sendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !selectedOrder || !socket) return;
    socket.emit("message", {
      from: user.isManufacturer
        ? selectedOrder.manufacturerId
        : selectedOrder.transporterId,
      to: user.isManufacturer
        ? selectedOrder.transporterId
        : selectedOrder.manufacturerId,
      content: message,
    });
    setMessage("");
  };
  return (
    <div className="flex flex-col-reverse h-[86vh] bg-white w-1/2 rounded ">
      {selectedOrder?._id ? (
        <>
          <form onSubmit={sendMessage} className="flex justify-center p-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message..."
            />
            <button type="submit">Send</button>
          </form>
          <div className="overflow-y-auto h-[80vh]">
            {chat.map((message, index) => (
              // <div key={index}>{message.content}</div>
              <div
                key={index}
                className={`${
                  message.from === user?._id ? "text-right" : "text-left"
                }`}
              >
                <div className="font-bold p-3 rounded bg-gray-200 inline-block m-2"
                >{message.content}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </>
      ) : (
        <div>Select an order to chat</div>
      )}
    </div>
  );
};

export default ChatList;
