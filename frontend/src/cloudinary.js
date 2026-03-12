const CLOUDINARY_CLOUD_NAME = 'playmesong';

export async function uploadMusicBase64(base64Data, fileName, establishmentId) {
  const formData = new FormData();
  formData.append('file', base64Data);
  formData.append('upload_preset', 'music_uploads');
  formData.append('folder', `PlayMySong/${establishmentId || 'general'}`);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/audio/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}
