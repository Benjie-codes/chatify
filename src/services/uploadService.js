/**
 * Uploads a file (or Blob) to Cloudinary.
 * 
 * @param {Blob|File} file - The encrypted blob to upload.
 * @returns {Promise<string>} The secure URL of the uploaded file on the CDN.
 */
export async function uploadToCloudinary(file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment variables are missing. Please check your .env file.')
  }

  // We use the 'auto' resource type instead of 'raw'. Cloudinary will automatically 
  // determine how to handle the encrypted binary data, which helps bypass
  // strict 'raw' upload restrictions common in default unsigned presets.
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`

  const formData = new FormData()
  // Add a generic .txt filename so Cloudinary correctly parses the FormData blob
  // without blocking it (Cloudinary blocks .bin extensions by default)
  formData.append('file', file, 'secure-media.txt')
  formData.append('upload_preset', uploadPreset)

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Cloudinary upload failed: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    return data.secure_url
  } catch (error) {
    console.error('[uploadService] Error uploading to Cloudinary:', error)
    throw error
  }
}
