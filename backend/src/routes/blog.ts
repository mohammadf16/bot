import { z } from "zod"
import type { RouteContext } from "../route-context.js"
import { nowIso } from "../utils/time.js"
import { id } from "../utils/id.js"
import type { BlogPost } from "../types.js"
type UserPayload = { sub: string; role: "user" | "admin"; email: string }

const BlogPostCreateSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string(),
  content: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  coverImage: z.string(),
  status: z.enum(["draft", "published", "archived"]),
  featured: z.boolean().optional(),
})

const BlogPostUpdateSchema = BlogPostCreateSchema.partial()

export async function registerBlogRoutes({ app, store }: RouteContext) {
  // Admin: Get all blog posts
  app.get("/admin/blog/posts", async (request, reply) => {
    if (!request.user?.role || request.user.role !== "admin") {
      return reply.code(403).send({ error: "Forbidden" })
    }
    const posts = Array.from(store.blogPosts.values())
    return { posts, total: posts.length }
  })

  // Admin: Create blog post
  app.post<{ Body: any }>("/admin/blog/posts", async (request, reply) => {
    const user = request.user as UserPayload | undefined
    if (!user?.role || user.role !== "admin") {
      return reply.code(403).send({ error: "Forbidden" })
    }

    const validated = BlogPostCreateSchema.parse(request.body)

    // Check slug uniqueness
    const existingPost = Array.from(store.blogPosts.values()).find(
      (p) => p.slug === validated.slug
    )
    if (existingPost) {
      return reply.code(400).send({ error: "Slug already exists" })
    }

    const postId = id("post")
    const now = nowIso()

    const blogPost: BlogPost = {
      id: postId,
      ...validated,
      featured: validated.featured ?? false,
      views: 0,
      author: ((request.user as UserPayload | undefined)?.sub) || "system",
      publishedAt: validated.status === "published" ? now : null,
      createdAt: now,
      updatedAt: now,
    }

    store.blogPosts.set(postId, blogPost)

    return { success: true, post: blogPost }
  })

  // Admin: Get single blog post
  app.get<{ Params: { id: string } }>("/admin/blog/posts/:id", async (request, reply) => {
    const user = request.user as UserPayload | undefined
    if (!user?.role || user.role !== "admin") {
      return reply.code(403).send({ error: "Forbidden" })
    }

    const post = store.blogPosts.get(request.params.id)
    if (!post) {
      return reply.code(404).send({ error: "Post not found" })
    }

    return post
  })

  // Admin: Update blog post
  app.put<{ Params: { id: string }; Body: any }>(
    "/admin/blog/posts/:id",
    async (request, reply) => {
      const user = request.user as UserPayload | undefined
      if (!user?.role || user.role !== "admin") {
        return reply.code(403).send({ error: "Forbidden" })
      }

      const post = store.blogPosts.get(request.params.id)
      if (!post) {
        return reply.code(404).send({ error: "Post not found" })
      }

      const validated = BlogPostUpdateSchema.parse(request.body)

      // Check slug uniqueness if slug changed
      if (validated.slug && validated.slug !== post.slug) {
        const existingPost = Array.from(store.blogPosts.values()).find(
          (p) => p.slug === validated.slug
        )
        if (existingPost) {
          return reply.code(400).send({ error: "Slug already exists" })
        }
      }

      const now = nowIso()
      const updated: BlogPost = {
        ...post,
        ...validated,
        id: post.id,
        createdAt: post.createdAt,
        updatedAt: now,
        publishedAt:
          validated.status === "published" && !post.publishedAt
            ? now
            : post.publishedAt,
      }

      store.blogPosts.set(request.params.id, updated)

      return { success: true, post: updated }
    }
  )

  // Admin: Delete blog post
  app.delete<{ Params: { id: string } }>(
    "/admin/blog/posts/:id",
    async (request, reply) => {
      const user = request.user as UserPayload | undefined
      if (!user?.role || user.role !== "admin") {
        return reply.code(403).send({ error: "Forbidden" })
      }

      const post = store.blogPosts.get(request.params.id)
      if (!post) {
        return reply.code(404).send({ error: "Post not found" })
      }

      store.blogPosts.delete(request.params.id)

      return { success: true }
    }
  )

  // Public: List all published blog posts
  app.get("/blog/posts", async (request, reply) => {
    const posts = Array.from(store.blogPosts.values())
      .filter((p) => p.status === "published")
      .sort((a, b) => {
        const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
        const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
        return bTime - aTime
      })

    return {
      posts: posts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        category: p.category,
        tags: p.tags,
        coverImage: p.coverImage,
        featured: p.featured,
        views: p.views,
        author: p.author,
        publishedAt: p.publishedAt,
      })),
      total: posts.length,
    }
  })

  // Public: Get single blog post by slug
  app.get<{ Params: { slug: string } }>("/blog/posts/:slug", async (request, reply) => {
    const post = Array.from(store.blogPosts.values()).find(
      (p) => p.slug === request.params.slug && p.status === "published"
    )

    if (!post) {
      return reply.code(404).send({ error: "Post not found" })
    }

    // Increment views
    post.views = (post.views || 0) + 1

    return post
  })
}
