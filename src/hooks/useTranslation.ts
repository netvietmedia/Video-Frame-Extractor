import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';

// Define the shape of the context // Định nghĩa cấu trúc của context
interface LanguageContextType {
    language: string;
    setLanguage: (language: string) => void;
    t: (key: string, replacements?: { [key: string]: string | number }) => string;
}

// Create the context with a default value // Tạo context với giá trị mặc định
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// A function to get nested keys from the translation object // Một hàm để lấy các khóa lồng nhau từ đối tượng dịch
const getNestedTranslation = (obj: any, key: string): string | undefined => {
    return key.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
};

// The provider component that wraps the application // Component provider bao bọc toàn bộ ứng dụng
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageInternal] = useState('vi'); // Default language is Vietnamese // Ngôn ngữ mặc định là Tiếng Việt
    const [translations, setTranslations] = useState<{ current: any, fallback: any }>({ current: null, fallback: null });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTranslations = async () => {
            setIsLoading(true);
            try {
                // Fetch both current language and fallback language (English) concurrently
                // Tải đồng thời cả ngôn ngữ hiện tại và ngôn ngữ dự phòng (Tiếng Anh)
                const [currentLangResponse, fallbackLangResponse] = await Promise.all([
                    fetch(`./src/locales/${language}.json`),
                    fetch(`./src/locales/en.json`)
                ]);

                if (!currentLangResponse.ok || !fallbackLangResponse.ok) {
                    throw new Error('Failed to load translation files');
                }

                const current = await currentLangResponse.json();
                const fallback = await fallbackLangResponse.json();

                setTranslations({ current, fallback });
            } catch (error) {
                console.error("Error loading translation files:", error);
                // If loading fails, we might still want to show the app with keys or just English
                // Nếu tải thất bại, chúng ta có thể vẫn muốn hiển thị ứng dụng với các khóa hoặc chỉ Tiếng Anh
                try {
                     const fallbackLangResponse = await fetch(`./src/locales/en.json`);
                     const fallback = await fallbackLangResponse.json();
                     setTranslations({ current: fallback, fallback }); // Use English for both
                } catch(e) {
                    console.error("Failed to load fallback translation file:", e);
                    setTranslations({ current: {}, fallback: {} }); // empty translations
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchTranslations();
    }, [language]);

    // The translation function // Hàm dịch thuật
    const t = useCallback((key: string, replacements?: { [key: string]: string | number }): string => {
        if (isLoading || !translations.current || !translations.fallback) {
            // Return empty string while loading to avoid flashing untranslated keys // Trả về chuỗi rỗng khi đang tải để tránh nhấp nháy các khóa chưa được dịch
            return ''; 
        }

        let translation = getNestedTranslation(translations.current, key);

        if (translation === undefined) {
            // Fallback to English if the key is not found in the current language
            // Quay về Tiếng Anh nếu không tìm thấy khóa trong ngôn ngữ hiện tại
            translation = getNestedTranslation(translations.fallback, key);
        }

        if (translation === undefined) {
             // If still not found, return the key itself // Nếu vẫn không tìm thấy, trả về chính khóa đó
            return key;
        }

        // Handle replacements for dynamic values (e.g., {count}) // Xử lý các thay thế cho giá trị động (ví dụ: {count})
        if (replacements) {
            Object.keys(replacements).forEach(placeholder => {
                const regex = new RegExp(`{${placeholder}}`, 'g');
                translation = String(translation).replace(regex, String(replacements[placeholder]));
            });
        }

        return String(translation);
    }, [isLoading, translations]);
    
    // Wrapper for setLanguage to manage loading state // Hàm bao bọc cho setLanguage để quản lý trạng thái tải
    const setLanguage = (lang: string) => {
        if(lang !== language) {
            setLanguageInternal(lang);
        }
    };
    
    const contextValue = { language, setLanguage, t };

    // Render children only when not loading // Chỉ render children khi không tải
    // FIX: The use of React.createElement can sometimes cause issues with TypeScript's type inference for components.
    // Using JSX is more idiomatic and robust.
    // FIX: The JSX syntax is invalid in a .ts file and was causing parsing errors. It has been replaced with the equivalent `React.createElement` call.
    return React.createElement(LanguageContext.Provider, { value: contextValue }, isLoading ? null : children);
};

// The custom hook to be used in components // Hook tùy chỉnh để sử dụng trong các component
export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};
