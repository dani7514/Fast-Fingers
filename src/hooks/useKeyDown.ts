import { useCallback, useEffect,  useState } from 'react';


const useKeyDown = () => {
    const [paragraphContent, setParagraphContent] = useState('');
    const [isKeyboardEnabled, setIsKeyboardEnabled] = useState(true);

    const handleKeyDown = ({ key }: KeyboardEvent) => { 
        if (!isKeyboardEnabled) return;

        if (key === 'Backspace') {
            setParagraphContent((prevContent) => prevContent.slice(0, -1));
        } else if (key === ' ') {
            setParagraphContent((prevContent) => prevContent + ' ');
        } else if (/^[A-Za-z]$/.test(key)) {
            
            setParagraphContent((prevContent) => prevContent + key);
        }else if (key === '-') {
            setParagraphContent((prevContent) => prevContent + '-');
        }else{
            return;
        }

    }

    useEffect(() => {
      if (isKeyboardEnabled){
        document.addEventListener('keydown', handleKeyDown);
      }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isKeyboardEnabled]);

  const resetParagraphContent = useCallback(() => {
    setParagraphContent('');
  }, [setParagraphContent]);

  console.log(isKeyboardEnabled, "here")

  
  return {
    paragraphContent,
    resetParagraphContent,
    setIsKeyboardEnabled
  }
};

export default useKeyDown;





