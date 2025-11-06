import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai"
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY as string)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

import JSZip from 'jszip';
import saveAs from 'file-saver';
import MediaInfo from 'mediainfo.js';

import { Scene, VideoInfo } from './types';
import { blobToBase64 } from './utils/fileHelper';
import { generateScriptPrompt } from './prompts/scriptPrompt';
import { DIALOGUE_LANGUAGES, STYLES, TRANSITIONS, VOICE_MAP } from './constants/dropdownOptions';
import { INITIAL_JSON_PROMPT } from './constants/initialData';
import { UploadIcon, TrashIcon, CopyIcon, DownloadIcon, EditIcon, GlobeIcon } from './components/Icons';
import { JsonEditorModal } from './components/JsonEditorModal';
import { LanguageProvider, useTranslation } from './hooks/useTranslation';

// Main App Component Content // Nội dung chính của App Component
const AppContent: React.FC = () => {
  const { t } = useTranslation();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [srtContent, setSrtContent] = useState<string | null>(null);

  const [extractionMode, setExtractionMode] = useState<'count' | 'interval'>('count');
  const [frameCount, setFrameCount] = useState<number>(75);
  const [interval, setInterval] = useState<number>(1);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [extractedFrames, setExtractedFrames] = useState<{ url: string, blob: Blob }[]>([]);
  const [generatedScriptText, setGeneratedScriptText] = useState<string>('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
  const [copyStatus, setCopyStatus] = useState<string>('');
  const [sceneCopyStatus, setSceneCopyStatus] = useState<{ index: number; message: string } | null>(null);
  
  // Script config state // Trạng thái cấu hình kịch bản
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [hasBackgroundMusic, setHasBackgroundMusic] = useState(true);
  const [hasDialogue, setHasDialogue] = useState(true);
  const [dialogueLanguage, setDialogueLanguage] = useState('Vietnamese (Vietnam)');
  const [style, setStyle] = useState('Cinematic');
  const [transition, setTransition] = useState('Cut');
  const [availableVoices, setAvailableVoices] = useState<(typeof VOICE_MAP)[string]>([]);
  const [selectedVoices, setSelectedVoices] = useState<string[]>([]);
  const [sceneCount, setSceneCount] = useState<number>(5);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Scene JSON editor modal state // Trạng thái modal chỉnh sửa JSON của cảnh
  const [editingSceneInfo, setEditingSceneInfo] = useState<{ index: number; jsonConfig: string } | null>(null);
  const [editableSceneJsonString, setEditableSceneJsonString] = useState('');
  const [isEditingAllScenesJson, setIsEditingAllScenesJson] = useState<boolean>(false);
  const [editableAllScenesJsonString, setEditableAllScenesJsonString] = useState<string>('');
  const [singleJsonCopyStatus, setSingleJsonCopyStatus] = useState<string>('');
  const [allJsonCopyStatus, setAllJsonCopyStatus] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Check if an API key has been selected on component mount // Kiểm tra xem API key đã được chọn hay chưa khi component được mount
    window.aistudio.hasSelectedApiKey().then(setApiKeySelected);
  }, []);

  useEffect(() => {
    // Cleanup object URLs to prevent memory leaks when the component unmounts or frames change
    // Dọn dẹp các URL object để tránh rò rỉ bộ nhớ khi component unmount hoặc các khung hình thay đổi
    return () => {
      extractedFrames.forEach(frame => URL.revokeObjectURL(frame.url));
    };
  }, [extractedFrames]);
  
  // Update available voices when language changes // Cập nhật các giọng nói có sẵn khi ngôn ngữ thay đổi
  useEffect(() => {
    const voices = VOICE_MAP[dialogueLanguage] || VOICE_MAP['default'];
    setAvailableVoices(voices);
    // Reset selected voices when language changes to avoid inconsistencies
    // Đặt lại các giọng nói đã chọn khi ngôn ngữ thay đổi để tránh sự không nhất quán
    setSelectedVoices([]);
  }, [dialogueLanguage]);


  // Parse raw script text into structured scenes whenever it changes
  // Phân tích văn bản kịch bản thô thành các cảnh có cấu trúc mỗi khi nó thay đổi
  useEffect(() => {
    if (!generatedScriptText) {
        setScenes([]);
        return;
    }
    // Use regex to split by # SCENE, keeping the delimiter
    // Sử dụng regex để tách theo # SCENE, giữ lại dấu phân cách
    const sceneBlocks = generatedScriptText.split(/(?=^# SCENE)/m).filter(Boolean);
    
    const newScenes: Scene[] = sceneBlocks.map(block => {
        // Extract JSON block // Trích xuất khối JSON
        const jsonMatch = block.match(/```json\n([\s\S]*?)\n```/);
        const jsonConfig = jsonMatch ? jsonMatch[1].trim() : JSON.stringify(INITIAL_JSON_PROMPT, null, 2);
        
        // Get content without the JSON block // Lấy nội dung không có khối JSON
        const contentWithoutJson = block.replace(/```json\n([\s\S]*?)\n```/, '').trim();
        const titleMatch = contentWithoutJson.match(/^# SCENE.*$/m);
        const title = titleMatch ? titleMatch[0] : null;

        // The rest is the content // Phần còn lại là nội dung
        const content = title ? contentWithoutJson.replace(/^# SCENE.*$/m, '').trim() : contentWithoutJson;

        return { title, content, jsonConfig };
    });
    setScenes(newScenes);
  }, [generatedScriptText]);

  const resetState = () => {
    setVideoFile(null);
    setVideoInfo(null);
    setSrtFile(null);
    setSrtContent(null);
    setExtractedFrames([]);
    setGeneratedScriptText('');
    setScenes([]);
    setStatusMessage('');
    setProgress(0);
    setIsExtracting(false);
    setIsAnalyzing(false);
    setIsZipping(false);
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      resetState();
      setVideoFile(file);
      setStatusMessage(t('status.analyzingVideo'));

      try {
        const mediaInfo = await MediaInfo({
            format: 'JSON',
            locateFile: () => 'https://unpkg.com/mediainfo.js@0.2.1/dist/MediaInfoModule.wasm',
        });
        const getSize = () => file.size;
        const readChunk = (chunkSize: number, offset: number) =>
            new Promise<Uint8Array>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.error) reject(e.target.error);
                    resolve(new Uint8Array(e.target?.result as ArrayBuffer));
                };
                reader.readAsArrayBuffer(file.slice(offset, offset + chunkSize));
            });

        const result = await mediaInfo.analyzeData(getSize, readChunk);
        const tracks = JSON.parse(result as string).media.track;
        const videoTrack = tracks.find((t: any) => t['@type'] === 'Video');
        const generalTrack = tracks.find((t: any) => t['@type'] === 'General');

        if (videoTrack && generalTrack) {
            const durationMs = parseFloat(generalTrack.Duration) * 1000;
            const hours = Math.floor(durationMs / 3600000);
            const minutes = Math.floor((durationMs % 3600000) / 60000);
            const seconds = Math.floor(((durationMs % 3600000) % 60000) / 1000);

            const durationInSeconds = durationMs / 1000;
            const suggestedFrames = Math.round(durationInSeconds / 8);

            setVideoInfo({
                duration: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
                width: parseInt(videoTrack.Width),
                height: parseInt(videoTrack.Height),
                dataRate: videoTrack.BitRate ? Math.round(parseInt(videoTrack.BitRate) / 1000) : undefined,
                totalBitrate: generalTrack.OverallBitRate ? Math.round(parseInt(generalTrack.OverallBitRate) / 1000) : undefined,
                frameRate: parseFloat(videoTrack.FrameRate),
                suggestedFrames: suggestedFrames > 0 ? suggestedFrames : 1,
            });
        }
        setStatusMessage('');
      } catch(error) {
        console.error("Error analyzing video metadata:", error);
        setStatusMessage(t('status.error.videoAnalysisFailed'));
      }
    }
  };

  const handleSrtFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if(file) {
      setSrtFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSrtContent(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const resetSrtFile = () => {
    setSrtFile(null);
    setSrtContent(null);
  };

  const handleExtractFrames = useCallback(async () => {
    if (!videoFile || !videoRef.current || !canvasRef.current) {
      setStatusMessage(t('status.error.noVideo'));
      return;
    }
    setGeneratedScriptText('');
    setIsExtracting(true);
    setProgress(0);
    setExtractedFrames([]);
    setStatusMessage(t('status.initializing'));

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;

    video.onloadedmetadata = async () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const duration = video.duration;
        let timestamps: number[] = [];

        if (extractionMode === 'count') {
            const count = Math.max(2, frameCount);
            for (let i = 0; i < count; i++) {
                timestamps.push((i / (count - 1)) * duration);
            }
        } else {
            if (interval <= 0) {
                setStatusMessage(t('status.error.intervalPositive'));
                setIsExtracting(false);
                return;
            }
            for (let time = 0; time < duration; time += interval) {
                timestamps.push(time);
            }
        }
        
        const frames = [];
        for (let i = 0; i < timestamps.length; i++) {
            video.currentTime = timestamps[i];
            await new Promise<void>(resolve => { video.onseeked = () => resolve(); });

            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
            if (blob) {
                frames.push({ url: URL.createObjectURL(blob), blob });
            }
            
            setProgress(((i + 1) / timestamps.length) * 100);
            setStatusMessage(`${t('status.extractingFrame')} ${i + 1} / ${timestamps.length}`);
        }
        setExtractedFrames(frames);
        if (frames.length > 0) {
            setSceneCount(frames.length);
        }
        setStatusMessage(t('status.extractComplete', { count: frames.length }));
        setIsExtracting(false);
        URL.revokeObjectURL(videoUrl);
    };

    video.onerror = () => {
        setIsExtracting(false);
        setStatusMessage(t('status.error.videoLoad'));
        URL.revokeObjectURL(videoUrl);
    }
  }, [videoFile, extractionMode, frameCount, interval, t]);

  const handleRewriteScript = useCallback(async () => {
    if (extractedFrames.length === 0) {
      setStatusMessage(t('status.error.noFrames'));
      return;
    }

    try {
        const keySelected = await window.aistudio.hasSelectedApiKey();
        if (!keySelected) {
            await window.aistudio.openSelectKey();
            setApiKeySelected(true);
        }
    } catch (e) {
        setStatusMessage(t('status.error.apiKeyAuth'));
        return;
    }

    setIsAnalyzing(true);
    setGeneratedScriptText('');
    setStatusMessage(t('status.rewriting'));
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const detailedPrompt = generateScriptPrompt({
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
      });
      
      const imageParts = await Promise.all(
        extractedFrames.map(async (frame) => {
          const base64Data = await blobToBase64(frame.blob);
          return { inlineData: { mimeType: 'image/jpeg', data: base64Data } };
        })
      );

      const stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: detailedPrompt }, ...imageParts] }
      });
      
      let text = '';
      for await (const chunk of stream) {
        text += chunk.text;
        setGeneratedScriptText(text);
      }
      
      setStatusMessage(t('status.rewriteComplete'));
    } catch (error: any) {
        let errorMessage = t('status.error.analysisFailed');
        if (error.message && error.message.includes('not found')) {
            errorMessage = t('status.error.apiKeyNotFound');
            setApiKeySelected(false);
        }
        setStatusMessage(errorMessage);
        console.error(error);
    } finally {
        setIsAnalyzing(false);
    }
  }, [extractedFrames, aspectRatio, hasBackgroundMusic, hasDialogue, dialogueLanguage, style, transition, selectedVoices, sceneCount, customPrompt, srtContent, t]);
  
  const handleDownloadAllFrames = async () => {
    if (extractedFrames.length === 0) return;

    setIsZipping(true);
    setStatusMessage(t('status.zipping'));
    try {
        const zip = new JSZip();
        extractedFrames.forEach((frame, index) => {
            const frameNumber = String(index + 1).padStart(4, '0');
            zip.file(`frame_${frameNumber}.jpg`, frame.blob);
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, 'extracted-frames.zip');
        setStatusMessage(t('status.zipComplete'));
    } catch (error) {
        console.error('Failed to create zip file', error);
        setStatusMessage(t('status.error.zipFailed'));
    } finally {
        setIsZipping(false);
        setTimeout(() => {
            if (!isExtracting && !isAnalyzing) setStatusMessage('');
        }, 3000);
    }
  };

  const handleCopy = () => {
    const scriptText = scenes.map(scene => (scene.title ? `${scene.title}\n` : '') + scene.content).join('\n\n');
    navigator.clipboard.writeText(scriptText);
    setCopyStatus(t('common.copied'));
    setTimeout(() => setCopyStatus(''), 2000);
  };
  
  const handleSceneCopy = (scene: Scene, index: number) => {
    const sceneText = (scene.title ? `${scene.title}\n` : '') + scene.content;
    navigator.clipboard.writeText(sceneText);
    setSceneCopyStatus({ index, message: t('common.copied') });
    setTimeout(() => setSceneCopyStatus(null), 2000);
  };
  
  const handleOpenSceneJsonModal = (index: number, jsonConfig: string) => {
    setEditingSceneInfo({ index, jsonConfig });
    setEditableSceneJsonString(jsonConfig);
    setSingleJsonCopyStatus('');
  };

  const handleSaveSceneJson = () => {
    if (!editingSceneInfo) return;
    try {
        JSON.parse(editableSceneJsonString); // Validate JSON before saving // Xác thực JSON trước khi lưu
        setScenes(currentScenes => {
            const updatedScenes = [...currentScenes];
            updatedScenes[editingSceneInfo.index].jsonConfig = editableSceneJsonString;
            return updatedScenes;
        });
        setEditingSceneInfo(null);
    } catch (e) {
        alert(t('status.error.invalidJson'));
    }
  };
  
  const handleDownloadJson = () => {
    const allJsonConfigs = scenes.map(scene => JSON.parse(scene.jsonConfig));
    const blob = new Blob([JSON.stringify(allJsonConfigs, null, 2)], { type: "application/json" });
    saveAs(blob, "generated_script.json");
  };

  const handleVoiceSelection = (voiceName: string, isChecked: boolean) => {
    setSelectedVoices(prev =>
        isChecked ? [...prev, voiceName] : prev.filter(v => v !== voiceName)
    );
  };

  const handleOpenAllScenesJsonModal = () => {
    if (scenes.length === 0) return;
    try {
        const allJsonConfigs = scenes.map(scene => JSON.parse(scene.jsonConfig));
        setEditableAllScenesJsonString(JSON.stringify(allJsonConfigs, null, 2));
        setIsEditingAllScenesJson(true);
        setAllJsonCopyStatus('');
    } catch (e) {
        alert(t('status.error.jsonParseError'));
    }
  };

  const handleSaveAllScenesJson = () => {
    try {
        const parsedJsonArray = JSON.parse(editableAllScenesJsonString);
        if (!Array.isArray(parsedJsonArray)) {
            throw new Error(t('status.error.jsonNotArray'));
        }
        if (parsedJsonArray.length !== scenes.length) {
            throw new Error(t('status.error.jsonItemMismatch', { jsonCount: parsedJsonArray.length, sceneCount: scenes.length }));
        }

        setScenes(currentScenes => {
            const updatedScenes = currentScenes.map((scene, index) => ({
                ...scene,
                jsonConfig: JSON.stringify(parsedJsonArray[index], null, 2)
            }));
            return updatedScenes;
        });
        setIsEditingAllScenesJson(false);
    } catch (e: any) {
        alert(`${t('status.error.jsonSaveFailed')}\n\n${t('common.details')}: ${e.message}`);
    }
  };

  const handleCopySingleJson = () => {
    if (!editingSceneInfo) return;
    navigator.clipboard.writeText(editableSceneJsonString);
    setSingleJsonCopyStatus(t('common.copied'));
    setTimeout(() => setSingleJsonCopyStatus(''), 2000);
  };

  const handleCopyAllJson = () => {
      navigator.clipboard.writeText(editableAllScenesJsonString);
      setAllJsonCopyStatus(t('common.copied'));
      setTimeout(() => setAllJsonCopyStatus(''), 2000);
  };

  const isProcessing = isExtracting || isAnalyzing || isZipping;
  
  const { setLanguage, language } = useTranslation();
  const languages: { code: string; name: string }[] = [
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'id', name: 'Bahasa Indonesia' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl mx-auto bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-8 relative">
        <div className="absolute top-4 right-6">
            <div className="relative inline-block text-left">
                <select
                    onChange={(e) => setLanguage(e.target.value)}
                    value={language}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 pl-3 pr-8 rounded-md appearance-none cursor-pointer"
                >
                    {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <GlobeIcon className="w-5 h-5"/>
                </div>
            </div>
        </div>

        <header className="text-center pt-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mt-4">{t('header.title')}</h1>
            <p className="text-gray-400 mt-2">{t('header.subtitle')}</p>
        </header>
        
        <section className="p-6 bg-gray-700/50 rounded-lg border border-gray-600 space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-3">{t('config.analysis.title')}</h3>
                <div className="bg-gray-800 p-4 rounded-md space-y-4">
                     <div className="flex items-center gap-4">
                        <label><input type="radio" name="mode" value="count" checked={extractionMode === 'count'} onChange={() => setExtractionMode('count')} className="mr-2 accent-cyan-500" disabled={isProcessing}/>{t('config.analysis.modeCount')}</label>
                        <label><input type="radio" name="mode" value="interval" checked={extractionMode === 'interval'} onChange={() => setExtractionMode('interval')} className="mr-2 accent-cyan-500" disabled={isProcessing}/>{t('config.analysis.modeInterval')}</label>
                    </div>
                    {extractionMode === 'count' ? (
                        <div>
                            <label htmlFor="frameCount" className="block text-sm font-medium text-gray-300">{t('config.analysis.frameCountLabel')} <span className="font-bold text-cyan-400">{frameCount}</span></label>
                            <input type="range" id="frameCount" min="3" max="1000" value={frameCount} onChange={(e) => setFrameCount(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500" disabled={isProcessing}/>
                        </div>
                    ) : (
                        <div>
                            <label htmlFor="interval" className="block text-sm font-medium text-gray-300">{t('config.analysis.intervalLabel')}</label>
                            <input type="number" id="interval" value={interval} onChange={(e) => setInterval(Math.max(0.1, parseFloat(e.target.value)))} min="0.1" step="0.1" className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-md p-2 text-white" disabled={isProcessing}/>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-3">{t('config.upload.title')}</h3>
                {!videoFile ? (
                    <label htmlFor="file-upload" className="flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-500 border-dashed rounded-md h-full cursor-pointer hover:bg-gray-700/20 transition-colors">
                        <div className="space-y-1 text-center">
                            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-400">
                                <span className="relative bg-gray-800 rounded-md font-medium text-cyan-400 hover:text-cyan-300 px-1">
                                    <span>{t('config.upload.selectFile')}</span>
                                    <input id="file-upload" type="file" className="sr-only" accept="video/mp4,video/webm,video/mov" onChange={handleFileChange} disabled={isProcessing}/>
                                </span>
                                <p className="pl-1">{t('config.upload.dragAndDrop')}</p>
                            </div>
                            <p className="text-xs text-gray-500">MP4, WEBM, MOV</p>
                        </div>
                    </label>
                ) : (
                    <div className="bg-gray-800 p-4 rounded-md h-full flex flex-col justify-center">
                        <p className="text-sm text-green-400 break-all">{t('config.upload.selected')}: {videoFile.name}</p>
                        {videoInfo && (
                            <div className="mt-4 text-xs text-gray-400 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                                <div><strong>Length:</strong> {videoInfo.duration}</div>
                                <div><strong>Resolution:</strong> {videoInfo.width}x{videoInfo.height}</div>
                                {videoInfo.frameRate && <div><strong>Frame Rate:</strong> {videoInfo.frameRate.toFixed(2)} fps</div>}
                                {videoInfo.dataRate && <div><strong>Data Rate:</strong> {videoInfo.dataRate} kbps</div>}
                                {videoInfo.totalBitrate && <div><strong>Total Bitrate:</strong> {videoInfo.totalBitrate} kbps</div>}
                                {videoInfo.suggestedFrames && <div className="font-semibold text-cyan-400"><strong>{t('results.frames.suggested')}:</strong> {videoInfo.suggestedFrames}</div>}
                            </div>
                        )}
                        <button onClick={resetState} className="mt-4 flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-300 disabled:text-gray-500 self-start" disabled={isProcessing}><TrashIcon className="w-4 h-4" /> {t('config.upload.delete')}</button>
                    </div>
                )}
            </div>
        </section>

        <div className="flex flex-col md:flex-row gap-4">
            <button onClick={handleExtractFrames} disabled={!videoFile || isProcessing} className="w-full py-3 px-6 text-lg font-bold text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 rounded-md transition-colors">
                {isExtracting ? t('buttons.extracting') : t('buttons.startExtraction')}
            </button>
        </div>
        
        {(isProcessing || statusMessage) && (
            <div className="space-y-3 pt-4">
                <p className={`text-center font-medium ${statusMessage.includes(t('common.error')) ? 'text-red-400' : 'text-cyan-300'}`}>{statusMessage}</p>
                {(isExtracting || isAnalyzing) && (
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                )}
            </div>
        )}
        
        {extractedFrames.length > 0 && (
            <div className="space-y-8 pt-4 border-t border-gray-700">
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-white">{t('results.frames.title', { count: extractedFrames.length })}</h3>
                        <button onClick={handleDownloadAllFrames} disabled={isProcessing} className="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-md disabled:opacity-50 transition-colors">
                            <DownloadIcon className="w-4 h-4"/> {isZipping ? t('buttons.zipping') : t('buttons.downloadAll')}
                        </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto bg-gray-900/50 p-4 rounded-lg grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                        {extractedFrames.map((frame, index) => (
                            <img key={index} src={frame.url} alt={`${t('results.frames.alt')} ${index + 1}`} className="w-full h-auto object-cover rounded aspect-video bg-gray-700" loading="lazy" decoding="async" />
                        ))}
                    </div>
                </section>
                
                <section className="p-6 bg-gray-700/50 rounded-lg border border-gray-600 space-y-6">
                    <h3 className="text-xl font-semibold text-white">{t('config.script.title')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('config.script.aspectRatio')}</label>
                                <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white" disabled={isProcessing}>
                                    <option>16:9</option><option>9:16</option><option>3:4</option><option>1:1</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('config.script.style')}</label>
                                <select value={style} onChange={e => setStyle(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white" disabled={isProcessing}>
                                    {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('config.script.transition')}</label>
                                <select value={transition} onChange={e => setTransition(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white" disabled={isProcessing}>
                                    {TRANSITIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="sceneCount" className="block text-sm font-medium text-gray-300 mb-1">{t('config.script.sceneCount')}</label>
                                <input type="number" id="sceneCount" value={sceneCount} onChange={(e) => setSceneCount(Math.max(1, parseInt(e.target.value, 10)) || 1)} min="1" className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white" disabled={isProcessing}/>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-8 pt-1">
                                <label className="flex items-center gap-2"><input type="checkbox" checked={hasBackgroundMusic} onChange={e => setHasBackgroundMusic(e.target.checked)} className="accent-cyan-500 w-4 h-4" disabled={isProcessing}/> {t('config.script.backgroundMusic')}</label>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={hasDialogue} onChange={e => setHasDialogue(e.target.checked)} className="accent-cyan-500 w-4 h-4" disabled={isProcessing}/> {t('config.script.dialogue')}</label>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('config.script.dialogueLanguage')}</label>
                                <select value={dialogueLanguage} onChange={e => setDialogueLanguage(e.target.value)} disabled={!hasDialogue || isProcessing} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white disabled:bg-gray-600 disabled:text-gray-400">
                                    {DIALOGUE_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">{t('config.script.ttsVoices')}</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-gray-800 border border-gray-600 rounded-md min-h-[108px]">
                                    {availableVoices.map(voice => (
                                        <label key={voice.name} className="flex items-center gap-2 text-sm text-gray-300">
                                            <input type="checkbox" checked={selectedVoices.includes(voice.name)} onChange={(e) => handleVoiceSelection(voice.name, e.target.checked)} className="accent-cyan-500 w-4 h-4" disabled={isProcessing}/>
                                            {voice.name} ({voice.gender === 'Male' ? t('common.male') : t('common.female')})
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">{t('config.script.srtUploadTitle')}</label>
                      {!srtFile ? (
                        <label htmlFor="srt-upload" className="flex justify-center items-center px-6 py-4 border-2 border-gray-500 border-dashed rounded-md cursor-pointer hover:bg-gray-700/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          <div className="space-y-1 text-center">
                            <UploadIcon className="mx-auto h-8 w-8 text-gray-400" />
                            <div className="flex text-sm text-gray-400">
                              <span className="relative bg-gray-800 rounded-md font-medium text-cyan-400 hover:text-cyan-300 px-1">
                                <span>{t('config.upload.selectFile')}</span>
                                <input id="srt-upload" type="file" className="sr-only" accept=".srt" onChange={handleSrtFileChange} disabled={isProcessing || !hasDialogue} />
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">SRT</p>
                          </div>
                        </label>
                      ) : (
                        <div className="bg-gray-800 p-3 rounded-md flex items-center justify-between">
                          <p className="text-sm text-green-400 break-all">{t('config.upload.selected')}: {srtFile.name}</p>
                          <button onClick={resetSrtFile} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 disabled:text-gray-500" disabled={isProcessing}>
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                        <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-300 mb-1">{t('config.script.customPrompt')}</label>
                        <textarea id="customPrompt" rows={3} value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" placeholder={t('config.script.customPromptPlaceholder')} disabled={isProcessing}/>
                    </div>
                </section>
                
                <button onClick={handleRewriteScript} disabled={isProcessing} className="w-full py-3 px-6 text-lg font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-md transition-colors">
                    {isAnalyzing ? t('buttons.writing') : t('buttons.rewriteScript')}
                </button>
            </div>
        )}
        
        {(scenes.length > 0 || isAnalyzing) && (
            <section className="pt-4">
                <div className="flex justify-between items-center mb-4">
                     <div>
                        <h3 className="text-xl font-semibold text-white">{t('results.script.title')}</h3>
                        {scenes.length > 0 && !isAnalyzing && (
                             <p className="text-sm text-gray-400">{t('results.script.subtitle')}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleOpenAllScenesJsonModal} disabled={scenes.length === 0} className="flex items-center gap-2 text-sm bg-blue-900/50 hover:bg-blue-800/50 text-blue-300 px-3 py-1.5 rounded-md disabled:opacity-50 transition-colors">
                            <EditIcon className="w-4 h-4"/> {t('buttons.editAllJson')}
                        </button>
                        <button onClick={handleCopy} disabled={scenes.length === 0} className="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-md disabled:opacity-50 transition-colors">
                            <CopyIcon className="w-4 h-4"/> {copyStatus || t('buttons.copyText')}
                        </button>
                         <button onClick={handleDownloadJson} disabled={scenes.length === 0} className="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-md disabled:opacity-50 transition-colors">
                            <DownloadIcon className="w-4 h-4"/> {t('buttons.downloadJson')}
                        </button>
                    </div>
                </div>
                <div className="max-h-[60vh] overflow-y-auto bg-gray-900/50 p-4 rounded-lg text-gray-300 prose prose-invert prose-sm">
                    {isAnalyzing && scenes.length === 0 ? <p>{t('status.writingInProgress')}</p> : 
                    (
                        <div>
                            {scenes.map((scene, index) => (
                                <div key={index} className="mb-6 last:mb-0">
                                    {scene.title && (
                                        <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-700">
                                            <h4 className="font-bold text-lg text-cyan-400">{scene.title}</h4>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleOpenSceneJsonModal(index, scene.jsonConfig)} className="flex items-center gap-1.5 text-xs bg-blue-900/50 hover:bg-blue-800/50 px-2 py-1 rounded-md transition-colors text-blue-300">
                                                    <EditIcon className="w-3 h-3"/>
                                                    {t('buttons.editJson')}
                                                </button>
                                                <button onClick={() => handleSceneCopy(scene, index)} className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded-md transition-colors">
                                                    <CopyIcon className="w-3 h-3"/>
                                                    {sceneCopyStatus?.index === index ? sceneCopyStatus.message : t('buttons.copyScene')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <p className="whitespace-pre-wrap text-gray-300">{scene.content}</p>
                                </div>
                            ))}
                        </div>
                    )
                    }
                </div>
            </section>
        )}
      </div>

      <JsonEditorModal
        isOpen={!!editingSceneInfo}
        onClose={() => setEditingSceneInfo(null)}
        title={`${t('modal.editTitleScene')} ${editingSceneInfo ? editingSceneInfo.index + 1 : ''}`}
        jsonString={editableSceneJsonString}
        onJsonStringChange={setEditableSceneJsonString}
        onSave={handleSaveSceneJson}
        onCopy={handleCopySingleJson}
        copyStatus={singleJsonCopyStatus}
      />

      <JsonEditorModal
        isOpen={isEditingAllScenesJson}
        onClose={() => setIsEditingAllScenesJson(false)}
        title={t('modal.editTitleAllScenes')}
        jsonString={editableAllScenesJsonString}
        onJsonStringChange={setEditableAllScenesJsonString}
        onSave={handleSaveAllScenesJson}
        onCopy={handleCopyAllJson}
        copyStatus={allJsonCopyStatus}
      />

      <video ref={videoRef} style={{ display: 'none' }} crossOrigin="anonymous"></video>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
}

// App Wrapper with Language Provider // Bọc App bằng Language Provider
export default function App() {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    );
}
