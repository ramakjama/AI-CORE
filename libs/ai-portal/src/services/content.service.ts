/**
 * Content Service
 * Manages blog articles, categories, and featured content
 * for the portal's content marketing section
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Article,
  ArticlePreview,
  Author,
  Category,
  Tag,
  MediaAsset,
  ContentStatus,
  SeoMetadata,
  ContentSearchResult,
  ContentFilters,
  ServiceResult,
  PaginatedResult,
} from '../types';

// In-memory storage (replace with database/CMS in production)
const articles: Map<string, Article> = new Map();
const articlesBySlug: Map<string, string> = new Map();
const categories: Map<string, Category> = new Map();
const tags: Map<string, Tag> = new Map();
const authors: Map<string, Author> = new Map();
const featuredArticleIds: string[] = [];

// Initialize default content
initializeDefaultContent();

/**
 * Content Service
 */
export class ContentService {
  /**
   * Get articles with optional filtering
   */
  async getArticles(
    options?: {
      category?: string;
      tag?: string;
      author?: string;
      status?: ContentStatus;
      limit?: number;
      page?: number;
      pageSize?: number;
    }
  ): Promise<ServiceResult<PaginatedResult<ArticlePreview>>> {
    try {
      let articleList: Article[] = [];

      for (const article of articles.values()) {
        // Only show published articles to public
        if (!options?.status && article.status !== 'published') {
          continue;
        }

        if (options?.status && article.status !== options.status) {
          continue;
        }

        articleList.push(article);
      }

      // Apply filters
      if (options?.category) {
        articleList = articleList.filter(
          a => a.category.slug === options.category || a.category.id === options.category
        );
      }

      if (options?.tag) {
        articleList = articleList.filter(
          a => a.tags.some(t => t.slug === options.tag || t.id === options.tag)
        );
      }

      if (options?.author) {
        articleList = articleList.filter(
          a => a.author.id === options.author
        );
      }

      // Sort by published date (most recent first)
      articleList.sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
      });

      // Apply limit if specified
      if (options?.limit && !options?.page) {
        articleList = articleList.slice(0, options.limit);
      }

      // Pagination
      const page = options?.page || 1;
      const pageSize = options?.pageSize || options?.limit || 10;
      const totalCount = articleList.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      const paginatedArticles = articleList.slice(start, end);

      // Convert to previews
      const previews = paginatedArticles.map(a => this.toArticlePreview(a));

