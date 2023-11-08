import { useEffect, useRef } from "react"

const useNumberOfRenders = () => {
  const numberOfRenders = useRef(0);

  useEffect(() => {
    numberOfRenders.current += 1;
  })

  return numberOfRenders;
}

export default useNumberOfRenders