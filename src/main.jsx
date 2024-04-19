import ReactDOM from 'react-dom/client';
import PropTypes from 'prop-types';
import {useState, useRef} from "react";
import css from './main.module.scss';

const generateId = () => {
	const timestamp = Date.now();
	const random = Math.floor(Math.random() * 100);
	return timestamp + random;
}

function useForm(submitHandle, initialValues) {
	const [values, setValues] = useState(initialValues || {});
	const allowValidate = useRef(false);
	const [errors, setErrors] = useState({});
	const errorsRuntime = useRef({});

	const handleChange = (ev) => {
		ev.persist();
		setValues(state => ({
			...state, [ev.target.id]: ev.target.value
		}))
		if (!allowValidate.current) return;
		validation(ev?.target);
	}

	const validationAll = () => {
		const allValues = Object.keys(values);
		let validAll = true;
		for (const item of allValues) {
			const validationElement = document.getElementById(item);
			if (!validationElement) continue;
			validAll &= validation(validationElement);
		}
		return validAll;
	}
	const validation = (inputElement) => {
		switch (inputElement?.type) {
			case inputType.number:
			case inputType.text:
			case inputType.password:
				if (!requireValidation(inputElement)) return false;
				if (!minValidation(inputElement)) return false;
				if (!maxValidation(inputElement)) return false;
				if (!emailValidation(inputElement)) return false;
				break;
			default:
				break;
		}
		// clear error
		clearError(inputElement)
		return true;
	}
	const clearError = (inputElement) => {
		const newErrors = {...errorsRuntime.current};
		delete newErrors[inputElement.id];
		setErrors(newErrors);
		errorsRuntime.current = newErrors;
	}
	const addErrors = (inputElement, errorString) => {
		const newErrors = {
			...errorsRuntime.current, [inputElement.id]: errorString
		};
		errorsRuntime.current = newErrors;
		setErrors(newErrors);
	}
	const requireValidation = (inputElement) => {
		if (!inputElement?.dataset?.require) return;
		const requireArray = JSON.parse(inputElement?.dataset?.require || '[]');
		const requireValid = inputElement?.value?.length || inputElement?.value?.length > 0
		if (requireValid) return true;
		const [, errorMessage] = requireArray;
		if (!inputElement.value) {
			addErrors(inputElement, errorMessage)
			return false;
		}
		return true;
	}
	const minValidation = (inputElement) => {
		const minArray = JSON.parse(inputElement?.dataset.min || '[]');
		if (minArray.length <= 0) return true;
		const [minNumber, errorMessage] = minArray;
		const minValid = inputElement?.value && inputElement?.value?.length >= minNumber;
		if (minValid) {
			return true;
		} else if (!minValid) {
			addErrors(inputElement, errorMessage)
			return false;
		}
	}
	const maxValidation = (inputElement) => {
		const maxArray = JSON.parse(inputElement?.dataset.max || '[]');
		if (maxArray.length <= 0) return true;
		const [maxNumber, errorMessage] = maxArray;
		const maxValid = inputElement?.value && inputElement?.value?.length <= maxNumber;
		if (maxValid) {
			return true;
		} else if (!maxValid) {
			addErrors(inputElement, errorMessage)
			return false;
		}
	}
	const emailValidation = (inputElement) => {
		const maxArray = JSON.parse(inputElement?.dataset.email || '[]');
		if (maxArray.length <= 0) return true;
		const [, errorMessage] = maxArray;
		const emailValid = isValidEmail(inputElement?.value);
		if (emailValid) {
			return true;
		} else if (!emailValid) {
			addErrors(inputElement, errorMessage)
			return false;
		}
	}
	const isValidEmail = (email) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	const onSubmit = (ev) => {
		ev.preventDefault();
		let valid = true;
		allowValidate.current = true;
		allowValidate.current && (valid = validationAll());
		valid && submitHandle(values, ev);
	}
	const register = (name) => {
		if (!Object.keys(values).find((item) => item === name)) {
			setValues((state) => ({
				...state, [name]: '',
			}));
		}
		return {
			onChange: handleChange, id: name
		}
	}
	const reset = (reInitialValue) => {
		setErrors({});
		errorsRuntime.current = {};
		allowValidate.current = false;
		setValues(reInitialValue || initialValues || {})
	}

	return [register, onSubmit, errors, reset];
}

const inputType = {
	text: 'text', number: 'number', password: 'password',
}
const InputGroup = (props) => {
	const {
		title, error, type = inputType.text, id, onChange, required,
	} = props;
	const renderError = () => {
		return error ? css.input__error : ''
	}
	return (<>
		<div>
			{title}
		</div>
		<input
			className={`${css.input} ${renderError()}`}
			type={type}
			id={id}
			onChange={onChange}
			data-require={JSON.stringify(required)}
		/>
		<div className={css.message__error}>
			{error}
		</div>
	</>)
}
InputGroup.propTypes = {
	title: PropTypes.node,
	error: PropTypes.node,
	type: PropTypes.oneOf(Object.values(inputType)),
	id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	onChange: PropTypes.func,
	required: PropTypes.array,
};

const Form = (props) => {
	const {
		addBook
	} = props;
	const submitHandle = (values) => {
		addBook({
			title: values.title,
			number: values.number,
		})
	}
	const [register, onSubmit, errors] = useForm(submitHandle)

	return (<form onSubmit={onSubmit}>
		<InputGroup
			title="Tiêu đề"
			{...register('title')}
			required={[true, 'Require']}
			error={errors.title}
		/>
		<InputGroup
			title="Số lượng"
			type={inputType.number}
			{...register('number')}
			required={[true, 'Require']}
			error={errors.number}
		/>
		<button type={"submit"}>
			Submit
		</button>
	</form>)
}
Form.propTypes = {
	addBook: PropTypes.func,
}

