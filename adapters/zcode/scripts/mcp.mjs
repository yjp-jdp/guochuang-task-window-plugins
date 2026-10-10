import readline from "node:readline";
import { pathToFileURL } from "node:url";
import { launchNative } from "./launch.mjs";
export async function handle(message, launch = launchNative) {
  if (message.id === undefined) return;
  if (message.method === "initialize")
    return {
      protocolVersion: message.params?.protocolVersion || "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "guochuang-task-window", version: "0.1.0" },
    };
  if (message.method === "ping") return {};
  if (message.method === "tools/list")
    return {
      tools: [
        {
          name: "open_task_window",
          description:
            "Open the standalone task mini-window only at the user’s request.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
        },
      ],
    };
  if (
    message.method === "tools/call" &&
    message.params?.name === "open_task_window"
  ) {
    try {
      await launch();
      return {
        content: [
          {
            type: "text",
            text: "任务小窗已启动。请在小窗中管理任务和专注记录。",
          },
        ],
      };
    } catch (e) {
      return { isError: true, content: [{ type: "text", text: e.message }] };
    }
  }
  throw Error("Unsupported MCP method");
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) {
    let m;
    try {
      m = JSON.parse(line);
      const result = await handle(m);
      if (m.id !== undefined)
        process.stdout.write(
          JSON.stringify({ jsonrpc: "2.0", id: m.id, result }) + "\n",
        );
    } catch (e) {
      process.stdout.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id: m?.id ?? null,
          error: { code: -32603, message: e.message },
        }) + "\n",
      );
    }
  }
}
