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
function MyInput({ name, value, onChange, required }) {
  const [inputValue, setValue, validation] = useFormInput(name, value, onChange, {
    validations: "isRequired",
    validationError: { isRequired: "Please specify a value for the input" }
  });

  const [hasError, errorText] = validation;

  return (
    <div>
      <input id={name} value={inputValue} onChange={setValue} />
      {hasError && <span>{errorText}</span>}
    </div>
  );
}
```
