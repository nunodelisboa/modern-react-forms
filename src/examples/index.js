/* eslint-disable react/prop-types */
import React from 'react';
import { useFormInput, useValidation, useCombinedValidation } from '../index';

export const TextField = ({ name, value, label = '', required }) => {
  const validationR = useValidation('isRequired', {
    errorText: 'Please select a value',
    onlyIf: required
  });

  const validationL = useValidation('isLength', {
    errorText: 'Must be at least of len 3',
    validator: v => v && v.length > 3
  });

  const validation = useCombinedValidation([validationR, validationL]);

  const [inputValue = '', setValue, errors] = useFormInput(name, value, {
    validation
    // deferredValidation: true
  });
  const [hasError, errorText] = errors;

  return (
    <div>
      {label && <span>{label}</span>}
      <input name={name} value={inputValue} onChange={event => setValue(event.target.value)} />
      {hasError && <span style={{ color: 'red' }}>{errorText}</span>}
    </div>
  );
};
