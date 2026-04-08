import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-call", (path) => {
      if (!connections[path]) {
        connections[path] = [];
      }

      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      const clients = connections[path];

      clients.forEach((id) => {
        io.to(id).emit("user-joined", socket.id, clients);
      });

      if (messages[path]) {
        messages[path].forEach((msg) => {
          io.to(socket.id).emit(
            "chat-message",
            msg.data,
            msg.sender,
            msg["socket-id-sender"],
          );
        });
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      const [roomKey, found] = Object.entries(connections).reduce(
        ([room, isFound], [key, value]) => {
          if (!isFound && value.includes(socket.id)) {
            return [key, true];
          }
          return [room, isFound];
        },
        ["", false],
      );

      if (found) {
        if (!messages[roomKey]) {
          messages[roomKey] = [];
        }

        messages[roomKey].push({
          sender: sender,
          data: data,
          "socket-id-sender": socket.id,
        });

        connections[roomKey].forEach((id) => {
          io.to(id).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      for (const [key, users] of Object.entries(connections)) {
        if (users.includes(socket.id)) {
          users.forEach((id) => {
            io.to(id).emit("user-left", socket.id);
          });

          const index = users.indexOf(socket.id);
          users.splice(index, 1);

          if (users.length === 0) {
            delete connections[key];
          }
        }
      }

      delete timeOnline[socket.id];
    });
  });

  return io;
};