const Row = (props) => {
	const {
		id,
		title,
		number,
		removeBook,
		editBook
	} = props;
	const titleId = 'title-' + id;
	const numberId = 'number-' + id;

	const titleElement = useRef(null);
	const titleInput = useRef(null);
	const numberElement = useRef(null);
	const numberInput = useRef(null);
	const editButton = useRef(null);
	const deleteButton = useRef(null);
	const submitButton = useRef(null);
	const cancelButton = useRef(null);
	const errorTitle = useRef(null);
	const errorNumber = useRef(null);

	const validRef = () => {
		const valid = (
			titleElement &&
			titleElement.current &&
			titleInput &&
			titleInput.current &&
			numberElement &&
			numberElement.current &&
			numberInput &&
			numberInput.current &&
			errorTitle &&
			errorTitle.current &&
			errorNumber &&
			errorNumber.current
		)
		return valid;
	}
	const [enableEditStatus, setEnableEditStatus] = useState(false);
	const renderShow = (enableEdit) => {
		return enableEdit ? '' : css['d-0']
	}

	const enableEdit = () => {
		setEnableEditStatus(true)
	}
	const closeEdit = () => {
		setEnableEditStatus(false)
	}

	const editClickHandle = () => {
		if (!validRef()) return;
		titleInput.current.value = titleElement.current.innerHTML;
		numberInput.current.value = numberElement.current.innerHTML;
		enableEdit();
	}
	const cancelClickHandle = () => {
		resetError();
		closeEdit();
	}

	const renderClassError = (error) => {
		return error ? css.input__error : '';
	}
	const submitClickHandle = (values) => {
		console.log
		const newBook = {
			id: id,
			title: values[titleId],
			number: values[numberId],
		}
		editBook(newBook);
		closeEdit();
	}
	const initialData = () => {
		const result = {};
		result[titleId] = title;
		result[numberId] = number;
		return result;
	}
	const [register, onSubmit, errors, resetError] = useForm(submitClickHandle, initialData());

	return (
		<>
			<td>
				<div>
					<div className={`${renderShow(!enableEditStatus)}`} ref={titleElement}>
						{title}
					</div>
					<div>
						<input
							ref={titleInput}
							className={` ${css.input} ${renderClassError(errors[titleId])} ${renderShow(enableEditStatus)}`}
							type={inputType.text}
							{...register(titleId)}
							data-require={JSON.stringify([true, 'Require'])}
						/>
						<div ref={errorTitle} className={`${css.message__error} ${renderShow(enableEditStatus)}`}>
							{errors[titleId]}
						</div>
					</div>
				</div>
			</td>
			<td>
				<div>
					<div className={`${renderShow(!enableEditStatus)}`} ref={numberElement}>
						{number}
					</div>
					<div>
						<input
							ref={numberInput}
							type={inputType.number}
							className={`${css.input} ${renderClassError(errors[numberId])} ${renderShow(enableEditStatus)}`}
							{...register(numberId)}
							data-require={JSON.stringify([true, 'Require'])}
						/>
						<div ref={errorNumber} className={`${css.message__error} ${renderShow(enableEditStatus)}`}>
							{errors[numberId]}
						</div>
					</div>
				</div>
			</td>
			<td>
				<div>
					<button className={`${renderShow(!enableEditStatus)}`} ref={editButton} onClick={editClickHandle}>
						Edit
					</button>
					<button className={`${renderShow(!enableEditStatus)}`} ref={deleteButton} onClick={removeBook.bind(null, id)}>
						Delete
					</button>
					<button onClick={onSubmit} ref={submitButton} className={`${renderShow(enableEditStatus)}`}>
						Submit
					</button>
					<button ref={cancelButton} onClick={cancelClickHandle} className={`${renderShow(enableEditStatus)}`}>
						Cancel
					</button>
				</div>
			</td>
		</>
	)
}
Row.propTypes = {
	id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	title: PropTypes.string,
	number: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.number
	]),
	removeBook: PropTypes.func,
	editBook: PropTypes.func
}

const List = (props) => {
	const {
		list,
		removeBook,
		editBook
	} = props;

	const renderBody = (list) => {
		return list?.map((item) => {
			return (<tr key={item.id}>
				<Row
					id={item.id}
					removeBook={removeBook}
					title={item.title}
					number={item.number}
					editBook={editBook}
				/>
			</tr>)
		})
	}

	return (
		<table className={css.table}>
			<thead>
			<tr>
				<th>Title</th>
				<th>Number</th>
				<th>Actions</th>
			</tr>
			</thead>
			<tbody>
			{renderBody(list)}
			</tbody>
		</table>
	)
}
List.propTypes = {
	list: PropTypes.array,
	removeBook: PropTypes.func,
	editBook: PropTypes.func
};

const App = () => {
	const [bookList, setBookList] = useState([
		{
			id: 1, title: 'Book 1', number: '1',
		},
		{
			id: 2, title: 'Book 2', number: '2',
		}
	]);

	const addBook = (book) => {
		const addItem = book;
		addItem.id = generateId();
		setBookList([addItem, ...bookList]);
	}
	const removeBook = (id) => {
		const newBookList = bookList.filter(item => {
			return item.id !== id;
		});

		setBookList(() => newBookList)
	}
	const editBook = (book) => {
		const newBookList = bookList.slice();
		const findBook = newBookList.find(item => item.id === book.id);
		if (!findBook) return;
		findBook.title = book.title;
		findBook.number = book.number;
		setBookList(() => [...newBookList]);
	}
	return (<>
		<h1>Library</h1>
		<Form
			addBook={addBook}
		/>
		<List
			removeBook={removeBook}
			list={bookList}
			editBook={editBook}
		/>
	</>)
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>)