      return {
        success: true,
        data: {
          items: previews,
          totalCount,
          page,
          pageSize,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener los artículos',
          details: { error: String(error) },
        },
      };
    }
  }

  /**
   * Get article by slug
   */
  async getArticle(slug: string): Promise<ServiceResult<Article>> {
    try {
      const articleId = articlesBySlug.get(slug);

      if (!articleId) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Artículo no encontrado',
          },
        };
      }

      const article = articles.get(articleId);

      if (!article) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Artículo no encontrado',
          },
        };
      }

      // Increment view count
      article.viewCount++;
      articles.set(articleId, article);

      // Get related articles
      const related = await this.getRelatedArticles(article, 3);
      article.relatedArticles = related;

      return {
        success: true,
        data: article,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener el artículo',
        },
      };
    }
  }

  /**
   * Get article by ID
   */
  async getArticleById(articleId: string): Promise<ServiceResult<Article>> {
    try {
      const article = articles.get(articleId);

      if (!article) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Artículo no encontrado',
          },
        };
      }

      return {
        success: true,
        data: article,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener el artículo',
        },
      };
    }
  }

  /**
   * Get featured content
   */
  async getFeaturedContent(): Promise<ServiceResult<ArticlePreview[]>> {
    try {
      const featured: ArticlePreview[] = [];

      for (const articleId of featuredArticleIds) {
        const article = articles.get(articleId);
        if (article && article.status === 'published') {
          featured.push(this.toArticlePreview(article));
        }
      }

      return {
        success: true,
        data: featured,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener contenido destacado',
        },
      };
    }
  }

  /**
   * Search content
   */
  async searchContent(
    query: string,
    options?: {
      filters?: ContentFilters;
      page?: number;
      pageSize?: number;
    }
  ): Promise<ServiceResult<ContentSearchResult>> {
    try {
      if (!query || query.trim().length < 2) {
        return {
          success: false,
          error: {
            code: 'INVALID_QUERY',
            message: 'La búsqueda debe tener al menos 2 caracteres',
          },
        };
      }

      const searchTerms = query.toLowerCase().split(/\s+/);
      let results: Article[] = [];

      for (const article of articles.values()) {
        if (article.status !== 'published') continue;

        // Search in title, excerpt, content, and tags
        const searchableText = [
          article.title,
          article.excerpt,
          article.content,
          ...article.tags.map(t => t.name),
        ].join(' ').toLowerCase();

        const matches = searchTerms.every(term => searchableText.includes(term));

        if (matches) {
          results.push(article);
        }
      }

      // Apply filters
      if (options?.filters) {
        const filters = options.filters;

        if (filters.category) {
          results = results.filter(
            a => a.category.slug === filters.category
          );
        }

        if (filters.tags && filters.tags.length > 0) {
          results = results.filter(a =>
            filters.tags!.some(tag =>
              a.tags.some(t => t.slug === tag)
            )
          );
        }

        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          results = results.filter(a =>
            a.publishedAt && new Date(a.publishedAt) >= fromDate
          );
        }

        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          results = results.filter(a =>
            a.publishedAt && new Date(a.publishedAt) <= toDate
          );
        }

        if (filters.author) {
          results = results.filter(a => a.author.id === filters.author);
        }
      }

      // Sort by relevance (simple scoring based on title matches)
      results.sort((a, b) => {
        const aScore = searchTerms.filter(term =>
          a.title.toLowerCase().includes(term)
        ).length;
        const bScore = searchTerms.filter(term =>
          b.title.toLowerCase().includes(term)
        ).length;
        return bScore - aScore;
      });

      // Pagination
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 10;
      const totalCount = results.length;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      const paginatedResults = results.slice(start, end);
      const previews = paginatedResults.map(a => this.toArticlePreview(a));

      return {
        success: true,
        data: {
          articles: previews,
          totalCount,
          page,
          pageSize,
          hasMore: end < totalCount,
          query,
          filters: options?.filters,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: 'Error al buscar contenido',
        },
      };
    }
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<ServiceResult<Category[]>> {
    try {
      const categoryList = [...categories.values()];

      // Sort by order
      categoryList.sort((a, b) => a.order - b.order);

      // Update article counts
      for (const category of categoryList) {
        category.articleCount = this.countArticlesByCategory(category.id);
      }

      return {
        success: true,
        data: categoryList,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener las categorías',
        },
      };
    }
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<ServiceResult<Category>> {
    try {
      let targetCategory: Category | undefined;

      for (const category of categories.values()) {
        if (category.slug === slug) {
          targetCategory = category;
          break;
        }
      }

      if (!targetCategory) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Categoría no encontrada',
          },
        };
      }

      targetCategory.articleCount = this.countArticlesByCategory(targetCategory.id);

      return {
        success: true,
        data: targetCategory,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener la categoría',
        },
      };
    }
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<ServiceResult<Tag[]>> {
    try {
      const tagList = [...tags.values()];

      // Update article counts and sort by popularity
      for (const tag of tagList) {
        tag.articleCount = this.countArticlesByTag(tag.id);
      }

      tagList.sort((a, b) => b.articleCount - a.articleCount);

      return {
        success: true,
        data: tagList,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener las etiquetas',
        },
      };
    }
  }

  /**
   * Get popular articles
   */
  async getPopularArticles(limit: number = 5): Promise<ServiceResult<ArticlePreview[]>> {
    try {
      const articleList: Article[] = [];

      for (const article of articles.values()) {
        if (article.status === 'published') {
          articleList.push(article);
        }
      }

      // Sort by view count
      articleList.sort((a, b) => b.viewCount - a.viewCount);

      const topArticles = articleList.slice(0, limit);
      const previews = topArticles.map(a => this.toArticlePreview(a));

      return {
        success: true,
        data: previews,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener artículos populares',
        },
      };
    }
  }

  /**
   * Get recent articles
   */
  async getRecentArticles(limit: number = 5): Promise<ServiceResult<ArticlePreview[]>> {
    try {
      const result = await this.getArticles({ limit, status: 'published' });

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        data: result.data!.items,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener artículos recientes',
        },
      };
    }
  }

  /**
   * Record article interaction (like, share)
   */
  async recordInteraction(
    articleId: string,
    interactionType: 'like' | 'share'
  ): Promise<ServiceResult<void>> {
    try {
      const article = articles.get(articleId);

      if (!article) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Artículo no encontrado',
          },
        };
      }

      if (interactionType === 'like') {
        article.likeCount++;
      } else if (interactionType === 'share') {
        article.shareCount++;
      }

      articles.set(articleId, article);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INTERACTION_ERROR',
          message: 'Error al registrar la interacción',
        },
      };
    }
  }

  /**
   * Get articles by author
   */
  async getArticlesByAuthor(
    authorId: string,
    options?: {
      page?: number;
      pageSize?: number;
    }
  ): Promise<ServiceResult<PaginatedResult<ArticlePreview>>> {
    return this.getArticles({
      author: authorId,
      status: 'published',
      ...options,
    });
  }

  /**
   * Get author info
   */
  async getAuthor(authorId: string): Promise<ServiceResult<Author>> {
    try {
      const author = authors.get(authorId);

      if (!author) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Autor no encontrado',
          },
        };
      }

      return {
        success: true,
        data: author,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener el autor',
        },
      };
    }
  }

  // ============================================================================
  // ADMIN METHODS (for content management)
  // ============================================================================

  /**
   * Create new article
   */
  async createArticle(articleData: Partial<Article>): Promise<ServiceResult<Article>> {
    try {
      const articleId = uuidv4();
      const now = new Date();

      const article: Article = {
        id: articleId,
        slug: articleData.slug || this.generateSlug(articleData.title || ''),
        title: articleData.title || '',
        excerpt: articleData.excerpt || '',
        content: articleData.content || '',
        contentHtml: articleData.contentHtml || '',
        author: articleData.author!,
        category: articleData.category!,
        tags: articleData.tags || [],
        featuredImage: articleData.featuredImage,
        gallery: articleData.gallery,
        status: articleData.status || 'draft',
        publishedAt: articleData.status === 'published' ? now : undefined,
        updatedAt: now,
        createdAt: now,
        seo: articleData.seo || {},
        readingTime: this.calculateReadingTime(articleData.content || ''),
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
      };

      articles.set(articleId, article);
      articlesBySlug.set(article.slug, articleId);

      return {
        success: true,
        data: article,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'Error al crear el artículo',
        },
      };
    }
  }

  /**
   * Update article
   */
  async updateArticle(
    articleId: string,
    updates: Partial<Article>
  ): Promise<ServiceResult<Article>> {
    try {
      const article = articles.get(articleId);

      if (!article) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Artículo no encontrado',
          },
        };
      }

      const updatedArticle: Article = {
        ...article,
        ...updates,
        id: article.id,
        createdAt: article.createdAt,
        updatedAt: new Date(),
      };

      // Update slug mapping if changed
      if (updates.slug && updates.slug !== article.slug) {
        articlesBySlug.delete(article.slug);
        articlesBySlug.set(updates.slug, articleId);
      }

      // Update reading time if content changed
      if (updates.content) {
        updatedArticle.readingTime = this.calculateReadingTime(updates.content);
      }

      // Set published date if publishing
      if (updates.status === 'published' && article.status !== 'published') {
        updatedArticle.publishedAt = new Date();
      }

      articles.set(articleId, updatedArticle);

      return {
        success: true,
        data: updatedArticle,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Error al actualizar el artículo',
        },
      };
    }
  }

  /**
   * Delete article
   */
  async deleteArticle(articleId: string): Promise<ServiceResult<void>> {
    try {
      const article = articles.get(articleId);

      if (article) {
        articlesBySlug.delete(article.slug);
        articles.delete(articleId);

        // Remove from featured if present
        const featuredIndex = featuredArticleIds.indexOf(articleId);
        if (featuredIndex > -1) {
          featuredArticleIds.splice(featuredIndex, 1);
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'Error al eliminar el artículo',
        },
      };
    }
  }

  /**
   * Set featured articles
   */
  async setFeaturedArticles(articleIds: string[]): Promise<ServiceResult<void>> {
    try {
      featuredArticleIds.length = 0;
      featuredArticleIds.push(...articleIds);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Error al actualizar contenido destacado',
        },
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private toArticlePreview(article: Article): ArticlePreview {
    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      featuredImage: article.featuredImage,
      category: article.category,
      publishedAt: article.publishedAt,
      readingTime: article.readingTime,
    };
  }

  private async getRelatedArticles(
    article: Article,
    limit: number
  ): Promise<ArticlePreview[]> {
    const related: Article[] = [];
    const tagIds = new Set(article.tags.map(t => t.id));

    for (const a of articles.values()) {
      if (a.id === article.id) continue;
      if (a.status !== 'published') continue;

      // Same category or shared tags
      const sameCategory = a.category.id === article.category.id;
      const sharedTags = a.tags.some(t => tagIds.has(t.id));

      if (sameCategory || sharedTags) {
        related.push(a);
      }
    }

    // Sort by relevance (shared tags count)
    related.sort((a, b) => {
      const aShared = a.tags.filter(t => tagIds.has(t.id)).length;
      const bShared = b.tags.filter(t => tagIds.has(t.id)).length;
      return bShared - aShared;
    });

    return related.slice(0, limit).map(a => this.toArticlePreview(a));
  }

  private countArticlesByCategory(categoryId: string): number {
    let count = 0;
    for (const article of articles.values()) {
      if (article.category.id === categoryId && article.status === 'published') {
        count++;
      }
    }
    return count;
  }

  private countArticlesByTag(tagId: string): number {
    let count = 0;
    for (const article of articles.values()) {
      if (article.tags.some(t => t.id === tagId) && article.status === 'published') {
        count++;
      }
    }
    return count;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }
}

