import React, { FC, useEffect, useMemo, useState } from 'react'
import useNumberOfRenders from '../hooks/useNumberOfRenders';

interface TimeProps {
    startTime: boolean;
    endFunction: Function; // or () => void
    timeInSeconds: number;
    end: boolean; 
    endTimer: Function;
}

const Timer :  FC<TimeProps>  = ({startTime,endFunction,timeInSeconds, end, endTimer }) => {
    const [counterInsecond, setCounterInSecond] = useState(0);
    const [timeFormat, setTimeFormat] = useState('');
    const { current: numberOfRenders } = useNumberOfRenders()

    
    const timeSetUp = useMemo(() => {
        const seconds= counterInsecond % 60;
        const minutes=Math.floor(counterInsecond /60)

        const second=seconds.toString().length ===1 ? '0' + seconds : seconds;
        const minute=minutes.toString().length ===1 ? '0' + minutes: minutes;

        return `${minute} : ${second}`;
    },[counterInsecond]);

    useEffect (() => {
        if (counterInsecond > 0 && startTime ){
            
           const timerId= setTimeout(() =>{
                setCounterInSecond((count)=> count-1);
                setTimeFormat(timeSetUp);
            },1000);

            return () => {
                clearTimeout(timerId); 
              };
        }
        
        if (counterInsecond === 0 ){
            if (numberOfRenders > 1){
                endFunction();
            }
            setCounterInSecond(timeInSeconds);
        }

        if(end){
            endTimer();
            setCounterInSecond(timeInSeconds);
        }
    },[counterInsecond, timeInSeconds, startTime]);

    useEffect (() => {
        setCounterInSecond(timeInSeconds);
    },[timeInSeconds]);

    useEffect (() => {
        setTimeFormat(timeSetUp);
    },[counterInsecond]);

  return (
    <div className='px-11 pt-11 textColor'>
        {timeFormat}
    </div>
  )
}

export default Timer