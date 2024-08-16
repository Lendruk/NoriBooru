export type WebSocketEvent<E extends string, P extends Record<string, unknown> | unknown[]> = {
	event: E;
	data?: P;
};
