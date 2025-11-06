import { INITIAL_JSON_PROMPT } from '../constants/initialData';

// Type definition for script configuration options // Định nghĩa type cho các tùy chọn cấu hình kịch bản
type ScriptConfig = {
  aspectRatio: string;
  style: string;
  transition: string;
  hasBackgroundMusic: boolean;
  hasDialogue: boolean;
  dialogueLanguage: string;
  selectedVoices: string[];
  sceneCount: number;
  customPrompt: string;
  srtContent: string | null;
};

// Generates the main prompt for the Gemini model based on user configuration
// Tạo prompt chính cho mô hình Gemini dựa trên cấu hình của người dùng
export const generateScriptPrompt = (config: ScriptConfig): string => {
  const {
    aspectRatio,
    style,
    transition,
    hasBackgroundMusic,
    hasDialogue,
    dialogueLanguage,
    selectedVoices,
    sceneCount,
    customPrompt,
    srtContent,
  } = config;

  // Include the user's custom prompt if it exists // Bao gồm prompt tùy chỉnh của người dùng nếu có
  const customPromptSection = customPrompt 
    ? `
**User's Creative Direction:**
${customPrompt}
` 
    : '';

  const srtSection = srtContent && hasDialogue
    ? `
**SRT File Content (for dialogue):**
Use the following transcription from the provided SRT file as the dialogue for the scenes. Adapt it as necessary to fit the narrative and pacing.
---
${srtContent}
---
`
    : '';

  return `You are a professional screenplay writer tasked with creating a script from a sequence of video frames. Adhere strictly to the following configuration.${customPromptSection}${srtSection}

**Script Configuration:**
- Desired Number of Scenes: ${sceneCount}
- Aspect Ratio: ${aspectRatio}
- Style: ${style}
- Default Transition: ${transition}
- Background Music: ${hasBackgroundMusic ? 'Yes, suggest appropriate music' : 'No'}
- Dialogue: ${hasDialogue ? 'Yes, create dialogue' : 'No'}
- Dialogue Language: ${dialogueLanguage}
${selectedVoices.length > 0 ? `- Available TTS Voices: ${selectedVoices.join(', ')}` : ''}

**Output Format:**
For each scene, provide a title starting with '# SCENE'.
After the narrative text for the scene, you MUST provide a JSON configuration block enclosed in \`\`\`json ... \`\`\`.
This JSON block should be a completed version of the template provided below, filled with details relevant to that specific scene based on the visual frames.

**CRITICAL REQUIREMENT:** For every character defined in "character_lock", you MUST specify their "gender" as "Male", "Female", or "Unspecified". This is mandatory for voice assignment.

**JSON Template for Each Scene:**
${JSON.stringify(INITIAL_JSON_PROMPT, null, 2)}

Now, analyze the following frames and generate the script in the specified format.`;
};