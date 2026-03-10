const ImageKit = require("imagekit");

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

async function uploadFile(file, fileName, mimeType) {
    // Determine file extension from mime type
    const mimeToExt = {
        'video/mp4': '.mp4',
        'video/mpeg': '.mpeg',
        'video/quicktime': '.mov',
        'video/x-msvideo': '.avi',
        'video/webm': '.webm',
        'video/x-matroska': '.mkv'
    };
    
    const extension = mimeToExt[mimeType] || '.mp4';
    const fullFileName = fileName + extension;
    
    const result = await imagekit.upload({
        file: file, // required - can be buffer, base64, or file path
        fileName: fullFileName, // required
        useUniqueFileName: true, // ensures unique file names
        folder: '/videos', // optional: organize videos in a folder
    })

    return result; // Return the URL of the uploaded file
}

module.exports = {
    uploadFile
}