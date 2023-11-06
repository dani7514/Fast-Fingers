import { useCallback, useEffect,  useState } from 'react';

const useKeyDown = () => {
    const [paragraphContent, setParagraphContent] = useState('');

    const handleKeyDown = ({ key }: KeyboardEvent) => { 
    
        if (key === 'Backspace') {
            setParagraphContent((prevContent) => prevContent.slice(0, -1));
        } else if (key === ' ') {
            setParagraphContent((prevContent) => prevContent + ' ');
        } else {
            setParagraphContent((prevContent) => prevContent + key);
        }


    }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const resetParagraphContent = useCallback(() => {
    setParagraphContent('');
  }, [setParagraphContent]);
  
  return {
    paragraphContent,
    resetParagraphContent
  }
};

export default useKeyDown;





