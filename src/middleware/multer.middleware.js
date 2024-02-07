import multer from "multer";

// import fs from 'fs';

// // Define the destination directory path
// const destinationDirectory = '../../public/temp';

// // Create the directory if it does not exist
// if (!fs.existsSync(destinationDirectory)) {
//   fs.mkdirSync(destinationDirectory, { recursive: true });
// }

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../../public/temp/");
  },
  filename: function (req, file, cb) {
    // const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // cb(null, file.fieldname + "-" + uniqueSuffix);
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage, });
