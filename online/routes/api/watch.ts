import { FreshContext } from "$fresh/server.ts";
import { watchLKL } from "../../db.ts";

export const handler = (
  req: Request,
  _ctx: FreshContext,
): Promise<Response> => {
  const { response, socket } = Deno.upgradeWebSocket(req);
  let s: null | ReadableStream<Deno.KvEntryMaybe<unknown>[]> = null;
  socket.onmessage = (m) => {
    let piids: unknown;
    try {
      piids = JSON.parse(m.data);
    } catch (_) {
      socket.close();
    }
    if (!Array.isArray(piids) || piids.some((e) => typeof e !== "string")) {
      socket.close();
      return;
    }
    s?.cancel();
    s = watchLKL(piids);
    s.pipeTo(
      new WritableStream({
        write: (m) =>
          socket.send(JSON.stringify(
            Object.fromEntries(m.map((e) => [e.key[2], e.value])),
          )),
      }),
    );
  };
  socket.onclose = () => s?.cancel();
  return Promise.resolve(response);
};
