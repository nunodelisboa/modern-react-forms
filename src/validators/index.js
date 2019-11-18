import * as Validators from './builtIn';

// validations can be (a) String (name of validation) (b) an object { id, params: [], dependencies: [], validator }, (c) an array of (a) or (b)
// (a) Can be "{name}" or  "{name}:{param1}:{param2}"

// validationErrors is an object { [name]: String } and defaults "The value is invalid"

export const createErrorGenerator = (spec, errors) => {
  if (Array.isArray(spec)) combineErrorGenerators(spec, errors);
  if (typeof spec === 'string') return createStringErrorGenerator(spec, errors);
  if (typeof spec !== 'object') {
    throw new Error('Cannot parse unknown validation specification', spec);
  }

  const { id, params = [], dependencies = [], validator: userValidator } = spec;

  if ([...new Set(dependencies)].length !== dependencies.length) {
    throw new Error('Cannot specify duplicate dependencies');
  }

  return {
    errorGenerator: (value, ...deps) => {
      const isValid = userValidator(value, params, deps);
      return isValid ? [false] : [true, errors[id]];
    },
    dependencies
  };
};

function createStringErrorGenerator (spec, errors) {
  const [id, ...params] = spec.split(':');
  if (Validators[id] == null) throw new Error(`Unknown validation: "${id}"`);
  return {
    errorGenerator: value => {
      const isValid = Validators[id](value, params);
      return isValid ? [false] : [true, errors[id]];
    },
    dependencies: []
  };
}

function combineErrorGenerators (...specs) {
  const [one, ...rest] = specs;

  if (rest.length === 0) return createErrorGenerator(one);

  const { errorGenerator: errorGeneratorOne, dependencies: depOne } = createErrorGenerator(one);
  const { errorGenerator: errorGeneratorRest, dependencies: depRest } = createErrorGenerator(rest);

  const [common, justOne, justRest] = combineDependencies(depOne, depRest);

  return {
    errorGenerator: (value, ...deps) => {
      const commonDeps = subArray(deps, 0, common.length);
      const oneDeps = subArray(deps, common.length, justOne.length);
      const restDeps = subArray(deps, common.length + justOne.length, justRest.length);

      return [
        errorGeneratorOne(value, ...commonDeps, ...oneDeps),
        errorGeneratorRest(value, ...commonDeps, ...restDeps)
      ].reduce((acc, res) => [acc[0] && res[0], acc[1] || res[1]], [false]);
    },
    dependencies: [].concat(common, justOne, justRest)
  };
}

function subArray (ary = [], startIndex, len = ary.length) {
  return ary.slice(startIndex, startIndex + len - 1);
}

function combineDependencies (depA, depB) {
  const common = [];
  const justA = [];
  const justB = [];

  depA.forEach(d => (depB.includes(d) ? common.push(d) : justA.push(d)));
  depB.forEach(d => (depA.includes(d) ? common.push(d) : justB.push(d)));

  return [[...new Set(common)], justA, justB];
}
