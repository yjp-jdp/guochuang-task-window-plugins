import { launchNative } from "./launch.mjs";
export const inject = ["webServer"];
export function apply(ctx) {
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: "prefix",
        path: "/guochuang-task-window",
        handler: async (req, res) => {
          const pathname = new URL(req.url, "http://localhost").pathname;
          if (pathname !== "/guochuang-task-window/open") {
            res.writeHead(404).end();
            return;
          }
          if (req.method !== "POST") {
            res.writeHead(405, { Allow: "POST" }).end();
            return;
          }
          if (req.headers.origin) {
            try {
              if (new URL(req.headers.origin).host !== req.headers.host) {
                res.writeHead(403).end();
                return;
              }
            } catch {
              res.writeHead(403).end();
              return;
            }
          }
          try {
            const result = await launchNative("dsh");
            res
              .writeHead(200, { "Content-Type": "application/json" })
              .end(JSON.stringify({ ok: true, ...result }));
          } catch (e) {
            res
              .writeHead(503, { "Content-Type": "application/json" })
              .end(JSON.stringify({ ok: false, error: e.message }));
          }
        },
      }),
    "guochuang-task-window: launch only",
  );
}
