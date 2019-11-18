import { useState, useContext, useEffect, useCallback } from 'react';
import { FormContext } from '../context';
import { noErrorGenerator } from '../validators';

const noop = () => {};

// validations can be (a) String (name of validation) (b) an object { [id] : { params: [], deferred: true, dependencies: [], validator } }
// (a) Can be "{name}" or  "{name}:{param1}:{param2}"

// validationErrors is an object { [name]: String } and defaults "The value is invalid"

export default (name, value, opts = {}) => {
  const [isPristine, setIsPristine] = useState(true);
  const formContext = useContext(FormContext);

  const {
    registerField = noop,
    setValue = noop,
    model = { [name]: value },
    valid = { [name]: [false] },
    validate
  } = formContext;

  const { validation = noErrorGenerator(), deferredValidation, onSetValue } = opts;
  const [hasError, errorText] = valid[name] || [];

  useEffect(() => {
    registerField(name, value, validation, { deferred: deferredValidation });
  }, [deferredValidation, name, registerField, validation, value]);

  const setFieldValue = useCallback(
    value => {
      setValue(name, value);
      setIsPristine(false);
      if (onSetValue) onSetValue(value);
    },
    [name, onSetValue, setValue]
  );

  const fieldValidate = useCallback(() => validate(name), [name, validate]);

  return [
    model[name],
    setFieldValue,
    [hasError, errorText, deferredValidation ? fieldValidate : noop],
    { isPristine }
  ];
};
