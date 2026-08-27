export async function compressImage(file: File): Promise<{ base64: string, mimeType: string }> {
  return new Promise((resolve, reject) => {
    if (file.size > 15 * 1024 * 1024) {
      reject(new Error('Original image is too large. Please select an image under 15MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const img = new window.Image();
      
      img.onload = () => {
        const MAX_DIMENSION = 2500;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to process image. Please try another.'));
          return;
        }

        let targetMime = file.type;
        if (targetMime === 'image/png') {
           ctx.fillStyle = '#ffffff';
           ctx.fillRect(0, 0, width, height);
           targetMime = 'image/jpeg';
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        const quality = 0.85;
        const compressedDataUrl = canvas.toDataURL(targetMime, quality);
        
        const sizeInBytes = (compressedDataUrl.length * 3) / 4;

        if (sizeInBytes > 5 * 1024 * 1024) {
           reject(new Error('Even after compression, the image is too large. Please choose a smaller image.'));
           return;
        }

        const match = compressedDataUrl.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,(.+)$/);
        if (match) {
          resolve({ mimeType: match[1], base64: match[2] });
        } else {
          reject(new Error('Failed to compress image.'));
        }
      };
      
      img.onerror = () => {
        reject(new Error('Invalid or corrupted image file.'));
      };
      
      img.src = result;
    };
    
    reader.onerror = () => {
       reject(new Error('Failed to read file.'));
    };
    
    reader.readAsDataURL(file);
  });
}
