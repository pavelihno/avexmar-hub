const PASSWORD_STRENGTH = {
	LABEL: 'Надежность пароля',
	LEVEL_LABELS: ['Очень слабый', 'Слабый', 'Средний', 'Сильный', 'Очень сильный'],
	ACCEPTABLE_SCORE: 3,
	WARNING_MAP: {
		'This is similar to a commonly used password': 'Пароль слишком похож на популярные комбинации',
		'This is a top-10 common password': 'Пароль входит в десятку самых распространенных',
		'This is a top-100 common password': 'Пароль входит в сотню самых распространенных',
		'This is a very common password': 'Пароль относится к числу часто используемых',
		'A word by itself is easy to guess': 'Одиночные слова легко подобрать',
		'Names and surnames by themselves are easy to guess': 'Имена и фамилии легко подобрать',
		'Common names and surnames are easy to guess': 'Распространенные имена и фамилии легко подобрать',
		'Straight rows of keys are easy to guess': 'Прямые ряды клавиатуры легко угадываются',
		'Short keyboard patterns are easy to guess': 'Короткие шаблоны клавиатуры легко угадываются',
		'Repeats like "aaa" are easy to guess': 'Повторяющиеся символы легко угадываются',
		'Repeats like "abcabcabc" are only slightly harder to guess than "abc"':
			'Повторы вроде «abcabc» почти так же просты, как «abc»',
		'Sequences like abc or 6543 are easy to guess': 'Последовательности вроде «abc» или «123» легко угадываются',
		'Recent years are easy to guess': 'Недавние годы легко угадываются',
		'Dates are often easy to guess': 'Даты легко угадать',
		"Capitalization doesn't help very much": 'Обычная заглавная буква мало помогает',
		'All-uppercase is almost as easy to guess as all-lowercase':
			'Запись только заглавными почти так же проста, как только строчными',
		"Reversed words aren't much harder to guess": 'Слова наоборот почти так же просты',
		"Predictable substitutions like '@' instead of 'a' don't help very much":
			'Предсказуемые замены букв мало усложняют пароль',
	},
	SUGGESTION_MAP: {
		'Add another word or two. Uncommon words are better.': 'Добавьте ещё одно уникальное слово',
		'Use a few words, avoid common phrases': 'Используйте несколько непохожих слов вместо фразы',
		'No need for symbols, digits, or uppercase letters': 'Сосредоточьтесь на длине, а не на символах и цифрах',
		'Use a longer keyboard pattern with more turns': 'Используйте более длинный шаблон клавиш с поворотами',
		'Avoid repeated words and characters': 'Избегайте повторов символов или слов',
		'Avoid sequences': 'Избегайте последовательностей вроде «1234»',
		'Avoid recent years': 'Не используйте недавние годы',
		'Avoid years that are associated with you': 'Не используйте годы, связанные с вами',
		'Avoid dates and years that are associated with you': 'Не используйте даты, связанные с вами',
		"Capitalization doesn't help very much": 'Не полагайтесь только на заглавные буквы',
		'All-uppercase is almost as easy to guess as all-lowercase':
			'Смешивайте регистры, цифры и символы, а не используйте только заглавные',
		"Reversed words aren't much harder to guess": 'Не используйте просто слова наоборот',
		"Predictable substitutions like '@' instead of 'a' don't help very much":
			'Заменяйте буквы непредсказуемо, а не стандартно',
	},
	DEFAULT_SUGGESTIONS: [
		'Используйте длинный пароль из нескольких непохожих слов',
		'Смешайте буквы разных регистров, цифры и специальные символы',
	],
};

export default PASSWORD_STRENGTH;
