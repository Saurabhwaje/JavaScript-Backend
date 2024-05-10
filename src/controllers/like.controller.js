import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  const existingLike = await Like.findOne({
    video: videoId,
    user: req.user._id,
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    video.likes = -1;
    return res.status(200).json({ message: "Like removed" });
  } else {
    const newLike = new Like({ video: videoId, user: req.user._id });
    await newLike.save();
    video.likes = +1;
  }
  await video.save();

  res.status(200).json(new ApiResponse(200, { likes: video.likes }));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    user: req.user._id,
  });

  if (existingLike) {
    await Comment.findByIdAndDelete(existingLike._id);
    comment.likes = -1;
    return res.status(200).json({ message: "Like removed" });
  } else {
    const newLike = new Like({ comment: commentId, user: req.user._id });
    await newLike.save();
    comment.likes = +1;
  }
  await comment.save();

  res.status(200).json(new ApiResponse(200, { likes: comment.likes }));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
