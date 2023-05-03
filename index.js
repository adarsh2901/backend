import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import { createPost } from "./controllers/posts.js";
import { register } from "./controllers/auth.js";
import { verifyToken } from "./middleware/auth.js";
import User from "./models/User.js";
import Post from "./models/Post.js";
import { users, posts } from "./data/index.js";

//CONFIGURATIONS
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(helmet()); //security measures
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common")); //used for HTTP request logging, "common" is a predefined format of morgan which includes remote IP address, the HTTP method, the requested URL, the HTTP version, the status code, the size of the response body, and the referrer URL
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true })); //By using these two lines, you are enabling your server to handle requests with JSON or URL-encoded request bodies up to 30 megabytes in size
app.use(cors()); //cross origin resource sharing
app.use("/assets", express.static(path.join(__dirname, "public/assets"))); //images are stored locally hence this line

//FILE STORAGE
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/assets"); //whenever someone uploads a file on our website it will be stored in this folder
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

//ROUTES with FILES
//because we need the upload function in register hence we have created it separately.
app.post("/auth/register", upload.single("picture"), register); //upload.single("picture") is used to upload a single file to public/assets folder and it is a middleware.
app.post("/posts", verifyToken, upload.single("picture"), createPost);

//ROUTES
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);

//MONGOOSE
const PORT = process.env.PORT || 3001;
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });

    //ADD DATA ONE TIME
    // User.insertMany(users);
    // Post.insertMany(posts);
  })
  .catch((error) => {
    console.log("Could not connect");
  });
