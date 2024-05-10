import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const comments = await Comment.find({ videoId: videoId })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    res.status(200).json({ comments });
  } catch (error) {
    throw new ApiError(500, "Error fetching video comments");
  }
});

const addComment = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const { comment } = req.body;
    const newComment = new Comment({ videoId, comment });
    await newComment.save();
    res.status(201).json({ comment: newComment });
  } catch (error) {
    throw new ApiError(500, "Error adding comment");
  }
});

const updateComment = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment } = req.body;
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { comment },
      { new: true }
    );
    if (!updatedComment) {
      throw new ApiError(404, "Comment not found");
    }
    res.status(200).json({ comment: updatedComment });
  } catch (error) {
    throw new ApiError(500, "Error updating comment");
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    const deletedComment = await Comment.findByIdAndDelete(commentId);
    if (!deletedComment) {
      throw new ApiError(404, "Comment not found");
    }
    res.status(200).json({ comment: deletedComment });
  } catch (error) {
    throw new ApiError(500, "Error deleting comment");
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };
