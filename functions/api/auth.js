const SESSION_DAYS = 30;

function json(data, status = 200, headers = {}) {
  return Response.json(data, { status, headers });
}

async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(salt), iterations: 120000, hash: "SHA-256" }, key, 256);
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function makeSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function makeToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function cookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

function readSession(request) {
  const raw = request.headers.get("Cookie") || "";
  const match = raw.match(/(?:^|;\s*)nivora_session=([^;]+)/);
  return match ? match[1] : null;
}

async function currentUser(env, request) {
  const token = readSession(request);
  if (!token || !env.DB) return null;
  const row = await env.DB.prepare(`SELECT u.id,u.name,u.email,u.created_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at>?`).bind(token, new Date().toISOString()).first();
  return row || null;
}

export async function onRequestPost(context) {
  try {
    if (!context.env.DB) return json({ error: "Nivora database is not connected yet." }, 503);
    const body = await context.request.json().catch(() => ({}));
    const action = String(body.action || "").toLowerCase();

    if (action === "signup") {
      const name = String(body.name || "").trim();
      const password = String(body.password || "");
      const email = String(body.email || "").trim().toLowerCase() || null;
      if (name.length < 2) return json({ error: "Please enter your name." }, 400);
      if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);
      const existing = await context.env.DB.prepare(`SELECT id FROM users WHERE lower(name)=lower(?)`).bind(name).first();
      if (existing) return json({ error: "An account with this name already exists. Please sign in." }, 409);
      if (email) {
        const emailExists = await context.env.DB.prepare(`SELECT id FROM users WHERE lower(email)=lower(?)`).bind(email).first();
        if (emailExists) return json({ error: "An account with this email already exists. Please sign in." }, 409);
      }
      const userId = crypto.randomUUID();
      const salt = makeSalt();
      const passwordHash = `${salt}:${await hashPassword(password, salt)}`;
      const now = new Date().toISOString();
      await context.env.DB.prepare(`INSERT INTO users(id,name,email,password_hash,created_at,updated_at) VALUES(?,?,?,?,?,?)`).bind(userId, name, email, passwordHash, now, now).run();
      const token = makeToken();
      const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
      await context.env.DB.prepare(`INSERT INTO sessions(id,user_id,expires_at,created_at) VALUES(?,?,?,?)`).bind(token, userId, expires, now).run();
      return json({ success: true, user: { id: userId, name, email } }, 200, { "Set-Cookie": cookie("nivora_session", token, SESSION_DAYS * 86400) });
    }

    if (action === "signin") {
      const name = String(body.name || "").trim();
      const password = String(body.password || "");
      const user = await context.env.DB.prepare(`SELECT id,name,email,password_hash FROM users WHERE lower(name)=lower(?)`).bind(name).first();
      if (!user?.password_hash) return json({ error: "Name or password is incorrect." }, 401);
      const [salt, storedHash] = String(user.password_hash).split(":");
      const computed = await hashPassword(password, salt);
      if (!salt || computed !== storedHash) return json({ error: "Name or password is incorrect." }, 401);
      const token = makeToken();
      const now = new Date().toISOString();
      const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
      await context.env.DB.prepare(`INSERT INTO sessions(id,user_id,expires_at,created_at) VALUES(?,?,?,?)`).bind(token, user.id, expires, now).run();
      return json({ success: true, user: { id: user.id, name: user.name, email: user.email } }, 200, { "Set-Cookie": cookie("nivora_session", token, SESSION_DAYS * 86400) });
    }

    if (action === "logout") {
      const token = readSession(context.request);
      if (token) await context.env.DB.prepare(`DELETE FROM sessions WHERE id=?`).bind(token).run();
      return json({ success: true }, 200, { "Set-Cookie": cookie("nivora_session", "", 0) });
    }

    return json({ error: "Unknown auth action." }, 400);
  } catch (error) {
    console.error("Nivora auth error:", error);
    return json({ error: "Authentication failed.", details: error instanceof Error ? error.message : String(error) }, 500);
  }
}

export async function onRequestGet(context) {
  try {
    if (!context.env.DB) return json({ authenticated: false, error: "Nivora database is not connected yet." }, 503);
    const user = await currentUser(context.env, context.request);
    return json({ authenticated: Boolean(user), user });
  } catch (error) {
    return json({ authenticated: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
}
