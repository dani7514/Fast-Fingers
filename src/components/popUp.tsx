import { Button, Modal } from 'flowbite-react';
import { FC, useEffect, useState } from 'react';
// import useKeyDown from '../hooks/useKeyDown';

interface resultProp {
    openModal: boolean;
  correctChars: number;
  wrongChars: number;
  correctWords: number;
  wrongWords: number;
  timeInSeconds: number;
  onClose: () => void;
}

const ResultPopUp: FC<resultProp> = ({
openModal,
  correctChars,
  wrongChars,
  correctWords,
  wrongWords,
  timeInSeconds,
  onClose,
}) => {
//   const [openModal, setOpenModal] = useState(false);
// //   const {setIsKeyboardEnabled}=useKeyDown()

//   useEffect(() => {
//     if (endTime) {
//         setOpenModal(true);
//         // setIsKeyboardEnabled(false);
//       } 
//   }, [endTime]);

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
    const accuracy = (correctChars / (correctChars + wrongChars)) * 100;
    return accuracy.toFixed(1);
  };

  const calculateErrorRate = () => {
    const errorRate =
      ((correctChars + wrongChars - correctChars) / (correctChars + wrongChars)) * 100;
    return errorRate.toFixed(1);
  };

//   useEffect(() => {
//     if (openModal){
//         setIsKeyboardEnabled(false);
//       } else{
//         setIsKeyboardEnabled(true); 
//       }
//   },[openModal])
  


  return (
    <>
      <Modal dismissible show={openModal} onClose={onClose} className="w-full">
        <Modal.Header className="back p-10">
          <h1 className="text-2xl font-nunito back">Typing Test Results</h1>
        </Modal.Header>
        <Modal.Body className="back p-10">
          <div className="grid grid-cols-4 gap-5">
            <div className="back p-4 rounded shadow-md">
              <h2 className="text-xl font-semibold">Correct Characters</h2>
              <p className="text-3xl text-green-500 font-bold">{correctChars}</p>
            </div>
            <div className="back p-4 rounded shadow-md">
              <h2 className="text-xl font-semibold">Wrong Characters</h2>
              <p className="text-3xl text-red-500 font-bold">{wrongChars}</p>
            </div>
            <div className="back p-4 rounded shadow-md">
              <h2 className="text-xl font-semibold">Correct Words</h2>
              <p className="text-3xl text-green-500 font-bold">{correctWords}</p>
            </div>
            <div className="back p-4 rounded shadow-md">
              <h2 className="text-xl font-semibold">Wrong Words</h2>
              <p className="text-3xl text-red-500 font-bold">{wrongWords}</p>
            </div>
            <div className="back p-4 rounded shadow-md">
              <h2 className="text-xl font-semibold">WPM </h2>
              <p className="text-3xl font-bold">{calculateWPM()}</p>
            </div>
            <div className="back p-4 rounded shadow-md">
              <h2 className="text-xl font-semibold">CPM </h2>
              <p className="text-3xl font-bold">{calculateCPM()}</p>
            </div>
            <div className="back p-4 rounded shadow-md">
              <h2 className="text-xl font-semibold ">Accuracy</h2>
              <p className="text-3xl font-bold">{calculateAccuracy()}%</p>
            </div>
            <div className="back p-4 rounded shadow-md">
              <h2 className="text-xl font-semibold">Error Rate</h2>
              <p className="text-3xl font-bold">{calculateErrorRate()}%</p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="back p-10">
          <Button
            onClick={onClose}
            className=" font-nunito py-2 px-4 rounded"
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ResultPopUp;
