// Import necessary modules and utilities
import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadCloudinary } from "../utils/cloudinary.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// import {abc} from "../../public/temp"

// Route handler for registering a new user
const registerUser = asyncHandler(async (req, res) => {
  // Destructure fields from request body
  const { fullname, username, email, password } = req.body;
  console.log(req.body);

  // Validate that all required fields are provided
  if (
    [fullname, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required!");
  }

  // Check if a user with the same username or email already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists!");
  }

  // Extract local paths for avatar and cover image from request files
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0].path;
  }

  // Throw an error if avatar is not provided
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // Upload avatar and cover image to Cloudinary
  const avatar = await uploadCloudinary(avatarLocalPath);
  const coverImage = await uploadCloudinary(coverImageLocalPath);

  // Throw an error if avatar upload fails
  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed");
  }

  // Create a new user object and save it to the database
  const user = await User.create({
    fullname,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
  });
  console.log("User Object: ", user);

  // Retrieve the created user details from the database
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // Throw an error if user creation fails
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  // Return success response with created user details
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully!"));
});

// Export the registerUser route handler
export { registerUser };

// get user details -> validations -> user is existing or not( based on email / username ) -> chaek for images, avatar
// Upload item cloudinary, avatar ->
// Create user Object -> Create entry in Database
// check for user creation -> return response
