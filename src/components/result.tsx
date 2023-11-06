import React, { FC } from 'react'

interface resultProps {
    correctChars: number;
    wrongChars: number;
}
const Result: FC<resultProps> = ({correctChars, wrongChars}) => {
  return (
    <div>
        <p>Number of correct characters: {correctChars}</p>
        <p>Number of wrong characters: {wrongChars}</p>
    </div>
  )
}

export default Result