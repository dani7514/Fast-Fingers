import React, { useEffect, useState } from 'react';
import { faker } from '@faker-js/faker';
import useKeyDown from '../hooks/useKeyDown';
import Result from './result';

const Paragraph = () => {
  const { paragraphContent,resetParagraphContent } = useKeyDown();
  const [words, setWords] = useState('');
  const [userInput, setUserInput] = useState('');
  const [correctChar, setCorrectChar] = useState(0);
  const [wrongChar, setWrongChar] = useState(0);
  

  const numberOfWord = 80;

  useEffect(() => {
    setWords(generateWords(numberOfWord));
  }, []);

  const refresh = (numberOfWord: number) => {
    setWords(generateWords(numberOfWord));
    setUserInput('');
    resetParagraphContent();
  };

  const generateWords = (numberOfWord: number) => {
    return faker.word.words(numberOfWord);
  };

  const getColorForCharacter = (userChar: string, wordChar: string) => {
    if (userChar === wordChar) {
        setCorrectChar((prev)=> prev+1)
      return 'green'; 
    } else if (userChar) {
        setWrongChar((prev)=> prev+1)
      return 'red'; 
    } else {
      return 'black'; 
    }
  };

  const coloredText = (text: string) => {
    const characters = text.split('');
    const coloredText = characters.map((char, index) => (
      <span key={index} style={{ color: getColorForCharacter(userInput[index], char) }}>
        {char}
      </span>
    ));
    return coloredText;
  };

  useEffect(() => {
    setUserInput(paragraphContent)

  },[paragraphContent])

  return (
    <div>
      <button type="button" onClick={() => refresh(numberOfWord)}>
        refresh
      </button>
      <br />
      <p>{coloredText(words)}</p>
      <br />
        
      <Result  correctChars={correctChar} wrongChars={wrongChar} />
    </div>
  );
};

export default Paragraph;
