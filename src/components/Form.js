import React, { useReducer, useRef, useMemo, useCallback, useState, useContext } from 'react';
import PropTypes from 'prop-types';

import { FormContext } from '../context';

const UPDATE = 'UPDATE';

function Form ({ name, onValidSubmit, onInvalidSubmit, disabled, children, ...moreProps }) {
  const [model, mutateModel] = useReducer(modelReducer, {});
  const [valid, mutateValid] = useReducer(validReducer, {});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const formRef = useRef(null);
  const registry = useRef({});
  const getR = useCallback(name => registry.current[name], []);
  const setR = useCallback((name, val) => (registry.current[name] = { ...getR(name), ...val }), [
    getR
  ]);

  const registerField = useCallback(
    (name, value, validation, opts = {}) => {
      const { deferred = false } = opts;
      const { $id, $dependencies } = validation || {};

      if ($id == null) {
        throw new Error('Invalid validation, please use useValidation');
      }

      setR(name, {
        initial: value,
        errorGenerator: validation,
        deps: $dependencies,
        impacts: [],
        isDeferred: deferred
      });

      if (value != null) mutateModel({ type: UPDATE, name, value });

      Object.keys(registry.current).map(key => {
        const registration = getR(key);
        const { impacts = [] } = registration;
        const unique = new Set(impacts);
        const { $dependencies = [] } = validation || {};
        const isDependent = $dependencies.includes(key);
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

  const onReset = useCallback(() => {
    Object.keys(registry.current).forEach(key => {
      const { initial } = getR(key);
      mutateModel({ type: UPDATE, name: key, value: initial });
      mutateValid({ type: UPDATE, name: key, value: [false] });
    });
  }, [getR]);

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
  const hasParentContext = parentContext && parentContext.name;

  const context = useMemo(
    () =>
      hasParentContext
        ? { ...parentContext, name }
        : {
            name,
            registerField,
            model,
            valid,
            setValue,
            isSubmitted,
            form: formRef,
            validate
          },
    [
      hasParentContext,
      isSubmitted,
      model,
      name,
      parentContext,
      registerField,
      setValue,
      valid,
      validate
    ]
  );

  const formProps = useMemo(
    () =>
      hasParentContext
        ? { disabled }
        : { id: name, name, onSubmit, onReset, disabled, ref: formRef },
    [disabled, hasParentContext, name, onReset, onSubmit]
  );

  // eslint-disable-next-line no-unused-vars
  const ConcreteForm = hasParentContext ? 'fieldset' : 'form';

  return (
    <FormContext.Provider value={context}>
      <ConcreteForm {...formProps} {...moreProps}>
        {children}
      </ConcreteForm>
    </FormContext.Provider>
  );
}

Form.propTypes = {
  name: PropTypes.string,
  onValidSubmit: PropTypes.func,
  onInvalidSubmit: PropTypes.func,
  disabled: PropTypes.bool,
  children: PropTypes.node
};

export default React.memo(Form);

function modelReducer (state, action) {
  const { type, name, value } = action;
  switch (type) {
    case UPDATE:
      return state[name] !== value ? { ...state, [name]: value } : state;
    default:
      return state;
  }
}

function validReducer (state, action) {
  const { type, name, value } = action;
  switch (type) {
    case UPDATE: {
      const current = state[name] || [];
      if (current.length !== (value || []).length || current.some((v, i) => v !== value[i])) {
        return { ...state, [name]: value };
      }
      return state;
    }
    default:
      return state;
  }
}
