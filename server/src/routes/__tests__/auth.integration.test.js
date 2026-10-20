// server/src/routes/__tests__/auth.integration.test.js

import request from "supertest";
import { app } from "../../app.js"; // adjust path to your Express app
import { resetDatabase } from "../../test-utils/fixtures.js";

beforeEach(async () => {
  await resetDatabase();
});

test("registration and login work together end-to-end", async () => {
  const credentials = {
    email: "integration-user@example.com",
    displayName: "Integration User",
    password: "securePassword123",
  };

  // 1. Register a new user
  const registerResponse = await request(app)
    .post("/api/auth/register")
    .send(credentials)
    .expect(201);

  expect(registerResponse.body.user).toBeDefined();
  expect(registerResponse.body.user.email).toBe(credentials.email);

  // 2. Login with the newly registered credentials
  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email: credentials.email,
      password: credentials.password,
    })
    .expect(200);

  expect(loginResponse.body).toHaveProperty("token"); 
  expect(loginResponse.body.user.email).toBe(credentials.email);
});