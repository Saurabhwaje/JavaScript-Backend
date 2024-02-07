import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadCloudinary = async (filePath) => {
  // console.log(">>>> ", filePath);
  try {
    if (!filePath) return null;

    // UPLOAD FILE ON CLOUD
    const response = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
      // format: "auto",
    });

    console.log(">> ", response.url);
    console.log(">> ", response);
    console.log("File Successfully Uploaded!");

    return response;
  } catch (error) {
    // Remove locally save temporary file upon the failed operation
    fs.unlinkSync(filePath);
    return null;
  }
};

export { uploadCloudinary };
