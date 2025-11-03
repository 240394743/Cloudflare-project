import { fromHono } from "chanfana";
import { Hono } from "hono";
import { TaskCreate } from "./endpoints/taskCreate";
import { TaskDelete } from "./endpoints/taskDelete";
import { TaskFetch } from "./endpoints/taskFetch";
import { TaskList } from "./endpoints/taskList";

// Import your Durable Object
import { FitnessSession } from "./session";

// 👇 Export the Durable Object so Wrangler can bind it
export { FitnessSession };

// Define the Hono app with typed bindings
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/", // OpenAPI docs available at root
});

// Register OpenAPI endpoints
openapi.get("/api/tasks", TaskList);
openapi.post("/api/tasks", TaskCreate);
openapi.get("/api/tasks/:taskSlug", TaskFetch);
openapi.delete("/api/tasks/:taskSlug", TaskDelete);

// -----------------------------
// Chat endpoint using Workers AI
// -----------------------------
app.post("/api/chat", async (c) => {
  const body = await c.req.json<{ message: string }>();
  const userMessage = body.message;

  try {
    const aiResponse = await c.env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct",
      {
        messages: [
          {
            role: "system",
            content:
              "You are a knowledgeable and motivating sports and fitness coach. " +
              "Always reply with advice, training tips, or encouragement that is " +
              "directly related to sports, exercise, or physical performance. " +
              "Tailor your response to the user’s specific question or statement."
          },
          { role: "user", content: userMessage }
        ]
      }
    );

    // Extract the text safely
    const reply =
      aiResponse?.response ||
      aiResponse?.output?.[0]?.content?.[0]?.text ||
      JSON.stringify(aiResponse);

    return c.json({ reply });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Export the Hono app as the Worker entrypoint
export default app;