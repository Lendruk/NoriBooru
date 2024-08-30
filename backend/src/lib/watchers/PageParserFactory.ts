import { FourChanParser } from './4chanParser';
import { Queriable } from './Queriable';
import { WatcherSource } from './WatcherSource';

export class PageParserFactory {
	public static createParser(source: WatcherSource): Queriable {
		switch (source) {
			case '4chan':
				return new FourChanParser();
			default:
				throw new Error('Invalid source');
		}
	}
}
