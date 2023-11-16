import React, { FC } from 'react'

interface resultProps {
    correctChars: number;
    wrongChars: number;
    correctWords: number;
    wrongWords: number;
    timeInSeconds: number;
}
const Result: FC<resultProps> = ({correctChars, wrongChars,correctWords,wrongWords, timeInSeconds}) => {

    const calculateWPM = () => {
        const words = correctWords;
        const minutes = timeInSeconds / 60;
        const wpm = words / minutes;
        return wpm;
      };

      const calculateCPM = () => {
        const characters = correctChars;
        const minutes = timeInSeconds / 60;
        const cpm = characters / minutes;
        return cpm;
      };

      const calculateAccuracy = () => {
        const accuracy = (correctChars / (correctChars+wrongChars)) * 100;
        return accuracy.toFixed(1); 
      };

      const calculateErrorRate = () => {
        const errorRate = (((correctChars+wrongChars) - correctChars) / (correctChars+wrongChars)) * 100;
        return errorRate.toFixed(1); 
      };
      
      
      

  return (
    <div>
        <p>Number of correct characters: {correctChars}</p>
        <p>Number of wrong characters: {wrongChars}</p>
        <p>Number of correct words: {correctWords}</p>
        <p>Number of wrong words: {wrongWords}</p>
        <p>WPM: {calculateWPM() }</p>
        <p>CPM: {calculateCPM()}</p>
        <p>Accuracy: {calculateAccuracy()}</p>
        <p>Error: {calculateErrorRate()}</p>
    </div>
  )
}

export default Result