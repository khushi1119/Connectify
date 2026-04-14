import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};
let usernames = {};

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
      socket.roomPath = path; // Store room info on socket
      if (!connections[path]) {
        connections[path] = [];
      }

      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      const clients = connections[path];

      // Send the current list of names in this room to the NEW joiner
      const currentNames = {};
      clients.forEach(id => {
        if (usernames[id]) currentNames[id] = usernames[id];
      });
      socket.emit("user-metadata-sync", currentNames);

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

    socket.on("user-metadata", (name) => {
      socket.username = name;
      usernames[socket.id] = name; // Track globally for room syncing
      const roomKey = socket.roomPath;
      if (roomKey && connections[roomKey]) {
        connections[roomKey].forEach(id => {
          io.to(id).emit("user-metadata", socket.id, name);
        });
      }
    });

    socket.on("reaction", (emoji) => {
      const roomKey = socket.roomPath;
      if (roomKey && connections[roomKey]) {
        connections[roomKey].forEach(id => {
          if (id !== socket.id) {
            io.to(id).emit("reaction", socket.id, emoji);
          }
        });
      }
    });

    socket.on("screen-sharing", (isSharing) => {
      const roomKey = socket.roomPath;
      if (roomKey && connections[roomKey]) {
        connections[roomKey].forEach(id => {
          if (id !== socket.id) {
            io.to(id).emit("screen-sharing", socket.id, isSharing);
          }
        });
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      const roomKey = socket.roomPath;

      if (roomKey && connections[roomKey]) {
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
      delete usernames[socket.id];
    });
  });

  return io;
};
