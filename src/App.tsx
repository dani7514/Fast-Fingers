import React, { useState } from 'react';
import './App.css';
import Timer from './components/timer';
import Paragraph from './components/paragraph';

function App() {
  const [startTime,setStartTime]=useState(false);
  const [timeInSeconds,setTimeInSeconds]=useState(15);

  const endFunction = () =>{
    setStartTime(false);
  }

  const startFunction = () =>{
    setStartTime(true);
  }

  const changeTime = (time: number) =>{
    setTimeInSeconds(time);
  }



  return (
    <div className="App">
      <button type="button" onClick={() =>{
        startFunction()
        changeTime(15)
        }}>15</button>
      <button type="button" onClick={() =>{
        startFunction()
        changeTime(30)
        }}>30</button>
      <button type="button" onClick={() =>{
        startFunction()
        changeTime(60)
        }}>60</button>

      <Timer startTime={startTime} endFunction={endFunction} timeInSeconds={timeInSeconds}  />
      <Paragraph />
    </div>
  );
}

export default App;
