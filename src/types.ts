// Represents a TTS voice with its name and gender // Đại diện cho một giọng nói TTS với tên và giới tính
export type Voice = { name: string; gender: 'Male' | 'Female' };

// Represents a single scene in the generated script // Đại diện cho một cảnh đơn lẻ trong kịch bản được tạo
export type Scene = {
    title: string | null;
    content: string;
    jsonConfig: string;
};

// Represents the technical metadata of the uploaded video // Đại diện cho siêu dữ liệu kỹ thuật của video đã tải lên
export type VideoInfo = {
    duration: string;
    width: number;
    height: number;
    dataRate?: number;
    totalBitrate?: number;
    frameRate?: number;
    suggestedFrames?: number;
};