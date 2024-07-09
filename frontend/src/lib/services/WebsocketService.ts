import { sdUiStatus } from "../../store";
import { HttpService } from "./HttpService";

type SDWebsocketEventData = {
 status: "RUNNING" | "NOT_RUNNING"
}

type WebSocketEvent = {
  event: string;
  data: Record<string, unknown>
}

export class WebsocketService {
  public static BASE_WEBSOCKET_URL = `ws://localhost:8080`;
  public static socket: WebSocket | undefined;

  public static registerWebsocket(): void {
    const vaultId = HttpService.getVaultId();
    if (vaultId) {
      WebsocketService.socket = new WebSocket(`${WebsocketService.BASE_WEBSOCKET_URL}`);
      WebsocketService.socket.addEventListener('open', () => {
        console.log('socket connected');
        WebsocketService.socket!.send(JSON.stringify({ type: 'register', data: { vault: vaultId } }));
      });
      
      WebsocketService.socket.addEventListener('message', (message) => {
        console.log(message.data)
        const parsedMessage = JSON.parse(message.data) as WebSocketEvent;
        if (parsedMessage.event === 'SD') {
          sdUiStatus.set((parsedMessage.data as SDWebsocketEventData).status);
        }
      });

      WebsocketService.socket.addEventListener('close', () => {
        console.log('socket disconnected');
        WebsocketService.socket = undefined;
      });
    }
  }

  public static unregisterWebsocket(): void {
    if (WebsocketService.socket) {
      WebsocketService.socket.close();
      WebsocketService.socket = undefined;
    }
  }
}