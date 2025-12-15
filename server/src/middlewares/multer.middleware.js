import multer from 'multer';
import fs from 'fs';

const localPath = "./public/temp";
if(!fs.existsSync(localPath)){
    fs.mkdirSync(localPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, localPath); 
    },
    filename: function (req, file, cb) {
        cb(null,file.originalname);
    }
});
export const upload = multer({
     storage,
});

