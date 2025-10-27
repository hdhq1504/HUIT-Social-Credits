export const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    if (!(file instanceof Blob)) {
      reject(new Error('Tập tin không hợp lệ'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Không thể đọc dữ liệu tập tin'));
      }
    };
    reader.onerror = () => {
      reject(reader.error || new Error('Không thể đọc dữ liệu tập tin'));
    };
    reader.readAsDataURL(file);
  });

export default fileToDataUrl;