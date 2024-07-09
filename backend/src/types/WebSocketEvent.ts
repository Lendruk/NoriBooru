export type WebSocketEvent<E extends string, P extends Record<string, unknown> > = {
	event: E;
  data?: P;
}
