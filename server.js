// Require the framework and instantiate it
const fastify = require("fastify")()
const path = require("path")
const sha3 = require("crypto-js/sha3")
const { PrismaClient } = require("@prisma/client")
const nanoId = require("nano-id")

const prisma = new PrismaClient()

fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/public/", // optional: default '/'
})
fastify.register(require("@fastify/cookie"))

fastify.get("/rejestracja", (request, reply) => {
  reply.sendFile("rejestracja.html")
})

fastify.get("/logowanie", (request, reply) => {
  reply.sendFile("logowanie.html")
})

fastify.get("/status", (request, reply) => {
  reply.sendFile("status.html")
})

fastify.register(require("fastify-formidable"))

fastify.post("/api/user", async (request, reply) => {
  await request.parseMultipart()

  let { login, password } = request.body
  login = login.trim()
  password = password.trim()

  if (!login) {
    return { error: "Missing login" }
  }
  if (!password) {
    return { error: "Missing password" }
  }

  const hashedPassword = sha3(password).toString()

  try {
    const user = await prisma.user.create({
      data: { login, password: hashedPassword },
    })

    return { success: "User created" }
  } catch (error) {
    console.error(error)

    return { error: "User not created" }
  }
})

fastify.post("/api/session", async (request, reply) => {
  await request.parseMultipart()

  let { login, password } = request.body
  login = login.trim()
  password = password.trim()

  if (!login) {
    return { error: "Missing login" }
  }
  if (!password) {
    return { error: "Missing password" }
  }

  const hashedPassword = sha3(password).toString()

  try {
    const user = await prisma.user.findUnique({
      where: { login },
    })

    if (user.password !== hashedPassword) {
      return { success: "Wrong login or password" }
    }

    // User authenticated
    const sessionId = nanoId(100)
    reply.setCookie("sessionId", sessionId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    await prisma.session.create({ data: { userId: user.id, sessionId } })

    return { success: "User authenticated" }
  } catch (error) {
    console.error(error)

    return { error: "Wrong login or password" }
  }
})

fastify.get("/api/session", async (request, reply) => {
  const sessionId = request.cookies.sessionId

  try {
    const { user } = await prisma.session.findUnique({
      where: { sessionId },
      include: { user: true },
    })

    // User authenticated
    console.log(user)

    return { success: "User authenticated" }
  } catch (error) {
    console.error(error)

    return { error: "User not authenticated" }
  }
})

// Run the server!
const start = async () => {
  try {
    await fastify.listen({ port: 3000 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
