import React, { FC, useEffect, useState } from 'react';
import { faker } from '@faker-js/faker';
import useKeyDown from '../hooks/useKeyDown';
import Result from './result';
import Timer from './timer';
import ResultPopUp from './popUp';
import Header from './header';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { Room } from '../room/room';
import { useParams } from 'react-router-dom';



const MultiplayerParagraph = () => {
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
  const {roomId} =useParams();

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

//   useEffect(() => {
//     setWords(paragraph);
//   }, []);


  const refresh = async (numberOfWord: number, roomId: string, timeInSeconds: number) => {
    const roomRef = doc(db, 'rooms', roomId);
    try{
        await updateDoc(roomRef, { gameStarted: true , paragraph: generateWords(numberOfWord), timeInSeconds: timeInSeconds });
        const unsubscribe = onSnapshot(roomRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
              const roomData = docSnapshot.data() as Room;
              if (roomData){
                setWords(roomData.paragraph)
                setTimeInSeconds(roomData.timeInSeconds)
                
                } 
            }
        });
        setUserInput('');
        resetParagraphContent();
        setStartTime(false);
        setEndTime(false);
        setEnd(true);
    
    return () => unsubscribe();
        
    } catch (err) {
        console.log(err)
    }

   

  };

//   useEffect (() => {
//     setTimeInSeconds(selectedSecond);
//   },[selectedSecond]);

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

 
  useEffect( () => {
    if (!roomId) {
        console.log("Room ID is undefined");
        return;
      }

    const roomRef = doc(db, 'rooms', roomId);

    
        const unsubscribe = onSnapshot(roomRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
              const roomData = docSnapshot.data() as Room;
              if (roomData){
                setWords(roomData.paragraph)
                setTimeInSeconds(roomData.timeInSeconds)
        
                } 
            }
        });
    
    return () => unsubscribe();
  },[roomId])
 
  return (
    <>
    <div className=' text-2xl p-11 '>
        
      
      <Timer startTime={startTime} endFunction={endFunction} 
      timeInSeconds={timeInSeconds} end={end} endTimer={endTimer}  />
      <br />
      <p className='px-11 text-justify word-spacing-10 tracking-wider'>{coloredText(words)}</p>
      <br />
      <div className="flex justify-center items-center pt-5">
        <button type="button"  className='cursor-pointer rounded-md p-3 font-nunito text-xl back   ' onClick={() => refresh(numberOfWord, roomId!, timeInSeconds)}>
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

export default MultiplayerParagraph;


