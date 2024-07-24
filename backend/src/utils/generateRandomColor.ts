import { randomInt } from 'crypto';

export const generateRandomColor = (): string => {
	const numbers: number[] = [];

	for (let i = 0; i < 6; i++) {
		numbers.push(randomInt(10));
	}
	return `#${numbers.join('')}`;
};
