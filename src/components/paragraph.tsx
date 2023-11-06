import React, { useEffect, useState } from 'react'
import { faker } from '@faker-js/faker';

const Paragraph = () => {
    const [words, setWords]= useState('');
    const numberOfWord=80

    useEffect(()=> {
        setWords(generateWords(numberOfWord));
    },[]);

    const refresh = (numberOfWord: number) => {
        setWords(generateWords(numberOfWord));
    }

    const generateWords= (numberOfWord: number) => {
        return faker.word.words(numberOfWord);
    }

  return (
    <div>
        <button type='button' onClick={() => refresh(numberOfWord)}>refresh</button>
        <br />
        {words}
    </div>
  )
}

export default Paragraph