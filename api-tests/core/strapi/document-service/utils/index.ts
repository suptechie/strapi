import { Attribute, Entity } from '@strapi/strapi';

export const AUTHOR_UID = 'api::author.author';
export type Author = Attribute.GetAll<typeof AUTHOR_UID> & { documentId: string; id: number };

export const ARTICLE_UID = 'api::article.article';
export type Article = Attribute.GetAll<typeof ARTICLE_UID> & { documentId: string; id: number };

export const CATEGORY_UID = 'api::category.category';
export type Category = Attribute.GetValues<
  typeof CATEGORY_UID,
  Attribute.GetNonPopulatableKeys<typeof CATEGORY_UID>
> & {
  documentId?: string;
  id?: Entity.ID;
};

export const findArticleDb = async (where: any) => {
  return strapi.query(ARTICLE_UID).findOne({ where }) as Article | undefined;
};

export const findArticlesDb = async (where: any) => {
  return strapi.query(ARTICLE_UID).findMany({ where }) as Article[];
};

export const findPublishedArticlesDb = async (documentId) => {
  return findArticlesDb({ documentId, publishedAt: { $notNull: true } });
};

export const findAuthorDb = async (where: any) => {
  return strapi.query(AUTHOR_UID).findOne({ where }) as Author | undefined;
};

export const findAuthorsDb = async (where: any) => {
  return strapi.query(AUTHOR_UID).findMany({ where }) as Author[];
};

export const findPublishedAuthorsDb = async (documentId) => {
  return findAuthorsDb({ documentId, publishedAt: { $notNull: true } });
};
