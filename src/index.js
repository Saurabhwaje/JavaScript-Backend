import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });

// // require("dotenv").config({path: './env'});

// import dotenv from "dotenv";
// import connectDB from "./db/index.js";
// import express from "express";
// import { app } from "./app.js";

// dotenv.config({
//   path: "./.env",
// });

// connectDB()
//   .then(() => {
//     app.listen(process.env.PORT || 8000, () => {
//       console.log(`App is listening at port: ${process.env.PORT || 8000}`);
//     });
//   })
//   .catch((error) => {
//     console.error(`Error connecting to database: ${error}`);
//   });
// app.on("error", (error) => {
//   console.error(`Server error: ${error}`);
// });

/*
import express from "express";
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("Error: ", error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(`App is listening on prot: ${process.env.PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
})();
*/
