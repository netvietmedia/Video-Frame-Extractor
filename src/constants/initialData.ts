// Initial JSON prompt template for the AI // Mẫu prompt JSON ban đầu cho AI
export const INITIAL_JSON_PROMPT = {
  "music": "",
  "camera": {"angle": "","focus": "","framing": "","movement": "e.g., static, pan left, pan right, tilt up, tilt down, dolly in, dolly out"},
  "dialogue": ["() ."],
  "scene_id": "","aspect_ratio": "","duration_sec": "","visual_style": "",
  "character_lock": {"CHAR_1": {"id": "","age": "","hair": "","name": "","pose": "","props": "","gender": "","species": "","position": "","body_build": "","expression": "","face_shape": "","outfit_top": "","action_flow": {"pre_action": "","main_action": "","post_action": ""},"hand_detail": "","orientation": "","body_metrics": "","helmet_or_hat": "","outfit_bottom": "","voice_profile": "","foot_placement": "","shoes_or_footwear": "","signature_feature": "","skin_or_fur_color": "","voice_personality": ""}},
  "background_lock": {"BACKGROUND_1": {"id": "BACKGROUND_1","name": "","props": "","scenery": "","setting": "","lighting": ""}},
  "foley_and_ambience": {"fx": [], "sfx_misc": [""]},
  "lip_sync_director_note": ""
};