
import multer from 'multer';
import path from 'path';

// Configuração do multer para upload de materiais de aula
export const materialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../materialdeaula"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Configuração do multer para upload de áudios
export const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../AudiosCurso"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Configuração do multer para upload de material do curso
export const materialCursoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../MaterialCurso"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Configuração do multer para upload de material extra
export const materialExtraStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../MaterialExtra"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

export const materialUpload = multer({ storage: materialStorage });
export const audioUpload = multer({ storage: audioStorage });
export const materialCursoUpload = multer({ storage: materialCursoStorage });
export const materialExtraUpload = multer({ storage: materialExtraStorage });

// Configuração para cursos completos (áudios + PDFs)
export const cursoCompleto = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      console.log("=== MULTER DESTINATION ===");
      console.log("Field name:", file.fieldname);
      console.log("Original name:", file.originalname);
      
      if (file.fieldname === "audios") {
        cb(null, path.join(__dirname, "../../AudiosCurso"));
      } else if (file.fieldname.startsWith("pdf")) {
        cb(null, path.join(__dirname, "../../MaterialCurso"));
      } else {
        cb(null, path.join(__dirname, "../../MaterialCurso"));
      }
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const filename = timestamp + ext;
      console.log("=== MULTER FILENAME ===");
      console.log("Original:", file.originalname);
      console.log("Generated:", filename);
      cb(null, filename);
    },
  }),
  fileFilter: (req, file, cb) => {
    console.log("=== MULTER FILE FILTER ===");
    console.log("Field:", file.fieldname);
    console.log("File:", file.originalname);
    console.log("MIME:", file.mimetype);
    
    // Aceitar todos os tipos de arquivo por enquanto
    cb(null, true);
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB por arquivo
    files: 105, // máximo de arquivos
    fieldSize: 10 * 1024 * 1024, // 10MB para campos de texto
    fieldNameSize: 500,
    fields: 50
  }
});
