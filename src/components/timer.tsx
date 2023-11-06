import React, { FC, useEffect, useMemo, useState } from 'react'

interface TimeProps {
    startTime: boolean;
    endFunction: Function; // or () => void
    timeInSeconds: number;
}

const Timer :  FC<TimeProps>  = ({startTime,endFunction,timeInSeconds}) => {
    const [counterInsecond, setCounterInSecond] = useState(0);
    const [timeFormat, setTimeFormat] = useState('');

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

        if (counterInsecond === 0){
            endFunction();
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
    <div>
        {timeFormat}
    </div>
  )
}

export default Timer