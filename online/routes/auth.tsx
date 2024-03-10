import { encodeBase64Url } from "$std/encoding/base64url.ts";
import { setCookie } from "$std/http/cookie.ts";
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async POST(req, _) {
    const d = await req.formData();
    const sec = d.get("secret");
    if (typeof sec !== "string") {
      return new Response("don't be bad", { status: 400 });
    }
    const headers = new Headers({ location: "/admin" });
    setCookie(headers, { name: "secret", value: encodeBase64Url(sec) });
    return new Response(null, { status: 303, headers });
  },
};

export default function Auth() {
  return (
    <form method="POST">
      <input name="secret" />
      <button type="submit">Set Secret</button>
    </form>
  );
}
