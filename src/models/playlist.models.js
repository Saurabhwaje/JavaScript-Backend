import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
  {
    name: {
      typeof: "string",
      req: true,
    },
    description: {
      typeof: "string",
      req: true,
    },
    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timeseries: true }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);
