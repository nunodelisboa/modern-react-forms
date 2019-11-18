import { useReducer, useRef, useMemo, useCallback, useState, useContext } from 'react';
import { FormContext } from '../context';
import { createErrorGenerator } from '../validators';

const UPDATE = 'UPDATE';

export default function Form ({
  name,
  onValidSubmit,
  onInvalidSubmit,
  disabled,
  children,
  ...moreProps
}) {
  const [model, mutateModel] = useReducer(modelReducer);
  const [valid, mutateValid] = useReducer(validReducer);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const formRef = useRef(null);
  const registry = useRef({});
  const getR = useCallback(name => registry.current[name], []);
  const setR = useCallback((name, val) => (registry.current[name] = { ...getR(name), ...val }), [
    getR
  ]);

  const registerField = useCallback(
    (name, value, validations, validationErrors, { deferred = false } = {}) => {
      const { errorGenerator, dependencies } = createErrorGenerator(validations, validationErrors);
      setR(name, {
        initial: value,
        errorGenerator,
        deps: dependencies,
        impacts: [],
        isDeferred: deferred
      });

      Object.keys(registry.current).map(key => {
        const registration = getR(key);
        const { impacts = [] } = registration;
        const unique = new Set(impacts);
        const isDependent = dependencies.includes(key);
        unique[isDependent ? 'add' : 'delete'](name);
        setR(key, { impacts: [...unique] });
      });
    },
    [getR, setR]
  );

  const setValue = useCallback(
    (name, value) => {
      if (!Object.is(model[name], value)) {
        mutateModel({ type: UPDATE, name, value });
        const { impacts = [], deps = [], errorGenerator, isDeferred } = getR(name);

        if (!isDeferred) {
          mutateValid({
            type: UPDATE,
            name,
            value: errorGenerator(value, ...deps.map(k => model[k]))
          });
        }

        impacts.forEach(impact => {
          const { deps = [], errorGenerator, isDeferred } = getR(impact);

          if (!isDeferred) {
            mutateValid({
              type: UPDATE,
              name: impact,
              value: errorGenerator(
                model[impact],
                ...deps.map(k => (k === name ? value : model[k]))
              )
            });
          }
        });
      }
    },
    [getR, model]
  );

  const onSubmit = useCallback(() => {
    setIsSubmitted(true);
    const isFormValid = Object.keys(registry.current).every(key => {
      const { deps = [], errorGenerator, isDeferred } = getR(name);
      let error = [false];
      if (isDeferred) {
        error = errorGenerator(model[key], ...deps.map(k => model[k]));
        mutateValid({
          type: UPDATE,
          name: key,
          value: error
        });
      }
      error = valid[key];
      return error;
    });

    if (isFormValid && onValidSubmit) onValidSubmit();
    if (!isFormValid && onInvalidSubmit) onInvalidSubmit();
  }, [getR, model, name, onInvalidSubmit, onValidSubmit, valid]);

  // TODO reset model to initial values
  const onReset = () => {};

  const validate = useCallback(
    name => {
      const { deps = [], errorGenerator } = getR(name);

      mutateValid({
        type: UPDATE,
        name,
        value: errorGenerator(model[name], ...deps.map(k => model[k]))
      });
    },
    [getR, model]
  );

  const parentContext = useContext(FormContext);

  const context = useMemo(
    () =>
      parentContext
        ? { ...parentContext, name }
        : {
            name,
            registerField,
            model,
            setValue,
            isSubmitted,
            form: formRef,
            validate
          },
    [isSubmitted, model, name, parentContext, registerField, setValue, validate]
  );

  const formProps = useMemo(
    () =>
      parentContext ? { disabled } : { id: name, name, onSubmit, onReset, disabled, ref: formRef },
    [disabled, name, onSubmit, parentContext]
  );

  // eslint-disable-next-line no-unused-vars
  const ConcreteForm = parentContext ? 'fieldset' : 'form';

  return (
    <FormContext.Provider value={context}>
      <ConcreteForm {...formProps} {...moreProps}>
        {children}
      </ConcreteForm>
    </FormContext.Provider>
  );
}

function modelReducer (state, action) {
  const { type, name, value } = action;
  switch (type) {
    case UPDATE:
      return { ...state, [name]: value };
    default:
      return state;
  }
}

function validReducer (state, action) {
  const { type, name, value } = action;
  switch (type) {
    case UPDATE:
      return { ...state, [name]: value };
    default:
      return state;
  }
}
