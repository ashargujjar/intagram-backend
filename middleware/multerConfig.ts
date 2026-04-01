import multer, { FileFilterCallback } from "multer";
import path from "node:path";
import fs from "node:fs";
import { Request } from "express";

// Ensure upload directory exists
const uploadDir = path.resolve("uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage config
const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

// File filter (images)
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const allowedImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

// File filter (audio)
const audioFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const allowedAudioTypes = [
    "audio/webm",
    "audio/ogg",
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/wav",
    "audio/x-wav",
  ];
  const isWebm = file.mimetype.startsWith("audio/webm");
  const isOgg = file.mimetype.startsWith("audio/ogg");

  if (allowedAudioTypes.includes(file.mimetype) || isWebm || isOgg) {
    cb(null, true);
  } else {
    cb(new Error("Only audio files are allowed (webm, ogg, mp3, mp4, wav)"));
  }
};

// Multer instance
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

const uploadAudio = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: audioFileFilter,
});

// Export (ESM style)
export const uploadSingle = upload.single("image");
export const uploadMultiple = upload.array("images", 3);
export const uploadSingleAudio = uploadAudio.single("audio");
