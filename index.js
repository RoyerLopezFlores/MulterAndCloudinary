const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs-extra');

require('dotenv').config();

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});
const createDirectorySync = (name_dir)=> {
    try {
        fs.mkdirSync(name_dir, { recursive: true });
        console.log(`[SERVER] El directorio ${name_dir} ha sido creado o ya existía.`);
    } catch (error) {
        console.error('[SERVER] Error al crear el directorio:', error);
    }
    fs.emptyDir(name_dir, (err) => {
    if (err) {
            console.error(`[SERVER] Error al vaciar el directorio ${name_dir}: ${err}`);
            return;
        }
        console.log(`[SERVER] El directorio ${name_dir} ha sido vaciado exitosamente.`);
    });
}
const pingCloudinary = ()=>{
    cloudinary.api.ping(function(error, result){
        if(error) {
            console.log('[SEVER] Error al conectar con Cloudinary:', error);
        } else {
            console.log('[SERVER] Cloudinary configurado y conectado');
        }
    });
}
const uploadImageCloudinary = async (imagePath) => {
    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    };

    try {
      const result = await cloudinary.uploader.upload(imagePath, options);
      console.log("[URL] image",result.url);
      return result.public_id;
    } catch (error) {
      console.error(error);
    }
};

const deleteTemporalFile = (delete_path) =>{
    fs.unlink(delete_path, (err) => {
        if (err) {
            console.error(`[SEVER] Error al eliminar el archivo ${path.basename(delete_path)}: ${err}`);
            return true;
        }
        console.log(`[SEVER] El archivo ${path.basename(delete_path)} ha sido eliminado exitosamente.`);
    });
}

const directory_upload = './uploads';
createDirectorySync(directory_upload);

pingCloudinary();



const app = express();


const upload = multer({ dest: 'uploads/' });




app.post('/upload', upload.single('archivo'), async (req, res) => {
    // El archivo se guarda en req.file
    if (req.file){
        const nombreArchivo = req.file.filename;
        const fullpath = path.join(__dirname, directory_upload, nombreArchivo);

        console.log('[SERVER] Nombre del archivo guardado:', fullpath);
        const id_public = await uploadImageCloudinary(fullpath);
        console.log('[SERVER] Cloudinary ID del archivo guardado:', id_public);
        deleteTemporalFile(fullpath);

        res.send(`Archivo cargado con éxito: ${req.file.filename}`);
    } else {
        res.send('No se subió ningún archivo.');
    }
    
    // Emitir el evento 'archivoSubido' a todos los clientes conectados

    // Aquí puedes realizar operaciones con el archivo, como guardarlo en una base de datos o procesarlo de alguna manera

});
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});