import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import routes from "./routes";
import auth from "./routes/auth";
import users from "./routes/users";
import crop from "./routes/crop";
import livestock from "./routes/livestock";
import machine from "./routes/machine";
import fish from "./routes/fish";
import document from "./routes/document";
import resource from "./routes/resource";
import chat from "./routes/chat";
import post from "./routes/post";

const app = express();

app.set('trust proxy', 1);

app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(408).send('Request timeout');
  });
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any localhost origin for development (inclduing Flutter Web)
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
       return callback(null, true);
    }

    const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", routes);
app.use("/api/auth", auth);
app.use("/api/users", users);
app.use("/api/cropsandpulses", crop);
app.use("/api/livestockindustry", livestock)
app.use("/api/fishery", fish)
app.use("/api/agriindustry", machine)
app.use("/api/document", document)
app.use("/api/resources", resource);
app.use("/api/chat", chat);
app.use("/api/post", post);

export default app;