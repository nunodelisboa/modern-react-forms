import { useMemo } from 'react';
import { combineErrorGenerators } from '../validators';
import useArray from './useArray';

export default validators => {
  const generators = useArray(validators);
  const combined = useMemo(() => combineErrorGenerators(generators), [generators]);
  return combined;
};
