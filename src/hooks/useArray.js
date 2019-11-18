import { useRef, useState, useEffect } from 'react';
export default inAry => {
  const aryRef = useRef(inAry);
  const [ary, setAry] = useState(inAry);
  useEffect(() => {
    if (
      inAry.length !== aryRef.current.length ||
      inAry.some((a, i) => !Object.is(a, aryRef.current[i]))
    ) {
      aryRef.current = inAry;
      setAry(inAry);
    }
  }, [inAry]);

  return ary;
};
