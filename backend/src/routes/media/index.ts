import addTagToMediaItems from './addTagToMediaItems';
import createMediaItems from './createMediaItems';
import deleteMediaItem from './deleteMediaItem';
import getMediaItem from './getMediaItem';
import getMediaItemTags from './getMediaItemTags';
import getMediaToReview from './getMediaToReview';
import removeTagFromMediaItem from './removeTagFromMediaItem';
import searchMediaItems from './searchMediaItems';
import toggleMediaItemArchival from './toggleMediaItemArchival';

export default [
	addTagToMediaItems,
	removeTagFromMediaItem,
	getMediaToReview,
	deleteMediaItem,
	getMediaItem,
	searchMediaItems,
	toggleMediaItemArchival,
	createMediaItems,
	getMediaItemTags
];
