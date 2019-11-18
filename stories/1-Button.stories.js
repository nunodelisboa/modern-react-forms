import React from 'react';
import { Form } from '../src/index';
import { TextField } from '../src/examples';

export default {
  title: 'TextField'
};
const value = 'init';
export const text = () => (
  <Form name='myForm'>
    <TextField name='field' value={value} required />
  </Form>
);
