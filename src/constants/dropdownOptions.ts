import { Voice } from '../types';

// Dialogue languages available for script generation // Các ngôn ngữ hội thoại có sẵn để tạo kịch bản
export const DIALOGUE_LANGUAGES = ["English(US)", "English(UK)", "English(Australia)", "English(India)", "English(Nigeria)", "Spanish(Spain)", "Spanish(US)", "French (France)", "French (Canada)", "German (Germany)", "Italian (Italy)", "Portuguese (Brazil)", "Portuguese (Portugal)", "Russian (Russia)", "Chinese(Mainland)", "Chinese(Taiwan)", "Cantonese (Hong Kong)", "Japanese (Japan)", "Korean (Korea)", "Vietnamese (Vietnam)", "Thai (Thailand)", "Hindi (India)", "Arabic (various dialects)", "Polish (Poland)", "Turkish (Turkey)", "Dutch (Netherlands)", "Swedish (Sweden)", "Danish (Denmark)", "Norwegian (Boksmål)", "Finnish (Finland)", "Greek (Greece)", "Hungarian (Hungary)", "Czech (Czech Republic)", "Romanian (Romania)", "Slovak (Slovakia)", "Indonesian (Indonesia)", "Malay (Malaysia)", "Filipino (Philippines)", "Bengali (Bangladesh, India)", "Tamil (India)", "Telugu (India)", "Gujarati (India)", "Marathi (India)", "Kannada (India)", "Malayalam (India)", "Urdu (India)", "Ukrainian (Ukraine)", "Catalan", "Croatian", "Serbian", "Slovenian", "Albanian", "Amharic", "Afar", "Latin", "Swahili", "Khmer (Cambodia)", "Sundanese (Indonesia)", "Javanese (Indonesia)", "Nepali (Nepal)", "Welsh", "Icelandic", "Lao (Laos)"];

// Visual styles for the generated video script // Các phong cách hình ảnh cho kịch bản video được tạo
export const STYLES = ["Realistic", "Cinematic", "Documentary", "Drama", "Romantic", "Action", "Sci-Fi", "Fantasy", "Horror", "Noir", "Retro", "Epic", "Heroic", "Animated", "3D Animation", "Pixar Style", "2D Anime", "Manga Style", "Cartoon", "Disney Style", "Stop Motion", "Claymation", "Sketch", "Hand-drawn", "Oil Painting", "Watercolor", "Photorealistic", "Hyper-realistic", "Surreal", "Dreamlike", "Minimalist", "Vintage", "Analog Film", "Cyberpunk", "Neonpunk", "Steampunk", "Fantasy Realism", "Dark", "Gothic", "Painterly", "Mixed Media", "Collage", "Vlog", "Lifestyle", "News", "Journalism", "Commercial", "Advertisement", "Music Video", "MV Style", "Interview", "Talking Head", "Cinematic Realism", "Stylized Animation", "CGI Rendered", "Unreal Engine Style", "Studio Lighting", "Natural Light", "Handheld Camera", "Drone Footage", "POV Shot", "Slow Motion", "Time-lapse", "Photorealistic Render", "Dreamcore", "Analog Aesthetic", "Hyper-detailed", "Film Grain", "Soft Lighting", "High Contrast", "Low-key Lighting", "Moody Atmosphere", "Fantasy Epic", "Futuristic Cityscape", "Retro Futurism"];

// Scene transitions for the generated video script // Các hiệu ứng chuyển cảnh cho kịch bản video được tạo
export const TRANSITIONS = ["Cut", "Fade In", "Fade Out", "Dissolve", "Crossfade", "Wipe", "Jump Cut", "Whip Pan", "Swish Pan", "Zoom Transition", "Push Transition", "Spin Transition", "Rotate Transition", "Glitch Transition", "Light Flash", "Lens Flare", "Mask Transition", "Match Cut", "L-Cut", "J-Cut", "Graphic Match", "Smash Cut", "Cross-Cut", "Parallel Editing", "Page Turn", "Cube Spin", "Slide", "Ripple", "Warp", "Mosaic", "Blur", "Zoom Blur", "Motion Blur", "Camera Shake", "Distortion Transition", "Time Transition", "Location Transition", "Dream Transition", "Flashback Transition", "Match Action Transition"];

// Mapping of dialogue languages to available Gemini TTS voices // Ánh xạ ngôn ngữ hội thoại với các giọng nói Gemini TTS có sẵn
export const VOICE_MAP: Record<string, Voice[]> = {
  'English(US)': [ { name: 'Zephyr', gender: 'Male' }, { name: 'Aria', gender: 'Female' } ],
  'English(UK)': [ { name: 'Puck', gender: 'Male' }, { name: 'Elara', gender: 'Female' } ],
  'Vietnamese (Vietnam)': [ { name: 'Kore', gender: 'Male' }, { name: 'Linh', gender: 'Female' } ],
  'Japanese (Japan)': [ { name: 'Kenji', gender: 'Male' }, { name: 'Yuki', gender: 'Female' } ],
  'German (Germany)': [ { name: 'Klaus', gender: 'Male' }, { name: 'Greta', gender: 'Female' } ],
  'French (France)': [ { name: 'Antoine', gender: 'Male' }, { name: 'Celine', gender: 'Female' } ],
  'Spanish(Spain)': [ { name: 'Mateo', gender: 'Male' }, { name: 'Sofia', gender: 'Female' } ],
  'default': [
    { name: 'Charon', gender: 'Male' },
    { name: 'Fenrir', gender: 'Female' },
  ]
};
