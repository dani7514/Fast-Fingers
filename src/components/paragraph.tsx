import React, { useEffect, useState } from 'react';
import { faker } from '@faker-js/faker';
import useKeyDown from '../hooks/useKeyDown';
import Result from './result';
import Timer from './timer';


const Paragraph = () => {
  const { paragraphContent,resetParagraphContent } = useKeyDown();
  const [words, setWords] = useState('');
  const [userInput, setUserInput] = useState('');
  const [correctChar, setCorrectChar] = useState(0);
  const [wrongChar, setWrongChar] = useState(0);
  const [correctWords, setCorrectWords] = useState(0);
  const [wrongWords, setWrongWords] = useState(0);

  const [startTime,setStartTime]=useState(false);
  const [endTime,setEndTime]=useState(false);
  const [end,setEnd]=useState(false);

  const [timeInSeconds,setTimeInSeconds]=useState(15);


  const numberOfWord = 80;

  useEffect(() => {
    setWords(generateWords(numberOfWord));
  }, []);

  const refresh = (numberOfWord: number) => {
    setWords(generateWords(numberOfWord));
    setUserInput('');
    resetParagraphContent();
    setStartTime(false);
    setEndTime(false);
    setEnd(true);

  };

  const generateWords = (numberOfWord: number) => {
    return faker.word.words(numberOfWord);
  };

  const getColorForCharacter = (userChar: string, wordChar: string) => {
    if (userChar === wordChar) {
     return 'green'; 
    } else if (userChar) {
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

  const endFunction = () =>{
    setWords(generateWords(numberOfWord));
    setUserInput('');
    resetParagraphContent();
    setStartTime(false);
    setEndTime(true);
    setEnd(true);
  }

  const endTimer = () =>{
    setWords(generateWords(numberOfWord));
    setUserInput('');
    resetParagraphContent();
    setStartTime(false);
    setEnd(true);
  }

  useEffect(() => {
    if (userInput) {
      setStartTime(true);
      setEndTime(false)
    }
  }, [userInput]);
 

  const changeTime = (time: number) =>{
    setTimeInSeconds(time);
  }

  const checkCorrectWords = () => {
    const inputWords = userInput.split(' ');
    const originalWords = words.split(' ');
    let correct = 0;
    let wrong = 0;

    for (let i = 0; i < inputWords.length; i++) {
      if (inputWords[i] === originalWords[i]) {
        correct++;
      } else {
        wrong++;
      }
    }


    setCorrectWords(correct);
    setWrongWords(wrong);
  };

  useEffect(() => {
    if (userInput) {
      checkCorrectWords();
      checkCorrectCharacters();
    }
  }, [userInput]);


  const checkCorrectCharacters= () => {
    const inputWords = userInput;
    const originalWords = words;
    let correct = 0;
    let wrong = 0;

    for (let i = 0; i < inputWords.length; i++) {
      if (inputWords[i] === originalWords[i]) {
        correct++;
      } else {
        wrong++;
      }
    }

    setCorrectChar(correct);
    setWrongChar(wrong);
    
  }

 
 
  return (
    <div>
      <button type="button" onClick={() =>{
        changeTime(15)
        refresh(numberOfWord)
        }}>15</button>
      <button type="button" onClick={() =>{
        changeTime(30)
        refresh(numberOfWord)
        }}>30</button>
      <button type="button" onClick={() =>{
        changeTime(60)
        refresh(numberOfWord)
        }}>60</button>
      <Timer startTime={startTime} endFunction={endFunction} 
      timeInSeconds={timeInSeconds} end={end} endTimer={endTimer}  />
      <button type="button" onClick={() => refresh(numberOfWord)}>
        refresh
      </button>
      <br />
      <p>{coloredText(words)}</p>
      <br />
      {
        endTime ? <Result  correctChars={correctChar} wrongChars={wrongChar} 
        correctWords={correctWords} wrongWords={wrongWords} timeInSeconds={timeInSeconds}/>
        : null
      }
     
      
    </div>
  );
};

export default Paragraph;
