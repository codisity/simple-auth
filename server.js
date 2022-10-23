// Require the framework and instantiate it
const fastify = require("fastify")();
const path = require("path");
const sha3 = require("crypto-js/sha3");

fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/public/", // optional: default '/'
});

fastify.get("/rejestracja", (request, reply) => {
  reply.sendFile("rejestracja.html");
});

fastify.register(require("fastify-formidable"));

fastify.post("/api/user", async (request, reply) => {
  await request.parseMultipart();

  let { login, password } = request.body;
  login = login.trim();
  password = password.trim();

  if (!login) {
    return { error: "Missing login" };
  }
  if (!password) {
    return { error: "Missing password" };
  }

  const hashedPassword = sha3(password).toString();

  return { body: request.body, hashedPassword };
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
