export const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, { mode: 'cors' }); // Attempt CORS fetch
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Content = base64String.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw new Error("Could not load image for editing. This might be due to browser security (CORS) on the placeholder image.");
  }
};
