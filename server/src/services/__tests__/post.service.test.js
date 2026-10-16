// server/src/services/__tests__/post.service.test.js
import { jest } from "@jest/globals";

const mockPostRepository = { createWithTags: jest.fn() };
const mockEventBus = { emit: jest.fn() };
const mockSearchStrategy = { search: jest.fn() };

// Bind searchStrategy globally
globalThis.searchStrategy = mockSearchStrategy;

jest.unstable_mockModule("../../repositories/post.repository.js", () => ({
  PostRepository: mockPostRepository,
}));

jest.unstable_mockModule("../../events/event-bus.js", () => ({
  EventBus: mockEventBus,
}));

const { PostService } = await import("../post.service.js");

beforeEach(() => {
  jest.clearAllMocks();
});

test("publish() creates a PUBLISHED post and emits post.published", async () => {
  mockPostRepository.createWithTags.mockResolvedValue({ id: "p1", title: "Hello", status: "PUBLISHED" });
  const post = await PostService.publish({ authorId: "u1", title: "Hello", body: "World" });
  expect(post.status).toBe("PUBLISHED");
  expect(mockEventBus.emit).toHaveBeenCalledWith(
    "post.published",
    expect.objectContaining({ postId: "p1" })
  );
});

test("publish() rejects an empty title", async () => {
  await expect(
    PostService.publish({ authorId: "u1", title: "", body: "World" })
  ).rejects.toThrow();
});

// ==========================================
// Section 1.2: PostService.search() Tests
// ==========================================

test("1. Black-box (equivalence: valid input)", async () => {
  const mockResponse = { posts: [{ id: "p1", title: "JavaScript" }], page: 1, hasMore: false };
  mockSearchStrategy.search.mockResolvedValueOnce(mockResponse);

  const result = await PostService.search({ query: "javascript", page: 1, pageSize: 10 });

  expect(result).toEqual(mockResponse);
  expect(mockSearchStrategy.search).toHaveBeenCalledWith("javascript", { page: 1, pageSize: 10 });
});

test("2. Black-box (equivalence: default parameters)", async () => {
  mockSearchStrategy.search.mockResolvedValueOnce({ posts: [], page: 1, hasMore: false });

  await PostService.search({ query: "web" });

  expect(mockSearchStrategy.search).toHaveBeenCalledWith("web", { page: 1, pageSize: 10 });
});

test("3. Black-box (boundary: minimum page size)", async () => {
  const mockResponse = { posts: [{ id: "p1" }], page: 1, hasMore: true };
  mockSearchStrategy.search.mockResolvedValueOnce(mockResponse);

  const result = await PostService.search({ query: "test", page: 1, pageSize: 1 });

  expect(result).toEqual(mockResponse);
  expect(mockSearchStrategy.search).toHaveBeenCalledWith("test", { page: 1, pageSize: 1 });
});

test("4. White-box (branch: strategy failure)", async () => {
  mockSearchStrategy.search.mockRejectedValueOnce(new Error("Search failure"));

  await expect(PostService.search({ query: "database" })).rejects.toThrow("Search failure");
});