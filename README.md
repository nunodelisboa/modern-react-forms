# Modern React Forms

## Usage

```js
import { Form } from "modern-react-forms";

<Form name='my-form'>
  <MyInput
    name='myInput'
    value='Initial'
    onChange={value => console.log(`Changed to ${value}`)}
    required
  />
</Form>;
```

```js
function MyInput({ name, value, onChange, validations, validationErrors, required }) {
  const [inputValue, setValue, validation] = useFormInput(name, value, { onSetValue: onChange,
  validations : { ...validations, isRequired: required },
  validationErrors : { validationErrors, ...(required ? { isRequired : 'Please specify a value' } : {} ))});

  const [hasError, errorText, validate] = validation;

  return (
    <div>
      <input id={name} value={inputValue} onChange={event => setValue(event.target.value)} />
      {hasError && <span>{errorText}</span>}
    </div>
  );
}
```
