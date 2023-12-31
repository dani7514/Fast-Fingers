import React, { useEffect, useState } from 'react';
import { faker } from '@faker-js/faker';
import useKeyDown from '../hooks/useKeyDown';
import Result from './result';
import Timer from './timer';
import ResultPopUp from './popUp';
import Header from './header';


const Paragraph = () => {
  const { paragraphContent,resetParagraphContent, setIsKeyboardEnabled } = useKeyDown();
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

  const [openModal, setOpenModal] = useState(false);
  const onClose = () => {
    setOpenModal(false)
    setIsKeyboardEnabled(true)
    }

//   const {setIsKeyboardEnabled}=useKeyDown()

  useEffect(() => {
    if (endTime) {
        setOpenModal(true);
        setIsKeyboardEnabled(false);
       
      } 
  }, [endTime]);

  const numberOfWord = 50;

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
     return '#FFCEFB'; 
    } else if (userChar) {
      return 'red'; 
    } else {
      return '#6DEAFF'; 
    }
  };

  const coloredText = (text: string) => {
    const characters = text.split('');
    const coloredText = characters.map((char, index) => (
      <span  key={index} style={{ color: getColorForCharacter(userInput[index], char) }}>
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
    <>
    <div className=' text-2xl p-11 '>
        <div className='flex items-center justify-center gap-3 rounded-lg '> 
            <button style={
                {
                    color: timeInSeconds === 15 ? '#FFCEFB ': '',
                  }
            } className='cursor-pointer rounded-md p-2 font-mono text-xl back' type="button" onClick={() =>{
                changeTime(15)
                refresh(numberOfWord)
                }}>15s</button>
            <button style={
                {
                    color: timeInSeconds === 30 ? '#FFCEFB ': '',
                  }
            } className='cursor-pointer rounded-md p-2 font-mono text-xl back' type="button" onClick={() =>{
                changeTime(30)
                refresh(numberOfWord)
                }}>30s</button>
            <button style={
                {
                    color: timeInSeconds === 60 ? '#FFCEFB ': '',
                  }
            } className='cursor-pointer rounded-md p-2 font-mono text-xl back ' type="button" onClick={() =>{
                changeTime(60)
                refresh(numberOfWord)
                }}>60s</button>
        </div>
      
      <Timer startTime={startTime} endFunction={endFunction} 
      timeInSeconds={timeInSeconds} end={end} endTimer={endTimer}  />
      <br />
      <p className='px-11 text-justify word-spacing-10 tracking-wider'>{coloredText(words)}</p>
      <br />
      <div className="flex justify-center items-center pt-5">
        <button type="button"  className='cursor-pointer rounded-md p-3 font-nunito text-xl back   ' onClick={() => refresh(numberOfWord)}>
            Refresh
        </button>
      </div>
      
      <br />
      <ResultPopUp onClose={onClose} openModal={openModal} correctChars={correctChar} wrongChars={wrongChar} 
        correctWords={correctWords} wrongWords={wrongWords} timeInSeconds={timeInSeconds}/>
      {/* {
        endTime ? <Result  correctChars={correctChar} wrongChars={wrongChar} 
        correctWords={correctWords} wrongWords={wrongWords} timeInSeconds={timeInSeconds}/>
        : null
      } */}
     
      
    </div>
    </>
    
  );
};

export default Paragraph;


