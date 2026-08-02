import { useState, useCallback } from 'react';
import { extractFieldErrors } from '../utils/apiHelpers';

/**
 * Lightweight form state hook.
 *
 * - Client-side validation via the optional `validate(values)` function
 *   (returns { fieldName: message }).
 * - Authoritative validation happens on the server: on a 422 response the
 *   flattened ["field: message", ...] errors are mapped to field errors.
 * - Non-validation failures surface as a single `submitError`.
 *
 * @param {object} options
 * @param {object} [options.initialValues={}]
 * @param {Function} [options.validate] custom client validation
 * @param {Function} options.onSubmit async handler receiving the values
 */
export const useForm = ({ initialValues = {}, validate, onSubmit }) => {
  const [values, setValuesState] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((name, value) => {
    setValuesState((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }, []);

  const setManyValues = useCallback((patch) => {
    setValuesState((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(
    (nextValues) => {
      setValuesState(nextValues ?? initialValues);
      setErrors({});
      setSubmitError(null);
    },
    [initialValues]
  );

  const handleSubmit = useCallback(
    async (event) => {
      if (event?.preventDefault) event.preventDefault();

      if (validate) {
        const clientErrors = validate(values);
        if (clientErrors && Object.keys(clientErrors).length > 0) {
          setErrors(clientErrors);
          setSubmitError(null);
          return;
        }
      }

      setErrors({});
      setSubmitError(null);
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (err) {
        if (err?.status === 422) {
          const fieldErrors = extractFieldErrors(err?.details);
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          } else {
            setSubmitError(err?.message || 'The submitted data could not be validated.');
          }
        } else {
          setSubmitError(err?.message || 'The request could not be completed.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit]
  );

  return {
    values,
    errors,
    submitError,
    isSubmitting,
    setValue,
    setValues: setManyValues,
    setErrors,
    reset,
    handleSubmit,
  };
};

export default useForm;
