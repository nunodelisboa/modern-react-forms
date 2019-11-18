import { useMemo, useCallback } from 'react';
import { createErrorGenerator, noErrorGenerator } from '../validators';

export default (id, { params, deps, validator, errorText, onlyIf = true } = {}, forceDeps = []) => {
  const validatorFn = useCallback(validator, forceDeps);
  const spec = useMemo(() => ({ [id]: { params, dependencies: deps, validator: validatorFn } }), [
    deps,
    id,
    params,
    validatorFn
  ]);

  const generator = useMemo(
    () => (onlyIf ? createErrorGenerator(spec, { [id]: errorText || '' }) : noErrorGenerator()),
    [errorText, id, onlyIf, spec]
  );

  return generator;
};
