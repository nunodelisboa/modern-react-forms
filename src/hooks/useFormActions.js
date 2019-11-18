import { useContext, useCallback } from 'react';
import { FormContext } from '../context';

const noop = () => {};
const defaultForm = { submit: noop, reset: noop };

export default () => {
  const { name, form = defaultForm } = useContext(FormContext);
  const submit = useCallback(() => form.submit(), [form]);
  const reset = useCallback(() => form.reset(), [form]);

  return [submit, reset, name];
};
