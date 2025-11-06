// Converts a Blob object to a Base64 encoded string // Chuyển đổi một đối tượng Blob thành chuỗi được mã hóa Base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // The result includes a data URI prefix (e.g., 'data:image/jpeg;base64,'), which we remove
    // Kết quả bao gồm một tiền tố URI dữ liệu (ví dụ: 'data:image/jpeg;base64,'), chúng ta cần loại bỏ nó
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