// ============================================================================
// INITIALIZATION FUNCTION
// ============================================================================

function initializeDefaultContent(): void {
  // Create default authors
  const author1: Author = {
    id: uuidv4(),
    name: 'Equipo Soriano Seguros',
    bio: 'El equipo de expertos en seguros de Soriano Mediadores.',
    avatarUrl: '/avatars/team.png',
    role: 'Redacción',
  };
  authors.set(author1.id, author1);

  // Create default categories
  const categoriesData: Partial<Category>[] = [
    { slug: 'seguros-auto', name: 'Seguros de Auto', description: 'Todo sobre seguros de vehículos', order: 1 },
    { slug: 'seguros-hogar', name: 'Seguros de Hogar', description: 'Protección para tu vivienda', order: 2 },
    { slug: 'seguros-vida', name: 'Seguros de Vida', description: 'Seguridad para tu familia', order: 3 },
    { slug: 'seguros-salud', name: 'Seguros de Salud', description: 'Cuidado de tu bienestar', order: 4 },
    { slug: 'consejos', name: 'Consejos', description: 'Tips y recomendaciones', order: 5 },
    { slug: 'noticias', name: 'Noticias', description: 'Actualidad del sector', order: 6 },
  ];

  for (const catData of categoriesData) {
    const category: Category = {
      id: uuidv4(),
      slug: catData.slug!,
      name: catData.name!,
      description: catData.description,
      articleCount: 0,
      order: catData.order!,
    };
    categories.set(category.id, category);
  }

  // Create default tags
  const tagsData = [
    'ahorro', 'consejos', 'familia', 'hogar', 'vehiculo',
    'salud', 'viajes', 'empresas', 'autonomos', 'legal',
  ];

  for (const tagName of tagsData) {
    const tag: Tag = {
      id: uuidv4(),
      slug: tagName,
      name: tagName.charAt(0).toUpperCase() + tagName.slice(1),
      articleCount: 0,
    };
    tags.set(tag.id, tag);
  }

  // Create sample articles
  const consejosCategory = [...categories.values()].find(c => c.slug === 'consejos')!;
  const ahorroTag = [...tags.values()].find(t => t.slug === 'ahorro')!;

  const sampleArticle: Article = {
    id: uuidv4(),
    slug: 'como-ahorrar-en-tu-seguro-de-coche',
    title: 'Cómo ahorrar en tu seguro de coche sin perder coberturas',
    excerpt: 'Descubre las mejores estrategias para reducir el coste de tu seguro de auto manteniendo todas las protecciones necesarias.',
    content: 'El seguro de coche es uno de los gastos fijos que todos los conductores deben afrontar...',
    contentHtml: '<p>El seguro de coche es uno de los gastos fijos que todos los conductores deben afrontar...</p>',
    author: author1,
    category: consejosCategory,
    tags: [ahorroTag],
    status: 'published',
    publishedAt: new Date(),
    updatedAt: new Date(),
    createdAt: new Date(),
    seo: {
      title: 'Cómo ahorrar en tu seguro de coche | Soriano Seguros',
      description: 'Consejos prácticos para reducir el coste de tu seguro de auto.',
    },
    readingTime: 5,
    viewCount: 150,
    likeCount: 25,
    shareCount: 10,
  };

  articles.set(sampleArticle.id, sampleArticle);
  articlesBySlug.set(sampleArticle.slug, sampleArticle.id);
  featuredArticleIds.push(sampleArticle.id);
}

// Export singleton instance
export const contentService = new ContentService();
