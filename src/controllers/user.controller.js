// Import necessary modules and utilities
import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadCloudinary } from "../utils/cloudinary.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Jwt } from "jsonwebtoken";
// import {abc} from "../../public/temp"

// generate access and refresh tokens
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong! While generating access token"
    );
  }
};

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

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!(email || username)) {
    throw new ApiError(400, "Username or Password is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = { httpOnly: true, secure: true };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  console.log(req.user);
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = { httpOnly: true, secure: true };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incommingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incommingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Invalid / Expired Refresh Token");
    }

    const { accessToken, genRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    const options = { httpOnly: true, secure: true };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", genRefreshToken, options)
      .json(
        new ApiResponse(
          (200,
          { accessToken, refreshToken: genRefreshToken },
          "Access Token Refreshed")
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(200, req.user, "Current User");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required!");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname: fullname,
        email: email,
      },
    },
    { new: true } // Updated information will be returned
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully!"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    new ApiError(400, "Avatar file not found");
  }

  const avatar = await uploadCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Avatar upload failed");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true } // Updated information will be returned
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, user, "avatar updated"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverLocalLocalPath = req.file?.path;

  if (!coverLocalLocalPath) {
    new ApiError(400, "Cover Image file not found");
  }

  const coverimage = await uploadCloudinary(coverLocalLocalPath);

  if (!coverimage.url) {
    throw new ApiError(400, "Cover Image upload failed");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverimage: coverimage.url,
      },
    },
    { new: true } // Updated information will be returned
  ).select("-password");

  return res.status(200).json(new ApiResponse(200, user, "coverimage updated"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username cannot be empty");
  }

  // User.find({ username});
  const userChannel = await User.aggregate([
    {
      $match: { username: username?.toLowerCase() },
    },
    {
      $lookup: { from: "subscriptions" },
    },
  ]);

  if (userChannel) {
    throw new ApiError(400, "User Channel not found");
  }
});

// Export the registerUser route handler
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
};

// get user details -> validations -> user is existing or not( based on email / username ) -> chaek for images, avatar
// Upload item cloudinary, avatar ->
// Create user Object -> Create entry in Database
// check for user creation -> return response
