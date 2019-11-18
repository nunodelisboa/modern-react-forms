import * as Validators from './builtIn';
import noError from './noError';

// validations can be (a) String (name of validation) (b) an object { [id] : { params: [], dependencies: [], validator } }, (c) { [id] : Boolean }

// validationErrors is an object { [name]: String } and defaults "The value is invalid"

export const createErrorGenerator = (spec, errs) => {
  if (typeof spec === 'string') return createStringErrorGenerator(spec, errs);
  if (typeof spec !== 'object') {
    throw new Error('Cannot parse unknown validation specification', spec);
  }

  const errorGenerators = Object.entries(spec)
    .map(([key, value]) => createErrorGeneratorFromObject(key, value, errs))
    .filter(Boolean);

  return combineErrorGenerators(errorGenerators, errs);
};

function createErrorGeneratorFromObject (id, spec, errs) {
  if (Validators[id] != null) return createWellKnownErrorGenerator(id, [], errs);
  if (!spec) return null;
  if (typeof spec !== 'object') throw new Error(`Invalid validator specification for ${id}`);

  const { params = [], dependencies, validator } = spec;
  if (!validator) {
    throw new Error(`Cannot create errorGenerator for ${id} without custom validator`);
  }

  if ([...new Set(dependencies || [])].length !== (dependencies || []).length) {
    throw new Error('Cannot specify duplicate dependencies');
  }

  const errorGenerator = (value, ...deps) => {
    const isValid = validator(value, params, deps);
    return isValid ? [false] : [true, errs[id]];
  };

  errorGenerator.$id = id;
  errorGenerator.$dependencies = dependencies;

  return errorGenerator;
}

function createWellKnownErrorGenerator (id, params = [], errs) {
  if (Validators[id] == null) throw new Error(`Unknown validation: "${id}"`);

  const errorGenerator = value => {
    const isValid = Validators[id](value, params);
    return isValid ? [false] : [true, errs[id]];
  };

  errorGenerator.$id = id;

  return errorGenerator;
}

function createStringErrorGenerator (spec, errs) {
  const [id, ...params] = spec.split(':');
  return createWellKnownErrorGenerator(id, params, errs);
}

export function noErrorGenerator () {
  return noError;
}

export function combineErrorGenerators (generators) {
  if (generators.length === 0) return noErrorGenerator();
  const [one, ...rest] = generators;
  if (rest.length === 0) return one;

  const combinedRest = combineErrorGenerators(rest);
  const [common, justO, justR] = combineDependencies(one.$dependencies, combinedRest.$dependencies);

  const errorGenerator = (value, ...deps) => {
    const cDeps = subArray(deps, 0, common.length);
    const oDeps = subArray(deps, common.length, justO.length);
    const rDeps = subArray(deps, common.length + justO.length, justR.length);

    return [one(value, ...cDeps, ...oDeps), combinedRest(value, ...cDeps, ...rDeps)].reduce(
      ([cHasError, cText], [hasError, text]) => [hasError || cHasError, cText || text],
      [false]
    );
  };

  errorGenerator.$id = [].concat(one.$id, combinedRest.$id);
  errorGenerator.$dependencies = [].concat(common, justO, justR);

  return errorGenerator;
}

function subArray (ary = [], startIndex, len = ary.length) {
  return ary.slice(startIndex, startIndex + len - 1);
}

function combineDependencies (depA = [], depB = []) {
  const common = [];
  const justA = [];
  const justB = [];

  depA.forEach(d => (depB.includes(d) ? common.push(d) : justA.push(d)));
  depB.forEach(d => (depA.includes(d) ? common.push(d) : justB.push(d)));

  return [[...new Set(common)], justA, justB];
}
