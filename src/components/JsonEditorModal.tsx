import React from 'react';
import { CopyIcon, XIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

interface JsonEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    jsonString: string;
    onJsonStringChange: (value: string) => void;
    onSave: () => void;
    onCopy: () => void;
    copyStatus: string;
}

export const JsonEditorModal: React.FC<JsonEditorModalProps> = ({
    isOpen,
    onClose,
    title,
    jsonString,
    onJsonStringChange,
    onSave,
    onCopy,
    copyStatus
}) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div
                className="bg-gray-800 rounded-lg shadow-xl w-[70vw] h-[70vh] max-w-[95vw] max-h-[95vh] min-w-[50vw] min-h-[50vh] flex flex-col"
                style={{ resize: 'both', overflow: 'auto' }}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-gray-400 hover:text-white"/></button>
                </div>
                <div className="p-4 flex-1 min-h-0">
                    <textarea
                        className="w-full h-full bg-gray-900 text-gray-300 p-3 rounded-md font-mono text-sm border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        value={jsonString}
                        onChange={(e) => onJsonStringChange(e.target.value)}
                        style={{ resize: 'none' }}
                    />
                </div>
                <div className="flex justify-between items-center p-4 border-t border-gray-700 flex-shrink-0">
                    <button onClick={onCopy} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm">
                        <CopyIcon className="w-4 h-4" />
                        {copyStatus || t('buttons.copy')}
                    </button>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md">{t('buttons.cancel')}</button>
                        <button onClick={onSave} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md">{t('buttons.save')}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
