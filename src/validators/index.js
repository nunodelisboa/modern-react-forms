import * as Validators from './builtIn';

// validations can be (a) String (name of validation) (b) an object { id, params: [], dependencies: [], validator }, (c) an array of (a) or (b)
// (a) Can be "{name}" or  "{name}:{param1}:{param2}"

// validationErrors is an object { [name]: String } and defaults "The value is invalid"

export const createErrorGenerator = (spec, errs) => {
  if (Array.isArray(spec)) combineErrorGenerators(spec, errs);
  if (typeof spec === 'string') return createStringErrorGenerator(spec, errs);
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
      return isValid ? [false] : [true, errs[id]];
    },
    dependencies
  };
};

function createStringErrorGenerator (spec, errs) {
  const [id, ...params] = spec.split(':');
  if (Validators[id] == null) throw new Error(`Unknown validation: "${id}"`);
  return {
    errorGenerator: value => {
      const isValid = Validators[id](value, params);
      return isValid ? [false] : [true, errs[id]];
    },
    dependencies: []
  };
}

function combineErrorGenerators (specs, errs) {
  const [one, ...rest] = specs;

  if (rest.length === 0) return createErrorGenerator(one);

  const { errorGenerator: errorGeneratorO, dependencies: depO } = createErrorGenerator(one, errs);
  const { errorGenerator: errorGeneratorR, dependencies: depR } = createErrorGenerator(rest, errs);

  const [common, justO, justR] = combineDependencies(depO, depR);

  return {
    errorGenerator: (value, ...deps) => {
      const cDeps = subArray(deps, 0, common.length);
      const oDeps = subArray(deps, common.length, justO.length);
      const rDeps = subArray(deps, common.length + justO.length, justR.length);

      return [
        errorGeneratorO(value, ...cDeps, ...oDeps),
        errorGeneratorR(value, ...cDeps, ...rDeps)
      ].reduce((acc, res) => [acc[0] && res[0], acc[1] || res[1]], [false]);
    },
    dependencies: [].concat(common, justO, justR)
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
