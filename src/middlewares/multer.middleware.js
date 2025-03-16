import multer from "multer";
// import { hi } from "../../public/temp/hi";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
    // console.log("multer----> file:", file);
    // console.log("multer----> req:", req);
    // console.log("multer----> cb:", cb);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({
  storage,
});
